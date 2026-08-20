import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SellerStudio AI — AI Product Photos & Marketplace Listing Creator",
  description:
    "Turn ordinary product photos into marketplace-ready listings, professional product images and marketing creatives in minutes.",
  manifest: "/manifest.json",
  openGraph: {
    title: "SellerStudio AI — AI Product Photos & Marketplace Listing Creator",
    description: "Upload once. Sell everywhere.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#4F46E5" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
