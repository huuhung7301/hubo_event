import React from 'react';
import Image from "next/image";

// Assuming this interface is shared via a types file or defined here
export interface SelectionItem {
  id: number;
  key: string;
  src: string;
  title: string;
  category: string;
  price: number;
}

interface ItemDisplayProps {
  item: SelectionItem;
  selected: boolean;
  onSelect: (item: SelectionItem) => void;
}

export const ItemDisplayComponent: React.FC<ItemDisplayProps> = ({ item, selected, onSelect }) => {
  const handleClick = () => {
    onSelect(item);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all duration-200
        hover:scale-[1.02] hover:shadow-lg
        w-36 h-full
        ${selected ? 'border-blue-600 shadow-xl' : 'border-gray-200'}
      `}
    >
      {/* Image (h-36 matches the required height) */}
      <Image
        src={item.src}
        alt={item.title}
        className="h-36 w-full object-cover"
        width={144}
        height={144}
      />

      {/* Overlay tick if selected */}
      {selected && (
        <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
          ✓
        </div>
      )}

      {/* Info */}
      <div className="p-3 bg-white">
        <h3 className="text-base font-semibold text-gray-800 truncate">{item.title}</h3>
        {item.category && (
          <p className="text-sm text-gray-500 truncate">{item.category}</p>
        )}
        {item.price !== undefined && (
          <p className="mt-1 text-sm font-medium text-gray-800">${item.price}</p>
        )}
      </div>
    </div>
  );
};

export const ItemDisplay = React.memo(ItemDisplayComponent);