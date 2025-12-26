import React, { useEffect, useMemo, useState } from "react";

/**
 * Screen Code: X1.3
 * Screen Name: Tip Amount Selection
 * Currency: USD
 * Roles: Customer / Guest
 * Flow: X2.4 / X2.3 / QR → X1.3 → X1.4 → X1.5 → X2.6
 *
 * Goals:
 *  - Make choosing an amount fast (presets + custom)
 *  - Show trust cues (fee, total, receipt reference)
 *  - Provide one clear primary CTA to continue (deep link mock to X1.4)
 *
 * Canvas-safe:
 *  - No framer-motion
 *  - No lucide imports (inline SVG icons)
 */

type Preset = { label: string; value: number; hint?: string };

type Mode = "preset" | "custom";

type Money = {
  amount: number; // tip amount
  fee: number; // platform fee (mock)
  total: number; // amount + fee
};

const PRESETS: Preset[] = [
  { label: "$2", value: 2, hint: "Quick" },
  { label: "$3", value: 3, hint: "Popular" },
  { label: "$5", value: 5, hint: "Great" },
  { label: "$10", value: 10, hint: "Wow" },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function calc(tip: number): Money {
  // Mock fee model: 2.5% + $0.10, minimum $0.10
  const feeRaw = tip * 0.025 + 0.1;
  const fee = Math.max(0.1, Math.round(feeRaw * 100) / 100);
  const total = Math.round((tip + fee) * 100) / 100;
  return { amount: tip, fee, total };
}

function runDevChecks() {
  try {
    console.assert(money(3.5) === "$3.50", "money format");
    const m = calc(0.5);
    console.assert(m.fee >= 0.1, "fee min");
    console.assert(calc(5).total > 5, "total includes fee");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function TipAmountSelectionX13() {
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("preset");

  // Context (mock payload from discovery/QR)
  const ctx = useMemo(
    () => ({
      proName: "Alex",
      role: "Barista",
      venue: "Cafe Aura",
      receiptNo: "RCPT-481220",
      last4: "2140",
      method: "Visa",
      suggested: 3,
    }),
    []
  );

  const [tip, setTip] = useState<number>(ctx.suggested);
  const m = useMemo(() => calc(tip), [tip]);

  // Custom input as string to allow partial edits
  const [custom, setCustom] = useState<string>(ctx.suggested.toFixed(2));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (mode !== "custom") return;
    setCustom(tip.toFixed(2));
  }, [mode, tip]);

  function setPreset(v: number) {
    setMode("preset");
    setTip(v);
    setToast(`Selected ${money(v)}`);
  }

  function openCustom() {
    setMode("custom");
    setToast("Custom amount");
  }

  function applyCustom(s: string) {
    // sanitize: keep digits + dot
    const cleaned = s.replace(/[^0-9.]/g, "");
    // allow only one dot
    const parts = cleaned.split(".");
    const normalized = parts.length <= 1 ? cleaned : parts[0] + "." + parts.slice(1).join("");
    setCustom(normalized);

    const n = Number(normalized);
    if (!Number.isFinite(n)) return;
    const capped = Math.min(500, Math.max(0, Math.round(n * 100) / 100));
    setTip(capped);
  }

  function pressKey(k: string) {
    if (k === "del") {
      applyCustom(custom.slice(0, -1));
      return;
    }
    if (k === ".") {
      if (custom.includes(".")) return;
      applyCustom(custom + ".");
      return;
    }
    applyCustom(custom === "0" ? k : custom + k);
  }

  const canContinue = tip >= 1; // min tip $1.00 (mock)

  function continueToMessage() {
    if (!canContinue) {
      setToast("Minimum tip is $1.00");
      return;
    }
    setToast(`Open X1.4 (mock) · Tip ${money(tip)}`);
  }

  function back() {
    alert("Back (mock) → Pro Profile / QR");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={back}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <IconBack />
          </button>
          <div className="text-white font-semibold">X1.3 · Tip Amount</div>
          <button
            onClick={() => setToast("Help (mock)")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Help"
          >
            <IconInfo />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3">
        {/* Stepper */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
          <div className="flex items-center justify-between">
            <div className="text-white text-sm font-semibold">Complete tip</div>
            <div className="text-white/80 text-xs">Step 1 of 3</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StepChip active label="Amount" />
            <StepChip active={false} label="Message" />
            <StepChip active={false} label="Confirm" />
          </div>
          <div className="mt-2 text-white/80 text-xs">Choose an amount. Add a message next.</div>
        </div>

        {/* Context card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-gray-100 flex items-center justify-center">
                <IconUser />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{ctx.proName}</div>
                <div className="text-sm text-gray-500 mt-0.5 truncate">{ctx.role} · {ctx.venue}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">Receipt {ctx.receiptNo}</span>
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">{ctx.method} •••• {ctx.last4}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setToast("Open Pro profile (mock)")}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              View
            </button>
          </div>
        </div>

        {/* Amount card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Tip amount</div>
              <div className="text-sm text-gray-500 mt-0.5">Fast presets or enter custom.</div>
            </div>
            <button
              onClick={openCustom}
              className={`h-10 px-3 rounded-2xl border font-semibold ${mode === "custom" ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
            >
              Custom
            </button>
          </div>

          {/* Selected amount */}
          <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-gray-500">Selected</div>
                <div className="text-3xl font-semibold mt-1">{money(tip)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Total today</div>
                <div className="text-lg font-semibold mt-1">{money(m.total)}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <MiniMeta label="Platform fee" value={money(m.fee)} />
              <MiniMeta label="You pay" value={money(m.total)} strong />
            </div>
            <div className="mt-2 text-xs text-gray-500">Fee helps keep the platform secure and supports refunds & support.</div>
          </div>

          {/* Presets */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={`rounded-3xl border p-4 text-left transition ${
                  mode === "preset" && tip === p.value ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="font-semibold text-lg">{p.label}</div>
                  {p.hint ? (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${mode === "preset" && tip === p.value ? "border-white/20 bg-white/10" : "border-gray-200 bg-gray-50"}`}>
                      {p.hint}
                    </span>
                  ) : null}
                </div>
                <div className={`text-sm mt-1 ${mode === "preset" && tip === p.value ? "text-white/80" : "text-gray-500"}`}>Tap to select</div>
              </button>
            ))}
          </div>

          {/* Custom keypad */}
          {mode === "custom" ? (
            <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Enter custom</div>
                  <div className="text-lg font-semibold mt-0.5">{custom || "0"}</div>
                </div>
                <button
                  onClick={() => {
                    setMode("preset");
                    setToast("Using presets");
                  }}
                  className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  Presets
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  ".",
                  "0",
                  "del",
                ].map((k) => (
                  <button
                    key={k}
                    onClick={() => pressKey(k)}
                    className={`h-12 rounded-2xl border font-semibold transition ${
                      k === "del" ? "bg-white border-gray-200 hover:bg-gray-50" : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {k === "del" ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <IconDelete />
                        <span className="text-sm">Del</span>
                      </span>
                    ) : (
                      k
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-2 text-xs text-gray-500">Min $1.00 · Max $500.00</div>
            </div>
          ) : null}
        </div>

        {/* Trust card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700">
              <IconShield />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Secure tip</div>
              <div className="text-sm text-gray-600 mt-1">
                Receipts are saved automatically. Refunds and disputes are supported in-app.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill label="Instant receipt" />
                <Pill label="Refund tracking" />
                <Pill label="Support chat" />
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X1.3</div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white">
                <div className="text-xs text-white/75">Next</div>
                <div className="text-sm font-semibold">Add message (X1.4)</div>
              </div>
              <button
                onClick={continueToMessage}
                className={`h-11 px-4 rounded-2xl font-semibold ${canContinue ? "bg-white text-blue-700" : "bg-white/30 text-white/70"}`}
                aria-label="Continue"
              >
                Continue
              </button>
            </div>
            {!canContinue ? <div className="mt-2 text-xs text-white/80">Minimum tip is $1.00</div> : null}
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
          <span className={toast ? "okTick" : ""}>
            <IconCheck />
          </span>
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function StepChip({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`h-10 rounded-2xl border flex items-center justify-center text-sm font-semibold ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white/10 text-white border-white/20"
      }`}
    >
      {label}
    </div>
  );
}

function MiniMeta({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 ${strong ? "font-semibold" : "font-semibold text-gray-700"}`}>{value}</div>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">{label}</span>;
}

/* =========================
   Inline icons
   ========================= */

function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 20 6v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 7l1-2h4l1 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7l1 14h8l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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
