"use client";

import React from "react";
import type { ReservationItem } from "../reserve/page";

interface ExistingReservationSummaryProps {
  items: ReservationItem[];
  optionalItems: ReservationItem[];
  onContinue: () => void;
  imageUrl: string;
}

export default function ExistingReservationSummary({
  items,
  optionalItems,
  onContinue,
  imageUrl,
}: ExistingReservationSummaryProps) {
  const renderItemList = (list: ReservationItem[]) => (
    <ul className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
      {list.map((item) => (
        <li
          key={item.key}
          className="flex justify-between text-sm text-gray-800"
        >
          <span className="capitalize">{item.key}</span>
          <span>
            {item.quantity} × ${item.priceAtBooking}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-center text-2xl font-semibold text-gray-900">
        Your Existing Reservation
      </h2>
      <img
        src={imageUrl}
        className="h-auto w-full rounded object-cover"
        alt=""
      />
      {/* Main Items */}
      <div>
        <h3 className="mb-2 font-medium text-gray-700">Main Items</h3>
        {items.length > 0 ? (
          renderItemList(items)
        ) : (
          <p className="text-sm text-gray-500 italic">No main items found.</p>
        )}
      </div>

      {/* Optional Items */}
      <div>
        <h3 className="mb-2 font-medium text-gray-700">Optional Items</h3>
        {optionalItems.length > 0 ? (
          renderItemList(optionalItems)
        ) : (
          <p className="text-sm text-gray-500 italic">
            No optional items selected.
          </p>
        )}
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <button
          onClick={onContinue}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
