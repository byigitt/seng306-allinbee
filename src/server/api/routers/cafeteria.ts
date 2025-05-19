import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  createTRPCRouter,
  protectedProcedure,
  staffProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { Prisma } from "@prisma/client";

// Zod schema for positive numbers (can be used for Decimals if input is number-like)
const positiveNumberSchema = z.preprocess(
  (val) => Number.parseFloat(String(val)),
  z.number().positive()
);

// Zod schema for non-negative numbers, allowing zero
const nonNegativeNumberSchema = z.preprocess(
  (val) => Number.parseFloat(String(val)),
  z.number().min(0)
);

// Helper to get today's date as YYYY-MM-DD string for composite key in Sale
const getSaleDateKey = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const DishWhereInputSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  // calories: z.number().optional(), // Example: Add other filterable fields
});

const MenuDishInputSchema = z.object({
  dishId: z.string().uuid(),
});

const CreateMenuInputSchema = z.object({
  menuName: z.string().min(1, "Menu name is required."),
  date: z.coerce.date({
    errorMap: (issue, { defaultError }) => ({
      message:
        issue.code === "invalid_date"
          ? "Please enter a valid date."
          : defaultError,
    }),
  }),
  price: z.number().min(0.01, "Price must be at least 0.01."),
  dishIds: z
    .array(z.string().uuid())
    .min(1, "Please select at least one dish."),
});

const UpdateMenuInputSchema = z.object({
  menuId: z.string().uuid(),
  menuName: z.string().min(1, "Menu name is required.").optional(),
  date: z.coerce
    .date({
      errorMap: (issue, { defaultError }) => ({
        message:
          issue.code === "invalid_date"
            ? "Please enter a valid date."
            : defaultError,
      }),
    })
    .optional(),
  price: z.number().min(0.01, "Price must be at least 0.01.").optional(),
  dishIds: z
    .array(z.string().uuid())
    .min(1, "Please select at least one dish.")
    .optional(),
});

// Schemas for Dish Management
const CreateDishInputSchema = z.object({
  dishName: z.string().min(1, "Dish name is required."),
  category: z.string().min(1, "Category is required."),
  calories: z.number().int().positive().nullable().optional(),
  price: z.number().min(0.01, "Price must be at least 0.01."),
  available: z.boolean().default(true),
});

const UpdateDishInputSchema = z.object({
  dishId: z.string().uuid(),
  dishName: z.string().min(1, "Dish name is required.").optional(),
  category: z.string().min(1, "Category is required.").optional(),
  calories: z.number().int().positive().nullable().optional(),
  price: z.number().min(0.01, "Price must be at least 0.01.").optional(),
  available: z.boolean().optional(),
});

