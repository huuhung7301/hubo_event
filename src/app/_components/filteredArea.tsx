"use client";

import { useState } from "react";
import PackageCard from "./packageCard";
import { itemsCatalog } from "./catalog";

const categories = [
  "Birthdays",
  "Baby Showers",
  "Weddings",
  "Pink",
  "Blue",
  "Neutral",
  "Floral",
  "Adventure",
  "Classic",
  "Modern",
];

type PriceRange = { label: string; min: number; max: number };

const priceRanges: PriceRange[] = [
  { label: "$0-$200", min: 0, max: 200 },
  { label: "$200-$500", min: 200, max: 500 },
  { label: "$500+", min: 500, max: Infinity },
];

const works = [
  {
    id: 1,
    categories: ["Birthdays", "Classic"],
    title: "Bear Explorer Balloon Setup",
    src: "https://picsum.photos/id/1015/500/500",
    items: [
      { key: "balloonGarland", quantity: 1 },
      { key: "backdropArch", quantity: 1 },
      { key: "teddyBear", quantity: 1 },
      { key: "hotAirBalloon", quantity: 1 },
      { key: "rocket", quantity: 1 },
      { key: "airplaneTeddy", quantity: 1 },
      { key: "cakePlinth", quantity: 1 },
    ],
    optionalItems: [
      { key: "neonSign", quantity: 1 },
      { key: "extraBalloons", quantity: 1 },
    ],
    notes: "Color palette can be customized. Setup & pack-down included.",
  },
  {
    id: 2,
    categories: ["Baby Showers"],
    title: "Dreamy Cloud Setup",
    src: "https://picsum.photos/id/1011/500/500",
    items: [
      { key: "balloonGarland", quantity: 1 },
      { key: "backdropArch", quantity: 1 },
    ],
    optionalItems: [{ key: "extraBalloons", quantity: 1 }],
    notes: "Perfect for baby showers. Includes setup & pack-down.",
  },
  {
    id: 3,
    categories: ["Weddings", "Baby Showers"],
    title: "Romantic Floral Arch",
    src: "https://picsum.photos/id/1016/500/500",
    items: [
      { key: "backdropArch", quantity: 1 },
      { key: "cakePlinth", quantity: 2 },
    ],
    optionalItems: [{ key: "neonSign", quantity: 1 }],
    notes: "Flowers available in multiple color palettes.",
  },
];

function mapItems(items: { key: string; quantity: number }[]) {
  return items.map((item) => {
    const catalogItem = itemsCatalog[item.key];
    if (!catalogItem) throw new Error(`Item ${item.key} not found in catalog`);
    return {
      name: catalogItem.name,
      price: catalogItem.basePrice * (item.quantity || 1),
      quantity: item.quantity || 1,
      unit: catalogItem.unit,
    };
  });
}

export default function FilteredArea() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<PriceRange[]>([]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const togglePrice = (range: PriceRange) => {
    setSelectedPrices((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range],
    );
  };

  const filteredWorks = works.filter((work) => {
    const mappedItems = mapItems(work.items);
    const mappedOptionalItems = mapItems(work.optionalItems);
    const totalPrice =
      mappedItems.reduce((sum, i) => sum + i.price, 0) +
      mappedOptionalItems.reduce((sum, i) => sum + i.price, 0);

    // Multi-select category match
    const matchesCategory =
      selectedCategories.length === 0 ||
      work.categories.some((cat) => selectedCategories.includes(cat));

    // Multi-select price match
    const matchesPrice =
      selectedPrices.length === 0 ||
      selectedPrices.some(
        (range) => totalPrice >= range.min && totalPrice <= range.max,
      );

    return matchesCategory && matchesPrice;
  });

  return (
    <div className="mx-auto w-full lg:max-w-[80%]">
      <h2 className="mb-8 text-5xl font-bold">Our works</h2>

      {/* Categories */}
      <div className="mb-6 flex flex-wrap gap-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`rounded-full border px-6 py-2 ${
              selectedCategories.includes(cat)
                ? "border-black bg-black text-white"
                : "border-gray-400 text-black hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Price Ranges */}
      <div className="mb-10 flex flex-wrap gap-4">
        {priceRanges.map((range) => (
          <button
            key={range.label}
            onClick={() => togglePrice(range)}
            className={`rounded-full border px-6 py-2 ${
              selectedPrices.includes(range)
                ? "border-black bg-black text-white"
                : "border-gray-400 text-black hover:bg-gray-100"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Works Gallery */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {filteredWorks.map((work) => {
          const mappedItems = mapItems(work.items);
          const mappedOptionalItems = mapItems(work.optionalItems);
          const totalPrice =
            mappedItems.reduce((sum, i) => sum + i.price, 0) +
            mappedOptionalItems.reduce((sum, i) => sum + i.price, 0);

          return (
            <PackageCard
              key={work.id}
              src={work.src}
              title={work.title}
              categories={work.categories}
              items={mappedItems}
              optionalItems={mappedOptionalItems}
              totalPrice={totalPrice}
              notes={work.notes}
            />
          );
        })}
      </div>
    </div>
  );
}
