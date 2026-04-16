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
  },
  twitter: {
    card: "summary_large_image",
    site: "@skawkio",
    creator: "@skawkio",
    title: "Skawk | AI Voice Agents That Return JSON, Not Just Transcripts",
    description:
      "One API call. One phone call. Structured data back. Actions triggered. Agentic voice orchestration for developers.",
  },
  alternates: {
    canonical: "https://skawk.io",
    languages: {
      "en-AU": "https://skawk.io",
      "x-default": "https://skawk.io",
    },
  },
  verification: {
    google: "",
  },
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Skawk",
    legalName: "CareplanAI Pty Ltd",
    url: "https://skawk.io",
    description:
      "AI voice agents that return structured JSON data. One API call, one phone call, structured data back.",
    foundingDate: "2025",
    founder: { "@type": "Person", name: "Andrew Payne" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "CICADA Health Technology Hub, Westmead Hospital",
      addressLocality: "Westmead",
      addressRegion: "NSW",
      postalCode: "2145",
      addressCountry: "AU",
    },
    sameAs: ["https://careplans.io", "https://nonni.ai", "https://tradee.io"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: "andrew@skawk.io",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Skawk",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description:
      "AI voice calling platform for developers. Make outbound calls, extract structured data, trigger actions — all via API.",
    url: "https://skawk.io",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "999",
      priceCurrency: "AUD",
      offerCount: "3",
    },
    featureList:
      "AI Voice Agents, Structured JSON Extraction, Outbound Calling API, Webhook Integrations, Lead Qualification, Appointment Booking, White-Label Voice AI",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Skawk",
    url: "https://skawk.io",
    inLanguage: "en-AU",
    copyrightHolder: { "@type": "Organization", name: "CareplanAI Pty Ltd" },
    copyrightYear: "2025",
  },
];

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
      <head>
        {structuredData.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
