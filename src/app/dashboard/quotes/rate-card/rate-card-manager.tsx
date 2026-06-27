"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Package,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RateCardItem = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  unit: string;
  price_min_cents: number;
  price_max_cents: number;
  category: string | null;
  is_active: boolean;
  sort_order: number;
};

type NewItem = {
  name: string;
  description: string;
  unit: string;
  price_min: string;
  price_max: string;
  category: string;
};

const EMPTY_ITEM: NewItem = {
  name: "",
  description: "",
  unit: "each",
  price_min: "",
  price_max: "",
  category: "",
};

function formatDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function dollarsToCents(dollars: string): number {
  const num = parseFloat(dollars);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

export function RateCardManager({
  items,
  orgId,
}: {
  items: RateCardItem[];
  orgId: string;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState<NewItem>(EMPTY_ITEM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<NewItem>(EMPTY_ITEM);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(
    new Set(items.map((i) => i.category || "Uncategorised"))
  ).sort();

  const filtered = activeCategory
    ? items.filter(
        (i) => (i.category || "Uncategorised") === activeCategory
      )
    : items;

  async function handleAdd() {
    if (!newItem.name || !newItem.price_min) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("rate_card_items").insert({
        org_id: orgId,
        name: newItem.name,
        description: newItem.description || null,
        unit: newItem.unit || "each",
        price_min_cents: dollarsToCents(newItem.price_min),
        price_max_cents: dollarsToCents(newItem.price_max || newItem.price_min),
        category: newItem.category || null,
        is_active: true,
        sort_order: items.length,
      });
      setNewItem(EMPTY_ITEM);
      setShowAdd(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editItem.name || !editItem.price_min) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase
        .from("rate_card_items")
        .update({
          name: editItem.name,
          description: editItem.description || null,
          unit: editItem.unit || "each",
          price_min_cents: dollarsToCents(editItem.price_min),
          price_max_cents: dollarsToCents(
            editItem.price_max || editItem.price_min
          ),
          category: editItem.category || null,
        })
        .eq("id", id);
      setEditingId(null);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this rate card item?")) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("rate_card_items").delete().eq("id", id);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    const supabase = createClient();
    await supabase
      .from("rate_card_items")
      .update({ is_active: !currentActive })
      .eq("id", id);
    router.refresh();
  }

  function startEdit(item: RateCardItem) {
    setEditingId(item.id);
    setEditItem({
      name: item.name,
      description: item.description || "",
      unit: item.unit,
      price_min: (item.price_min_cents / 100).toFixed(2),
      price_max: (item.price_max_cents / 100).toFixed(2),
      category: item.category || "",
    });
  }

  return (
    <div>
      {/* Category filter tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Items table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Price Range</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Active</th>
              <th className="px-4 py-3 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) =>
              editingId === item.id ? (
                <tr key={item.id} className="border-b border-border bg-muted/50">
                  <td className="px-4 py-2">
                    <input
                      value={editItem.name}
                      onChange={(e) =>
                        setEditItem({ ...editItem, name: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={editItem.description}
                      onChange={(e) =>
                        setEditItem({
                          ...editItem,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={editItem.unit}
                      onChange={(e) =>
                        setEditItem({ ...editItem, unit: e.target.value })
                      }
                      className="w-24 bg-background border border-border rounded-lg px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">$</span>
                      <input
                        value={editItem.price_min}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            price_min: e.target.value,
                          })
                        }
                        className="w-20 bg-background border border-border rounded-lg px-2 py-1 text-sm"
                        placeholder="Min"
                      />
                      <span className="text-muted-foreground">-</span>
                      <span className="text-muted-foreground">$</span>
                      <input
                        value={editItem.price_max}
                        onChange={(e) =>
                          setEditItem({
                            ...editItem,
                            price_max: e.target.value,
                          })
                        }
                        className="w-20 bg-background border border-border rounded-lg px-2 py-1 text-sm"
                        placeholder="Max"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      value={editItem.category}
                      onChange={(e) =>
                        setEditItem({ ...editItem, category: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2" />
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdate(item.id)}
                        disabled={loading}
                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr
                  key={item.id}
                  className={`border-b border-border hover:bg-muted/30 transition-colors ${
                    !item.is_active ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.description || "-"}
                  </td>
                  <td className="px-4 py-3">{item.unit}</td>
                  <td className="px-4 py-3">
                    {item.price_min_cents === item.price_max_cents
                      ? formatDollars(item.price_min_cents)
                      : `${formatDollars(item.price_min_cents)} - ${formatDollars(item.price_max_cents)}`}
                  </td>
                  <td className="px-4 py-3">
                    {item.category ? (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                        {item.category}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        handleToggleActive(item.id, item.is_active)
                      }
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        item.is_active ? "bg-green-500" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          item.is_active ? "left-4" : "left-0.5"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            )}

            {filtered.length === 0 && !showAdd && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground">
                    No rate card items yet. Add your first item to start
                    quoting.
                  </p>
                </td>
              </tr>
            )}

            {/* Add new item inline form */}
            {showAdd && (
              <tr className="border-b border-border bg-muted/50">
                <td className="px-4 py-2">
                  <input
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    placeholder="Item name"
                    className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                    placeholder="Description"
                    className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    placeholder="each"
                    className="w-24 bg-background border border-border rounded-lg px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">$</span>
                    <input
                      value={newItem.price_min}
                      onChange={(e) =>
                        setNewItem({ ...newItem, price_min: e.target.value })
                      }
                      placeholder="Min"
                      className="w-20 bg-background border border-border rounded-lg px-2 py-1 text-sm"
                    />
                    <span className="text-muted-foreground">-</span>
                    <span className="text-muted-foreground">$</span>
                    <input
                      value={newItem.price_max}
                      onChange={(e) =>
                        setNewItem({ ...newItem, price_max: e.target.value })
                      }
                      placeholder="Max"
                      className="w-20 bg-background border border-border rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <input
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem({ ...newItem, category: e.target.value })
                    }
                    placeholder="Category"
                    className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-2" />
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleAdd}
                      disabled={loading || !newItem.name || !newItem.price_min}
                      className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500 transition-colors disabled:opacity-30"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowAdd(false);
                        setNewItem(EMPTY_ITEM);
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add button */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      )}
    </div>
  );
}
