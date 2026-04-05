import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Clock, TrendingUp, Zap } from "lucide-react";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am - 6pm
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function SchedulingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();
  if (!membership) redirect("/login");

  // Fetch completed calls with timing data
  const { data: calls } = await supabase
    .from("calls")
    .select("answered_by, completed_at, created_at, duration_seconds")
    .eq("org_id", membership.org_id)
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .limit(5000);

  // Build heatmap data: answer rate by day-of-week × hour-of-day
  const grid: Record<string, { total: number; answered: number }> = {};
  for (const day of DAYS) {
    for (const hour of HOURS) {
      grid[`${day}-${hour}`] = { total: 0, answered: 0 };
    }
  }

  let bestSlot = { day: "Tue", hour: 10, rate: 0 };
  let totalCalls = 0;
  let totalAnswered = 0;

  for (const call of calls || []) {
    const date = new Date(call.completed_at || call.created_at);
    const dayIndex = date.getDay(); // 0=Sun
    const day = DAYS[dayIndex === 0 ? 6 : dayIndex - 1]; // Mon=0 .. Sun=6
    const hour = date.getHours();

    if (hour < 7 || hour > 18) continue;
    const key = `${day}-${hour}`;
    if (!grid[key]) continue;

    grid[key].total++;
    totalCalls++;
    if (call.answered_by === "human") {
      grid[key].answered++;
      totalAnswered++;
    }
  }

  // Find best slot
  for (const [key, val] of Object.entries(grid)) {
    if (val.total < 3) continue;
    const rate = val.answered / val.total;
    if (rate > bestSlot.rate) {
      const [day, hourStr] = key.split("-");
      bestSlot = { day, hour: Number(hourStr), rate };
    }
  }

  const overallRate = totalCalls > 0 ? Math.round((totalAnswered / totalCalls) * 100) : 0;

  function getColor(total: number, answered: number): string {
    if (total < 2) return "bg-muted/30";
    const rate = answered / total;
    if (rate >= 0.6) return "bg-green-500";
    if (rate >= 0.4) return "bg-green-500/60";
    if (rate >= 0.25) return "bg-yellow-500/60";
    if (rate >= 0.1) return "bg-red-500/40";
    return "bg-red-500/20";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Smart Scheduling
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Answer rates by day and time — based on your {totalCalls.toLocaleString()} calls
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-3xl font-bold">{overallRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Overall answer rate</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-3xl font-bold text-green-500">
            {bestSlot.rate > 0 ? `${bestSlot.day} ${bestSlot.hour}:00` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Best time slot {bestSlot.rate > 0 ? `(${Math.round(bestSlot.rate * 100)}%)` : ""}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-3xl font-bold">{totalCalls.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Calls analysed</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Answer Rate Heatmap
        </h2>

        {totalCalls < 10 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Not enough data yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Make at least 10 calls and the heatmap will show which days and times get the best answer rates. Then schedule your campaigns accordingly.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-xs text-muted-foreground font-medium text-left pb-2 pr-2 w-12" />
                    {HOURS.map((h) => (
                      <th key={h} className="text-[10px] text-muted-foreground font-medium text-center pb-2 px-0.5">
                        {h > 12 ? `${h - 12}p` : h === 12 ? "12p" : `${h}a`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day}>
                      <td className="text-xs font-medium text-muted-foreground pr-2 py-0.5">{day}</td>
                      {HOURS.map((hour) => {
                        const data = grid[`${day}-${hour}`];
                        const rate = data.total > 0 ? Math.round((data.answered / data.total) * 100) : 0;
                        return (
                          <td key={hour} className="px-0.5 py-0.5">
                            <div
                              className={`w-full aspect-square rounded-sm ${getColor(data.total, data.answered)} transition-colors`}
                              title={`${day} ${hour}:00 — ${rate}% (${data.answered}/${data.total})`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500/20" /> Low</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500/60" /> Medium</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500/60" /> Good</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500" /> Best</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-muted/30" /> No data</span>
            </div>
          </>
        )}
      </div>

      {/* Recommendation */}
      {bestSlot.rate > 0 && (
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-3">
          <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Recommendation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your contacts answer {Math.round(bestSlot.rate * 100)}% of calls on <strong>{bestSlot.day}s at {bestSlot.hour > 12 ? `${bestSlot.hour - 12}pm` : `${bestSlot.hour}am`}</strong>.
              {overallRate > 0 && ` That's ${Math.round(bestSlot.rate * 100) - overallRate}% above your average.`}
              {" "}Schedule your next campaign for this window.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
