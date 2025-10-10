"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface Step2Data {
  date: string;
  postcode: string;
  deliveryFee?: number;
}

interface ReserveStep2ContentProps {
  data: Step2Data;
  onSubmit: (updatedData: Step2Data) => void;
}

const availabilityData: { [date: string]: "medium" | "low" | "full" } = {
  "2025-10-10": "medium",
  "2025-10-11": "low",
  "2025-10-12": "low",
};

export default function ReserveStep2Content({ data, onSubmit }: ReserveStep2ContentProps) {
  const [loading, setLoading] = useState(false);

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
    selected: "border-b-3 border-slate-700 font-semibold text-black focus:outline-none focus:ring-0",
    today: "focus:outline-none focus:ring-0",
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = date.toISOString().split("T")[0];
    if (!dateStr) return;
    if (availabilityData[dateStr] === "full") return; // cannot select fully booked
    onSubmit({ ...data, date: dateStr });
  };

  const checkAvailability = async () => {
    if (!data.date || !data.postcode) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const postcodeNum = parseInt(data.postcode);
    const fee = postcodeNum >= 2000 && postcodeNum <= 2100 ? 50 : 80;

    setLoading(false);
    onSubmit({ ...data, deliveryFee: fee });
  };

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div>
        <label className="mb-2 block text-sm font-medium">Select Event Date</label>
        <DayPicker
          mode="single"
          selected={data.date ? new Date(data.date) : undefined}
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
          value={data.postcode || ""}
          onChange={(e) => onSubmit({ ...data, postcode: e.target.value })}
          placeholder="2000"
          required
          className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Check Availability Button */}
      <button
        onClick={checkAvailability}
        disabled={loading || !data.date || !data.postcode}
        className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Checking..." : "Check Availability"}
      </button>

      {/* Availability Info */}
      {data.deliveryFee !== undefined && (
        <div className="mt-4 rounded-lg border bg-gray-50 p-4">
          <p className="font-medium text-green-600">✅ Available on {data.date}</p>
          <p className="mt-2 text-gray-700">
            Delivery & setup fee: <span className="font-semibold">${data.deliveryFee}</span>
          </p>
        </div>
      )}
    </div>
  );
}
