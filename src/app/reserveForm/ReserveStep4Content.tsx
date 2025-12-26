"use client";

import { useState } from "react";
// Removed explicit imports for SelectionItem and ReservationItem
import type { Step1Data, Step2Data, Step3Data } from "../reserve/page";
import { api } from "~/trpc/react";
import Image from "next/image";

// --- NEW LOCAL TYPES ---

/**
 * Type used for the API payload (matches the backend Zod schema).
 */
interface APIPayloadItem {
  key: string;
  quantity: number;
  priceAtBooking: number;
}

/**
 * Type used for displaying selected items in the UI summary.
 */
interface UISummaryItem {
  title: string;
  category?: string;
  price?: number;
  src: string;
  key?: string;
}

// --- COMPONENT PROPS (Updated to use APIPayloadItem) ---

interface ReserveStep4ContentProps {
  reservationId?: number; // reservation ID for updating
  existingStep1Data?: {
    items: APIPayloadItem[]; // Updated to use APIPayloadItem
    optionalItems?: APIPayloadItem[]; // Updated to use APIPayloadItem
  };
  newStep1Data?: Step1Data;
  step2Data: Step2Data;
  step3Data: Step3Data;
  onConfirm: () => void;
}

// ⚠️ UPDATED HELPER: Flattens the flexible Step1Data into a usable item structure
// Now uses UISummaryItem for internal processing and APIPayloadItem for the output array.
const flattenNewStep1Data = (data: Step1Data) => {
  const preparedItems: APIPayloadItem[] = []; // Output: API Payload structure
  let total = 0;
  const renderableItems: UISummaryItem[] = []; // Used for displaying the summary (UISummaryItem)

  for (const key in data) {
    const value = data[key];

    // Skip the string message field
    if (key === "message") continue;

    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      // Handle multi-select arrays (e.g., decorations, lighting)
      (value as UISummaryItem[]).forEach((item) => {
        preparedItems.push({
          key: item.title, // Use title as key
          quantity: 1,
          priceAtBooking: item.price ?? 0,
        });
        total += item.price ?? 0;
        renderableItems.push(item);
      });
    } else if (typeof value === "object" && "key" in value) {
      // Handle single SelectionItem objects (e.g., backdrop, theme, flooring)
      const item = value as UISummaryItem;
      preparedItems.push({
        key: item.title, // Use title as key
        quantity: 1,
        priceAtBooking: item.price ?? 0,
      });
      total += item.price ?? 0;
      renderableItems.push(item);
    }
  }

  return {
    preparedItems,
    total,
    renderableItems,
  };
};

