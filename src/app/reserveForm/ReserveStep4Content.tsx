"use client";

import type { SelectionItem } from "../_components/selectionCard";
import type { Step1Data, Step2Data, Step3Data, ReservationItem } from "../reserve/page";

interface ReserveStep4ContentProps {
  existingStep1Data?: {
    items: ReservationItem[];
    optionalItems?: ReservationItem[];
  };
  newStep1Data?: Step1Data;
  step2Data: Step2Data;
  step3Data: Step3Data;
  onConfirm: () => void;
}

export default function ReserveStep4Content({
  existingStep1Data,
  newStep1Data,
  step2Data,
  step3Data,
  onConfirm,
}: ReserveStep4ContentProps) {
  console.log("ReserveStep4Content props:", {
    existingStep1Data,
    newStep1Data,
    step2Data,
    step3Data,
  });
  const renderItemRow = (item: SelectionItem) => (
    <div
      key={item.title}
      className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white/60 p-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <img src={item.src} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
        <div>
          <p className="font-medium text-gray-800">{item.title}</p>
          <p className="text-sm text-gray-500">{item.category}</p>
        </div>
      </div>
      <p className="text-gray-700 font-semibold">${item.price}</p>
    </div>
  );

  const renderList = (items: SelectionItem[]) =>
    items.map((item, idx) => <div key={item.title + idx}>{renderItemRow(item)}</div>);

  // --- Step 1 total ---
  const step1Total = existingStep1Data
    ? existingStep1Data.items.reduce((sum, i) => sum + i.quantity * i.priceAtBooking, 0) +
      (existingStep1Data.optionalItems
        ? existingStep1Data.optionalItems.reduce(
            (sum, i) => sum + i.quantity * i.priceAtBooking,
            0
          )
        : 0)
    : newStep1Data
    ? (newStep1Data.backdrop?.price ?? 0) +
      newStep1Data.decorations.reduce((sum, d) => sum + (d.price ?? 0), 0) +
      (newStep1Data.theme?.price ?? 0)
    : 0;

  // --- Step 3 total ---
  const step3Total = step3Data.addOns.reduce((sum, a) => sum + (a.price ?? 0), 0);

  // --- Total ---
  const total = step1Total + step3Total + (step2Data.deliveryFee ?? 0);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center">Reservation Summary</h2>

      {/* Step 1 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Step 1: Package Details</h3>
        {existingStep1Data ? (
          <>
            {existingStep1Data.items.map((item) => (
              <div key={item.key} className="flex justify-between">
                <span>{item.key}</span>
                <span>
                  {item.quantity} × ${item.priceAtBooking}
                </span>
              </div>
            ))}
            {existingStep1Data.optionalItems &&
              existingStep1Data.optionalItems.length > 0 && (
                <>
                  <h4 className="font-medium mt-2">Optional Items</h4>
                  {existingStep1Data.optionalItems.map((item) => (
                    <div key={item.key} className="flex justify-between">
                      <span>{item.key}</span>
                      <span>
                        {item.quantity} × ${item.priceAtBooking}
                      </span>
                    </div>
                  ))}
                </>
              )}
          </>
        ) : newStep1Data ? (
          <>
            {newStep1Data.backdrop && renderItemRow(newStep1Data.backdrop)}
            {newStep1Data.decorations.length > 0 && renderList(newStep1Data.decorations)}
            {newStep1Data.theme && renderItemRow(newStep1Data.theme)}
            {newStep1Data.message && (
              <p className="mt-3 text-sm italic text-gray-600">
                Message: “{newStep1Data.message}”
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500 italic">No step 1 data available.</p>
        )}
      </div>

      {/* Step 2 */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Step 2: Availability & Delivery</h3>
        <p>
          <span className="font-medium text-gray-700">Date:</span> {step2Data.date || "N/A"}
        </p>
        <p>
          <span className="font-medium text-gray-700">Postcode:</span> {step2Data.postcode || "N/A"}
        </p>
        {step2Data.deliveryFee !== undefined && (
          <p>
            <span className="font-medium text-gray-700">Delivery Fee:</span> ${step2Data.deliveryFee}
          </p>
        )}
      </div>

      {/* Step 3 */}
      {step3Data.addOns.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-1">Step 3: Add-ons</h3>
          {renderList(step3Data.addOns)}
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
