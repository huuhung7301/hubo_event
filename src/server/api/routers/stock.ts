import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { createClient } from "@supabase/supabase-js";

// ---- Supabase client ----
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // server-only key
);

export const stockRouter = createTRPCRouter({
  getCategories: publicProcedure.query(({ ctx }) => {
    return ctx.db.itemCategory.findMany({ orderBy: { name: "asc" } });
  }),
  // ===========================
  // GET ALL ITEMS (with filter)
  // ===========================
  getAll: publicProcedure
    .input(
      z
        .object({
          keyword: z.string().optional(),
          categoryId: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { keyword, categoryId } = input ?? {};

      return ctx.db.item.findMany({
        where: {
          AND: [
            keyword
              ? {
                  OR: [
                    { name: { contains: keyword, mode: "insensitive" } },
                    { key: { contains: keyword, mode: "insensitive" } },
                  ],
                }
              : {},
            categoryId ? { categoryId } : {},
          ],
        },
        include: { category: true },
        orderBy: { name: "asc" },
      });
    }),

  getByKey: publicProcedure
    .input(z.object({ key: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db.item.findUnique({
        where: { key: input.key },
        include: { category: true }, // Include category details
      });

      return item;
    }),

  getByCategory: publicProcedure
    .input(
      z.object({
        categoryId: z.number().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.item.findMany({
        where: {
          categoryId: input.categoryId,
        },
        include: { category: true },
        orderBy: { name: "asc" },
      });
    }),
  // ===========================
  // CREATE ITEM
  // ===========================
  create: publicProcedure
    .input(
      z.object({
        key: z.string().min(1),
        name: z.string().min(1),
        basePrice: z.number(),
        unit: z.string().optional(),
        categoryId: z.number().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.item.create({
        data: {
          key: input.key,
          name: input.name,
          basePrice: input.basePrice,
          unit: input.unit,
          categoryId: input.categoryId ?? null,
          imageUrl: input.imageUrl ?? null,
        },
      });
    }),

  // ===========================
  // UPDATE ITEM
  // ===========================
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        key: z.string().min(1),
        name: z.string().min(1),
        basePrice: z.number(),
        unit: z.string().optional(),
        categoryId: z.number().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      return ctx.db.item.update({
        where: { id },
        data: {
          ...rest,
          categoryId: rest.categoryId ?? null,
        },
      });
    }),

  // ===========================
  // DELETE ITEM
  // ===========================
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.item.delete({
        where: { id: input.id },
      });
      return true;
    }),

  // ===========================
  // SUPABASE IMAGE UPLOAD
  // ===========================
  uploadImage: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        base64: z.string(), // frontend sends Base64 string
      }),
    )
    .mutation(async ({ input }) => {
      const { fileName, base64, fileType } = input;

      // 1. Sanitize filename: remove spaces, colons, and unsafe characters
      const sanitizedFileName = fileName
        .replace(/\s+/g, "_") // replace spaces with underscores
        .replace(/[:]/g, "-") // replace colons with dash
        .replace(/[^a-zA-Z0-9._-]/g, ""); // remove any other unsafe chars

      // 2. Create unique file path
      const filePath = `items/${Date.now()}-${sanitizedFileName}`;

      // 3. Convert base64 → buffer
      const buffer = Buffer.from(
        base64.replace(/^data:.*;base64,/, ""),
        "base64",
      );

      // 4. Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("hubo")
        .upload(filePath, buffer, { contentType: fileType });

      if (error) throw new Error(error.message);

      // 5. Get public URL
      const { publicUrl } = supabase.storage
        .from("hubo")
        .getPublicUrl(filePath).data;

      return { url: publicUrl };
    }),
});
