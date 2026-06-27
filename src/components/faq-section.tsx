"use client";

import { useState } from "react";

const FAQ_CATEGORIES: Record<string, { q: string; a: string }[]> = {
  "Getting Started": [
    {
      q: "How do I get started with Skawk?",
      a: "Sign up for a free account with 50 calls included. No credit card required. You can launch your first campaign in minutes using one of our 12+ templates, or connect via API.",
    },
    {
      q: "Do I need technical knowledge to use Skawk?",
      a: "No. The dashboard lets you create campaigns, configure agents, and launch calls without writing any code. For developers, we also offer a full REST API with 50+ endpoints.",
    },
    {
      q: "How quickly can I get up and running?",
      a: "Minutes. Pick a campaign template, upload your contacts (CSV or paste), and hit launch. For API users, it is a single POST request to make a call.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes. Every account starts with 50 free calls. Full platform access, no credit card required. Use them to test the platform before committing to a paid plan.",
    },
  ],
  "Platform & Features": [
    {
      q: "How many calls can Skawk make simultaneously?",
      a: "Up to 10,000 simultaneous calls. Launch a batch campaign via the dashboard or a single API call. Scale up or down instantly. No infrastructure to manage.",
    },
    {
      q: "Can Skawk handle both inbound and outbound calls?",
      a: "Yes. Outbound campaigns let you call thousands of contacts in parallel. Inbound numbers let you purchase a phone number and configure an AI agent to answer calls 24/7 with pre-built persona templates.",
    },
    {
      q: "What languages does Skawk support?",
      a: "40+ languages including English (AU, US, UK), Spanish, French, German, Japanese, Chinese, Korean, Portuguese, Italian, Arabic, Hindi, and more. Babel mode auto-detects and switches mid-call.",
    },
    {
      q: "How does A/B testing work?",
      a: "When creating a campaign, enable A/B testing and write different prompts for each variant. Skawk randomly splits your contacts across variants and shows a side-by-side comparison of answer rates, duration, and dispositions so you can see which script wins.",
    },
    {
      q: "What is a knowledge base?",
      a: "A knowledge base lets your AI agent reference your own documents, FAQs, or web pages during a live call. Upload text, files, or URLs and the agent retrieves relevant information in real time to answer caller questions accurately.",
    },
    {
      q: "How does voice cloning work?",
      a: "Upload a short audio clip (a recording, a podcast snippet, or a client-supplied file). Skawk generates a cloned voice model you can assign to any persona. No studio time or specialist software required.",
    },
  ],
  "Pricing & Billing": [
    {
      q: "How much does Skawk cost?",
      a: "Free plan: 50 calls, no cost. Starter: $149/mo for 300 calls. Pro: $499/mo for 1,500 calls. Agency: $599/mo for multi-client management. Enterprise: custom pricing. See our pricing page for full details.",
    },
    {
      q: "What happens if I exceed my call limit?",
      a: "On Starter and Pro plans, additional calls are billed at the per-call overage rate ($0.55 and $0.40 respectively). You will never be cut off mid-campaign.",
    },
    {
      q: "Is there a contract or can I cancel anytime?",
      a: "No contracts. All plans are month-to-month. Cancel anytime from the billing dashboard. Enterprise plans may have annual terms with discounted rates.",
    },
  ],
  Technical: [
    {
      q: "How does the API work?",
      a: "Simple REST API. Send a POST to /api/v1/calls with a phone number, prompt, and optional analysis schema. Skawk handles the call, transcription, and data extraction. Results come back via webhook or polling. Full API docs available in the dashboard.",
    },
    {
      q: "What webhook events are available?",
      a: "Webhooks fire on call completion with the full transcript, extracted analysis JSON, duration, disposition, and sentiment data. Configure webhook URLs per campaign or per inbound number.",
    },
    {
      q: "Can Skawk integrate with my existing CRM?",
      a: "Yes. We integrate with Salesforce, HubSpot, GoHighLevel, and any system via webhooks, Zapier, or our REST API. Call results can be pushed to your CRM automatically after each call.",
    },
    {
      q: "Can I give clients access to results?",
      a: "Yes. The client portal gives your clients a branded read-only dashboard showing their campaign stats, call outcomes, and dispositions. No login or dashboard access required on their end.",
    },
  ],
  "Compliance & Security": [
    {
      q: "Is Skawk compliant with Australian Spam Act and TCPA?",
      a: "Yes. Built-in compliance presets cover Australian Spam Act, US TCPA, and EU GDPR. One click applies AI disclosure, company identification, opt-out handling, and recording consent rules to every call.",
    },
    {
      q: "How is customer data protected?",
      a: "All data is encrypted in transit and at rest. We use enterprise-grade infrastructure with role-based access control. Call recordings and transcripts are stored securely with configurable retention periods.",
    },
    {
      q: "Is white-labelling available?",
      a: "Yes, on Enterprise plans. You get a custom domain, your own logo throughout the platform, and a fully branded client portal. Ideal for agencies running campaigns on behalf of multiple clients.",
    },
  ],
};

const CATEGORY_NAMES = Object.keys(FAQ_CATEGORIES);

export function FaqSection() {
  const [active, setActive] = useState("All");

  const allFaqs = Object.entries(FAQ_CATEGORIES).flatMap(([cat, items]) =>
    items.map((item) => ({ ...item, category: cat }))
  );

  const filtered =
    active === "All"
      ? allFaqs
      : allFaqs.filter((f) => f.category === active);

  return (
    <section className="py-24 px-6 bg-muted">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
            FAQ
          </p>
          <h2 className="text-4xl font-black mb-4">Common questions</h2>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {["All", ...CATEGORY_NAMES].map((cat) => {
            const count =
              cat === "All"
                ? allFaqs.length
                : FAQ_CATEGORIES[cat]?.length ?? 0;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  active === cat
                    ? "bg-primary text-white"
                    : "bg-card border border-border text-muted-foreground hover:bg-card/80"
                }`}
              >
                {cat}
                <span
                  className={`ml-1 text-xs ${
                    active === cat
                      ? "text-white/70"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAQ items */}
        <div className="space-y-4">
          {filtered.map((item) => (
            <details
              key={item.q}
              className="bg-card border border-border rounded-2xl px-6 py-4 group"
            >
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between gap-4">
                {item.q}
                <span className="text-muted-foreground text-xl group-open:rotate-45 transition-transform shrink-0">
                  +
                </span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
