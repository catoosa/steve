import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Brain, Plus } from "lucide-react";
import { listMemories } from "@/lib/bland";
import { ToggleMemoryButton } from "./toggle-button";
import { DeleteMemoryButton } from "./delete-button";

interface MemoryEntry {
  id?: string;
  memory_id?: string;
  enabled?: boolean;
  created_at?: string;
  label?: string;
  name?: string;
  [key: string]: unknown;
}

export default async function MemoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let memories: MemoryEntry[] = [];
  try {
    const data = await listMemories();
    // Bland API may return { memories: [...] } or a plain array
    memories = Array.isArray(data) ? data : (data as { memories?: MemoryEntry[] }).memories ?? [];
  } catch {
    // Show empty state on error
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Memory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-call context — agents remember previous conversations with each caller.
          </p>
        </div>
        <Link
          href="/dashboard/memory/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Memory
        </Link>
      </div>

      {memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Brain className="w-12 h-12 text-purple-500 mb-4 opacity-60" />
          <h2 className="text-lg font-semibold mb-2">No memory entries yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create a memory entry and attach it to a campaign so your agent remembers context
            across multiple calls with the same person.
          </p>
          <Link
            href="/dashboard/memory/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Memory
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map((entry) => {
            const id = (entry.id || entry.memory_id || "") as string;
            const enabled = entry.enabled !== false;
            const shortId = id.slice(0, 8);
            const label = (entry.label || entry.name || "") as string;
            const createdAt = entry.created_at
              ? new Date(entry.created_at as string).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <div key={id} className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Brain className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="text-sm font-mono font-medium truncate">
                      {label || shortId}
                    </span>
                  </div>
                  {enabled ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 inline-block" />
                      Disabled
                    </span>
                  )}
                </div>

                {label && (
                  <p className="text-xs text-muted-foreground font-mono mb-1">{shortId}</p>
                )}

                {createdAt && (
                  <p className="text-xs text-muted-foreground mb-4">Created {createdAt}</p>
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <ToggleMemoryButton memoryId={id} enabled={enabled} />
                  <DeleteMemoryButton id={id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
