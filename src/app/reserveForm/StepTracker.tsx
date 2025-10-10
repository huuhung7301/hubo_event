"use client";

import { useRouter } from "next/navigation";

interface StepTrackerProps {
  currentStep: number; // e.g. 1–5
  steps: string[]; // step labels
  stepUrls: string[]; // URLs for each step
}

export default function StepTracker({ currentStep, steps, stepUrls }: StepTrackerProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto my-6">
      {steps.map((step, index) => {
        const isActive = currentStep === index + 1;
        const isCompleted = index + 1 < currentStep;

        return (
          <div key={index} className="flex-1 relative">
            {/* Step label */}
            <div
              onClick={() => {
                const url = stepUrls[index];
                if (typeof url === "string") {
                  router.push(url);
                }
              }}
              className={`text-center text-sm cursor-pointer transition-colors ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : isCompleted
                  ? "text-blue-600"
                  : "text-gray-400"
              }`}
            >
              {step}
            </div>

            {/* Line connector */}
            {index < steps.length - 1 && (
              <div
                className={`mt-6 absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 h-[2px] w-full ${
                  isCompleted ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
