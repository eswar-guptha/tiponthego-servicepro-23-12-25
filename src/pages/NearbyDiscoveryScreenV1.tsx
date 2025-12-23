import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Wallet,
  Apple,
  X,
  MapPin,
  Search,
  SlidersHorizontal,
  QrCode,
  Heart,
  ArrowLeft,
} from "lucide-react";

/**
 * Digital Tipping – X2.1 Nearby Discovery (Interactive Mock)
 * - Search + radius
 * - List/Map toggle (mock)
 * - Pro cards with Tip CTA
 * - Opens X1.1 Tip Now bottom sheet (interactive)
 */

type Pro = {
  id: string;
  name: string;
  role: string;
  distanceMi: number;
  rating: number;
  verified: boolean;
  avgTip: number;
  tags: string[];
  image: string;
};

const PROS: Pro[] = [
  {
    id: "p1",
    name: "Alex Johnson",
    role: "Street Performer",
    distanceMi: 0.2,
    rating: 4.9,
    verified: true,
    avgTip: 6.5,
    tags: ["Live", "Popular"],
    image: "https://i.pravatar.cc/240?img=12",
  },
  {
    id: "p2",
    name: "Maya Chen",
    role: "Coffee Barista",
    distanceMi: 0.6,
    rating: 4.8,
    verified: true,
    avgTip: 4.25,
    tags: ["Nearby"],
    image: "https://i.pravatar.cc/240?img=32",
  },
  {
    id: "p3",
    name: "Diego Rivera",
    role: "Delivery Partner",
    distanceMi: 1.4,
    rating: 4.7,
    verified: false,
    avgTip: 3.8,
    tags: ["Fast"],
    image: "https://i.pravatar.cc/240?img=54",
  },
  {
    id: "p4",
    name: "Sara Williams",
    role: "Fitness Coach",
    distanceMi: 2.1,
    rating: 4.9,
    verified: true,
    avgTip: 9.75,
    tags: ["Top Rated"],
    image: "https://i.pravatar.cc/240?img=47",
  },
  {
    id: "p5",
    name: "Noah Patel",
    role: "Street Musician",
    distanceMi: 0.9,
    rating: 4.6,
    verified: false,
    avgTip: 5.1,
    tags: ["Live"],
    image: "https://i.pravatar.cc/240?img=8",
  },
];

