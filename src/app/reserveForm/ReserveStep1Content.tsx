"use client";

import React, { useState, useRef, useEffect } from "react";
import type { SelectionItem } from "../_components/selectionCard";
import SelectionCardComponent from "../_components/selectionCard";

const SelectionCard = React.memo(SelectionCardComponent);

interface ScrollGridProps {
  items: SelectionItem[];
  selectedCheck: (item: SelectionItem) => boolean;
  onSelect: (item: SelectionItem) => void;
  innerRef: React.RefObject<HTMLDivElement | null>;
  scrollKey: "backdrop" | "decorations" | "themes";
  handleScroll: (
    key: "backdrop" | "decorations" | "themes",
    e: React.UIEvent<HTMLDivElement>
  ) => void;
}

const ScrollGridComponent = ({
  items,
  selectedCheck,
  onSelect,
  innerRef,
  scrollKey,
  handleScroll,
}: ScrollGridProps) => (
  <div
    ref={innerRef}
    onScroll={(e) => handleScroll(scrollKey, e)}
    className="flex snap-x snap-mandatory space-x-4 overflow-x-auto pb-2"
  >
    <div className="grid auto-cols grid-flow-col grid-rows-2 gap-4">
      {items.map((item) => (
        <div key={item.title} className="snap-start">
          <SelectionCard
            item={item}
            selected={selectedCheck(item)}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  </div>
);

export const ScrollGrid = React.memo(ScrollGridComponent);


interface ReserveStep1ContentProps {
  data: {
    backdrop?: SelectionItem;
    decorations: SelectionItem[];
    theme?: SelectionItem;
    message: string;
  };
  onSubmit: (data: {
    backdrop?: SelectionItem;
    decorations: SelectionItem[];
    theme?: SelectionItem;
    message: string;
  }) => void;
}


export default function ReserveStep1Content({ data, onSubmit }: ReserveStep1ContentProps) {
  // ======= SAMPLE DATA =======
  const backdrops: SelectionItem[] = [
    { src: "https://picsum.photos/id/1015/500/500", title: "Round Arch", category: "Backdrop", price: 120 },
    { src: "https://picsum.photos/id/1025/500/500", title: "Mesh Wall", category: "Backdrop", price: 150 },
    { src: "https://picsum.photos/id/1035/500/500", title: "Circle Wall", category: "Backdrop", price: 130 },
    { src: "https://picsum.photos/id/1045/500/500", title: "Panel Arch", category: "Backdrop", price: 140 },
  ];

  const decorations: SelectionItem[] = [
    { src: "https://picsum.photos/id/1055/500/500", title: "Balloon Garland", category: "Decoration", price: 80 },
    { src: "https://picsum.photos/id/1065/500/500", title: "Floral Arrangement", category: "Decoration", price: 100 },
    { src: "https://picsum.photos/id/1075/500/500", title: "Neon Sign", category: "Decoration", price: 60 },
    { src: "https://picsum.photos/id/1077/500/500", title: "Handy Sign", category: "Decoration", price: 70 },
  ];

  const themes: SelectionItem[] = [
    { src: "https://picsum.photos/id/1056/500/500", title: "Pastel", category: "Theme", price: 10 },
    { src: "https://picsum.photos/id/1057/500/500", title: "Gold & White", category: "Theme", price: 20 },
    { src: "https://picsum.photos/id/1058/500/500", title: "Tropical", category: "Theme", price: 30 },
  ];

  // ======= STATE =======
  const [selectedBackdrop, setSelectedBackdrop] = useState<string | null>(data.backdrop ? data.backdrop.title : null);
  const [selectedDecorations, setSelectedDecorations] = useState<string[]>(
    data.decorations ? data.decorations.map((d) => d.title) : []
  );
  const [selectedTheme, setSelectedTheme] = useState<string | null>(data.theme ? data.theme.title : null);
  const [message, setMessage] = useState(data.message || "");

  // ======= SCROLL STATE =======
  const scrollPositions = useRef({ backdrop: 0, decorations: 0, themes: 0 });
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const decorationsRef = useRef<HTMLDivElement | null>(null);
  const themesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (backdropRef.current) backdropRef.current.scrollLeft = scrollPositions.current.backdrop;
    if (decorationsRef.current) decorationsRef.current.scrollLeft = scrollPositions.current.decorations;
    if (themesRef.current) themesRef.current.scrollLeft = scrollPositions.current.themes;
  }, []);

  const handleScroll = (key: keyof typeof scrollPositions.current, e: React.UIEvent<HTMLDivElement>) => {
    scrollPositions.current[key] = e.currentTarget.scrollLeft;
  };

  const handleNext = () => {
    const setup = {
      backdrop: backdrops.find((b) => b.title === selectedBackdrop),
      decorations: decorations.filter((d) => selectedDecorations.includes(d.title)),
      theme: themes.find((t) => t.title === selectedTheme),
      message,
    };
    // Send data to parent
    onSubmit(setup);
  };

  return (
    <div className="space-y-8">
      {/* Backdrop */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Choose a Backdrop</h2>
        <ScrollGrid
          items={backdrops}
          selectedCheck={(i) => i.title === selectedBackdrop}
          onSelect={(i) => setSelectedBackdrop(i.title)}
          innerRef={backdropRef}
          scrollKey="backdrop"
          handleScroll={handleScroll}
        />
      </section>

      {/* Decorations */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Choose Decorations</h2>
        <ScrollGrid
          items={decorations}
          selectedCheck={(i) => selectedDecorations.includes(i.title)}
          onSelect={(i) =>
            setSelectedDecorations((prev) =>
              prev.includes(i.title) ? prev.filter((t) => t !== i.title) : [...prev, i.title]
            )
          }
          innerRef={decorationsRef}
          scrollKey="decorations"
          handleScroll={handleScroll}
        />
      </section>

      {/* Themes */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Choose a Theme</h2>
        <ScrollGrid
          items={themes}
          selectedCheck={(i) => i.title === selectedTheme}
          onSelect={(i) => setSelectedTheme(i.title)}
          innerRef={themesRef}
          scrollKey="themes"
          handleScroll={handleScroll}
        />
      </section>

      {/* Custom Message */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Custom Message (Optional)</h2>
        <input
          type="text"
          placeholder="e.g., Happy Birthday"
          className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </section>

      {/* Next Button */}
      <div className="text-right">
        <button
          onClick={handleNext}
          disabled={!selectedBackdrop}
          className={`rounded-lg px-6 py-3 font-semibold text-white transition-colors ${
            selectedBackdrop ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-gray-400"
          }`}
        >
          Next Step
        </button>
      </div>
    </div>
  );
}
