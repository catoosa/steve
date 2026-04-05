import Link from "next/link";
import {
  ArrowRight,
  Phone,
  Brain,
  Zap,
  AlertTriangle,
  MessageSquare,
  Clock,
  Database,
  ChevronRight,
  Activity,
  Shield,
  ListOrdered,
  CheckCircle2,
  Users,
  BarChart3,
  Building2,
  Mic,
  BookOpen,
  Bot,
  Megaphone,
  PhoneIncoming,
  FileJson,
  GitBranch,
  RefreshCw,
  Heart,
  TrendingUp,
  DollarSign,
  Headphones,
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">Skawk</Link>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</Link>
            <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Help</Link>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
            <Link href="/signup" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Your phone calls should<br />
            <span className="text-primary">work for you</span>, not the other way around
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Skawk makes AI phone calls, extracts the data you need, and takes action on it — automatically. Here&apos;s the story of how it works.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">The problem</p>
          <h2 className="text-3xl font-black mb-6">Phone calls don&apos;t scale. Your business does.</h2>
          <div className="prose prose-lg text-muted-foreground space-y-4">
            <p>
              Every day, businesses need to make hundreds or thousands of phone calls. Sales follow-ups. Patient check-ins. Appointment reminders. Debt recovery. Lead qualification. Customer surveys.
            </p>
            <p>
              The maths never works. One person makes maybe 60 calls a day. To reach 1,000 people, you need a team of 17. To reach them at the right time, in the right language, with the right script — and then actually <em>do something</em> with what they tell you — that&apos;s where it breaks down.
            </p>
            <p>
              The call itself was never the hard part. It&apos;s everything that comes after.
            </p>
          </div>
        </div>
      </section>

      {/* The Story: Step by Step */}
      <section className="py-16 px-6 bg-muted/30 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">How Skawk works</p>
          <h2 className="text-3xl font-black mb-12">From setup to autopilot in four steps</h2>

          {/* Step 1 */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">1</div>
              <h3 className="text-xl font-bold">Tell Skawk who to be</h3>
            </div>
            <div className="pl-[52px] space-y-4 text-muted-foreground">
              <p>
                You create a <strong className="text-foreground">persona</strong> — an AI agent with a name, a voice, and a personality. Maybe it&apos;s Emma, a warm aged care nurse doing post-discharge check-ins. Or Marcus, a direct debt recovery specialist. Or Priya, a multilingual customer success agent who speaks Hindi and English.
              </p>
              <p>
                You write a prompt that tells the agent what to say, what to ask, and how to behave. You pick a voice — or clone your own from a 30-second audio clip. You choose the language. That&apos;s your agent.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { icon: Bot, label: "Create persona", detail: "Name, personality, goals" },
                  { icon: Mic, label: "Choose voice", detail: "Pre-built or clone yours" },
                  { icon: BookOpen, label: "Add knowledge", detail: "Upload docs for real-time RAG" },
                ].map((item, i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-4">
                    <item.icon className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">2</div>
              <h3 className="text-xl font-bold">Tell Skawk who to call and what to extract</h3>
            </div>
            <div className="pl-[52px] space-y-4 text-muted-foreground">
              <p>
                Upload a CSV of contacts, or pass them via API. Create a <strong className="text-foreground">campaign</strong> — that&apos;s a batch of calls with a shared script and purpose.
              </p>
              <p>
                The key is the <strong className="text-foreground">analysis prompt</strong>. This tells Skawk what structured data to pull from every conversation. For a patient check-in, that might be:
              </p>
              <div className="bg-[#0d1117] border border-border rounded-xl overflow-hidden mt-4">
                <div className="px-4 py-2 border-b border-border/50 flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-xs text-white/40 ml-2 font-mono">analysis_prompt</span>
                </div>
                <pre className="p-5 text-sm font-mono text-green-400 overflow-x-auto">{`Extract from the call:
{
  "pain_level": number (1-10),
  "medication_adherence": boolean,
  "mood": "positive" | "anxious" | "distressed",
  "escalation_needed": boolean,
  "summary": "one-line clinical summary"
}`}</pre>
              </div>
              <p className="mt-4">
                For solar sales, it might be <code className="text-xs bg-muted px-1.5 py-0.5 rounded">interested: boolean, roof_type: string, budget_range: string</code>. For debt recovery, <code className="text-xs bg-muted px-1.5 py-0.5 rounded">promise_to_pay: boolean, amount_agreed: number, payment_date: string</code>. You define the schema. Skawk fills it in.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">3</div>
              <h3 className="text-xl font-bold">Tell Skawk what to do with the answers</h3>
            </div>
            <div className="pl-[52px] space-y-4 text-muted-foreground">
              <p>
                This is where Skawk leaves every other voice AI platform behind.
              </p>
              <p>
                You create <strong className="text-foreground">workflows</strong> — rules that evaluate the extracted data and trigger actions automatically. No code. No webhooks to build. No duct tape.
              </p>
              <div className="space-y-3 mt-6">
                {[
                  {
                    condition: 'If pain_level > 7',
                    actions: "Create critical escalation for nursing team + SMS the patient reassurance + webhook to clinical system",
                    color: "border-red-500/30 bg-red-500/5",
                    icon: AlertTriangle,
                    iconColor: "text-red-500",
                  },
                  {
                    condition: "If medication_adherence = false",
                    actions: "Schedule a callback in 24 hours with a medication-focused script + send a reminder SMS",
                    color: "border-purple-500/30 bg-purple-500/5",
                    icon: Clock,
                    iconColor: "text-purple-500",
                  },
                  {
                    condition: "If mood = positive AND pain_level < 3",
                    actions: 'Send encouraging SMS: "Great to hear you\'re doing well!"',
                    color: "border-green-500/30 bg-green-500/5",
                    icon: Heart,
                    iconColor: "text-green-500",
                  },
                  {
                    condition: "If interested = true",
                    actions: "Update CRM via webhook + enrol in follow-up sequence + notify sales team",
                    color: "border-blue-500/30 bg-blue-500/5",
                    icon: TrendingUp,
                    iconColor: "text-blue-500",
                  },
                ].map((rule, i) => (
                  <div key={i} className={`border rounded-xl p-4 ${rule.color}`}>
                    <div className="flex items-start gap-3">
                      <rule.icon className={`w-5 h-5 mt-0.5 ${rule.iconColor}`} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{rule.condition}</p>
                        <p className="text-sm mt-1">{rule.actions}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4">
                You can also build <strong className="text-foreground">multi-touch sequences</strong>: Day 1 call → Day 3 SMS check-in → Day 7 follow-up call. The whole journey, automated.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">4</div>
              <h3 className="text-xl font-bold">Launch and watch it work</h3>
            </div>
            <div className="pl-[52px] space-y-4 text-muted-foreground">
              <p>
                Hit launch. Skawk calls every contact simultaneously — up to 10,000 at once. Each call runs through your agent, extracts the structured data, evaluates your workflows, and fires the actions. All in real time.
              </p>
              <p>
                You see it all in the dashboard:
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { icon: Phone, label: "Live call stats", detail: "Answer rates, durations, outcomes" },
                  { icon: Database, label: "Structured data", detail: "Every call result as clean JSON" },
                  { icon: AlertTriangle, label: "Escalation queue", detail: "Priority-sorted, actionable" },
                  { icon: Activity, label: "Contact timeline", detail: "Full history per person" },
                  { icon: BarChart3, label: "Analytics", detail: "Disposition funnels, trends" },
                  { icon: FileJson, label: "Export", detail: "CSV, PDF, or API" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-lg p-4">
                    <item.icon className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Stories */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Who it helps</p>
          <h2 className="text-3xl font-black mb-10">Every industry that picks up the phone</h2>

          <div className="space-y-10">
            {/* Healthcare */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-lg font-bold">Healthcare & Aged Care</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                A hospital discharges 40 patients a week. Each needs a follow-up call within 48 hours — checking pain levels, medication adherence, mobility, and emotional state. If pain is severe or medication is missed, a nurse needs to know immediately.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">With Skawk:</strong> Emma, an AI care nurse, calls every patient. She extracts clinical data. If pain exceeds 7/10, the nursing team gets an instant escalation. If medication is missed, a reminder call is automatically scheduled for the next day. The clinical team sees a unified timeline of every patient interaction. Zero manual follow-up. Zero patients falling through the cracks.
              </p>
            </div>

            {/* Solar */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-yellow-500" />
                </div>
                <h3 className="text-lg font-bold">Solar & Home Services</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                A solar company generates 500 leads a week from Facebook ads. Their sales team can call maybe 100. The other 400 go cold.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">With Skawk:</strong> Every lead gets a call within minutes. The AI qualifies them — roof type, ownership status, budget range, interest level. Interested leads are instantly pushed to the CRM and enrolled in a 3-day follow-up sequence. Not interested? Marked and never called again. The sales team only talks to warm, qualified leads.
              </p>
            </div>

            {/* Debt Recovery */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-lg font-bold">Debt Recovery & Collections</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                A collections firm has 10,000 accounts in arrears. Human agents cost $30/hour and burn out fast. Compliance requirements make every call a legal minefield.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">With Skawk:</strong> Compliant AI calls every account with built-in guard rails — AI disclosure, company identification, recording notice, opt-out handling. Promise-to-pay is extracted as structured data. Accounts that agree to pay are updated automatically. Those that request no further contact are added to the DNC list instantly. 10,000 calls in a morning.
              </p>
            </div>

            {/* Agencies */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold">Marketing Agencies</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                An agency manages outbound campaigns for 8 clients. Each has different scripts, compliance requirements, and reporting needs. Currently juggling spreadsheets and separate tools.
              </p>
              <p className="text-muted-foreground">
                <strong className="text-foreground">With Skawk:</strong> Each client gets their own sub-account with dedicated call limits. The agency manages everything from one dashboard. Clients see their own branded portal with real-time results — no login required. Usage reports export to CSV. The agency bills whatever markup they want.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Key Difference */}
      <section className="py-16 px-6 bg-muted/30 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">The difference</p>
          <h2 className="text-3xl font-black mb-6">Other tools make the call. Skawk runs the system.</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Most voice AI platforms give you an API to make a phone call. When the call ends, they fire a webhook and wish you luck.
            </p>
            <p>
              You still have to build the logic that decides what happens next. You write the code that checks if a patient needs escalation. You build the integration that schedules a follow-up. You design the system that tracks every interaction over time. You maintain it all.
            </p>
            <p>
              <strong className="text-foreground">Skawk is what comes after the call.</strong>
            </p>
            <p>
              Workflows evaluate the structured data from every conversation and chain actions automatically — SMS, callbacks, escalations, webhooks, CRM updates. Sequences run multi-day journeys. Escalations route urgent cases to humans. Timelines give you the full picture for every contact.
            </p>
            <p>
              You set up the rules once. Skawk runs them every time. At scale.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { number: "10,000", label: "simultaneous calls" },
              { number: "40+", label: "languages supported" },
              { number: "<300ms", label: "average latency" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-black text-primary">{stat.number}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-bold text-primary uppercase tracking-wider mb-3">Getting started</p>
          <h2 className="text-3xl font-black mb-8">Up and running in minutes</h2>

          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Sign up for free",
                desc: "No credit card. 50 calls included. Takes 30 seconds.",
                link: "/signup",
              },
              {
                step: "2",
                title: "Create your first persona",
                desc: "Give your AI agent a name, voice, and personality. Use a template or write your own prompt.",
                link: "/dashboard/personas/new",
              },
              {
                step: "3",
                title: "Set up a workflow",
                desc: "Define what happens when calls complete. Conditions + actions, no code needed.",
                link: "/dashboard/workflows/new",
              },
              {
                step: "4",
                title: "Launch a campaign",
                desc: "Upload contacts, hit launch, and watch the data flow in.",
                link: "/dashboard/campaigns/new",
              },
            ].map((item, i) => (
              <Link key={i} href={item.link} className="flex items-start gap-4 group">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="font-semibold group-hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Stop making calls.<br />Start running systems.</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            50 free calls. Full platform access. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-white hover:bg-primary/90 transition-all"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-4 text-base font-medium hover:bg-muted transition-colors"
            >
              See Healthcare Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <p>&copy; 2026 CareplanAI Pty Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="mailto:hello@skawk.io" className="hover:text-foreground transition-colors">hello@skawk.io</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
