"use client";

import type { PackageItem } from "./packageCard";

interface DesktopOverlayProps {
  onClose: () => void;
  title: string;
  src: string;
  categories: string[];
  items: PackageItem[];
  optionalItems?: PackageItem[];
  totalPrice: number;
  notes?: string;
}

export default function DesktopOverlay({
  onClose,
  title,
  src,
  categories,
  items,
  optionalItems = [],
  totalPrice,
  notes,
}: DesktopOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose} // click outside to close
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full p-10 flex flex-col md:flex-row overflow-hidden z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-black text-2xl z-10"
        >
          ✕
        </button>

        {/* Image Section */}
        <div className="md:w-1/2 w-full bg-gray-100 flex items-center justify-center p-6">
          <img
            src={src}
            alt={title}
            className="w-full h-[400px] object-cover rounded-lg"
          />
        </div>

        {/* Content Section */}
        <div className="md:w-1/2 w-full p-6 flex flex-col max-h-[80vh] overflow-y-auto">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>

          {categories.length > 0 && (
            <p className="text-sm text-gray-500 mb-4">
              <strong>Categories:</strong> {categories.join(", ")}
            </p>
          )}

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Included Items</h3>
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.name}
                  className="flex justify-between border-b pb-1 text-gray-700"
                >
                  <span>{item.name}</span>
                  <span>${item.price}</span>
                </li>
              ))}
            </ul>
          </div>

          {optionalItems.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Optional Add-ons</h3>
              <ul className="space-y-2">
                {optionalItems.map((item) => (
                  <li
                    key={item.name}
                    className="flex justify-between border-b pb-1 text-gray-600"
                  >
                    <span>{item.name}</span>
                    <span>${item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center font-bold text-lg border-t pt-3 mb-4">
            <span>Total</span>
            <span>${totalPrice}</span>
          </div>

          {notes && <p className="text-sm text-gray-500 mb-4">{notes}</p>}

          <button className="w-full bg-black py-3 text-white font-semibold rounded-lg hover:bg-gray-800 transition">
            Reserve This Setup
          </button>
        </div>
      </div>
    </div>
  );
}
