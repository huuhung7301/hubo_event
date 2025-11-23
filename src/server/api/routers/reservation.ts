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
  items: z.array(
    z.object({
      key: z.string(),
      quantity: z.number().default(1),
      priceAtBooking: z.number(),
    })
  ).optional(),
  optionalItems: z.array(
    z.object({
      key: z.string(),
      quantity: z.number().default(1),
      priceAtBooking: z.number(),
    })
  ).optional(),
  extra: z.any().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional(),
  totalPrice: z.number().optional(),
});

type UpdateReservationInput = z.infer<typeof updateReservationSchema>;

export const reservationRouter = createTRPCRouter({
  // 🧩 Create a new reservation
  createReservation: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(), // ✅ new field
        workId: z.number(),
        customerName: z.string().optional(),
        customerEmail: z.string().optional(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const totalPrice = [
        ...input.items,
        ...(input.optionalItems ?? []),
      ].reduce((sum, i) => sum + i.priceAtBooking * i.quantity, 0);

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

  updateReservation: publicProcedure
    .input(updateReservationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const dataToUpdate: Partial<Omit<UpdateReservationInput, "id">> = {
        ...rest,
        reservationDate: rest.reservationDate
          ? new Date(rest.reservationDate).toISOString()
          : undefined,
      };

      return ctx.db.reservation.update({
        where: { id },
        data: dataToUpdate,
      });
    }),
});
