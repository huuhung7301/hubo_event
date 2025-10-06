"use client";

import type { PackageItem } from "./packageCard";

interface MobileOverlayProps {
  onClose: () => void;
  title: string;
  src: string;
  categories: string[];
  items: PackageItem[];
  optionalItems?: PackageItem[];
  totalPrice: number;
  notes?: string;
}

export default function MobileOverlay({
  onClose,
  title,
  src,
  categories,
  items,
  optionalItems = [],
  totalPrice,
  notes,
}: MobileOverlayProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-36">
        <div className="mb-4 p-6 pt-0">
          <img
            src={src}
            alt={title}
            className="aspect-square w-full rounded-lg object-cover"
          />
        </div>

        <div className="mb-2">
          <strong>Categories:</strong> {categories.join(", ")}
        </div>

        <div className="mb-2">
          <strong>Items:</strong>
          <ul className="ml-5 list-disc">
            {items.map((item) => (
              <li key={item.name}>
                {item.name} — ${item.price}
              </li>
            ))}
          </ul>
        </div>

        {optionalItems.length > 0 && (
          <div className="mb-2">
            <strong>Optional Items:</strong>
            <ul className="ml-5 list-disc">
              {optionalItems.map((item) => (
                <li key={item.name}>
                  {item.name} — ${item.price}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-2 font-bold">Total: ${totalPrice}</p>

        {notes && <p className="mt-2">{notes}</p>}
      </div>

      {/* Fixed Button */}
      <button
        onClick={onClose}
        className="fixed bottom-0 left-0 w-full rounded-t-lg bg-black py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-gray-800"
      >
        Reserve This Setup
      </button>
    </div>
  );
}
