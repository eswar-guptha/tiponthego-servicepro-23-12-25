import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Screen Code: X5.8
 * Screen Name: Notification Inbox
 * Currency: USD
 * Roles: Customer / Guest
 * Purpose:
 *  - Centralize all system messages: tip reminders, receipts, disputes, refunds, security
 *  - Reduce confusion by grouping, filtering, and providing clear CTAs per notification type
 *  - Support read/unread, bulk actions, and quick settings
 * Notes:
 *  - Canvas-safe: no framer-motion
 *  - Uses inline SVG icons to avoid CDN fetch issues
 */

type NType = "Receipt" | "Reminder" | "Support" | "Refund" | "Security" | "Promo";

type Priority = "High" | "Normal";

type NotificationItem = {
  id: string;
  type: NType;
  title: string;
  body: string;
  when: string;
  unread: boolean;
  priority: Priority;
  meta?: {
    amount?: number;
    receiptNo?: string;
    proName?: string;
    venue?: string;
    caseId?: string;
    refundRef?: string;
  };
  deepLink:
    | { kind: "receipt"; screen: "X3.2"; receiptNo: string }
    | { kind: "tip"; screen: "X1.2"; receiptNo: string }
    | { kind: "case"; screen: "X4.4" | "X4.5"; caseId: string }
    | { kind: "security"; screen: "X6.2" }
    | { kind: "settings"; screen: "X5.4" }
    | { kind: "none" };
};

type Tab = "All" | "Receipts" | "Reminders" | "Support" | "Security";

type Sheet = null | "detail" | "bulk" | "filters";

type FilterState = {
  unreadOnly: boolean;
  highOnly: boolean;
  types: Record<NType, boolean>;
};

