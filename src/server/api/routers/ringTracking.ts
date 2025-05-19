import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
  adminProcedure,
  staffProcedure,
} from "@/server/api/trpc";
import { Prisma } from "@prisma/client";

// Placeholder for Decimal type if needed for latitude/longitude, Prisma handles this.
// For Zod, z.number() is usually sufficient unless specific precision is required for validation.
const decimalSchema = z.preprocess(
  (val) => (typeof val === "string" ? Number.parseFloat(val) : val),
  z.number()
);
const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM format

export const ringTrackingRouter = createTRPCRouter({
  // --- Route Management --- (Section 3.4.1 PRD)
  createRoute: staffProcedure
    .input(
      z.object({
        routeName: z.string().min(1),
        departureTimes: z.array(z.string().regex(timeRegex)).optional(), // e.g., ["09:00", "10:30"]
        // routeStations: z.array(z.object({ stationId: z.string().uuid(), stopOrder: z.number().int().positive() })).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.route.create({
        data: {
          routeName: input.routeName,
          departureTimes: input.departureTimes?.length
            ? {
                create: input.departureTimes.map((time) => ({
                  departureTime: new Date(`1970-01-01T${time}:00Z`),
                })),
              }
            : undefined,
          // RouteStation creation would be more complex, likely managed separately or via updateRoute
        },
        include: { departureTimes: true },
      });
    }),

  listRoutes: protectedProcedure
    .input(
      z.object({
        filterByName: z.string().optional(),
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.RouteWhereInput = {};
      if (input.filterByName) {
        where.routeName = { contains: input.filterByName, mode: "insensitive" };
      }
      const routes = await ctx.db.route.findMany({
        where,
        include: {
          departureTimes: { orderBy: { departureTime: "asc" } },
          routeStations: {
            include: { station: true },
            orderBy: { stopOrder: "asc" },
          },
          managedByStaff: {
            include: {
              staff: {
                include: {
                  user: {
                    select: { id: true, name: true, fName: true, lName: true },
                  },
                },
              },
            },
            take: 5,
          }, // Show a few managing staff
        },
        take: input.take,
        skip: input.skip,
        orderBy: { routeName: "asc" },
      });
      const totalRoutes = await ctx.db.route.count({ where });
      return { routes, totalCount: totalRoutes };
    }),

  getRoute: protectedProcedure
    .input(z.object({ routeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.route.findUniqueOrThrow({
        where: { routeId: input.routeId },
        include: {
          departureTimes: { orderBy: { departureTime: "asc" } },
          routeStations: {
            include: { station: true },
            orderBy: { stopOrder: "asc" },
          },
          managedByStaff: {
            include: {
              staff: {
                select: {
                  user: {
                    select: { id: true, name: true, fName: true, lName: true },
                  },
                },
              },
            },
          },
          drivenByBuses: { include: { bus: true }, take: 5 }, // Added to see some buses on this route
          userFavorites: {
            include: { user: { select: { id: true, name: true } } },
            take: 5,
          }, // Added to see some users who favorited
        },
      });
    }),

  updateRoute: staffProcedure
    .input(
      z.object({
        routeId: z.string().uuid(),
        routeName: z.string().min(1).optional(),
        departureTimes: z.array(z.string().regex(timeRegex)).optional(), // Completely replaces existing times
        // routeStations (linking stations with stop orders) is a more complex update:
        // Could be an array of { stationId: string, stopOrder: int } to replace all,
        // or specific add/remove/reorder operations.
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { routeId, departureTimes, routeName } = input;
      return ctx.db.$transaction(async (prisma) => {
        const updateData: Prisma.RouteUpdateInput = {};
        if (routeName) {
          updateData.routeName = routeName;
        }
        if (departureTimes !== undefined) {
          await prisma.routeDepartureTime.deleteMany({ where: { routeId } });
          if (departureTimes.length > 0) {
            updateData.departureTimes = {
              create: departureTimes.map((time) => ({
                departureTime: new Date(`1970-01-01T${time}:00Z`),
              })),
            };
          }
        }
        return prisma.route.update({
          where: { routeId },
          data: updateData,
          include: {
            departureTimes: true,
            routeStations: {
              include: { station: true },
              orderBy: { stopOrder: "asc" },
            },
          },
        });
      });
    }),

  deleteRoute: adminProcedure // Routes are core, admin to delete
    .input(z.object({ routeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Deleting a route will cascade to RouteDepartureTime, UserFavoriteRoute, StaffManagesRoute, BusDrivesRoute, RouteStation
      return ctx.db.route.delete({ where: { routeId: input.routeId } });
    }),

  // TODO: Add procedures for RouteDepartureTime and RouteStation if needed separately

  // --- Station Management --- (Section 3.4.2 PRD)
  createStation: staffProcedure
    .input(
      z.object({
        stationName: z.string().min(1),
        stationLatitude: decimalSchema,
        stationLongitude: decimalSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.station.create({ data: input });
    }),

  listStations: protectedProcedure
    .input(
      z.object({
        filterByName: z.string().optional(),
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.StationWhereInput = {};
      if (input.filterByName) {
        where.stationName = {
          contains: input.filterByName,
          mode: "insensitive",
        };
      }
      const stations = await ctx.db.station.findMany({
        where,
        orderBy: { stationName: "asc" },
        take: input.take,
        skip: input.skip,
      });
      const totalStations = await ctx.db.station.count({ where });
      return { stations, totalCount: totalStations };
    }),

  getStation: protectedProcedure
    .input(z.object({ stationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.station.findUniqueOrThrow({
        where: { stationId: input.stationId },
        include: {
          routeStations: {
            include: { route: true },
            orderBy: { route: { routeName: "asc" } },
            take: 10,
          },
        }, // Show routes serving this station
      });
    }),

  updateStation: staffProcedure
    .input(
      z.object({
        stationId: z.string().uuid(),
        stationName: z.string().min(1).optional(),
        stationLatitude: decimalSchema.optional(),
        stationLongitude: decimalSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { stationId, ...data } = input;
      return ctx.db.station.update({ where: { stationId }, data });
    }),

  deleteStation: adminProcedure // Stations are core, admin to delete
    .input(z.object({ stationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Deleting station will cascade to RouteStation
      // Consider if station is part of any route before deleting (RouteStation count)
      const linkedRoutes = await ctx.db.routeStation.count({
        where: { stationId: input.stationId },
      });
      if (linkedRoutes > 0) {
        throw new Error(
          `Cannot delete station. It is part of ${linkedRoutes} route(s). Remove from routes first.`
        );
      }
      return ctx.db.station.delete({ where: { stationId: input.stationId } });
    }),

  // Procedure to link/update stations for a route (M:N RouteStation)
  updateRouteStations: staffProcedure
    .input(
      z.object({
        routeId: z.string().uuid(),
        stations: z
          .array(
            z.object({
              stationId: z.string().uuid(),
              stopOrder: z.number().int().positive(),
            })
          )
          .min(1), // Must provide at least one station
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { routeId, stations } = input;
      // Ensure unique stop orders
      const stopOrders = stations.map((s) => s.stopOrder);
      if (new Set(stopOrders).size !== stopOrders.length) {
        throw new Error("Stop orders must be unique for a route.");
      }

      return ctx.db.$transaction(async (prisma) => {
        // Delete existing station links for this route
        await prisma.routeStation.deleteMany({ where: { routeId } });
        // Create new links
        await prisma.routeStation.createMany({
          data: stations.map((s) => ({ ...s, routeId })),
        });
        return prisma.route.findUniqueOrThrow({
          where: { routeId },
          include: {
            routeStations: {
              include: { station: true },
              orderBy: { stopOrder: "asc" },
            },
          },
        });
      });
    }),

  // --- Bus Management --- (Section 3.4.3 PRD)
  // Assuming updateBusLocation would be called by a trusted service/system, not a typical user role.
  // Potentially a separate, more restricted procedure or a non-tRPC endpoint for IoT devices.
  createOrUpdateBus: staffProcedure
    .input(
      z.object({
        vehicleId: z.string().min(1),
        liveLatitude: decimalSchema.optional(),
        liveLongitude: decimalSchema.optional(),
        // routeIds: z.array(z.string().uuid()).optional() // For linking bus to routes via BusDrivesRoute
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { vehicleId, ...data } = input;
      return ctx.db.bus.upsert({
        where: { vehicleId },
        create: { vehicleId, ...data },
        update: data,
        include: { drivesRoutes: { include: { route: true } } }, // Reverted to drivesRoutes
      });
    }),

  listBuses: protectedProcedure
    .input(
      z.object({
        take: z.number().int().optional().default(10),
        skip: z.number().int().optional().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const buses = await ctx.db.bus.findMany({
        include: { drivesRoutes: { include: { route: true } } }, // Reverted to drivesRoutes
        take: input.take,
        skip: input.skip,
        orderBy: { vehicleId: "asc" },
      });
      const totalCount = await ctx.db.bus.count();
      return { buses, totalCount };
    }),

  getBus: protectedProcedure
    .input(z.object({ vehicleId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.bus.findUniqueOrThrow({
        where: { vehicleId: input.vehicleId },
        include: { drivesRoutes: { include: { route: true } } }, // Reverted to drivesRoutes
      });
    }),

  deleteBus: adminProcedure
    .input(z.object({ vehicleId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Cascades should handle BusDrivesRoute
      return ctx.db.bus.delete({ where: { vehicleId: input.vehicleId } });
    }),

  // Link Bus to Routes
  updateBusRoutes: staffProcedure
    .input(
      z.object({
        vehicleId: z.string().min(1),
        routeIds: z.array(z.string().uuid()), // Full list of routes this bus drives
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (prisma) => {
        await prisma.busDrivesRoute.deleteMany({
          where: { vehicleId: input.vehicleId },
        });
        if (input.routeIds.length > 0) {
          await prisma.busDrivesRoute.createMany({
            data: input.routeIds.map((routeId) => ({
              vehicleId: input.vehicleId,
              routeId,
            })),
          });
        }
        return prisma.bus.findUniqueOrThrow({
          where: { vehicleId: input.vehicleId },
          include: { drivesRoutes: { include: { route: true } } }, // Reverted to drivesRoutes
        });
      });
    }),

  getLiveBusLocations: protectedProcedure
    .input(
      z.object({
        routeId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const whereClause: Prisma.BusWhereInput = {
        liveLatitude: { not: null }, // Only buses with a reported latitude
        liveLongitude: { not: null }, // Only buses with a reported longitude
        ...(input.routeId && {
          drivesRoutes: {
            // Reverted to drivesRoutes
            some: { routeId: input.routeId },
          },
        }),
      };

      return ctx.db.bus.findMany({
        where: whereClause,
        include: {
          drivesRoutes: input.routeId // Reverted to drivesRoutes
            ? { where: { routeId: input.routeId }, include: { route: true } }
            : { include: { route: true }, take: 1 }, // Show one route if not filtering by specific route
        },
      });
    }),

  // getBusETA: Placeholder - very complex, involves route path, live location, traffic, etc.
  getBusETA: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string().min(1),
        stationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log(
        `Calculating ETA for bus ${input.vehicleId} to station ${input.stationId}`
      );
      // 1. Get bus live location.
      // 2. Get station location.
      // 3. Get route path for the bus (from BusDrivesRoute, then RouteStation for stop order).
      // 4. Calculate distance along path and estimate time based on average speed / historical data.
      // This is a significant feature, returning placeholder.
      return {
        vehicleId: input.vehicleId,
        stationId: input.stationId,
        etaMinutes: Math.floor(Math.random() * 15) + 1,
        etaTime: new Date(
          Date.now() + (Math.floor(Math.random() * 15) + 1) * 60000
        ).toISOString(),
      };
    }),

  // --- User Favorite Route Management --- (Section 3.4.4 PRD)
  addFavoriteRoute: protectedProcedure
    .input(z.object({ routeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // Use upsert to handle if it's already a favorite, ensure isFavorite is true.
      // The schema has @@map("FAVORITE_ROUTES") and fields userId, routeId, isFavorite
      return ctx.db.userFavoriteRoute.upsert({
        where: { userId_routeId: { userId, routeId: input.routeId } },
        create: { userId, routeId: input.routeId, isFavorite: true },
        update: { isFavorite: true }, // If it existed but was marked not favorite
        include: { route: true },
      });
    }),

  listFavoriteRoutes: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.db.userFavoriteRoute.findMany({
      where: { userId, isFavorite: true }, // Only list those marked as favorite
      include: {
        route: {
          include: {
            departureTimes: true,
            routeStations: {
              include: { station: true },
              orderBy: { stopOrder: "asc" },
            },
          },
        },
      },
      orderBy: { route: { routeName: "asc" } },
    });
  }),

  removeFavoriteRoute: protectedProcedure // Effectively marks as not favorite, or deletes record
    .input(z.object({ routeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // Option 1: Mark as not favorite
      // return ctx.db.userFavoriteRoute.update({
      //   where: { userId_routeId: { userId, routeId: input.routeId } },
      //   data: { isFavorite: false },
      // });
      // Option 2: Delete the record (more aligned with "remove")
      try {
        return await ctx.db.userFavoriteRoute.delete({
          where: { userId_routeId: { userId, routeId: input.routeId } },
        });
      } catch (error) {
        // Handle case where record might not exist (e.g., already removed)
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2025"
        ) {
          return { message: "Favorite route not found or already removed." };
        }
        throw error;
      }
    }),
});
