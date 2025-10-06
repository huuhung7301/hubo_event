"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface FormData {
  date: string;
  address: string;
  suburb: string;
  postcode: string;
}

// Mock availability data for demonstration
const availabilityData: { [date: string]: "high" | "medium" | "low" | "full" } = {
  "2025-10-07": "high",
  "2025-10-08": "medium",
  "2025-10-09": "low",
  "2025-10-10": "full",
  "2025-10-11": "high",
  "2025-10-12": "medium",
  "2025-10-13": "low",
  "2025-10-14": "full",
};

export default function ReserveStep2() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageId = searchParams.get("id");

  const [form, setForm] = useState<FormData>({
    date: "",
    address: "",
    suburb: "",
    postcode: "",
  });

  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Convert availability data to DayPicker modifiers
  const modifiers = {
    high: Object.keys(availabilityData)
      .filter((d) => availabilityData[d] === "high")
      .map((d) => new Date(d)),
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
    high: "bg-green-200 text-green-800 rounded-lg",
    medium: "bg-yellow-200 text-yellow-800 rounded-lg",
    low: "bg-orange-200 text-orange-800 rounded-lg",
    full: "bg-red-200 text-red-800 rounded-lg opacity-50 pointer-events-none",
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    const dateStr = date.toISOString().split("T")[0];
    if (dateStr && availabilityData[dateStr] === "full") return; // can't select full dates
    setSelectedDate(date);
    setForm({ ...form, date: dateStr ?? "" });
  };

  const checkAvailability = async () => {
    if (!form.date) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500)); // simulate API delay
    const postcodeNum = parseInt(form.postcode);
    const fee = postcodeNum >= 2000 && postcodeNum <= 2100 ? 50 : 80;
    setDeliveryFee(fee);
    setLoading(false);
  };

  const handleNext = () => {
    const params = new URLSearchParams({
      step: "3",
      id: packageId || "",
      ...form,
      deliveryFee: String(deliveryFee || 0),
    });
    router.push(`/reserve/addons?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
        <h1 className="text-2xl font-semibold mb-4">
          Step 2 — Check Availability & Delivery
        </h1>

        {packageId ? (
          <p className="text-sm text-gray-500 mb-6">
            Selected package ID: <span className="font-medium">{packageId}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-6">
            No package selected — you’re creating your own setup.
          </p>
        )}

        <div className="space-y-4">
          {/* Calendar */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Event Date
            </label>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
            />
            <p className="text-xs text-gray-500 mt-1">
              Green = Highly available, Yellow = Partly available, Orange = Almost full, Red = Fully booked
            </p>
          </div>

          {/* Address Fields */}
          <div>
            <label className="block text-sm font-medium mb-1">Event Address</label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Example St"
              required
              className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Suburb</label>
              <input
                type="text"
                name="suburb"
                value={form.suburb}
                onChange={(e) => setForm({ ...form, suburb: e.target.value })}
                placeholder="Sydney"
                required
                className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium mb-1">Postcode</label>
              <input
                type="text"
                name="postcode"
                value={form.postcode}
                onChange={(e) => setForm({ ...form, postcode: e.target.value })}
                placeholder="2000"
                required
                className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Check Availability Button */}
          <button
            onClick={checkAvailability}
            disabled={loading || !form.date}
            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Checking..." : "Check Availability"}
          </button>

          {/* Availability Info */}
          {deliveryFee !== null && (
            <div className="mt-4 border rounded-lg p-4 bg-gray-50">
              <p className="text-green-600 font-medium">
                ✅ Available on {form.date}
              </p>
              <p className="mt-2 text-gray-700">
                Delivery & setup fee: <span className="font-semibold">${deliveryFee}</span>
              </p>
              <button
                onClick={handleNext}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Continue to Add-ons →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
