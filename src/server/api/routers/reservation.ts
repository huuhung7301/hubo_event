// src/server/api/routers/reservation.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const reservationRouter = createTRPCRouter({
  // 🧩 Create a new reservation
  createReservation: publicProcedure
  .input(
    z.object({
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
        })
      ),
      optionalItems: z
        .array(
          z.object({
            key: z.string(),
            quantity: z.number().default(1),
            priceAtBooking: z.number(),
          })
        )
        .optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const totalPrice = [...input.items, ...(input.optionalItems ?? [])].reduce(
      (sum, i) => sum + i.priceAtBooking * i.quantity,
      0
    );

    const reservation = await ctx.db.reservation.create({
      data: {
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
});
