import React, { useEffect, useMemo, useState } from "react";

/**
 * Screen Code: X5.7
 * Screen Name: Per‑Venue Rules (Allow/Deny + Favorites overrides)
 * Currency: USD
 * Roles: Customer / Guest
 * Purpose:
 *  - Let users control reminders per venue (Always allow / Always deny / Follow global)
 *  - Add Favorites (saved venues) with stronger defaults
 *  - Reduce false reminders + increase relevance
 * Notes:
 *  - Canvas-safe: no framer-motion
 *  - Uses inline SVG icons to avoid CDN fetch issues
 */

type RuleMode = "Follow global" | "Always allow" | "Always deny";

type Venue = {
  id: string;
  name: string;
  category: string;
  address: string;
  distanceMi: number;
  lastVisit: string;
  favorite: boolean;
  rule: RuleMode;
  overrideCaps: boolean;
  capDailyMax: 1 | 2 | 3;
  minGapMinutes: 30 | 60 | 90 | 120;
  quietOverride: "Use global" | "No quiet hours" | "Custom";
  quietStart?: string; // HH:MM
  quietEnd?: string; // HH:MM
  notes?: string;
};

type Tab = "All" | "Favorites" | "Allowed" | "Denied";

type Sheet = null | "venue" | "bulk" | "help";

const DEMO_VENUES: Venue[] = [
  {
    id: "v_1",
    name: "Cafe Aura",
    category: "Coffee",
    address: "Market St · Downtown",
    distanceMi: 0.4,
    lastVisit: "Today",
    favorite: true,
    rule: "Always allow",
    overrideCaps: true,
    capDailyMax: 2,
    minGapMinutes: 90,
    quietOverride: "Use global",
    notes: "Favorite barista Alex",
  },
  {
    id: "v_2",
    name: "Glow Salon",
    category: "Salon",
    address: "8th Ave · Midtown",
    distanceMi: 1.2,
    lastVisit: "Dec 18",
    favorite: false,
    rule: "Follow global",
    overrideCaps: false,
    capDailyMax: 2,
    minGapMinutes: 90,
    quietOverride: "Use global",
  },
  {
    id: "v_3",
    name: "QuickFix Auto",
    category: "Mechanic",
    address: "Route 12 · West",
    distanceMi: 3.8,
    lastVisit: "Dec 10",
    favorite: false,
    rule: "Always deny",
    overrideCaps: false,
    capDailyMax: 2,
    minGapMinutes: 90,
    quietOverride: "Use global",
    notes: "No reminders here",
  },
  {
    id: "v_4",
    name: "Bluebird Hotel",
    category: "Hotel",
    address: "River Rd · South",
    distanceMi: 2.4,
    lastVisit: "Nov 29",
    favorite: true,
    rule: "Follow global",
    overrideCaps: true,
    capDailyMax: 1,
    minGapMinutes: 120,
    quietOverride: "Custom",
    quietStart: "23:00",
    quietEnd: "08:00",
    notes: "Only morning reminders",
  },
  {
    id: "v_5",
    name: "Metro Gym",
    category: "Gym",
    address: "2nd St · East",
    distanceMi: 0.9,
    lastVisit: "Nov 12",
    favorite: false,
    rule: "Follow global",
    overrideCaps: false,
    capDailyMax: 2,
    minGapMinutes: 90,
    quietOverride: "Use global",
  },
];

