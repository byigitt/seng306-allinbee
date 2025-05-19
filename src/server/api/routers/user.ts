import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

// Helper to determine user role based on included relations
const determineUserRole = (
  user: Prisma.UserGetPayload<{
    include: { student: true; admin: true; staff: true };
  }>
) => {
  if (user.admin) return "admin";
  if (user.staff) return "staff";
  if (user.student) return "student";
  return "user"; // Or throw error if a more specific role is always expected
};

export const userRouter = createTRPCRouter({
  // Get current user's profile (merged User, Student/Admin/Staff data)
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      include: {
        student: true,
        admin: true,
        staff: true,
        // Potentially include other relations like accounts for more complete profile
      },
    });
    return {
      ...user,
      role: determineUserRole(user),
    };
  }),

  // Update authenticated user's profile
  updateMe: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(), // NextAuth name field
        fName: z.string().min(1).optional(),
        mInit: z.string().max(1).optional(),
        lName: z.string().min(1).optional(),
        phoneNumber: z.string().optional(),
        // Password updates should be handled via a separate, dedicated procedure with current password verification
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: input,
      });
    }),

  // Admin: List all users
  adminListUsers: adminProcedure
    .input(
      z.object({
        filterByEmail: z.string().email().optional(),
        filterByName: z.string().optional(),
        take: z.number().int().optional(),
        skip: z.number().int().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.UserWhereInput = {
        AND: [
          input.filterByEmail
            ? { email: { contains: input.filterByEmail, mode: "insensitive" } }
            : {},
          input.filterByName
            ? {
                OR: [
                  {
                    name: { contains: input.filterByName, mode: "insensitive" },
                  },
                  {
                    fName: {
                      contains: input.filterByName,
                      mode: "insensitive",
                    },
                  },
                  {
                    lName: {
                      contains: input.filterByName,
                      mode: "insensitive",
                    },
                  },
                ],
              }
            : {},
        ],
      };

      const users = await ctx.db.user.findMany({
        where,
        include: { student: true, admin: true, staff: true },
        take: input.take,
        skip: input.skip,
        orderBy: { email: "asc" },
      });

      const totalUsers = await ctx.db.user.count({ where });

      return {
        users: users.map((user) => ({
          ...user,
          role: determineUserRole(user),
        })),
        totalCount: totalUsers,
      };
    }),

  // Admin: Get specific user details
  adminGetUser: adminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: { id: input.userId },
        include: { student: true, admin: true, staff: true },
      });
      return {
        ...user,
        role: determineUserRole(user),
      };
    }),

  // Admin: Update user (e.g., assign roles, update details)
  adminUpdateUser: adminProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        fName: z.string().optional(),
        mInit: z.string().max(1).nullable().optional(),
        lName: z.string().optional(),
        phoneNumber: z.string().nullable().optional(),
        // Role management flags (example, actual implementation depends on how you want to manage roles)
        // isStudent: z.boolean().optional(),
        // isAdmin: z.boolean().optional(),
        // isStaff: z.boolean().optional(),
        // managingAdminIdForStudent: z.string().cuid().optional(), // If student, who manages them
        // managingAdminIdForStaff: z.string().cuid().optional(), // If staff, who manages them
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, ...dataToUpdate } = input;
      // const { userId, isStudent, isAdmin, isStaff, managingAdminIdForStudent, managingAdminIdForStaff ...userData } = input;
      // Basic user data update
      const updatedUser = await ctx.db.user.update({
        where: { id: userId },
        data: {
          name: dataToUpdate.name,
          email: dataToUpdate.email,
          fName: dataToUpdate.fName,
          mInit: dataToUpdate.mInit,
          lName: dataToUpdate.lName,
          phoneNumber: dataToUpdate.phoneNumber,
        },
      });

      // Placeholder for role management logic:
      // This is where you'd handle creating/deleting/updating Student, Admin, Staff records
      // based on isStudent, isAdmin, isStaff flags and their associated foreign keys.
      // Example for making someone a student (simplified, needs error handling & idempotency):
      // if (isStudent === true) {
      //   await ctx.db.student.upsert({
      //     where: { userId: userId },
      //     create: { userId: userId, managingAdminId: managingAdminIdForStudent },
      //     update: { managingAdminId: managingAdminIdForStudent }
      //   });
      // } else if (isStudent === false) {
      //   await ctx.db.student.delete({ where: { userId: userId } }).catch(() => {}); // Ignore if not found
      // }
      // Similar logic for Admin and Staff roles.

      // Re-fetch user with relations to return the updated role correctly
      const userWithRelations = await ctx.db.user.findUniqueOrThrow({
        where: { id: userId },
        include: { student: true, admin: true, staff: true },
      });

      return {
        ...userWithRelations,
        role: determineUserRole(userWithRelations),
      };
    }),

  // Admin: Delete user
  adminDeleteUser: adminProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Consider implications: deleting a user will cascade delete related Student, Admin, Staff
      // and other relations like Accounts, Sessions due to onDelete: Cascade in schema.
      // Also, UserFavoriteRoutes, etc. Ensure this is the desired behavior.
      // For a soft delete, you'd add an `isActive` or `deletedAt` field to the User model.
      return ctx.db.user.delete({
        where: { id: input.userId },
      });
    }),
});
