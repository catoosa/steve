"use client";

import { use, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  X,
  Send,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PathwayNode {
  id: string;
  type: "start" | "say" | "listen" | "condition" | "transfer" | "end";
  content: string;
  x: number;
  y: number;
}

interface PathwayEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const NODE_TYPES: PathwayNode["type"][] = [
  "start",
  "say",
  "listen",
  "condition",
  "transfer",
  "end",
];

const NODE_COLORS: Record<PathwayNode["type"], string> = {
  start: "bg-green-500/10 border-green-500/30 text-green-700",
  say: "bg-blue-500/10 border-blue-500/30 text-blue-700",
  listen: "bg-purple-500/10 border-purple-500/30 text-purple-700",
  condition: "bg-orange-500/10 border-orange-500/30 text-orange-700",
  transfer: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700",
  end: "bg-red-500/10 border-red-500/30 text-red-700",
};

const NODE_HANDLE_COLORS: Record<PathwayNode["type"], string> = {
  start: "#22c55e",
  say: "#3b82f6",
  listen: "#a855f7",
  condition: "#f97316",
  transfer: "#eab308",
  end: "#ef4444",
};

const NODE_WIDTH = 250;
const HANDLE_RADIUS = 7;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PathwayEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [pathwayName, setPathwayName] = useState("Untitled Pathway");
  const [nodes, setNodes] = useState<PathwayNode[]>([]);
  const [edges, setEdges] = useState<PathwayEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "error">("");

  // Drag state
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connection drawing state
  const [connecting, setConnecting] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Chat panel
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Canvas ref for coordinate calculation
  const canvasRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------
  // Load pathway
  // ------------------------------------------
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/pathways/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPathwayName(data.name || "Untitled Pathway");

          // Parse Bland's node format into our flat structure
          if (data.nodes && typeof data.nodes === "object") {
            const blandNodes = data.nodes;
            const parsed: PathwayNode[] = [];
            const keys = Object.keys(blandNodes);
            keys.forEach((key, i) => {
              const node = blandNodes[key];
              parsed.push({
                id: key,
                type: guessNodeType(node),
                content: node.prompt || node.text || node.condition || "",
                x: node.x ?? 100 + (i % 4) * 300,
                y: node.y ?? 100 + Math.floor(i / 4) * 200,
              });
            });
            setNodes(parsed);

            // Parse edges from node connections
            const parsedEdges: PathwayEdge[] = [];
            keys.forEach((key) => {
              const node = blandNodes[key];
              if (node.edges) {
                node.edges.forEach(
                  (edge: { to?: string; label?: string }, ei: number) => {
                    if (edge.to) {
                      parsedEdges.push({
                        id: `${key}-${edge.to}-${ei}`,
                        from: key,
                        to: edge.to,
                        label: edge.label,
                      });
                    }
                  }
                );
              }
            });
            setEdges(parsedEdges);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function guessNodeType(
    node: Record<string, unknown>
  ): PathwayNode["type"] {
    if (node.type) {
      const t = String(node.type).toLowerCase();
      if (NODE_TYPES.includes(t as PathwayNode["type"]))
        return t as PathwayNode["type"];
    }
    if (node.isStart || node.is_start) return "start";
    if (node.transfer_number || node.transfer_phone_number) return "transfer";
    if (node.condition) return "condition";
    if (node.listen || node.extract_info) return "listen";
    if (node.isEnd || node.is_end) return "end";
    return "say";
  }

  // ------------------------------------------
  // Save pathway
  // ------------------------------------------
  async function handleSave() {
    setSaving(true);
    setSaveStatus("");
    try {
      // Convert our flat nodes + edges back to Bland's format
      const blandNodes: Record<string, unknown> = {};
      nodes.forEach((n) => {
        const nodeEdges = edges
          .filter((e) => e.from === n.id)
          .map((e) => ({ to: e.to, label: e.label }));
        blandNodes[n.id] = {
          type: n.type,
          prompt: n.content,
          x: n.x,
          y: n.y,
          ...(n.type === "start" ? { isStart: true } : {}),
          ...(n.type === "end" ? { isEnd: true } : {}),
          ...(nodeEdges.length > 0 ? { edges: nodeEdges } : {}),
        };
      });

      const res = await fetch(`/api/pathways/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: pathwayName, nodes: blandNodes }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(""), 3000);
    }
  }

  // ------------------------------------------
  // Node CRUD
  // ------------------------------------------
  function addNode() {
    const newId = `node_${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        id: newId,
        type: "say",
        content: "",
        x: 200 + Math.random() * 200,
        y: 200 + Math.random() * 200,
      },
    ]);
  }

  function deleteNode(nodeId: string) {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) =>
      prev.filter((e) => e.from !== nodeId && e.to !== nodeId)
    );
  }

  function updateNode(nodeId: string, updates: Partial<PathwayNode>) {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, ...updates } : n))
    );
  }

  // ------------------------------------------
  // Drag handling
  // ------------------------------------------
  const handleMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("[data-handle]")) return;
      if ((e.target as HTMLElement).closest("textarea")) return;
      if ((e.target as HTMLElement).closest("select")) return;
      if ((e.target as HTMLElement).closest("button")) return;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setDragging(nodeId);
      setDragOffset({
        x: e.clientX - node.x,
        y: e.clientY - node.y,
      });
      e.preventDefault();
    },
    [nodes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, e.clientX - dragOffset.x);
        const y = Math.max(0, e.clientY - dragOffset.y);
        updateNode(dragging, { x, y });
      }
      if (connecting) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          setMousePos({
            x: e.clientX - rect.left + canvas.scrollLeft,
            y: e.clientY - rect.top + canvas.scrollTop,
          });
        }
      }
    },
    [dragging, connecting, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    if (connecting) {
      setConnecting(null);
    }
  }, [connecting]);

  // ------------------------------------------
  // Connection handling
  // ------------------------------------------
  function handleOutputClick(nodeId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (connecting) {
      // Finish connection — connecting is "from", nodeId would be input
      // But we started from output, this is another output — ignore
      setConnecting(null);
    } else {
      setConnecting(nodeId);
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left + canvas.scrollLeft,
          y: e.clientY - rect.top + canvas.scrollTop,
        });
      }
    }
  }

  function handleInputClick(nodeId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (connecting && connecting !== nodeId) {
      // Check if edge already exists
      const exists = edges.some(
        (edge) => edge.from === connecting && edge.to === nodeId
      );
      if (!exists) {
        setEdges((prev) => [
          ...prev,
          {
            id: `${connecting}-${nodeId}-${Date.now()}`,
            from: connecting,
            to: nodeId,
          },
        ]);
      }
      setConnecting(null);
    }
  }

  function deleteEdge(edgeId: string) {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  }

  // ------------------------------------------
  // SVG path helpers
  // ------------------------------------------
  function getNodeCenter(nodeId: string): { x: number; y: number } | null {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return { x: node.x + NODE_WIDTH / 2, y: node.y };
  }

  function getOutputPos(nodeId: string): { x: number; y: number } | null {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    // Bottom center of node — estimate height ~160px
    return { x: node.x + NODE_WIDTH / 2, y: node.y + 160 };
  }

  function getInputPos(nodeId: string): { x: number; y: number } | null {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    return { x: node.x + NODE_WIDTH / 2, y: node.y };
  }

  function buildCurvePath(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): string {
    const dy = to.y - from.y;
    const controlOffset = Math.max(50, Math.abs(dy) * 0.5);
    return `M ${from.x} ${from.y} Q ${from.x} ${from.y + controlOffset}, ${
      (from.x + to.x) / 2
    } ${(from.y + to.y) / 2} T ${to.x} ${to.y}`;
  }

  // ------------------------------------------
  // Chat
  // ------------------------------------------
  async function handleSendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const message = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: message }]);
    setChatLoading(true);

    try {
      const res = await fetch(`/api/pathways/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, chatId }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatId(data.chat_id || chatId);
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: data.response || data.message || "..." },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: "Error: could not get response" },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Error: network failure" },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ------------------------------------------
  // Render
  // ------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading pathway...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pathways"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <input
            type="text"
            value={pathwayName}
            onChange={(e) => setPathwayName(e.target.value)}
            className="text-lg font-bold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 py-0.5 transition-colors"
          />
          {saveStatus === "saved" && (
            <span className="text-xs text-green-600 font-medium">Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs text-destructive font-medium">
              Save failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addNode}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Node
          </button>
          <button
            onClick={() => {
              setChatOpen(!chatOpen);
              if (!chatOpen) {
                setChatMessages([]);
                setChatId(undefined);
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              chatOpen
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Test
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 bg-muted/30 border border-dashed border-border rounded-xl min-h-[600px] relative overflow-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* SVG layer for connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0"
            style={{ minWidth: 2000, minHeight: 1200 }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  className="fill-primary/60"
                />
              </marker>
            </defs>

            {/* Existing edges */}
            {edges.map((edge) => {
              const from = getOutputPos(edge.from);
              const to = getInputPos(edge.to);
              if (!from || !to) return null;
              return (
                <g key={edge.id} className="pointer-events-auto cursor-pointer"
                  onClick={() => deleteEdge(edge.id)}>
                  {/* Invisible wider hitbox */}
                  <path
                    d={buildCurvePath(from, to)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={16}
                  />
                  <path
                    d={buildCurvePath(from, to)}
                    fill="none"
                    className="stroke-primary/40"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead)"
                  />
                  {edge.label && (
                    <text
                      x={(from.x + to.x) / 2}
                      y={(from.y + to.y) / 2 - 8}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Active connection being drawn */}
            {connecting && (() => {
              const from = getOutputPos(connecting);
              if (!from) return null;
              return (
                <path
                  d={buildCurvePath(from, mousePos)}
                  fill="none"
                  className="stroke-primary/60"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                />
              );
            })()}
          </svg>

          {/* Nodes */}
          <div style={{ minWidth: 2000, minHeight: 1200, position: "relative" }}>
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Click "Add Node" to start building your pathway
              </div>
            )}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`bg-card border border-border rounded-xl shadow-sm absolute cursor-move select-none z-10 ${
                  dragging === node.id ? "ring-2 ring-primary shadow-lg" : ""
                }`}
                style={{
                  left: node.x,
                  top: node.y,
                  width: NODE_WIDTH,
                }}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
              >
                {/* Input handle (top) */}
                <div
                  data-handle="input"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-border bg-card hover:border-primary hover:scale-125 transition-all cursor-crosshair z-20"
                  style={{
                    borderColor: connecting
                      ? NODE_HANDLE_COLORS[node.type]
                      : undefined,
                  }}
                  onClick={(e) => handleInputClick(node.id, e)}
                />

                {/* Node header */}
                <div
                  className={`px-3 py-2 rounded-t-xl border-b text-[11px] font-bold uppercase tracking-wider ${NODE_COLORS[node.type]}`}
                >
                  <div className="flex items-center justify-between">
                    <select
                      value={node.type}
                      onChange={(e) =>
                        updateNode(node.id, {
                          type: e.target.value as PathwayNode["type"],
                        })
                      }
                      className="bg-transparent text-[11px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer"
                    >
                      {NODE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteNode(node.id)}
                      className="p-0.5 rounded hover:bg-black/10 transition-colors"
                      title="Delete node"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Node body */}
                <div className="p-3">
                  <textarea
                    value={node.content}
                    onChange={(e) =>
                      updateNode(node.id, { content: e.target.value })
                    }
                    placeholder={getPlaceholder(node.type)}
                    className="w-full bg-muted/30 border border-border rounded-lg p-2 text-xs resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>

                {/* Output handle (bottom) */}
                {node.type !== "end" && (
                  <div
                    data-handle="output"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-border bg-card hover:border-primary hover:scale-125 transition-all cursor-crosshair z-20"
                    style={{
                      backgroundColor: connecting === node.id
                        ? NODE_HANDLE_COLORS[node.type]
                        : undefined,
                    }}
                    onClick={(e) => handleOutputClick(node.id, e)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 bg-card border border-border rounded-xl flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Test Chat</h3>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center mt-8">
                  Send a message to test this pathway
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs p-2.5 rounded-xl max-w-[90%] ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChat();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  onClick={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getPlaceholder(type: PathwayNode["type"]): string {
  switch (type) {
    case "start":
      return "Opening message...";
    case "say":
      return "What the AI should say...";
    case "listen":
      return "What to listen for...";
    case "condition":
      return "Condition logic (e.g. if caller says yes)...";
    case "transfer":
      return "Transfer number or department...";
    case "end":
      return "Closing message...";
  }
}