function runDevChecks() {
  try {
    console.assert(isHHMM("00:00") && isHHMM("23:59"), "valid hh:mm");
    console.assert(!isHHMM("24:00") && !isHHMM("9:00"), "invalid hh:mm");
    console.assert(formatMi(1.2) === "1.2 mi", "distance");
    const v = { ...DEMO_VENUES[0], rule: "Always deny" as RuleMode, favorite: true };
    console.assert(chipTone(v) === "deny", "tone deny");
    console.assert(summaryLine({ ...DEMO_VENUES[1], rule: "Follow global" }).includes("Follows global"), "summary follow");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function PerVenueRulesX57() {
  const [toast, setToast] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [venues, setVenues] = useState<Venue[]>(DEMO_VENUES);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Bulk controls
  const [bulkAction, setBulkAction] = useState<"Allow" | "Deny" | "Clear">("Allow");
  const [bulkTarget, setBulkTarget] = useState<Tab>("Favorites");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!sheet) return;
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, [sheet]);

  const active = useMemo(() => venues.find((v) => v.id === activeId) ?? null, [venues, activeId]);

  const counts = useMemo(() => {
    const fav = venues.filter((v) => v.favorite).length;
    const allow = venues.filter((v) => v.rule === "Always allow").length;
    const deny = venues.filter((v) => v.rule === "Always deny").length;
    return { fav, allow, deny, all: venues.length };
  }, [venues]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = venues;
    if (tab === "Favorites") list = list.filter((v) => v.favorite);
    if (tab === "Allowed") list = list.filter((v) => v.rule === "Always allow");
    if (tab === "Denied") list = list.filter((v) => v.rule === "Always deny");
    if (s) {
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(s) ||
          v.category.toLowerCase().includes(s) ||
          v.address.toLowerCase().includes(s)
      );
    }
    // Most recently visited first (rough mock)
    const score = (x: Venue) => (x.lastVisit === "Today" ? 3 : x.lastVisit.startsWith("Dec") ? 2 : 1);
    return [...list].sort((a, b) => score(b) - score(a));
  }, [q, tab, venues]);

  const health = useMemo(() => {
    // "Health" indicates: fewer denies, more favorites configured
    const total = Math.max(1, venues.length);
    const configured = venues.filter((v) => v.rule !== "Follow global" || v.favorite).length;
    const pct = Math.min(100, Math.round((configured / total) * 100));
    const label = pct >= 70 ? "Personalized" : pct >= 35 ? "Getting there" : "Default";
    return { pct, label };
  }, [venues]);

  function openVenue(id: string) {
    setActiveId(id);
    setSheet("venue");
  }

  function closeSheet() {
    setMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function updateVenue(id: string, patch: Partial<Venue>) {
    setVenues((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
    setToast("Updated");
  }

  function toggleFav(id: string) {
    setVenues((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const nextFav = !v.favorite;
        // Helpful default: favorites are allowed unless explicitly denied
        const nextRule: RuleMode = nextFav && v.rule === "Follow global" ? "Always allow" : v.rule;
        return { ...v, favorite: nextFav, rule: nextRule };
      })
    );
    setToast("Updated");
  }

  function applyBulk() {
    setVenues((prev) => {
      const targetSet =
        bulkTarget === "Favorites"
          ? (v: Venue) => v.favorite
          : bulkTarget === "Allowed"
          ? (v: Venue) => v.rule === "Always allow"
          : bulkTarget === "Denied"
          ? (v: Venue) => v.rule === "Always deny"
          : (_: Venue) => true;

      return prev.map((v) => {
        if (!targetSet(v)) return v;
        if (bulkAction === "Allow") return { ...v, rule: "Always allow" };
        if (bulkAction === "Deny") return { ...v, rule: "Always deny" };
        return { ...v, rule: "Follow global" };
      });
    });
    setToast("Bulk applied (mock)");
    closeSheet();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X5.6")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <IconBack />
          </button>
          <div className="text-white font-semibold">X5.7 · Per‑venue rules</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSheet("bulk")}
              className="h-10 px-3 rounded-2xl bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15"
            >
              Bulk
            </button>
            <button
              onClick={() => setSheet("help")}
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
              aria-label="Help"
            >
              <IconInfo />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-3">
        {/* Overview */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                  <IconPin />
                  <span>Venue preferences</span>
                </div>
                <div className="mt-1 text-2xl font-semibold">Allow, deny, or follow global</div>
                <div className="text-sm text-gray-600 mt-1">Fine‑tune reminders for specific places.</div>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${health.pct >= 70 ? "bg-emerald-50 border-emerald-100 text-emerald-800" : health.pct >= 35 ? "bg-amber-50 border-amber-100 text-amber-800" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                {health.pct}% · {health.label}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Stat title="Favorites" value={String(counts.fav)} icon={<IconStar />} />
              <Stat title="Allowed" value={String(counts.allow)} icon={<IconCheck />} />
              <Stat title="Denied" value={String(counts.deny)} icon={<IconBlock />} />
            </div>

            <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center">
                <IconSearch />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500">Search venues</div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cafe, Salon, Hotel…"
                  className="mt-1 w-full h-10 rounded-2xl border border-gray-200 px-3 font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <button
                onClick={() => {
                  setQ("");
                  setToast("Cleared");
                }}
                className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="grid grid-cols-4 gap-2">
              <TabBtn label={`All (${counts.all})`} active={tab === "All"} onClick={() => setTab("All")} />
              <TabBtn label={`Fav (${counts.fav})`} active={tab === "Favorites"} onClick={() => setTab("Favorites")} />
              <TabBtn label={`Allow (${counts.allow})`} active={tab === "Allowed"} onClick={() => setTab("Allowed")} />
              <TabBtn label={`Deny (${counts.deny})`} active={tab === "Denied"} onClick={() => setTab("Denied")} />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="font-semibold">Venues</div>
              <div className="text-sm text-gray-500 mt-0.5">Tap a venue to set rules</div>
            </div>
            <button
              onClick={() => {
                setVenues((p) => [...p]);
                setToast("Synced (mock)");
              }}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Sync
            </button>
          </div>

          <div className="p-2 space-y-2">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">No venues match your search.</div>
            ) : (
              filtered.map((v) => (
                <VenueRow
                  key={v.id}
                  v={v}
                  onOpen={() => openVenue(v.id)}
                  onToggleFav={() => toggleFav(v.id)}
                />
              ))
            )}
          </div>

          <div className="px-4 pb-4">
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="font-semibold">Tip</div>
              <div className="text-sm text-gray-600 mt-1">
                Favorites default to <b>Allow</b> (you can still deny). Denied venues never trigger reminders.
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X5.7</div>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Want fewer reminders?</div>
              <div className="text-xs text-white/75">Deny noisy places, allow favorites.</div>
            </div>
            <button
              onClick={() => setSheet("bulk")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Bulk edit
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg inline-flex items-center gap-2">
          <span className={toast?.includes("Updated") ? "okTick" : ""}>
            <IconCheck />
          </span>
          {toast ?? ""}
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet
          title={sheet === "venue" ? "Venue rule" : sheet === "bulk" ? "Bulk edit" : "Help"}
          subtitle={sheet === "venue" ? "X5.7" : sheet === "bulk" ? "Apply to many venues" : "How per‑venue rules work"}
          mounted={mounted}
          onClose={closeSheet}
        >
          {sheet === "venue" ? (
            active ? (
              <VenueSheet
                v={active}
                onClose={closeSheet}
                onUpdate={(patch) => updateVenue(active.id, patch)}
                onToggleFav={() => toggleFav(active.id)}
                toast={(t) => setToast(t)}
              />
            ) : (
              <div className="text-sm text-gray-500">No venue selected.</div>
            )
          ) : sheet === "bulk" ? (
            <BulkSheet
              action={bulkAction}
              target={bulkTarget}
              setAction={setBulkAction}
              setTarget={setBulkTarget}
              onApply={applyBulk}
              onClose={closeSheet}
            />
          ) : (
            <HelpSheet onClose={closeSheet} />
          )}
        </Sheet>
      )}
    </div>
  );
}

