import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { Resend } from 'resend';

const resend = new Resend('re_MFv1vW2y_ed5pfy1SyRV4eKjpv8pviVfw');

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
        extra: ExtraSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Calculate totalPrice
      let totalPrice = [...input.items, ...(input.optionalItems ?? [])].reduce(
        (sum, i) => sum + i.priceAtBooking * i.quantity,
        0,
      );

      const addOns = input.extra?.addOns ?? [];
      const addOnPrice = addOns.reduce(
        (sum, a) => sum + a.priceAtBooking * a.quantity,
        0,
      );
      totalPrice += addOnPrice;
      
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
          items: input.items,
          optionalItems: input.optionalItems ?? [],
          reservationDate: input.reservationDate ? new Date(input.reservationDate) : null,
          postcode: input.postcode ?? null,
          extra: input.extra ?? {},
        },
      });

      // 3. Send Notification Email to yourself
      try {
        await resend.emails.send({
          from: 'Reservations <onboarding@resend.dev>',
          to: 'huuhung7301@gmail.com',
          subject: `✨ New Reservation: ${input.customerName ?? 'Guest'}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.5;">
              <h2>New Booking Received!</h2>
              <p><strong>Customer:</strong> ${input.customerName ?? 'N/A'}</p>
              <p><strong>Phone:</strong> ${input.customerPhone ?? 'N/A'}</p>
              <p><strong>Postcode:</strong> ${input.postcode ?? 'N/A'}</p>
              <p><strong>Total Price:</strong> $${totalPrice.toFixed(2)}</p>
              <hr />
              <p>Logged in via Clerk: ${input.userId ? 'Yes' : 'No'}</p>
            </div>
          `
        });
      } catch (error) {
        // Log the error but don't break the user experience
        console.error("Failed to send admin notification email:", error);
      }

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
        extra: rest.extra, 
      };

      const updatedReservation = await ctx.db.reservation.update({
        where: { id },
        data: dataToUpdate,
      });

      // Send Update Notification
      try {
        await resend.emails.send({
          from: 'Reservations <onboarding@resend.dev>',
          to: 'huuhung7301@gmail.com',
          subject: `🔄 Reservation Updated: #${id}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #2563eb;">Reservation #${id} has been updated</h2>
              <p><strong>Customer:</strong> ${updatedReservation.customerName ?? 'N/A'}</p>
              <p><strong>New Date:</strong> ${updatedReservation.reservationDate ? updatedReservation.reservationDate.toLocaleDateString() : 'No change'}</p>
              <p><strong>Total Price:</strong> $${updatedReservation.totalPrice.toFixed(2)}</p>
              <hr style="border: 0; border-top: 1px solid #eee;" />
              <p style="font-size: 0.9em; color: #666;">
                Check the updated details in your admin dashboard.
              </p>
            </div>
          `
        });
      } catch (error) {
        console.error("Failed to send update notification email:", error);
      }

      return updatedReservation;
    }),
});