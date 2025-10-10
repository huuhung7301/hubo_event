"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import StepTracker from "../reserveForm/StepTracker";
import ReserveStep1Content from "../reserveForm/ReserveStep1Content";
import ReserveStep2Content from "../reserveForm/ReserveStep2Content";
import ReserveStep3Content from "../reserveForm/ReserveStep3Content";
import ReserveStep4Content from "../reserveForm/ReserveStep4Content";
import ReserveStep5Content from "../reserveForm/ReserveStep5Content";
import type { SelectionItem } from "../_components/selectionCard";

export default function ReservePage() {
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step") || "1";
  const packageId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState<number>(
    parseInt(stepParam, 10),
  );

  // Centralized state for all steps
  // In ReservePage.tsx
  // Centralized state for all steps
  const [reservationData, setReservationData] = useState({
    step1: {
      backdrop: undefined as SelectionItem | undefined,
      decorations: [] as SelectionItem[],
      theme: undefined as SelectionItem | undefined,
      message: "",
    },
    step2: {
      date: "",
      postcode: "",
      deliveryFee: undefined as number | undefined,
    },
    step3: {
      addOns: [] as any[],
    },
  });

  // Log Step 1 data whenever it changes
  useEffect(() => {
    console.log("Step 1 data changed:", reservationData);
  }, [reservationData]);

  // Called when Step 1 submits
  const handleStep1Submit = (data: {
    backdrop?: SelectionItem;
    decorations: SelectionItem[];
    theme?: SelectionItem;
    message: string;
  }) => {
    setReservationData((prev) => ({
      ...prev,
      step1: {
        backdrop: data.backdrop ?? undefined,
        decorations: data.decorations,
        theme: data.theme ?? undefined,
        message: data.message,
      },
    }));
    setCurrentStep(2); // go to Step 2
  };

  // --- inside ReservePage ---
const handleStep2Submit = (data: {
  date: string;
  postcode: string;
  deliveryFee?: number;
}) => {
  setReservationData((prev) => ({
    ...prev,
    step2: {
      date: data.date,
      postcode: data.postcode,
      deliveryFee: data.deliveryFee !== undefined ? data.deliveryFee : undefined,
    },
  }));
  console.log("Step 2 data submitted:", data);
  setCurrentStep(3); // go to Step 3
};

const handleStep3Submit = (data: { addOns: SelectionItem[] }) => {
  setReservationData((prev) => ({
    ...prev,
    step3: data,
  }));
  console.log("Step 3 data submitted:", data);
  setCurrentStep(4);
};



  useEffect(() => {
    setCurrentStep(parseInt(stepParam, 10));
  }, [stepParam]);

  const steps = [
    "Create Package",
    "Check Availability",
    "Add-ons",
    "Deposit Payment",
    "Confirmation",
  ];

  const stepUrls = [
    "/reserve?step=1", // Step 1
    `/reserve?step=2&id=${packageId || ""}`, // Step 2
    `/reserve?step=3&id=${packageId || ""}`, // Step 3
    `/reserve?step=4&id=${packageId || ""}`, // Step 4
    `/reserve?step=5&id=${packageId || ""}`, // Step 5
  ];

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        backgroundImage:
          "url('neutral-abstract-texture-simple-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white/0"></div>

      <div className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-md">
        {/* Step Tracker */}
        <StepTracker
          currentStep={currentStep}
          steps={steps}
          stepUrls={stepUrls}
        />

        {/* Step Content */}
        {currentStep === 1 ? (
          <ReserveStep1Content
            data={reservationData.step1}
            onSubmit={handleStep1Submit}
          />
        ) : currentStep === 2 ? (
          <ReserveStep2Content data={reservationData.step2} onSubmit={handleStep2Submit} />
        ) : currentStep === 3 ? (
          <ReserveStep3Content data={reservationData.step3} onSubmit={handleStep3Submit}/>
        ) : currentStep === 4 ? (
          <ReserveStep4Content data={reservationData} onConfirm={() => setCurrentStep(5)} />
        ) : currentStep === 5 ? (
          <ReserveStep5Content packageId={packageId!} />
        ) : (
          <p className="mt-10 text-center text-gray-500">
            Step {currentStep} content not implemented yet.
          </p>
        )}
      </div>
    </div>
  );
}
