import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  staffProcedure,
  // staffProcedure, // Not currently used, can be re-added if needed
} from "@/server/api/trpc";
import {
  Prisma, // For instanceof checks and other value usages
  type Appointment,
  type BookBorrowRecord,
  type Staff,
  // type AppointmentStatus is not directly used as a type here, enum is defined below
} from "@prisma/client";
import { TRPCError } from "@trpc/server";

// Enum for AppointmentStatus based on Prisma schema
const appointmentStatusSchema = z.enum([
  "Scheduled",
  "Completed",
  "Cancelled",
  "NoShow",
]);
// Enum for AppointmentType as described in PRD
const appointmentTypeSchema = z.enum(["Book", "Sport", "Health"]);

// Helper type for book details in book appointment (used in createAppointment)
const bookDetailSchema = z.object({
  isbn: z.string().min(1),
  borrowQuantity: z.number().int().positive().default(1),
});

// Schema for book management (create/update)
const bookManagementItemSchema = z.object({
  isbn: z
    .string()
    .min(10, "ISBN must be at least 10 characters")
    .max(20, "ISBN can be at most 20 characters"), // Prisma schema shows ISBN varchar(20)
  title: z.string().min(1, "Title is required"),
  author: z.string().optional(),
  quantityInStock: z.coerce
    .number()
    .int({ message: "Quantity must be a whole number." })
    .min(0, "Quantity cannot be negative."),
});

