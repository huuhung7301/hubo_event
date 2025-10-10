"use client";

export interface SelectionItem {
  src: string;
  title: string;
  category?: string;
  price?: number;
}

interface SelectionCardProps {
  item: SelectionItem;
  selected?: boolean;
  onSelect?: (item: SelectionItem) => void;
}

export default function SelectionCardComponent({ item, selected = false, onSelect }: SelectionCardProps) {
  const handleClick = () => {
    onSelect?.(item);
  };

  return (
    <div
      onClick={handleClick}
      className="relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200
        hover:scale-105 hover:shadow-lg
        border-transparent w-36"
    >
      {/* Image */}
      <img
        src={item.src}
        alt={item.title}
        className="h-36 object-cover"
      />

      {/* Overlay tick if selected */}
      {selected && (
        <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
          ✓
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-white">
        <h3 className="text-base font-semibold text-gray-800">{item.title}</h3>
        {item.category && (
          <p className="text-sm text-gray-500">{item.category}</p>
        )}
        {item.price && (
          <p className="mt-1 text-sm font-medium text-gray-800">${item.price}</p>
        )}
      </div>
    </div>
  );
}
