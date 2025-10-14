import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ------------------------------
  // 1. Categories
  // ------------------------------
  const categoryNames = [
    "Birthdays", "Baby Showers", "Weddings", "Pink", "Blue",
    "Neutral", "Floral", "Adventure", "Classic", "Modern",
  ];

  const categories = [];
  for (const name of categoryNames) {
    const cat = await prisma.category.create({ data: { name } });
    categories.push(cat);
  }

  // ------------------------------
  // 2. Items
  // ------------------------------
  const itemsData = [
    { key: "chair", name: "Chair", basePrice: 50, unit: "pcs" },
    { key: "table", name: "Table", basePrice: 100, unit: "pcs" },
    { key: "balloon", name: "Balloon", basePrice: 2, unit: "pcs" },
    { key: "candle", name: "Candle", basePrice: 5, unit: "pcs" },
    { key: "lamp", name: "Lamp", basePrice: 30, unit: "pcs" },
    { key: "speaker", name: "Speaker", basePrice: 200, unit: "pcs" },
    { key: "tent", name: "Tent", basePrice: 500, unit: "pcs" },
    { key: "flower", name: "Flower bouquet", basePrice: 20, unit: "pcs" },
    { key: "rug", name: "Rug", basePrice: 80, unit: "pcs" },
    { key: "banner", name: "Banner", basePrice: 15, unit: "pcs" },
    { key: "streamer", name: "Streamer", basePrice: 3, unit: "pcs" },
    { key: "giftbag", name: "Gift Bag", basePrice: 8, unit: "pcs" },
    { key: "tablecloth", name: "Table Cloth", basePrice: 25, unit: "pcs" },
    { key: "napkins", name: "Napkins", basePrice: 5, unit: "pcs" },
    { key: "plates", name: "Plates", basePrice: 10, unit: "pcs" },
    { key: "cups", name: "Cups", basePrice: 5, unit: "pcs" },
    { key: "centerpiece", name: "Centerpiece", basePrice: 30, unit: "pcs" },
    { key: "photoBooth", name: "Photo Booth", basePrice: 300, unit: "pcs" },
    { key: "confetti", name: "Confetti", basePrice: 2, unit: "pcs" },
    { key: "cakeStand", name: "Cake Stand", basePrice: 40, unit: "pcs" },
  ];

  const items = [];
  for (const item of itemsData) {
    const it = await prisma.item.create({ data: item });
    items.push(it);
  }

  // ------------------------------
  // 3. Works
  // ------------------------------
  const worksData = Array.from({ length: 12 }).map((_, i) => ({
    title: `Work Setup ${i + 1}`,
    imageUrl: `https://picsum.photos/seed/work${i + 1}/500/300`,
    notes: `Dummy notes for work setup ${i + 1}`,
  }));

  const works = [];
  for (const work of worksData) {
    const w = await prisma.work.create({ data: work });
    works.push(w);
  }

  // ------------------------------
  // 4. Assign random categories to works
  // ------------------------------
  for (const work of works) {
    const shuffledCategories = categories.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const cat of shuffledCategories) {
      await prisma.workCategory.create({ data: { workId: work.id, categoryId: cat.id } });
    }
  }

  // ------------------------------
  // 5. Assign main items
  // ------------------------------
  for (const work of works) {
    const shuffledItems = items.sort(() => 0.5 - Math.random()).slice(0, 5);
    for (const item of shuffledItems) {
      const quantity = Math.floor(Math.random() * 20) + 1;
      await prisma.workItem.create({ data: { workId: work.id, itemId: item.id, quantity } });
    }
  }

  // ------------------------------
  // 6. Assign optional items
  // ------------------------------
  for (const work of works) {
    const shuffledItems = items.sort(() => 0.5 - Math.random()).slice(0, 3);
    for (const item of shuffledItems) {
      const quantity = Math.floor(Math.random() * 10) + 1;
      await prisma.workOptionalItem.create({ data: { workId: work.id, itemId: item.id, quantity } });
    }
  }

  console.log("✅ Dummy data seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
