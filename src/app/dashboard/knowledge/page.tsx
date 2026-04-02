import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, BookOpen, FileText, Ghost } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listKnowledgeBases } from "@/lib/bland";
import { DeleteKBButton } from "./delete-button";

export default async function KnowledgePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let knowledgeBases: Array<Record<string, unknown>> = [];
  let error: string | null = null;

  try {
    const result = await listKnowledgeBases();
    // Bland returns { knowledge_bases: [...] } or an array directly
    knowledgeBases = Array.isArray(result)
      ? result
      : result?.knowledge_bases ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load knowledge bases";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Bases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload documents, URLs, and text that AI agents can reference during
            calls.
          </p>
        </div>
        <Link
          href="/dashboard/knowledge/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
        >
          <Plus className="w-4 h-4" />
          New Knowledge Base
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400 mb-6">
          {error}
        </div>
      )}

      {!error && knowledgeBases.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center">
          <Ghost className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">
            No knowledge bases yet
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create your first knowledge base to give your AI agents access to
            documents, FAQs, and other reference material.
          </p>
          <Link
            href="/dashboard/knowledge/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Knowledge Base
          </Link>
        </div>
      )}

      {knowledgeBases.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {knowledgeBases.map((kb) => {
            const kbId = String(kb.id || kb.knowledge_base_id || "");
            const docCount =
              kb.document_count ?? (kb.documents as unknown[] | undefined)?.length ?? kb.num_documents;
            return (
              <div
                key={kbId}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow group relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/knowledge/${kbId}`}
                      className="font-semibold truncate block hover:underline"
                    >
                      {String(kb.name || "Unnamed")}
                    </Link>
                    {docCount != null && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        {Number(docCount)} document
                        {Number(docCount) !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {String(kb.description || "No description")}
                </p>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <Link
                    href={`/dashboard/knowledge/${kbId}`}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Manage
                  </Link>
                  <DeleteKBButton
                    id={kbId}
                    name={String(kb.name || "Unnamed")}
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
