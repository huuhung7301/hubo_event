"use client";

import { useState, useMemo } from "react";
import { api } from "~/trpc/react"; // 👈 import tRPC client
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
  const [optionals, setOptionals] = useState(optionalItems);
  console.log("items test: ", items);

  // ✅ Setup the mutation
  const addWork = api.work.addWork.useMutation({
    onSuccess: () => {
      alert("Work added successfully!");
      onClose();
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to add work.");
    },
  });

  const handleQuantityChange = (index: number, value: number) => {
    const updated = [...optionals];
    if (updated[index]) {
      updated[index].quantity = Math.max(0, Number(value));
    }
    setOptionals(updated);
  };

  const optionalTotal = useMemo(
    () => optionals.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [optionals],
  );

  const includedTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const grandTotal = includedTotal + optionalTotal;

  // 🧭 Handle Reserve click
  const handleReserve = () => {
    console.log("🧾 Work being reserved:");
    console.log("Title:", title);
    console.log("Image:", src);
    console.log("Notes:", notes);
    console.log("Categories:", categories);

    console.log("Items:", items);
    console.log(
      "Items mapped:",
      items.map((i) => ({
        key: i.name,
        quantity: i.quantity,
      })),
    );

    console.log("Optional items:", optionals);
    console.log(
      "Optional items mapped:",
      optionals.map((i) => ({
        key: i.name,
        quantity: i.quantity,
      })),
    );

    addWork.mutate({
      title,
      imageUrl: src,
      notes,
      categories,
      items: items.map((i) => ({
        key: i.key,
        quantity: i.quantity,
      })),
      optionalItems: optionals.map((i) => ({
        key: i.key,
        quantity: i.quantity,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white p-10 shadow-xl md:flex-row">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-2xl text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <div className="flex w-full items-center justify-center bg-gray-100 p-6 md:w-1/2">
          <img
            src={src}
            alt={title}
            className="h-[400px] w-full rounded-lg object-cover"
          />
        </div>

        <div className="flex max-h-[80vh] w-full flex-col overflow-y-auto p-6 md:w-1/2">
          <h2 className="mb-4 text-3xl font-bold">{title}</h2>

          {categories.length > 0 && (
            <p className="mb-4 text-sm text-gray-500">
              <strong>Categories:</strong> {categories.join(", ")}
            </p>
          )}

          {/* Core Items */}
          <div className="mb-4">
            <h3 className="mb-2 font-semibold text-gray-800">
              Core component items
            </h3>
            <ul className="divide-y divide-gray-200">
              {items.map((item) => (
                <li
                  key={item.name}
                  className="flex justify-between py-2 text-gray-700"
                >
                  <span>
                    {item.name}{" "}
                    <span className="text-sm text-gray-500">
                      (${item.price})
                    </span>
                  </span>
                  <span className="font-medium text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional Items */}
          {optionals.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 font-semibold text-gray-800">
                Optional Add-ons
              </h3>
              <ul className="divide-y divide-gray-200">
                {optionals.map((item, index) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between py-2 text-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <span>
                        {item.name}{" "}
                        <span className="text-sm text-gray-500">
                          (${item.price})
                        </span>
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(index, Number(e.target.value))
                        }
                        className="w-16 rounded border p-1 text-center text-sm"
                      />
                    </div>
                    <span className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Total */}
          <div className="mb-4 flex items-center justify-between border-t pt-3 text-lg font-bold">
            <span>Grand Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>

          {notes && <p className="mb-4 text-sm text-gray-500">{notes}</p>}

          <button
            disabled={addWork.isPending}
            onClick={handleReserve}
            className="w-full rounded-lg bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {addWork.isPending ? "Saving..." : "Reserve This Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
