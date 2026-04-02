import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Wrench, Ghost, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listTools } from "@/lib/bland";
import { DeleteToolButton } from "./delete-button";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-400",
  POST: "bg-blue-500/15 text-blue-400",
  PUT: "bg-amber-500/15 text-amber-400",
  DELETE: "bg-red-500/15 text-red-400",
};

export default async function ToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let tools: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  try {
    const result = await listTools();
    tools = Array.isArray(result) ? result : result?.tools ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load tools";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Custom Tools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            HTTP API integrations your AI agents can call mid-conversation.
          </p>
        </div>
        <Link
          href="/dashboard/tools/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          New Tool
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {!error && tools.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
          <Ghost className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No tools yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create your first custom tool to let AI agents call external APIs
            during conversations — check inventory, book appointments, look up
            CRM data, and more.
          </p>
          <Link
            href="/dashboard/tools/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Tool
          </Link>
        </div>
      )}

      {tools.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const toolId = String(tool.tool_id || tool.id || "");
            const method = String(
              tool.method || tool.http_method || "GET"
            ).toUpperCase();
            const url = String(tool.url || "");
            const methodColor =
              METHOD_COLORS[method] || "bg-muted text-muted-foreground";

            return (
              <div
                key={toolId}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow group relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">
                      {String(tool.name || "Unnamed")}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${methodColor}`}
                      >
                        {method}
                      </span>
                      {url && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          {url}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {String(tool.description || "No description")}
                </p>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-end">
                  <DeleteToolButton
                    id={toolId}
                    name={String(tool.name || "Unnamed")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
