import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ------------------------------
  // 1. Create categories
  // ------------------------------
  const [furniture, decoration, lighting] = await Promise.all([
    prisma.category.create({ data: { name: "Furniture" } }),
    prisma.category.create({ data: { name: "Decoration" } }),
    prisma.category.create({ data: { name: "Lighting" } }),
  ]);

  // ------------------------------
  // 2. Create items
  // ------------------------------
  const [chair, table, balloon, candle, lamp] = await Promise.all([
    prisma.item.create({ data: { key: "chair", name: "Chair", basePrice: 50, unit: "pcs" } }),
    prisma.item.create({ data: { key: "table", name: "Table", basePrice: 100, unit: "pcs" } }),
    prisma.item.create({ data: { key: "balloon", name: "Balloon", basePrice: 2, unit: "pcs" } }),
    prisma.item.create({ data: { key: "candle", name: "Candle", basePrice: 5, unit: "pcs" } }),
    prisma.item.create({ data: { key: "lamp", name: "Lamp", basePrice: 30, unit: "pcs" } }),
  ]);

  // ------------------------------
  // 3. Create works
  // ------------------------------
  const [birthdaySetup, weddingSetup] = await Promise.all([
    prisma.work.create({
      data: {
        title: "Birthday Setup",
        imageUrl: "https://picsum.photos/seed/birthday/500/300", // replace with Supabase URL
        notes: "Setup for a small birthday party",
      },
    }),
    prisma.work.create({
      data: {
        title: "Wedding Setup",
        imageUrl: "https://picsum.photos/seed/wedding/500/300", // replace with Supabase URL
        notes: "Setup for a wedding event",
      },
    }),
  ]);

  // ------------------------------
  // 4. Assign categories to works
  // ------------------------------
  await prisma.workCategory.createMany({
    data: [
      { workId: birthdaySetup.id, categoryId: furniture.id },
      { workId: birthdaySetup.id, categoryId: decoration.id },
      { workId: weddingSetup.id, categoryId: furniture.id },
      { workId: weddingSetup.id, categoryId: decoration.id },
      { workId: weddingSetup.id, categoryId: lighting.id },
    ],
  });

  // ------------------------------
  // 5. Add main items to works
  // ------------------------------
  await prisma.workItem.createMany({
    data: [
      { workId: birthdaySetup.id, itemId: chair.id, quantity: 10 },
      { workId: birthdaySetup.id, itemId: table.id, quantity: 2 },
      { workId: weddingSetup.id, itemId: chair.id, quantity: 100 },
      { workId: weddingSetup.id, itemId: table.id, quantity: 20 },
    ],
  });

  // ------------------------------
  // 6. Add optional items to works
  // ------------------------------
  await prisma.workOptionalItem.createMany({
    data: [
      { workId: birthdaySetup.id, itemId: balloon.id, quantity: 20 },
      { workId: birthdaySetup.id, itemId: candle.id, quantity: 5 },
      { workId: weddingSetup.id, itemId: balloon.id, quantity: 200 },
      { workId: weddingSetup.id, itemId: lamp.id, quantity: 50 },
    ],
  });

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
