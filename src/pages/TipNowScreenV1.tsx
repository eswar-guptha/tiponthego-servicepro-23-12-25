import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CreditCard, Wallet, Apple, X } from "lucide-react";

/**
 * Digital Tipping – X1.1 Tip Now (Interactive Mock)
 * - Amount chips + custom amount
 * - Emoji selection
 * - Message
 * - Payment method selection
 * - Send tip -> loading -> success overlay
 */

export default function TipNowScreenV1() {
  const presetAmounts = [2, 5, 10, 20, 50];
  const emojis = ["🎉", "👏", "❤️", "🔥", "🙌", "⭐"];

  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedEmoji, setSelectedEmoji] = useState<string>("🎉");
  const [message, setMessage] = useState<string>("");
  const [payment, setPayment] = useState<"apple" | "wallet" | "card">("apple");

  const [isSending, setIsSending] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const amountValue = useMemo(() => {
    const c = customAmount.trim();
    if (!c) return selectedAmount;
    const n = Number(c);
    if (!Number.isFinite(n)) return selectedAmount;
    return n;
  }, [customAmount, selectedAmount]);

  const amountClamped = useMemo(() => {
    // Product rule: min $1, max $500
    const n = Math.max(1, Math.min(500, amountValue));
    return Math.round(n * 100) / 100;
  }, [amountValue]);

  const amountLabel = useMemo(() => {
    // Always show 2 decimals for payments
    return `$${amountClamped.toFixed(2)}`;
  }, [amountClamped]);

  const helperFeeText = useMemo(() => {
    // Simple mock: fee included, show a subtle estimate (not required, but boosts trust)
    const estFee = Math.round(amountClamped * 0.1 * 100) / 100; // 10% example
    return `Secure payment · Platform fee included (est. $${estFee.toFixed(
      2
    )})`;
  }, [amountClamped]);

  function onSelectPreset(amt: number) {
    setSelectedAmount(amt);
    setCustomAmount("");
  }

  function onCustomChange(v: string) {
    // Keep only digits + single dot
    const cleaned = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setCustomAmount(cleaned);
  }

  async function handleSend() {
    if (isSending) return;
    setIsSending(true);

    // Simulated payment processing
    await new Promise((r) => setTimeout(r, 900));

    setIsSending(false);
    setSuccessOpen(true);
  }

  function resetAfterSuccess() {
    setSuccessOpen(false);
    // keep state (real apps keep last selection), but you can reset if needed
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500 flex items-end justify-center p-4">
      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: 420 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
        className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
      >
        {/* Pro Identity */}
        <div className="flex items-center gap-3 p-4 border-b">
          <img
            src="https://i.pravatar.cc/120?img=12"
            alt="Pro"
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="font-semibold text-lg leading-tight">
              Alex Johnson
            </div>
            <div className="text-sm text-gray-500">
              Street Performer · 0.2 mi ·{" "}
              <span className="text-yellow-500">★</span> 4.9
            </div>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        </div>

        <CardContent className="space-y-5 p-4">
          {/* Tip Amount */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Choose Tip Amount</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {presetAmounts.map((amt) => {
                const active = !customAmount && selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    onClick={() => onSelectPreset(amt)}
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

            {/* Custom Amount */}
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500 w-24">Custom</div>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  $
                </span>
                <Input
                  value={customAmount}
                  onChange={(e) => onCustomChange(e.target.value)}
                  inputMode="decimal"
                  placeholder="Enter amount"
                  className="pl-7 rounded-xl"
                />
              </div>
              <div className="text-xs text-gray-500 w-20 text-right">
                $1–$500
              </div>
            </div>
          </div>

          {/* Emoji Appreciation */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Add appreciation (optional)
            </div>
            <div className="flex gap-2">
              {emojis.map((emoji) => {
                const active = selectedEmoji === emoji;
                return (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-2xl transition active:scale-[0.98] ${
                      active
                        ? "border-blue-400 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                    aria-label={`Select ${emoji}`}
                    aria-pressed={active}
                  >
                    <span className={active ? "" : "opacity-90"}>{emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Message (optional)</div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 140))}
              placeholder="Say thanks (optional)"
              className="rounded-2xl min-h-[92px]"
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{helperFeeText}</span>
              <span>{message.length}/140</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Payment</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPayment("apple")}
                className={`rounded-2xl border p-3 text-left transition ${
                  payment === "apple"
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Apple className="w-4 h-4" />
                  <div className="text-xs font-semibold">Apple/Google</div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Fastest</div>
              </button>

              <button
                onClick={() => setPayment("wallet")}
                className={`rounded-2xl border p-3 text-left transition ${
                  payment === "wallet"
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  <div className="text-xs font-semibold">Wallet</div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Balance</div>
              </button>

              <button
                onClick={() => setPayment("card")}
                className={`rounded-2xl border p-3 text-left transition ${
                  payment === "card"
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <div className="text-xs font-semibold">Card</div>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Fallback</div>
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-1">
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
            >
              {isSending ? "Processing…" : `Send Tip ${amountLabel}`}
            </Button>
            <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Paying with{" "}
                <span className="font-medium text-gray-700">
                  {payment === "apple"
                    ? "Apple/Google Pay"
                    : payment === "wallet"
                    ? "Wallet"
                    : "Card"}
                </span>
              </span>
              <span className="font-medium text-gray-700">{selectedEmoji}</span>
            </div>
          </div>
        </CardContent>
      </motion.div>

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {successOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={resetAfterSuccess}
            />

            {/* Confetti-like emoji particles (lightweight mock) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: (i % 4) * 80 - 120,
                    y: 220,
                    opacity: 0,
                    rotate: 0,
                    scale: 0.9,
                  }}
                  animate={{
                    x: (i % 4) * 90 - 160 + ((i * 7) % 60),
                    y: -220 - ((i * 18) % 120),
                    opacity: [0, 1, 0],
                    rotate: 360,
                    scale: [0.9, 1.1, 0.9],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.02,
                    ease: "easeOut",
                  }}
                  className="absolute left-1/2 top-1/2 text-2xl"
                >
                  {selectedEmoji}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ y: 18, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              className="relative w-full max-w-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">Tip sent!</div>
                      <div className="text-sm text-gray-500">
                        Alex just received your {amountLabel} {selectedEmoji}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={resetAfterSuccess}
                    className="w-9 h-9 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      // Keep overlay open briefly then close to simulate repeat action
                      setSuccessOpen(false);
                    }}
                    className="h-12 rounded-2xl"
                    variant="secondary"
                  >
                    Tip again
                  </Button>
                  <Button
                    onClick={resetAfterSuccess}
                    className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                  >
                    Save as favorite
                  </Button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Receipt:{" "}
                  <span className="font-medium text-gray-700">#TXN-</span>
                  <span className="font-medium text-gray-700">
                    {String(Date.now()).slice(-6)}
                  </span>
                  <span className="mx-2">·</span>
                  Paid via{" "}
                  <span className="font-medium text-gray-700">
                    {payment === "apple"
                      ? "Apple/Google Pay"
                      : payment === "wallet"
                      ? "Wallet"
                      : "Card"}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
