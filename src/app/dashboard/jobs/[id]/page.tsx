import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobDetailClient } from "./job-detail-client";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("org_id", membership.org_id)
    .single();

  if (!job) redirect("/dashboard/jobs");

  // Fetch linked quote and deal if present
  let linkedQuote = null;
  let linkedDeal = null;

  if (job.quote_id) {
    const { data } = await supabase
      .from("quotes")
      .select("id, quote_number, customer_name, total_cents")
      .eq("id", job.quote_id)
      .single();
    linkedQuote = data;
  }

  if (job.deal_id) {
    const { data } = await supabase
      .from("deals")
      .select("id, title, contact_name")
      .eq("id", job.deal_id)
      .single();
    linkedDeal = data;
  }

  function formatTime12(time24: string | null): string {
    if (!time24) return "--";
    const [h, m] = time24.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "--";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatCents(cents: number | null): string {
    if (cents === null || cents === undefined) return "--";
    return `$${(cents / 100).toFixed(2)}`;
  }

  const STATUS_COLORS: Record<string, string> = {
    booked: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    completed: "bg-success/10 text-success border-success/20",
    invoiced: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  const STATUS_LABELS: Record<string, string> = {
    booked: "Booked",
    in_progress: "In Progress",
    completed: "Completed",
    invoiced: "Invoiced",
    cancelled: "Cancelled",
  };

  // Progress steps
  const STEPS = ["booked", "in_progress", "completed", "invoiced"];
  const currentStepIndex = STEPS.indexOf(job.status);
  const isCancelled = job.status === "cancelled";

  return (
    <div>
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {job.job_number}
            </span>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                STATUS_COLORS[job.status] || "bg-muted text-muted-foreground"
              }`}
            >
              {STATUS_LABELS[job.status] || job.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold mt-2">{job.title}</h1>
        </div>
      </div>

      {/* Progress Indicator */}
      {!isCancelled && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <p className="text-sm font-medium mb-4 text-muted-foreground">
            Progress
          </p>
          <div className="flex items-center gap-2">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-full h-2 rounded-full ${
                    i <= currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <span
                key={step}
                className="text-xs text-muted-foreground capitalize"
              >
                {STATUS_LABELS[step]}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Customer</h2>
            <div className="space-y-3">
              {job.customer_name && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{job.customer_name}</span>
                </div>
              )}
              {job.customer_phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a
                    href={`tel:${job.customer_phone}`}
                    className="text-primary hover:underline"
                  >
                    {job.customer_phone}
                  </a>
                </div>
              )}
              {job.customer_address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{job.customer_address}</span>
                </div>
              )}
              {!job.customer_name &&
                !job.customer_phone &&
                !job.customer_address && (
                  <p className="text-sm text-muted-foreground">
                    No customer details added.
                  </p>
                )}
            </div>
          </div>

          {/* Schedule Info */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Schedule</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{formatDate(job.scheduled_date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>
                  {formatTime12(job.scheduled_time_start)} -{" "}
                  {formatTime12(job.scheduled_time_end)}
                </span>
              </div>
              {(job.actual_start || job.actual_end) && (
                <div className="pt-2 border-t border-border mt-2">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Actual Times
                  </p>
                  {job.actual_start && (
                    <p className="text-sm">
                      Started:{" "}
                      {new Date(job.actual_start).toLocaleString("en-AU")}
                    </p>
                  )}
                  {job.actual_end && (
                    <p className="text-sm">
                      Ended:{" "}
                      {new Date(job.actual_end).toLocaleString("en-AU")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Notes</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {job.notes}
              </p>
            </div>
          )}

          {/* Linked Records */}
          {(linkedQuote || linkedDeal) && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Linked Records</h2>
              <div className="space-y-3">
                {linkedQuote && (
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>
                      Quote {linkedQuote.quote_number} -{" "}
                      {linkedQuote.customer_name || "Unknown"} (
                      {formatCents(linkedQuote.total_cents)})
                    </span>
                  </div>
                )}
                {linkedDeal && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span>
                      Deal: {linkedDeal.title}{" "}
                      {linkedDeal.contact_name
                        ? `(${linkedDeal.contact_name})`
                        : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Actions + Total */}
        <div className="space-y-6">
          {/* Total */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                Total
              </span>
            </div>
            <p className="text-3xl font-bold">{formatCents(job.total_cents)}</p>
          </div>

          {/* Actions */}
          <JobDetailClient job={job} />
        </div>
      </div>
    </div>
  );
}
