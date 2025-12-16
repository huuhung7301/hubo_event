"use client";

import { useState } from "react";
import PackageCard from "./packageCard";

type PriceRange = { label: string; min: number; max: number };

const priceRanges: PriceRange[] = [
  { label: "under $350 ", min: 0, max: 349 },
  { label: "$350-$500", min: 350, max: 499 },
  { label: "$500-$700", min: 500, max: 699 },
  { label: "$700-$1000", min: 700, max: 999 },
  { label: "$1000 upper", min: 1000, max: Infinity },
];

type Item = {
  key: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string | null;
};

type Work = {
  id: number;
  title: string;
  src: string;
  categories: string[];
  items: Item[];
  optionalItems: Item[];
  notes: string;
};

type FilteredAreaProps = {
  works: Work[];
  categories: string[];
};

export default function FilteredArea({ works, categories }: FilteredAreaProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<PriceRange[]>([]);

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );

  const togglePrice = (range: PriceRange) =>
    setSelectedPrices((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range],
    );

  const filteredWorks = works.filter((work) => {
    const totalPrice =
      work.items.reduce((sum, i) => sum + i.price * i.quantity, 0) +
      work.optionalItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const matchesCategory =
      selectedCategories.length === 0 ||
      work.categories.some((cat) => selectedCategories.includes(cat));

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
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {filteredWorks.map((work) => {
          const totalPrice =
            work.items.reduce((sum, i) => sum + i.price * i.quantity, 0) +
            work.optionalItems.reduce(
              (sum, i) => sum + i.price * i.quantity,
              0,
            );

          return (
            <PackageCard
              key={work.id}
              workId={work.id}
              src={work.src}
              title={work.title}
              categories={work.categories}
              items={work.items}
              optionalItems={work.optionalItems}
              totalPrice={totalPrice}
              notes={work.notes}
            />
          );
        })}
      </div>
    </div>
  );
}
