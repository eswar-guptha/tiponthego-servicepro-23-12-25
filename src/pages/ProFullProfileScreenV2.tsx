import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flag,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Share2,
  ShieldCheck,
  Star,
  ThumbsUp,
  Trophy,
  Wallet,
  X,
} from "lucide-react";

/**
 * Screen Code: X2.4
 * Screen Name: Pro Full Profile (FULL SCREEN)
 * Currency: USD
 * Roles: Customer / Guest
 * Entry: From X2.3 “View Full Profile”
 *
 * Key UX:
 * - Full page with sticky header and sticky bottom Tip CTA
 * - Scrollable page body + optional right-side scroll indicator
 * - Tabs: Overview / Reviews / Gallery / Safety
 * - Primary CTA: Tip Now (opens Tip Now modal mock)
 */

type Review = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  reaction: string;
  helpful: number;
};

type Pro = {
  id: string;
  name: string;
  role: string;
  location: string;
  distanceMi: number;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  safety: "basic" | "verified";
  avgTip: number;
  topTip: number;
  tags: string[];
  image: string;
  cover: string;
  about: string;
  highlights: {
    icon: React.ReactNode;
    title: string;
    value: string;
    note?: string;
  }[];
  services: { title: string; duration: string; priceHint: string }[];
  gallery: string[];
  reviews: Review[];
};

