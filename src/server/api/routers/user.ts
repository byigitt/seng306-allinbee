import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
} from "@/server/api/trpc";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import cuid from "cuid";

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
  // Register new user
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8), // Enforce a minimum password length
        name: z.string().optional(), // Optional: if you want to allow a display name separate from fName/lName
        fName: z.string().min(1),
        lName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email, password, name, fName, lName } = input;

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists.");
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the user
      const newUserId = cuid();

      const user = await ctx.db.user.create({
        data: {
          id: newUserId,
          email,
          password: hashedPassword,
          name: name ?? `${fName} ${lName}`,
          fName,
          lName,
          // You might want to set emailVerified to null or a specific date if you implement email verification
        },
      });

      // You could potentially create a student/staff/admin record here too if needed
      // Or link to an account if you are using NextAuth's Account model explicitly for credentials

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }),

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
        // Role management flags
        isStudent: z.boolean().optional(),
        studentManagingAdminId: z.string().cuid().nullable().optional(), // Who manages this student
        isAdmin: z.boolean().optional(),
        isStaff: z.boolean().optional(),
        staffManagingAdminId: z.string().cuid().nullable().optional(), // Who manages this staff member
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        userId,
        isStudent,
        studentManagingAdminId,
        isAdmin,
        isStaff,
        staffManagingAdminId,
        ...userData
      } = input;

      return ctx.db.$transaction(async (prisma) => {
        // Basic user data update
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            name: userData.name,
            email: userData.email,
            fName: userData.fName,
            mInit: userData.mInit,
            lName: userData.lName,
            phoneNumber: userData.phoneNumber,
          },
        });

        // Role management logic
        // Student Role
        if (isStudent === true) {
          await prisma.student.upsert({
            where: { userId: userId },
            create: {
              userId: userId,
              managingAdminId: studentManagingAdminId ?? undefined,
            },
            update: {
              managingAdminId:
                studentManagingAdminId === null
                  ? null
                  : studentManagingAdminId ?? undefined,
            },
          });
        } else if (isStudent === false) {
          await prisma.student
            .delete({ where: { userId: userId } })
            .catch(() => {
              // Ignore if not found, or if cascading deletes handle parts of this.
            });
        }

        // Admin Role
        if (isAdmin === true) {
          await prisma.admin.upsert({
            where: { userId: userId },
            create: { userId: userId },
            update: {}, // No specific fields to update on Admin beyond linking to User
          });
        } else if (isAdmin === false) {
          await prisma.admin.delete({ where: { userId: userId } }).catch(() => {
            // Ignore if not found
          });
        }

        // Staff Role
        if (isStaff === true) {
          await prisma.staff.upsert({
            where: { userId: userId },
            create: {
              userId: userId,
              managingAdminId: staffManagingAdminId ?? undefined,
            },
            update: {
              managingAdminId:
                staffManagingAdminId === null
                  ? null
                  : staffManagingAdminId ?? undefined,
            },
          });
        } else if (isStaff === false) {
          await prisma.staff.delete({ where: { userId: userId } }).catch(() => {
            // Ignore if not found
          });
        }

        // Re-fetch user with relations to return the updated role correctly
        const userWithRelations = await prisma.user.findUniqueOrThrow({
          where: { id: userId },
          include: { student: true, admin: true, staff: true },
        });

        return {
          ...userWithRelations,
          role: determineUserRole(userWithRelations),
        };
      });
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
