"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitBranch, Pencil, Trash2, Loader2 } from "lucide-react";

interface Pathway {
  id: string;
  name: string;
  description?: string;
  nodes?: Record<string, unknown>[];
}

export function PathwaysList() {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPathways();
  }, []);

  async function fetchPathways() {
    try {
      const res = await fetch("/api/pathways");
      if (res.ok) {
        const data = await res.json();
        // Bland returns { pathways: [...] } or an array
        setPathways(Array.isArray(data) ? data : data.pathways || []);
      }
    } catch {
      // Silently fail — pathways section just stays empty
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this pathway? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/pathways/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPathways((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="font-semibold mb-4">Your Pathways</h2>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading pathways...
        </div>
      ) : pathways.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <GitBranch className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-3">
            No pathways yet. Create one to get started with the visual builder.
          </p>
          <Link
            href="/dashboard/pathways/new"
            className="text-sm text-primary font-medium hover:underline"
          >
            Create your first pathway
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pathways.map((p) => (
            <div
              key={p.id}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-sm truncate max-w-[160px]">
                    {p.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/dashboard/pathways/${p.id}`}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deleting === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {p.description || "No description"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {p.nodes ? `${Object.keys(p.nodes).length} nodes` : "0 nodes"}
                </span>
                <Link
                  href={`/dashboard/pathways/${p.id}`}
                  className="text-[10px] text-primary font-medium hover:underline"
                >
                  Open editor &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
