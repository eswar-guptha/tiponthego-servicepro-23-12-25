import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Gift,
  Info,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

/**
 * X2.5 — Tip Confirmation (Pre‑Checkout, USD)
 * SAFE BUILD: No shadcn/ui imports, uses native inputs so it won't fail if UI components are missing.
 */

type PaymentMethod = "apple" | "wallet" | "card";

type Pro = {
  name: string;
  role: string;
  verified: boolean;
  rating: number;
  image: string;
};

const DEMO_PRO: Pro = {
  name: "Alex Johnson",
  role: "Street Performer",
  verified: true,
  rating: 4.9,
  image: "https://i.pravatar.cc/240?img=12",
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function computeFee(amount: number) {
  // UI fee model: 7.5% + $0.25 capped at $7.50
  const pct = 0.075;
  const fixed = 0.25;
  const raw = amount * pct + fixed;
  const capped = Math.min(raw, 7.5);
  return Math.round(capped * 100) / 100;
}

function sanitizeDecimal(v: string) {
  return v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
}

// Dev checks (no test runner needed)
function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money format");
    console.assert(clamp(-1, 1, 10) === 1, "clamp low");
    console.assert(clamp(99, 1, 10) === 10, "clamp high");
    console.assert(sanitizeDecimal("12..3") === "12.3", "sanitize");
    console.assert(computeFee(10) > 0, "fee positive");
    console.assert(computeFee(200) <= 7.5, "fee capped");
  } catch {
    // never crash UI
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function TipConfirmationScreen() {
  const preset = useMemo(() => [2, 5, 10, 20, 50], []);
  const reactions = useMemo(() => ["👏", "🔥", "⭐", "❤️", "🙌"], []);

  const [amountPreset, setAmountPreset] = useState(5);
  const [amountCustom, setAmountCustom] = useState("");
  const [emoji, setEmoji] = useState("👏");
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("apple");

  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    off: number;
  } | null>(null);

  const [isPaying, setIsPaying] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // Scroll indicator
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({ size: 0.35, top: 0 }));

  const amountValue = useMemo(() => {
    const c = amountCustom.trim();
    if (!c) return amountPreset;
    const n = Number(c);
    if (!Number.isFinite(n)) return amountPreset;
    return n;
  }, [amountCustom, amountPreset]);

  const amount = useMemo(
    () => clamp(Math.round(amountValue * 100) / 100, 1, 500),
    [amountValue]
  );
  const fee = useMemo(() => computeFee(amount), [amount]);
  const discount = useMemo(
    () => (promoApplied ? promoApplied.off : 0),
    [promoApplied]
  );
  const total = useMemo(
    () => clamp(amount + fee - discount, 0, 9999),
    [amount, fee, discount]
  );

  const paymentLabel = useMemo(() => {
    if (payment === "apple") return "Apple/Google Pay";
    if (payment === "wallet") return "Wallet Balance";
    return "Card";
  }, [payment]);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
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

  function selectPreset(amt: number) {
    setAmountPreset(amt);
    setAmountCustom("");
  }

  function applyPromo() {
    const c = promoCode.trim().toUpperCase();
    if (c === "WELCOME1") {
      setPromoApplied({ code: c, off: 1 });
    } else if (c === "TIP5") {
      setPromoApplied({ code: c, off: 5 });
    } else {
      alert("Invalid code (mock). Try WELCOME1 or TIP5");
      return;
    }
    setPromoOpen(false);
  }

  async function confirmPay() {
    if (isPaying) return;
    setIsPaying(true);
    await new Promise((r) => setTimeout(r, 950));
    setIsPaying(false);
    setSuccessOpen(true);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X2.4 / X2.3")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">
            X2.5 · Tip Confirmation
          </div>
          <button
            onClick={() => alert("Close (mock)")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Scrollable content */}
        <div
          ref={pageRef}
          className="max-w-md mx-auto px-4 pt-4 pb-28 h-[calc(100vh-64px)] overflow-y-auto pr-5"
        >
          {/* Pro summary */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <img
                src={DEMO_PRO.image}
                alt={DEMO_PRO.name}
                className="w-14 h-14 rounded-2xl object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-lg truncate">
                    {DEMO_PRO.name}
                  </div>
                  {DEMO_PRO.verified && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">{DEMO_PRO.role}</div>
                <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-yellow-500">★</span> {DEMO_PRO.rating}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Secure payment
                  </span>
                  <span>·</span>
                  <span>USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Tip amount</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Choose preset or enter custom (USD)
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {money(amount)}
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {preset.map((amt) => {
                const active = !amountCustom && amountPreset === amt;
                return (
                  <button
                    key={amt}
                    onClick={() => selectPreset(amt)}
                    className={`px-4 py-2 rounded-full border text-sm font-semibold transition active:scale-[0.98] ${
                      active
                        ? "bg-yellow-400 border-yellow-400 text-black"
                        : "border-blue-200 text-blue-700 hover:bg-blue-50"
                    }`}
                    aria-pressed={active}
                  >
                    ${amt}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-[110px_1fr] gap-2 items-center">
              <div className="text-sm text-gray-500">Custom</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </span>
                <input
                  value={amountCustom}
                  onChange={(e) =>
                    setAmountCustom(sanitizeDecimal(e.target.value))
                  }
                  inputMode="decimal"
                  placeholder="Enter amount"
                  className="w-full h-11 rounded-xl border border-gray-200 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Min $1 · Max $500
            </div>
          </div>

          {/* Appreciation */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="font-semibold">Add appreciation</div>
            <div className="text-xs text-gray-500 mt-0.5">
              Optional emoji + message
            </div>

            <div className="mt-3 flex gap-2">
              {reactions.map((e) => {
                const active = emoji === e;
                return (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-2xl transition active:scale-[0.98] ${
                      active
                        ? "border-blue-400 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    aria-pressed={active}
                  >
                    {e}
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 140))}
                placeholder="Say thanks (optional)"
                className="w-full min-h-[88px] rounded-2xl border border-gray-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>Keep it kind · Visible to the pro</span>
                <span>{message.length}/140</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Payment method</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Fast and secure
                </div>
              </div>
              <span className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-gray-700">
                {paymentLabel}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <PayCard
                active={payment === "apple"}
                title="Apple/Google"
                subtitle="Fastest"
                icon={<BadgeCheck className="w-4 h-4" />}
                onClick={() => setPayment("apple")}
              />
              <PayCard
                active={payment === "wallet"}
                title="Wallet"
                subtitle="Balance"
                icon={<Wallet className="w-4 h-4" />}
                onClick={() => setPayment("wallet")}
              />
              <PayCard
                active={payment === "card"}
                title="Card"
                subtitle="Fallback"
                icon={<CreditCard className="w-4 h-4" />}
                onClick={() => setPayment("card")}
              />
            </div>

            {payment === "wallet" && (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-800">
                Wallet balance: <span className="font-semibold">$18.40</span>{" "}
                (mock)
              </div>
            )}
          </div>

          {/* Promo */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Promo</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Optional discount code
                </div>
              </div>
              {promoApplied ? (
                <div className="text-xs bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full text-emerald-800">
                  {promoApplied.code} · −{money(promoApplied.off)}
                </div>
              ) : (
                <div className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-gray-700">
                  None
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setPromoOpen(true)}
                className="h-11 px-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-semibold inline-flex items-center"
              >
                <Gift className="w-4 h-4 mr-2" /> Add promo
              </button>

              {promoApplied && (
                <button
                  onClick={() => setPromoApplied(null)}
                  className="text-sm text-gray-600 underline hover:text-gray-900"
                >
                  Remove
                </button>
              )}

              <div className="ml-auto text-[11px] text-gray-500">
                Try: WELCOME1 or TIP5
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Summary</div>
              <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" /> Receipt generated
              </span>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <Row label="Tip" value={money(amount)} />
              <Row
                label={
                  <span className="inline-flex items-center gap-1">
                    Platform fee
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100">
                      <Info className="w-3.5 h-3.5 text-gray-600" />
                    </span>
                  </span>
                }
                value={money(fee)}
              />
              {discount > 0 && (
                <Row
                  label={<span className="text-emerald-700">Promo</span>}
                  value={
                    <span className="text-emerald-700">−{money(discount)}</span>
                  }
                />
              )}
              <div className="pt-2 border-t" />
              <Row
                label={<span className="font-semibold">Total</span>}
                value={<span className="font-semibold">{money(total)}</span>}
              />
            </div>

            <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-semibold">Protected tip</div>
                <div className="mt-0.5">
                  We monitor fraud and disputes. Never share payment details.
                </div>
              </div>
            </div>
          </div>

          <div className="h-6" />
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

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-3 flex items-center gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">Total</div>
              <div className="text-xs text-gray-500">USD · {paymentLabel}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-semibold">{money(total)}</div>
              <div className="text-[11px] text-gray-500">Fee included</div>
            </div>
            <button
              onClick={confirmPay}
              disabled={isPaying}
              className="ml-2 h-12 px-4 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 disabled:opacity-60"
            >
              {isPaying ? "Processing…" : "Confirm & Pay"}
            </button>
          </div>
        </div>
      </div>

      {/* Promo modal */}
      <AnimatePresence>
        {promoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/45"
              onClick={() => setPromoOpen(false)}
            />
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">Add promo</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Enter a discount code
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  onClick={() => setPromoOpen(false)}
                  aria-label="Close promo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Code</div>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="WELCOME1"
                  className="w-full h-11 rounded-2xl border border-gray-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="text-[11px] text-gray-500">
                  Mock codes: WELCOME1 ($1 off) · TIP5 ($5 off)
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  className="h-12 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 font-semibold"
                  onClick={() => setPromoOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
                  onClick={applyPromo}
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success overlay (next: X2.6) */}
      <AnimatePresence>
        {successOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/45"
              onClick={() => setSuccessOpen(false)}
            />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {[...Array(14)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: (i % 5) * 80 - 160,
                    y: 220,
                    opacity: 0,
                    rotate: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    x: (i % 5) * 90 - 180 + ((i * 13) % 60),
                    y: -220 - ((i * 21) % 140),
                    opacity: [0, 1, 0],
                    rotate: 360,
                    scale: [0.9, 1.1, 0.9],
                  }}
                  transition={{
                    duration: 1.15,
                    delay: i * 0.02,
                    ease: "easeOut",
                  }}
                  className="absolute left-1/2 top-1/2 text-2xl"
                >
                  <span className="drop-shadow">{emoji}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 200, damping: 18 }}
              className="relative w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        Payment confirmed
                      </div>
                      <div className="text-sm text-gray-500">
                        You’re ready to tip {DEMO_PRO.name}.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSuccessOpen(false)}
                    className="w-9 h-9 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-semibold">{money(total)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-600">Method</span>
                    <span className="font-semibold">{paymentLabel}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    className="h-12 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 font-semibold"
                    onClick={() => {
                      setSuccessOpen(false);
                      alert("Next: X2.6 – Tip Success (mock route)");
                    }}
                  >
                    Continue
                  </button>
                  <button
                    className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
                    onClick={() => {
                      setSuccessOpen(false);
                      alert("Shortcut: X1.2 – Tip Receipt (mock route)");
                    }}
                  >
                    View Receipt
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500 inline-flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Mock overlay · Next screen: X2.6</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PayCard({
  active,
  title,
  subtitle,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
        active
          ? "border-blue-400 bg-blue-50"
          : "border-gray-200 hover:bg-gray-50"
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-800">{icon}</span>
        <div className="text-xs font-semibold text-gray-900">{title}</div>
      </div>
      <div className="text-[11px] text-gray-500 mt-1">{subtitle}</div>
    </button>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-gray-600">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
