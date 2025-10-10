"use client";

interface ReserveStep5ContentProps {
  packageId: string;
}

export default function ReserveStep5Content({ packageId }: ReserveStep5ContentProps) {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-xl font-semibold">Step 5: Confirmation</h2>
      <p>Your reservation is confirmed!</p>
      {packageId && <p>Package ID: {packageId}</p>}
      <p className="mt-4">An email confirmation has been sent to your inbox.</p>
    </div>
  );
}