const DEMO: NotificationItem[] = [
  {
    id: "n_01",
    type: "Reminder",
    title: "Tip reminder · Cafe Aura",
    body: "You left Cafe Aura 12 minutes ago. Want to tip Alex?",
    when: "12m",
    unread: true,
    priority: "High",
    meta: { venue: "Cafe Aura", proName: "Alex" },
    deepLink: { kind: "tip", screen: "X1.2", receiptNo: "RCPT-481220" },
  },
  {
    id: "n_02",
    type: "Receipt",
    title: "Receipt saved",
    body: "$3.95 tip · Alex (Cafe Aura) · Tap to view/share.",
    when: "2h",
    unread: true,
    priority: "Normal",
    meta: { amount: 3.95, receiptNo: "RCPT-481220", proName: "Alex", venue: "Cafe Aura" },
    deepLink: { kind: "receipt", screen: "X3.2", receiptNo: "RCPT-481220" },
  },
  {
    id: "n_03",
    type: "Refund",
    title: "Refund initiated",
    body: "We started your refund. Track status and expected posting time.",
    when: "1d",
    unread: false,
    priority: "Normal",
    meta: { refundRef: "RFND-7A2C-19F3", caseId: "CASE-10492" },
    deepLink: { kind: "case", screen: "X4.5", caseId: "CASE-10492" },
  },
  {
    id: "n_04",
    type: "Support",
    title: "Support replied",
    body: "Case CASE-10492: Please share your bank statement screenshot (last 4 digits only).",
    when: "3d",
    unread: true,
    priority: "High",
    meta: { caseId: "CASE-10492" },
    deepLink: { kind: "case", screen: "X4.4", caseId: "CASE-10492" },
  },
  {
    id: "n_05",
    type: "Security",
    title: "New device sign-in",
    body: "We detected a sign-in from Chrome on Windows · Hyderabad, IN.",
    when: "5d",
    unread: false,
    priority: "Normal",
    deepLink: { kind: "security", screen: "X6.2" },
  },
  {
    id: "n_06",
    type: "Promo",
    title: "Invite & earn",
    body: "Invite a friend and earn credits when they tip (limited time).",
    when: "1w",
    unread: false,
    priority: "Normal",
    deepLink: { kind: "none" },
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function runDevChecks() {
  try {
    console.assert(money(3.5) === "$3.50", "money");
    console.assert(pillFor("Receipt") === "Receipts", "pill");
    const s: FilterState = {
      unreadOnly: true,
      highOnly: false,
      types: { Receipt: true, Reminder: true, Support: true, Refund: true, Security: true, Promo: false },
    };
    console.assert(applyFilters(DEMO, "All", "", s).length > 0, "filtered not empty");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function NotificationInboxX58() {
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("All");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<NotificationItem[]>(DEMO);

  const [sheet, setSheet] = useState<Sheet>(null);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(() => ({
    unreadOnly: false,
    highOnly: false,
    types: { Receipt: true, Reminder: true, Support: true, Refund: true, Security: true, Promo: true },
  }));

  const [multi, setMulti] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement | null>(null);

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

  const active = useMemo(() => items.find((x) => x.id === activeId) ?? null, [items, activeId]);

  const unreadCount = useMemo(() => items.filter((i) => i.unread).length, [items]);
  const highCount = useMemo(() => items.filter((i) => i.priority === "High").length, [items]);

  const visible = useMemo(() => applyFilters(items, tab, q, filters), [items, tab, q, filters]);

  const tabs = useMemo(
    () =>
      [
        { k: "All" as const, label: "All", count: items.length },
        { k: "Receipts" as const, label: "Receipts", count: items.filter((i) => i.type === "Receipt").length },
        { k: "Reminders" as const, label: "Reminders", count: items.filter((i) => i.type === "Reminder").length },
        { k: "Support" as const, label: "Support", count: items.filter((i) => i.type === "Support" || i.type === "Refund").length },
        { k: "Security" as const, label: "Security", count: items.filter((i) => i.type === "Security").length },
      ] as const,
    [items]
  );

  function openDetail(id: string) {
    setActiveId(id);
    setSheet("detail");
    // Mark read on open
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, unread: false } : x)));
  }

  function closeSheet() {
    setMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function markAllRead() {
    setItems((prev) => prev.map((x) => ({ ...x, unread: false })));
    setToast("Marked all as read");
  }

  function toggleMulti() {
    setMulti((m) => {
      const next = !m;
      if (!next) setSelected({});
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((p) => ({ ...p, [id]: !p[id] }));
  }

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  function bulkArchive() {
    if (selectedIds.length === 0) return setToast("Select messages first");
    setItems((prev) => prev.filter((x) => !selectedIds.includes(x.id)));
    setSelected({});
    setToast("Archived (mock)");
    setMulti(false);
  }

  function bulkRead() {
    if (selectedIds.length === 0) return setToast("Select messages first");
    setItems((prev) => prev.map((x) => (selectedIds.includes(x.id) ? { ...x, unread: false } : x)));
    setToast("Marked read");
  }

  function quickArchive(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
    setToast("Archived (mock)");
  }

  function quickToggleUnread(id: string) {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, unread: !x.unread } : x)));
    setToast("Updated");
  }

  function jumpTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" as any });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X5.7")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <IconBack />
          </button>
          <div className="text-white font-semibold">X5.8 · Inbox</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSheet("filters")}
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
              aria-label="Filters"
            >
              <IconFilter />
            </button>
            <button
              onClick={() => {
                alert("Notification categories (mock) → X5.4");
                setToast("Open categories (mock)");
              }}
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
              aria-label="Settings"
            >
              <IconGear />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3">
        {/* Header card */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4">
          <div className="text-white">
            <div className="text-xs text-white/80 inline-flex items-center gap-2">
              <IconBell />
              <span>All notifications · USD</span>
            </div>

            <div className="mt-1 flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold">Inbox</div>
                <div className="text-xs text-white/80 mt-1">
                  {unreadCount} unread · {highCount} high-priority
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllRead}
                  className="h-10 px-3 rounded-2xl bg-white text-blue-700 font-semibold hover:bg-gray-50"
                >
                  Read all
                </button>
                <button
                  onClick={toggleMulti}
                  className={`h-10 px-3 rounded-2xl border font-semibold ${multi ? "bg-gray-900 text-white border-gray-900" : "bg-white/10 text-white border-white/20 hover:bg-white/15"}`}
                >
                  {multi ? "Done" : "Select"}
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-3xl bg-white/10 border border-white/15 p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/15 flex items-center justify-center">
                <IconSearch />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/75">Search</div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="receipt, alex, case…"
                  className="mt-1 w-full h-10 rounded-2xl bg-white text-gray-900 px-3 font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <button
                onClick={() => {
                  setQ("");
                  setToast("Cleared");
                }}
                className="h-10 px-3 rounded-2xl bg-white text-blue-700 font-semibold"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Pill tone="white" label={filters.unreadOnly ? "Unread only" : "All"} onClick={() => setFilters((p) => ({ ...p, unreadOnly: !p.unreadOnly }))} />
              <Pill tone={filters.highOnly ? "amber" : "white"} label={filters.highOnly ? "High only" : "Any priority"} onClick={() => setFilters((p) => ({ ...p, highOnly: !p.highOnly }))} />
              <Pill tone="white" label="Manage categories" onClick={() => alert("Go to X5.4 (mock)")} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-2 grid grid-cols-5 gap-2">
            {tabs.map((t) => (
              <TabBtn
                key={t.k}
                label={t.label}
                count={t.count}
                active={tab === t.k}
                onClick={() => {
                  setTab(t.k);
                  jumpTop();
                }}
              />
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <div className="font-semibold">Messages</div>
              <div className="text-sm text-gray-500 mt-0.5">
                {visible.length} shown{filters.unreadOnly ? " · Unread" : ""}{filters.highOnly ? " · High" : ""}
              </div>
            </div>
            <button
              onClick={() => {
                setToast("Synced (mock)");
              }}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Sync
            </button>
          </div>

          <div ref={scrollRef} className="max-h-[60vh] overflow-auto p-2 space-y-2">
            {visible.length === 0 ? (
              <EmptyState onReset={() => setFilters((p) => ({ ...p, unreadOnly: false, highOnly: false, types: { ...p.types, Promo: true } }))} />
            ) : (
              visible.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  multi={multi}
                  selected={!!selected[n.id]}
                  onSelect={() => toggleSelect(n.id)}
                  onOpen={() => openDetail(n.id)}
                  onArchive={() => quickArchive(n.id)}
                  onToggleUnread={() => quickToggleUnread(n.id)}
                />
              ))
            )}
          </div>

          {multi ? (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className="text-sm text-gray-600">Selected: {selectedIds.length}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={bulkRead}
                  className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  Mark read
                </button>
                <button
                  onClick={bulkArchive}
                  className="h-10 px-3 rounded-2xl bg-gray-900 text-white font-semibold"
                >
                  Archive
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X5.8</div>
      </div>

      {/* Floating compose/support */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => alert("Open support chat (mock) → X4.4")}
          className="w-14 h-14 rounded-2xl bg-gray-900 text-white shadow-xl flex items-center justify-center hover:opacity-95"
          aria-label="Support"
        >
          <IconChat />
        </button>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Control your inbox</div>
              <div className="text-xs text-white/75">Turn off noisy topics from categories.</div>
            </div>
            <button
              onClick={() => alert("Open categories manager (mock) → X5.4")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Categories
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
          <span className={toast?.includes("Updated") || toast?.includes("Marked") ? "okTick" : ""}>
            <IconCheck />
          </span>
          {toast ?? ""}
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet
          title={sheet === "detail" ? "Notification" : sheet === "filters" ? "Filters" : "Bulk"}
          subtitle={sheet === "detail" ? "X5.8" : sheet === "filters" ? "Refine inbox" : "Actions"}
          mounted={mounted}
          onClose={closeSheet}
        >
          {sheet === "detail" ? (
            active ? (
              <DetailSheet
                n={active}
                onClose={closeSheet}
                onArchive={() => {
                  quickArchive(active.id);
                  closeSheet();
                }}
                onToggleUnread={() => quickToggleUnread(active.id)}
                onNavigate={(msg) => setToast(msg)}
              />
            ) : (
              <div className="text-sm text-gray-500">No notification selected.</div>
            )
          ) : sheet === "filters" ? (
            <FilterSheet
              filters={filters}
              setFilters={setFilters}
              onClose={closeSheet}
              onToast={setToast}
            />
          ) : (
            <BulkSheet onClose={closeSheet} onMarkAllRead={markAllRead} onArchiveAll={() => {
              setItems([]);
              setToast("Archived all (mock)");
              closeSheet();
            }} />
          )}
        </Sheet>
      )}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="p-6 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
        <IconBell />
      </div>
      <div className="mt-3 font-semibold">No notifications</div>
      <div className="mt-1 text-sm text-gray-500">Try clearing search or relaxing filters.</div>
      <button
        onClick={onReset}
        className="mt-4 h-11 px-4 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
      >
        Reset filters
      </button>
    </div>
  );
}

