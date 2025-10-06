"use client";

import type { PackageItem } from "./packageCard";

interface PackageModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
  categories: string[];
  items: PackageItem[];
  optionalItems?: PackageItem[];
  totalPrice: number;
  notes?: string;
}

export default function PackageModal({
  open,
  onClose,
  src,
  title,
  categories,
  items,
  optionalItems = [],
  totalPrice,
  notes,
}: PackageModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-5xl w-full relative overflow-hidden flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        {/* Image Section */}
        <div className="md:w-1/2 w-full bg-black flex items-center justify-center">
          <img
            src={src}
            alt={title}
            className="w-full h-full object-contain max-h-[80vh]"
          />
        </div>

        {/* Content Section */}
        <div className="md:w-1/2 w-full p-6 overflow-y-auto max-h-[80vh]">
          {/* Title */}
          <h2 className="text-2xl font-bold mb-2">{title}</h2>

          {/* Items Included */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Included Items</h3>
            <ul className="space-y-1">
              {items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex justify-between border-b pb-1 text-gray-700"
                >
                  <span>{item.name}</span>
                  <span>${item.price}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional Add-ons */}
          {optionalItems.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Optional Add-ons</h3>
              <ul className="space-y-1">
                {optionalItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex justify-between border-b pb-1 text-gray-600"
                  >
                    <span>{item.name}</span>
                    <span>${item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between font-bold text-lg border-t pt-2 mb-4">
            <span>Total</span>
            <span>${totalPrice}</span>
          </div>

          {/* Notes */}
          {notes && (
            <p className="text-sm text-gray-500 mb-4">{notes}</p>
          )}

          {/* CTA */}
          <button className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition">
            Reserve This Setup
          </button>
        </div>
      </div>
    </div>
  );
}