const PROS: Pro[] = [
  {
    id: "p1",
    name: "Alex Johnson",
    role: "Street Performer",
    location: "Downtown Plaza",
    distanceMi: 0.2,
    rating: 4.9,
    reviewsCount: 312,
    verified: true,
    safety: "verified",
    avgTip: 6.5,
    topTip: 50,
    tags: ["Live", "Popular", "Music"],
    image: "https://i.pravatar.cc/240?img=12",
    cover:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1400&q=70",
    about:
      "Acoustic + beatbox. Performing nightly near the plaza. Tips help keep the music going and fund new gear for street sets.",
    highlights: [
      {
        icon: <BadgeCheck className="w-4 h-4" />,
        title: "Identity",
        value: "Verified",
      },
      {
        icon: <ShieldCheck className="w-4 h-4" />,
        title: "Tip Protection",
        value: "Enabled",
        note: "Secure checkout",
      },
      { icon: <Trophy className="w-4 h-4" />, title: "Rank", value: "Top 5%" },
    ],
    services: [
      {
        title: "Request a song",
        duration: "Now",
        priceHint: "Typical tip $5–$10",
      },
      {
        title: "Shoutout",
        duration: "Instant",
        priceHint: "Typical tip $2–$5",
      },
      {
        title: "Private set",
        duration: "10 min",
        priceHint: "Typical tip $15–$30",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1521334726092-b509a19597c1?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1464375117522-1311dd7a5f28?auto=format&fit=crop&w=900&q=70",
    ],
    reviews: [
      {
        id: "r1",
        name: "Emma",
        avatar: "https://i.pravatar.cc/160?img=29",
        rating: 5,
        date: "2d ago",
        text: "Insane energy — the beatbox loop was unreal. Totally made our evening.",
        reaction: "🔥",
        helpful: 18,
      },
      {
        id: "r2",
        name: "Noah",
        avatar: "https://i.pravatar.cc/160?img=8",
        rating: 5,
        date: "1w ago",
        text: "Played my request and even added a fun twist. Super friendly!",
        reaction: "👏",
        helpful: 11,
      },
      {
        id: "r3",
        name: "Maya",
        avatar: "https://i.pravatar.cc/160?img=32",
        rating: 4,
        date: "2w ago",
        text: "Great vibes and consistent performance. Highly recommend.",
        reaction: "⭐",
        helpful: 6,
      },
    ],
  },
  {
    id: "p2",
    name: "Maya Chen",
    role: "Coffee Barista",
    location: "Cedar Café",
    distanceMi: 0.6,
    rating: 4.8,
    reviewsCount: 198,
    verified: true,
    safety: "verified",
    avgTip: 4.25,
    topTip: 25,
    tags: ["Nearby", "Latte Art"],
    image: "https://i.pravatar.cc/240?img=32",
    cover:
      "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1400&q=70",
    about:
      "Latte art specialist. Ask for the seasonal menu — quick service, big smile. Tips support staff and training.",
    highlights: [
      {
        icon: <BadgeCheck className="w-4 h-4" />,
        title: "Identity",
        value: "Verified",
      },
      {
        icon: <ShieldCheck className="w-4 h-4" />,
        title: "Tip Protection",
        value: "Enabled",
      },
      {
        icon: <Calendar className="w-4 h-4" />,
        title: "On shift",
        value: "8am–6pm",
      },
    ],
    services: [
      {
        title: "Latte art request",
        duration: "Now",
        priceHint: "Typical tip $2–$5",
      },
      {
        title: "Custom drink",
        duration: "Now",
        priceHint: "Typical tip $3–$7",
      },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1459755486867-b55449bb39ff?auto=format&fit=crop&w=900&q=70",
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=900&q=70",
    ],
    reviews: [
      {
        id: "r4",
        name: "Ava",
        avatar: "https://i.pravatar.cc/160?img=47",
        rating: 5,
        date: "3d ago",
        text: "Best latte art in town. Always remembers my order.",
        reaction: "❤️",
        helpful: 22,
      },
      {
        id: "r5",
        name: "Liam",
        avatar: "https://i.pravatar.cc/160?img=15",
        rating: 4,
        date: "1w ago",
        text: "Fast service and great recommendations for beans.",
        reaction: "🙌",
        helpful: 9,
      },
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

function computeThumb(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
) {
  const maxScroll = Math.max(1, scrollHeight - clientHeight);
  const progress = clamp(scrollTop / maxScroll, 0, 1);
  const size = clamp(clientHeight / Math.max(scrollHeight, 1), 0.18, 0.55);
  const travel = 1 - size;
  const top = travel * progress;
  return { size, top, progress };
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money format");
    console.assert(clamp(-1, 0, 5) === 0, "clamp low");
    console.assert(clamp(9, 0, 5) === 5, "clamp high");
    console.assert(formatDistance(0.6).includes("mi"), "distance unit");

    const t = computeThumb(40, 500, 200);
    console.assert(t.size >= 0.18 && t.size <= 0.55, "thumb size bounds");
    console.assert(t.top >= 0 && t.top <= 1, "thumb top bounds");
  } catch {
    // never crash UI
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function ProFullProfileScreenV2() {
  const [activeId, setActiveId] = useState(PROS[0].id);
  const [fav, setFav] = useState<Record<string, boolean>>({});
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [customTip, setCustomTip] = useState("");
  const [emoji, setEmoji] = useState("👏");
  const [note, setNote] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const pro = useMemo(
    () => PROS.find((p) => p.id === activeId) ?? PROS[0],
    [activeId]
  );
  const favorite = !!fav[pro.id];

  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({
    size: 0.32,
    top: 0,
    progress: 0,
  }));

  const presets = useMemo(() => [2, 5, 10, 20, 50], []);

  const tipValue = useMemo(() => {
    const c = customTip.trim();
    if (!c) return tipAmount;
    const n = Number(c);
    if (!Number.isFinite(n)) return tipAmount;
    return n;
  }, [customTip, tipAmount]);

  const tipClamped = useMemo(
    () => clamp(Math.round(tipValue * 100) / 100, 1, 500),
    [tipValue]
  );

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

    function sync() {
      setThumb(computeThumb(el.scrollTop, el.scrollHeight, el.clientHeight));
    }

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [pro.id]);

  function toggleFav() {
    setFav((prev) => ({ ...prev, [pro.id]: !prev[pro.id] }));
  }

  function openTip() {
    setTipAmount(5);
    setCustomTip("");
    setEmoji("👏");
    setNote("");
    setTipOpen(true);
  }

  function onCustomChange(v: string) {
    const cleaned = v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setCustomTip(cleaned);
  }

  function sendTip() {
    alert(`Tip sent (mock) · ${money(tipClamped)} ${emoji} to ${pro.name}`);
    setTipOpen(false);
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="w-10 h-10 rounded-2xl border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
            onClick={() => alert("Back (mock) → X2.3")}
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-white text-sm font-semibold">
            X2.4 · Full Profile
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition ${
                favorite
                  ? "bg-pink-500/15 border-pink-500/30"
                  : "border-white/10 hover:bg-white/5"
              }`}
              onClick={toggleFav}
              aria-label="Favorite"
            >
              <Heart
                className={`w-4 h-4 ${
                  favorite ? "text-pink-400 fill-pink-400" : "text-white"
                }`}
              />
            </button>
            <button
              className="w-10 h-10 rounded-2xl border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
              onClick={() => alert("Share (mock)")}
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              className="w-10 h-10 rounded-2xl border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
              onClick={() => setReportOpen(true)}
              aria-label="Report"
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable page body */}
      <div className="relative">
        <div
          ref={pageRef}
          className="max-w-md mx-auto h-[calc(100vh-64px)] overflow-y-auto pb-28"
        >
          {/* Hero / Cover */}
          <div className="relative h-[240px]">
            <img
              src={pro.cover}
              alt="cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/50 to-neutral-950" />

            <div className="absolute left-0 right-0 bottom-0 px-4 pb-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={pro.image}
                    alt={pro.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-white text-lg font-semibold truncate">
                        {pro.name}
                      </div>
                      {pro.verified && (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <div className="text-white/75 text-sm truncate">
                      {pro.role}
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-100">
                        <Star className="w-3.5 h-3.5" /> {pro.rating.toFixed(1)}{" "}
                        ({pro.reviewsCount})
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                        <MapPin className="w-3.5 h-3.5" /> {pro.location} ·{" "}
                        {formatDistance(pro.distanceMi)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-100">
                        Avg tip {money(pro.avgTip)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="h-12 rounded-2xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
                    onClick={() => alert("Message (mock)")}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Message
                  </Button>
                  <Button
                    className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                    onClick={openTip}
                  >
                    Tip Now
                  </Button>
                </div>

                <div className="mt-2 text-[11px] text-white/60 flex items-center justify-between">
                  <span>USD · Secure checkout</span>
                  <span>Top tip: {money(pro.topTip)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Demo switcher */}
          <div className="px-4 pt-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/70 mb-2">Demo: switch pro</div>
              <div className="flex gap-2 overflow-x-auto">
                {PROS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActiveId(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition ${
                      p.id === pro.id
                        ? "bg-white/12 border-white/20 text-white"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/8"
                    }`}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-7 h-7 rounded-xl object-cover"
                    />
                    <span className="text-sm font-medium">
                      {p.name.split(" ")[0]}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-4">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid grid-cols-4 rounded-2xl bg-white/5 border border-white/10">
                <TabsTrigger
                  value="overview"
                  className="rounded-2xl text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/10"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-2xl text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/10"
                >
                  Reviews
                </TabsTrigger>
                <TabsTrigger
                  value="gallery"
                  className="rounded-2xl text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/10"
                >
                  Gallery
                </TabsTrigger>
                <TabsTrigger
                  value="safety"
                  className="rounded-2xl text-white/80 data-[state=active]:text-white data-[state=active]:bg-white/10"
                >
                  Safety
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white font-semibold">About</div>
                  <div className="text-white/75 text-sm mt-1 leading-relaxed">
                    {pro.about}
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {pro.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white font-semibold">Highlights</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {pro.highlights.map((h) => (
                      <div
                        key={h.title}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="text-white/80">{h.icon}</div>
                        <div className="text-white text-sm font-semibold mt-2">
                          {h.value}
                        </div>
                        <div className="text-[11px] text-white/60 mt-0.5">
                          {h.title}
                        </div>
                        {h.note && (
                          <div className="text-[10px] text-white/50 mt-1">
                            {h.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">Services</div>
                    <span className="text-xs text-white/60">Optional</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {pro.services.map((s) => (
                      <div
                        key={s.title}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-white text-sm font-semibold">
                            {s.title}
                          </div>
                          <div className="text-[11px] text-white/60 mt-0.5">
                            {s.duration} · {s.priceHint}
                          </div>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                          Tip
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 to-white/0 p-4">
                  <div className="text-white font-semibold">Ready to tip?</div>
                  <div className="text-white/70 text-sm mt-1">
                    A small tip makes a big difference.
                  </div>
                  <Button
                    className="mt-3 w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                    onClick={openTip}
                  >
                    Tip Now
                  </Button>
                </section>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4 space-y-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">Reviews</div>
                    <span className="text-xs text-white/60">
                      {pro.reviewsCount} total
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["Great", "Friendly", "Fast"].map((k) => (
                      <div
                        key={k}
                        className="rounded-2xl border border-white/10 bg-white/5 p-3"
                      >
                        <div className="text-white text-sm font-semibold">
                          {k}
                        </div>
                        <div className="text-[11px] text-white/60 mt-1">
                          Trending
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {pro.reviews.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={r.avatar}
                          alt={r.name}
                          className="w-10 h-10 rounded-2xl object-cover border border-white/10"
                        />
                        <div>
                          <div className="text-white font-semibold">
                            {r.name}
                          </div>
                          <div className="text-[11px] text-white/60">
                            {r.date} · <span className="text-amber-200">★</span>{" "}
                            {r.rating}
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl">{r.reaction}</div>
                    </div>
                    <div className="text-white/75 text-sm mt-3 leading-relaxed">
                      {r.text}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-1 hover:bg-white/8"
                        onClick={() => alert("Helpful (mock)")}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Helpful (
                        {r.helpful})
                      </button>
                      <span className="text-[11px] text-white/55">
                        Verified tipper
                      </span>
                    </div>
                  </div>
                ))}

                <Button
                  variant="secondary"
                  className="w-full h-12 rounded-2xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
                  onClick={() => alert("Load more (mock)")}
                >
                  Load more
                </Button>
              </TabsContent>

              <TabsContent value="gallery" className="mt-4 space-y-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">Gallery</div>
                    <span className="text-xs text-white/60">Photos</span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {pro.gallery.map((src, idx) => (
                      <button
                        key={src}
                        onClick={() => alert(`Open photo ${idx + 1} (mock)`)}
                        className="relative rounded-2xl overflow-hidden border border-white/10"
                      >
                        <img
                          src={src}
                          alt={`gallery ${idx + 1}`}
                          className="w-full h-28 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-[11px] text-white/55 flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Videos can be added later (V2)</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="safety" className="mt-4 space-y-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-200">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">
                        Trust & Safety
                      </div>
                      <div className="text-white/70 text-sm mt-1">
                        {pro.safety === "verified"
                          ? "Identity verified · Tips protected"
                          : "Basic profile · Tips protected"}
                      </div>
                      <div className="text-[11px] text-white/55 mt-2">
                        Payments are processed securely. Platform may hold funds
                        for dispute checks. Never share private payment info.
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                      USD $
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white font-semibold">Report</div>
                  <div className="text-white/70 text-sm mt-1">
                    If something feels off, report this profile.
                  </div>
                  <Button
                    variant="secondary"
                    className="mt-3 h-12 rounded-2xl bg-white/10 text-white hover:bg-white/15 border border-white/10"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="w-4 h-4 mr-2" /> Report {pro.name}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="h-6" />
        </div>

        {/* Optional right-side scroll indicator (to match X2.3 feel) */}
        <div className="pointer-events-none absolute top-4 bottom-24 right-3 w-[6px] rounded-full bg-white/10">
          <div
            className="absolute left-0 right-0 rounded-full bg-blue-500"
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
          <div className="rounded-3xl border border-white/10 bg-neutral-950/70 backdrop-blur p-3 flex items-center gap-3">
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">
                Tip {pro.name}
              </div>
              <div className="text-[11px] text-white/60">USD · Secure</div>
            </div>
            <Button
              className="ml-auto h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
              onClick={openTip}
            >
              Tip Now
            </Button>
            <button
              className="w-12 h-12 rounded-2xl border border-white/10 text-white flex items-center justify-center hover:bg-white/5"
              onClick={() => alert("Wallet (mock) → X3.1")}
              aria-label="Wallet"
            >
              <Wallet className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tip Now modal (mock) */}
      <AnimatePresence>
        {tipOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
          >
            <div
              className="absolute inset-0 bg-black/45"
              onClick={() => setTipOpen(false)}
            />
            <motion.div
              initial={{ y: 420 }}
              animate={{ y: 0 }}
              exit={{ y: 420 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <div className="font-semibold">Tip {pro.name}</div>
                  <div className="text-xs text-gray-500">
                    USD · Secure payment
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  onClick={() => setTipOpen(false)}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {presets.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => {
                        setTipAmount(amt);
                        setCustomTip("");
                      }}
                      className={`h-12 rounded-2xl border text-sm font-semibold transition ${
                        !customTip && tipAmount === amt
                          ? "bg-yellow-400 border-yellow-400 text-black"
                          : "border-blue-200 text-blue-700 hover:bg-blue-50"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Custom amount</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-gray-500">$</span>
                    <Input
                      value={customTip}
                      onChange={(e) => onCustomChange(e.target.value)}
                      inputMode="decimal"
                      placeholder="Enter amount"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">$1–$500</div>
                </div>

                <div className="rounded-2xl border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Reaction</div>
                  <div className="mt-2 flex gap-2">
                    {["👏", "🔥", "⭐", "❤️", "🙌"].map((e) => (
                      <button
                        key={e}
                        onClick={() => setEmoji(e)}
                        className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-2xl transition ${
                          emoji === e
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Message (optional)</div>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 140))}
                    placeholder="Say thanks (optional)"
                    className="rounded-2xl min-h-[86px]"
                  />
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>Platform fee included</span>
                    <span>{note.length}/140</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">Selected</div>
                  <div className="font-semibold">{money(tipClamped)}</div>
                </div>

                <Button
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                  onClick={sendTip}
                >
                  Send Tip
                </Button>

                <div className="text-[11px] text-gray-500">
                  Mock: Next route → X1.2 Tip Receipt
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report dialog (mock) */}
      <AnimatePresence>
        {reportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/55"
              onClick={() => setReportOpen(false)}
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
                  <div className="font-semibold text-lg">Report {pro.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Tell us what happened. We’ll review quickly.
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  onClick={() => setReportOpen(false)}
                  aria-label="Close report"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-sm font-medium">Reason</div>
                <div className="grid grid-cols-2 gap-2">
                  {["Spam", "Impersonation", "Abuse", "Other"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReportReason(r)}
                      className={`h-11 rounded-2xl border text-sm font-semibold transition ${
                        reportReason === r
                          ? "bg-blue-50 border-blue-300"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  className="h-12 rounded-2xl"
                  onClick={() => setReportOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-green-500"
                  onClick={() => {
                    alert(
                      `Report submitted (mock) · ${reportReason || "No reason"}`
                    );
                    setReportOpen(false);
                    setReportReason("");
                  }}
                >
                  Submit
                </Button>
              </div>

              <div className="mt-3 text-[11px] text-gray-500">
                Mock dialog · Next: Trust & Safety flow
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
