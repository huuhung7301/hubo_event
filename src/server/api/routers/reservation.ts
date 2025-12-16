import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
const updateReservationSchema = z.object({
  id: z.number(),
  workId: z.number().optional(),
  userId: z.string().optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
  phoneNumber: z.string().optional(),
  notes: z.string().optional(),
  reservationDate: z.string().datetime().optional(),
  setupTime: z.string().optional(),
  address: z.string().optional(),
  suburb: z.string().optional(),
  postcode: z.string().optional(),
  items: z
    .array(
      z.object({
        key: z.string(),
        quantity: z.number().default(1),
        priceAtBooking: z.number(),
      }),
    )
    .optional(),
  optionalItems: z
    .array(
      z.object({
        key: z.string(),
        quantity: z.number().default(1),
        priceAtBooking: z.number(),
      }),
    )
    .optional(),
  extra: z.any().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional(),
  totalPrice: z.number().optional(),
});

type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
const ReservationExtraSchema = z.object({
  addOns: z
    .array(
      // 🚀 FIX: Using z.record(z.unknown()) to represent a flexible JSON object
      // This satisfies the compiler that it's a strongly-typed, generic object
      // without requiring explicit fields like 'key' or 'title'.
      z.record(z.unknown()),
    )
    .optional(),

  deliveryFee: z.number().optional(),
});
export const reservationRouter = createTRPCRouter({
  // 🧩 Create a new reservation

  createReservation: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        workId: z.number(),
        customerName: z.string().optional(),
        customerEmail: z.string().optional(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),

        reservationDate: z.string().datetime().optional(),
        postcode: z.string().optional(),

        items: z.array(
          z.object({
            key: z.string(),
            quantity: z.number().default(1),
            priceAtBooking: z.number(),
          }),
        ),
        optionalItems: z
          .array(
            z.object({
              key: z.string(),
              quantity: z.number().default(1),
              priceAtBooking: z.number(),
            }),
          )
          .optional(),

        // FIX 1: Redefine 'extra' as an OBJECT containing deliveryFee and addOns array
        extra: z
          .object({
            deliveryFee: z.number().optional().default(0),
            addOns: z
              .array(
                z.object({
                  key: z.string(),
                  quantity: z.number().default(1),
                  priceAtBooking: z.number(),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Calculate totalPrice

      // Base items and optional items
      let totalPrice = [...input.items, ...(input.optionalItems ?? [])].reduce(
        (sum, i) => sum + i.priceAtBooking * i.quantity,
        0,
      );

      // FIX 2: Access addOns array correctly and calculate price (matching items structure)
      const addOns = input.extra?.addOns ?? [];
      const addOnPrice = addOns.reduce(
        (sum, a) => sum + a.priceAtBooking * a.quantity,
        0,
      );
      totalPrice += addOnPrice;

      // FIX 3: Access deliveryFee correctly
      const deliveryFee = input.extra?.deliveryFee ?? 0;
      totalPrice += deliveryFee;

      // 2. Create the reservation record
      const reservation = await ctx.db.reservation.create({
        data: {
          userId: input.userId,
          workId: input.workId,
          customerName: input.customerName ?? null,
          customerEmail: input.customerEmail ?? null,
          customerPhone: input.customerPhone ?? null,
          notes: input.notes ?? null,
          totalPrice,
          // NOTE: items and optionalItems should be compatible with your DB JSON/Array types
          items: input.items as any,
          optionalItems: input.optionalItems ?? ([] as any),

          reservationDate: input.reservationDate
            ? new Date(input.reservationDate)
            : null,
          postcode: input.postcode ?? null,

          // FIX 4: Save the entire structured 'extra' object
          extra: (input.extra as any) ?? {},
        },
      });

      return reservation;
    }),

  // 🧩 Get a single reservation by ID
  getReservation: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const reservation = await ctx.db.reservation.findUnique({
        where: { id: input.id },
        include: {
          work: true, // ✅ also load related work info if you want
        },
      });
      return reservation;
    }),

  // 🧩 Get all reservations for a specific user
  getUserReservations: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const reservations = await ctx.db.reservation.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: "desc" },
        include: {
          work: true,
        },
      });
      return reservations;
    }),

  getAvailability: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    // 1. Get all reservations in range
    const reservations = await ctx.db.reservation.findMany({
      where: {
        reservationDate: {
          gte: today.toISOString(), // Assuming date is stored as ISO String or Date
          lte: threeMonthsLater.toISOString(),
        },
      },
      select: {
        reservationDate: true, // We only need the date to count
      },
    });

    // 2. Group and count
    const counts: Record<string, number> = {};

    reservations.forEach((res) => {
      // Skip null reservationDate values
      if (!res.reservationDate) return;
      // Ensure we just get the YYYY-MM-DD part if stored as full datetime
      const iso = new Date(res.reservationDate).toISOString();
      const dateKey = iso.split("T")[0];
      if (!dateKey) return;
      counts[dateKey] = (counts[dateKey] ?? 0) + 1;
    });

    return counts;
  }),

  updateReservation: publicProcedure
    .input(updateReservationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const dataToUpdate: Partial<Omit<UpdateReservationInput, "id">> = {
        ...rest,
        reservationDate: rest.reservationDate
          ? new Date(rest.reservationDate).toISOString()
          : undefined,
        extra: rest.extra ? JSON.parse(JSON.stringify(rest.extra)) : undefined,
      };

      return ctx.db.reservation.update({
        where: { id },
        data: dataToUpdate,
      });
    }),
});
