import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  CalendarCheck,
  Loader,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JobsList } from "./jobs-list";

export default async function JobsPage() {
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

  const orgId = membership.org_id;

  // Fetch jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(200);

  const allJobs = jobs ?? [];

  // Calculate stats
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const totalJobs = allJobs.length;
  const bookedToday = allJobs.filter(
    (j) => j.status === "booked" && j.scheduled_date === today
  ).length;
  const inProgress = allJobs.filter((j) => j.status === "in_progress").length;
  const completedThisWeek = allJobs.filter(
    (j) =>
      j.status === "completed" &&
      j.updated_at &&
      j.updated_at >= weekAgo
  ).length;

  const stats = [
    {
      label: "Total Jobs",
      value: totalJobs,
      icon: Briefcase,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Booked Today",
      value: bookedToday,
      icon: CalendarCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "In Progress",
      value: inProgress,
      icon: Loader,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Completed This Week",
      value: completedThisWeek,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Jobs Board</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage all your jobs in one place.
          </p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Job
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div
                className={`${stat.bg} w-8 h-8 rounded-lg flex items-center justify-center`}
              >
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Jobs List */}
      <div className="bg-card border border-border rounded-2xl">
        {allJobs.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Briefcase className="w-14 h-14 mx-auto mb-5 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
              Create your first job to start tracking work.
            </p>
            <Link
              href="/dashboard/jobs/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Job
            </Link>
          </div>
        ) : (
          <JobsList jobs={allJobs} />
        )}
      </div>
    </div>
  );
}
