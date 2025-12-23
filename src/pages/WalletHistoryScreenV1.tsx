import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Info,
  Receipt,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";

/**
 * Screen Code: X3.1
 * Screen Name: Wallet / Tip History
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - Post tip: X2.6 Success (primary)
 *  - From bottom nav: Wallet
 * Purpose:
 *  - Trust: transparent history + receipts
 *  - Retention: monthly insights + repeat tipping
 *  - Utilities: export, share receipt link, disputes entry (next: X4.2)
 *
 * Canvas Compatibility:
 * - No framer-motion (avoids sandbox Illegal constructor)
 * - Bottom sheets + CSS transitions only
 * - Right-side scroll indicator (consistent with earlier screens)
 */

type TxStatus = "Success" | "Pending" | "Failed";

type Tx = {
  id: string;
  receiptNo: string;
  proName: string;
  proRole: string;
  proImage: string;
  createdAt: string;
  amount: number; // total charged
  tip: number;
  fees: number;
  status: TxStatus;
  channel: "Nearby" | "QR" | "Favorite" | "Search";
  location: string;
};

const DEMO_TX: Tx[] = [
  {
    id: "t1",
    receiptNo: "RCPT-482193",
    proName: "Alex Johnson",
    proRole: "Street Performer",
    proImage: "https://i.pravatar.cc/240?img=12",
    createdAt: "Today · 7:42 PM",
    amount: 11.3,
    tip: 10,
    fees: 1.3,
    status: "Success",
    channel: "Nearby",
    location: "Downtown Plaza · Fountain",
  },
  {
    id: "t2",
    receiptNo: "RCPT-482011",
    proName: "Maya Chen",
    proRole: "Coffee Barista",
    proImage: "https://i.pravatar.cc/240?img=32",
    createdAt: "Yesterday · 9:18 AM",
    amount: 5.25,
    tip: 4.25,
    fees: 1.0,
    status: "Success",
    channel: "QR",
    location: "Cafe Corner · Counter 2",
  },
  {
    id: "t3",
    receiptNo: "RCPT-481700",
    proName: "Sara Williams",
    proRole: "Fitness Coach",
    proImage: "https://i.pravatar.cc/240?img=47",
    createdAt: "Dec 12 · 6:05 PM",
    amount: 21.55,
    tip: 20,
    fees: 1.55,
    status: "Success",
    channel: "Favorite",
    location: "City Gym · Studio A",
  },
  {
    id: "t4",
    receiptNo: "RCPT-481220",
    proName: "Diego Rivera",
    proRole: "Delivery Partner",
    proImage: "https://i.pravatar.cc/240?img=54",
    createdAt: "Dec 02 · 1:22 PM",
    amount: 3.95,
    tip: 3.5,
    fees: 0.45,
    status: "Pending",
    channel: "QR",
    location: "Market Street · Zone 4",
  },
  {
    id: "t5",
    receiptNo: "RCPT-480980",
    proName: "Alex Johnson",
    proRole: "Street Performer",
    proImage: "https://i.pravatar.cc/240?img=12",
    createdAt: "Nov 26 · 8:12 PM",
    amount: 7.1,
    tip: 6.5,
    fees: 0.6,
    status: "Failed",
    channel: "Search",
    location: "Downtown Plaza",
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money formats");
    console.assert(clamp01(-1) === 0, "clamp01 low");
    console.assert(clamp01(2) === 1, "clamp01 high");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function WalletHistoryScreenV1() {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<
    "This month" | "Last 3 months" | "This year"
  >("This month");
  const [statusFilter, setStatusFilter] = useState<"All" | TxStatus>("All");
  const [sheet, setSheet] = useState<null | "filters" | "receipt" | "export">(
    null
  );
  const [sheetMounted, setSheetMounted] = useState(false);
  const [selected, setSelected] = useState<Tx | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({ size: 0.32, top: 0 }));

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

  useEffect(() => {
    const el = pageRef.current;
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return DEMO_TX.filter((t) => {
      const matchesQ =
        !q ||
        t.proName.toLowerCase().includes(q) ||
        t.proRole.toLowerCase().includes(q) ||
        t.receiptNo.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All" ? true : t.status === statusFilter;
      // Range is mocked; still used for UI
      return matchesQ && matchesStatus;
    });
  }, [query, statusFilter, range]);

  const stats = useMemo(() => {
    const success = filtered.filter((t) => t.status === "Success");
    const total = success.reduce((s, t) => s + t.amount, 0);
    const tips = success.reduce((s, t) => s + t.tip, 0);
    const fees = success.reduce((s, t) => s + t.fees, 0);
    const count = success.length;
    const avg = count ? total / count : 0;
    return { total, tips, fees, count, avg };
  }, [filtered]);

  function openSheet(kind: "filters" | "export") {
    setSheet(kind);
  }

  function closeSheet() {
    setSheetMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function openReceipt(tx: Tx) {
    setSelected(tx);
    setSheet("receipt");
  }

  function statusPill(status: TxStatus) {
    if (status === "Success")
      return "bg-emerald-50 border-emerald-100 text-emerald-800";
    if (status === "Pending")
      return "bg-amber-50 border-amber-100 text-amber-800";
    return "bg-rose-50 border-rose-100 text-rose-800";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → Discover")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X3.1 · Wallet</div>
          <button
            onClick={() => openSheet("export")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-3">
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-white">
              <div className="text-xs text-white/80 inline-flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span>Balance (mock)</span>
              </div>
              <div className="text-3xl font-semibold mt-1">
                {money(Math.max(0, 120 - stats.total))}
              </div>
              <div className="text-xs text-white/80 mt-1">
                USD · Available to spend
              </div>
            </div>

            <button
              onClick={() => openSheet("filters")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold inline-flex items-center gap-2"
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search receipts, pros, places…"
              className="w-full pl-9 pr-3 py-3 rounded-2xl bg-white/15 text-white placeholder:text-white/70 border border-white/20 outline-none focus:border-white/30"
            />
          </div>

          {/* Insights */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <InsightCard
              title="Spent"
              value={money(stats.total)}
              subtitle={`${stats.count} tips · avg ${money(stats.avg)}`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <InsightCard
              title="Impact"
              value={money(stats.tips)}
              subtitle={`${money(stats.fees)} fees`}
              icon={<Sparkles className="w-5 h-5" />}
            />
          </div>

          <div className="mt-3 text-xs text-white/75 inline-flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5" />
            <span>
              Tap a transaction to open its receipt (X1.2). Pending/failed can
              be retried.
            </span>
          </div>
        </div>

        {/* Range + status quick filters */}
        <div className="mt-3 flex gap-2 flex-wrap">
          <Pill
            active={range === "This month"}
            label="This month"
            onClick={() => setRange("This month")}
          />
          <Pill
            active={range === "Last 3 months"}
            label="Last 3 months"
            onClick={() => setRange("Last 3 months")}
          />
          <Pill
            active={range === "This year"}
            label="This year"
            onClick={() => setRange("This year")}
          />

          <div className="w-full h-0" />

          <Pill
            active={statusFilter === "All"}
            label="All"
            onClick={() => setStatusFilter("All")}
          />
          <Pill
            active={statusFilter === "Success"}
            label="Success"
            onClick={() => setStatusFilter("Success")}
          />
          <Pill
            active={statusFilter === "Pending"}
            label="Pending"
            onClick={() => setStatusFilter("Pending")}
          />
          <Pill
            active={statusFilter === "Failed"}
            label="Failed"
            onClick={() => setStatusFilter("Failed")}
          />
        </div>
      </div>

      {/* List */}
      <div className="relative">
        <div
          ref={pageRef}
          className="max-w-md mx-auto px-4 pb-28 h-[calc(100vh-372px)] overflow-y-auto pr-5"
        >
          {filtered.length === 0 ? (
            <EmptyState
              onClear={() => {
                setQuery("");
                setStatusFilter("All");
                setRange("This month");
                setToast("Cleared");
              }}
              onDiscover={() => alert("Go to Discover (mock)")}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openReceipt(t)}
                  className="w-full text-left bg-white rounded-3xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={t.proImage}
                        alt={t.proName}
                        className="w-12 h-12 rounded-2xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-lg truncate">
                              {t.proName}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {t.proRole} · {t.createdAt}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${statusPill(
                              t.status
                            )}`}
                          >
                            {t.status}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100">
                            {t.channel}
                          </span>
                          <span className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100 truncate max-w-[220px]">
                            {t.location}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            Receipt #{t.receiptNo}
                          </div>
                          <div className="text-lg font-semibold">
                            {money(t.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <div className="h-6" />
            </div>
          )}
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

      {/* Bottom Nav mock */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-2 flex items-center justify-between">
            <button
              className="flex-1 py-3 rounded-2xl text-white font-semibold hover:bg-white/10"
              onClick={() => alert("Discover (mock)")}
            >
              Discover
            </button>
            <button
              className="flex-1 py-3 rounded-2xl text-white font-semibold hover:bg-white/10"
              onClick={() => alert("Saved (mock) → X2.7")}
            >
              Saved
            </button>
            <button className="flex-1 py-3 rounded-2xl bg-white text-blue-700 font-semibold">
              Wallet
            </button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={closeSheet}
            aria-label="Close overlay"
          />
          <div
            className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
              sheetMounted ? "translate-y-0" : "translate-y-[520px]"
            }`}
            role="dialog"
            aria-label="Sheet"
          >
            <div className="pt-3 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-gray-200" />
            </div>

            <div className="px-4 pt-3 pb-4 border-b flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-lg">
                  {sheet === "filters"
                    ? "Filters"
                    : sheet === "export"
                    ? "Export"
                    : "Receipt"}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">X3.1 (mock)</div>
              </div>
              <button
                onClick={closeSheet}
                className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              {sheet === "filters" && (
                <FiltersPanel
                  range={range}
                  status={statusFilter}
                  onSetRange={setRange}
                  onSetStatus={setStatusFilter}
                  onApply={() => {
                    closeSheet();
                    setToast("Applied");
                  }}
                  onClear={() => {
                    setRange("This month");
                    setStatusFilter("All");
                    setToast("Cleared");
                  }}
                />
              )}

              {sheet === "export" && (
                <ExportPanel
                  onExport={(type) => {
                    setToast(`${type} export (mock)`);
                    closeSheet();
                  }}
                />
              )}

              {sheet === "receipt" && selected && (
                <ReceiptPanel
                  tx={selected}
                  onOpenFull={() => alert("Next: X1.2 – Tip Receipt (mock)")}
                  onShare={() => {
                    setToast("Shared link (mock)");
                    closeSheet();
                  }}
                  onRetry={() => {
                    setToast("Retrying (mock)");
                    closeSheet();
                  }}
                />
              )}
            </div>
          </div>
        </div>
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

function InsightCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-gray-500">{title}</div>
          <div className="text-xl font-semibold mt-1">{value}</div>
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Pill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-3 rounded-2xl border font-semibold transition ${
        active
          ? "bg-white text-blue-700 border-white"
          : "bg-white/10 text-white border-white/15 hover:bg-white/15"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({
  onClear,
  onDiscover,
}: {
  onClear: () => void;
  onDiscover: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Receipt className="w-6 h-6 text-blue-700" />
      </div>
      <div className="mt-3 text-lg font-semibold">No transactions found</div>
      <div className="mt-1 text-sm text-gray-500">
        Try clearing filters or tip a pro to see your history here.
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={onDiscover}
          className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
        >
          Go to Discover
        </button>
        <button
          onClick={onClear}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Clear filters
        </button>
      </div>
      <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>
          Receipts are protected and can be shared as read-only links.
        </span>
      </div>
    </div>
  );
}

function FiltersPanel({
  range,
  status,
  onSetRange,
  onSetStatus,
  onApply,
  onClear,
}: {
  range: string;
  status: string;
  onSetRange: (v: any) => void;
  onSetStatus: (v: any) => void;
  onApply: () => void;
  onClear: () => void;
}) {
  const ranges: Array<"This month" | "Last 3 months" | "This year"> = [
    "This month",
    "Last 3 months",
    "This year",
  ];
  const statuses: Array<"All" | TxStatus> = [
    "All",
    "Success",
    "Pending",
    "Failed",
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="font-semibold">Date range</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => onSetRange(r)}
              className={`h-11 rounded-2xl border font-semibold transition ${
                range === r
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-semibold">Status</div>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => onSetStatus(s)}
              className={`h-11 rounded-2xl border font-semibold transition ${
                status === s
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onClear}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Clear
        </button>
        <button
          onClick={onApply}
          className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
        >
          Apply
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Calendar className="w-4 h-4 mt-0.5" />
        <span>Filters apply only to your transaction history.</span>
      </div>
    </div>
  );
}

function ExportPanel({ onExport }: { onExport: (type: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Export your history</div>
        <div className="text-sm text-gray-500 mt-1">
          Useful for reimbursements and records.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onExport("CSV")}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          CSV
        </button>
        <button
          onClick={() => onExport("PDF")}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          PDF
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onExport("Email")}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Email
        </button>
        <button
          onClick={() => onExport("Share")}
          className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>
          Export excludes card details and uses receipt references only.
        </span>
      </div>
    </div>
  );
}

function ReceiptPanel({
  tx,
  onOpenFull,
  onShare,
  onRetry,
}: {
  tx: Tx;
  onOpenFull: () => void;
  onShare: () => void;
  onRetry: () => void;
}) {
  const isProblem = tx.status !== "Success";
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <img
            src={tx.proImage}
            alt={tx.proName}
            className="w-12 h-12 rounded-2xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-lg truncate">{tx.proName}</div>
            <div className="text-sm text-gray-500 truncate">
              {tx.proRole} · {tx.createdAt}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Receipt #{tx.receiptNo}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-xl font-semibold">{money(tx.amount)}</div>
            <div className="text-xs text-gray-500">USD</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-2xl bg-white border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Tip</div>
            <div className="font-semibold">{money(tx.tip)}</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Fees</div>
            <div className="font-semibold">{money(tx.fees)}</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Channel</div>
            <div className="font-semibold">{tx.channel}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onOpenFull}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
        >
          <Receipt className="w-4 h-4" /> Open receipt
        </button>
        <button
          onClick={onShare}
          className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {isProblem && (
        <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
          <div className="font-semibold">Action needed</div>
          <div className="text-sm text-amber-900/80 mt-1">
            {tx.status === "Pending"
              ? "This tip is still processing. You can retry if it’s taking too long."
              : "This tip failed. Retry to complete the payment."}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={onRetry}
              className="h-12 rounded-2xl bg-white border border-amber-200 font-semibold hover:bg-white/80"
            >
              Retry
            </button>
            <button
              onClick={() => alert("Next: X4.2 – Report/Dispute (mock)")}
              className="h-12 rounded-2xl bg-white border border-amber-200 font-semibold hover:bg-white/80"
            >
              Report
            </button>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>
          Shared receipts are read-only and never show payment method details.
        </span>
      </div>
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      /* No custom scrollbar. Right-side indicator provides consistent scroll feedback. */
    `}</style>
  );
}
