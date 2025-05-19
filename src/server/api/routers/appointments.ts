import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  staffProcedure,
} from "@/server/api/trpc";
import type {
  Prisma,
  Appointment,
  BookBorrowRecord,
  Staff,
} from "@prisma/client";

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
  getAvailableSlots: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(),
        date: z.string().datetime(), // ISO string from client
      })
    )
    .query(async ({ ctx, input }) => {
      const { date: selectedDateISO } = input;
      const selectedDate = new Date(selectedDateISO);

      // Define operating hours (e.g., 9 AM to 5 PM)
      const openingHour = 9;
      const closingHour = 17; // 5 PM
      const slotDurationMinutes = 60;

      const allPossibleSlots: string[] = [];
      for (let hour = openingHour; hour < closingHour; hour++) {
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hour, 0, 0, 0);

        // Format to HH:MM AM/PM
        let h = slotDate.getHours();
        const m = slotDate.getMinutes();
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        h = h ? h : 12; // Handle midnight (0 hours) as 12 AM
        const minutesStr = m < 10 ? "0" + m : m;
        allPossibleSlots.push(`${h}:${minutesStr} ${ampm}`);
      }

      // Fetch existing appointments for the selected day
      // This is a simplified query. A real system would filter by specific staff/resource if applicable.
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);

      const existingAppointments = await ctx.db.appointment.findMany({
        where: {
          appointmentDate: {
            gte: dayStart,
            lte: dayEnd,
          },
          // Add more filters if needed, e.g., for a specific staff member or resource related to serviceId
          // appointmentStatus: { notIn: ["Cancelled", "NoShow"] } // Only consider active bookings
        },
        include: {
          // Include sport/health to get their specific start times
          sportAppointment: true,
          healthAppointment: true,
        },
      });

      const bookedTimeSlots = new Set<string>();
      existingAppointments.forEach((appt) => {
        let apptStartTime: Date | null = null;
        if (appt.sportAppointment?.startTime) {
          // Sport/Health appointments store time separately. We need to combine with appointmentDate.
          const baseDate = new Date(appt.appointmentDate); // Use the date part from the main appointment
          const time = new Date(appt.sportAppointment.startTime); // This date part is 1970-01-01
          baseDate.setHours(time.getUTCHours(), time.getUTCMinutes(), 0, 0);
          apptStartTime = baseDate;
        } else if (appt.healthAppointment?.startTime) {
          const baseDate = new Date(appt.appointmentDate);
          const time = new Date(appt.healthAppointment.startTime);
          baseDate.setHours(time.getUTCHours(), time.getUTCMinutes(), 0, 0);
          apptStartTime = baseDate;
        }
        // For other appointment types or if specific times aren't on subtypes,
        // you might need a default assumption or a 'slotTime' field on the Appointment model.
        // For now, we'll only consider Sport/Health start times if present.

        if (apptStartTime) {
          let h = apptStartTime.getHours();
          const m = apptStartTime.getMinutes();
          const ampm = h >= 12 ? "PM" : "AM";
          h = h % 12;
          h = h ? h : 12;
          const minutesStr = m < 10 ? "0" + m : m;
          bookedTimeSlots.add(`${h}:${minutesStr} ${ampm}`);
        }
      });

      const availableSlots = allPossibleSlots.filter(
        (slot) => !bookedTimeSlots.has(slot)
      );

      // console.log(`Selected Date: ${selectedDate.toDateString()}`);
      // console.log("All possible slots for the day:", allPossibleSlots);
      // console.log("Booked time slots (from Sport/Health):", Array.from(bookedTimeSlots));
      // console.log("Calculated available slots:", availableSlots);

      return availableSlots;
    }),

  // --- Appointment Management --- (Section 3.5.1 PRD)
  createAppointment: protectedProcedure // Student role typically, staff might also book for users
    .input(
      z.object({
        appointmentType: appointmentTypeSchema, // Make this required
        appointmentDate: z.string().datetime(),
        managedByStaffId: z.string().cuid().optional(), // Made optional
        bookDetails: z.array(bookDetailSchema).optional(), // For Book appointments
        sportType: z.string().min(1).optional(),
        healthType: z.string().min(1).optional(),
        startTime: z
          .string()
          // Regex to match HH:MM format, also allowing single digit hour
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
            message: "Invalid time format, expected HH:MM",
          })
          .optional(),
        endTime: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
            message: "Invalid time format, expected HH:MM",
          })
          .optional(),
        notes: z.string().optional(), // Added notes field to input schema
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionUserId = ctx.session.user.id;
      console.log(`Creating appointment for session user ID: ${sessionUserId}`);

      // Verify the session user is a valid student
      const studentProfile = await ctx.db.student.findUnique({
        where: { userId: sessionUserId },
      });
      if (!studentProfile) {
        console.error(`No student profile found for user ID: ${sessionUserId}`);
        throw new Error(
          `Your user profile is not configured as a student. Please contact support.`
        );
      }
      const studentIdToAssign = studentProfile.userId; // Use the verified student ID

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

      let staffUserIdToAssign = input.managedByStaffId;
      if (!staffUserIdToAssign) {
        console.log(
          "managedByStaffId not provided, attempting to auto-assign."
        );
        const firstStaffProfile = await ctx.db.staff.findFirst({
          include: { user: { select: { id: true } } }, // Ensure user relation is valid
        });
        if (!firstStaffProfile || !firstStaffProfile.user) {
          console.error(
            "No staff available in the database or staff user link broken."
          );
          throw new Error(
            "Configuration error: No staff available to manage the appointment. Please contact administration."
          );
        }
        staffUserIdToAssign = firstStaffProfile.userId;
        console.log(
          `Auto-assigned to staff user ID: ${staffUserIdToAssign}. Notes: ${
            input.notes ?? "N/A"
          }`
        );
      } else {
        // If managedByStaffId is provided, verify it's a valid staff user
        const staffExists = await ctx.db.staff.findUnique({
          where: { userId: staffUserIdToAssign },
        });
        if (!staffExists) {
          console.error(
            `Provided managedByStaffId ${staffUserIdToAssign} does not correspond to a staff member.`
          );
          throw new Error(
            `The selected staff member (ID: ${staffUserIdToAssign}) is not valid.`
          );
        }
        console.log(`Using provided staff user ID: ${staffUserIdToAssign}`);
      }

      return ctx.db.$transaction(async (prisma) => {
        console.log(
          `Attempting to create appointment with studentId: ${studentIdToAssign}, staffId: ${staffUserIdToAssign}`
        );
        const appointment = await prisma.appointment.create({
          data: {
            takenByStudentId: studentIdToAssign,
            managedByStaffId: staffUserIdToAssign!,
            appointmentDate: new Date(input.appointmentDate),
            appointmentStatus: "Scheduled",
            notes: input.notes,
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
              startTime: new Date(`1970-01-01T${input.startTime}:00.000Z`), // Ensure ISO 8601 format for time
              endTime: new Date(`1970-01-01T${input.endTime}:00.000Z`), // Ensure ISO 8601 format for time
              // If SportAppointment schema has 'notes': sportNotes: input.notes,
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
              startTime: new Date(`1970-01-01T${input.startTime}:00.000Z`),
              endTime: new Date(`1970-01-01T${input.endTime}:00.000Z`),
              // If HealthAppointment schema has 'notes': healthNotes: input.notes,
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
