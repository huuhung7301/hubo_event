import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

// Define the common structure for an item being reserved
const ReservationItemSchema = z.object({
  key: z.string(),
  quantity: z.number().default(1),
  priceAtBooking: z.number(),
});

// Define the structured 'extra' field schema
const ExtraSchema = z.object({
  deliveryFee: z.number().optional().default(0),
  // addOns now uses the strict ReservationItemSchema structure
  addOns: z.array(ReservationItemSchema).optional(),
});

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
  items: z.array(ReservationItemSchema).optional(),
  optionalItems: z.array(ReservationItemSchema).optional(),
  // FIX 1: Use the defined ExtraSchema instead of z.any()
  extra: ExtraSchema.optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional(),
  totalPrice: z.number().optional(),
});

type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

// The ReservationExtraSchema was redundant and is replaced by ExtraSchema
// const ReservationExtraSchema = z.object({ ... });

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

        items: z.array(ReservationItemSchema),
        optionalItems: z.array(ReservationItemSchema).optional(),

        // Use the strict ExtraSchema here
        extra: ExtraSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Calculate totalPrice

      // Base items and optional items
      let totalPrice = [...input.items, ...(input.optionalItems ?? [])].reduce(
        (sum, i) => sum + i.priceAtBooking * i.quantity,
        0,
      );

      // Access addOns array correctly and calculate price (matching items structure)
      const addOns = input.extra?.addOns ?? [];
      const addOnPrice = addOns.reduce(
        (sum, a) => sum + a.priceAtBooking * a.quantity,
        0,
      );
      totalPrice += addOnPrice;

      // Access deliveryFee correctly
      const deliveryFee = input.extra?.deliveryFee ?? 0;
      totalPrice += deliveryFee;

      // 2. Create the reservation record
      // FIX 2: Removed all 'as any' casts. TypeScript now infers the correct
      // type for items, optionalItems, and extra based on the Zod input and Prisma's JSON type handling.
      const reservation = await ctx.db.reservation.create({
        data: {
          userId: input.userId,
          workId: input.workId,
          customerName: input.customerName ?? null,
          customerEmail: input.customerEmail ?? null,
          customerPhone: input.customerPhone ?? null,
          notes: input.notes ?? null,
          totalPrice,
          items: input.items,
          optionalItems: input.optionalItems ?? [],

          reservationDate: input.reservationDate
            ? new Date(input.reservationDate)
            : null,
          postcode: input.postcode ?? null,

          extra: input.extra ?? {},
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

      // FIX 3: Remove unnecessary JSON serialization and rely on input types
      const dataToUpdate: Partial<Omit<UpdateReservationInput, "id">> = {
        ...rest,
        // Convert reservationDate string to ISO string for database
        reservationDate: rest.reservationDate
          ? new Date(rest.reservationDate).toISOString()
          : undefined,
        // Prisma handles JSON fields (items, optionalItems, extra) directly
        // Ensure 'extra' is passed as an object or undefined, not null
        extra: rest.extra, 
      };

      return ctx.db.reservation.update({
        where: { id },
        data: dataToUpdate,
      });
    }),
});