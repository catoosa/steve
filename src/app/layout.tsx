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

export const metadata: Metadata = {
  metadataBase: new URL("https://skawk.io"),
  title: {
    default: "Skawk | AI Voice Agents That Return JSON, Not Just Transcripts",
    template: "%s | Skawk",
  },
  description:
    "One API call. One phone call. Structured data back. Actions triggered. Agentic voice orchestration for developers.",
  keywords: [
    "AI voice calling",
    "outbound call automation",
    "AI phone agent",
    "voice AI platform",
    "automated calling software",
    "AI call centre",
    "lead qualification automation",
    "appointment reminder calls",
    "bulk calling software",
    "AI voice agent",
    "conversational AI phone",
    "AI calling Australia",
    "outbound dialler AI",
    "voice AI SaaS",
    "call automation platform",
    "structured data extraction",
    "agentic voice orchestration",
  ],
  authors: [{ name: "CareplanAI Pty Ltd", url: "https://skawk.io" }],
  creator: "CareplanAI Pty Ltd",
  publisher: "CareplanAI Pty Ltd",
  category: "technology",
  applicationName: "Skawk",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: "https://skawk.io",
    siteName: "Skawk",
    title: "Skawk | AI Voice Agents That Return JSON, Not Just Transcripts",
    description:
      "One API call. One phone call. Structured data back. Actions triggered. Agentic voice orchestration for developers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Skawk: AI Voice Agents That Return JSON",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@skawkio",
    creator: "@skawkio",
    title: "Skawk | AI Voice Agents That Return JSON, Not Just Transcripts",
    description:
      "One API call. One phone call. Structured data back. Actions triggered. Agentic voice orchestration for developers.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://skawk.io",
  },
  verification: {
    google: "",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
