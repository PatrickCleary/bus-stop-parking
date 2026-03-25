import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Bus Stop Labeler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Analytics />
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