function NotificationRow({
  n,
  multi,
  selected,
  onSelect,
  onOpen,
  onArchive,
  onToggleUnread,
}: {
  n: NotificationItem;
  multi: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onArchive: () => void;
  onToggleUnread: () => void;
}) {
  const tone = toneFor(n.type, n.priority);
  return (
    <div className={`rounded-3xl border p-4 ${n.unread ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-white"}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tone.iconCls}`}>{iconFor(n.type)}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="font-semibold truncate">{n.title}</div>
                {n.priority === "High" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 font-semibold">High</span>
                ) : null}
                {n.unread ? <span className="w-2 h-2 rounded-full bg-blue-600" aria-label="Unread" /> : null}
              </div>
              <div className="text-sm text-gray-600 mt-0.5 line-clamp-2">{n.body}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${tone.pillCls}`}>{pillFor(n.type)}</span>
                <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 font-semibold">{n.when}</span>
                {n.meta?.amount != null ? (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 font-semibold">
                    {money(n.meta.amount)}
                  </span>
                ) : null}
                {n.meta?.caseId ? (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 font-semibold">
                    {n.meta.caseId}
                  </span>
                ) : null}
              </div>
            </div>

            {multi ? (
              <button
                onClick={onSelect}
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${selected ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                aria-label="Select"
              >
                {selected ? <IconCheck /> : <IconCircle />}
              </button>
            ) : (
              <button onClick={onOpen} className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50" aria-label="Open">
                <IconChevron />
              </button>
            )}
          </div>

          {!multi ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button onClick={onOpen} className="h-10 rounded-2xl bg-gray-900 text-white font-semibold">Open</button>
              <button onClick={onToggleUnread} className="h-10 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
                {n.unread ? "Mark read" : "Unread"}
              </button>
              <button onClick={onArchive} className="h-10 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
                Archive
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailSheet({
  n,
  onClose,
  onArchive,
  onToggleUnread,
  onNavigate,
}: {
  n: NotificationItem;
  onClose: () => void;
  onArchive: () => void;
  onToggleUnread: () => void;
  onNavigate: (msg: string) => void;
}) {
  const tone = toneFor(n.type, n.priority);

  function go() {
    const d = n.deepLink;
    if (d.kind === "receipt") return onNavigate(`Open ${d.screen} · ${d.receiptNo} (mock)`);
    if (d.kind === "tip") return onNavigate(`Open ${d.screen} · ${d.receiptNo} (mock)`);
    if (d.kind === "case") return onNavigate(`Open ${d.screen} · ${d.caseId} (mock)`);
    if (d.kind === "security") return onNavigate(`Open ${d.screen} (mock)`);
    if (d.kind === "settings") return onNavigate(`Open ${d.screen} (mock)`);
    return onNavigate("No destination");
  }

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tone.iconCls}`}>{iconFor(n.type)}</div>
          <div className="min-w-0">
            <div className="font-semibold text-lg">{n.title}</div>
            <div className="text-sm text-gray-600 mt-0.5">{n.when} · {pillFor(n.type)}</div>
            <div className="mt-2 text-sm text-gray-700">{n.body}</div>
          </div>
        </div>

        {n.meta ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {n.meta.amount != null ? <MetaCard label="Amount" value={money(n.meta.amount)} /> : null}
            {n.meta.receiptNo ? <MetaCard label="Receipt" value={n.meta.receiptNo} /> : null}
            {n.meta.proName ? <MetaCard label="Pro" value={n.meta.proName} /> : null}
            {n.meta.venue ? <MetaCard label="Venue" value={n.meta.venue} /> : null}
            {n.meta.caseId ? <MetaCard label="Case" value={n.meta.caseId} /> : null}
            {n.meta.refundRef ? <MetaCard label="Refund Ref" value={n.meta.refundRef} /> : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Actions</div>
        <div className="text-sm text-gray-500 mt-0.5">Contextual actions based on notification type.</div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={go} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
            Open
          </button>
          <button onClick={onToggleUnread} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            {n.unread ? "Mark read" : "Mark unread"}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(n.title + " — " + n.body);
              onNavigate("Copied message (mock)");
            }}
            className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
          >
            Copy
          </button>
          <button onClick={onArchive} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            Archive
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
          <IconInfoSmall />
          <span>Production: add swipe gestures and notification grouping by day.</span>
        </div>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 font-semibold truncate">{value}</div>
    </div>
  );
}

