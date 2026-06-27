"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Job = {
  id: string;
  job_number: string;
  title: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  scheduled_date: string | null;
  total_cents: number | null;
  created_at: string;
};

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "booked", label: "Booked" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "invoiced", label: "Invoiced" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  booked: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-amber-500/10 text-amber-500",
  completed: "bg-success/10 text-success",
  invoiced: "bg-purple-500/10 text-purple-500",
  cancelled: "bg-destructive/10 text-destructive",
};

const STATUS_LABELS: Record<string, string> = {
  booked: "Booked",
  in_progress: "In Progress",
  completed: "Completed",
  invoiced: "Invoiced",
  cancelled: "Cancelled",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatCents(cents: number | null): string {
  if (cents === null || cents === undefined) return "--";
  return `$${(cents / 100).toFixed(2)}`;
}

function StatusDropdown({
  jobId,
  currentStatus,
  onStatusChange,
}: {
  jobId: string;
  currentStatus: string;
  onStatusChange: (jobId: string, newStatus: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[currentStatus] || "bg-muted text-muted-foreground"}`}
      >
        {STATUS_LABELS[currentStatus] || currentStatus}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[140px] py-1">
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(jobId, value);
                setOpen(false);
              }}
              className={`block w-full text-left text-sm px-3 py-1.5 hover:bg-muted transition-colors ${
                value === currentStatus
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function JobsList({ jobs: initialJobs }: { jobs: Job[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jobs, setJobs] = useState(initialJobs);

  const filtered = jobs.filter((job) => {
    const matchesSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.job_number.toLowerCase().includes(search.toLowerCase()) ||
      (job.customer_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = !statusFilter || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  async function handleStatusChange(jobId: string, newStatus: string) {
    const supabase = createClient();
    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === "in_progress") {
      updates.actual_start = new Date().toISOString();
    }
    if (newStatus === "completed") {
      updates.actual_end = new Date().toISOString();
    }

    const { error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", jobId);

    if (!error) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      router.refresh();
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="px-6 py-4 border-b border-border space-y-3">
        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === tab.value
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by job number, title, or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Job #</th>
              <th className="px-6 py-3 font-medium">Title</th>
              <th className="px-6 py-3 font-medium">Customer</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Scheduled</th>
              <th className="px-6 py-3 font-medium">Total</th>
              <th className="px-6 py-3 font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-muted-foreground text-sm"
                >
                  No jobs match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                >
                  <td className="px-6 py-3 font-medium font-mono text-xs">
                    {job.job_number}
                  </td>
                  <td className="px-6 py-3 font-medium">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {job.customer_name || "--"}
                  </td>
                  <td className="px-6 py-3">
                    <StatusDropdown
                      jobId={job.id}
                      currentStatus={job.status}
                      onStatusChange={handleStatusChange}
                    />
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {formatDate(job.scheduled_date)}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {formatCents(job.total_cents)}
                  </td>
                  <td className="px-6 py-3">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
