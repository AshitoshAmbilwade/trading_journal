import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Trading Journal App",
  description: "Track, analyze, and improve your trading performance with AI-powered reports.",
  keywords: ["trading journal", "trade tracker", "AI trading analysis", "profit tracking", "investment journal"],
  authors: [{ name: "Your Name" }],
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
      </body>
    </html>
  );
}
