import type { Metadata } from "next";
import { Anton, Public_Sans } from "next/font/google";
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
  title: "Purpose Over Pressure — Camp Merch | Forward In Faith",
  description:
    "This year's camp merch drop from Forward In Faith Ministries Int. Order a tee, crewneck, or hoodie — pickup only, pay by EFT.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${billingDisplay.variable} ${bulletinText.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
