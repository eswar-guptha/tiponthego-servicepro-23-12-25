import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Flame,
  Info,
  MapPin,
  Search,
  Star,
  Timer,
  User,
  X,
  Zap,
} from "lucide-react";

/**
 * Screen Code: X2.8
 * Screen Name: Pro Availability / Live Status
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From X2.1 Nearby Discovery pin/list
 *  - From X2.3 Mini Profile (availability row tap)
 *  - From X2.4 Full Profile (availability chip)
 * Purpose:
 *  - Increase conversion: show Live/Busy/Offline + urgency
 *  - Provide clear next action: Tip Now / Schedule / Notify Me
 *
 * Canvas Compatibility:
 * - No framer-motion (prevents sandbox Illegal constructor)
 * - Uses CSS keyframes for Live pulse and minimal transitions
 */

type Status = "live" | "busy" | "offline";

type Pro = {
  id: string;
  name: string;
  role: string;
  verified: boolean;
  rating: number;
  reviews: number;
  distanceMi: number;
  image: string;
  status: Status;
  liveSinceMins?: number;
  busyUntilMins?: number;
  nextWindow?: { start: string; end: string };
  locationLabel: string;
  tags: string[];
  avgTip: number;
};

const PROS: Pro[] = [
  {
    id: "p1",
    name: "Alex Johnson",
    role: "Street Performer",
    verified: true,
    rating: 4.9,
    reviews: 312,
    distanceMi: 0.2,
    image: "https://i.pravatar.cc/240?img=12",
    status: "live",
    liveSinceMins: 18,
    locationLabel: "Downtown Plaza · Fountain",
    tags: ["Live", "Popular"],
    avgTip: 6.5,
  },
  {
    id: "p2",
    name: "Maya Chen",
    role: "Coffee Barista",
    verified: true,
    rating: 4.8,
    reviews: 198,
    distanceMi: 0.6,
    image: "https://i.pravatar.cc/240?img=32",
    status: "busy",
    busyUntilMins: 22,
    locationLabel: "Cafe Corner · Counter 2",
    tags: ["Nearby"],
    avgTip: 4.25,
  },
  {
    id: "p3",
    name: "Sara Williams",
    role: "Fitness Coach",
    verified: true,
    rating: 4.9,
    reviews: 421,
    distanceMi: 2.1,
    image: "https://i.pravatar.cc/240?img=47",
    status: "offline",
    nextWindow: { start: "6:00 PM", end: "8:00 PM" },
    locationLabel: "City Gym · Studio A",
    tags: ["Top Rated"],
    avgTip: 9.75,
  },
  {
    id: "p4",
    name: "Diego Rivera",
    role: "Delivery Partner",
    verified: false,
    rating: 4.7,
    reviews: 141,
    distanceMi: 1.4,
    image: "https://i.pravatar.cc/240?img=54",
    status: "live",
    liveSinceMins: 5,
    locationLabel: "Market Street · Zone 4",
    tags: ["Fast"],
    avgTip: 3.8,
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function formatDistance(mi: number) {
  return mi < 1 ? `${Math.round(mi * 10) / 10} mi` : `${mi.toFixed(1)} mi`;
}

function statusLabel(s: Status) {
  if (s === "live") return "Live now";
  if (s === "busy") return "Busy";
  return "Offline";
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money formats");
    console.assert(clamp01(-1) === 0, "clamp01 low");
    console.assert(clamp01(2) === 1, "clamp01 high");
    console.assert(formatDistance(0.2).includes("mi"), "distance unit");
    console.assert(statusLabel("live") === "Live now", "status label live");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function ProAvailabilityScreen() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [sort, setSort] = useState<"recommended" | "nearby" | "live">(
    "recommended"
  );

  const [toast, setToast] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [selected, setSelected] = useState<Pro | null>(PROS[0]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMounted, setSheetMounted] = useState(false);

  const [notify, setNotify] = useState<Record<string, boolean>>({
    p2: true,
    p3: false,
  });
  const [scheduled, setScheduled] = useState<Record<string, boolean>>({});

  // Right-side scroll indicator
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({ size: 0.32, top: 0 }));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!sheetOpen) return;
    setSheetMounted(false);
    const t = setTimeout(() => setSheetMounted(true), 10);
    return () => clearTimeout(t);
  }, [sheetOpen]);

  useEffect(() => {
    const el:any = pageRef.current;
    if (!el) return;

    function compute(
      scrollTop: number,
      scrollHeight: number,
      clientHeight: number
    ) {
      const maxScroll = Math.max(1, scrollHeight - clientHeight);
      const progress = clamp01(scrollTop / maxScroll);
      const size = clamp01(clientHeight / Math.max(scrollHeight, 1));
      const thumbSize = Math.max(0.18, Math.min(0.55, size));
      const travel = 1 - thumbSize;
      return { size: thumbSize, top: travel * progress };
    }

    function sync() {
      setThumb(compute(el.scrollTop, el.scrollHeight, el.clientHeight));
    }

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = PROS.filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.locationLabel.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter;
      return matchesQ && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "nearby") return a.distanceMi - b.distanceMi;
      if (sort === "live") {
        const aw = a.status === "live" ? 0 : a.status === "busy" ? 1 : 2;
        const bw = b.status === "live" ? 0 : b.status === "busy" ? 1 : 2;
        return aw - bw;
      }
      // recommended: live first, then rating, then distance
      const aw = a.status === "live" ? 0 : a.status === "busy" ? 1 : 2;
      const bw = b.status === "live" ? 0 : b.status === "busy" ? 1 : 2;
      if (aw !== bw) return aw - bw;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.distanceMi - b.distanceMi;
    });

    return sorted;
  }, [query, statusFilter, sort]);

  function openSheet(p: Pro) {
    setSelected(p);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetMounted(false);
    setTimeout(() => setSheetOpen(false), 180);
  }

  function toggleNotify(id: string) {
    setNotify((prev) => ({ ...prev, [id]: !prev[id] }));
    setToast(!notify[id] ? "Notify enabled" : "Notify disabled");
  }

  function scheduleWindow(id: string) {
    setScheduled((prev) => ({ ...prev, [id]: true }));
    setToast("Scheduled");
  }

  function primaryCTA(p: Pro) {
    if (p.status === "live") return "Tip Now";
    if (p.status === "busy") return "Tip when free";
    return "Schedule";
  }

  function onPrimary(p: Pro) {
    if (p.status === "live") {
      alert("Next: X1.1 – Tip Now (mock)");
      return;
    }
    if (p.status === "busy") {
      setToast("We’ll prompt you when they’re free (mock)");
      toggleNotify(p.id);
      return;
    }
    scheduleWindow(p.id);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X2.4")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X2.8 · Availability</div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header controls */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-3">
        <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role, place…"
              className="w-full pl-9 pr-3 py-3 rounded-2xl bg-white/15 text-white placeholder:text-white/70 border border-white/20 outline-none focus:border-white/30"
            />
          </div>

          {/* Filters row */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-white/85 text-sm inline-flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Near you</span>
            </div>

            <button
              onClick={() => {
                const next =
                  sort === "recommended"
                    ? "nearby"
                    : sort === "nearby"
                    ? "live"
                    : "recommended";
                setSort(next);
                setToast(`Sort: ${next}`);
              }}
              className="h-10 px-3 rounded-2xl bg-white/10 border border-white/15 text-white font-semibold inline-flex items-center gap-2 hover:bg-white/15"
            >
              <Timer className="w-4 h-4" />
              <span className="text-sm">
                {sort === "recommended"
                  ? "Recommended"
                  : sort === "nearby"
                  ? "Nearby"
                  : "Live first"}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Status chips */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <StatusChip
              active={statusFilter === "all"}
              label="All"
              onClick={() => setStatusFilter("all")}
            />
            <StatusChip
              active={statusFilter === "live"}
              label="Live"
              icon={<Zap className="w-4 h-4" />}
              onClick={() => setStatusFilter("live")}
            />
            <StatusChip
              active={statusFilter === "busy"}
              label="Busy"
              icon={<Clock className="w-4 h-4" />}
              onClick={() => setStatusFilter("busy")}
            />
            <StatusChip
              active={statusFilter === "offline"}
              label="Offline"
              icon={<User className="w-4 h-4" />}
              onClick={() => setStatusFilter("offline")}
            />
          </div>

          <div className="mt-3 text-xs text-white/70 inline-flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5" />
            <span>
              Live pros convert best. Busy pros can notify you when free.
            </span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="relative">
        <div
          ref={pageRef}
          className="max-w-md mx-auto px-4 pb-28 h-[calc(100vh-228px)] overflow-y-auto pr-5"
        >
          <div className="space-y-3">
            {list.map((p) => (
              <ProAvailabilityCard
                key={p.id}
                pro={p}
                notifyOn={!!notify[p.id]}
                scheduled={!!scheduled[p.id]}
                onOpen={() => openSheet(p)}
                onPrimary={() => onPrimary(p)}
                cta={primaryCTA(p)}
              />
            ))}
            <div className="h-6" />
          </div>
        </div>

        {/* Right-side scroll indicator */}
        <div className="pointer-events-none absolute top-3 bottom-28 right-3 w-[6px] rounded-full bg-white/20">
          <div
            className="absolute left-0 right-0 rounded-full bg-blue-600"
            style={{
              height: `${thumb.size * 100}%`,
              top: `${thumb.top * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Bottom actions mock */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Availability</div>
              <div className="text-xs text-white/75">
                Tap a card for live details
              </div>
            </div>
            <button
              onClick={() => setFiltersOpen(true)}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Filters sheet */}
      {filtersOpen && (
        <Sheet title="Filters" onClose={() => setFiltersOpen(false)}>
          <div className="space-y-3">
            <ToggleRow
              title="Show only Verified"
              subtitle="Identity verified pros"
              checked={false}
              onChange={() => setToast("(Mock) Verified filter")}
            />
            <ToggleRow
              title="Show Live only"
              subtitle="Hide Busy/Offline"
              checked={statusFilter === "live"}
              onChange={() => {
                setStatusFilter((s) => (s === "live" ? "all" : "live"));
                setToast("Updated");
              }}
            />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setQuery("");
                  setToast("Cleared");
                }}
                className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setFiltersOpen(false);
                  setToast("Applied");
                }}
                className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
              >
                Apply
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {/* Pro detail bottom sheet */}
      {sheetOpen && selected && (
        <Sheet title="Live details" onClose={closeSheet}>
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <img
                src={selected.image}
                alt={selected.name}
                className="w-14 h-14 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-lg truncate">
                    {selected.name}
                  </div>
                  {selected.verified && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {selected.role} · {formatDistance(selected.distanceMi)}
                </div>
                <div className="mt-2 text-xs text-gray-600 inline-flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />{" "}
                    {selected.rating} ({selected.reviews})
                  </span>
                  <span>·</span>
                  <span>Avg tip {money(selected.avgTip)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-gray-100 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Status</div>
                <StatusPill status={selected.status} />
              </div>

              <div className="mt-3 text-sm text-gray-600">
                {selected.status === "live" && (
                  <div className="inline-flex items-center gap-2">
                    <span className="liveDot" />
                    <span>
                      Live since {selected.liveSinceMins} min ·{" "}
                      {selected.locationLabel}
                    </span>
                  </div>
                )}
                {selected.status === "busy" && (
                  <div className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      Busy for ~{selected.busyUntilMins} min ·{" "}
                      {selected.locationLabel}
                    </span>
                  </div>
                )}
                {selected.status === "offline" && (
                  <div className="inline-flex items-center gap-2">
                    <CalendarClock className="w-4 h-4" />
                    <span>
                      Next window {selected.nextWindow?.start}–
                      {selected.nextWindow?.end} · {selected.locationLabel}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (selected.status === "live") {
                      setToast("Notifications on (mock)");
                      toggleNotify(selected.id);
                      return;
                    }
                    setToast("Notify me enabled");
                    toggleNotify(selected.id);
                  }}
                  className={`h-12 rounded-2xl border font-semibold inline-flex items-center justify-center gap-2 transition ${
                    notify[selected.id]
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Bell className="w-4 h-4" />{" "}
                  {notify[selected.id] ? "Notify on" : "Notify me"}
                </button>

                <button
                  onClick={() => onPrimary(selected)}
                  className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> {primaryCTA(selected)}
                </button>
              </div>

              {selected.status === "offline" && (
                <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5" />
                  <span>
                    Scheduling reserves a reminder—not a payment. You’ll confirm
                    when tipping.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => alert("Next: X2.4 – Full Profile (mock)")}
              className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              View Full Profile
            </button>
            <button
              onClick={() => {
                setToast("Saved (mock)");
              }}
              className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Save
            </button>
          </div>
        </Sheet>
      )}

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] transition-all duration-200 ${
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg">
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function ProAvailabilityCard({
  pro,
  notifyOn,
  scheduled,
  onOpen,
  onPrimary,
  cta,
}: {
  pro: Pro;
  notifyOn: boolean;
  scheduled: boolean;
  onOpen: () => void;
  onPrimary: () => void;
  cta: string;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={pro.image}
            alt={pro.name}
            className="w-14 h-14 rounded-2xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-lg truncate">
                    {pro.name}
                  </div>
                  {pro.verified && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {pro.role} · {formatDistance(pro.distanceMi)} ·{" "}
                  {pro.locationLabel}
                </div>
              </div>
              <StatusPill status={pro.status} />
            </div>

            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-100 inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5" /> {pro.rating} ({pro.reviews})
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                Avg tip {money(pro.avgTip)}
              </span>
              {pro.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
              {pro.status === "live" && (
                <div className="inline-flex items-center gap-2">
                  <span className="liveDot" />
                  <span>
                    Live since <b>{pro.liveSinceMins} min</b>
                  </span>
                </div>
              )}
              {pro.status === "busy" && (
                <div className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    Busy ~<b>{pro.busyUntilMins} min</b>
                  </span>
                </div>
              )}
              {pro.status === "offline" && (
                <div className="inline-flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  <span>
                    Next{" "}
                    <b>
                      {pro.nextWindow?.start}–{pro.nextWindow?.end}
                    </b>
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={onOpen}
                className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                Details
              </button>
              <button
                onClick={onPrimary}
                className="h-11 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
              >
                {cta}
              </button>
            </div>

            {(notifyOn || scheduled) && (
              <div className="mt-2 text-xs text-gray-500">
                {notifyOn && <span className="mr-2">🔔 Notify on</span>}
                {scheduled && <span>📅 Scheduled</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const base =
    "text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2";
  if (status === "live")
    return (
      <span
        className={`${base} bg-emerald-50 border-emerald-100 text-emerald-800`}
      >
        <span className="liveDot" /> Live
      </span>
    );
  if (status === "busy")
    return (
      <span className={`${base} bg-amber-50 border-amber-100 text-amber-800`}>
        <Flame className="w-3.5 h-3.5" /> Busy
      </span>
    );
  return (
    <span className={`${base} bg-gray-50 border-gray-200 text-gray-700`}>
      <User className="w-3.5 h-3.5" /> Offline
    </span>
  );
}

function StatusChip({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-3 rounded-2xl border font-semibold inline-flex items-center gap-2 transition ${
        active
          ? "bg-white text-blue-700 border-white"
          : "bg-white/10 text-white border-white/15 hover:bg-white/15"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full text-left rounded-3xl border border-gray-100 bg-gray-50 p-4 hover:bg-gray-100 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
        </div>
        <div
          className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${
            checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setMounted(false);
    setTimeout(() => onClose(), 180);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-label="Close overlay"
      />
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
          mounted ? "translate-y-0" : "translate-y-[420px]"
        }`}
        role="dialog"
        aria-label={title}
      >
        <div className="pt-3 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-gray-200" />
        </div>
        <div className="px-4 pt-3 pb-4 border-b flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-lg">{title}</div>
            <div className="text-sm text-gray-500 mt-0.5">X2.8 (mock)</div>
          </div>
          <button
            onClick={close}
            className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      .liveDot{
        width: 10px;
        height: 10px;
        border-radius: 9999px;
        background: rgb(16 185 129);
        box-shadow: 0 0 0 rgba(16,185,129,.6);
        animation: livePulse 1.2s infinite;
      }
      @keyframes livePulse{
        0%{ box-shadow: 0 0 0 0 rgba(16,185,129,.5); }
        70%{ box-shadow: 0 0 0 10px rgba(16,185,129,0); }
        100%{ box-shadow: 0 0 0 0 rgba(16,185,129,0); }
      }
    `}</style>
  );
}
