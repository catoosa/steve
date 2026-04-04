import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Phone,
  PhoneCall,
  Settings,
  Key,
  CreditCard,
  LogOut,
  Bot,
  GitBranch,
  Activity,
  BookOpen,
  MessageSquare,
  Wrench,
  Brain,
  Shield,
  Mic,
  Building2,
  Plug,
  Zap,
  ListOrdered,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/personas", label: "Personas", icon: Bot },
  { href: "/dashboard/voices", label: "Voices", icon: Mic },
  { href: "/dashboard/calls", label: "Call Logs", icon: PhoneCall },
  { href: "/dashboard/pathways", label: "Pathways", icon: GitBranch },
  { href: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/sms", label: "SMS", icon: MessageSquare },
  { href: "/dashboard/workflows", label: "Workflows", icon: Zap },
  { href: "/dashboard/sequences", label: "Sequences", icon: ListOrdered },
  { href: "/dashboard/escalations", label: "Escalations", icon: AlertTriangle },
  { href: "/dashboard/tools", label: "Tools", icon: Wrench },
  { href: "/dashboard/numbers", label: "Numbers", icon: Phone },
  { href: "/dashboard/analytics", label: "Analytics", icon: Activity },
  { href: "/dashboard/memory", label: "Memory", icon: Brain },
  { href: "/dashboard/compliance", label: "Compliance", icon: Shield },
  { href: "/dashboard/agency", label: "Agency", icon: Building2 },
  { href: "/dashboard/api", label: "API Keys", icon: Key },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role, organizations(id, name, slug, plan, call_balance)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const org = membership?.organizations as unknown as Record<string, unknown> | null;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/" className="flex items-center">
            <Image src="/skawk-logo.png" alt="Skawk" width={100} height={33} className="h-7 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          {org && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-semibold truncate">{org.name as string}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, Math.max(5, ((org.call_balance as number) / 50) * 100))}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {(org.call_balance as number) ?? 0}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">calls remaining</p>
            </div>
          )}
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col bg-background">
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
