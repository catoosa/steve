import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Terms of Service — Skawk | CareplanAI Pty Ltd",
  description: "Terms of Service for Skawk, an AI voice calling platform operated by CareplanAI Pty Ltd.",
};

export default function TermsPage() {
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
        <h1 className="text-4xl font-black text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-white/40 mb-12">Last updated 3 April 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">Agreement</h2>
            <p>
              These Terms of Service govern your use of <strong className="text-white">Skawk</strong>, operated by
              CareplanAI Pty Ltd (ABN 92 691 158 237). By accessing or using the service, you agree
              to be bound by these terms. If you do not agree, you must not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Acceptable use</h2>
            <p>You agree to use Skawk only for lawful purposes. You must not:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the service to make calls that are unlawful, harassing, threatening, or fraudulent</li>
              <li>Conduct voice campaigns that breach the Spam Act 2003, the Do Not Call Register Act 2006, or any other applicable telecommunications legislation</li>
              <li>Attempt to gain unauthorised access to any part of the service, other accounts, or connected systems</li>
              <li>Use the service to impersonate any person or entity without proper disclosure</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the service</li>
              <li>Use the service in any way that could damage, disable, or impair its operation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Service availability</h2>
            <p>
              We provide Skawk on a best-efforts basis. We do not guarantee uninterrupted or
              error-free service. Scheduled and unscheduled maintenance may result in temporary
              unavailability. Service level agreements are available only under a separate enterprise
              agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Your data</h2>
            <p>
              You retain ownership of all data you upload to or generate through Skawk, including call
              recordings, transcripts, and campaign data. We do not claim any intellectual property
              rights over your content. By using the service, you grant us a limited licence to process
              your data solely for the purpose of delivering the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Intellectual property</h2>
            <p>
              The Skawk platform, including its software, design, branding, and documentation, is
              the intellectual property of CareplanAI Pty Ltd. You may not copy, modify, distribute,
              or create derivative works from any part of the platform without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, CareplanAI Pty Ltd is not liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your
              use of the service. Our total liability for any claim arising from or related to the
              service is limited to the fees you have paid to us in the twelve months preceding the
              claim. Nothing in these terms excludes or limits liability that cannot be excluded or
              limited under Australian law, including liability under the Australian Consumer Law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Termination</h2>
            <p>
              We may suspend or terminate your access to the service at any time if you breach these
              terms. You may close your account at any time by contacting us. Upon termination, your
              right to use the service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Governing law</h2>
            <p>
              These terms are governed by the laws of <strong className="text-white">New South Wales, Australia</strong>.
              Any disputes arising from these terms or the service will be subject to the exclusive
              jurisdiction of the courts of New South Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
              <a href="mailto:andrew@careplans.io" className="text-primary underline">andrew@careplans.io</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
