import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Phone, Ghost, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listNumbers } from "@/lib/bland";

export default async function NumbersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let numbers: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  try {
    const result = await listNumbers();
    // Bland returns an array or { inbound_numbers: [...] }
    numbers = Array.isArray(result)
      ? result
      : result?.inbound_numbers ?? result?.numbers ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load numbers";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Inbound Numbers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Purchase and configure phone numbers for inbound AI-answered calls.
          </p>
        </div>
        <Link
          href="/dashboard/numbers/purchase"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          Purchase Number
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {!error && numbers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
          <Ghost className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No numbers yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Purchase your first inbound phone number to let an AI agent answer
            incoming calls automatically.
          </p>
          <Link
            href="/dashboard/numbers/purchase"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4" />
            Purchase Number
          </Link>
        </div>
      )}

      {numbers.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {numbers.map((n) => {
            const id = String(n.id || n.phone_number_id || n.number_id || "");
            const phoneNumber = String(
              n.phone_number || n.number || "Unknown"
            );
            const status = String(n.status || "active");
            const prompt = n.task || n.prompt;

            return (
              <div
                key={id || phoneNumber}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow group relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate font-mono">
                      {phoneNumber}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          status === "active"
                            ? "bg-green-400"
                            : "bg-yellow-400"
                        }`}
                      />
                      {status}
                      {n.voice ? ` \u00B7 ${String(n.voice)}` : ""}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {prompt ? String(prompt) : "No agent prompt configured"}
                </p>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-end">
                  <Link
                    href={`/dashboard/numbers/${id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
