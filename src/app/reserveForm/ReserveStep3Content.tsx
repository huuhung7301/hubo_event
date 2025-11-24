"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import SelectionCard from "../_components/selectionCard";
import type { SelectionItem } from "../_components/selectionCard";

interface ReserveStep3ContentProps {
  data: { addOns: SelectionItem[] };
  onSubmit: (data: { addOns: SelectionItem[] }) => void;
}

const addOns: SelectionItem[] = [
  // LIGHTING
  {
    src: "https://picsum.photos/id/1015/500/500",
    title: "LED Uplights",
    category: "Lighting",
    price: 80,
  },
  {
    src: "https://picsum.photos/id/1016/500/500",
    title: "Fairy Lights",
    category: "Lighting",
    price: 50,
  },
  {
    src: "https://picsum.photos/id/1013/500/500",
    title: "Spotlight Pack",
    category: "Lighting",
    price: 100,
  },
  {
    src: "https://picsum.photos/id/1015/500/500",
    title: "LED Uplights 2",
    category: "Lighting",
    price: 80,
  },
  {
    src: "https://picsum.photos/id/1016/500/500",
    title: "Fairy Lights 2",
    category: "Lighting",
    price: 50,
  },
  {
    src: "https://picsum.photos/id/1013/500/500",
    title: "Spotlight Pack 2",
    category: "Lighting",
    price: 100,
  },
  {
    src: "https://picsum.photos/id/1015/500/500",
    title: "LED Uplights3",
    category: "Lighting",
    price: 80,
  },
  {
    src: "https://picsum.photos/id/1016/500/500",
    title: "Fairy Lights3",
    category: "Lighting",
    price: 50,
  },
  {
    src: "https://picsum.photos/id/1013/500/500",
    title: "Spotlight Pack 3",
    category: "Lighting",
    price: 100,
  },

  // TABLE DECORATION
  {
    src: "https://picsum.photos/id/1015/500/500",
    title: "Centerpiece Pack",
    category: "Table Decoration",
    price: 60,
  },
  {
    src: "https://picsum.photos/id/1016/500/500",
    title: "Table Runner Set",
    category: "Table Decoration",
    price: 40,
  },
  {
    src: "https://picsum.photos/id/1012/500/500",
    title: "Mini Table Props",
    category: "Table Decoration",
    price: 30,
  },

  // PHOTO / VIDEO
  {
    src: "https://picsum.photos/id/1020/500/500",
    title: "Photo Booth Setup",
    category: "Photo/Video",
    price: 120,
  },
  {
    src: "https://picsum.photos/id/1021/500/500",
    title: "DIY Props Kit",
    category: "Photo/Video",
    price: 35,
  },

  // EXPERIENCE
  {
    src: "https://picsum.photos/id/1022/500/500",
    title: "Interactive Guest Wall",
    category: "Experience",
    price: 70,
  },
  {
    src: "https://picsum.photos/id/1021/500/500",
    title: "Candy / Dessert Table Setup",
    category: "Experience",
    price: 90,
  },

  // PRINTING
  {
    src: "https://picsum.photos/id/1023/500/500",
    title: "Custom Welcome Sign",
    category: "Printing Services",
    price: 60,
  },
  {
    src: "https://picsum.photos/id/1024/500/500",
    title: "Personalized Table Cards",
    category: "Printing Services",
    price: 40,
  },

  // DESIGN PACK
  {
    src: "https://picsum.photos/id/1025/500/500",
    title: "Our Designer Styling Pack",
    category: "Design Pack",
    price: 150,
  },
  {
    src: "https://picsum.photos/id/1026/500/500",
    title: "Custom Theme Setup Consultation",
    category: "Design Pack",
    price: 100,
  },
];

export default function ReserveStep3Content({
  data,
  onSubmit,
}: ReserveStep3ContentProps) {
  const [setup, setSetup] = useState<{ addOns: SelectionItem[] }>({
    addOns: data.addOns ?? [],
  });

  // ===== Scroll State (same fix as Step 1) =====
  const scrollPositions = useRef<Record<string, number>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const restoreScroll = useCallback(() => {
    Object.entries(scrollRefs.current).forEach(([key, ref]) => {
      if (ref) ref.scrollLeft = scrollPositions.current[key] ?? 0;
    });
  }, []);

  // Restore on render
  useEffect(() => restoreScroll());

  const toggleAddOn = useCallback((item: SelectionItem) => {
    setSetup((prev) => {
      const exists = prev.addOns.some((i) => i.title === item.title);
      if (exists) {
        return {
          ...prev,
          addOns: prev.addOns.filter((i) => i.title !== item.title),
        };
      }
      return { ...prev, addOns: [...prev.addOns, item] };
    });
  }, []);

  const handleScroll = (key: string, e: React.UIEvent<HTMLDivElement>) => {
    scrollPositions.current[key] = e.currentTarget.scrollLeft;
  };

  const handleNext = () => onSubmit(setup);

  // ===== ScrollGrid Component (fixed same way) =====
  const ScrollGrid = ({
    category,
    items,
  }: {
    category: string;
    items: SelectionItem[];
  }) => {
    const rows = items.length < 6 ? 1 : 2;

    return (
      <div
        ref={(el) => {
          scrollRefs.current[category] = el;
        }}
        onScroll={(e) => handleScroll(category, e)}
        className="flex snap-x snap-mandatory space-x-4 overflow-x-auto pb-2"
      >
        <div className={`auto-cols grid grid-flow-col grid-rows-${rows} gap-4`}>
          {items.map((item) => (
            <div key={item.title} className="snap-start">
              <SelectionCard
                item={item}
                selected={setup.addOns.some((a) => a.title === item.title)}
                onSelect={toggleAddOn}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ===== Group items by category =====

  const categories: string[] = Array.from(
    new Set(addOns.map((a) => a.category ?? "Other")),
  );
  const categorizedItems = Object.fromEntries(
    categories.map((cat) => [cat, addOns.filter((a) => a.category === cat)]),
  );
  return (
    <div className="space-y-8">
      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="mb-4 text-lg font-semibold">{cat}</h2>
          <ScrollGrid category={cat} items={categorizedItems[cat] ?? []} />
        </section>
      ))}

      {/* Next Button */}
      <div className="text-right">
        <button
          onClick={handleNext}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Next Step →
        </button>
      </div>
    </div>
  );
}