export default function NearbyDiscoveryScreenV1() {
  const [query, setQuery] = useState("");
  const [radiusMi, setRadiusMi] = useState(5);
  const [view, setView] = useState<"list" | "map">("list");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Tip flow state
  const [tipOpen, setTipOpen] = useState(false);
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROS.filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const within = p.distanceMi <= radiusMi;
      return matchesQ && within;
    }).sort((a, b) => a.distanceMi - b.distanceMi);
  }, [query, radiusMi]);

  function openTip(pro: Pro) {
    setSelectedPro(pro);
    setTipOpen(true);
  }

  function toggleFav(id: string) {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      {/* Header */}
      <div className="max-w-md mx-auto px-4 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/90 text-xs flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Downtown · Auto location</span>
            </div>
            <div className="text-white text-2xl font-semibold mt-1">
              Nearby Pros
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="rounded-2xl bg-white/15 text-white border border-white/20 hover:bg-white/20"
              onClick={() => setView(view === "list" ? "map" : "list")}
            >
              {view === "list" ? "Map" : "List"}
            </Button>
            <Button
              className="rounded-2xl bg-white text-blue-700 hover:bg-white/90"
              onClick={() => {
                // Mock action: QR scan entry
                // In a real app, this opens X2.2 QR Scan
                alert("QR Scan (mock) – Next screen X2.2");
              }}
            >
              <QrCode className="w-4 h-4 mr-2" /> Scan
            </Button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mt-4 grid grid-cols-1 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search: barista, performer, coach…"
              className="pl-9 rounded-2xl bg-white/15 text-white placeholder:text-white/70 border-white/20 focus-visible:ring-white/30"
            />
          </div>

          <div className="bg-white/15 border border-white/20 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <div className="text-white text-sm font-medium flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Radius
              </div>
              <div className="text-white/90 text-sm">{radiusMi} mi</div>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              value={radiusMi}
              onChange={(e) => setRadiusMi(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="flex justify-between text-[11px] text-white/70 mt-1">
              <span>1</span>
              <span>25</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pb-28">
        {/* Map View (mock) */}
        {view === "map" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/15 border border-white/20 rounded-3xl p-4"
          >
            <div className="text-white font-semibold">Map View (Mock)</div>
            <div className="text-white/80 text-sm mt-1">
              Pins are shown for filtered pros within {radiusMi} miles.
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {filtered.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => openTip(p)}
                  className="text-left bg-white rounded-2xl p-3 shadow-sm hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={p.image}
                      className="w-9 h-9 rounded-full object-cover"
                      alt={p.name}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {p.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {p.distanceMi.toFixed(1)} mi · ★ {p.rating}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">Tip now</div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {filtered.length === 0 ? (
              <div className="bg-white rounded-3xl p-5">
                <div className="font-semibold">No matches</div>
                <div className="text-sm text-gray-500 mt-1">
                  Try increasing radius or changing the search.
                </div>
              </div>
            ) : (
              filtered.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-14 h-14 rounded-2xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-lg truncate">
                            {p.name}
                          </div>
                          <button
                            onClick={() => toggleFav(p.id)}
                            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition ${
                              favorites[p.id]
                                ? "bg-pink-50 border-pink-200"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                            aria-label="Favorite"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favorites[p.id]
                                  ? "text-pink-500 fill-pink-500"
                                  : "text-gray-600"
                              }`}
                            />
                          </button>
                        </div>
                        <div className="text-sm text-gray-500">
                          {p.role} · {p.distanceMi.toFixed(1)} mi ·{" "}
                          <span className="text-yellow-500">★</span> {p.rating}
                        </div>

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {p.verified && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                          )}
                          {p.tags.map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100"
                            >
                              {t}
                            </span>
                          ))}
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                            Avg tip ${p.avgTip.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick tip row */}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex gap-2 overflow-x-auto">
                        {[2, 5, 10].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => openTip(p)}
                            className="px-3 py-2 rounded-full border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50"
                            aria-label={`Quick tip $${amt}`}
                          >
                            ${amt}
                          </button>
                        ))}
                      </div>
                      <Button
                        onClick={() => openTip(p)}
                        className="rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                      >
                        Tip Now
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom Nav (mock) */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-2 flex items-center justify-between">
            <button className="flex-1 py-3 rounded-2xl bg-white text-blue-700 font-semibold">
              Discover
            </button>
            <button
              className="flex-1 py-3 rounded-2xl text-white font-semibold hover:bg-white/10"
              onClick={() => alert("Wallet (mock) – Next screen X3.1")}
            >
              Wallet
            </button>
            <button
              className="flex-1 py-3 rounded-2xl text-white font-semibold hover:bg-white/10"
              onClick={() =>
                alert("Profile (mock) – Customer/Pro profile screens later")
              }
            >
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* TIP NOW SHEET (X1.1) */}
      <AnimatePresence>
        {tipOpen && selectedPro && (
          <TipNowSheet pro={selectedPro} onClose={() => setTipOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function TipNowSheet({ pro, onClose }: { pro: Pro; onClose: () => void }) {
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
    const n = Math.max(1, Math.min(500, amountValue));
    return Math.round(n * 100) / 100;
  }, [amountValue]);

  const amountLabel = useMemo(
    () => `$${amountClamped.toFixed(2)}`,
    [amountClamped]
  );

  const helperFeeText = useMemo(() => {
    const estFee = Math.round(amountClamped * 0.1 * 100) / 100;
    return `Secure payment · Platform fee included (est. $${estFee.toFixed(
      2
    )})`;
  }, [amountClamped]);

  function onSelectPreset(amt: number) {
    setSelectedAmount(amt);
    setCustomAmount("");
  }

  function onCustomChange(v: string) {
    const cleaned = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setCustomAmount(cleaned);
  }

  async function handleSend() {
    if (isSending) return;
    setIsSending(true);
    await new Promise((r) => setTimeout(r, 900));
    setIsSending(false);
    setSuccessOpen(true);
  }

  function resetAfterSuccess() {
    setSuccessOpen(false);
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/35"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: 420 }}
        animate={{ y: 0 }}
        exit={{ y: 420 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
      >
        {/* Sheet Header */}
        <div className="flex items-center gap-2 p-4 border-b">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <img
              src={pro.image}
              alt={pro.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="font-semibold text-lg leading-tight">
                {pro.name}
              </div>
              <div className="text-sm text-gray-500">
                {pro.role} · {pro.distanceMi.toFixed(1)} mi ·{" "}
                <span className="text-yellow-500">★</span> {pro.rating}
              </div>
            </div>
            {pro.verified && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            )}
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-4">
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

          {/* Emoji */}
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

          {/* Payment */}
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
        </div>

        {/* SUCCESS OVERLAY */}
        <AnimatePresence>
          {successOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30"
                onClick={resetAfterSuccess}
              />

              {/* Confetti-like emoji particles */}
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
                          {pro.name} just received your {amountLabel}{" "}
                          {selectedEmoji}
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
      </motion.div>
    </motion.div>
  );
}
