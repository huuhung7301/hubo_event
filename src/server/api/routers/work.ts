import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const workRouter = createTRPCRouter({
  // 🧭 Get all categories
  getAllCategories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.category.findMany({
      select: { name: true },
    });
    return categories.map((c) => c.name);
  }),

  // 🧭 Get all works with related data
  getAllWorks: publicProcedure.query(async ({ ctx }) => {
    const works = await ctx.db.work.findMany({
      where: {id: {not: 0}},
      include: {
        categories: { include: { category: true } },
        items: { include: { item: true } },
        optionalItems: { include: { item: true } },
      },
    });

    return works.map((w) => ({
      id: w.id,
      title: w.title,
      src: w.imageUrl,
      categories: w.categories.map((wc) => wc.category.name),
      items: w.items.map((wi) => ({
        key: wi.item.key,
        name: wi.item.name,
        price: wi.item.basePrice,
        quantity: wi.quantity,
      })),
      optionalItems: w.optionalItems.map((wo) => ({
        key: wo.item.key,
        quantity: wo.quantity,
        name: wo.item.name,
        price: wo.item.basePrice,
      })),
      notes: w.notes ?? "",
    }));
  }),

  // 🧩 Add a new work with categories, items, and optional items
  addWork: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        imageUrl: z.string().url(),
        notes: z.string().optional(),
        categories: z.array(z.string()).optional(), // category names
        items: z
          .array(
            z.object({
              key: z.string(),
              quantity: z.number().default(1),
            }),
          )
          .optional(),
        optionalItems: z
          .array(
            z.object({
              key: z.string(),
              quantity: z.number().default(1),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 🧱 Create or connect categories
      const connectCategories = input.categories?.map((name) => ({
        category: {
          connectOrCreate: {
            where: { name },
            create: { name },
          },
        },
      }));

      // 🧱 Find item IDs from keys
      const allKeys = [
        ...(input.items?.map((i) => i.key) ?? []),
        ...(input.optionalItems?.map((i) => i.key) ?? []),
      ];

      const items = await ctx.db.item.findMany({
        where: { key: { in: allKeys } },
      });

      const itemMap = new Map(items.map((i) => [i.key, i.id]));

      // 🔴 Throw error if any key not found
      for (const key of allKeys) {
        if (!itemMap.has(key)) {
          throw new Error(`Item with key "${key}" not found`);
        }
      }

      // 🧱 Create the Work with relations
      const newWork = await ctx.db.work.create({
        data: {
          title: input.title,
          imageUrl: input.imageUrl,
          notes: input.notes ?? null,
          categories: {
            create: connectCategories ?? [],
          },
          items: {
            create:
              input.items?.map((i) => ({
                itemId: itemMap.get(i.key)!,
                quantity: i.quantity,
              })) ?? [],
          },
          optionalItems: {
            create:
              input.optionalItems?.map((i) => ({
                itemId: itemMap.get(i.key)!,
                quantity: i.quantity,
              })) ?? [],
          },
        },
        include: {
          categories: { include: { category: true } },
          items: { include: { item: true } },
          optionalItems: { include: { item: true } },
        },
      });

      return newWork;
    }),
});
