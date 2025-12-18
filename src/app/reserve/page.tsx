"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import StepTracker from "../reserveForm/StepTracker";
import ExistingReservationSummary from "../reserveForm/ExistingReservationSummary";
import ReserveStep1Content from "../reserveForm/ReserveStep1Content";
import ReserveStep2Content from "../reserveForm/ReserveStep2Content";
import ReserveStep3Content from "../reserveForm/ReserveStep3Content";
import ReserveStep4Content from "../reserveForm/ReserveStep4Content";
import ReserveStep5Content from "../reserveForm/ReserveStep5Content";
import type { SelectionItem } from "../reserveForm/ReserveStep1Content";
import { api } from "~/trpc/react";

export interface ReservationItem {
  key: string;
  name: string;
  quantity: number;
  priceAtBooking: number;
}

export type Step1Data = {
  // The index signature must cover all possible values stored under any key.
  // This includes SelectionItem (single select), SelectionItem[] (multi-select),
  // and the string value for 'message'.
  [key: string]: SelectionItem | SelectionItem[] | string | undefined;
  message: string;
};

// Step 2: Availability & Delivery
export interface Step2Data {
  date: string;
  postcode: string;
  deliveryFee?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

// Step 3: Add-ons
export interface Step3Data {
  addOns: SelectionItem[];
}

export default function ReservePage() {
  const searchParams = useSearchParams();
  const packageId = searchParams.get("id");
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const { data: reservation, isLoading } =
    api.reservation.getReservation.useQuery(
      { id: Number(packageId) },
      { enabled: !!packageId },
    );

  // --- Step control ---
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    if (!isLoaded) return;
    if (!packageId) {
      setCurrentStep(1);
      return;
    }

    if (!isLoading && reservation) {
      if (reservation.userId === user?.id) {
        setCurrentStep(2); // ✅ correct user
      } else {
        router.push("/reserve"); // ❌ not owner — redirect
      }
    }
  }, [packageId, reservation, user, isLoaded, isLoading, router]);


  const [step1Data, setStep1Data] = useState<Step1Data>({
    message: "",
  });

  const handleStep1Submit = (data: Step1Data) => {
    setStep1Data(data); 
    setCurrentStep(2);
  };

  // --- Step 2: Check Availability ---
  const [step2Data, setStep2Data] = useState<Step2Data>({
    date: "",
    postcode: "",
    deliveryFee: undefined,
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });

  const handleStep2Submit = (data: Step2Data) => {
    setStep2Data({
      date: data.date,
      postcode: data.postcode,
      deliveryFee: data.deliveryFee ?? undefined,
      customerName: data.customerName ?? "",
      customerEmail: data.customerEmail ?? "",
      customerPhone: data.customerPhone ?? "",
    });
    setCurrentStep(3);
  };

  const [step3Data, setStep3Data] = useState<Step3Data>({
    addOns: [],
  });

  const handleStep3Submit = (data: { addOns: SelectionItem[] }) => {
    setStep3Data(data);
    setCurrentStep(4);
  };

  const steps = [
    "Create Package",
    "Check Availability",
    "Add-ons",
    "Deposit Payment",
    "Confirmation",
  ];

  return (
    <Suspense>
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
          onStepClick={(step) => setCurrentStep(step)}
        />

        {/* Step Content */}
        {currentStep === 1 ? (
          reservation ? (
            <ExistingReservationSummary
              items={
                Array.isArray(reservation.items)
                  ? (reservation.items as unknown as ReservationItem[])
                  : []
              }
              optionalItems={
                Array.isArray(reservation.optionalItems)
                  ? (reservation.optionalItems as unknown as ReservationItem[])
                  : []
              }
              onContinue={() => setCurrentStep(2)}
              imageUrl={reservation.work.imageUrl}
            />
          ) : (
            <ReserveStep1Content
              data={step1Data}
              onSubmit={handleStep1Submit}
            />
          )
        ) : currentStep === 2 ? (
          <ReserveStep2Content data={step2Data} onSubmit={handleStep2Submit} />
        ) : currentStep === 3 ? (
          <ReserveStep3Content data={step3Data} onSubmit={handleStep3Submit} />
        ) : currentStep === 4 ? (
          <ReserveStep4Content
            reservationId={packageId ? Number(packageId) : undefined}
            existingStep1Data={
              reservation
                ? {
                    items:
                      (reservation.items as unknown as ReservationItem[]) ?? [],
                    optionalItems:
                      (reservation.optionalItems as unknown as ReservationItem[]) ??
                      [],
                  }
                : undefined
            }
            newStep1Data={!reservation ? step1Data : undefined}
            step2Data={step2Data}
            step3Data={step3Data}
            onConfirm={() => setCurrentStep(5)}
          />
        ) : currentStep === 5 ? (
          <ReserveStep5Content packageId={packageId!} />
        ) : (
          <p className="mt-10 text-center text-gray-500">
            Step {currentStep} content not implemented yet.
          </p>
        )}
      </div>
    </div>
    </Suspense>
  );
}
