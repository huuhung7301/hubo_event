"use client";

import { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import type { Step2Data } from "../reserve/page";

interface ReserveStep2ContentProps {
  data: Step2Data;
  onSubmit: (updatedData: Step2Data) => void;
}

const availabilityData: Record<string, "medium" | "low" | "full"> = {
  "2025-10-10": "medium",
  "2025-10-11": "low",
  "2025-10-12": "low",
};

export default function ReserveStep2Content({
  data,
  onSubmit,
}: ReserveStep2ContentProps) {
  const [loading, setLoading] = useState(false);
  const [tempData, setTempData] = useState<Step2Data>(data);
  const [checked, setChecked] = useState(false);

  const modifiers = {
    medium: Object.keys(availabilityData)
      .filter((d) => availabilityData[d] === "medium")
      .map((d) => new Date(d)),
    low: Object.keys(availabilityData)
      .filter((d) => availabilityData[d] === "low")
      .map((d) => new Date(d)),
    full: Object.keys(availabilityData)
      .filter((d) => availabilityData[d] === "full")
      .map((d) => new Date(d)),
  };

  const modifiersClassNames = {
    medium: "bg-yellow-200 focus:outline-none focus:ring-0",
    low: "bg-orange-200 focus:outline-none focus:ring-0",
    full: "bg-red-200 focus:outline-none focus:ring-0",
    selected:
      "border-b-3 border-slate-700 font-semibold text-black focus:outline-none focus:ring-0",
    today: "focus:outline-none focus:ring-0",
  };

  // ✅ Fix 1: local date format, avoid UTC shift
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = formatLocalDate(date);
    if (!dateStr) return;
    if (availabilityData[dateStr] === "full") return; // cannot select fully booked
    setTempData((prev) => ({ ...prev, date: dateStr }));
  };

  // ✅ Fix 2: only run check if postcode is exactly 4 digits
  useEffect(() => {
    const autoCheck = async () => {
      try {
        if (!tempData.date || tempData.postcode.length !== 4) return;
        setLoading(true);
        setChecked(false);

        await new Promise((r) => setTimeout(r, 500));

        const postcodeNum = parseInt(tempData.postcode);
        const fee = postcodeNum >= 2000 && postcodeNum <= 2100 ? 50 : 80;

        setTempData((prev) => ({ ...prev, deliveryFee: fee }));
        setChecked(true);
      } catch (error) {
        console.error("autoCheck failed:", error);
      } finally {
        setLoading(false);
      }
    };

    autoCheck().catch((err) => console.error(err)); // ✅ handled promise
  }, [tempData.date, tempData.postcode]);

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Select Event Date
        </label>
        <DayPicker
          mode="single"
          selected={tempData.date ? new Date(tempData.date) : undefined}
          onSelect={handleSelectDate}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
        />
        <p className="mt-1 text-xs text-gray-500">
          Yellow = Partly available, Orange = Almost full, Red = Fully booked
        </p>
      </div>

      {/* Postcode Field */}
      <div>
        <label className="mb-1 block text-sm font-medium">Postcode</label>
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
          placeholder="2000"
          required
          maxLength={4}
          className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Availability Info */}
      {loading && (
        <div className="text-sm text-gray-600">Checking availability...</div>
      )}

      {!loading && checked && tempData.deliveryFee !== undefined && (
        <div className="mt-4 rounded-lg border bg-gray-50 p-4">
          <p className="font-medium text-green-600">
            ✅ Available on {tempData.date}
          </p>
          <p className="mt-2 text-gray-700">
            Delivery & setup fee:{" "}
            <span className="font-semibold">${tempData.deliveryFee}</span>
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <button
        onClick={() => onSubmit(tempData)}
        disabled={!checked || loading || !tempData.deliveryFee}
        className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        Choose This Date
      </button>
    </div>
  );
}
