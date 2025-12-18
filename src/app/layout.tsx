import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ClerkProvider } from "@clerk/nextjs";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "U Events | Event Decorations & Party Setups",
  description:
    "U Events creates beautiful event decoration packages for birthdays, baby showers, engagements and more. Browse packages and reserve in minutes.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "U Events | Event Decorations & Party Setups",
    description:
      "Browse decoration packages and reserve your event setup in minutes.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/og/home.jpg", // put in /public/og/home.jpg
        width: 1200,
        height: 630,
        alt: "U Events - Event decorations and setups",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "U Events | Event Decorations & Party Setups",
    description: "Browse decoration packages and reserve your setup in minutes.",
    images: ["/u-events.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={geist.variable}>
        <body>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
