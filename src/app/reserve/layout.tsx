// /app/reserve/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Your Own Decoration Package | U-Events",
  description:
    "Create and reserve your event decoration package in minutes. Check availability, customise your package, and confirm your booking.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/reserve",
  },
  openGraph: {
    title: "Reserve a Decoration Package | U-Events",
    description:
      "Check availability, customise your package, and confirm your booking.",
    url: "/reserve",
    type: "website",
    images: [
      {
        url: "/og/reserve.jpg", // must be absolute OR relative from /public
        width: 1200,
        height: 630,
        alt: "U-Events Decoration Package Reservation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reserve a Decoration Package | U-Events",
    description: "Reserve your event decoration package in minutes.",
    images: ["/u-events.png"],
  },
};

export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
