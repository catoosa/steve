import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Lock, Code2, Key } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#1a1a2e]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/skawk-logo.png" alt="Skawk" width={120} height={40} className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover transition-all glow-orange"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="max-w-lg text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8">
            <Lock className="w-8 h-8 text-accent" />
          </div>

          <h1 className="text-3xl font-black text-white mb-4">
            API Documentation
          </h1>
          <p className="text-white/50 mb-8 leading-relaxed">
            Full API docs, code examples, and your API key are available inside
            the dashboard. Create an account to get started — it takes 30 seconds.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-sm font-bold text-white/70 mb-4">What you get access to:</h3>
            <ul className="space-y-3">
              {[
                { icon: Key, text: "Your personal API key" },
                { icon: Code2, text: "58 API endpoints across 14 domains" },
                { icon: Code2, text: "Calls, Pathways, Personas, Knowledge Bases, SMS, and more" },
                { icon: Code2, text: "Curl examples, webhook payloads, and response schemas" },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-white/60">
                  <item.icon className="w-4 h-4 text-accent shrink-0" />
                  {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover transition-all glow-orange"
            >
              Create Account
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-white hover:bg-white/5 transition-colors"
            >
              Already have an account? Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
