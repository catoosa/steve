import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
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

  // Fetch bookings for the next 14 days (gives buffer for the weekly view)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0, 0, 0, 0);

  const endRange = new Date(startOfWeek);
  endRange.setDate(endRange.getDate() + 13); // Two weeks out
  endRange.setHours(23, 59, 59, 999);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("org_id", orgId)
    .gte("scheduled_start", startOfWeek.toISOString())
    .lte("scheduled_start", endRange.toISOString())
    .order("scheduled_start", { ascending: true });

  // Also fetch jobs for the same period to show on calendar
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_number, title, customer_name, scheduled_date, scheduled_time_start, scheduled_time_end, status")
    .eq("org_id", orgId)
    .gte("scheduled_date", startOfWeek.toISOString().split("T")[0])
    .lte("scheduled_date", endRange.toISOString().split("T")[0])
    .order("scheduled_date", { ascending: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your bookings and scheduled jobs.
        </p>
      </div>

      <CalendarView
        orgId={orgId}
        bookings={bookings ?? []}
        jobs={jobs ?? []}
      />
    </div>
  );
}