export const appointmentsRouter = createTRPCRouter({
  // --- Slot Availability ---
  getAvailableSlots: protectedProcedure
    .input(
      z.object({
        serviceId: z.string(), // serviceId might be used in future to filter by specific staff/resource
        date: z.string().datetime(), // ISO string from client
      })
    )
    .query(async ({ ctx, input }) => {
      const { date: selectedDateISO } = input;
      const selectedDate = new Date(selectedDateISO);

      const openingHour = 9;
      const closingHour = 17; // 5 PM

      const allPossibleSlots: string[] = [];
      for (let hour = openingHour; hour < closingHour; hour++) {
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hour, 0, 0, 0);
        let h = slotDate.getHours();
        const m = slotDate.getMinutes();
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        h = h ? h : 12;
        const minutesStr = m < 10 ? `0${m.toString()}` : m.toString();
        allPossibleSlots.push(`${h}:${minutesStr} ${ampm}`);
      }

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
          appointmentStatus: { notIn: ["Cancelled", "NoShow"] },
        },
        include: {
          sportAppointment: true,
          healthAppointment: true,
        },
      });
      const bookedTimeSlots = new Set<string>();
      for (const appt of existingAppointments) {
        let apptStartTime: Date | null = null;
        if (appt.sportAppointment?.startTime) {
          const baseDate = new Date(appt.appointmentDate);
          const time = new Date(appt.sportAppointment.startTime);
          baseDate.setHours(time.getUTCHours(), time.getUTCMinutes(), 0, 0);
          apptStartTime = baseDate;
        } else if (appt.healthAppointment?.startTime) {
          const baseDate = new Date(appt.appointmentDate);
          const time = new Date(appt.healthAppointment.startTime);
          baseDate.setHours(time.getUTCHours(), time.getUTCMinutes(), 0, 0);
          apptStartTime = baseDate;
        } else if (appt.appointmentType === "Book") {
          // For book appointments, assume they take a standard slot if no specific time field exists
          // For now, if it's a book appointment, we can use the main appointmentDate if it has time info
          // or assume it takes one of the hourly slots.
          // This part of logic depends on how book appointment times are stored/intended.
          // If book appointments are just by day, this logic might need adjustment.
          // For simplicity, let's assume book appointments also adhere to the hourly slots implicitly.
          // Or, if book appointments don't have specific times, they don't block hourly slots.
          // Given the current structure, we will only explicitly block slots for Sport/Health with startTime.
        }

        if (apptStartTime) {
          let h = apptStartTime.getHours();
          const m = apptStartTime.getMinutes();
          const ampm = h >= 12 ? "PM" : "AM";
          h = h % 12;
          h = h ? h : 12;
          const minutesStr = m < 10 ? `0${m.toString()}` : m.toString();
          bookedTimeSlots.add(`${h}:${minutesStr} ${ampm}`);
        }
      }

      const availableSlots = allPossibleSlots.filter(
        (slot) => !bookedTimeSlots.has(slot)
      );
      return availableSlots;
    }),

  // --- Appointment Creation & Management ---
  createAppointment: protectedProcedure
    .input(
      z.object({
        appointmentType: appointmentTypeSchema,
        appointmentDate: z.string().datetime(),
        managedByStaffId: z.string().cuid().optional(),
        bookDetails: z.array(bookDetailSchema).optional(),
        sportType: z.string().min(1).optional(),
        healthType: z.string().min(1).optional(),
        startTime: z
          .string()
          .regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, {
            // HH:MM format
            message: "Invalid time format, expected HH:MM",
          })
          .optional(),
        endTime: z
          .string()
          .regex(/^([01]?\d|2[0-3]):([0-5]\d)$/, {
            message: "Invalid time format, expected HH:MM",
          })
          .optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sessionUserId = ctx.session.user.id;
      let studentProfile = await ctx.db.student.findUnique({
        where: { userId: sessionUserId },
      });

      // If student profile doesn't exist, try to create it now.
      if (!studentProfile) {
        try {
          studentProfile = await ctx.db.student.create({
            data: {
              userId: sessionUserId,
              // managingAdminId can be left null or set to a default if applicable
            },
          });
          console.log(
            `[appointmentsRouter] Lazily created Student record for User ID: ${sessionUserId}`
          );
        } catch (error) {
          console.error(
            `[appointmentsRouter] Failed to lazily create Student record for User ID: ${sessionUserId}`,
            error
          );
          // If creation fails here, it's a more persistent issue or a race condition not resolved.
          throw new Error(
            "Failed to set up your student profile. Please try again shortly or contact support if the issue persists."
          );
        }
      }

      if (!studentProfile) {
        throw new Error(
          "Your user profile could not be configured as a student. Please contact support."
        );
      }

      const studentIdToAssign = studentProfile.userId;

      // Validation based on appointment type
      if (
        input.appointmentType === "Book" &&
        (!input.bookDetails || input.bookDetails.length === 0)
      ) {
        throw new Error("Book details are required for book appointments.");
      }
      if (input.appointmentType === "Sport") {
        if (!input.startTime || !input.endTime) {
          throw new Error(
            "Start and end times are required for sport appointments."
          );
        }
        if (!input.sportType) {
          throw new Error("Sport type is required for sport appointments.");
        }
      }
      if (input.appointmentType === "Health") {
        if (!input.startTime || !input.endTime) {
          throw new Error(
            "Start and end times are required for health appointments."
          );
        }
        if (!input.healthType) {
          throw new Error("Health type is required for health appointments.");
        }
      }

      let staffUserIdToAssign = input.managedByStaffId;
      if (!staffUserIdToAssign) {
        const firstStaffProfile = await ctx.db.staff.findFirst({
          include: { user: { select: { id: true } } },
        });
        if (!firstStaffProfile?.user) {
          throw new Error(
            "Configuration error: No staff available to manage the appointment."
          );
        }
        staffUserIdToAssign = firstStaffProfile.user.id;
      } else {
        const staffExists = await ctx.db.staff.findUnique({
          where: { userId: staffUserIdToAssign },
        });
        if (!staffExists) {
          throw new Error(
            `The selected staff member (ID: ${staffUserIdToAssign}) is not valid.`
          );
        }
      }

      return ctx.db.$transaction(async (prisma) => {
        const appointment = await prisma.appointment.create({
          data: {
            takenByStudentId: studentIdToAssign,
            managedByStaffId: staffUserIdToAssign,
            appointmentDate: new Date(input.appointmentDate),
            appointmentStatus: "Scheduled",
            appointmentType: input.appointmentType,
            notes: input.notes,
          },
        });

        if (input.appointmentType === "Book" && input.bookDetails) {
          const borrowRecordsData = input.bookDetails.map((detail) => ({
            appointmentId: appointment.appointmentId,
            isbn: detail.isbn,
            borrowQuantity: detail.borrowQuantity,
            borrowDate: new Date(appointment.appointmentDate), // Set borrowDate to the appointmentDate
          }));
          await prisma.bookBorrowRecord.createMany({
            data: borrowRecordsData,
          });
          for (const detail of input.bookDetails) {
            await prisma.book.update({
              where: { isbn: detail.isbn },
              data: {
                currentQuantity: {
                  decrement: detail.borrowQuantity,
                },
              },
            });
          }
        } else if (
          input.appointmentType === "Sport" &&
          input.sportType &&
          input.startTime && // startTime and endTime are validated above for Sport type
          input.endTime
        ) {
          const [startHours, startMinutes] = input.startTime
            .split(":")
            .map(Number);
          const sportStartTime = new Date(1970, 0, 1, startHours, startMinutes);
          const [endHours, endMinutes] = input.endTime.split(":").map(Number);
          const sportEndTime = new Date(1970, 0, 1, endHours, endMinutes);

          await prisma.sportAppointment.create({
            data: {
              appointmentId: appointment.appointmentId,
              sportType: input.sportType,
              startTime: sportStartTime,
              endTime: sportEndTime,
            },
          });
        } else if (
          input.appointmentType === "Health" &&
          input.healthType &&
          input.startTime && // startTime and endTime are validated above for Health type
          input.endTime
        ) {
          const [startHours, startMinutes] = input.startTime
            .split(":")
            .map(Number);
          const healthStartTime = new Date(
            1970,
            0,
            1,
            startHours,
            startMinutes
          );
          const [endHours, endMinutes] = input.endTime.split(":").map(Number);
          const healthEndTime = new Date(1970, 0, 1, endHours, endMinutes);

          await prisma.healthAppointment.create({
            data: {
              appointmentId: appointment.appointmentId,
              healthType: input.healthType,
              startTime: healthStartTime,
              endTime: healthEndTime,
            },
          });
        }
        return appointment;
      });
    }),

  listMyAppointments: protectedProcedure.query(async ({ ctx }) => {
    const studentId = ctx.session.user.id;
    let studentProfile = await ctx.db.student.findUnique({
      where: { userId: studentId },
    });

    if (!studentProfile) {
      // Lazily create Student profile if it doesn't exist
      try {
        studentProfile = await ctx.db.student.create({
          data: {
            userId: studentId,
            // managingAdminId can be left null or set to a default if applicable
          },
        });
        console.log(
          `[LazyCreate] Created Student record for User ID: ${studentId} in listMyAppointments`
        );
      } catch (error) {
        console.error(
          `[LazyCreate] Failed to create Student record for User ID: ${studentId} in listMyAppointments`,
          error
        );
        // If student profile creation fails, it's a more significant issue.
        // Depending on desired behavior, either return [] or throw an error.
        // For now, let's throw an error to make the issue visible, similar to other lazy creations.
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to initialize your student profile for appointments. Please try again or contact support.",
        });
      }
    }
    // Now studentProfile is guaranteed to exist.

    return ctx.db.appointment.findMany({
      where: { takenByStudentId: studentProfile.userId }, // Use studentProfile.userId, which is now guaranteed
      orderBy: { appointmentDate: "desc" },
      include: {
        managedByStaff: { include: { user: true } },
        bookBorrowRecords: { include: { book: true } },
        sportAppointment: true,
        healthAppointment: true,
      },
    });
  }),

  cancelAppointment: protectedProcedure
    .input(z.object({ appointmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.db.appointment.findUnique({
        where: { appointmentId: input.appointmentId },
        include: { bookBorrowRecords: true },
      });

      if (!appointment) {
        throw new Error("Appointment not found.");
      }

      // Check if the user is authorized to cancel this appointment
      // (either the student who booked it or an admin/staff)
      const isOwner = appointment.takenByStudentId === ctx.session.user.id;
      const isAdminOrStaff =
        ctx.session.user.isAdmin || ctx.session.user.isStaff;

      if (!isOwner && !isAdminOrStaff) {
        throw new Error("You are not authorized to cancel this appointment.");
      }

      if (appointment.appointmentStatus === "Cancelled") {
        throw new Error("Appointment is already cancelled.");
      }

      return ctx.db.$transaction(async (prisma) => {
        const updatedAppointment = await prisma.appointment.update({
          where: { appointmentId: input.appointmentId },
          data: { appointmentStatus: "Cancelled" },
        });

        // If it's a book appointment, restore the currentQuantity of books
        if (
          appointment.appointmentType === "Book" &&
          appointment.bookBorrowRecords.length > 0
        ) {
          for (const record of appointment.bookBorrowRecords) {
            await prisma.book.update({
              where: { isbn: record.isbn },
              data: {
                currentQuantity: {
                  increment: record.borrowQuantity,
                },
              },
            });
          }
        }
        return updatedAppointment;
      });
    }),

  // --- Admin Appointment Management ---
  adminListAllAppointments: adminProcedure
    .input(
      z.object({
        status: appointmentStatusSchema.optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        skip: z.number().int().min(0).default(0),
        take: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.AppointmentWhereInput = {};
      if (input.status) {
        where.appointmentStatus = input.status;
      }

      // FIX: Refactor date filter construction
      const dateFilter: Prisma.DateTimeFilter = {};
      if (input.dateFrom) {
        dateFilter.gte = new Date(input.dateFrom);
      }
      if (input.dateTo) {
        const dateToObj = new Date(input.dateTo);
        dateToObj.setHours(23, 59, 59, 999);
        dateFilter.lte = dateToObj;
      }
      if (Object.keys(dateFilter).length > 0) {
        where.appointmentDate = dateFilter;
      }

      const [appointments, totalCount] = await ctx.db.$transaction([
        ctx.db.appointment.findMany({
          where,
          skip: input.skip,
          take: input.take,
          orderBy: { appointmentDate: "desc" },
          include: {
            takenByStudent: { include: { user: true } },
            managedByStaff: { include: { user: true } },
            bookBorrowRecords: { include: { book: true } },
            sportAppointment: true,
            healthAppointment: true,
          },
        }),
        ctx.db.appointment.count({ where }),
      ]);
      return { appointments, totalCount };
    }),

  // --- Book Management (Admin only) ---
  listBooks: staffProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        skip: z.number().int().min(0).default(0),
        take: z.number().int().min(1).max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.BookWhereInput = {};
      if (input.searchTerm) {
        where.OR = [
          { title: { contains: input.searchTerm, mode: "insensitive" } },
          { author: { contains: input.searchTerm, mode: "insensitive" } },
          { isbn: { contains: input.searchTerm, mode: "insensitive" } },
        ];
      }

      const [books, totalCount] = await ctx.db.$transaction([
        ctx.db.book.findMany({
          where,
          skip: input.skip,
          take: input.take,
          orderBy: { title: "asc" },
        }),
        ctx.db.book.count({ where }),
      ]);
      return { books, totalCount };
    }),

  createBook: staffProcedure
    .input(bookManagementItemSchema)
    .mutation(async ({ ctx, input }) => {
      const existingBook = await ctx.db.book.findUnique({
        where: { isbn: input.isbn },
      });
      if (existingBook) {
        throw new Error(`Book with ISBN ${input.isbn} already exists.`);
      }
      return ctx.db.book.create({
        data: {
          isbn: input.isbn,
          title: input.title,
          author: input.author,
          quantityInStock: input.quantityInStock,
          currentQuantity: input.quantityInStock, // Initialize currentQuantity
        },
      });
    }),

  updateBook: staffProcedure
    .input(bookManagementItemSchema) // ISBN is part of the schema and used as ID in where clause
    .mutation(async ({ ctx, input }) => {
      const bookToUpdate = await ctx.db.book.findUnique({
        where: { isbn: input.isbn },
      });

      if (!bookToUpdate) {
        throw new Error(`Book with ISBN ${input.isbn} not found.`);
      }

      // Calculate how many books are currently effectively borrowed
      const borrowedCount =
        bookToUpdate.quantityInStock - bookToUpdate.currentQuantity;

      // New current quantity will be the new total stock minus those borrowed
      const newCurrentQuantity = input.quantityInStock - borrowedCount;

      if (newCurrentQuantity < 0) {
        throw new Error(
          "Updated total stock cannot be less than the number of currently borrowed books."
        );
      }

      return ctx.db.book.update({
        where: { isbn: input.isbn },
        data: {
          title: input.title,
          author: input.author,
          quantityInStock: input.quantityInStock, // This is the new total stock
          currentQuantity: newCurrentQuantity, // This is the new available stock
        },
      });
    }),

  deleteBook: staffProcedure
    .input(z.object({ isbn: z.string().min(1, "ISBN is required") }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if the book is part of any active (non-cancelled, non-completed) appointments
        const activeBorrows = await ctx.db.bookBorrowRecord.count({
          where: {
            isbn: input.isbn,
            appointment: {
              appointmentStatus: {
                notIn: ["Cancelled", "Completed"],
              },
            },
          },
        });

        if (activeBorrows > 0) {
          throw new Error(
            "Cannot delete this book. It is part of active appointment borrow records. Please cancel or complete these appointments first."
          );
        }

        // If no active borrows, proceed with deletion
        return await ctx.db.book.delete({
          where: { isbn: input.isbn },
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          // P2003 is foreign key constraint failure (Restrict)
          // This might still occur if the above check is not exhaustive
          // or if there are other relations with onDelete: Restrict
          if (e.code === "P2003") {
            throw new Error(
              "Cannot delete this book due to existing related records (e.g., borrow history). Ensure all associated data is handled."
            );
          }
        }
        // Re-throw other errors, including the custom error from the check above
        throw e;
      }
    }),

  // --- Book Listing for Reservation ---
  listAvailableBooks: protectedProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        skip: z.number().int().min(0).default(0),
        take: z.number().int().min(1).max(100).default(20), // Default to 20 books per page
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.BookWhereInput = {
        currentQuantity: { gt: 0 }, // Only show books with available quantity
      };
      if (input.searchTerm) {
        where.OR = [
          { title: { contains: input.searchTerm, mode: "insensitive" } },
          { author: { contains: input.searchTerm, mode: "insensitive" } },
          { isbn: { contains: input.searchTerm, mode: "insensitive" } },
        ];
      }

      const [books, totalCount] = await ctx.db.$transaction([
        ctx.db.book.findMany({
          where,
          skip: input.skip,
          take: input.take,
          orderBy: { title: "asc" },
          select: {
            // Select only necessary fields for listing
            isbn: true,
            title: true,
            author: true,
            currentQuantity: true,
            quantityInStock: true, // Good to show total stock too
          },
        }),
        ctx.db.book.count({ where }), // Count only available books
      ]);
      return { books, totalCount };
    }),
});
