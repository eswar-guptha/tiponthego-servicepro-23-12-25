import React, { useEffect, useMemo, useState } from "react";
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
  LocateFixed,
  Layers,
  Share2,
  Download,
  Copy,
  ChevronDown,
  Receipt,
} from "lucide-react";

/**
 * Digital Tipping – X2.1 Nearby Discovery (Interactive Mock)
 * Enhancement (1): Map with animated pins + cluster mock
 * - Search + radius
 * - List/Map toggle
 * - Map: animated pins + clustering + zoom levels + pan drag (mock)
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
  // extra points to demonstrate clustering
  {
    id: "p6",
    name: "Emma Stone",
    role: "Barista",
    distanceMi: 0.7,
    rating: 4.7,
    verified: true,
    avgTip: 4.55,
    tags: ["Nearby"],
    image: "https://i.pravatar.cc/240?img=29",
  },
  {
    id: "p7",
    name: "Liam Brooks",
    role: "Delivery Partner",
    distanceMi: 1.5,
    rating: 4.6,
    verified: false,
    avgTip: 3.4,
    tags: ["Fast"],
    image: "https://i.pravatar.cc/240?img=15",
  },
];

type Zoom = 1 | 2 | 3;

type Pin = {
  pro: Pro;
  x: number; // 0..100
  y: number; // 0..100
};

type Cluster = {
  key: string;
  x: number;
  y: number;
  items: Pin[];
};

type ReceiptData = {
  pro: Pro;
  amount: number;
  emoji: string;
  payment: "apple" | "wallet" | "card";
  createdAt: number;
  txnId: string;
  feeRate: number; // platform fee rate
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function hashToUnit(id: string, salt = 0) {
  // Deterministic 0..1 from id
  let h = 2166136261 + salt;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function toPins(pros: Pro[], zoom: Zoom): Pin[] {
  // Spread pins in a pseudo map area, tighter clusters at low zoom
  const spread = zoom === 1 ? 0.7 : zoom === 2 ? 0.9 : 1.0;
  return pros.map((p, idx) => {
    const baseX = 10 + hashToUnit(p.id, 11) * 80;
    const baseY = 12 + hashToUnit(p.id, 37) * 76;

    // Bring some points closer together to demonstrate clustering
    const pull = zoom === 1 ? 0.18 : zoom === 2 ? 0.12 : 0.06;
    const cx = 50;
    const cy = 52;
    const x =
      baseX * spread +
      cx * (1 - spread) +
      (idx % 2 === 0 ? -pull * 100 : pull * 60);
    const y =
      baseY * spread +
      cy * (1 - spread) +
      (idx % 3 === 0 ? -pull * 80 : pull * 40);

    return { pro: p, x: clamp01(x / 100) * 100, y: clamp01(y / 100) * 100 };
  });
}

function clusterPins(pins: Pin[], zoom: Zoom): Cluster[] {
  // Grid clustering: larger cell at low zoom
  const cell = zoom === 1 ? 22 : zoom === 2 ? 16 : 10; // percent
  const map = new Map<string, Pin[]>();

  for (const pin of pins) {
    const gx = Math.floor(pin.x / cell);
    const gy = Math.floor(pin.y / cell);
    const key = `${gx}:${gy}`;
    map.set(key, [...(map.get(key) ?? []), pin]);
  }

  const clusters: Cluster[] = [];
  for (const [key, items] of map.entries()) {
    const x = items.reduce((a, i) => a + i.x, 0) / items.length;
    const y = items.reduce((a, i) => a + i.y, 0) / items.length;
    clusters.push({ key, x, y, items });
  }

  // Stable order: bigger clusters first, then by y/x
  clusters.sort(
    (a, b) => b.items.length - a.items.length || a.y - b.y || a.x - b.x
  );
  return clusters;
}

// Lightweight runtime "tests" (dev-only) to guard helpers without requiring a test runner.
function runDevChecks() {
  try {
    console.assert(clamp01(-1) === 0, "clamp01 should clamp low values to 0");
    console.assert(clamp01(2) === 1, "clamp01 should clamp high values to 1");

    const u1 = hashToUnit("abc", 1);
    const u2 = hashToUnit("abc", 1);
    const u3 = hashToUnit("abc", 2);
    console.assert(
      u1 === u2,
      "hashToUnit should be deterministic for same inputs"
    );
    console.assert(u1 !== u3, "hashToUnit should vary with salt");

    const pins = toPins(PROS.slice(0, 3), 1);
    console.assert(pins.length === 3, "toPins should return one pin per pro");
    console.assert(
      pins.every((p) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100),
      "pins must be within 0..100 bounds"
    );

    const clusters = clusterPins(pins, 1);
    console.assert(
      clusters.length >= 1,
      "clusterPins should return at least one cluster"
    );
    console.assert(
      clusters.reduce((sum, c) => sum + c.items.length, 0) === pins.length,
      "clusterPins should preserve all pins"
    );
  } catch {
    // Never crash UI due to checks
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function NearbyDiscoveryScreenV3() {
  const [query, setQuery] = useState("");
  const [radiusMi, setRadiusMi] = useState(5);
  const [view, setView] = useState<"list" | "map">("list");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Map state
  const [zoom, setZoom] = useState<Zoom>(1);
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(
    null
  );
  const [panKey, setPanKey] = useState(0); // resets map pan position (mock)

  // Tip flow state
  const [tipOpen, setTipOpen] = useState(false);
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null);

  // Receipt (X1.2) state
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

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

  const pins = useMemo(() => toPins(filtered, zoom), [filtered, zoom]);
  const clusters = useMemo(() => clusterPins(pins, zoom), [pins, zoom]);

  const selectedCluster = useMemo(
    () => clusters.find((c) => c.key === selectedClusterKey) ?? null,
    [clusters, selectedClusterKey]
  );

  function openTip(pro: Pro) {
    setSelectedPro(pro);
    setTipOpen(true);
  }

  function openReceiptScreen(data: ReceiptData) {
    setReceipt(data);
    setReceiptOpen(true);
  }

  function closeReceiptScreen() {
    setReceiptOpen(false);
  }

  function toggleFav(id: string) {
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function zoomIn() {
    setSelectedClusterKey(null);
    setZoom((z) => (z === 1 ? 2 : z === 2 ? 3 : 3));
  }

  function zoomOut() {
    setSelectedClusterKey(null);
    setZoom((z) => (z === 3 ? 2 : z === 2 ? 1 : 1));
  }

  function recenter() {
    // Mock: clears selections + recenters (resets pan)
    setSelectedClusterKey(null);
    setPanKey((k) => k + 1);
  }

  useEffect(() => {
    // Listen for receipt navigation from TipNowSheet success overlay
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const detail = ce.detail as {
        pro: Pro;
        amount: number;
        emoji: string;
        payment: "apple" | "wallet" | "card";
      };
      if (!detail?.pro) return;

      openReceiptScreen({
        pro: detail.pro,
        amount: detail.amount,
        emoji: detail.emoji,
        payment: detail.payment,
        createdAt: Date.now(),
        txnId: `TXN-${String(Date.now()).slice(-6)}`,
        feeRate: 0.1,
      });
    };

    window.addEventListener("open-receipt", handler as EventListener);
    return () =>
      window.removeEventListener("open-receipt", handler as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              onChange={(e: any) => setQuery(e.target.value)}
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
        {/* Map View (enhanced) */}
        {view === "map" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/15 border border-white/20 rounded-3xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-white font-semibold">Map View</div>
                <div className="text-white/80 text-sm mt-1">
                  Drag the map. Tap a pin to tip. Tap a cluster to zoom.
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={recenter}
                  className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center hover:bg-white/20"
                  aria-label="Recenter"
                >
                  <LocateFixed className="w-4 h-4" />
                </button>
                <button
                  onClick={zoomOut}
                  className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center hover:bg-white/20"
                  aria-label="Zoom out"
                >
                  −
                </button>
                <button
                  onClick={zoomIn}
                  className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center hover:bg-white/20"
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            </div>

            {/* Map canvas */}
            <div className="mt-4 relative h-[380px] rounded-3xl overflow-hidden bg-gradient-to-br from-white/15 to-white/5 border border-white/20">
              {/* subtle grid */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.18) 1px, transparent 1px)",
                  backgroundSize:
                    zoom === 1
                      ? "70px 70px"
                      : zoom === 2
                      ? "55px 55px"
                      : "42px 42px",
                }}
              />

              {/* water/land blobs */}
              <div className="absolute -left-10 top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute right-0 bottom-0 w-56 h-56 bg-white/10 rounded-full blur-2xl" />

              {/* center point */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-3 h-3 rounded-full bg-white" />
                <div className="text-[10px] text-white/80 mt-1 text-center">
                  You
                </div>
              </div>

              {/* clusters and pins (draggable map layer) */}
              <motion.div
                key={panKey}
                className="absolute inset-0"
                drag
                dragConstraints={{ left: -60, right: 60, top: -60, bottom: 60 }}
                dragElastic={0.08}
                dragMomentum={false}
                aria-label="Map layer"
              >
                <AnimatePresence>
                  {clusters.map((c) => {
                    const isCluster = c.items.length > 1;

                    if (isCluster && zoom !== 3) {
                      const active = selectedClusterKey === c.key;
                      return (
                        <motion.button
                          key={c.key}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.85, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 16,
                          }}
                          style={{ top: `${c.y}%`, left: `${c.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2"
                          onClick={() => {
                            setSelectedClusterKey(c.key);
                            setZoom((z) => (z === 1 ? 2 : z === 2 ? 3 : 3));
                          }}
                          aria-label={`Cluster of ${c.items.length} pros`}
                        >
                          <div
                            className={`relative rounded-full px-4 py-2 text-white font-semibold text-sm shadow-lg border ${
                              active
                                ? "bg-white/35 border-white/40"
                                : "bg-white/25 border-white/30"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4" />
                              <span>{c.items.length}</span>
                            </div>
                            <motion.div
                              className="absolute inset-0 rounded-full"
                              initial={{ opacity: 0.35, scale: 1 }}
                              animate={{
                                opacity: [0.35, 0, 0.35],
                                scale: [1, 1.25, 1],
                              }}
                              transition={{
                                duration: 1.6,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              style={{ background: "rgba(255,255,255,.35)" }}
                            />
                          </div>
                        </motion.button>
                      );
                    }

                    // At zoom 3 show individual pins for clusters
                    if (zoom === 3 && c.items.length > 1) {
                      return (
                        <React.Fragment key={c.key}>
                          {c.items.map((pin) => (
                            <MapPinButton
                              key={pin.pro.id}
                              pin={pin}
                              onClick={() => openTip(pin.pro)}
                            />
                          ))}
                        </React.Fragment>
                      );
                    }

                    // Single item
                    const pin = c.items[0];
                    return (
                      <MapPinButton
                        key={pin.pro.id}
                        pin={pin}
                        onClick={() => openTip(pin.pro)}
                      />
                    );
                  })}
                </AnimatePresence>
              </motion.div>

              {/* Selected cluster preview tray */}
              <AnimatePresence>
                {selectedCluster &&
                  selectedCluster.items.length > 1 &&
                  zoom >= 2 && (
                    <motion.div
                      initial={{ y: 24, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 24, opacity: 0 }}
                      className="absolute left-3 right-3 bottom-3 bg-white rounded-3xl shadow-lg border border-gray-100 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">
                          Cluster ({selectedCluster.items.length})
                        </div>
                        <button
                          onClick={() => setSelectedClusterKey(null)}
                          className="w-9 h-9 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                          aria-label="Close cluster"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {selectedCluster.items.slice(0, 4).map(({ pro }) => (
                          <button
                            key={pro.id}
                            onClick={() => openTip(pro)}
                            className="text-left bg-gray-50 rounded-2xl p-3 hover:bg-gray-100"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={pro.image}
                                className="w-8 h-8 rounded-full object-cover"
                                alt={pro.name}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">
                                  {pro.name}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  ★ {pro.rating} · {pro.distanceMi.toFixed(1)}{" "}
                                  mi
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-[11px] text-gray-500">
                        Tip: zoom in to see individual pins.
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>

              {/* Zoom badge */}
              <div className="absolute top-3 left-3 bg-white/20 border border-white/25 text-white text-xs px-3 py-1.5 rounded-full">
                Zoom: {zoom}
              </div>
            </div>

            {/* Nearby list preview under map */}
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
                  <div className="mt-2 text-xs text-gray-600">Tap to tip</div>
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

      {/* RECEIPT SCREEN (X1.2) */}
      <AnimatePresence>
        {receiptOpen && receipt && (
          <ReceiptScreen
            data={receipt}
            onClose={closeReceiptScreen}
            onTipAgain={() => {
              closeReceiptScreen();
              openTip(receipt.pro);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MapPinButton({ pin, onClick }: { pin: Pin; onClick: () => void }) {
  return (
    <motion.button
      style={{ top: `${pin.y}%`, left: `${pin.x}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 240, damping: 16 }}
      aria-label={`Pin for ${pin.pro.name}`}
    >
      <div className="relative">
        {/* pulse */}
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0.35, scale: 1 }}
          animate={{ opacity: [0.35, 0, 0.35], scale: [1, 1.45, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "rgba(255,255,255,.35)" }}
        />
        {/* pin */}
        <div className="w-11 h-11 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center">
          <img
            src={pin.pro.image}
            alt={pin.pro.name}
            className="w-9 h-9 rounded-xl object-cover"
          />
        </div>
      </div>
    </motion.button>
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

  function openReceipt() {
    // Navigate to receipt (X1.2) with a payload
    setSuccessOpen(false);
    onClose();
    window.dispatchEvent(
      new CustomEvent("open-receipt", {
        detail: {
          pro,
          amount: amountClamped,
          emoji: selectedEmoji,
          payment,
        },
      })
    );
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    onCustomChange(e.target.value)
                  }
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
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMessage(e.target.value.slice(0, 140))
              }
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
                      onClick={() => setSuccessOpen(false)}
                      className="h-12 rounded-2xl"
                      variant="secondary"
                    >
                      Tip again
                    </Button>
                    <Button
                      onClick={openReceipt}
                      className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                    >
                      View Receipt
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

function formatPayment(p: ReceiptData["payment"]) {
  return p === "apple"
    ? "Apple/Google Pay"
    : p === "wallet"
    ? "Wallet"
    : "Card";
}

function formatDateTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function ReceiptScreen({
  data,
  onClose,
  onTipAgain,
}: {
  data: ReceiptData;
  onClose: () => void;
  onTipAgain: () => void;
}) {
  const [feeOpen, setFeeOpen] = useState(false);
  const tip = Math.round(data.amount * 100) / 100;
  const fee = Math.round(tip * data.feeRate * 100) / 100;
  const total = Math.round((tip + fee) * 100) / 100;

  const receiptText = `Receipt ${data.txnId}
Pro: ${data.pro.name}
Tip: ${money(tip)} ${data.emoji}
Fee: ${money(fee)}
Total: ${money(total)}
Paid via: ${formatPayment(data.payment)}
Date: ${formatDateTime(data.createdAt)}`;

  async function copyReceipt() {
    try {
      await navigator.clipboard.writeText(receiptText);
      alert("Receipt copied (mock)");
    } catch {
      alert("Copy not available in this environment");
    }
  }

  async function shareReceipt() {
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({
          title: "Tip Receipt",
          text: receiptText,
        });
        return;
      }
    } catch {
      // ignore
    }
    alert("Share (mock) – implement Web Share or deep-link");
  }

  function downloadReceipt() {
    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.txnId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-gradient-to-br from-blue-600 to-cyan-500"
    >
      <div className="max-w-md mx-auto min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center hover:bg-white/20"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="text-white font-semibold text-lg">Receipt</div>
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 text-white flex items-center justify-center hover:bg-white/20"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Tip Successful</div>
                  <div className="font-semibold text-lg">
                    {money(tip)} {data.emoji}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDateTime(data.createdAt)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Receipt ID</div>
                <div className="font-semibold text-sm">{data.txnId}</div>
              </div>
            </div>

            {/* Pro card */}
            <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={data.pro.image}
                  alt={data.pro.name}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base truncate">
                    {data.pro.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {data.pro.role} · ★ {data.pro.rating}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Avg tip</div>
                  <div className="font-semibold text-sm">
                    {money(data.pro.avgTip)}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment summary */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-gray-100 p-3">
                <div className="text-xs text-gray-500">Paid via</div>
                <div className="font-semibold text-sm mt-0.5">
                  {formatPayment(data.payment)}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 p-3">
                <div className="text-xs text-gray-500">Status</div>
                <div className="font-semibold text-sm mt-0.5 text-emerald-700">
                  Completed
                </div>
              </div>
            </div>

            {/* Fee breakdown */}
            <button
              onClick={() => setFeeOpen((v) => !v)}
              className="mt-4 w-full rounded-2xl border border-gray-200 bg-white p-3 text-left hover:bg-gray-50"
              aria-expanded={feeOpen}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-gray-700" />
                  <div>
                    <div className="font-semibold text-sm">Fee breakdown</div>
                    <div className="text-xs text-gray-500">
                      Platform fee included
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition ${
                    feeOpen ? "rotate-180" : ""
                  }`}
                />
              </div>

              <AnimatePresence>
                {feeOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tip amount</span>
                        <span className="font-semibold text-gray-900">
                          {money(tip)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Platform fee ({Math.round(data.feeRate * 100)}%)
                        </span>
                        <span className="font-semibold text-gray-900">
                          {money(fee)}
                        </span>
                      </div>
                      <div className="h-px bg-gray-200 my-1" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 font-semibold">
                          Total charged
                        </span>
                        <span className="font-semibold text-gray-900">
                          {money(total)}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        Notes: Fees are shown for demo purposes. Configure per
                        region/merchant rules.
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={shareReceipt}
                className="rounded-2xl border border-gray-200 bg-white p-3 hover:bg-gray-50"
                aria-label="Share"
              >
                <div className="flex flex-col items-center gap-1">
                  <Share2 className="w-4 h-4" />
                  <div className="text-xs font-semibold">Share</div>
                </div>
              </button>
              <button
                onClick={downloadReceipt}
                className="rounded-2xl border border-gray-200 bg-white p-3 hover:bg-gray-50"
                aria-label="Download"
              >
                <div className="flex flex-col items-center gap-1">
                  <Download className="w-4 h-4" />
                  <div className="text-xs font-semibold">Download</div>
                </div>
              </button>
              <button
                onClick={copyReceipt}
                className="rounded-2xl border border-gray-200 bg-white p-3 hover:bg-gray-50"
                aria-label="Copy"
              >
                <div className="flex flex-col items-center gap-1">
                  <Copy className="w-4 h-4" />
                  <div className="text-xs font-semibold">Copy</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-auto px-4 pb-6">
          <Button
            onClick={onTipAgain}
            className="w-full h-14 text-lg rounded-2xl bg-white text-blue-700 hover:bg-white/90"
          >
            Tip Again
          </Button>
          <div className="text-center text-[11px] text-white/80 mt-3">
            Secure payments · US Dollar (USD)
          </div>
        </div>
      </div>
    </motion.div>
  );
}
