import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { AppProviders } from "@/components/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Miraf · Your EPUB library",
  description: "A calm, local-first EPUB reader.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
