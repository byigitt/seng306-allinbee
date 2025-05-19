import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  staffProcedure,
} from "@/server/api/trpc";
import type { Prisma } from "@prisma/client"; // Changed to type-only import

// Zod schema for positive numbers (can be used for Decimals if input is number-like)
const positiveNumberSchema = z.preprocess(
  (val) => Number.parseFloat(String(val)),
  z.number().positive()
);

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
      return ctx.db.dish.create({
        data: input,
      });
    }),

  listDishes: protectedProcedure
    .input(
      z.object({
        filter: z.string().optional(),
        take: z.number().int().optional(),
        skip: z.number().int().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.dish.findMany({
        where: {
          dishName: {
            contains: input.filter,
            mode: "insensitive",
          },
        },
        take: input.take,
        skip: input.skip,
        orderBy: { dishName: "asc" },
      });
    }),

  getDish: protectedProcedure
    .input(z.object({ dishId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.dish.findUniqueOrThrow({
        where: { dishId: input.dishId },
      });
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
      return ctx.db.dish.update({
        where: { dishId },
        data,
      });
    }),

  deleteDish: staffProcedure
    .input(z.object({ dishId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Consider checking if dish is part of any menu first
      return ctx.db.dish.delete({
        where: { dishId: input.dishId },
      });
    }),

  // --- Menu Management ---
  createMenu: staffProcedure
    .input(
      z.object({
        menuName: z.string().min(1),
        price: positiveNumberSchema,
        dishIds: z.array(z.string().uuid()).min(1), // Ensure dishIds are UUIDs and at least one
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
        take: z.number().int().optional(),
        skip: z.number().int().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.menu.findMany({
        where: {
          menuName: {
            contains: input.filterByName,
            mode: "insensitive",
          },
        },
        include: {
          menuDishes: {
            include: { dish: true },
            orderBy: { dish: { dishName: "asc" } },
          },
          managedByStaff: {
            include: {
              user: {
                select: { id: true, name: true, fName: true, lName: true },
              },
            },
          },
          sale: true,
        },
        take: input.take,
        skip: input.skip,
        orderBy: { menuName: "asc" },
      });
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
          sale: true,
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
      const dataToUpdate: Prisma.MenuUpdateInput = {};
      if (menuName) dataToUpdate.menuName = menuName;
      if (price) dataToUpdate.price = price;

      if (dishIds) {
        await ctx.db.menuDish.deleteMany({ where: { menuId } });
        dataToUpdate.menuDishes = {
          create: dishIds.map((dishId) => ({
            dish: { connect: { dishId } },
          })),
        };
      }

      return ctx.db.menu.update({
        where: { menuId },
        data: dataToUpdate,
        include: { menuDishes: { include: { dish: true } } },
      });
    }),

  deleteMenu: staffProcedure
    .input(z.object({ menuId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // MenuDish entries should be deleted by cascade if schema is set up for it.
      // Sales might also need consideration or be cascaded.
      return ctx.db.menu.delete({
        where: { menuId: input.menuId },
      });
    }),

  // --- DigitalCard Management ---
  getMyDigitalCard: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.session.user.id;
    const digitalCard = await ctx.db.digitalCard.findUnique({
      where: { userId: studentId },
      include: {
        depositTransactions: { orderBy: { transactionDate: "desc" } },
        qrCodes: { orderBy: { createDate: "desc" }, take: 10 },
      },
    });
    if (!digitalCard) {
      // For a hackathon, we might throw or return null.
      // In a real app, this state (student exists but no card) should be handled gracefully.
      throw new Error(
        "Digital card not found for this user. Card must be created first."
      );
    }
    return digitalCard;
  }),

  recordDeposit: protectedProcedure
    .input(z.object({ amount: positiveNumberSchema }))
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.session.user.id;
      const digitalCardExists = await ctx.db.digitalCard.findUnique({
        where: { userId: studentId },
      });

      if (!digitalCardExists) {
        throw new Error("Digital card not found.");
      }

      return ctx.db.$transaction(async (prisma) => {
        const updatedCard = await prisma.digitalCard.update({
          where: { userId: studentId },
          data: { balance: { increment: input.amount } },
        });
        const transaction = await prisma.depositTransaction.create({
          data: {
            userId: studentId,
            amount: input.amount,
          },
        });
        return { updatedCard, transaction };
      });
    }),

  getMyTransactions: protectedProcedure.query(async ({ ctx }) => {
    // This currently only fetches deposit transactions.
    // Purchase transactions would likely be inferred from QR code usage / Sales.
    return ctx.db.depositTransaction.findMany({
      where: { userId: ctx.session.user.id }, // userId on DepositTransaction links to DigitalCard's userId
      orderBy: { transactionDate: "desc" },
    });
  }),

  // --- QRCode Management ---
  generatePaymentQRCode: protectedProcedure
    .input(z.object({ menuId: z.string().uuid().optional() }))
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.session.user.id;
      const digitalCard = await ctx.db.digitalCard.findUniqueOrThrow({
        where: { userId: studentId },
        select: { cardNo: true }, // Assuming cardNo exists on DigitalCard model as per schema
      });

      return ctx.db.qRCode.create({
        data: {
          userId: studentId,
          menuId: input.menuId,
          cardNo: digitalCard.cardNo, // This should align with QRCode.cardNo String?
          expiredDate: new Date(Date.now() + 5 * 60 * 1000),
          // paysForDate: null, // Implicitly null on creation
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

        if (qrCode.expiredDate < new Date()) {
          throw new Error("QR Code has expired.");
        }
        if (qrCode.paysForDate) {
          // This field should exist on QRCode model
          throw new Error("QR Code has already been used.");
        }
        if (!qrCode.digitalCard) {
          throw new Error("QR Code is not linked to a valid digital card.");
        }

        const menu = await prisma.menu.findUniqueOrThrow({
          where: { menuId: input.menuId },
        });

        if (qrCode.digitalCard.balance < menu.price) {
          throw new Error("Insufficient balance.");
        }

        const updatedDigitalCard = await prisma.digitalCard.update({
          where: { userId: qrCode.userId },
          data: { balance: { decrement: menu.price } },
        });

        const updatedQRCode = await prisma.qRCode.update({
          where: { qrId: input.qrId },
          data: {
            menuId: input.menuId,
            paysForDate: new Date(), // This field should exist on QRCode model
          },
        });

        const sale = await prisma.sale.upsert({
          where: { menuId: input.menuId },
          create: {
            menuId: input.menuId,
            numSold: 1,
          },
          update: {
            numSold: { increment: 1 },
          },
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
        take: z.number().int().optional(),
        skip: z.number().int().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: Prisma.SaleWhereInput = {
        menuId: input.menuId,
      };

      return ctx.db.sale.findMany({
        where: whereClause,
        include: {
          menu: {
            select: { menuId: true, menuName: true, price: true },
          },
        },
        take: input.take,
        skip: input.skip,
        orderBy: { menu: { menuName: "asc" } }, // Example: order by menu name via relation
      });
    }),
});
