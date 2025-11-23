"use client";

import { useState, useMemo } from "react";
import type { PackageItem } from "./packageCard";
import { useRouter } from "next/navigation";
import { useUser, useClerk, SignInButton } from "@clerk/nextjs";
import { api } from "~/trpc/react";

interface MobileOverlayProps {
  onClose: () => void;
  title: string;
  src: string;
  categories: string[];
  coreItems: PackageItem[];
  optionalItems?: PackageItem[];
  totalPrice: number;
  notes?: string;
  workId: number;
}

export default function MobileOverlay({
  onClose,
  title,
  src,
  categories,
  coreItems,
  optionalItems = [],
  totalPrice,
  notes,
  workId,
}: MobileOverlayProps) {
  // Track optional quantities
  const [optionals, setOptionals] = useState(optionalItems);
  const [items, setItems] = useState(coreItems);

  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk();

  const createReservation = api.reservation.createReservation.useMutation({
    onSuccess: (data) => {
      // ✅ After successful reservation, redirect to step 2
      router.push(`/reserve?id=${data.id}`);
      onClose();
    },
    onError: (err) => {
      console.error(err);
      alert("Failed to create reservation.");
    },
  });
  const handleQuantityChange = (
    index: number,
    value: number,
    array: PackageItem[],
    setArray: React.Dispatch<React.SetStateAction<PackageItem[]>>,
  ) => {
    const updated = [...array];
    if (updated[index]) {
      updated[index].quantity = Math.max(0, Number(value));
    }
    setArray(updated);
  };

  const handleReserve = async () => {
    if (!isSignedIn) {
      // 🧭 Not signed in — open Clerk modal
      openSignIn({ redirectUrl: window.location.href });
      return;
    }

    try {
      // 🧠 Create reservation with userId from Clerk
      const reservation = await createReservation.mutateAsync({
        userId: user.id, // ✅ add this line (convert from string if your schema uses Int)
        workId,
        notes,
        items: items.map((i) => ({
          key: i.key,
          quantity: i.quantity,
          priceAtBooking: i.price,
        })),
        optionalItems: optionals.map((i) => ({
          key: i.key,
          quantity: i.quantity,
          priceAtBooking: i.price,
        })),
      });

      // ✅ Redirect to step 2
      router.push(`/reserve?id=${reservation.id}`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to create reservation.");
    }
  };
  // Live totals
  const optionalTotal = useMemo(
    () => optionals.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [optionals],
  );

  const includedTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const grandTotal = includedTotal + optionalTotal;

  return (
    <div className="flex h-full flex-col">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-36">
        {/* Image */}
        <div className="mb-4 p-6 pt-0">
          <img
            src={src}
            alt={title}
            className="aspect-square w-full rounded-lg object-cover"
          />
        </div>

        {/* Title */}
        <h2 className="mb-2 text-2xl font-bold">{title}</h2>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            <strong>Categories:</strong> {categories.join(", ")}
          </div>
        )}

        {/* Included Items */}
        {items.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 font-semibold text-gray-800">
              Core component items
            </h3>
            <ul className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between py-2 text-gray-700"
                >
                  <div className="flex flex-col">
                    <span>
                      {item.name}{" "}
                      <span className="text-sm text-gray-500">
                        (${item.price})
                      </span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      inputMode="none"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(
                          index,
                          Number(e.target.value),
                          items,
                          setItems,
                        )
                      }
                      className="mt-1 w-20 rounded border p-1 text-center text-sm"
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

        {/* Optional Items (interactive) */}
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
                  <div className="flex flex-col">
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
                        handleQuantityChange(
                          index,
                          Number(e.target.value),
                          optionals,
                          setOptionals,
                        )
                      }
                      className="mt-1 w-20 rounded border p-1 text-center text-sm"
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

        {/* Grand Total */}
        <div className="mb-4 flex justify-between border-t pt-3 text-lg font-bold text-gray-900">
          <span>Grand Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>

        {/* Notes */}
        {notes && (
          <p className="mb-4 text-sm leading-relaxed text-gray-600">{notes}</p>
        )}
      </div>

      {/* Fixed Button */}
      <button
        disabled={createReservation.isPending}
        onClick={handleReserve}
        className="fixed bottom-0 left-0 w-full rounded-t-lg bg-black py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-gray-800"
      >
        {createReservation.isPending ? "Saving..." : "Reserve This Setup"}
      </button>
    </div>
  );
}
