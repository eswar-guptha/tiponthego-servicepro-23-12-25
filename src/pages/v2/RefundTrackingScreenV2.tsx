import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  HelpCircle,
  Info,
  Landmark,
  MessageSquare,
  RefreshCcw,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

/**
 * Screen Code: X4.5
 * Screen Name: Refund Tracking / Settlement Status
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From X4.3 (Resolved/refund initiated)
 *  - From X4.4 (system message "Refund initiated")
 * Purpose:
 *  - Make money movement transparent: Initiated → Processor → Bank → Settled
 *  - Reduce support load via clear ETA, method, and escalation rules
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Uses CSS keyframes for subtle progress shimmer
 */

type StepKey = "initiated" | "processor" | "bank" | "settled";

type RefundMethod = "Card" | "Wallet" | "Bank";

type RefundState = "In progress" | "Settled" | "Delayed";

type Refund = {
  caseId: string;
  receiptNo: string;
  amount: number;
  state: RefundState;
  method: RefundMethod;
  methodLabel: string;
  refId: string;
  createdAt: string;
  etaText: string;
  steps: Array<{
    key: StepKey;
    title: string;
    subtitle: string;
    at?: string;
    done: boolean;
  }>;
  notes: string[];
};

const DEMO_REFUND: Refund = {
  caseId: "CASE-10492",
  receiptNo: "RCPT-481220",
  amount: 3.95,
  state: "In progress",
  method: "Card",
  methodLabel: "Visa •••• 2140",
  refId: "RFND-7A2C-19F3",
  createdAt: "Dec 03 · 11:20 AM",
  etaText: "Expected in 3–7 business days",
  steps: [
    {
      key: "initiated",
      title: "Refund initiated",
      subtitle: "Support approved and initiated the refund.",
      at: "Dec 03 · 11:20 AM",
      done: true,
    },
    {
      key: "processor",
      title: "Processor confirmed",
      subtitle: "Payment processor acknowledged the refund request.",
      at: "Dec 03 · 11:26 AM",
      done: true,
    },
    {
      key: "bank",
      title: "Bank processing",
      subtitle: "Your bank/card issuer is processing the refund.",
      done: false,
    },
    {
      key: "settled",
      title: "Settled",
      subtitle: "Refund posted to your payment method.",
      done: false,
    },
  ],
  notes: [
    "Banks may take longer on weekends/holidays.",
    "If you used a temporary/virtual card, posting may be delayed.",
    "You can reopen the case if the ETA passes.",
  ],
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function uid() {
  return Math.random().toString(16).slice(2);
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money formats");
    console.assert(uid().length > 0, "uid ok");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function RefundTrackingX45() {
  const [toast, setToast] = useState<string | null>(null);
  const [refund, setRefund] = useState<Refund>(DEMO_REFUND);

  const [sheet, setSheet] = useState<null | "help" | "reopen">(null);
  const [sheetMounted, setSheetMounted] = useState(false);

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

  const progress = useMemo(() => {
    const done = refund.steps.filter((s) => s.done).length;
    return done / refund.steps.length;
  }, [refund.steps]);

  const stateTone = useMemo(() => {
    if (refund.state === "Settled") return "emerald";
    if (refund.state === "Delayed") return "amber";
    return "blue";
  }, [refund.state]);

  function closeSheet() {
    setSheetMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function openSheet(kind: NonNullable<typeof sheet>) {
    setSheet(kind);
  }

  function simulateRefresh() {
    setToast("Refreshing status…");
    window.setTimeout(() => {
      // Simple mock: advance one step
      setRefund((prev) => {
        const next = { ...prev, steps: prev.steps.map((s) => ({ ...s })) };
        const idx = next.steps.findIndex((s) => !s.done);
        if (idx >= 0) {
          next.steps[idx].done = true;
          next.steps[idx].at = nowStamp();
        }
        const allDone = next.steps.every((s) => s.done);
        next.state = allDone ? "Settled" : "In progress";
        next.etaText = allDone ? "Refund settled" : next.etaText;
        return next;
      });
      setToast("Updated");
    }, 800);
  }

  function reopenCase() {
    setToast("Reopen requested (mock)");
    closeSheet();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X4.3")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X4.5 · Refund tracking</div>
          <button
            onClick={() => openSheet("help")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28">
        {/* Summary card */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4">
          <div className="text-white">
            <div className="text-xs text-white/80 inline-flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Settlement status · USD</span>
            </div>
            <div className="mt-1 flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-semibold">{money(refund.amount)}</div>
                <div className="text-xs text-white/80 mt-1">Started: {refund.createdAt}</div>
              </div>
              <ToneBadge tone={stateTone as any} label={refund.state} />
            </div>

            <div className="mt-3 text-sm text-white/90">{refund.etaText}</div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(refund.refId);
                  setToast("Copied refund reference");
                }}
                className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" /> Ref ID
              </button>
              <button
                onClick={simulateRefresh}
                className="h-11 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Refresh
              </button>
            </div>

            <div className="mt-3 rounded-3xl bg-white/10 border border-white/15 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-white/75">Ticket</div>
                  <div className="font-semibold">{refund.caseId}</div>
                  <div className="text-xs text-white/75 mt-1">Receipt #{refund.receiptNo}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/75">Method</div>
                  <div className="font-semibold">{refund.method}</div>
                  <div className="text-xs text-white/75 mt-1">{refund.methodLabel}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Progress</div>
            <div className="text-sm text-gray-500">{Math.round(progress * 100)}%</div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-600 shimmer" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div className="mt-2 text-xs text-gray-500">Tap a step for details.</div>

          <div className="mt-4 space-y-2">
            {refund.steps.map((s) => (
              <StepRow key={s.key} s={s} onClick={() => setToast(`${s.title}${s.at ? ` · ${s.at}` : ""}`)} />
            ))}
          </div>
        </div>

        {/* What happens next */}
        <div className="mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="font-semibold">What happens next</div>
          <div className="mt-2 space-y-2">
            {refund.notes.map((n, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5" />
                <span>{n}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => alert("Open support chat (mock) → X4.4")}
              className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <MessageSquare className="w-4 h-4" /> Chat
            </button>
            <button
              onClick={() => openSheet("reopen")}
              className="h-12 rounded-2xl text-white font-semibold bg-gray-900"
            >
              Reopen case
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
            <Sparkles className="w-4 h-4 mt-0.5" />
            <span>Tip: If you see a duplicate charge, reopen the case and attach the statement.</span>
          </div>
        </div>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Need proof?</div>
              <div className="text-xs text-white/75">Use Ref ID for bank support.</div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(refund.refId);
                setToast("Copied Ref ID");
              }}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet title={sheet === "help" ? "Refund help" : "Reopen case"} mounted={sheetMounted} onClose={closeSheet}>
          {sheet === "help" ? (
            <HelpPanel refund={refund} onClose={closeSheet} />
          ) : (
            <ReopenPanel amount={refund.amount} onReopen={reopenCase} onClose={closeSheet} />
          )}
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

function nowStamp() {
  return "Today · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ToneBadge({ tone, label }: { tone: "emerald" | "amber" | "blue" | "gray"; label: string }) {
  const base = "text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2";
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
      : tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-800"
      : tone === "blue"
      ? "bg-blue-50 border-blue-100 text-blue-800"
      : "bg-gray-50 border-gray-200 text-gray-700";
  const icon =
    tone === "emerald" ? <CheckCircle2 className="w-4 h-4" /> : tone === "amber" ? <Clock className="w-4 h-4" /> : <Shield className="w-4 h-4" />;
  return <span className={`${base} ${cls}`}>{icon} {label}</span>;
}

function StepRow({ s, onClick }: { s: Refund["steps"][number]; onClick: () => void }) {
  const icon = s.key === "initiated" ? <Shield className="w-4 h-4" /> : s.key === "processor" ? <Building2 className="w-4 h-4" /> : s.key === "bank" ? <Landmark className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-3xl border p-4 transition ${s.done ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100 hover:bg-gray-100"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${s.done ? "bg-white border-emerald-100 text-emerald-700" : "bg-white border-gray-200 text-gray-700"}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold truncate">{s.title}</div>
              <div className="text-sm text-gray-600 mt-0.5">{s.subtitle}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">{s.done ? "Done" : "Pending"}</div>
              <div className="text-xs text-gray-500">{s.at ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function HelpPanel({ refund, onClose }: { refund: Refund; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Common questions</div>
        <div className="text-sm text-gray-500 mt-1">Why refunds can take time.</div>
      </div>

      <FAQ
        q="Why does the app show Processor confirmed but not Bank settled?"
        a="Processor confirmation means the refund request was accepted. Banks/issuers may batch-post refunds, which can take several business days."
      />
      <FAQ
        q="Can the refund go to a different card or bank account?"
        a="Refunds are returned to the original payment method. If it’s closed, your bank/issuer may redirect or issue a credit."
      />
      <FAQ
        q="What if I see a duplicate charge?"
        a="Reopen your case and attach your statement screenshot. Support will reconcile settlement and reverse duplicates."
      />

      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="text-sm text-gray-700">Reference ID</div>
        <div className="mt-1 font-semibold">{refund.refId}</div>
        <div className="text-xs text-gray-500 mt-1">Use this for bank support if required.</div>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 p-4">
      <div className="font-semibold">{q}</div>
      <div className="text-sm text-gray-600 mt-1">{a}</div>
    </div>
  );
}

function ReopenPanel({ amount, onReopen, onClose }: { amount: number; onReopen: () => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
        <div className="font-semibold">Reopen this case?</div>
        <div className="text-sm text-amber-800 mt-1">
          Reopen if the ETA has passed, or if you see a duplicate charge. Amount: <b>{money(amount)}</b>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Not now
        </button>
        <button onClick={onReopen} className="h-12 rounded-2xl text-white font-semibold bg-gray-900">
          Reopen
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>We never ask for OTP/PIN. Attach only proof like statements/screenshots.</span>
      </div>
    </div>
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
          mounted ? "translate-y-0" : "translate-y-[520px]"
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
            <div className="text-sm text-gray-500 mt-0.5">X4.5 (mock)</div>
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