function VenueRow({ v, onOpen, onToggleFav }: { v: Venue; onOpen: () => void; onToggleFav: () => void }) {
  const tone = chipTone(v);
  return (
    <button onClick={onOpen} className="w-full text-left rounded-3xl border border-gray-100 bg-white hover:bg-gray-50 transition p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tone === "allow" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : tone === "deny" ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            {v.category === "Coffee" ? <IconCup /> : v.category === "Salon" ? <IconScissors /> : v.category === "Hotel" ? <IconHotel /> : <IconPin />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold truncate">{v.name}</div>
              {v.favorite ? <span className="text-amber-500" aria-label="Favorite"><IconStarFilled /></span> : null}
            </div>
            <div className="text-sm text-gray-500 mt-0.5">{v.category} · {v.address}</div>
            <div className="text-xs text-gray-500 mt-1">{formatMi(v.distanceMi)} · Last visit: {v.lastVisit}</div>
            <div className="text-xs text-gray-500 mt-1">{summaryLine(v)}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${tone === "allow" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : tone === "deny" ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            {v.rule === "Follow global" ? "Global" : v.rule === "Always allow" ? "Allow" : "Deny"}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFav();
            }}
            className="h-9 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <IconStar /> {v.favorite ? "Unsave" : "Save"}
          </button>
        </div>
      </div>
    </button>
  );
}

