import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trading Journal App",
  description:
    "Track, analyze, and improve your trading performance with AI-powered reports.",
  keywords: [
    "trading journal",
    "trade tracker",
    "AI trading analysis",
    "profit tracking",
    "investment journal",
  ],
  authors: [{ name: "Ashitosh Ambilwade by Earnotic" }],
  openGraph: {
    title: "Trading Journal App",
    description: "AI-powered trade tracking and performance analysis.",
    url: "https://yourproject.vercel.app",
    siteName: "Trading Journal",
    images: ["/og-image.png"],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster /> {/* ✅ add toaster globally at the end */}

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
