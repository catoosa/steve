import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Privacy Policy — Skawk | CareplanAI Pty Ltd",
  description: "Privacy Policy for Skawk, an AI voice calling platform operated by CareplanAI Pty Ltd.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      <nav className="border-b border-white/10 bg-[#1a1a2e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/skawk-logo.png" alt="Skawk" width={120} height={40} className="h-9 w-auto" />
          </Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">&larr; Back to home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-black text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-white/40 mb-12">Last updated 3 April 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">Who we are</h2>
            <p>
              Skawk is operated by <strong className="text-white">CareplanAI Pty Ltd</strong> (ABN 92 691 158 237),
              located at CICADA Innovations, Westmead Hospital, Sydney NSW 2145, Australia.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">What data we collect</h2>
            <p>When you use Skawk, we may collect and process the following information:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Call recordings and transcripts</li>
              <li>Contact phone numbers and associated metadata</li>
              <li>Structured call data (outcomes, dispositions, extracted fields)</li>
              <li>Campaign configuration and analytics</li>
              <li>Account credentials and authentication data</li>
              <li>API usage logs and platform interaction data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">How we use it</h2>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Deliver the Skawk voice calling service, including call execution, recording, and transcription</li>
              <li>Generate campaign analytics and performance reporting</li>
              <li>Maintain audit trails and compliance records</li>
              <li>Improve service quality and develop new features</li>
              <li>Communicate with you about your account and the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Where it is stored</h2>
            <p>
              All data is stored in <strong className="text-white">AWS Sydney (ap-southeast-2)</strong>. Your data
              remains within Australian data centres and is not transferred offshore. We maintain strict
              Australian data residency for all customer information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Who we share it with</h2>
            <p>
              We do not sell your data. We do not transfer your data offshore. We may share data with:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Your contracting service provider, as part of normal service delivery</li>
              <li>Call recipients, who receive voice calls initiated through your campaigns</li>
              <li>Infrastructure providers who process data solely within Australia on our behalf</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Data retention and deletion</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide the service.
              Call recordings and transcripts are retained according to your account settings. You may request
              deletion of your data at any time by contacting us. Upon receiving a valid deletion request,
              we will remove your personal information within 30 days, except where retention is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Your rights</h2>
            <p>
              Under the <strong className="text-white">Privacy Act 1988</strong> and the{" "}
              <strong className="text-white">Australian Privacy Principles</strong>, you have the right to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Lodge a complaint with the Office of the Australian Information Commissioner (OAIC) if you believe we have breached the Australian Privacy Principles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>
              For questions about this policy or to exercise your privacy rights, contact us at{" "}
              <a href="mailto:andrew@careplans.io" className="text-primary underline">andrew@careplans.io</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
