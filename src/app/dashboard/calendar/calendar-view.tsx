"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Phone,
  Briefcase,
} from "lucide-react";
import { NewBookingForm } from "./new-booking";

type Booking = {
  id: string;
  title: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  notes: string | null;
};

type Job = {
  id: string;
  job_number: string;
  title: string;
  customer_name: string | null;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-500/10 border-blue-500/30 text-blue-600",
  cancelled: "bg-destructive/10 border-destructive/30 text-destructive",
  rescheduled: "bg-amber-500/10 border-amber-500/30 text-amber-600",
  completed: "bg-success/10 border-success/30 text-success",
};

const JOB_STATUS_COLORS: Record<string, string> = {
  booked: "bg-blue-500/10 border-blue-500/30 text-blue-600",
  in_progress: "bg-amber-500/10 border-amber-500/30 text-amber-600",
  completed: "bg-success/10 border-success/30 text-success",
  invoiced: "bg-purple-500/10 border-purple-500/30 text-purple-600",
  cancelled: "bg-destructive/10 border-destructive/30 text-destructive",
};

function formatTime12(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTime12FromTime(time24: string | null): string {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getWeekDays(weekOffset: number): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function CalendarView({
  orgId,
  bookings,
  jobs,
}: {
  orgId: string;
  bookings: Booking[];
  jobs: Job[];
}) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const today = new Date();

  // Group bookings and jobs by day
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      const dateKey = new Date(b.scheduled_start).toDateString();
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(b);
    }
    return map;
  }, [bookings]);

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const j of jobs) {
      if (!j.scheduled_date) continue;
      const dateKey = new Date(j.scheduled_date + "T00:00:00").toDateString();
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(j);
    }
    return map;
  }, [jobs]);

  const weekLabel = `${weekDays[0].toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  })} - ${weekDays[6].toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div>
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[200px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-primary hover:underline ml-2"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setShowNewBooking(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const dateKey = day.toDateString();
          const dayBookings = bookingsByDay.get(dateKey) ?? [];
          const dayJobs = jobsByDay.get(dateKey) ?? [];
          const isToday = isSameDay(day, today);

          return (
            <div
              key={dateKey}
              className={`bg-card border rounded-2xl min-h-[200px] ${
                isToday ? "border-primary/50 ring-1 ring-primary/20" : "border-border"
              }`}
            >
              {/* Day Header */}
              <div className="px-3 py-2 border-b border-border">
                <p
                  className={`text-xs font-medium ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {day.toLocaleDateString("en-AU", { weekday: "short" })}
                </p>
                <p
                  className={`text-lg font-bold ${
                    isToday ? "text-primary" : ""
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>

              {/* Day Content */}
              <div className="p-2 space-y-1.5">
                {/* Bookings */}
                {dayBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className={`w-full text-left p-2 rounded-lg border text-xs transition-colors hover:opacity-80 ${
                      STATUS_COLORS[b.status] || STATUS_COLORS.confirmed
                    }`}
                  >
                    <p className="font-medium truncate">{b.title}</p>
                    <p className="opacity-70 mt-0.5">
                      {formatTime12(b.scheduled_start)}
                    </p>
                  </button>
                ))}

                {/* Jobs */}
                {dayJobs.map((j) => (
                  <button
                    key={j.id}
                    onClick={() =>
                      router.push(`/dashboard/jobs/${j.id}`)
                    }
                    className={`w-full text-left p-2 rounded-lg border text-xs transition-colors hover:opacity-80 ${
                      JOB_STATUS_COLORS[j.status] ||
                      JOB_STATUS_COLORS.booked
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 shrink-0" />
                      <p className="font-medium truncate">{j.title}</p>
                    </div>
                    {j.scheduled_time_start && (
                      <p className="opacity-70 mt-0.5">
                        {formatTime12FromTime(j.scheduled_time_start)}
                      </p>
                    )}
                  </button>
                ))}

                {dayBookings.length === 0 && dayJobs.length === 0 && (
                  <p className="text-[10px] text-muted-foreground text-center py-4 opacity-50">
                    No events
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Detail Popup */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{selectedBooking.title}</h3>
                <span
                  className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                    STATUS_COLORS[selectedBooking.status] ||
                    "bg-muted text-muted-foreground"
                  }`}
                >
                  {selectedBooking.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                x
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>
                  {formatTime12(selectedBooking.scheduled_start)} -{" "}
                  {formatTime12(selectedBooking.scheduled_end)}
                </span>
              </div>
              {selectedBooking.customer_name && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{selectedBooking.customer_name}</span>
                </div>
              )}
              {selectedBooking.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a
                    href={`tel:${selectedBooking.customer_phone}`}
                    className="text-primary hover:underline"
                  >
                    {selectedBooking.customer_phone}
                  </a>
                </div>
              )}
              {selectedBooking.customer_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{selectedBooking.customer_address}</span>
                </div>
              )}
              {selectedBooking.notes && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedBooking.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBooking && (
        <NewBookingForm
          orgId={orgId}
          onClose={() => setShowNewBooking(false)}
          onCreated={() => {
            setShowNewBooking(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
