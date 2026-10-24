import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: false,
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
  adjustFontFallback: false,
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
  display: "swap",
  fallback: ["SFMono-Regular", "Menlo", "Consolas", "monospace"],
  adjustFontFallback: false,
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Toonify — your brand, but it waves back",
    template: "%s · Toonify",
  },
  description:
    "Turn a sentence into a rigged vector mascot with 11 real moves. Export Lottie, SVG, PNG, and a drop-in SDK. No image credits, no keyframes, no lock-in.",
  applicationName: "Toonify",
  keywords: [
    "vector mascot",
    "mascot generator",
    "lottie export",
    "brand mascot",
    "vector animation",
    "no-code animation",
  ],
  authors: [{ name: "Toonify" }],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Toonify",
    title: "Toonify — your brand, but it waves back",
    description:
      "Prompt or voice → a layered vector mascot with a real bone rig and 11 authored moves. Export Lottie, SVG, PNG and an SDK.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Toonify — your brand, but it waves back",
    description:
      "A real vector rig, 11 authored moves, and exports that ship. Built for the Wispr Challenge.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F6EFDF",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrument.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:border-2 focus:border-ink focus:bg-white focus:px-4 focus:py-2 focus:font-mono focus:text-xs"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