function VenueSheet({
  v,
  onClose,
  onUpdate,
  onToggleFav,
  toast,
}: {
  v: Venue;
  onClose: () => void;
  onUpdate: (patch: Partial<Venue>) => void;
  onToggleFav: () => void;
  toast: (t: string) => void;
}) {
  const [local, setLocal] = useState<Venue>(v);

  useEffect(() => {
    setLocal(v);
  }, [v.id]);

  const tone = chipTone(local);

  function save() {
    onUpdate(local);
    toast("Updated");
    onClose();
  }

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-lg">{local.name}</div>
            <div className="text-sm text-gray-600 mt-0.5">{local.category} · {local.address}</div>
            <div className="text-xs text-gray-500 mt-1">Last visit: {local.lastVisit} · {formatMi(local.distanceMi)}</div>
          </div>
          <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${tone === "allow" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : tone === "deny" ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            {local.rule}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onToggleFav}
            className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
          >
            <IconStar /> {local.favorite ? "Remove from favorites" : "Add to favorites"}
          </button>
          <button
            onClick={() => {
              setLocal((p) => ({ ...p, rule: p.rule === "Always deny" ? "Follow global" : "Always deny" }));
              toast("Updated");
            }}
            className="h-11 rounded-2xl bg-gray-900 text-white font-semibold"
          >
            {local.rule === "Always deny" ? "Undo deny" : "Deny reminders"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Reminder rule</div>
        <div className="text-sm text-gray-500 mt-0.5">How reminders behave for this venue</div>

        <div className="mt-3 space-y-2">
          <RadioRow
            title="Follow global"
            subtitle="Use your main settings (quiet hours, caps, triggers)"
            active={local.rule === "Follow global"}
            onClick={() => setLocal((p) => ({ ...p, rule: "Follow global" }))}
          />
          <RadioRow
            title="Always allow"
            subtitle="This venue can remind even if it’s noisy (still respects quiet hours unless overridden)"
            active={local.rule === "Always allow"}
            onClick={() => setLocal((p) => ({ ...p, rule: "Always allow" }))}
          />
          <RadioRow
            title="Always deny"
            subtitle="Never send reminders from this venue"
            active={local.rule === "Always deny"}
            onClick={() => setLocal((p) => ({ ...p, rule: "Always deny" }))}
          />
        </div>

        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Override caps</div>
              <div className="text-sm text-gray-600 mt-0.5">Set custom frequency for this venue</div>
            </div>
            <button
              onClick={() => setLocal((p) => ({ ...p, overrideCaps: !p.overrideCaps }))}
              className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${local.overrideCaps ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}
              aria-label="Toggle caps"
            >
              <div className={`w-5 h-5 rounded-full bg-white transition ${local.overrideCaps ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className={`mt-3 grid grid-cols-2 gap-2 ${!local.overrideCaps ? "opacity-50 pointer-events-none" : ""}`}>
            <SelectCard
              label="Daily max"
              value={`$${local.capDailyMax} / day (mock)`}
              right={<IconChevron />}
              onClick={() => setLocal((p) => ({ ...p, capDailyMax: (p.capDailyMax === 1 ? 2 : p.capDailyMax === 2 ? 3 : 1) }))}
            />
            <SelectCard
              label="Min gap"
              value={`${local.minGapMinutes} mins`}
              right={<IconChevron />}
              onClick={() => setLocal((p) => ({ ...p, minGapMinutes: (p.minGapMinutes === 30 ? 60 : p.minGapMinutes === 60 ? 90 : p.minGapMinutes === 90 ? 120 : 30) }))}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">Tap cards to cycle values (mock interaction).</div>
        </div>

        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="font-semibold">Quiet hours override</div>
          <div className="text-sm text-gray-600 mt-0.5">Optionally ignore quiet hours for this venue.</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["Use global", "No quiet hours", "Custom"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setLocal((p) => ({ ...p, quietOverride: k }))}
                className={`h-11 rounded-2xl border font-semibold transition ${local.quietOverride === k ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
              >
                {k === "Use global" ? "Global" : k === "No quiet hours" ? "Ignore" : "Custom"}
              </button>
            ))}
          </div>

          {local.quietOverride === "Custom" ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <TimeCard
                label="Start"
                value={local.quietStart ?? "22:00"}
                onChange={(v) => setLocal((p) => ({ ...p, quietStart: v }))}
              />
              <TimeCard
                label="End"
                value={local.quietEnd ?? "08:00"}
                onChange={(v) => setLocal((p) => ({ ...p, quietEnd: v }))}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-500">Note</div>
          <textarea
            value={local.notes ?? ""}
            onChange={(e) => setLocal((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Optional: why you chose this rule"
            className="mt-2 w-full min-h-[88px] rounded-3xl border border-gray-200 p-3 outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={save} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
          Save
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <IconInfoSmall />
        <span>Production: add “Allow for 30 days” + “Deny for 7 days” temporary rules.</span>
      </div>
    </div>
  );
}

function BulkSheet({
  action,
  target,
  setAction,
  setTarget,
  onApply,
  onClose,
}: {
  action: "Allow" | "Deny" | "Clear";
  target: Tab;
  setAction: (v: "Allow" | "Deny" | "Clear") => void;
  setTarget: (v: Tab) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Bulk apply</div>
        <div className="text-sm text-gray-600 mt-1">Apply one rule to many venues at once.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Target group</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["Favorites", "All", "Allowed", "Denied"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`h-11 rounded-2xl border font-semibold transition ${target === t ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 font-semibold">Action</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(["Allow", "Deny", "Clear"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAction(a)}
              className={`h-11 rounded-2xl border font-semibold transition ${action === a ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-amber-100 bg-amber-50 p-4">
          <div className="font-semibold">Preview</div>
          <div className="text-sm text-amber-800 mt-1">
            Apply <b>{action}</b> to <b>{target}</b>.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={onApply} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
          Apply
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <IconWarn />
        <span>Bulk actions are powerful. Production: require confirm step.</span>
      </div>
    </div>
  );
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">How per‑venue rules work</div>
        <div className="text-sm text-gray-600 mt-1">Venue rules override your global reminder rules (X5.6).</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-2">
        <HelpBullet title="Follow global" body="Use your main quiet hours, caps, and triggers." />
        <HelpBullet title="Always allow" body="Helpful for favorites. Still respects quiet hours unless you override." />
        <HelpBullet title="Always deny" body="Never remind from this venue." />
        <HelpBullet title="Favorites" body="Saved venues show up faster and can default to Allow." />
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <IconInfoSmall />
        <span>Production: add per‑venue “Pro allowlist” (specific service pros within a venue).</span>
      </div>
    </div>
  );
}

function HelpBullet({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{body}</div>
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500 inline-flex items-center gap-2">{icon}<span>{title}</span></div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 rounded-2xl border text-xs font-semibold transition ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
    >
      {label}
    </button>
  );
}

function SelectCard({ label, value, right, onClick }: { label: string; value: string; right: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full rounded-3xl border border-gray-100 bg-white p-4 hover:bg-gray-50 transition text-left">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="font-semibold truncate">{value}</div>
        <div className="text-gray-400">{right}</div>
      </div>
    </button>
  );
}

function TimeCard({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const options = useMemo(() => buildTimeOptions(), []);
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full h-11 rounded-2xl border border-gray-200 px-3 font-semibold"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {formatTimeLabel(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function RadioRow({ title, subtitle, active, onClick }: { title: string; subtitle: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-3xl border p-4 transition ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className={`text-sm mt-0.5 ${active ? "text-white/80" : "text-gray-600"}`}>{subtitle}</div>
        </div>
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${active ? "border-white/35" : "border-gray-300"}`}>
          <div className={`w-3.5 h-3.5 rounded-full ${active ? "bg-white" : "bg-transparent"}`} />
        </div>
      </div>
    </button>
  );
}

function buildTimeOptions() {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
    }
  }
  return out;
}

function isHHMM(v: string) {
  if (!/^\d{2}:\d{2}$/.test(v)) return false;
  const [h, m] = v.split(":").map((x) => Number(x));
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function formatTimeLabel(hhmm: string) {
  if (!isHHMM(hhmm)) return "—";
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  const d = new Date();
  d.setHours(h);
  d.setMinutes(m);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMi(n: number) {
  return `${n.toFixed(1)} mi`;
}

function chipTone(v: Venue): "allow" | "deny" | "global" {
  if (v.rule === "Always deny") return "deny";
  if (v.rule === "Always allow") return "allow";
  return "global";
}

function summaryLine(v: Venue) {
  const base = v.rule === "Follow global" ? "Follows global" : v.rule === "Always allow" ? "Always allow" : "Always deny";
  const fav = v.favorite ? " · Favorite" : "";
  const caps = v.overrideCaps ? ` · Cap ${v.capDailyMax}/day · Gap ${v.minGapMinutes}m` : "";
  const quiet = v.quietOverride === "Use global" ? "" : v.quietOverride === "No quiet hours" ? " · Ignores quiet" : ` · Quiet ${formatTimeLabel(v.quietStart ?? "22:00")}–${formatTimeLabel(v.quietEnd ?? "08:00")}`;
  return `${base}${fav}${caps}${quiet}`;
}

function Sheet({
  title,
  subtitle,
  mounted,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  mounted: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close overlay" />
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
          mounted ? "translate-y-0" : "translate-y-[820px]"
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
            <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* =========================
   Inline Icons
   ========================= */

function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconInfoSmall() {
  return (
    <span className="mt-0.5 text-gray-400">
      <IconInfo />
    </span>
  );
}

function IconWarn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M10.3 4.3 2.7 18.1A2 2 0 0 0 4.4 21h15.2a2 2 0 0 0 1.7-2.9L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBlock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M7 7l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l3 7 7 .5-5.3 4.4 1.8 7.1L12 17.8 5.5 21l1.8-7.1L2 9.5 9 9l3-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconStarFilled() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3 7 7 .5-5.3 4.4 1.8 7.1L12 17.8 5.5 21l1.8-7.1L2 9.5 9 9l3-7Z" />
    </svg>
  );
}

function IconCup() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 8h12v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Z" stroke="currentColor" strokeWidth="2" />
      <path d="M15 10h2a3 3 0 0 1 0 6h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 3h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconScissors() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 20l8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 14l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 10l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.5 6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="2" />
      <path d="M6.5 22.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconHotel() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" stroke="currentColor" strokeWidth="2" />
      <path d="M2 22h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 8h4M8 12h4M8 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* =========================
   Styles
   ========================= */

function StyleBlock() {
  return (
    <style>{`
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }
    `}</style>
  );
}
