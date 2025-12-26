import React, { useEffect, useMemo, useState } from "react";

/**
 * X3.1 — Wallet / Tip History (Customer)
 * FULL SCREEN UI (single file)
 * Currency: USD
 *
 * Key UX
 * - Wallet summary (total tips, this month, refunds)
 * - Filters: status, date range, venue, amount range (quick)
 * - Search across pro/venue/receipt
 * - Tip list with row actions
 * - Detail drawer (receipt preview, actions: View X3.2, Share, Report X4.2, Refund X4.5)
 * - Empty + error + loading states (mock)
 *
 * Canvas-safe
 * - No framer-motion
 * - No external icon libs
 *
 * Important (Sandbox)
 * - Some environments block Clipboard API via permissions policy.
 *   We NEVER assume clipboard works. We fall back to an in-app “Copy Link” sheet.
 */

type TipStatus = "Success" | "Failed" | "Refunded" | "Pending";

type TipItem = {
  id: string;
  createdAt: string; // ISO
  receiptNo: string;
  status: TipStatus;

  proName: string;
  proRole: string;
  venue: string;

  tipAmount: number;
  fee: number;
  total: number;

  note?: {
    emoji?: string | null;
    message?: string;
  };

  payment: {
    method: string; // Visa •••• 2140
  };

  shareableReceiptUrl: string;
};

type DatePreset = "7D" | "30D" | "90D" | "ALL";

