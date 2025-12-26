import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Info,
  MapPin,
  MessageSquare,
  Shield,
  Sparkles,
  Star,
  TimerReset,
  Trash2,
  X,
  Zap,
} from "lucide-react";

/**
 * Screen Code: X2.9
 * Screen Name: Tip Reminder / Missed Tip Recovery
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From system push/in-app banner after geo encounter
 *  - From X2.1 Nearby Discovery (Missed tip chip)
 *  - From X3.1 Wallet (Missed tip history)
 * Purpose:
 *  - Recover missed revenue with context + quick actions
 *  - Reduce friction: 1-tap Tip Now, or remind later
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Uses CSS keyframes for subtle pulse on "Tip Now"
 */

type ReminderState = "new" | "snoozed" | "dismissed" | "tipped";

type Encounter = {
  id: string;
  proName: string;
  proRole: string;
  rating: number;
  reviews: number;
  distanceMi: number;
  place: string;
  whenText: string;
  suggested: number;
  quick: number[];
  state: ReminderState;
  note?: string;
};

const ENCOUNTERS: Encounter[] = [
  {
    id: "e1",
    proName: "Alex Johnson",
    proRole: "Street Performer",
    rating: 4.9,
    reviews: 312,
    distanceMi: 0.2,
    place: "Downtown Plaza · Fountain",
    whenText: "12 minutes ago",
    suggested: 5,
    quick: [3, 5, 8, 10],
    state: "new",
    note: "You watched the show for ~8 mins.",
  },
  {
    id: "e2",
    proName: "Maya Chen",
    proRole: "Coffee Barista",
    rating: 4.8,
    reviews: 198,
    distanceMi: 0.6,
    place: "Cafe Corner · Counter 2",
    whenText: "Yesterday · 9:15 AM",
    suggested: 3,
    quick: [2, 3, 4, 6],
    state: "snoozed",
    note: "Order: Latte + croissant (approx).",
  },
  {
    id: "e3",
    proName: "Sara Williams",
    proRole: "Fitness Coach",
    rating: 4.9,
    reviews: 421,
    distanceMi: 2.1,
    place: "City Gym · Studio A",
    whenText: "3 days ago",
    suggested: 7,
    quick: [5, 7, 10, 15],
    state: "new",
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDistance(mi: number) {
  return mi < 1 ? `${Math.round(mi * 10) / 10} mi` : `${mi.toFixed(1)} mi`;
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money formats");
    console.assert(formatDistance(0.2).includes("mi"), "distance unit");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function TipReminderX29() {
  const [toast, setToast] = useState<string | null>(null);
  const [items, setItems] = useState<Encounter[]>(ENCOUNTERS);
  const [selected, setSelected] = useState<Encounter | null>(ENCOUNTERS[0]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "new" | "snoozed" | "dismissed" | "tipped">("all");
  const [sort, setSort] = useState<"recent" | "near" | "suggested">("recent");

  const [sheet, setSheet] = useState<null | "filters" | "snooze" | "dismiss" | "why">(null);
  const [sheetMounted, setSheetMounted] = useState(false);

  // Snooze config
  const [snoozeFor, setSnoozeFor] = useState<"15m" | "1h" | "3h" | "tomorrow">("1h");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!sheet) return;
    setSheetMounted(false);
    const t = setTimeout(() => setSheetMounted(true), 10);
    return () => clearTimeout(t);
  }, [sheet]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = items.filter((e) => {
      const matchesQ =
        !q ||
        e.proName.toLowerCase().includes(q) ||
        e.proRole.toLowerCase().includes(q) ||
        e.place.toLowerCase().includes(q);
      const matchesS = status === "all" ? true : e.state === status;
      return matchesQ && matchesS;
    });

    const sorted = [...base].sort((a, b) => {
      if (sort === "near") return a.distanceMi - b.distanceMi;
      if (sort === "suggested") return b.suggested - a.suggested;
      // recent: keep demo order
      return 0;
    });

    return sorted;
  }, [items, query, status, sort]);

  useEffect(() => {
    if (!selected) {
      setSelected(filtered[0] ?? null);
      return;
    }
    if (!filtered.some((x) => x.id === selected.id)) {
      setSelected(filtered[0] ?? null);
    }
  }, [filtered, selected]);

  function openSheet(kind: NonNullable<typeof sheet>) {
    setSheet(kind);
  }

  function closeSheet() {
    setSheetMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function updateState(id: string, next: ReminderState) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, state: next } : x)));
  }

  function tipNow(amount: number) {
    if (!selected) return;
    updateState(selected.id, "tipped");
    setToast(`Tipped ${money(amount)} (mock) → X1.1`);
    // In real app navigate to tip flow prefilled.
  }

  function snoozeApply() {
    if (!selected) return;
    updateState(selected.id, "snoozed");
    setToast(`Snoozed for ${snoozeFor}`);
    closeSheet();
  }

  function dismissConfirm() {
    if (!selected) return;
    updateState(selected.id, "dismissed");
    setToast("Dismissed");
    closeSheet();
  }

  const headerCount = useMemo(() => {
    const newCount = items.filter((x) => x.state === "new").length;
    return newCount;
  }, [items]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → Home")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X2.9 · Tip reminders</div>
          <button
            onClick={() => openSheet("filters")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28">
        {/* Header card */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4 text-white">
          <div className="text-xs text-white/80 inline-flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>{headerCount} new reminders · USD</span>
          </div>
          <div className="mt-2 text-xl font-semibold">Don’t miss a tip</div>
          <div className="text-sm text-white/85 mt-1">We detected recent interactions near you. Tip in 1 tap.</div>

          {/* Search */}
          <div className="mt-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by pro or place…"
              className="w-full px-4 py-3 rounded-2xl bg-white/15 text-white placeholder:text-white/70 border border-white/20 outline-none focus:border-white/30"
            />
          </div>

          {/* chips */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <Chip active={status === "all"} label="All" onClick={() => setStatus("all")} />
            <Chip active={status === "new"} label="New" onClick={() => setStatus("new")} />
            <Chip active={status === "snoozed"} label="Snoozed" onClick={() => setStatus("snoozed")} />
            <Chip active={status === "tipped"} label="Tipped" onClick={() => setStatus("tipped")} />
            <Chip active={status === "dismissed"} label="Dismissed" onClick={() => setStatus("dismissed")} />
          </div>

          <div className="mt-3 text-xs text-white/70 inline-flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5" />
            <span>Location signals are approximate. You can disable reminders in Settings (X5.1).</span>
          </div>
        </div>

        {/* List */}
        <div className="mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold">Recent encounters</div>
            <button
              onClick={() => {
                const next = sort === "recent" ? "near" : sort === "near" ? "suggested" : "recent";
                setSort(next);
                setToast(`Sort: ${next}`);
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100"
            >
              Sort: {sort}
            </button>
          </div>

          <div className="p-3 space-y-2">
            {filtered.map((e) => (
              <EncounterRow key={e.id} e={e} active={selected?.id === e.id} onClick={() => setSelected(e)} />
            ))}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                <div className="font-semibold">No reminders</div>
                <div className="text-sm mt-1">Try another filter.</div>
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold">Quick tip</div>
            <button
              onClick={() => openSheet("why")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100"
            >
              Why this?
            </button>
          </div>

          {selected ? (
            <div className="p-4 space-y-3">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-lg truncate">{selected.proName}</div>
                    <div className="text-sm text-gray-500 truncate">{selected.proRole}</div>
                    <div className="mt-2 text-xs text-gray-600 inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500" /> {selected.rating} ({selected.reviews})
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {formatDistance(selected.distanceMi)}
                      </span>
                    </div>
                  </div>
                  <StatePill state={selected.state} />
                </div>

                <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-3">
                  <div className="text-xs text-gray-500">Where</div>
                  <div className="font-semibold">{selected.place}</div>
                  <div className="text-xs text-gray-500 mt-1">When: {selected.whenText}</div>
                </div>

                {selected.note && (
                  <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5" />
                    <span>{selected.note}</span>
                  </div>
                )}
              </div>

              {/* suggested */}
              <div className="rounded-3xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Suggested</div>
                    <div className="text-xs text-gray-500 mt-0.5">Based on typical tips nearby</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="text-2xl font-semibold">{money(selected.suggested)}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  {selected.quick.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => tipNow(amt)}
                      className="h-11 rounded-2xl border border-gray-200 bg-gray-50 font-semibold hover:bg-gray-100"
                    >
                      {money(amt)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => tipNow(selected.suggested)}
                  className="mt-3 w-full h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2 pulseBtn"
                >
                  <Zap className="w-4 h-4" /> Tip now {money(selected.suggested)}
                </button>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openSheet("snooze")}
                    className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
                  >
                    <TimerReset className="w-4 h-4" /> Remind later
                  </button>
                  <button
                    onClick={() => openSheet("dismiss")}
                    className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
                  >
                    <Trash2 className="w-4 h-4" /> Dismiss
                  </button>
                </div>

                <button
                  onClick={() => alert("Open profile (mock) → X2.4")}
                  className="w-full mt-2 h-12 rounded-2xl bg-gray-900 text-white font-semibold inline-flex items-center justify-center gap-2"
                >
                  View pro profile <ChevronRight className="w-4 h-4" />
                </button>

                <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5" />
                  <span>We never ask for OTP/PIN. Confirm payment only inside the app.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <div className="font-semibold">Select a reminder</div>
              <div className="text-sm mt-1">Tap a row above to tip quickly.</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Smart reminders</div>
              <div className="text-xs text-white/75">Snooze or disable anytime.</div>
            </div>
            <button
              onClick={() => alert("Open Notification settings (mock) → X5.1")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet title={sheetTitle(sheet)} mounted={sheetMounted} onClose={closeSheet}>
          {sheet === "filters" && (
            <FiltersPanel
              status={status}
              setStatus={setStatus}
              sort={sort}
              setSort={setSort}
              onClear={() => {
                setQuery("");
                setStatus("all");
                setSort("recent");
                setToast("Cleared");
                closeSheet();
              }}
              onApply={() => {
                setToast("Applied");
                closeSheet();
              }}
            />
          )}

          {sheet === "snooze" && (
            <SnoozePanel
              value={snoozeFor}
              setValue={setSnoozeFor}
              onApply={snoozeApply}
              onClose={closeSheet}
            />
          )}

          {sheet === "dismiss" && selected && (
            <DismissPanel
              proName={selected.proName}
              place={selected.place}
              onDismiss={dismissConfirm}
              onClose={closeSheet}
            />
          )}

          {sheet === "why" && selected && <WhyPanel selected={selected} onClose={closeSheet} />}
        </Sheet>
      )}

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg">{toast ?? ""}</div>
      </div>
    </div>
  );
}

function sheetTitle(s: "filters" | "snooze" | "dismiss" | "why") {
  if (s === "filters") return "Filters";
  if (s === "snooze") return "Remind later";
  if (s === "dismiss") return "Dismiss reminder";
  return "Why you’re seeing this";
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-3 rounded-2xl border font-semibold inline-flex items-center gap-2 transition ${
        active ? "bg-white text-blue-700 border-white" : "bg-white/10 text-white border-white/15 hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}

function StatePill({ state }: { state: ReminderState }) {
  const base = "text-xs px-3 py-1.5 rounded-full border font-semibold";
  if (state === "new") return <span className={`${base} bg-emerald-50 border-emerald-100 text-emerald-800`}>NEW</span>;
  if (state === "snoozed") return <span className={`${base} bg-blue-50 border-blue-100 text-blue-800`}>SNOOZED</span>;
  if (state === "tipped") return <span className={`${base} bg-gray-900 border-gray-900 text-white`}>TIPPED</span>;
  return <span className={`${base} bg-gray-50 border-gray-200 text-gray-700`}>DISMISSED</span>;
}

function EncounterRow({ e, active, onClick }: { e: Encounter; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-3xl border p-3 transition ${
        active ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold truncate">{e.proName}</div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{e.proRole} · {e.place}</div>
          <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{e.whenText}</span>
            <span>·</span>
            <span>Suggested {money(e.suggested)}</span>
          </div>
        </div>
        <div className="text-right">
          <StatePill state={e.state} />
          <div className="mt-2 text-xs text-gray-500">{formatDistance(e.distanceMi)}</div>
        </div>
      </div>
    </button>
  );
}

function FiltersPanel({
  status,
  setStatus,
  sort,
  setSort,
  onClear,
  onApply,
}: {
  status: "all" | ReminderState;
  setStatus: (v: "all" | ReminderState) => void;
  sort: "recent" | "near" | "suggested";
  setSort: (v: "recent" | "near" | "suggested") => void;
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Status</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Pill active={status === "all"} label="All" onClick={() => setStatus("all")} />
          <Pill active={status === "new"} label="New" onClick={() => setStatus("new")} />
          <Pill active={status === "snoozed"} label="Snoozed" onClick={() => setStatus("snoozed")} />
          <Pill active={status === "tipped"} label="Tipped" onClick={() => setStatus("tipped")} />
        </div>
        <div className="mt-2">
          <Pill active={status === "dismissed"} label="Dismissed" onClick={() => setStatus("dismissed")} />
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Sort</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Pill active={sort === "recent"} label="Recent" onClick={() => setSort("recent")} />
          <Pill active={sort === "near"} label="Near" onClick={() => setSort("near")} />
          <Pill active={sort === "suggested"} label="Suggested" onClick={() => setSort("suggested")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClear} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Clear
        </button>
        <button onClick={onApply} className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500">
          Apply
        </button>
      </div>
    </div>
  );
}

function SnoozePanel({
  value,
  setValue,
  onApply,
  onClose,
}: {
  value: "15m" | "1h" | "3h" | "tomorrow";
  setValue: (v: "15m" | "1h" | "3h" | "tomorrow") => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Snooze reminder</div>
        <div className="text-sm text-gray-500 mt-1">We’ll remind you again later.</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Pill active={value === "15m"} label="15 min" onClick={() => setValue("15m")} />
        <Pill active={value === "1h"} label="1 hour" onClick={() => setValue("1h")} />
        <Pill active={value === "3h"} label="3 hours" onClick={() => setValue("3h")} />
        <Pill active={value === "tomorrow"} label="Tomorrow" onClick={() => setValue("tomorrow")} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={onApply} className="h-12 rounded-2xl text-white font-semibold bg-gray-900">
          Snooze
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Bell className="w-4 h-4 mt-0.5" />
        <span>Production should schedule local notifications + server fallback.</span>
      </div>
    </div>
  );
}

function DismissPanel({
  proName,
  place,
  onDismiss,
  onClose,
}: {
  proName: string;
  place: string;
  onDismiss: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
        <div className="font-semibold">Dismiss this reminder?</div>
        <div className="text-sm text-amber-800 mt-1">You won’t be reminded about this encounter again.</div>
        <div className="text-xs text-amber-800 mt-2">
          Pro: <b>{proName}</b>
          <br />
          Place: <b>{place}</b>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Keep
        </button>
        <button onClick={onDismiss} className="h-12 rounded-2xl text-white font-semibold bg-gray-900">
          Dismiss
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>You can still tip later via Pro profile.</span>
      </div>
    </div>
  );
}

function WhyPanel({ selected, onClose }: { selected: Encounter; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Why you’re seeing this</div>
        <div className="text-sm text-gray-500 mt-1">We surface reminders when signals suggest an interaction.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 p-4">
        <div className="font-semibold">Signals used (example)</div>
        <div className="text-sm text-gray-600 mt-2 space-y-2">
          <div className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> Coarse location near <b>{selected.place}</b></div>
          <div className="inline-flex items-center gap-2"><Clock className="w-4 h-4" /> Time window: <b>{selected.whenText}</b></div>
          <div className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Pro popularity + typical tip range</div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Control</div>
        <div className="text-sm text-gray-600 mt-1">Disable reminders or delete location history in Settings.</div>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>We do not store precise GPS by default in this mock. Production must follow privacy policy.</span>
      </div>
    </div>
  );
}

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-2xl border font-semibold inline-flex items-center justify-center transition ${
        active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

function Sheet({
  title,
  mounted,
  onClose,
  children,
}: {
  title: string;
  mounted: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  function close() {
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button className="absolute inset-0 bg-black/40" onClick={close} aria-label="Close overlay" />
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
          mounted ? "translate-y-0" : "translate-y-[560px]"
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
            <div className="text-sm text-gray-500 mt-0.5">X2.9 (mock)</div>
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
      .pulseBtn{ position: relative; }
      .pulseBtn:after{
        content: "";
        position: absolute;
        inset: -2px;
        border-radius: 18px;
        background: rgba(16,185,129,.25);
        filter: blur(10px);
        opacity: .6;
        animation: pulseGlow 1.4s infinite;
        z-index: -1;
      }
      @keyframes pulseGlow{
        0%{ transform: scale(.96); opacity: .25; }
        60%{ transform: scale(1.02); opacity: .7; }
        100%{ transform: scale(.96); opacity: .25; }
      }
      .shimmer{
        position: relative;
        overflow: hidden;
      }
      .shimmer:after{
        content:"";
        position:absolute;
        top:0;left:-40%;
        height:100%;
        width:40%;
        background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.35), rgba(255,255,255,0));
        animation: shimmer 1.2s infinite;
      }
      @keyframes shimmer{
        0%{ transform: translateX(0); }
        100%{ transform: translateX(240%); }
      }
    `}</style>
  );
}
