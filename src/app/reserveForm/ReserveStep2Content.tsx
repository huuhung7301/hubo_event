"use client";

import { useState, useEffect, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import type { Step2Data } from "../reserve/page";
// Assuming the path is correct
import suburbsRaw from "~/data/australian_postcodes.json";
import { api } from "~/trpc/react";

// ---------------------------------------------------------
// 📍 CONFIGURATION
// ---------------------------------------------------------

// 1. Warehouse / Base Location (Update these to your real location)
const WAREHOUSE_LAT = -37.743361; // Example: Melbourne area
const WAREHOUSE_LNG = 144.796693;

// 2. Define the shape of your JSON data
interface SuburbEntry {
  id: number;
  postcode: string;
  locality: string;
  state: string;
  long: number;
  lat: number;
}

// Cast the import to the correct type
const suburbs = suburbsRaw as SuburbEntry[];

interface ReserveStep2ContentProps {
  data: Step2Data;
  onSubmit: (updatedData: Step2Data) => void;
}

export default function ReserveStep2Content({
  data,
  onSubmit,
}: ReserveStep2ContentProps) {
  // ---------------------------------------------------------
  // 🎣 STATE & HOOKS
  // ---------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [tempData, setTempData] = useState<Step2Data>(data);
  const [checked, setChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch Availability Data via TRPC
  // Returns a map of "YYYY-MM-DD": count
  const { data: bookingCounts, isLoading: isLoadingAvailability } =
    api.reservation.getAvailability.useQuery();

  // 2. Calculate Modifiers based on Counts (Memoized for performance)
  const modifiers = useMemo(() => {
    if (!bookingCounts) return { full: [], medium: [], low: [] };

    const full: Date[] = [];
    const medium: Date[] = [];

    Object.entries(bookingCounts).forEach(([dateStr, count]) => {
      const dateObj = new Date(dateStr);
      
      // Logic: >5 is Full (Red/Disabled), >2 is Busy (Orange), Else is Open
      if (count > 5) {
        full.push(dateObj);
      } else if (count > 2) {
        medium.push(dateObj);
      }
    });

    return { full, medium };
  }, [bookingCounts]);

  // ---------------------------------------------------------
  // 🛠️ HELPER FUNCTIONS
  // ---------------------------------------------------------

  const modifiersClassNames = {
    full: "bg-red-200 text-gray-400 cursor-not-allowed decoration-slice", // > 5 bookings
    medium: "bg-orange-200 text-orange-900 font-semibold", // > 2 bookings
    today: "font-bold text-blue-600",
    selected: "bg-slate-800 text-white hover:bg-slate-700",
  };

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // ---------------------------------------------------------
  // ⚡ HANDLERS & EFFECTS
  // ---------------------------------------------------------

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = formatLocalDate(date);

    // Guard: Check if date is fully booked in the raw data
    const count = bookingCounts?.[dateStr] ?? 0;
    if (count > 5) {
      alert("Sorry, this date is fully booked!");
      return;
    }

    setTempData((prev) => ({ ...prev, date: dateStr }));
  };

  // Effect: Auto-calculate Delivery Fee when Postcode changes
  useEffect(() => {
    const autoCheck = async () => {
      try {
        setErrorMsg(null);
        
        // Only run if we have a date and a valid 4-digit postcode
        if (!tempData.date || !tempData.postcode || tempData.postcode.length !== 4) {
          setChecked(false);
          if (!tempData.postcode) {
             setTempData((prev) => ({ ...prev, deliveryFee: undefined }));
          }
          return;
        }

        setLoading(true);
        setChecked(false);

        // Simulate brief network delay for UX (optional)
        await new Promise((r) => setTimeout(r, 500));

        // 1. Find Postcode in JSON
        const locationData = suburbs.find(
          (s) => s.postcode === tempData.postcode
        );

        if (!locationData) {
          setErrorMsg("Postcode not found in our delivery zone.");
          setTempData((prev) => ({ ...prev, deliveryFee: undefined }));
          return;
        }

        // 2. Calculate Distance
        const distanceKm = calculateDistance(
          WAREHOUSE_LAT,
          WAREHOUSE_LNG,
          locationData.lat,
          locationData.long
        );

        // 3. Determine Fee Tiers
        let fee: number | undefined;

        if (distanceKm <= 10) {
          fee = 50;  // Close range
        } else if (distanceKm <= 20) {
          fee = 80;  // Mid range
        } else if (distanceKm <= 50) {
          fee = 150; // Far range
        } else {
          // Too far
          setErrorMsg(
            `Sorry, this location is too far (${Math.round(distanceKm)}km).`
          );
          setTempData((prev) => ({ ...prev, deliveryFee: undefined }));
          return;
        }

        setTempData((prev) => ({ ...prev, deliveryFee: fee }));
        setChecked(true);
      } catch (error) {
        console.error("autoCheck failed:", error);
        setErrorMsg("An error occurred checking delivery details.");
      } finally {
        setLoading(false);
      }
    };

    autoCheck().catch((err) => console.error(err));
  }, [tempData.date, tempData.postcode]);

  // ---------------------------------------------------------
  // 🖥️ RENDER
  // ---------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Calendar Section */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Select Event Date
        </label>
        
        {isLoadingAvailability ? (
          <div className="flex h-[300px] w-full items-center justify-center rounded-lg border bg-gray-50">
            <span className="animate-pulse text-sm text-gray-500">
              Loading availability...
            </span>
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <DayPicker
              mode="single"
              selected={tempData.date ? new Date(tempData.date) : undefined}
              onSelect={handleSelectDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              disabled={modifiers.full} // Disable days with >5 bookings
            />
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-red-200"></div>
            <span>Full</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-orange-200"></div>
            <span>Almost Full </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full border border-gray-300 bg-white"></div>
            <span>Available</span>
          </div>
        </div>
      </div>

      {/* Postcode Field */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Postcode
        </label>
        <input
          type="text"
          name="postcode"
          value={tempData.postcode || ""}
          onChange={(e) =>
            setTempData((prev) => ({
              ...prev,
              postcode: e.target.value.replace(/\D/g, ""),
            }))
          }
          placeholder="e.g. 3000"
          required
          maxLength={4}
          className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Helper text showing locality if found */}
        {checked && !errorMsg && tempData.postcode.length === 4 && (
          <p className="mt-1 text-xs text-gray-500">
            Calculating from{" "}
            <span className="font-medium text-gray-700">
              {suburbs.find((s) => s.postcode === tempData.postcode)?.locality}
            </span>
          </p>
        )}
      </div>

      {/* Logic Status Messages */}
      {loading && (
        <div className="animate-pulse text-sm text-gray-600">
          Calculating delivery distance...
        </div>
      )}

      {!loading && errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm font-medium text-red-600">
          <span>❌</span> {errorMsg}
        </div>
      )}

      {!loading && checked && tempData.deliveryFee !== undefined && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-medium text-green-700">
            ✅ Available on {tempData.date}
          </p>
          <p className="mt-1 text-gray-700">
            Delivery & setup fee:{" "}
            <span className="font-bold text-gray-900">
              ${tempData.deliveryFee}
            </span>
          </p>
        </div>
      )}

      <hr className="border-gray-200" />

      {/* Customer Details Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Customer Details
        </h3>

        {/* Name */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            value={tempData.customerName ?? ""}
            onChange={(e) =>
              setTempData((prev) => ({ ...prev, customerName: e.target.value }))
            }
            placeholder="John Doe"
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={tempData.customerEmail ?? ""}
            onChange={(e) =>
              setTempData((prev) => ({
                ...prev,
                customerEmail: e.target.value,
              }))
            }
            placeholder="email@example.com"
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            type="tel"
            value={tempData.customerPhone ?? ""}
            onChange={(e) =>
              setTempData((prev) => ({
                ...prev,
                customerPhone: e.target.value.replace(/\D/g, ""),
              }))
            }
            maxLength={10}
            placeholder="04xxxxxxxx"
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onSubmit(tempData)}
        disabled={
          !checked ||
          loading ||
          !!errorMsg ||
          !tempData.deliveryFee ||
          !tempData.customerName ||
          !tempData.customerEmail ||
          !tempData.customerPhone
        }
        className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        Confirm & Continue
      </button>
    </div>
  );
}