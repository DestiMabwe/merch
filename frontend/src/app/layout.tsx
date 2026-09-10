import type { Metadata } from "next";
import { Anton, Public_Sans } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const billingDisplay = Anton({
  variable: "--font-billing-display",
  weight: "400",
  subsets: ["latin"],
});

const bulletinText = Public_Sans({
  variable: "--font-bulletin-text",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://purpose-ove-pressure.vercel.app"),
  title: "Purpose Over Pressure — Merch Fundraiser | Forward In Faith",
  description:
    "A merch fundraiser from Forward In Faith Ministries Int. Order a tee, crewneck, or hoodie — collect at church, pay by EFT.",
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${billingDisplay.variable} ${bulletinText.variable}`}>
      <body suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
