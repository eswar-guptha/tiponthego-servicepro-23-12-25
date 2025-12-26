import React, { useEffect, useMemo, useState } from "react";

/**
 * Single Flow Demo (Router)
 * Connects: X1.3 → X1.4 → X1.5 → X2.6
 * Currency: USD
 * Roles: Customer / Guest
 *
 * Why this file:
 *  - Lets you click through the complete Tip Flow without alerts
 *  - Preserves state across steps (amount, message, privacy, payment)
 *  - Includes realistic submit: processing → success/failure → retry
 *
 * Canvas-safe:
 *  - No framer-motion
 *  - No external icon libs (inline SVG)
 */

type Privacy = "Private" | "ProOnly" | "Receipt";

type PaymentMethod = {
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  exp: string;
  token: string;
};

type Flow = {
  // Context from discovery / QR
  proName: string;
  proRole: string;
  venue: string;
  receiptNo: string;

  // X1.3
  tipAmount: number;

  // X1.4
  emoji: string | null;
  message: string;
  privacy: Privacy;
  showOnShareableReceipt: boolean;
  allowProReply: boolean;
  saveAsTemplate: boolean;

  // X1.5
  method: PaymentMethod;
  addToFavorites: boolean;
  sendReceiptEmail: boolean;
};

type Step = "X1.3" | "X1.4" | "X1.5" | "X2.6";

type SubmitState = "idle" | "processing" | "success" | "failed";

const MAX_LEN = 120;

const EMOJIS = ["👏", "🙏", "😊", "🔥", "🌟", "💯", "🥳", "☕", "🍕", "💈", "💅", "🧾"];

const SUGGESTIONS = [
  "Thanks for the great service!",
  "Really appreciate you.",
  "Fast and friendly — thank you!",
  "You made my day 🙌",
  "Awesome attention to detail.",
];

const TEMPLATES: Array<{ title: string; body: string; emoji?: string }> = [
  { title: "Friendly", body: "Thanks {name}! Great service at {venue}.", emoji: "😊" },
  { title: "Quick", body: "Thank you!", emoji: "🙏" },
  { title: "Rave", body: "Amazing work {name} — you’re the best!", emoji: "🌟" },
  { title: "Coffee", body: "Perfect cup today ☕ Thanks {name}!", emoji: "☕" },
];

const PRESETS = [
  { label: "$2", value: 2, hint: "Quick" },
  { label: "$3", value: 3, hint: "Popular" },
  { label: "$5", value: 5, hint: "Great" },
  { label: "$10", value: 10, hint: "Wow" },
] as const;

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function calcFee(tip: number) {
  const feeRaw = tip * 0.025 + 0.1;
  const fee = Math.max(0.1, Math.round(feeRaw * 100) / 100);
  const total = Math.round((tip + fee) * 100) / 100;
  return { fee, total };
}

function clampMessage(s: string) {
  const clean = (s ?? "").replace(/\s+/g, " ").trimStart();
  return clean.slice(0, MAX_LEN);
}

function applyVars(body: string, vars: { name: string; venue: string }) {
  return body.replaceAll("{name}", vars.name).replaceAll("{venue}", vars.venue);
}

function privacyLabel(p: Privacy) {
  if (p === "Private") return "Only you";
  if (p === "ProOnly") return "Pro only";
  return "On receipt";
}

