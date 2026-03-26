import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { DM_Sans, Syne } from "next/font/google";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });

const siteUrl = "https://busstops.nyc";

export const metadata: Metadata = {
  title: "Blocked Bus Stops in Manhattan",
  description: "Mapping illegal parking at NYC bus stops",
  openGraph: {
    images: [`${siteUrl}/social-preview.png`],
  },
  twitter: {
    card: "summary_large_image",
    images: [`${siteUrl}/social-preview.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${syne.variable}`}>
      <Analytics />
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
