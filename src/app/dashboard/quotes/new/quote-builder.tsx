"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  Send,
  Save,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type RateCardItem = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  price_min_cents: number;
  price_max_cents: number;
  category: string | null;
};

type LineItem = {
  key: string;
  rate_card_item_id: string | null;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
};

function formatDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parseDollars(val: string): number {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

let keyCounter = 0;
function nextKey() {
  return `li-${++keyCounter}`;
}

export function QuoteBuilder({
  rateCardItems,
  orgId,
}: {
  rateCardItems: RateCardItem[];
  orgId: string;
}) {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showRateCardPicker, setShowRateCardPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  const subtotalCents = lineItems.reduce(
    (sum, li) => sum + li.quantity * li.unit_price_cents,
    0
  );
  const taxCents = Math.round(subtotalCents * 0.1);
  const totalCents = subtotalCents + taxCents;

  function addFromRateCard(item: RateCardItem) {
    setLineItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        rate_card_item_id: item.id,
        name: item.name,
        description: item.description || "",
        quantity: 1,
        unit: item.unit,
        unit_price_cents: item.price_min_cents,
      },
    ]);
    setShowRateCardPicker(false);
  }

  function addCustomItem() {
    setLineItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        rate_card_item_id: null,
        name: "",
        description: "",
        quantity: 1,
        unit: "each",
        unit_price_cents: 0,
      },
    ]);
  }

  function updateLineItem(key: string, updates: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((li) => (li.key === key ? { ...li, ...updates } : li))
    );
  }

  function removeLineItem(key: string) {
    setLineItems((prev) => prev.filter((li) => li.key !== key));
  }

  async function saveQuote(send: boolean) {
    if (!customerName.trim()) {
      alert("Please enter a customer name.");
      return;
    }
    if (lineItems.length === 0) {
      alert("Please add at least one line item.");
      return;
    }
    if (send && !customerPhone.trim()) {
      alert("Please enter a phone number to send the quote.");
      return;
    }

    send ? setSending(true) : setSaving(true);

    try {
      const supabase = createClient();

      // Get next quote number
      const { data: qnData } = await supabase.rpc("next_quote_number", {
        p_org_id: orgId,
      });
      const quoteNumber = qnData || "QTE-0001";

      // Insert quote
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .insert({
          org_id: orgId,
          quote_number: quoteNumber,
          status: send ? "sent" : "draft",
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          customer_email: customerEmail.trim() || null,
          description: description.trim() || null,
          subtotal_cents: subtotalCents,
          tax_cents: taxCents,
          total_cents: totalCents,
          valid_until: validUntil || null,
          notes: notes.trim() || null,
          sent_at: send ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (quoteError || !quote) {
        alert("Failed to create quote: " + (quoteError?.message || "Unknown error"));
        return;
      }

      // Insert line items
      const lineItemRows = lineItems.map((li, idx) => ({
        quote_id: quote.id,
        rate_card_item_id: li.rate_card_item_id,
        name: li.name,
        description: li.description || null,
        quantity: li.quantity,
        unit: li.unit,
        unit_price_cents: li.unit_price_cents,
        total_cents: li.quantity * li.unit_price_cents,
        sort_order: idx,
      }));

      await supabase.from("quote_line_items").insert(lineItemRows);

      // Send SMS if sending
      if (send && customerPhone.trim()) {
        try {
          await fetch("/api/v1/quotes/" + quote.id + "/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: customerPhone.trim() }),
          });
        } catch {
          // SMS may fail but quote is saved
        }
      }

      router.push(`/dashboard/quotes/${quote.id}`);
      router.refresh();
    } finally {
      setSaving(false);
      setSending(false);
    }
  }

  // Group rate card items by category for the picker
  const groupedItems: Record<string, RateCardItem[]> = {};
  rateCardItems.forEach((item) => {
    const cat = item.category || "Uncategorised";
    if (!groupedItems[cat]) groupedItems[cat] = [];
    groupedItems[cat].push(item);
  });

  return (
    <div className="max-w-4xl space-y-6">
      {/* Customer info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Customer Details
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name *</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Smith"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Phone</label>
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+61 400 000 000"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Job description */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Job Description
        </h2>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the work to be done..."
          rows={3}
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none"
        />
      </div>

      {/* Line items */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Line Items
        </h2>

        {lineItems.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-[1fr_80px_80px_120px_100px_40px] gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
              <span>Item</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Unit Price</span>
              <span className="text-right">Total</span>
              <span />
            </div>
            {lineItems.map((li) => (
              <div
                key={li.key}
                className="grid grid-cols-[1fr_80px_80px_120px_100px_40px] gap-2 mb-2 items-center"
              >
                <input
                  value={li.name}
                  onChange={(e) =>
                    updateLineItem(li.key, { name: e.target.value })
                  }
                  placeholder="Item name"
                  className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  value={li.quantity}
                  onChange={(e) =>
                    updateLineItem(li.key, {
                      quantity: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm"
                />
                <input
                  value={li.unit}
                  onChange={(e) =>
                    updateLineItem(li.key, { unit: e.target.value })
                  }
                  className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm"
                />
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    value={formatDollars(li.unit_price_cents)}
                    onChange={(e) =>
                      updateLineItem(li.key, {
                        unit_price_cents: parseDollars(e.target.value),
                      })
                    }
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-sm"
                  />
                </div>
                <p className="text-sm text-right font-medium">
                  ${formatDollars(li.quantity * li.unit_price_cents)}
                </p>
                <button
                  onClick={() => removeLineItem(li.key)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add buttons */}
        <div className="flex items-center gap-2 relative">
          {rateCardItems.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowRateCardPicker(!showRateCardPicker)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add from Rate Card
                <ChevronDown className="w-3 h-3" />
              </button>
              {showRateCardPicker && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-card border border-border rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                  {Object.entries(groupedItems).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                        {cat}
                      </div>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => addFromRateCard(item)}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors text-sm flex items-center justify-between"
                        >
                          <span>{item.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ${formatDollars(item.price_min_cents)}/{item.unit}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={addCustomItem}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Custom Item
          </button>
        </div>

        {/* Totals */}
        {lineItems.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium w-24 text-right">
                  ${formatDollars(subtotalCents)}
                </span>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">GST (10%)</span>
                <span className="font-medium w-24 text-right">
                  ${formatDollars(taxCents)}
                </span>
              </div>
              <div className="flex items-center gap-8 text-base font-bold mt-1">
                <span>Total</span>
                <span className="w-24 text-right">
                  ${formatDollars(totalCents)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes & valid until */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, warranty info, etc."
              rows={3}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Valid Until
            </label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          onClick={() => saveQuote(false)}
          disabled={saving || sending}
          className="flex items-center gap-2 px-5 py-2.5 text-sm border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save as Draft
        </button>
        <button
          onClick={() => saveQuote(true)}
          disabled={saving || sending}
          className="flex items-center gap-2 px-5 py-2.5 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send Quote
        </button>
      </div>
    </div>
  );
}
