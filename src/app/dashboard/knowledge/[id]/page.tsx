"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Globe,
  Link2,
  Send,
  Upload,
  MessageSquare,
  BookOpen,
} from "lucide-react";

type Tab = "text" | "url" | "file";

export default function KnowledgeBaseDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [kb, setKb] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [textContent, setTextContent] = useState("");
  const [textName, setTextName] = useState("");
  const [urls, setUrls] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatting, setChatting] = useState(false);

  const fetchKB = useCallback(async () => {
    try {
      const res = await fetch(`/api/knowledge/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load knowledge base");
      }
      const data = await res.json();
      setKb(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchKB();
  }, [fetchKB]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setUploadMessage(null);

    try {
      let body: Record<string, unknown>;

      if (activeTab === "text") {
        if (!textContent.trim()) {
          setUploadMessage("Text content is required.");
          setUploading(false);
          return;
        }
        body = {
          type: "text",
          text: textContent.trim(),
          name: textName.trim() || undefined,
        };
      } else if (activeTab === "url") {
        const urlList = urls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean);
        if (urlList.length === 0) {
          setUploadMessage("At least one URL is required.");
          setUploading(false);
          return;
        }
        body = { type: "web", urls: urlList };
      } else {
        if (!fileUrl.trim()) {
          setUploadMessage("File URL is required.");
          setUploading(false);
          return;
        }
        body = { type: "file", fileUrl: fileUrl.trim() };
      }

      const res = await fetch(`/api/knowledge/${id}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setUploadMessage("Content uploaded successfully.");
      // Clear inputs
      if (activeTab === "text") {
        setTextContent("");
        setTextName("");
      } else if (activeTab === "url") {
        setUrls("");
      } else {
        setFileUrl("");
      }
      // Refresh KB details
      fetchKB();
    } catch (e) {
      setUploadMessage(
        e instanceof Error ? e.message : "Something went wrong"
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setChatting(true);
    setChatResponse(null);

    try {
      const res = await fetch(`/api/knowledge/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Chat failed");
      }

      const data = await res.json();
      setChatResponse(
        typeof data === "string"
          ? data
          : data.response || data.message || data.answer || JSON.stringify(data)
      );
    } catch (e) {
      setChatResponse(
        e instanceof Error ? e.message : "Something went wrong"
      );
    } finally {
      setChatting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/knowledge"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-card transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
        </div>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  const kbName = String(kb?.name || "Unnamed");
  const kbDescription = String(kb?.description || "");
  const docCount =
    kb?.document_count ?? kb?.num_documents ?? (kb?.documents as unknown[])?.length;

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "text", label: "Text", icon: FileText },
    { key: "url", label: "URL", icon: Globe },
    { key: "file", label: "File URL", icon: Link2 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard/knowledge"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-card transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">{kbName}</h1>
          </div>
          {kbDescription && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {kbDescription}
            </p>
          )}
          {docCount != null && (
            <p className="text-xs text-muted-foreground mt-1">
              {Number(docCount)} document{Number(docCount) !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Upload Content</h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setUploadMessage(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            {activeTab === "text" && (
              <>
                <div>
                  <label
                    htmlFor="text-name"
                    className="block text-sm font-medium mb-1.5"
                  >
                    Document Name
                  </label>
                  <input
                    id="text-name"
                    type="text"
                    value={textName}
                    onChange={(e) => setTextName(e.target.value)}
                    placeholder="e.g. FAQ, Product Guide"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="text-content"
                    className="block text-sm font-medium mb-1.5"
                  >
                    Text Content
                  </label>
                  <textarea
                    id="text-content"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    rows={8}
                    placeholder="Paste or type your text content here..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                    required
                  />
                </div>
              </>
            )}

            {activeTab === "url" && (
              <div>
                <label
                  htmlFor="urls"
                  className="block text-sm font-medium mb-1.5"
                >
                  URLs (one per line)
                </label>
                <textarea
                  id="urls"
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  rows={6}
                  placeholder={"https://example.com/page1\nhttps://example.com/page2"}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pages will be scraped and their content added to the knowledge
                  base.
                </p>
              </div>
            )}

            {activeTab === "file" && (
              <div>
                <label
                  htmlFor="file-url"
                  className="block text-sm font-medium mb-1.5"
                >
                  File URL
                </label>
                <input
                  id="file-url"
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Provide a publicly accessible URL to a PDF, DOCX, or TXT
                  file.
                </p>
              </div>
            )}

            {uploadMessage && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  uploadMessage.includes("success")
                    ? "border border-green-500/30 bg-green-500/10 text-green-400"
                    : "border border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                {uploadMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>
        </div>

        {/* Chat / Test section */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Test Knowledge Base</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Ask a question to test what the knowledge base returns.
          </p>

          <form onSubmit={handleChat} className="space-y-4">
            <div>
              <label
                htmlFor="chat-message"
                className="block text-sm font-medium mb-1.5"
              >
                Question
              </label>
              <input
                id="chat-message"
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="e.g. What is your return policy?"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={chatting || !chatMessage.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chatting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {chatting ? "Querying..." : "Ask"}
            </button>
          </form>

          {chatResponse && (
            <div className="mt-4 rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Response
              </p>
              <p className="text-sm whitespace-pre-wrap">{chatResponse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