function FilterSheet({
  filters,
  setFilters,
  onClose,
  onToast,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClose: () => void;
  onToast: (t: string) => void;
}) {
  const types = (Object.keys(filters.types) as NType[]).sort((a, b) => a.localeCompare(b));

  function reset() {
    setFilters({
      unreadOnly: false,
      highOnly: false,
      types: { Receipt: true, Reminder: true, Support: true, Refund: true, Security: true, Promo: true },
    });
    onToast("Filters reset");
  }

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Inbox filters</div>
        <div className="text-sm text-gray-600 mt-1">Choose what shows in your inbox.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-3">
        <ToggleRow
          title="Unread only"
          subtitle="Show only unread messages"
          on={filters.unreadOnly}
          onToggle={() => setFilters((p) => ({ ...p, unreadOnly: !p.unreadOnly }))}
        />
        <ToggleRow
          title="High priority only"
          subtitle="Only show urgent notifications"
          on={filters.highOnly}
          onToggle={() => setFilters((p) => ({ ...p, highOnly: !p.highOnly }))}
        />

        <div className="pt-2">
          <div className="font-semibold">Types</div>
          <div className="text-sm text-gray-500 mt-0.5">Toggle topics on/off.</div>
          <div className="mt-3 space-y-2">
            {types.map((t) => (
              <ToggleRow
                key={t}
                title={pillFor(t)}
                subtitle={typeHint(t)}
                on={filters.types[t]}
                onToggle={() =>
                  setFilters((p) => ({
                    ...p,
                    types: { ...p.types, [t]: !p.types[t] },
                  }))
                }
                left={iconFor(t)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={reset} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Reset
        </button>
        <button
          onClick={() => {
            onToast("Applied");
            onClose();
          }}
          className="h-12 rounded-2xl bg-gray-900 text-white font-semibold"
        >
          Apply
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <IconInfoSmall />
        <span>Production: allow per-category frequency (Daily/Weekly/Off).</span>
      </div>
    </div>
  );
}

function BulkSheet({
  onClose,
  onMarkAllRead,
  onArchiveAll,
}: {
  onClose: () => void;
  onMarkAllRead: () => void;
  onArchiveAll: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Bulk actions</div>
        <div className="text-sm text-gray-600 mt-1">Fast cleanup of inbox.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-2">
        <button
          onClick={() => {
            onMarkAllRead();
            onClose();
          }}
          className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
        >
          <IconCheck /> Mark all read
        </button>
        <button
          onClick={() => {
            onArchiveAll();
          }}
          className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold inline-flex items-center justify-center gap-2"
        >
          <IconArchive /> Archive all (mock)
        </button>
        <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <IconWarn />
        <span>Production: ask for confirmation before “Archive all”.</span>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  subtitle,
  on,
  onToggle,
  left,
}: {
  title: string;
  subtitle: string;
  on: boolean;
  onToggle: () => void;
  left?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 p-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {left ? (
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${on ? "bg-gray-900 border-gray-900 text-white" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            {left}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="text-sm text-gray-600 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${on ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}
        aria-label={`Toggle ${title}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition ${on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function TabBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 rounded-2xl border text-xs font-semibold transition ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
    >
      <span className="inline-flex items-center gap-2">
        {label}
        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${active ? "border-white/20 bg-white/10 text-white" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
          {count}
        </span>
      </span>
    </button>
  );
}

function Pill({ tone, label, onClick }: { tone: "white" | "amber"; label: string; onClick: () => void }) {
  const cls =
    tone === "amber"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-white/10 border-white/20 text-white";
  return (
    <button onClick={onClick} className={`text-xs px-3 py-1.5 rounded-full border font-semibold hover:opacity-95 ${cls}`}>
      {label}
    </button>
  );
}

function applyFilters(items: NotificationItem[], tab: Tab, q: string, f: FilterState) {
  const s = q.trim().toLowerCase();
  let list = items;
  // tab narrowing
  if (tab === "Receipts") list = list.filter((x) => x.type === "Receipt");
  if (tab === "Reminders") list = list.filter((x) => x.type === "Reminder");
  if (tab === "Support") list = list.filter((x) => x.type === "Support" || x.type === "Refund");
  if (tab === "Security") list = list.filter((x) => x.type === "Security");

  // filters
  list = list.filter((x) => f.types[x.type]);
  if (f.unreadOnly) list = list.filter((x) => x.unread);
  if (f.highOnly) list = list.filter((x) => x.priority === "High");

  // search
  if (s) {
    list = list.filter((x) => {
      const m = x.meta;
      const bag = [
        x.title,
        x.body,
        x.type,
        x.when,
        m?.receiptNo,
        m?.proName,
        m?.venue,
        m?.caseId,
        m?.refundRef,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return bag.includes(s);
    });
  }

  // sort: unread first, then high, then most recent-ish by when token
  const weightWhen = (w: string) => {
    if (w.endsWith("m")) return 0;
    if (w.endsWith("h")) return 1;
    if (w.endsWith("d")) return 2;
    return 3;
  };
  return [...list].sort((a, b) => {
    const au = a.unread ? 0 : 1;
    const bu = b.unread ? 0 : 1;
    if (au !== bu) return au - bu;
    const ap = a.priority === "High" ? 0 : 1;
    const bp = b.priority === "High" ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return weightWhen(a.when) - weightWhen(b.when);
  });
}

function pillFor(t: NType) {
  if (t === "Receipt") return "Receipts";
  if (t === "Reminder") return "Reminders";
  if (t === "Support") return "Support";
  if (t === "Refund") return "Refunds";
  if (t === "Security") return "Security";
  return "Promos";
}

function typeHint(t: NType) {
  if (t === "Receipt") return "Saved receipts, share links";
  if (t === "Reminder") return "Missed tip & follow-up reminders";
  if (t === "Support") return "Case updates, replies";
  if (t === "Refund") return "Refund initiation and settlement status";
  if (t === "Security") return "New device, login, risk alerts";
  return "Optional marketing and offers";
}

function toneFor(type: NType, pri: Priority) {
  const high = pri === "High";
  if (type === "Security") return { iconCls: high ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-gray-50 border-gray-200 text-gray-700", pillCls: high ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-gray-50 border-gray-200 text-gray-700" };
  if (type === "Refund" || type === "Support") return { iconCls: "bg-amber-50 border-amber-100 text-amber-700", pillCls: "bg-amber-50 border-amber-100 text-amber-800" };
  if (type === "Receipt") return { iconCls: "bg-emerald-50 border-emerald-100 text-emerald-700", pillCls: "bg-emerald-50 border-emerald-100 text-emerald-800" };
  if (type === "Reminder") return { iconCls: high ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-sky-50 border-sky-100 text-sky-700", pillCls: high ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-sky-50 border-sky-100 text-sky-800" };
  return { iconCls: "bg-purple-50 border-purple-100 text-purple-700", pillCls: "bg-purple-50 border-purple-100 text-purple-800" };
}

function iconFor(t: NType) {
  if (t === "Receipt") return <IconReceipt />;
  if (t === "Reminder") return <IconClock />;
  if (t === "Support") return <IconChat />;
  if (t === "Refund") return <IconRefund />;
  if (t === "Security") return <IconShield />;
  return <IconSpark />;
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

function IconCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
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

function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.5-2-3.5-2.4.6a8 8 0 0 0-1.7-1L15 3h-6l-.4 2.6a8 8 0 0 0-1.7 1L4.5 6.1l-2 3.5 2 1.5a7.9 7.9 0 0 0 .1 2l-2 1.5 2 3.5 2.4-.6a8 8 0 0 0 1.7 1L9 21h6l.4-2.6a8 8 0 0 0 1.7-1l2.4.6 2-3.5-2-1.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconInfoSmall() {
  return (
    <span className="mt-0.5 text-gray-400">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
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

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 9h10M7 13h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconArchive() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h18v14H3V7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M3 7l2-4h14l2 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7h6M9 11h6M9 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconRefund() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 3v7h-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 20 6v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l1.2 6.2L20 10l-6.8 1.8L12 18l-1.2-6.2L4 10l6.8-1.8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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
      .line-clamp-2{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      /* light scrollbar */
      ::-webkit-scrollbar{ width:10px; height:10px; }
      ::-webkit-scrollbar-thumb{ background: rgba(0,0,0,.12); border-radius: 999px; border: 3px solid rgba(255,255,255,.9); }
    `}</style>
  );
}
