import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bird,
  LayoutDashboard,
  Megaphone,
  PhoneCall,
  Settings,
  Key,
  CreditCard,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/calls", label: "Call Logs", icon: PhoneCall },
  { href: "/dashboard/api", label: "API Keys", icon: Key },
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

  // Get org
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
      <aside className="w-64 border-r border-border bg-muted/50 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Bird className="w-5 h-5 text-primary" />
            Skawk
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          {org && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium truncate">{org.name as string}</p>
              <p className="text-xs text-muted-foreground">
                {(org.call_balance as number) ?? 0} calls remaining
              </p>
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
      <main className="flex-1 flex flex-col">
        <div className="flex-1 p-8">{children}</div>
      </main>
    </div>
  );
}