function runDevChecks() {
  try {
    console.assert(clampMessage("   hi") === "hi", "trim start");
    console.assert(clampMessage("a".repeat(999)).length === MAX_LEN, "max len");
    console.assert(applyVars("Hi {name} @ {venue}", { name: "A", venue: "B" }) === "Hi A @ B", "vars");
    const f = calcFee(5);
    console.assert(f.total > 5, "fee adds");
    console.assert(privacyLabel("Receipt") === "On receipt", "privacy label");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function TipFlowRouter_X13_X26() {
  const ctx = useMemo(
    () => ({
      proName: "Alex",
      proRole: "Barista",
      venue: "Cafe Aura",
      receiptNo: "RCPT-481220",
      suggested: 3,
    }),
    []
  );

  const [step, setStep] = useState<Step>("X1.3");
  const [toast, setToast] = useState<string | null>(null);
  const [submit, setSubmit] = useState<SubmitState>("idle");

  // Shared flow state
  const [f, setF] = useState<Flow>(() => ({
    proName: ctx.proName,
    proRole: ctx.proRole,
    venue: ctx.venue,
    receiptNo: ctx.receiptNo,

    tipAmount: ctx.suggested,

    emoji: "😊",
    message: "Thanks for the great service!",
    privacy: "ProOnly",
    showOnShareableReceipt: true,
    allowProReply: false,
    saveAsTemplate: false,

    method: { brand: "Visa", last4: "2140", exp: "08/28", token: "pm_mock_2140" },
    addToFavorites: true,
    sendReceiptEmail: true,
  }));

  const { fee, total } = useMemo(() => calcFee(f.tipAmount), [f.tipAmount]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  // Reset submit when navigating backwards
  useEffect(() => {
    if (step !== "X1.5") {
      setSubmit("idle");
    }
  }, [step]);

  function goto(s: Step) {
    setStep(s);
  }

  function nextFromX13() {
    if (f.tipAmount < 1) {
      setToast("Minimum tip is $1.00");
      return;
    }
    setToast("Step 2: Add message");
    goto("X1.4");
  }

  function nextFromX14() {
    const lower = f.message.toLowerCase();
    if (lower.includes("http://") || lower.includes("https://")) {
      setToast("Links are not allowed in messages");
      return;
    }
    setToast("Step 3: Review & pay");
    goto("X1.5");
  }

  function submitTip() {
    if (submit === "processing" || submit === "success") return;
    if (f.tipAmount < 1) {
      setToast("Minimum tip is $1.00");
      return;
    }

    setSubmit("processing");
    setToast("Processing…");

    // Mock failure triggers for testing
    const shouldFail =
      Math.round(f.tipAmount * 100) % 100 === 13 ||
      f.message.toLowerCase().includes(" fail") ||
      f.message.toLowerCase().startsWith("fail");

    setTimeout(() => {
      if (shouldFail) {
        setSubmit("failed");
        setToast("Tip failed");
        return;
      }
      setSubmit("success");
      setToast("Tip sent ✓");
      setTimeout(() => {
        goto("X2.6");
      }, 450);
    }, 1200);
  }

  function retry() {
    setSubmit("idle");
    setToast("Try again");
  }

  function resetFlow() {
    setSubmit("idle");
    setToast("New tip");
    setF((p) => ({
      ...p,
      tipAmount: ctx.suggested,
      emoji: "😊",
      message: "Thanks for the great service!",
      privacy: "ProOnly",
      showOnShareableReceipt: true,
      allowProReply: false,
      saveAsTemplate: false,
      addToFavorites: true,
      sendReceiptEmail: true,
      method: { brand: "Visa", last4: "2140", exp: "08/28", token: "pm_mock_2140" },
    }));
    goto("X1.3");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Global top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === "X1.3") {
                setToast("Back to discovery (mock)");
                return;
              }
              if (step === "X1.4") return goto("X1.3");
              if (step === "X1.5") return goto("X1.4");
              if (step === "X2.6") return goto("X1.5");
            }}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <IconBack />
          </button>

          <div className="text-white font-semibold">Flow · {step}</div>

          <button
            onClick={resetFlow}
            className="h-10 px-3 rounded-2xl bg-white/10 border border-white/15 text-white font-semibold hover:bg-white/15"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Screen area */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-28">
        {/* Stepper */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
          <div className="flex items-center justify-between">
            <div className="text-white text-sm font-semibold">Complete tip</div>
            <div className="text-white/80 text-xs">
              {step === "X1.3" ? "Step 1 of 3" : step === "X1.4" ? "Step 2 of 3" : step === "X1.5" ? "Step 3 of 3" : "Done"}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            <StepChip active={step === "X1.3"} label="X1.3" sub="Amount" />
            <StepChip active={step === "X1.4"} label="X1.4" sub="Message" />
            <StepChip active={step === "X1.5"} label="X1.5" sub="Confirm" />
            <StepChip active={step === "X2.6"} label="X2.6" sub="Success" />
          </div>
          <div className="mt-2 text-white/80 text-xs">State is preserved across screens in this demo.</div>
        </div>

        <div className="mt-3 space-y-3">
          {/* Shared context card */}
          <ContextCard f={f} fee={fee} total={total} />

          {step === "X1.3" ? (
            <X13Amount
              tip={f.tipAmount}
              onSetTip={(n) => setF((p) => ({ ...p, tipAmount: n }))}
              onNext={nextFromX13}
            />
          ) : null}

          {step === "X1.4" ? (
            <X14Message
              f={f}
              onPatch={(patch) => setF((p) => ({ ...p, ...patch }))}
              onNext={nextFromX14}
              onEditAmount={() => goto("X1.3")}
            />
          ) : null}

          {step === "X1.5" ? (
            <X15Confirm
              f={f}
              fee={fee}
              total={total}
              submit={submit}
              onEditAmount={() => goto("X1.3")}
              onEditMessage={() => goto("X1.4")}
              onPatch={(patch) => setF((p) => ({ ...p, ...patch }))}
              onSubmit={submitTip}
              onRetry={retry}
              onGoDispute={() => setToast("Open X4.2 (mock) · Report/Dispute")}
            />
          ) : null}

          {step === "X2.6" ? (
            <X26Success f={f} total={total} fee={fee} onNewTip={resetFlow} onOpenReceipt={() => setToast("Open X1.2 / X3.2 receipt (mock)")} />
          ) : null}
        </div>

        <div className="mt-4 text-center text-xs text-white/85">Digital Tipping · Customer · Full Flow Demo</div>
      </div>

      {/* Sticky bottom CTA (changes per step) */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
            {step === "X1.3" ? (
              <StickyBar
                leftTop="Next"
                leftBottom="Add message (X1.4)"
                right={
                  <button onClick={nextFromX13} className="h-11 px-4 rounded-2xl font-semibold bg-white text-blue-700" aria-label="Continue">
                    Continue
                  </button>
                }
              />
            ) : step === "X1.4" ? (
              <StickyBar
                leftTop="Next"
                leftBottom="Review & pay (X1.5)"
                right={
                  <button onClick={nextFromX14} className="h-11 px-4 rounded-2xl font-semibold bg-white text-blue-700" aria-label="Continue">
                    Continue
                  </button>
                }
              />
            ) : step === "X1.5" ? (
              <StickyBar
                leftTop="Total"
                leftBottom={money(total)}
                right={
                  <button
                    onClick={submitTip}
                    disabled={submit === "processing" || submit === "success"}
                    className={`h-11 px-4 rounded-2xl font-semibold ${submit === "processing" || submit === "success" ? "bg-white/40 text-white" : "bg-white text-blue-700"}`}
                  >
                    {submit === "processing" ? "Processing…" : submit === "success" ? "Sent" : "Send tip"}
                  </button>
                }
                foot={
                  submit === "failed" ? (
                    <div className="mt-2 text-xs text-white/85">Tip failed. Fix and retry (or Report in X4.2).</div>
                  ) : submit === "processing" ? (
                    <div className="mt-2 text-xs text-white/85">Do not close while processing.</div>
                  ) : null
                }
              />
            ) : (
              <StickyBar
                leftTop="Done"
                leftBottom="Share receipt or tip again"
                right={
                  <button onClick={resetFlow} className="h-11 px-4 rounded-2xl font-semibold bg-white text-blue-700">
                    New tip
                  </button>
                }
              />
            )}
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

function StickyBar({
  leftTop,
  leftBottom,
  right,
  foot,
}: {
  leftTop: string;
  leftBottom: string;
  right: React.ReactNode;
  foot?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-white">
          <div className="text-xs text-white/75">{leftTop}</div>
          <div className="text-sm font-semibold">{leftBottom}</div>
        </div>
        {right}
      </div>
      {foot}
    </div>
  );
}

function StepChip({ active, label, sub }: { active: boolean; label: string; sub: string }) {
  return (
    <div
      className={`h-12 rounded-2xl border flex flex-col items-center justify-center text-xs font-semibold ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white/10 text-white border-white/20"
      }`}
    >
      <div>{label}</div>
      <div className="text-[10px] opacity-80">{sub}</div>
    </div>
  );
}

function ContextCard({ f, fee, total }: { f: Flow; fee: number; total: number }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-gray-100 flex items-center justify-center">
            <IconUser />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">{f.proName}</div>
            <div className="text-sm text-gray-500 mt-0.5 truncate">
              {f.proRole} · {f.venue}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill label={`Receipt ${f.receiptNo}`} />
              <Pill label={`Tip ${money(f.tipAmount)} · Total ${money(total)}`} />
              <Pill label={`Fee ${money(fee)}`} />
            </div>
          </div>
        </div>
        <button
          onClick={() => alert("Open pro profile (mock)")}
          className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          View
        </button>
      </div>
    </div>
  );
}

function X13Amount({
  tip,
  onSetTip,
  onNext,
}: {
  tip: number;
  onSetTip: (n: number) => void;
  onNext: () => void;
}) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [custom, setCustom] = useState<string>(tip.toFixed(2));

  useEffect(() => {
    if (mode === "custom") setCustom(tip.toFixed(2));
  }, [mode, tip]);

  function applyCustom(s: string) {
    const cleaned = s.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    const normalized = parts.length <= 1 ? cleaned : parts[0] + "." + parts.slice(1).join("");
    setCustom(normalized);
    const n = Number(normalized);
    if (!Number.isFinite(n)) return;
    const capped = Math.min(500, Math.max(0, Math.round(n * 100) / 100));
    onSetTip(capped);
  }

  function pressKey(k: string) {
    if (k === "del") return applyCustom(custom.slice(0, -1));
    if (k === ".") {
      if (custom.includes(".")) return;
      return applyCustom(custom + ".");
    }
    return applyCustom(custom === "0" ? k : custom + k);
  }

  const { fee, total } = useMemo(() => calcFee(tip), [tip]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">X1.3 · Tip amount</div>
          <div className="text-sm text-gray-500 mt-0.5">Fast presets or enter custom.</div>
        </div>
        <button
          onClick={() => setMode((p) => (p === "custom" ? "preset" : "custom"))}
          className={`h-10 px-3 rounded-2xl border font-semibold ${mode === "custom" ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
        >
          {mode === "custom" ? "Presets" : "Custom"}
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-gray-500">Selected</div>
            <div className="text-3xl font-semibold mt-1">{money(tip)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Total today</div>
            <div className="text-lg font-semibold mt-1">{money(total)}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniMeta label="Platform fee" value={money(fee)} />
          <MiniMeta label="You pay" value={money(total)} strong />
        </div>
        <div className="mt-2 text-xs text-gray-500">Min $1.00 · Max $500.00</div>
      </div>

      {mode === "preset" ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => onSetTip(p.value)}
              className={`rounded-3xl border p-4 text-left transition ${tip === p.value ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
            >
              <div className="flex items-start justify-between">
                <div className="font-semibold text-lg">{p.label}</div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${tip === p.value ? "border-white/20 bg-white/10" : "border-gray-200 bg-gray-50"}`}>
                  {p.hint}
                </span>
              </div>
              <div className={`text-sm mt-1 ${tip === p.value ? "text-white/80" : "text-gray-500"}`}>Tap to select</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Enter custom</div>
              <div className="text-lg font-semibold mt-0.5">{custom || "0"}</div>
            </div>
            <button onClick={() => applyCustom(tip.toFixed(2))} className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
              Apply
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9",".","0","del"].map((k) => (
              <button
                key={k}
                onClick={() => pressKey(k)}
                className="h-12 rounded-2xl border font-semibold bg-white border-gray-200 hover:bg-gray-50"
              >
                {k === "del" ? (
                  <span className="inline-flex items-center gap-2 justify-center">
                    <IconDelete /> <span className="text-sm">Del</span>
                  </span>
                ) : (
                  k
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <button onClick={onNext} className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold">
          Continue to X1.4
        </button>
      </div>
    </div>
  );
}

function X14Message({
  f,
  onPatch,
  onNext,
  onEditAmount,
}: {
  f: Flow;
  onPatch: (p: Partial<Flow>) => void;
  onNext: () => void;
  onEditAmount: () => void;
}) {
  const remaining = MAX_LEN - f.message.length;
  const privacySummary = privacyLabel(f.privacy);

  function pickEmoji(e: string | null) {
    onPatch({ emoji: e });
  }

  function setMessage(v: string) {
    onPatch({ message: clampMessage(v) });
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    const msg = applyVars(t.body, { name: f.proName, venue: f.venue });
    onPatch({ message: clampMessage(msg), emoji: t.emoji ?? f.emoji });
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">X1.4 · Add message</div>
          <div className="text-sm text-gray-500 mt-0.5">Optional note and privacy.</div>
        </div>
        <button onClick={onEditAmount} className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Edit amount
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">To {f.proName}</div>
            <div className="text-xs text-gray-500 mt-0.5">Visibility: {privacySummary}</div>
          </div>
          <div className="text-2xl">{f.emoji ?? ""}</div>
        </div>
        <div className="mt-3 text-sm text-gray-800">{f.message ? `“${f.message.trim()}”` : <span className="text-gray-400">No message</span>}</div>
      </div>

      {/* Emoji */}
      <div className="mt-4">
        <div className="text-xs text-gray-500">Emoji</div>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {EMOJIS.map((e) => {
            const on = f.emoji === e;
            return (
              <button
                key={e}
                onClick={() => pickEmoji(e)}
                className={`h-12 rounded-2xl border text-2xl transition ${on ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
              >
                {e}
              </button>
            );
          })}
        </div>
        <button onClick={() => pickEmoji(null)} className="mt-2 w-full h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Clear emoji
        </button>
      </div>

      {/* Suggestions */}
      <div className="mt-4">
        <div className="text-xs text-gray-500">Quick suggestions</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((x) => (
            <button
              key={x}
              onClick={() => setMessage(x)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold hover:bg-gray-100"
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      {/* Templates */}
      <div className="mt-4">
        <div className="text-xs text-gray-500">Templates</div>
        <div className="mt-2 space-y-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.title}
              onClick={() => applyTemplate(t)}
              className="w-full rounded-3xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold inline-flex items-center gap-2">
                    {t.emoji ? <span className="text-lg">{t.emoji}</span> : null}
                    <span>{t.title}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{t.body}</div>
                </div>
                <IconChevron />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div className="mt-4 rounded-3xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm font-semibold">Your note</div>
          <div className={`text-xs font-semibold ${remaining < 10 ? "text-amber-700" : "text-gray-500"}`}>{remaining} left</div>
        </div>
        <div className="p-3 bg-white">
          <textarea
            value={f.message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Say something nice…"
            className="w-full min-h-[110px] resize-none outline-none text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">No links. Be respectful.</div>
            <button
              onClick={() => navigator.clipboard?.writeText(f.message)}
              className="h-9 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              <span className="inline-flex items-center gap-2">
                <IconCopy /> Copy
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Privacy</div>
            <div className="text-sm text-gray-500 mt-0.5">Visibility: {privacySummary}</div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">{privacySummary}</span>
        </div>

        <div className="mt-3 space-y-2">
          <RadioRow
            title="Private"
            subtitle="Only you can see this note"
            checked={f.privacy === "Private"}
            onClick={() => onPatch({ privacy: "Private", showOnShareableReceipt: false })}
            icon={<IconLock />}
          />
          <RadioRow
            title="Pro only"
            subtitle="Pro can see it in their dashboard"
            checked={f.privacy === "ProOnly"}
            onClick={() => onPatch({ privacy: "ProOnly" })}
            icon={<IconShield />}
          />
          <RadioRow
            title="Receipt"
            subtitle="Show note on shareable receipt link"
            checked={f.privacy === "Receipt"}
            onClick={() => onPatch({ privacy: "Receipt", showOnShareableReceipt: true })}
            icon={<IconReceipt />}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <ToggleRow
            title="Show on receipt"
            subtitle="When you share receipt"
            checked={f.showOnShareableReceipt}
            onChange={() => {
              const next = !f.showOnShareableReceipt;
              onPatch({ showOnShareableReceipt: next, privacy: next ? "Receipt" : f.privacy });
            }}
          />
          <ToggleRow
            title="Allow pro reply"
            subtitle="Enable thanks message"
            checked={f.allowProReply}
            onChange={() => onPatch({ allowProReply: !f.allowProReply })}
          />
        </div>

        <div className="mt-2">
          <ToggleRow
            title="Save as template"
            subtitle="Reuse message later"
            checked={f.saveAsTemplate}
            onChange={() => onPatch({ saveAsTemplate: !f.saveAsTemplate })}
          />
        </div>
      </div>

      <div className="mt-4">
        <button onClick={onNext} className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold">
          Continue to X1.5
        </button>
      </div>
    </div>
  );
}

function X15Confirm({
  f,
  fee,
  total,
  submit,
  onEditAmount,
  onEditMessage,
  onPatch,
  onSubmit,
  onRetry,
  onGoDispute,
}: {
  f: Flow;
  fee: number;
  total: number;
  submit: SubmitState;
  onEditAmount: () => void;
  onEditMessage: () => void;
  onPatch: (p: Partial<Flow>) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onGoDispute: () => void;
}) {
  const privacySummary = privacyLabel(f.privacy);
  const methods: PaymentMethod[] = [
    { brand: "Visa", last4: "2140", exp: "08/28", token: "pm_mock_2140" },
    { brand: "Mastercard", last4: "1109", exp: "01/29", token: "pm_mock_1109" },
    { brand: "Amex", last4: "0005", exp: "12/27", token: "pm_mock_0005" },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">X1.5 · Review & pay</div>
          <div className="text-sm text-gray-500 mt-0.5">Confirm details and send tip.</div>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">USD</span>
      </div>

      <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Payment</div>
            <div className="text-xs text-gray-500 mt-0.5">Total charged today</div>
          </div>
          <button onClick={onEditAmount} className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            Edit amount
          </button>
        </div>
        <div className="mt-3 space-y-2">
          <Line label="Tip amount" value={money(f.tipAmount)} />
          <Line label="Platform fee" value={money(fee)} hint="Secure processing" />
          <div className="h-px bg-gray-200" />
          <Line label="You pay" value={money(total)} strong />
        </div>
      </div>

      <div className="mt-3 rounded-3xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Payment method</div>
          <span className="text-xs text-gray-500">Select</span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {methods.map((m) => {
            const on = f.method.token === m.token;
            return (
              <button
                key={m.token}
                onClick={() => onPatch({ method: m })}
                className={`w-full rounded-3xl border p-4 text-left transition ${on ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${on ? "border-white/20 bg-white/10" : "border-gray-200 bg-gray-50"}`}>
                      <IconCard />
                    </div>
                    <div>
                      <div className="font-semibold">{m.brand}</div>
                      <div className={`text-sm mt-0.5 ${on ? "text-white/80" : "text-gray-600"}`}>•••• {m.last4} · Exp {m.exp}</div>
                    </div>
                  </div>
                  <div className={`mt-2 w-6 h-6 rounded-full border flex items-center justify-center ${on ? "border-white/30" : "border-gray-300"}`}>
                    {on ? <div className="w-3 h-3 rounded-full bg-white" /> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <button onClick={() => alert("Add new card (mock)")} className="mt-2 w-full h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          + Add new card
        </button>
      </div>

      <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">Message</div>
            <div className="text-sm text-gray-600 mt-0.5">Visibility: {privacySummary}</div>
          </div>
          <button onClick={onEditMessage} className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            Edit message
          </button>
        </div>
        <div className="mt-3 rounded-3xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">To {f.proName}</div>
              <div className="text-xs text-gray-500 mt-0.5">Receipt {f.receiptNo} · {privacySummary}</div>
            </div>
            <div className="text-2xl">{f.emoji ?? ""}</div>
          </div>
          <div className="mt-3 text-sm text-gray-800">{f.message ? `“${f.message.trim()}”` : <span className="text-gray-400">No message</span>}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="font-semibold">Options</div>
        <div className="text-sm text-gray-500 mt-0.5">Improve your experience.</div>
        <div className="mt-3 space-y-2">
          <ToggleRow title="Add to favorites" subtitle="Follow this pro" checked={f.addToFavorites} onChange={() => onPatch({ addToFavorites: !f.addToFavorites })} />
          <ToggleRow title="Email me the receipt" subtitle="Send a copy" checked={f.sendReceiptEmail} onChange={() => onPatch({ sendReceiptEmail: !f.sendReceiptEmail })} />
          <ToggleRow title="Allow pro reply" subtitle="Let them thank you" checked={f.allowProReply} onChange={() => onPatch({ allowProReply: !f.allowProReply })} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onEditMessage} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submit === "processing" || submit === "success"}
          className={`h-12 rounded-2xl font-semibold ${submit === "processing" || submit === "success" ? "bg-gray-100 text-gray-400" : "bg-gray-900 text-white"}`}
        >
          {submit === "processing" ? "Processing…" : submit === "success" ? "Sent" : "Send tip"}
        </button>
      </div>

      {submit === "failed" ? (
        <div className="mt-3 rounded-3xl border border-red-100 bg-red-50 p-4">
          <div className="font-semibold text-red-800">Tip failed</div>
          <div className="text-sm text-red-700/80 mt-1">Mock failure state. Try another card or retry.</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={onGoDispute} className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
              Report (X4.2)
            </button>
            <button onClick={onRetry} className="h-11 rounded-2xl bg-gray-900 text-white font-semibold">
              Retry
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">Mock fail trigger: amount ends with .13 OR message contains “fail”.</div>
        </div>
      ) : null}
    </div>
  );
}

function Line({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className={`text-sm ${strong ? "font-semibold" : "text-gray-700"}`}>{label}</div>
        {hint ? <div className="text-xs text-gray-500 mt-0.5">{hint}</div> : null}
      </div>
      <div className={`text-sm ${strong ? "font-semibold" : "font-semibold text-gray-800"}`}>{value}</div>
    </div>
  );
}

function X26Success({
  f,
  total,
  fee,
  onNewTip,
  onOpenReceipt,
}: {
  f: Flow;
  total: number;
  fee: number;
  onNewTip: () => void;
  onOpenReceipt: () => void;
}) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => (p + 1) % 100000), 1600);
    return () => clearInterval(t);
  }, []);

  const shareText = useMemo(() => {
    const base = `I tipped ${f.proName} ${money(f.tipAmount)} via Digital Tipping.`;
    return base;
  }, [f.proName, f.tipAmount]);

  function shareNative() {
    // Best-effort share
    const anyNav = navigator as any;
    if (anyNav?.share) {
      anyNav
        .share({ title: "Tip receipt", text: shareText })
        .catch(() => {
          // ignore
        });
      return;
    }
    navigator.clipboard?.writeText(shareText);
    alert("Copied share text (mock)");
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 overflow-hidden relative">
      <div className="absolute -top-20 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-emerald-200/60 to-cyan-200/40 blur-2xl" />
      <div className="absolute -bottom-24 -left-20 w-60 h-60 rounded-full bg-gradient-to-br from-blue-200/40 to-emerald-200/40 blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">X2.6 · Tip success</div>
            <div className="text-sm text-gray-500 mt-0.5">Your tip has been sent.</div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 font-semibold text-emerald-800">Success</span>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <div className="relative">
            <div key={pulse} className="successRing" />
            <div className="w-20 h-20 rounded-[28px] bg-gray-900 text-white flex items-center justify-center">
              <IconCheckBig />
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">You tipped</div>
              <div className="text-2xl font-semibold mt-1">{money(f.tipAmount)}</div>
              <div className="text-sm text-gray-600 mt-1">
                To <b>{f.proName}</b> · {f.proRole}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Charged</div>
              <div className="text-lg font-semibold mt-1">{money(total)}</div>
              <div className="text-xs text-gray-500 mt-1">Fee {money(fee)}</div>
            </div>
          </div>

          <div className="mt-3">
            <Pill label={`Receipt ${f.receiptNo}`} />
          </div>

          {f.message ? (
            <div className="mt-3 rounded-3xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Your note</div>
                  <div className="text-xs text-gray-500 mt-0.5">Visibility: {privacyLabel(f.privacy)}</div>
                </div>
                <div className="text-2xl">{f.emoji ?? ""}</div>
              </div>
              <div className="mt-2 text-sm text-gray-800">“{f.message.trim()}”</div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onOpenReceipt} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            View receipt
          </button>
          <button onClick={shareNative} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
            Share
          </button>
        </div>

        <button onClick={onNewTip} className="mt-2 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Tip again
        </button>

        <div className="mt-3 text-xs text-gray-500">Production: deep link to X3.2 Shareable Receipts and X4.5 Refund Tracking.</div>
      </div>
    </div>
  );
}

function RadioRow({
  title,
  subtitle,
  checked,
  onClick,
  icon,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-3xl border p-4 text-left transition ${checked ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${checked ? "border-white/20 bg-white/10" : "border-gray-200 bg-gray-50"}`}>{icon}</div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className={`text-sm mt-0.5 ${checked ? "text-white/80" : "text-gray-600"}`}>{subtitle}</div>
          </div>
        </div>
        <div className={`mt-2 w-6 h-6 rounded-full border flex items-center justify-center ${checked ? "border-white/30" : "border-gray-300"}`}>
          {checked ? <div className="w-3 h-3 rounded-full bg-white" /> : null}
        </div>
      </div>
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
    <button onClick={onChange} className="w-full rounded-3xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-600 mt-0.5">{subtitle}</div>
        </div>
        <div className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </div>
    </button>
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

function StyleBlock() {
  return (
    <style>{`
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }
      /* light scrollbar */
      ::-webkit-scrollbar{ width:10px; height:10px; }
      ::-webkit-scrollbar-thumb{ background: rgba(0,0,0,.12); border-radius: 999px; border: 3px solid rgba(255,255,255,.9); }

      .successRing{
        position:absolute;
        inset:-14px;
        border-radius: 999px;
        border: 2px solid rgba(16,185,129,.35);
        animation: ringPulse 1.2s ease-out;
      }
      @keyframes ringPulse{
        0%{ transform: scale(.85); opacity:.0; }
        20%{ opacity:.55; }
        100%{ transform: scale(1.15); opacity:0; }
      }
    `}</style>
  );
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

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 9h10v10H9V9Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
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

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 11h12v10H6V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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

function IconReceipt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7h6M9 11h6M9 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h18v10H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function IconCheckBig() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