export const cafeteriaRouter = createTRPCRouter({
  // --- Dish Management ---
  createDish: protectedProcedure
    .input(CreateDishInputSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.dish.create({
        data: {
          dishName: input.dishName,
          category: input.category,
          calories: input.calories,
          price: new Prisma.Decimal(input.price),
          available: input.available,
        },
      });
    }),

  listDishes: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(1000).default(10),
        search: z.string().optional(),
        // filter: DishWhereInputSchema.optional(), // Example for more complex filtering
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const where: Prisma.DishWhereInput = search
        ? {
            OR: [
              { dishName: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const dishes = await ctx.db.dish.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dishName: "asc" },
      });
      const totalDishes = await ctx.db.dish.count({ where });
      return {
        dishes,
        totalPages: Math.ceil(totalDishes / limit),
        currentPage: page,
      };
    }),

  getDish: protectedProcedure
    .input(z.object({ dishId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.dish.findUnique({ where: { dishId: input.dishId } });
    }),

  updateDish: protectedProcedure
    .input(UpdateDishInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { dishId, ...dataToUpdate } = input;

      const updatePayload: Prisma.DishUpdateInput = {};
      if (dataToUpdate.dishName !== undefined)
        updatePayload.dishName = dataToUpdate.dishName;
      if (dataToUpdate.category !== undefined)
        updatePayload.category = dataToUpdate.category;
      if (dataToUpdate.calories !== undefined) {
        updatePayload.calories = dataToUpdate.calories;
      }
      if (dataToUpdate.price !== undefined)
        updatePayload.price = new Prisma.Decimal(dataToUpdate.price);
      if (dataToUpdate.available !== undefined)
        updatePayload.available = dataToUpdate.available;

      return ctx.db.dish.update({
        where: { dishId },
        data: updatePayload,
      });
    }),

  deleteDish: protectedProcedure
    .input(z.object({ dishId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if dish is part of any menu
      const isPartOfMenu = await ctx.db.menuDish.count({
        where: { dishId: input.dishId },
      });
      if (isPartOfMenu > 0) {
        throw new Error(
          "Cannot delete dish. It is part of one or more menus. Please remove it from all menus first."
        );
      }
      return ctx.db.dish.delete({ where: { dishId: input.dishId } });
    }),

  // --- Menu Management ---
  createMenu: protectedProcedure
    .input(CreateMenuInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { menuName, date, price, dishIds } = input;
      const staffUser = await ctx.db.staff.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!staffUser) {
        throw new Error(
          "User is not authorized or not properly configured as staff."
        );
      }

      return ctx.db.menu.create({
        data: {
          menuName,
          date,
          price: new Prisma.Decimal(price),
          managedByStaffId: staffUser.userId, // Link to the staff member
          menuDishes: {
            create: dishIds.map((dishId) => ({
              // Correctly create MenuDish entries
              dish: { connect: { dishId } },
            })),
          },
        },
        include: { menuDishes: { include: { dish: true } } }, // Corrected: menuDishes
      });
    }),

  listMenus: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, dateFrom, dateTo } = input;
      const where: Prisma.MenuWhereInput = {};

      if (search) {
        where.OR = [
          { menuName: { contains: search, mode: "insensitive" } },
          {
            menuDishes: {
              some: {
                dish: { dishName: { contains: search, mode: "insensitive" } },
              },
            },
          },
        ];
      }
      if (dateFrom || dateTo) {
        where.date = {};
        if (dateFrom) where.date.gte = dateFrom;
        if (dateTo) {
          const endOfDayTo = new Date(dateTo);
          endOfDayTo.setHours(23, 59, 59, 999);
          where.date.lte = endOfDayTo;
        }
      }

      const menus = await ctx.db.menu.findMany({
        where,
        include: {
          menuDishes: { include: { dish: true } },
          managedByStaff: {
            include: {
              user: { select: { name: true, fName: true, lName: true } },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: "desc" },
      });
      const totalMenus = await ctx.db.menu.count({
        where,
      });
      return {
        menus,
        totalPages: Math.ceil(totalMenus / limit),
        currentPage: page,
      };
    }),

  getMenu: protectedProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.menu.findUnique({
        where: { menuId: input.menuId },
        include: {
          menuDishes: { include: { dish: true } }, // Corrected: menuDishes
          managedByStaff: {
            include: {
              user: { select: { name: true, fName: true, lName: true } },
            },
          },
        },
      });
    }),

  updateMenu: protectedProcedure
    .input(UpdateMenuInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { menuId, menuName, date, price, dishIds } = input;

      const staffUser = await ctx.db.staff.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!staffUser) {
        throw new Error(
          "User is not authorized or not properly configured as staff."
        );
      }

      const updateData: Prisma.MenuUpdateInput = {};
      if (menuName) updateData.menuName = menuName; // Corrected: menuName
      if (date) updateData.date = date;
      if (price) updateData.price = new Prisma.Decimal(price);

      return ctx.db.$transaction(async (prisma) => {
        if (dishIds) {
          await prisma.menuDish.deleteMany({ where: { menuId: menuId } });
          updateData.menuDishes = {
            // Corrected: menuDishes
            create: dishIds.map((dId) => ({
              dish: { connect: { dishId: dId } },
            })),
          };
        }
        return prisma.menu.update({
          where: { menuId }, // Corrected: where: { menuId: menuId } if menuId is the var name
          data: updateData,
          include: { menuDishes: { include: { dish: true } } }, // Corrected: menuDishes
        });
      });
    }),

  deleteMenu: protectedProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is staff
      const staffUser = await ctx.db.staff.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!staffUser) {
        throw new Error(
          "User is not authorized or not properly configured as staff."
        );
      }

      await ctx.db.menuDish.deleteMany({ where: { menuId: input.menuId } });
      return ctx.db.menu.delete({ where: { menuId: input.menuId } }); // Corrected: menuId
    }),

  // --- DigitalCard Management ---
  createDigitalCard: staffProcedure
    .input(
      z.object({
        studentUserId: z.string().cuid(),
        cardNo: z.string().min(1).max(40),
        initialBalance: positiveNumberSchema.optional().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const staffUserId = ctx.session.user.id;
      const studentUser = await ctx.db.user.findUnique({
        where: { id: input.studentUserId },
        include: { student: true },
      });
      if (!studentUser || !studentUser.student) {
        throw new Error("Student not found or user is not a student.");
      }
      const existingCardNo = await ctx.db.digitalCard.findUnique({
        where: { cardNo: input.cardNo },
      });
      if (existingCardNo) {
        throw new Error(
          `Digital card with number ${input.cardNo} already exists.`
        );
      }
      const existingStudentCard = await ctx.db.digitalCard.findUnique({
        where: { userId: input.studentUserId },
      });
      if (existingStudentCard) {
        throw new Error(
          `Student ${input.studentUserId} already has a digital card (Card No: ${existingStudentCard.cardNo}).`
        );
      }

      return ctx.db.digitalCard.create({
        data: {
          userId: input.studentUserId,
          cardNo: input.cardNo,
          issuedByStaffId: staffUserId,
          balance: input.initialBalance,
          depositMoneyAmount: input.initialBalance,
          cardCreationDate: new Date(),
        },
        include: {
          student: { include: { user: true } },
          issuedByStaff: { include: { user: true } },
        },
      });
    }),

  getMyDigitalCard: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.session.user.id;
    const digitalCard = await ctx.db.digitalCard.findUnique({
      where: { userId: studentId },
      include: {
        qrCodes: { orderBy: { createDate: "desc" }, take: 10 },
        student: { include: { user: { select: { name: true, email: true } } } },
        issuedByStaff: { include: { user: { select: { name: true } } } },
      },
    });
    if (!digitalCard) {
      throw new Error("Digital card not found. Please contact administration.");
    }
    return digitalCard;
  }),

  getDigitalCardByStudentId: adminProcedure
    .input(z.object({ studentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const digitalCard = await ctx.db.digitalCard.findUnique({
        where: { userId: input.studentId },
        include: {
          qrCodes: { orderBy: { createDate: "desc" }, take: 10 },
          student: { include: { user: true } },
          issuedByStaff: { include: { user: true } },
        },
      });
      if (!digitalCard) {
        throw new Error(
          `Digital Card not found for student ID: ${input.studentId}`
        );
      }
      return digitalCard;
    }),

  recordDeposit: protectedProcedure
    .input(z.object({ amount: positiveNumberSchema }))
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.session.user.id;
      const digitalCard = await ctx.db.digitalCard.findUnique({
        where: { userId: studentId },
      });

      if (!digitalCard) {
        throw new Error("Digital card not found to record deposit.");
      }

      const updatedCard = await ctx.db.digitalCard.update({
        where: { userId: studentId },
        data: {
          balance: { increment: input.amount },
          depositMoneyAmount: { increment: input.amount },
        },
      });
      return { updatedCard, message: "Deposit recorded successfully." };
    }),

  // --- QRCode Management ---
  generatePaymentQRCode: protectedProcedure
    .input(z.object({ menuId: z.string().uuid().optional() }))
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.session.user.id;
      let digitalCard = await ctx.db.digitalCard.findUnique({
        where: { userId: studentId },
        select: { cardNo: true },
      });

      if (!digitalCard) {
        // If no digital card exists, create one for the student
        const newCardNo = randomUUID();
        digitalCard = await ctx.db.digitalCard.create({
          data: {
            userId: studentId, // Prisma maps userId to SUserID based on the model relation
            cardNo: newCardNo, // Explicitly provide cardNo
            // balance will default to 0.0 as per Prisma schema
          },
          select: { cardNo: true },
        });
      }

      // At this point, digitalCard is guaranteed to exist and have cardNo
      return ctx.db.qRCode.create({
        data: {
          userId: studentId,
          menuId: input.menuId,
          cardNo: digitalCard.cardNo,
          expiredDate: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
        },
      });
    }),

  processQRCodePayment: staffProcedure
    .input(z.object({ qrId: z.string().uuid(), menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (prisma) => {
        const qrCode = await prisma.qRCode.findUniqueOrThrow({
          where: { qrId: input.qrId },
          include: { digitalCard: true },
        });

        if (qrCode.expiredDate < new Date())
          throw new Error("QR Code has expired.");
        if (qrCode.paysForDate)
          throw new Error("QR Code has already been used.");
        if (!qrCode.digitalCard)
          throw new Error("QR Code is not linked to a valid digital card.");

        const menu = await prisma.menu.findUniqueOrThrow({
          where: { menuId: input.menuId },
        });

        if (qrCode.digitalCard.balance < menu.price)
          throw new Error("Insufficient balance.");

        const updatedDigitalCard = await prisma.digitalCard.update({
          where: { userId: qrCode.userId },
          data: { balance: { decrement: menu.price } },
        });

        const updatedQRCode = await prisma.qRCode.update({
          where: { qrId: input.qrId },
          data: { menuId: input.menuId, paysForDate: new Date() },
        });

        const todayForSale = getSaleDateKey(new Date());

        const sale = await prisma.sale.upsert({
          where: {
            menuId_saleDate: { menuId: input.menuId, saleDate: todayForSale },
          },
          create: {
            menuId: input.menuId,
            saleDate: todayForSale,
            numSold: 1,
          },
          update: { numSold: { increment: 1 } },
          include: { menu: true },
        });

        return {
          paymentStatus: "success",
          updatedBalance: updatedDigitalCard.balance,
          sale,
          qrCode: updatedQRCode,
        };
      });
    }),

  // --- Sales Management ---
  getSalesData: staffProcedure
    .input(
      z.object({
        menuId: z.string().uuid().optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: Prisma.SaleWhereInput = {
        menuId: input.menuId,
      };
      const andConditions: Prisma.SaleWhereInput[] = [];

      if (input.dateFrom) {
        andConditions.push({ saleDate: { gte: new Date(input.dateFrom) } });
      }
      if (input.dateTo) {
        andConditions.push({ saleDate: { lte: new Date(input.dateTo) } });
      }
      if (andConditions.length > 0) {
        whereClause.AND = andConditions;
      }

      const sales = await ctx.db.sale.findMany({
        where: whereClause,
        include: {
          menu: { select: { menuId: true, menuName: true, price: true } },
        },
        take: input.take,
        skip: input.skip,
        orderBy: [{ menu: { menuName: "asc" } }, { saleDate: "desc" }],
      });
      const totalCount = await ctx.db.sale.count({ where: whereClause });
      return { sales, totalCount };
    }),
});
