"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk, SignInButton } from "@clerk/nextjs";
import { api } from "~/trpc/react";
import type { PackageItem } from "./packageCard";
import Image from "next/image";

interface DesktopOverlayProps {
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

export default function DesktopOverlay({
  onClose,
  title,
  src,
  categories,
  coreItems,
  optionalItems = [],
  totalPrice,
  workId,
  notes,
}: DesktopOverlayProps) {
  const [optionals, setOptionals] = useState(optionalItems);
  const [items, setItems] = useState(coreItems);

  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { openSignIn } = useClerk(); // 👈 open sign-in modal

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

  const optionalTotal = useMemo(
    () => optionals.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [optionals],
  );

  const includedTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const grandTotal = includedTotal + optionalTotal;
const handleReserve = async () => {
    if (!isSignedIn) {
      // 🧭 Not signed in — open Clerk modal
      openSignIn({ redirectUrl: window.location.href });
      onClose();
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

        {/* Left: image */}
        <div className="flex w-full items-center justify-center bg-gray-100 p-6 md:w-1/2">
          <Image
            src={src}
            alt={title}
            className="w-full rounded-lg object-cover"
            width={400}
            height={400}
          />
        </div>

        {/* Right: content */}
        <div className="flex max-h-[80vh] w-full flex-col overflow-y-auto p-6 md:w-1/2">
          <h2 className="mb-4 text-3xl font-bold">{title}</h2>

          {categories.length > 0 && (
            <p className="mb-4 text-sm text-gray-500">
              <strong>Categories:</strong> {categories.join(", ")}
            </p>
          )}

          {/* Core Items */}
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
                          handleQuantityChange(
                            index,
                            Number(e.target.value),
                            items,
                            setItems,
                          )
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
                          handleQuantityChange(
                            index,
                            Number(e.target.value),
                            optionals,
                            setOptionals,
                          )
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

          {/* Reserve button */}
          <button
            disabled={createReservation.isPending}
            onClick={handleReserve}
            className="w-full rounded-lg bg-black py-3 font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
          >
            {createReservation.isPending ? "Saving..." : "Reserve This Setup"}
          </button>
        </div>
      </div>
    </div>
  );
}
