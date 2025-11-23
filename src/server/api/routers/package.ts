import type { get } from "http";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// WorkInputDTO schema (matches frontend)
const workInputSchema = z.object({
  id: z.number().nullable(),   // null when creating
  title: z.string(),
  imageUrl: z.string(),
  notes: z.string().optional().nullable(),
  categoryIds: z.array(z.number()),
  requiredItems: z.array(z.object({ itemId: z.number(), quantity: z.number() })),
  optionalItems: z.array(z.object({ itemId: z.number(), quantity: z.number() })),
});

// ---------------------------------------------
// WORK ROUTER
// ---------------------------------------------
export const packageRouter = createTRPCRouter({

    getWorkCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories;
  }),
  // ==========================================================
  // GET ALL WORKS (same resolved structure your frontend expects)
  // ==========================================================
  getAll: publicProcedure.query(async ({ ctx }) => {
    const works = await ctx.db.work.findMany({
      include: {
        categories: { include: { category: true } }, // WorkCategoryRelation[]
        items: { include: { item: true } },          // required items
        optionalItems: { include: { item: true } },  // optional items
      },
      orderBy: { id: "asc" },
    });

    return works.map((w) => ({
      id: w.id,
      title: w.title,
      imageUrl: w.imageUrl,
      notes: w.notes,
      categories: w.categories,
      items: w.items,
      optionalItems: w.optionalItems,

      // raw data to match WorkInputDTO again
      categoryIds: w.categories.map((c) => c.categoryId),
      requiredItemData: w.items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
      optionalItemData: w.optionalItems.map((i) => ({ itemId: i.itemId, quantity: i.quantity })),
    }));
  }),

  // ==========================================================
  // CREATE WORK
  // ==========================================================
  create: publicProcedure
    .input(workInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await ctx.db.work.create({
        data: {
          title: input.title,
          imageUrl: input.imageUrl,
          notes: input.notes,

          // categories M2M
          categories: {
            create: input.categoryIds.map((c) => ({
              category: { connect: { id: c } },
            })),
          },

          // required items
          items: {
            create: input.requiredItems.map((ri) => ({
              item: { connect: { id: ri.itemId } },
              quantity: ri.quantity,
            })),
          },

          // optional items
          optionalItems: {
            create: input.optionalItems.map((oi) => ({
              item: { connect: { id: oi.itemId } },
              quantity: oi.quantity,
            })),
          },
        },
      });

      return { id: created.id };
    }),

  // ==========================================================
  // UPDATE WORK
  // ==========================================================
  update: publicProcedure
    .input(workInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input.id) throw new Error("Work ID is required for update");

      const workId = input.id;

      // 1. Remove old relations
      await ctx.db.workCategory.deleteMany({ where: { workId } });
      await ctx.db.workItem.deleteMany({ where: { workId } });
      await ctx.db.workOptionalItem.deleteMany({ where: { workId } });

      // 2. Update core work data & recreate relations
      return ctx.db.work.update({
        where: { id: workId },
        data: {
          title: input.title,
          imageUrl: input.imageUrl,
          notes: input.notes,

          categories: {
            create: input.categoryIds.map((c) => ({
              category: { connect: { id: c } },
            })),
          },

          items: {
            create: input.requiredItems.map((ri) => ({
              item: { connect: { id: ri.itemId } },
              quantity: ri.quantity,
            })),
          },

          optionalItems: {
            create: input.optionalItems.map((oi) => ({
              item: { connect: { id: oi.itemId } },
              quantity: oi.quantity,
            })),
          },
        },
      });
    }),

  // ==========================================================
  // DELETE WORK
  // ==========================================================
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.work.delete({
        where: { id: input.id },
      });
      return true;
    }),
});
