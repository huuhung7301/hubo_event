// /app/reserve/layout.tsx
"use client";

import { Suspense } from "react";

export default function ReserveLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {children}
    </Suspense>
  );
}
