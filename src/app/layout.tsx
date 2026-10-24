import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono, Shantell_Sans, Bagel_Fat_One } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
  adjustFontFallback: false,
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
});

const shantell = Shantell_Sans({
  subsets: ["latin"],
  variable: "--font-shantell",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["cursive", "sans-serif"],
  adjustFontFallback: false,
});

const bagel = Bagel_Fat_One({
  subsets: ["latin"],
  variable: "--font-bagel",
  weight: ["400"],
  display: "swap",
  fallback: ["cursive", "sans-serif"],
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
    default: "Anitoon — your brand, but it waves back",
    template: "%s · Anitoon",
  },
  description:
    "Turn a sentence into a rigged vector mascot with 11 real moves. Export Lottie, SVG, PNG, and a drop-in SDK. No image credits, no keyframes, no lock-in.",
  applicationName: "Anitoon",
  keywords: [
    "vector mascot",
    "mascot generator",
    "lottie export",
    "brand mascot",
    "vector animation",
    "no-code animation",
    "anitoon",
  ],
  authors: [{ name: "Anitoon" }],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Anitoon",
    title: "Anitoon — your brand, but it waves back",
    description:
      "Prompt or voice → a layered vector mascot with a real bone rig and 11 authored moves. Export Lottie, SVG, PNG and an SDK.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anitoon — your brand, but it waves back",
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
  themeColor: "#efece4",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceMono.variable} ${shantell.variable} ${bagel.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#efece4] text-[#111111]">
        <a
          href="#main"
          className="fixed -top-96 left-4 z-[80] min-h-[44px] min-w-[44px] rounded-[13px] border border-[#d7d4cb] bg-[#fefdf9] px-4 py-2.5 font-mono text-[12.5px] text-[#111111] shadow-sm transition-all focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
