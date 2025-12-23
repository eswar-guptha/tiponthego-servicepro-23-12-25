import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  ChevronRight,
  Heart,
  MapPin,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";

/**
 * Screen Code: X2.3
 * Screen Name: Pro Mini Profile (Bottom Sheet)
 * Scope: Customer / Guest
 * Purpose:
 *  - Provide trust + context before tipping
 *  - Entry points: Map pin tap / List card tap / QR scan result
 * Interaction:
 *  - Tap a pro card → opens bottom sheet
 *  - Like (favorite) toggle
 *  - Tip Now → opens an embedded Tip Now bottom sheet (mock)
 *  - View Full Profile → mock alert (next: X2.4)
 */

type Pro = {
  id: string;
  name: string;
  role: string;
  distanceMi: number;
  rating: number;
  reviews: number;
  verified: boolean;
  safety: "basic" | "verified";
  avgTip: number;
  tags: string[];
  image: string;
  about: string;
  recentReactions: { emoji: string; label: string }[];
};

const PROS: Pro[] = [
  {
    id: "p1",
    name: "Alex Johnson",
    role: "Street Performer",
    distanceMi: 0.2,
    rating: 4.9,
    reviews: 312,
    verified: true,
    safety: "verified",
    avgTip: 6.5,
    tags: ["Live", "Popular"],
    image: "https://i.pravatar.cc/240?img=12",
    about:
      "Acoustic + beatbox. Performing nightly near the plaza. Tips help keep the music going.",
    recentReactions: [
      { emoji: "👏", label: "Great vibes" },
      { emoji: "🔥", label: "Amazing" },
      { emoji: "⭐", label: "5-star" },
    ],
  },
  {
    id: "p2",
    name: "Maya Chen",
    role: "Coffee Barista",
    distanceMi: 0.6,
    rating: 4.8,
    reviews: 198,
    verified: true,
    safety: "verified",
    avgTip: 4.25,
    tags: ["Nearby"],
    image: "https://i.pravatar.cc/240?img=32",
    about:
      "Latte art specialist. Ask for the seasonal menu — quick service, big smile.",
    recentReactions: [
      { emoji: "❤️", label: "So kind" },
      { emoji: "🙌", label: "Fast service" },
      { emoji: "🎉", label: "Made my day" },
    ],
  },
  {
    id: "p3",
    name: "Sara Williams",
    role: "Fitness Coach",
    distanceMi: 2.1,
    rating: 4.9,
    reviews: 421,
    verified: true,
    safety: "verified",
    avgTip: 9.75,
    tags: ["Top Rated"],
    image: "https://i.pravatar.cc/240?img=47",
    about:
      "Functional training + mobility. 30–45 min sessions. Tips support community classes.",
    recentReactions: [
      { emoji: "💪", label: "Motivating" },
      { emoji: "⭐", label: "Excellent" },
      { emoji: "🔥", label: "Hard but fun" },
    ],
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDistance(mi: number) {
  return mi < 1 ? `${Math.round(mi * 10) / 10} mi` : `${mi.toFixed(1)} mi`;
}

// Lightweight runtime checks (dev-only)
function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money should format to 2 decimals");
    console.assert(clamp(5, 1, 10) === 5, "clamp should keep in range");
    console.assert(clamp(-1, 1, 10) === 1, "clamp should clamp low");
    console.assert(clamp(99, 1, 10) === 10, "clamp should clamp high");
    console.assert(
      formatDistance(0.25).includes("mi"),
      "distance should include unit"
    );
  } catch {
    // never crash UI
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function ProMiniProfileScreen() {
  const [selected, setSelected] = useState<Pro | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);

  const presets = useMemo(() => [2, 5, 10, 20], []);

  function openSheet(p: Pro) {
    setSelected(p);
  }

  function closeSheet() {
    setSelected(null);
    setTipOpen(false);
  }

  function toggleFav(id: string) {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openTip() {
    setTipAmount(5);
    setTipOpen(true);
  }

  function sendTip() {
    const amt = clamp(tipAmount, 1, 500);
    alert(`Tip sent (mock) · ${money(amt)} to ${selected?.name}`);
    setTipOpen(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <div className="max-w-md mx-auto px-4 pt-6 pb-10">
        {/* Header */}
        <div className="text-white">
          <div className="text-xs text-white/85 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Screen: X2.3 · Pro Mini Profile</span>
          </div>
          <div className="text-2xl font-semibold mt-1">Tap a Pro</div>
          <div className="text-sm text-white/80 mt-1">
            Opens bottom sheet with trust + tip CTAs.
          </div>
        </div>

        {/* Pro cards (entry points) */}
        <div className="mt-5 space-y-3">
          {PROS.map((p) => {
            const fav = !!favorites[p.id];
            return (
              <button
                key={p.id}
                onClick={() => openSheet(p)}
                className="w-full text-left bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:bg-gray-50"
              >
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
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFav(p.id);
                          }}
                          className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition ${
                            fav
                              ? "bg-pink-50 border-pink-200"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                          }`}
                          aria-label="Favorite"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              fav
                                ? "text-pink-500 fill-pink-500"
                                : "text-gray-700"
                            }`}
                          />
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {p.role} · {formatDistance(p.distanceMi)}
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-100 inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> {p.rating} ({p.reviews}
                        )
                      </span>
                      {p.verified && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                        Avg tip {money(p.avgTip)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* X2.3 Bottom Sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/35"
              onClick={closeSheet}
            />

            <motion.div
              initial={{ y: 420 }}
              animate={{ y: 0 }}
              exit={{ y: 420 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
              role="dialog"
              aria-label="Pro mini profile"
            >
              {/* Grabber */}
              <div className="pt-3 flex justify-center">
                <div className="w-10 h-1.5 rounded-full bg-gray-200" />
              </div>

              {/* Header row */}
              <div className="px-4 pt-3 pb-4 border-b">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={selected.image}
                      alt={selected.name}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-lg truncate">
                          {selected.name}
                        </div>
                        {selected.verified && (
                          <Badge className="rounded-full" variant="secondary">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {selected.role} · {formatDistance(selected.distanceMi)}
                      </div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-100 inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" /> {selected.rating} (
                          {selected.reviews})
                        </span>
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                          Avg tip {money(selected.avgTip)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={closeSheet}
                    className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-4 py-4 space-y-4">
                {/* Trust strip */}
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          Trust & Safety
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {selected.safety === "verified"
                            ? "Identity verified · Tips protected"
                            : "Basic profile · Tips protected"}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-700">
                      USD $
                    </span>
                  </div>
                </div>

                {/* About */}
                <div className="rounded-3xl border border-gray-100 p-4">
                  <div className="text-sm font-semibold">About</div>
                  <div className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {selected.about}
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {selected.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Social proof / reactions */}
                <div className="rounded-3xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">
                      Recent reactions
                    </div>
                    <div className="text-xs text-gray-500">last 24h</div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {selected.recentReactions.map((r) => (
                      <div
                        key={r.label}
                        className="flex-1 rounded-2xl bg-gray-50 border border-gray-100 p-3"
                      >
                        <div className="text-2xl">{r.emoji}</div>
                        <div className="text-[11px] text-gray-600 mt-1">
                          {r.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick tip + CTA row */}
                <div className="rounded-3xl border border-gray-100 p-4">
                  <div className="text-sm font-semibold">Quick tip</div>
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {presets.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => {
                          setTipAmount(amt);
                          setTipOpen(true);
                        }}
                        className="px-4 py-2 rounded-full border border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-50"
                        aria-label={`Quick tip $${amt}`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      className="h-12 rounded-2xl"
                      onClick={() => alert("Next: X2.4 – Full Profile (mock)")}
                    >
                      View Full Profile
                    </Button>
                    <Button
                      className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                      onClick={openTip}
                    >
                      Tip Now
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tip Now mini sheet (embedded mock) */}
              <AnimatePresence>
                {tipOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10"
                  >
                    <div
                      className="absolute inset-0 bg-black/35"
                      onClick={() => setTipOpen(false)}
                    />
                    <motion.div
                      initial={{ y: 360 }}
                      animate={{ y: 0 }}
                      exit={{ y: 360 }}
                      transition={{
                        type: "spring",
                        stiffness: 160,
                        damping: 18,
                      }}
                      className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">Tip {selected.name}</div>
                        <button
                          onClick={() => setTipOpen(false)}
                          className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                          aria-label="Close tip"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {[2, 5, 10, 20].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setTipAmount(amt)}
                            className={`h-12 rounded-2xl border text-sm font-semibold transition ${
                              tipAmount === amt
                                ? "bg-yellow-400 border-yellow-400 text-black"
                                : "border-blue-200 text-blue-700 hover:bg-blue-50"
                            }`}
                          >
                            ${amt}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="text-gray-600">Selected</div>
                        <div className="font-semibold">
                          {money(clamp(tipAmount, 1, 500))}
                        </div>
                      </div>

                      <Button
                        onClick={sendTip}
                        className="mt-4 w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                      >
                        Send Tip
                      </Button>

                      <div className="mt-2 text-[11px] text-gray-500 text-center">
                        Mock interaction · USD
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