type Filters = {
  status: TipStatus | "All";
  preset: DatePreset;
  venue: "All" | string;
  amount: "All" | "<5" | "5-20" | ">20";
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function calcFee(tip: number) {
  const feeRaw = tip * 0.025 + 0.1;
  const fee = Math.max(0.1, Math.round(feeRaw * 100) / 100);
  const total = Math.round((tip + fee) * 100) / 100;
  return { fee, total };
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
}

function withinPreset(iso: string, preset: DatePreset) {
  if (preset === "ALL") return true;
  const now = Date.now();
  const d = new Date(iso).getTime();
  const days = preset === "7D" ? 7 : preset === "30D" ? 30 : 90;
  return now - d <= days * 24 * 60 * 60 * 1000;
}

function matchesAmount(tip: TipItem, rule: Filters["amount"]) {
  if (rule === "All") return true;
  if (rule === "<5") return tip.tipAmount < 5;
  if (rule === "5-20") return tip.tipAmount >= 5 && tip.tipAmount <= 20;
  return tip.tipAmount > 20;
}

async function copyTextBestEffort(text: string) {
  // Clipboard may be blocked by permissions policy.
  // We try, but never throw.
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true as const };
    }
  } catch {
    // fall through
  }
  return { ok: false as const };
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money");
    const c = calcFee(5);
    console.assert(c.total > 5, "fee adds");
    console.assert(withinPreset(new Date().toISOString(), "7D") === true, "preset includes today");
    const old = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
    console.assert(withinPreset(old, "30D") === false, "preset excludes old");

    const t: TipItem = {
      id: "1",
      createdAt: new Date().toISOString(),
      receiptNo: "R",
      status: "Success",
      proName: "A",
      proRole: "B",
      venue: "V",
      tipAmount: 4,
      fee: 0.2,
      total: 4.2,
      payment: { method: "Visa" },
      shareableReceiptUrl: "https://x",
    };
    console.assert(matchesAmount(t, "<5") === true, "amount <5");
    console.assert(matchesAmount(t, ">20") === false, "amount >20 false");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function X31_WalletTipHistory() {
  const seed = useMemo<TipItem[]>(() => makeSeedTips(), []);

  const [toast, setToast] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>({ status: "All", preset: "30D", venue: "All", amount: "All" });
  const [tab, setTab] = useState<"All" | "Tips" | "Refunds">("All");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // list pagination mock
  const PAGE = 10;
  const [page, setPage] = useState(1);

  // drawer
  const [selected, setSelected] = useState<TipItem | null>(null);

  // clipboard fallback sheet
  const [copySheet, setCopySheet] = useState<null | { title: string; text: string; helper?: string }>(null);

  const venues = useMemo(() => {
    const s = new Set(seed.map((x) => x.venue));
    return ["All", ...Array.from(s)];
  }, [seed]);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = seed
      .filter((t) => withinPreset(t.createdAt, filters.preset))
      .filter((t) => (filters.status === "All" ? true : t.status === filters.status))
      .filter((t) => (filters.venue === "All" ? true : t.venue === filters.venue))
      .filter((t) => matchesAmount(t, filters.amount))
      .filter((t) => {
        if (tab === "All") return true;
        if (tab === "Tips") return t.status !== "Refunded";
        return t.status === "Refunded";
      })
      .filter((t) => {
        if (!query) return true;
        return (
          t.proName.toLowerCase().includes(query) ||
          t.venue.toLowerCase().includes(query) ||
          t.receiptNo.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return base;
  }, [seed, q, filters, tab]);

  const paged = useMemo(() => visible.slice(0, page * PAGE), [visible, page]);
  const hasMore = paged.length < visible.length;

  const metrics = useMemo(() => {
    const totalTips = seed.filter((t) => t.status === "Success").reduce((s, t) => s + t.tipAmount, 0);
    const totalFees = seed.filter((t) => t.status === "Success").reduce((s, t) => s + t.fee, 0);
    const refunded = seed.filter((t) => t.status === "Refunded").reduce((s, t) => s + t.total, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thisMonth = seed
      .filter((t) => t.status === "Success")
      .filter((t) => new Date(t.createdAt).getTime() >= monthStart.getTime())
      .reduce((s, t) => s + t.tipAmount, 0);

    return { totalTips, totalFees, refunded, thisMonth };
  }, [seed]);

  const spark = useMemo(() => buildSpark(seed), [seed]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  // reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [q, filters, tab]);

  function simulateRefresh() {
    setError(null);
    setLoading(true);
    setToast("Refreshing…");
    setTimeout(() => {
      const flip = Math.random() < 0.15;
      setLoading(false);
      if (flip) {
        setError("Network error (mock). Pull to retry.");
        setToast("Refresh failed");
      } else {
        setToast("Updated");
      }
    }, 900);
  }

  async function openReceipt(t: TipItem) {
    // In production: deep link to X3.2 receipt preview.
    // In this sandbox: copy link (best-effort) or show copy sheet.
    const res = await copyTextBestEffort(t.shareableReceiptUrl);
    if (res.ok) {
      setToast("Open X3.2 (mock) · Link copied");
      return;
    }
    setCopySheet({
      title: `Receipt link · ${t.receiptNo}`,
      text: t.shareableReceiptUrl,
      helper: "Clipboard is blocked in this preview. Select the link and copy manually.",
    });
    setToast("Copy link");
  }

  async function shareTip(t: TipItem) {
    const anyNav = navigator as any;
    const text = `Receipt ${t.receiptNo} · ${money(t.tipAmount)} tip for ${t.proName}`;

    // Try native share first.
    if (anyNav?.share) {
      try {
        await anyNav.share({ title: "Tip receipt", text, url: t.shareableReceiptUrl });
        setToast("Shared");
      } catch {
        setToast("Share cancelled");
      }
      return;
    }

    // Fallback to copy (best-effort) then show sheet.
    const res = await copyTextBestEffort(t.shareableReceiptUrl);
    if (res.ok) {
      setToast("Copied for sharing");
      return;
    }
    setCopySheet({
      title: "Share receipt link",
      text: t.shareableReceiptUrl,
      helper: "Clipboard is blocked in this preview. Select the link and share via WhatsApp / SMS.",
    });
    setToast("Copy to share");
  }

  function report(t: TipItem) {
    setToast(`Open X4.2 Report (mock) · ${t.receiptNo}`);
  }

  function refund(t: TipItem) {
    setToast(`Open X4.5 Refund Tracking (mock) · ${t.receiptNo}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setToast("Back (mock)")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <IBack />
          </button>

          <div className="text-white font-semibold">X3.1 · Wallet</div>

          <button
            onClick={simulateRefresh}
            className="h-10 px-3 rounded-2xl bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        {/* Wallet header */}
        <div className="rounded-3xl border border-white/20 bg-white/15 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold">Wallet & History</div>
              <div className="text-white/80 text-xs mt-0.5">All tips, refunds and receipts in one place.</div>
            </div>
            <span className="text-[11px] px-2 py-1 rounded-full border border-white/20 bg-white/10 text-white/90 font-semibold">USD</span>
          </div>

          {/* Metrics */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <GlassMetric label="This month" value={money(metrics.thisMonth)} icon={<ICalendar />} />
            <GlassMetric label="Total tips" value={money(metrics.totalTips)} icon={<IStar />} />
            <GlassMetric label="Platform fees" value={money(metrics.totalFees)} icon={<IReceipt />} />
            <GlassMetric label="Refunded" value={money(metrics.refunded)} icon={<IRotate />} />
          </div>

          {/* Sparkline */}
          <div className="mt-3 rounded-3xl border border-white/20 bg-white/10 p-3">
            <div className="flex items-center justify-between">
              <div className="text-white text-xs font-semibold">Last 14 days</div>
              <div className="text-white/75 text-[11px]">tips/day (mock)</div>
            </div>
            <Sparkline values={spark} />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 rounded-3xl border border-white/20 bg-white/15 p-2">
          <div className="grid grid-cols-3 gap-2">
            <TabBtn active={tab === "All"} onClick={() => setTab("All")} label="All" />
            <TabBtn active={tab === "Tips"} onClick={() => setTab("Tips")} label="Tips" />
            <TabBtn active={tab === "Refunds"} onClick={() => setTab("Refunds")} label="Refunds" />
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 rounded-3xl border border-white/20 bg-white/15 p-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center">
              <ISearch />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by pro, venue or receipt…"
              className="flex-1 h-10 rounded-2xl bg-white/10 border border-white/15 px-3 text-white placeholder:text-white/60 outline-none"
            />
            <button
              onClick={() => {
                setQ("");
                setToast("Cleared");
              }}
              className="h-10 px-3 rounded-2xl bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 rounded-3xl border border-white/20 bg-white/15 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-white font-semibold">Filters</div>
              <div className="text-white/80 text-sm mt-0.5">Narrow down your wallet activity.</div>
            </div>
            <button
              onClick={() => {
                setFilters({ status: "All", preset: "30D", venue: "All", amount: "All" });
                setToast("Filters reset");
              }}
              className="h-10 px-3 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Reset
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <SelectPill
              label="Status"
              value={filters.status}
              options={["All", "Success", "Pending", "Failed", "Refunded"]}
              onChange={(v) => setFilters((p) => ({ ...p, status: v as any }))}
            />
            <SelectPill
              label="Date"
              value={filters.preset}
              options={["7D", "30D", "90D", "ALL"]}
              onChange={(v) => setFilters((p) => ({ ...p, preset: v as any }))}
            />
            <SelectPill
              label="Venue"
              value={filters.venue}
              options={venues}
              onChange={(v) => setFilters((p) => ({ ...p, venue: v }))}
            />
            <SelectPill
              label="Amount"
              value={filters.amount}
              options={["All", "<5", "5-20", ">20"]}
              onChange={(v) => setFilters((p) => ({ ...p, amount: v as any }))}
            />
          </div>

          <div className="mt-3 text-xs text-white/80">Showing <b>{paged.length}</b> of <b>{visible.length}</b> matching items.</div>
        </div>

        {/* Error */}
        {error ? (
          <div className="mt-3 rounded-3xl border border-red-200 bg-red-50 p-4">
            <div className="font-semibold text-red-800">Couldn’t refresh</div>
            <div className="text-sm text-red-700/80 mt-1">{error}</div>
            <button onClick={simulateRefresh} className="mt-3 w-full h-11 rounded-2xl bg-gray-900 text-white font-semibold">
              Retry
            </button>
          </div>
        ) : null}

        {/* List */}
        <div className="mt-3 space-y-2">
          {paged.length === 0 ? (
            <div className="rounded-3xl border border-white/20 bg-white/15 p-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-3xl bg-white/10 border border-white/15 text-white flex items-center justify-center">
                <IWallet />
              </div>
              <div className="mt-3 text-white font-semibold">No transactions</div>
              <div className="text-white/80 text-sm mt-1">Try changing filters or search.</div>
              <button
                onClick={() => setToast("Go to Discovery (X2.1) mock")}
                className="mt-3 w-full h-11 rounded-2xl bg-white text-blue-700 font-semibold"
              >
                Discover pros
              </button>
            </div>
          ) : (
            paged.map((t) => (
              <TipRow key={t.id} t={t} onOpen={() => setSelected(t)} onViewReceipt={() => openReceipt(t)} onShare={() => shareTip(t)} />
            ))
          )}

          {hasMore ? (
            <button
              onClick={() => {
                setPage((p) => p + 1);
                setToast("Loaded more");
              }}
              className="w-full h-12 rounded-2xl bg-white/15 border border-white/20 text-white font-semibold hover:bg-white/20"
            >
              Load more
            </button>
          ) : paged.length > 0 ? (
            <div className="text-center text-xs text-white/80">End of list</div>
          ) : null}
        </div>

        <div className="mt-4 text-center text-xs text-white/80">Digital Tipping · Customer · X3.1 Wallet / Tip History</div>
      </div>

      {/* Drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <TipDrawer
            t={selected}
            onClose={() => setSelected(null)}
            onViewReceipt={() => openReceipt(selected)}
            onShare={() => shareTip(selected)}
            onReport={() => report(selected)}
            onRefund={() => refund(selected)}
            onSetToast={setToast}
            onOpenCopy={(payload) => setCopySheet(payload)}
          />
        ) : null}
      </Drawer>

      {/* Copy sheet (fallback) */}
      <Drawer open={!!copySheet} onClose={() => setCopySheet(null)}>
        {copySheet ? <CopySheet payload={copySheet} onClose={() => setCopySheet(null)} onToast={setToast} /> : null}
      </Drawer>

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-10 z-[120] transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg inline-flex items-center gap-2">
          <span className={toast ? "okTick" : ""}>
            <ICheck />
          </span>
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function TipRow({
  t,
  onOpen,
  onViewReceipt,
  onShare,
}: {
  t: TipItem;
  onOpen: () => void;
  onViewReceipt: () => void;
  onShare: () => void;
}) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/15 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-12 h-12 rounded-3xl bg-white/10 border border-white/15 text-white flex items-center justify-center">
            <IReceipt />
          </div>
          <div className="min-w-0">
            <div className="text-white font-semibold truncate">
              {t.proName} <span className="text-white/80 font-normal">· {t.venue}</span>
            </div>
            <div className="text-white/75 text-sm mt-0.5 truncate">{t.proRole} · {formatDateTime(t.createdAt)}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill label={t.receiptNo} />
              <Pill label={`${money(t.tipAmount)} tip`} />
              <Pill label={t.status} kind={t.status} />
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-white font-semibold">{money(t.total)}</div>
          <div className="text-white/75 text-xs mt-0.5">Fee {money(t.fee)}</div>
          <div className="mt-2 flex items-center justify-end gap-2">
            <IconBtn onClick={onShare} label="Share">
              <IShare />
            </IconBtn>
            <IconBtn onClick={onViewReceipt} label="Receipt">
              <ILink />
            </IconBtn>
            <IconBtn onClick={onOpen} label="Open">
              <IChevron />
            </IconBtn>
          </div>
        </div>
      </div>

      {t.note?.message ? (
        <div className="mt-3 rounded-3xl bg-white/10 border border-white/15 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="text-white/90 text-sm">“{t.note.message}”</div>
            <div className="text-2xl">{t.note.emoji ?? ""}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TipDrawer({
  t,
  onClose,
  onViewReceipt,
  onShare,
  onReport,
  onRefund,
  onSetToast,
  onOpenCopy,
}: {
  t: TipItem;
  onClose: () => void;
  onViewReceipt: () => void;
  onShare: () => void;
  onReport: () => void;
  onRefund: () => void;
  onSetToast: (s: string) => void;
  onOpenCopy: (p: { title: string; text: string; helper?: string }) => void;
}) {
  const canRefund = t.status === "Success";
  const canRetry = t.status === "Failed";

  return (
    <div className="bg-white rounded-t-[28px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-gray-500">Transaction</div>
          <div className="text-lg font-semibold truncate">{t.receiptNo}</div>
          <div className="text-sm text-gray-600 mt-1">{formatDateTime(t.createdAt)}</div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center"
          aria-label="Close"
        >
          <IClose />
        </button>
      </div>

      <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500">Total charged</div>
            <div className="text-2xl font-semibold mt-1">{money(t.total)}</div>
            <div className="text-sm text-gray-600 mt-1">Tip {money(t.tipAmount)} · Fee {money(t.fee)}</div>
          </div>
          <StatusChip status={t.status} />
        </div>

        <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-3">
          <div className="text-xs text-gray-500">Pro</div>
          <div className="mt-1 font-semibold">{t.proName}</div>
          <div className="text-sm text-gray-600 mt-0.5">{t.proRole} · {t.venue}</div>
        </div>

        <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-3">
          <div className="text-xs text-gray-500">Payment method</div>
          <div className="mt-1 font-semibold">{t.payment.method}</div>
        </div>

        {t.note?.message ? (
          <div className="mt-3 rounded-2xl border border-gray-100 bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Message</div>
                <div className="mt-1 text-sm text-gray-800">“{t.note.message}”</div>
              </div>
              <div className="text-2xl">{t.note.emoji ?? ""}</div>
            </div>
          </div>
        ) : null}

        <button
          onClick={() => onOpenCopy({ title: `Receipt link · ${t.receiptNo}`, text: t.shareableReceiptUrl })}
          className="mt-3 w-full h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Copy link (manual)
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={onViewReceipt} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
          View receipt (X3.2)
        </button>
        <button onClick={onShare} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Share
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={onReport} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Report (X4.2)
        </button>
        <button
          onClick={() => {
            if (canRefund) return onRefund();
            if (canRetry) {
              onSetToast("Retry tip (X1.5) mock");
              return;
            }
            onSetToast("Not available for this status");
          }}
          className={`h-12 rounded-2xl font-semibold ${
            canRefund ? "bg-emerald-600 text-white" : canRetry ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
          }`}
          disabled={!canRefund && !canRetry}
        >
          {canRefund ? "Refund tracking (X4.5)" : canRetry ? "Retry tip" : "Action unavailable"}
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">Tip History supports dispute & refunds flows (X4.x) and receipts (X3.2).</div>
    </div>
  );
}

function CopySheet({ payload, onClose, onToast }: { payload: { title: string; text: string; helper?: string }; onClose: () => void; onToast: (s: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Focus + select for quick manual copy.
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
    return () => clearTimeout(t);
  }, [payload.text]);

  return (
    <div className="bg-white rounded-t-[28px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-gray-500">Copy</div>
          <div className="text-lg font-semibold truncate">{payload.title}</div>
          {payload.helper ? <div className="text-sm text-gray-600 mt-1">{payload.helper}</div> : null}
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center"
          aria-label="Close"
        >
          <IClose />
        </button>
      </div>

      <div className="mt-3 rounded-3xl border border-gray-200 bg-gray-50 p-3">
        <input
          ref={inputRef}
          value={payload.text}
          readOnly
          className="w-full h-12 rounded-2xl bg-white border border-gray-200 px-3 font-mono text-xs outline-none"
          aria-label="Copy link"
        />
        <div className="mt-2 text-xs text-gray-500">Tip: Press <b>Ctrl+C</b> (Windows) or <b>⌘C</b> (Mac) after selection.</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            inputRef.current?.focus();
            inputRef.current?.select();
            onToast("Selected");
          }}
          className="h-12 rounded-2xl bg-gray-900 text-white font-semibold"
        >
          Select
        </button>
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Done
        </button>
      </div>
    </div>
  );
}

function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  // prevent background scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className={`fixed inset-0 z-[90] ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
      <div className={`absolute left-0 right-0 bottom-0 transition-transform duration-200 ${open ? "translate-y-0" : "translate-y-full"}`}>{children}</div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-2">
      <svg viewBox="0 0 100 100" width="100%" height="44" aria-label="Sparkline">
        <polyline points={points} fill="none" stroke="rgba(255,255,255,.85)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={`0,100 ${points} 100,100`} fill="rgba(255,255,255,.12)" stroke="none" />
      </svg>
    </div>
  );
}

function buildSpark(tips: TipItem[]) {
  const days = 14;
  const now = new Date();
  const buckets = new Array(days).fill(0);
  for (let i = 0; i < tips.length; i++) {
    const t = tips[i];
    if (t.status !== "Success") continue;
    const d = new Date(t.createdAt);
    const diff = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diff >= 0 && diff < days) {
      buckets[days - 1 - diff] += t.tipAmount;
    }
  }
  return buckets.map((x) => Math.round(x));
}

function SelectPill({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-3">
      <div className="text-white/80 text-xs font-semibold">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 rounded-2xl bg-white/10 border border-white/15 px-3 text-white outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ color: "black" }}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-2xl border font-semibold ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white/10 text-white border-white/20 hover:bg-white/15"}`}
    >
      {label}
    </button>
  );
}

function GlassMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/20 bg-white/10 p-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-white/80 text-xs">{label}</div>
          <div className="text-white font-semibold mt-1">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center">{icon}</div>
      </div>
    </div>
  );
}