export default function ReserveStep4Content({
  reservationId,
  existingStep1Data,
  newStep1Data,
  step2Data,
  step3Data,
  onConfirm,
}: ReserveStep4ContentProps) {
  const [loading, setLoading] = useState(false);
  // NOTE: updateReservation is not defined in the provided router, but kept for context.
  const updateMutation = api.reservation.updateReservation.useMutation();
  const createMutation = api.reservation.createReservation.useMutation();

  // --- Helper functions (Updated to use UISummaryItem) ---
  const renderItemRow = (item: UISummaryItem) => (
    <div
      key={item.title}
      className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white/60 p-3 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <Image
          src={item.src}
          alt={item.title}
          className="h-16 w-16 rounded-lg object-cover"
          width={64}
          height={64}
        />
        <div>
          <p className="font-medium text-gray-800">{item.title}</p>
          <p className="text-sm text-gray-500">{item.category ?? ""}</p>
        </div>
      </div>
      <p className="font-semibold text-gray-700">${item.price ?? 0}</p>
    </div>
  );

  const renderList = (items: UISummaryItem[]) =>
    items.map((item, idx) => (
      <div key={item.title + idx}>{renderItemRow(item)}</div>
    ));

  // --- Calculate Step 1 data and total ---

  const preparedStep1Data = newStep1Data
    ? flattenNewStep1Data(newStep1Data)
    : null;

  const step1Total = existingStep1Data
    ? existingStep1Data.items.reduce(
        (sum, i) => sum + i.quantity * i.priceAtBooking,
        0,
      ) +
      (existingStep1Data.optionalItems
        ? existingStep1Data.optionalItems.reduce(
            (sum, i) => sum + i.quantity * i.priceAtBooking,
            0,
          )
        : 0)
    : (preparedStep1Data?.total ?? 0);

  // --- Step 3 total ---
  const step3Total = step3Data.addOns.reduce(
    (sum, a) => sum + (a.price ?? 0),
    0,
  );

  // --- Total ---
  const total = step1Total + step3Total + (step2Data.deliveryFee ?? 0);

  // --- Prepare items JSON for mutation payload (Uses APIPayloadItem) ---
  const items: APIPayloadItem[] = existingStep1Data
    ? existingStep1Data.items
    : (preparedStep1Data?.preparedItems ?? []);

  const optionalItems: APIPayloadItem[] =
    existingStep1Data?.optionalItems ?? [];

  // --- Confirm handler ---
  const handleConfirm = async () => {
    setLoading(true);

    // Prepare ALL items for the creation payload
    // Step 3 addOns (UISummaryItem) are converted to APIPayloadItem structure here
    const addOnPayloadItems: APIPayloadItem[] = step3Data.addOns.map((a) => ({
      key: a.title, // Using title as key for API
      quantity: 1,
      priceAtBooking: a.price ?? 0,
    }));

    // Combine Step 1 items and Step 3 add-ons for the final 'items' payload in create
    const allItemsForCreation = [...items, ...addOnPayloadItems];

    try {
      if (reservationId) {
        // --- SCENARIO 1: UPDATE EXISTING RESERVATION ---
        await updateMutation.mutateAsync({
          id: reservationId,
          // Use the separated items/optionalItems structure for UPDATE
          items: items,
          optionalItems: optionalItems,
          reservationDate: step2Data.date
            ? new Date(step2Data.date).toISOString()
            : undefined,
          postcode: step2Data.postcode,
          customerName: step2Data.customerName,
          customerEmail: step2Data.customerEmail,
          customerPhone: step2Data.customerPhone,
          extra: {
            // NOTE: The backend expects addOns to be APIPayloadItem, but step3Data.addOns is UISummaryItem
            // We pass the raw UISummaryItem array here, assuming the update mutation on the backend
            // is flexible or performs its own coercion. For clean passing, we should map this too.
            addOns: addOnPayloadItems,
            deliveryFee: step2Data.deliveryFee,
          },
          totalPrice: total,
        });
      } else {
        // --- SCENARIO 2: CREATE NEW RESERVATION ---
        const NEW_WORK_ID = 0;
        
        await createMutation.mutateAsync({
          userId: step2Data.customerEmail,
          workId: NEW_WORK_ID,
          customerName: step2Data.customerName,
          customerEmail: step2Data.customerEmail,
          customerPhone: step2Data.customerPhone,
          notes: newStep1Data?.message,
          // Use the COMBINED items array for CREATE
          items: allItemsForCreation,
          postcode: step2Data.postcode,
          reservationDate: step2Data.date
            ? new Date(step2Data.date).toISOString()
            : undefined,
          extra: {
            // Use the mapped APIPayloadItem array for addOns
            addOns: addOnPayloadItems,
            deliveryFee: step2Data.deliveryFee,
          },
        });
      }

      onConfirm();
    } catch (err) {
      console.error("Failed to process reservation:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING ---
  return (
    <div className="space-y-8">
      <h2 className="text-center text-2xl font-bold text-gray-800">
        Reservation Summary
      </h2>

      {/* Step 1 */}
      <div className="space-y-4">
        <h3 className="border-b pb-1 text-lg font-semibold text-gray-700">
          Step 1: Package Details
        </h3>

        {existingStep1Data ? (
          // 1. Rendering existing reservation (Uses APIPayloadItem structure)
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
                  <h4 className="mt-2 font-medium">Optional Items</h4>
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
        ) : preparedStep1Data ? (
          // 2. Rendering new reservation (Uses UISummaryItem)
          <>
            {preparedStep1Data.renderableItems.length > 0 ? (
              renderList(preparedStep1Data.renderableItems)
            ) : (
              <p className="text-gray-500 italic">No package items selected.</p>
            )}

            {newStep1Data?.message && (
              <p className="mt-3 text-sm text-gray-600 italic">
                Message: “{newStep1Data.message}”
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500 italic">No step 1 data available.</p>
        )}
      </div>

      {/* Step 2, Step 3, Total, and Button remain unchanged */}
      <div className="space-y-2">
        <h3 className="border-b pb-1 text-lg font-semibold text-gray-700">
          Step 2: Availability & Delivery
        </h3>
        <p>
          <span className="font-medium text-gray-700">Date:</span>{" "}
          {step2Data.date || "N/A"}
        </p>
        <p>
          <span className="font-medium text-gray-700">Postcode:</span>{" "}
          {step2Data.postcode || "N/A"}
        </p>
        {step2Data.deliveryFee !== undefined && (
          <p>
            <span className="font-medium text-gray-700">Delivery Fee:</span> $
            {step2Data.deliveryFee}
          </p>
        )}
      </div>

      {/* Step 3 */}
      {step3Data.addOns.length > 0 && (
        <div className="space-y-2">
          <h3 className="border-b pb-1 text-lg font-semibold text-gray-700">
            Step 3: Add-ons
          </h3>
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
        onClick={handleConfirm}
        disabled={loading}
        className={`w-full rounded-lg py-3 font-medium text-white transition-colors ${
          loading
            ? "cursor-not-allowed bg-gray-400"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Saving..." : "Confirm & Continue →"}
      </button>
    </div>
  );
}
