import { z } from "zod";
import { randomUUID } from "crypto";
import {
  createTRPCRouter,
  protectedProcedure,
  staffProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import type { Prisma } from "@prisma/client";

// Zod schema for positive numbers (can be used for Decimals if input is number-like)
const positiveNumberSchema = z.preprocess(
  (val) => Number.parseFloat(String(val)),
  z.number().positive()
);

// Helper to get today's date as YYYY-MM-DD string for composite key in Sale
const getSaleDateKey = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const cafeteriaRouter = createTRPCRouter({
  // --- Dish Management ---
  createDish: staffProcedure
    .input(
      z.object({
        dishName: z.string().min(1),
        calories: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.dish.create({ data: input });
    }),

  listDishes: protectedProcedure
    .input(
      z.object({
        filter: z.string().optional(),
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const dishes = await ctx.db.dish.findMany({
        where: { dishName: { contains: input.filter, mode: "insensitive" } },
        take: input.take,
        skip: input.skip,
        orderBy: { dishName: "asc" },
      });
      const totalCount = await ctx.db.dish.count({
        where: { dishName: { contains: input.filter, mode: "insensitive" } },
      });
      return { dishes, totalCount };
    }),

  getDish: protectedProcedure
    .input(z.object({ dishId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.dish.findUniqueOrThrow({ where: { dishId: input.dishId } });
    }),

  updateDish: staffProcedure
    .input(
      z.object({
        dishId: z.string().uuid(),
        dishName: z.string().min(1).optional(),
        calories: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { dishId, ...data } = input;
      return ctx.db.dish.update({ where: { dishId }, data });
    }),

  deleteDish: staffProcedure
    .input(z.object({ dishId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const isPartOfMenu = await ctx.db.menuDish.count({
        where: { dishId: input.dishId },
      });
      if (isPartOfMenu > 0) {
        throw new Error("Cannot delete dish. It is part of one or more menus.");
      }
      return ctx.db.dish.delete({ where: { dishId: input.dishId } });
    }),

  // --- Menu Management ---
  createMenu: staffProcedure
    .input(
      z.object({
        menuName: z.string().min(1),
        price: positiveNumberSchema,
        dishIds: z.array(z.string().uuid()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { dishIds, menuName, price } = input;
      return ctx.db.menu.create({
        data: {
          managedByStaffId: ctx.session.user.id,
          menuName: menuName,
          price: price,
          menuDishes: {
            create: dishIds.map((dishId) => ({
              dish: { connect: { dishId } },
            })),
          },
        },
        include: { menuDishes: { include: { dish: true } } },
      });
    }),

  listMenus: protectedProcedure
    .input(
      z.object({
        filterByName: z.string().optional(),
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const menus = await ctx.db.menu.findMany({
        where: {
          menuName: { contains: input.filterByName, mode: "insensitive" },
        },
        include: {
          menuDishes: {
            include: { dish: true },
            orderBy: { dish: { dishName: "asc" } },
          },
          managedByStaff: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  fName: true,
                  lName: true,
                },
              },
            },
          },
          sales: { orderBy: { saleDate: "desc" } },
        },
        take: input.take,
        skip: input.skip,
        orderBy: { menuName: "asc" },
      });
      const totalCount = await ctx.db.menu.count({
        where: {
          menuName: { contains: input.filterByName, mode: "insensitive" },
        },
      });
      return { menus, totalCount };
    }),

  getMenu: protectedProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.menu.findUniqueOrThrow({
        where: { menuId: input.menuId },
        include: {
          menuDishes: {
            include: { dish: true },
            orderBy: { dish: { dishName: "asc" } },
          },
          managedByStaff: {
            include: {
              user: {
                select: { name: true, id: true, fName: true, lName: true },
              },
            },
          },
          sales: { orderBy: { saleDate: "desc" } },
        },
      });
    }),

  updateMenu: staffProcedure
    .input(
      z.object({
        menuId: z.string().uuid(),
        menuName: z.string().min(1).optional(),
        price: positiveNumberSchema.optional(),
        dishIds: z.array(z.string().uuid()).min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { menuId, dishIds, menuName, price } = input;
      return ctx.db.$transaction(async (prisma) => {
        const dataToUpdate: Prisma.MenuUpdateInput = {};
        if (menuName) dataToUpdate.menuName = menuName;
        if (price) dataToUpdate.price = price;

        if (dishIds) {
          await prisma.menuDish.deleteMany({ where: { menuId } });
          dataToUpdate.menuDishes = {
            create: dishIds.map((dishId) => ({
              dish: { connect: { dishId } },
            })),
          };
        }
        return prisma.menu.update({
          where: { menuId },
          data: dataToUpdate,
          include: { menuDishes: { include: { dish: true } } },
        });
      });
    }),

  deleteMenu: staffProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.menu.delete({ where: { menuId: input.menuId } });
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
        AND: [],
      };
      if (input.dateFrom) {
        (whereClause.AND as Prisma.SaleWhereInput[]).push({
          saleDate: { gte: new Date(input.dateFrom) },
        });
      }
      if (input.dateTo) {
        (whereClause.AND as Prisma.SaleWhereInput[]).push({
          saleDate: { lte: new Date(input.dateTo) },
        });
      }
      if (!(whereClause.AND as Prisma.SaleWhereInput[]).length) {
        delete whereClause.AND;
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
