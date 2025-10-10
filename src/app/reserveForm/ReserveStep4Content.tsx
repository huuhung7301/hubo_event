"use client";

import type { SelectionItem } from "../_components/selectionCard";

interface ReserveStep4ContentProps {
  data: {
    step1: {
      backdrop?: SelectionItem;
      decorations: SelectionItem[];
      theme?: SelectionItem;
      message: string;
    };
    step2: {
      date: string;
      postcode: string;
      deliveryFee?: number;
    };
    step3: {
      addOns: SelectionItem[];
    };
  };
  onConfirm: () => void;
}

export default function ReserveStep4Content({ data, onConfirm }: ReserveStep4ContentProps) {
  // --- Helper to render one item row with image ---
  const renderItemRow = (item: SelectionItem) => (
    <div
      key={item.title}
      className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white/60 p-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <img
          src={item.src}
          alt={item.title}
          className="h-16 w-16 rounded-lg object-cover"
        />
        <div>
          <p className="font-medium text-gray-800">{item.title}</p>
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
      </div>
      <p className="text-gray-700 font-semibold">${item.price}</p>
    </div>
  );

  // --- Helper to render a list of items ---
  const renderList = (items: SelectionItem[]) =>
    items.map((item, index) => (
      <div key={item.title + index}>{renderItemRow(item)}</div>
    ));

  // --- Calculate total price ---
  const total =
    (data.step1.backdrop?.price || 0) +
    data.step1.decorations.reduce((sum, d) => sum + (d.price || 0), 0) +
    (data.step1.theme?.price || 0) +
    data.step3.addOns.reduce((sum, a) => sum + (a.price || 0), 0) +
    (data.step2.deliveryFee || 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center">Reservation Summary</h2>

      {/* Step 1 Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Step 1: Package Details</h3>

        {data.step1.backdrop && (
          <div>
            <h4 className="mb-2 text-md font-medium text-gray-700">Backdrop</h4>
            {renderItemRow(data.step1.backdrop)}
          </div>
        )}

        {data.step1.decorations.length > 0 && (
          <div>
            <h4 className="mb-2 text-md font-medium text-gray-700">Decorations</h4>
            {renderList(data.step1.decorations)}
          </div>
        )}

        {data.step1.theme && (
          <div>
            <h4 className="mb-2 text-md font-medium text-gray-700">Theme</h4>
            {renderItemRow(data.step1.theme)}
          </div>
        )}

        {data.step1.message && (
          <p className="mt-3 text-sm italic text-gray-600">
            Message: “{data.step1.message}”
          </p>
        )}
      </div>

      {/* Step 2 Summary */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Step 2: Availability & Delivery</h3>
        <p>
          <span className="font-medium text-gray-700">Date:</span>{" "}
          {data.step2.date || "N/A"}
        </p>
        <p>
          <span className="font-medium text-gray-700">Postcode:</span>{" "}
          {data.step2.postcode || "N/A"}
        </p>
        {data.step2.deliveryFee !== undefined && (
          <p>
            <span className="font-medium text-gray-700">Delivery Fee:</span>{" "}
            ${data.step2.deliveryFee}
          </p>
        )}
      </div>

      {/* Step 3 Summary */}
      {data.step3.addOns.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Step 3: Add-ons</h3>
          {renderList(data.step3.addOns)}
        </div>
      )}

      {/* Total */}
      <div className="rounded-xl border border-gray-300 bg-gray-50 p-6 text-center shadow-sm">
        <h3 className="text-xl font-bold text-gray-800">Total Price</h3>
        <p className="mt-2 text-3xl font-extrabold">${total}</p>
      </div>

      {/* Confirm Button */}
      <button
        onClick={onConfirm}
        className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
      >
        Confirm & Continue →
      </button>
    </div>
  );
}
