import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  // publicProcedure, // Assuming not used
  adminProcedure, // Assuming admin might manage all appointments/books
  staffProcedure,
  // Removed AnyRouter import
} from "@/server/api/trpc";
import type { Prisma, Appointment } from "@prisma/client";

// Enum for AppointmentStatus based on Prisma schema
const appointmentStatusSchema = z.enum([
  "Scheduled",
  "Completed",
  "Cancelled",
  "NoShow",
]);
// Enum for AppointmentType as described in PRD
const appointmentTypeSchema = z.enum(["Book", "Sport", "Health"]);

// Helper type for book details in book appointment
const bookAppointmentDetailSchema = z.object({
  isbn: z.string().min(1),
  // borrowQuantity: z.number().int().positive().default(1), // borrowQuantity is on BookAppointmentBorrowsBook
});

export const appointmentsRouter = createTRPCRouter({
  // --- Appointment Management --- (Section 3.5.1 PRD)
  bookAppointment: protectedProcedure // Student role typically
    .input(
      z.object({
        appointmentType: appointmentTypeSchema,
        appointmentDate: z.string().datetime(),
        managedByStaffId: z.string().cuid(), // Staff who will manage/conduct the appointment
        // Service specific details based on appointmentType
        bookDetails: z.array(bookAppointmentDetailSchema).optional(), // For Book appointments (multiple books potentially)
        sportType: z.string().min(1).optional(), // For Sport appointments
        healthType: z.string().min(1).optional(), // For Health appointments
        startTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(), // HH:MM format for Sport/Health
        endTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(), // HH:MM format for Sport/Health
      })
    )
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.session.user.id;

      // Validate input based on appointment type
      if (
        input.appointmentType === "Book" &&
        (!input.bookDetails || input.bookDetails.length === 0)
      ) {
        throw new Error(
          "Book details (ISBN) are required for book appointments."
        );
      }
      if (
        (input.appointmentType === "Sport" ||
          input.appointmentType === "Health") &&
        (!input.startTime || !input.endTime)
      ) {
        throw new Error(
          "Start time and end time are required for sport/health appointments."
        );
      }
      if (input.appointmentType === "Sport" && !input.sportType) {
        throw new Error("Sport type is required for sport appointments.");
      }
      if (input.appointmentType === "Health" && !input.healthType) {
        throw new Error("Health type is required for health appointments.");
      }

      return ctx.db.$transaction(async (prisma) => {
        // 1. Create the main Appointment record
        const appointment = await prisma.appointment.create({
          data: {
            takenByStudentId: studentId,
            managedByStaffId: input.managedByStaffId,
            appointmentDate: new Date(input.appointmentDate),
            appointmentStatus: "Scheduled", // Default status
          },
        });

        // 2. Create the subtype record and handle specific logic
        if (input.appointmentType === "Book" && input.bookDetails) {
          const bookAppointment = await prisma.bookAppointment.create({
            data: {
              appointmentId: appointment.appointmentId,
              borrowDate: new Date(input.appointmentDate), // Or a specific borrowDate if different
              // returnDate is null on creation
            },
          });

          // Link books and update quantities
          for (const detail of input.bookDetails) {
            await prisma.bookAppointmentBorrowsBook.create({
              data: {
                appointmentId: bookAppointment.appointmentId,
                isbn: detail.isbn,
                borrowQuantity: 1, // Assuming 1 copy per ISBN for now
              },
            });
            await prisma.book.update({
              where: { isbn: detail.isbn },
              data: { currentQuantity: { decrement: 1 } }, // Decrement one copy
            });
            // Check if currentQuantity becomes negative (should be handled by db constraints or prior check)
            const bookCheck = await prisma.book.findUnique({
              where: { isbn: detail.isbn },
            });
            if (bookCheck && bookCheck.currentQuantity < 0) {
              throw new Error(`Not enough stock for book ISBN: ${detail.isbn}`);
            }
          }
          return { ...appointment, bookAppointment, type: "Book" };
        }
        if (
          input.appointmentType === "Sport" &&
          input.sportType &&
          input.startTime &&
          input.endTime
        ) {
          const sportAppointment = await prisma.sportAppointment.create({
            data: {
              appointmentId: appointment.appointmentId,
              sportType: input.sportType,
              startTime: new Date(`1970-01-01T${input.startTime}:00Z`), // Store as DateTime, only time part is relevant
              endTime: new Date(`1970-01-01T${input.endTime}:00Z`), // Store as DateTime, only time part is relevant
            },
          });
          return { ...appointment, sportAppointment, type: "Sport" };
        }if (
          input.appointmentType === "Health" &&
          input.healthType &&
          input.startTime &&
          input.endTime
        ) {
          const healthAppointment = await prisma.healthAppointment.create({
            data: {
              appointmentId: appointment.appointmentId,
              healthType: input.healthType,
              startTime: new Date(`1970-01-01T${input.startTime}:00Z`),
              endTime: new Date(`1970-01-01T${input.endTime}:00Z`),
            },
          });
          return { ...appointment, healthAppointment, type: "Health" };
        }
        // Should not reach here if validation is correct
        throw new Error("Invalid appointment type or missing details.");
      });
    }),

  listMyAppointments: protectedProcedure
    .input(
      z.object({
        status: appointmentStatusSchema.optional(),
        take: z.number().int().optional(),
        skip: z.number().int().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const studentId = ctx.session.user.id;
      const where: Prisma.AppointmentWhereInput = {
        takenByStudentId: studentId,
        appointmentStatus: input.status,
      };
      const appointments = await ctx.db.appointment.findMany({
        where,
        include: {
          bookAppointment: {
            include: { borrowedBooks: { include: { book: true } } },
          },
          sportAppointment: true,
          healthAppointment: true,
          managedByStaff: {
            include: {
              user: { select: { name: true, fName: true, lName: true } },
            },
          },
        },
        orderBy: { appointmentDate: "desc" },
        take: input.take,
        skip: input.skip,
      });
      const totalAppointments = await ctx.db.appointment.count({ where });
      return { appointments, totalCount: totalAppointments };
    }),

  getAppointmentAvailability: protectedProcedure
    .input(
      z.object({
        appointmentType: appointmentTypeSchema.optional(),
        date: z.string().datetime(),
        staffId: z.string().cuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Highly complex logic dependent on:
      // - Staff working hours / schedules (not modeled yet)
      // - Existing appointments for the staff/service
      // - Buffer times between appointments
      // - Capacity for services (e.g., max books for library appt, max people for sport)
      // Placeholder: return some dummy slots
      console.log(
        `Checking availability for ${
          input.appointmentType ?? "any service"
        } on ${input.date}, staff: ${input.staffId ?? "any"}`
      );
      return [
        { startTime: "10:00", endTime: "11:00", availableSlots: 5 },
        { startTime: "11:00", endTime: "12:00", availableSlots: 3 },
      ];
    }),

  updateAppointment: protectedProcedure // Student can cancel, Staff/Admin can modify
    .input(
      z.object({
        appointmentId: z.string().uuid(),
        status: appointmentStatusSchema.optional(),
        // Rescheduling parts (optional)
        appointmentDate: z.string().datetime().optional(),
        managedByStaffId: z.string().cuid().optional(),
        startTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
        endTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { appointmentId, ...updateData } = input;
      const existingAppointment = await ctx.db.appointment.findUniqueOrThrow({
        where: { appointmentId },
        include: {
          bookAppointment: { include: { borrowedBooks: true } },
          sportAppointment: true, // Added include
          healthAppointment: true, // Added include
        },
      });

      const sessionUserId = ctx.session.user.id;
      const isStudentOwner =
        existingAppointment.takenByStudentId === sessionUserId;
      const isStaffOrAdmin = await ctx.db.user.findFirst({
        where: {
          id: sessionUserId,
          OR: [{ staff: { isNot: null } }, { admin: { isNot: null } }],
        },
      });

      if (!isStaffOrAdmin && !isStudentOwner) {
        throw new Error("Not authorized to update this appointment.");
      }

      if (!isStaffOrAdmin && isStudentOwner) {
        // User is the student who owns the appointment
        if (updateData.status && updateData.status !== "Cancelled") {
          throw new Error("Students can only cancel their own appointments.");
        }
        if (
          Object.keys(updateData).filter((key) => key !== "status").length > 0
        ) {
          throw new Error(
            "Students can only update the status to 'Cancelled'. Other changes are not permitted."
          );
        }
      }

      return ctx.db.$transaction(async (prisma) => {
        const appointmentUpdatePayload: Prisma.AppointmentUpdateInput = {};
        if (updateData.status)
          appointmentUpdatePayload.appointmentStatus = updateData.status;
        if (updateData.appointmentDate)
          appointmentUpdatePayload.appointmentDate = new Date(
            updateData.appointmentDate
          );
        if (updateData.managedByStaffId && isStaffOrAdmin) {
          // Correct way to update relation: use connect
          appointmentUpdatePayload.managedByStaff = {
            connect: { userId: updateData.managedByStaffId },
          };
        }

        const updatedAppointment = await prisma.appointment.update({
          where: { appointmentId },
          data: appointmentUpdatePayload,
        });

        if (
          (updateData.status === "Cancelled" ||
            updateData.status === "NoShow") &&
          existingAppointment.bookAppointment
        ) {
          for (const borrowedBook of existingAppointment.bookAppointment
            .borrowedBooks) {
            await prisma.book.update({
              where: { isbn: borrowedBook.isbn },
              data: {
                currentQuantity: { increment: borrowedBook.borrowQuantity },
              },
            });
          }
        }

        if (updateData.startTime && updateData.endTime && isStaffOrAdmin) {
          // Only staff/admin can change times
          if (existingAppointment.sportAppointment) {
            await prisma.sportAppointment.update({
              where: { appointmentId },
              data: {
                startTime: new Date(`1970-01-01T${updateData.startTime}:00Z`),
                endTime: new Date(`1970-01-01T${updateData.endTime}:00Z`),
              },
            });
          } else if (existingAppointment.healthAppointment) {
            await prisma.healthAppointment.update({
              where: { appointmentId },
              data: {
                startTime: new Date(`1970-01-01T${updateData.startTime}:00Z`),
                endTime: new Date(`1970-01-01T${updateData.endTime}:00Z`),
              },
            });
          }
        }
        return updatedAppointment;
      });
    }),

  // Delete/Cancel Appointment - simplified to just changing status to Cancelled via updateAppointment
  // For hard delete, a separate admin procedure might be needed.
  cancelAppointment: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }): Promise<Appointment> => {
      const existingAppointment = await ctx.db.appointment.findUniqueOrThrow({
        where: { appointmentId: input.appointmentId },
      });

      const sessionUserId = ctx.session.user.id;
      const isOwner = existingAppointment.takenByStudentId === sessionUserId;
      const isAdmin = !!(await ctx.db.admin.findUnique({
        where: { userId: sessionUserId },
      }));
      const isManagingStaff =
        existingAppointment.managedByStaffId === sessionUserId;

      if (!isOwner && !isAdmin && !isManagingStaff) {
        throw new Error("Not authorized to cancel this appointment.");
      }

      if (
        existingAppointment.appointmentStatus === "Completed" ||
        existingAppointment.appointmentStatus === "Cancelled"
      ) {
        throw new Error(
          `Appointment is already ${existingAppointment.appointmentStatus}.`
        );
      }

      const caller = appointmentsRouter.createCaller(ctx);
      return caller.updateAppointment({
        appointmentId: input.appointmentId,
        status: "Cancelled",
      });
    }),

  // --- Book Management (for Library) --- (Section 3.5.2 PRD)
  createBook: staffProcedure // Or adminProcedure
    .input(
      z.object({
        isbn: z.string().min(1),
        title: z.string().min(1),
        author: z.string().optional(),
        quantityInStock: z.number().int().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.book.create({
        data: {
          ...input,
          currentQuantity: input.quantityInStock, // Initially, current = total stock
        },
      });
    }),

  listBooks: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        take: z.number().int().optional(),
        skip: z.number().int().optional(),
        onlyAvailable: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.BookWhereInput = {
        OR: input.query
          ? [
              { title: { contains: input.query, mode: "insensitive" } },
              { author: { contains: input.query, mode: "insensitive" } },
              { isbn: { equals: input.query } },
            ]
          : undefined,
        currentQuantity: input.onlyAvailable ? { gt: 0 } : undefined,
      };
      const books = await ctx.db.book.findMany({
        where,
        take: input.take,
        skip: input.skip,
        orderBy: { title: "asc" },
      });
      const totalBooks = await ctx.db.book.count({ where });
      return { books, totalCount: totalBooks };
    }),

  getBook: protectedProcedure
    .input(z.object({ isbn: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.book.findUniqueOrThrow({
        where: { isbn: input.isbn },
      });
    }),

  updateBook: staffProcedure // Or adminProcedure
    .input(
      z.object({
        isbn: z.string().min(1),
        title: z.string().min(1).optional(),
        author: z.string().optional(),
        quantityInStock: z.number().int().nonnegative().optional(),
        currentQuantity: z.number().int().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { isbn, ...data } = input;
      // Ensure currentQuantity does not exceed quantityInStock if both are provided
      if (
        data.currentQuantity !== undefined &&
        data.quantityInStock !== undefined &&
        data.currentQuantity > data.quantityInStock
      ) {
        throw new Error("Current quantity cannot exceed quantity in stock.");
      }
      // If only currentQuantity is updated, check against existing quantityInStock
      if (
        data.currentQuantity !== undefined &&
        data.quantityInStock === undefined
      ) {
        const book = await ctx.db.book.findUnique({ where: { isbn } });
        if (book && data.currentQuantity > book.quantityInStock) {
          throw new Error("Current quantity cannot exceed quantity in stock.");
        }
      }
      // If only quantityInStock is updated, ensure it's not less than currentQuantity
      if (
        data.quantityInStock !== undefined &&
        data.currentQuantity === undefined
      ) {
        const book = await ctx.db.book.findUnique({ where: { isbn } });
        if (book && data.quantityInStock < book.currentQuantity) {
          throw new Error(
            "Quantity in stock cannot be less than current quantity available."
          );
        }
      }
      return ctx.db.book.update({
        where: { isbn },
        data,
      });
    }),

  deleteBook: adminProcedure // Typically more restricted than staff
    .input(z.object({ isbn: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Add check: only delete if no active borrows (BookAppointmentBorrowsBook where returnDate is null)
      const activeBorrows = await ctx.db.bookAppointmentBorrowsBook.count({
        where: {
          isbn: input.isbn,
          bookAppointment: {
            returnDate: null, // Active borrow
            appointment: {
              appointmentStatus: {
                notIn: ["Cancelled", "Completed", "NoShow"],
              },
            },
          },
        },
      });
      if (activeBorrows > 0) {
        throw new Error(
          "Cannot delete book with active borrows. Please ensure all copies are returned and appointments completed or cancelled."
        );
      }
      return ctx.db.book.delete({ where: { isbn: input.isbn } });
    }),
}); // Removed 'satisfies AnyRouter'