function Pill({ label, kind }: { label: string; kind?: TipStatus }) {
  const tone =
    kind === "Success"
      ? "bg-emerald-500/20 border-emerald-300/30 text-white"
      : kind === "Failed"
      ? "bg-red-500/20 border-red-300/30 text-white"
      : kind === "Refunded"
      ? "bg-amber-500/20 border-amber-300/30 text-white"
      : kind === "Pending"
      ? "bg-white/10 border-white/20 text-white"
      : "bg-white/10 border-white/20 text-white";

  return <span className={`text-[11px] px-2 py-1 rounded-full border font-semibold ${tone}`}>{label}</span>;
}

function IconBtn({ onClick, children, label }: { onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function StatusChip({ status }: { status: TipStatus }) {
  const meta =
    status === "Success"
      ? { bg: "bg-emerald-50", bd: "border-emerald-200", tx: "text-emerald-800" }
      : status === "Failed"
      ? { bg: "bg-red-50", bd: "border-red-200", tx: "text-red-800" }
      : status === "Refunded"
      ? { bg: "bg-amber-50", bd: "border-amber-200", tx: "text-amber-800" }
      : { bg: "bg-gray-50", bd: "border-gray-200", tx: "text-gray-700" };

  return <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${meta.bg} ${meta.bd} ${meta.tx}`}>{status}</span>;
}

function StyleBlock() {
  return (
    <style>{`
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }

      /* light scrollbar */
      ::-webkit-scrollbar{ width:10px; height:10px; }
      ::-webkit-scrollbar-thumb{ background: rgba(0,0,0,.12); border-radius: 999px; border: 3px solid rgba(255,255,255,.9); }
    `}</style>
  );
}

function makeSeedTips(): TipItem[] {
  const now = Date.now();
  const pros = [
    { proName: "Alex", proRole: "Barista", venue: "Cafe Aura", emoji: "☕" },
    { proName: "Maya", proRole: "Nail Artist", venue: "Gloss Studio", emoji: "💅" },
    { proName: "Ravi", proRole: "Barber", venue: "Fade Lab", emoji: "💈" },
    { proName: "Sara", proRole: "Server", venue: "Bistro 19", emoji: "🍽️" },
  ];

  const statuses: TipStatus[] = ["Success", "Success", "Success", "Pending", "Failed", "Refunded"]; // skew success
  const amounts = [2, 3, 5, 8, 10, 15, 25];

  const out: TipItem[] = [];
  for (let i = 0; i < 26; i++) {
    const p = pros[i % pros.length];
    const status = statuses[i % statuses.length];
    const tipAmount = amounts[(i * 3) % amounts.length];
    const { fee, total } = calcFee(tipAmount);

    const createdAt = new Date(now - (i * 1000 * 60 * 60 * 18 + (i % 5) * 1000 * 60 * 8)).toISOString();
    const receiptNo = `RCPT-${481220 + i}`;

    out.push({
      id: `tip_${i}`,
      createdAt,
      receiptNo,
      status,
      proName: p.proName,
      proRole: p.proRole,
      venue: p.venue,
      tipAmount,
      fee,
      total,
      note:
        status === "Failed"
          ? { emoji: "😬", message: "Payment failed (mock)." }
          : status === "Pending"
          ? { emoji: "⏳", message: "Processing…" }
          : i % 4 === 0
          ? { emoji: "😊", message: "Thanks for the great service!" }
          : i % 7 === 0
          ? { emoji: p.emoji, message: `Great job, ${p.proName}!` }
          : undefined,
      payment: { method: i % 3 === 0 ? "Visa •••• 2140" : i % 3 === 1 ? "Mastercard •••• 1109" : "Amex •••• 0005" },
      shareableReceiptUrl: `https://tiptap.example/r/${receiptNo}?sig=${String(100000 + i)}…`,
    });
  }
  return out;
}

/* =========================
   Inline icons
   ========================= */

function IBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ICheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IReceipt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7h6M9 11h6M9 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 8a3 3 0 1 0-2.83-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12l8-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12l8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12a3 3 0 1 1-2.83-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16a3 3 0 1 0 2.83 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ILink() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 7.07 7.07L14 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ISearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IWallet() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h18v12H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 7l3-3h15v3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ICalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 2v3M17 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 7h18v14H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 11h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IStar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m12 2 3.1 6.3 7 .9-5.1 5 1.2 7-6.2-3.3L5.8 21l1.2-7-5.1-5 7-.9L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IRotate() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
