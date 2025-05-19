import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  staffProcedure,
} from "@/server/api/trpc";
import type { Prisma, Appointment, BookBorrowRecord } from "@prisma/client";

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
const bookDetailSchema = z.object({
  isbn: z.string().min(1),
  borrowQuantity: z.number().int().positive().default(1),
});

export const appointmentsRouter = createTRPCRouter({
  // --- Appointment Management --- (Section 3.5.1 PRD)
  createAppointment: protectedProcedure // Student role typically, staff might also book for users
    .input(
      z.object({
        appointmentType: appointmentTypeSchema, // Make this required
        appointmentDate: z.string().datetime(),
        managedByStaffId: z.string().cuid(),
        bookDetails: z.array(bookDetailSchema).optional(), // For Book appointments
        sportType: z.string().min(1).optional(),
        healthType: z.string().min(1).optional(),
        startTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(), // HH:MM
        endTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .optional(), // HH:MM
      })
    )
    .mutation(async ({ ctx, input }) => {
      const studentId = ctx.session.user.id;

      if (
        input.appointmentType === "Book" &&
        (!input.bookDetails || input.bookDetails.length === 0)
      ) {
        throw new Error("Book details are required for book appointments.");
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
        const appointment = await prisma.appointment.create({
          data: {
            takenByStudentId: studentId,
            managedByStaffId: input.managedByStaffId,
            appointmentDate: new Date(input.appointmentDate),
            appointmentStatus: "Scheduled",
          },
        });

        let specificDetails: unknown = {};

        if (input.appointmentType === "Book" && input.bookDetails) {
          const borrowRecordsData = input.bookDetails.map((detail) => ({
            appointmentId: appointment.appointmentId,
            isbn: detail.isbn,
            borrowQuantity: detail.borrowQuantity,
            borrowDate: new Date(input.appointmentDate), // borrowDate is on BookBorrowRecord
          }));

          await prisma.bookBorrowRecord.createMany({
            data: borrowRecordsData,
          });

          for (const detail of input.bookDetails) {
            const book = await prisma.book.findUniqueOrThrow({
              where: { isbn: detail.isbn },
            });
            if (book.currentQuantity < detail.borrowQuantity) {
              throw new Error(
                `Not enough stock for book ISBN: ${detail.isbn}. Requested: ${detail.borrowQuantity}, Available: ${book.currentQuantity}`
              );
            }
            await prisma.book.update({
              where: { isbn: detail.isbn },
              data: { currentQuantity: { decrement: detail.borrowQuantity } },
            });
          }
          // We can't easily return specificDetails for book due to createMany
          // Re-fetch if necessary or return just the main appointment
          specificDetails = { type: "Book", count: input.bookDetails.length };
        } else if (
          input.appointmentType === "Sport" &&
          input.sportType &&
          input.startTime &&
          input.endTime
        ) {
          specificDetails = await prisma.sportAppointment.create({
            data: {
              appointmentId: appointment.appointmentId,
              sportType: input.sportType,
              startTime: new Date(`1970-01-01T${input.startTime}:00Z`),
              endTime: new Date(`1970-01-01T${input.endTime}:00Z`),
            },
          });
        } else if (
          input.appointmentType === "Health" &&
          input.healthType &&
          input.startTime &&
          input.endTime
        ) {
          specificDetails = await prisma.healthAppointment.create({
            data: {
              appointmentId: appointment.appointmentId,
              healthType: input.healthType,
              startTime: new Date(`1970-01-01T${input.startTime}:00Z`),
              endTime: new Date(`1970-01-01T${input.endTime}:00Z`),
            },
          });
        } else {
          // Should not be reached if validation is correct
          throw new Error("Invalid appointment type or missing details.");
        }

        return { ...appointment, details: specificDetails };
      });
    }),

  listMyAppointments: protectedProcedure
    .input(
      z.object({
        status: appointmentStatusSchema.optional(),
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
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
          bookBorrowRecords: {
            // Updated from bookAppointment
            include: { book: true },
          },
          sportAppointment: true,
          healthAppointment: true,
          managedByStaff: {
            include: {
              user: {
                select: { name: true, fName: true, lName: true, id: true },
              },
            },
          },
          takenByStudent: {
            // Added to show student info (though it's "my" appointments)
            include: {
              user: {
                select: { name: true, fName: true, lName: true, id: true },
              },
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

  getAppointmentById: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const appointment = await ctx.db.appointment.findUniqueOrThrow({
        where: { appointmentId: input.appointmentId },
        include: {
          bookBorrowRecords: { include: { book: true } },
          sportAppointment: true,
          healthAppointment: true,
          managedByStaff: {
            include: {
              user: {
                select: { name: true, fName: true, lName: true, id: true },
              },
            },
          },
          takenByStudent: {
            include: {
              user: {
                select: { name: true, fName: true, lName: true, id: true },
              },
            },
          },
        },
      });
      // Add authorization check: user must be owner, or staff/admin
      const sessionUserId = ctx.session.user.id;
      const isOwner = appointment.takenByStudentId === sessionUserId;
      const userRoles = await ctx.db.user.findUnique({
        where: { id: sessionUserId },
        select: { admin: true, staff: true },
      });
      const isAdmin = !!userRoles?.admin;
      const isStaff = !!userRoles?.staff;

      if (!isOwner && !isAdmin && !isStaff) {
        throw new Error("Not authorized to view this appointment.");
      }
      return appointment;
    }),

  adminListAllAppointments: adminProcedure
    .input(
      z.object({
        status: appointmentStatusSchema.optional(),
        studentId: z.string().cuid().optional(),
        staffId: z.string().cuid().optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.AppointmentWhereInput = {
        appointmentStatus: input.status,
        takenByStudentId: input.studentId,
        managedByStaffId: input.staffId,
        AND:
          input.dateFrom || input.dateTo
            ? [
                input.dateFrom
                  ? { appointmentDate: { gte: new Date(input.dateFrom) } }
                  : {},
                input.dateTo
                  ? { appointmentDate: { lte: new Date(input.dateTo) } }
                  : {},
              ]
            : undefined,
      };
      const appointments = await ctx.db.appointment.findMany({
        where,
        include: {
          bookBorrowRecords: { include: { book: true } },
          sportAppointment: true,
          healthAppointment: true,
          managedByStaff: {
            include: {
              user: {
                select: { name: true, fName: true, lName: true, id: true },
              },
            },
          },
          takenByStudent: {
            include: {
              user: {
                select: { name: true, fName: true, lName: true, id: true },
              },
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

  getAppointmentAvailability: protectedProcedure // Placeholder - complex logic
    .input(
      z.object({
        appointmentType: appointmentTypeSchema.optional(),
        date: z.string().datetime(),
        staffId: z.string().cuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
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

  updateAppointment: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string().uuid(),
        status: appointmentStatusSchema.optional(),
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
        // Note: Updating bookDetails for a book appointment is complex (managing returns, new borrows)
        // For simplicity, this is not included here. Typically, one might cancel and re-book.
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { appointmentId, ...updateData } = input;
      const existingAppointment = await ctx.db.appointment.findUniqueOrThrow({
        where: { appointmentId },
        include: {
          bookBorrowRecords: true, // Updated
          sportAppointment: true,
          healthAppointment: true,
        },
      });

      const sessionUserId = ctx.session.user.id;
      const isStudentOwner =
        existingAppointment.takenByStudentId === sessionUserId;
      const userRoles = await ctx.db.user.findUnique({
        where: { id: sessionUserId },
        select: { admin: true, staff: true },
      });
      const isAdmin = !!userRoles?.admin;
      const isStaff =
        !!userRoles?.staff ||
        existingAppointment.managedByStaffId === sessionUserId;

      if (!isStaff && !isAdmin && !isStudentOwner) {
        throw new Error("Not authorized to update this appointment.");
      }

      if (!isStaff && !isAdmin && isStudentOwner) {
        if (updateData.status && updateData.status !== "Cancelled") {
          throw new Error("Students can only cancel their own appointments.");
        }
        if (
          Object.keys(updateData).filter((key) => key !== "status").length > 0
        ) {
          throw new Error(
            "Students can only update the status to 'Cancelled'."
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
        if (updateData.managedByStaffId && (isStaff || isAdmin)) {
          appointmentUpdatePayload.managedByStaff = {
            connect: { userId: updateData.managedByStaffId },
          };
        }

        const updatedAppt = await prisma.appointment.update({
          where: { appointmentId },
          data: appointmentUpdatePayload,
        });

        if (
          (updateData.status === "Cancelled" ||
            updateData.status === "NoShow") &&
          existingAppointment.bookBorrowRecords &&
          existingAppointment.bookBorrowRecords.length > 0
        ) {
          for (const record of existingAppointment.bookBorrowRecords) {
            await prisma.book.update({
              where: { isbn: record.isbn },
              data: { currentQuantity: { increment: record.borrowQuantity } },
            });
            // Optionally mark BookBorrowRecord as returned or handle it based on status
            await prisma.bookBorrowRecord.update({
              where: {
                isbn_appointmentId: {
                  isbn: record.isbn,
                  appointmentId: record.appointmentId,
                },
              },
              data: { returnDate: new Date() }, // Mark as returned if appointment cancelled/noshow
            });
          }
        }

        if (
          updateData.startTime &&
          updateData.endTime &&
          (isStaff || isAdmin)
        ) {
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
        return updatedAppt;
      });
    }),

  cancelAppointment: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }): Promise<Appointment> => {
      // This just calls updateAppointment. Authorization is handled there.
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
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
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
        include: {
          borrowRecords: {
            // Changed from bookAppointment
            include: {
              appointment: {
                select: { appointmentDate: true, appointmentStatus: true },
              },
            },
          },
        },
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
      // Add check: only delete if no active borrows (BookBorrowRecord where returnDate is null)
      const activeBorrows = await ctx.db.bookBorrowRecord.count({
        where: {
          isbn: input.isbn,
          returnDate: null, // Active borrow
          appointment: {
            appointmentStatus: {
              notIn: ["Cancelled", "Completed", "NoShow"],
            },
          },
        },
      });
      if (activeBorrows > 0) {
        throw new Error(
          "Cannot delete book with active borrows. Ensure all copies are returned and appointments are resolved."
        );
      }
      return ctx.db.book.delete({ where: { isbn: input.isbn } });
    }),
});
