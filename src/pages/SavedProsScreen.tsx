import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  ChevronDown,
  Filter,
  Heart,
  Info,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  UserPlus,
  X,
} from "lucide-react";

/**
 * Screen Code: X2.7
 * Screen Name: Favorites / Following (Saved Pros)
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From X2.3 (favorite toggle)
 *  - From X2.4 (Follow)
 *  - From X3.1 Wallet/Home (Saved)
 * Purpose:
 *  - Retention: revisit + tip again
 *  - Quick actions: Tip Now, View Profile, Unfollow/Remove
 *
 * Canvas Compatibility:
 * - No framer-motion (prevents sandbox "Illegal constructor")
 * - Uses CSS transitions, bottom sheets, and a right-side scroll indicator
 */

type Pro = {
  id: string;
  name: string;
  role: string;
  distanceMi: number;
  rating: number;
  reviews: number;
  verified: boolean;
  tags: string[];
  avgTip: number;
  tippedBefore: boolean;
  lastTippedDaysAgo?: number;
  image: string;
};

type SavedState = {
  favorites: Record<string, boolean>;
  following: Record<string, boolean>;
  notifications: Record<string, boolean>;
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
    tags: ["Live", "Popular"],
    avgTip: 6.5,
    tippedBefore: true,
    lastTippedDaysAgo: 2,
    image: "https://i.pravatar.cc/240?img=12",
  },
  {
    id: "p2",
    name: "Maya Chen",
    role: "Coffee Barista",
    distanceMi: 0.6,
    rating: 4.8,
    reviews: 198,
    verified: true,
    tags: ["Nearby"],
    avgTip: 4.25,
    tippedBefore: true,
    lastTippedDaysAgo: 10,
    image: "https://i.pravatar.cc/240?img=32",
  },
  {
    id: "p3",
    name: "Diego Rivera",
    role: "Delivery Partner",
    distanceMi: 1.4,
    rating: 4.7,
    reviews: 141,
    verified: false,
    tags: ["Fast"],
    avgTip: 3.8,
    tippedBefore: false,
    image: "https://i.pravatar.cc/240?img=54",
  },
  {
    id: "p4",
    name: "Sara Williams",
    role: "Fitness Coach",
    distanceMi: 2.1,
    rating: 4.9,
    reviews: 421,
    verified: true,
    tags: ["Top Rated"],
    avgTip: 9.75,
    tippedBefore: false,
    image: "https://i.pravatar.cc/240?img=47",
  },
  {
    id: "p5",
    name: "Noah Patel",
    role: "Street Musician",
    distanceMi: 0.9,
    rating: 4.6,
    reviews: 88,
    verified: false,
    tags: ["Live"],
    avgTip: 5.1,
    tippedBefore: true,
    lastTippedDaysAgo: 18,
    image: "https://i.pravatar.cc/240?img=8",
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function formatDistance(mi: number) {
  return mi < 1 ? `${Math.round(mi * 10) / 10} mi` : `${mi.toFixed(1)} mi`;
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money formats");
    console.assert(clamp01(-1) === 0, "clamp01 low");
    console.assert(clamp01(2) === 1, "clamp01 high");
    console.assert(formatDistance(0.2).includes("mi"), "distance has unit");
  } catch {
    // never crash UI
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function SavedProsScreen() {
  const [tab, setTab] = useState<"favorites" | "following">("favorites");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"nearby" | "rating" | "recent">("recent");
  const [filterVerified, setFilterVerified] = useState(false);
  const [filterLive, setFilterLive] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"remove" | "unfollow">(
    "remove"
  );
  const [selectedPro, setSelectedPro] = useState<Pro | null>(null);

  const [state, setState] = useState<SavedState>(() => ({
    favorites: { p1: true, p2: true, p5: true, p4: false, p3: false },
    following: { p1: true, p2: false, p5: true, p4: true, p3: false },
    notifications: { p1: true, p5: false, p4: true },
  }));

  // Scroll indicator
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({ size: 0.32, top: 0 }));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;

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

  const savedList = useMemo(() => {
    const base = PROS.filter((p) =>
      tab === "favorites" ? state.favorites[p.id] : state.following[p.id]
    );
    const q = query.trim().toLowerCase();

    const filtered = base.filter((p) => {
      const matchesQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      const matchesVerified = !filterVerified || p.verified;
      const matchesLive =
        !filterLive || p.tags.some((t) => t.toLowerCase() === "live");
      return matchesQ && matchesVerified && matchesLive;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "nearby") return a.distanceMi - b.distanceMi;
      if (sort === "rating") return b.rating - a.rating;
      // recent: those tippedBefore more recently first
      const ad = a.lastTippedDaysAgo ?? 999;
      const bd = b.lastTippedDaysAgo ?? 999;
      return ad - bd;
    });

    return sorted;
  }, [
    tab,
    state.favorites,
    state.following,
    query,
    sort,
    filterVerified,
    filterLive,
  ]);

  function toggleFavorite(id: string) {
    setState((prev) => ({
      ...prev,
      favorites: { ...prev.favorites, [id]: !prev.favorites[id] },
    }));
    setToast(!state.favorites[id] ? "Saved" : "Removed");
  }

  function toggleFollow(id: string) {
    setState((prev) => ({
      ...prev,
      following: { ...prev.following, [id]: !prev.following[id] },
    }));
    setToast(!state.following[id] ? "Following" : "Unfollowed");
  }

  function toggleNotify(id: string) {
    setState((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [id]: !prev.notifications[id] },
    }));
    setToast(
      !state.notifications[id] ? "Notifications on" : "Notifications off"
    );
  }

  function openConfirm(p: Pro, mode: "remove" | "unfollow") {
    setSelectedPro(p);
    setConfirmMode(mode);
    setConfirmOpen(true);
  }

  function confirmAction() {
    if (!selectedPro) return;
    const p = selectedPro;

    if (confirmMode === "remove") {
      setState((prev) => ({
        ...prev,
        favorites: { ...prev.favorites, [p.id]: false },
      }));
      setToast("Removed from Favorites");
    } else {
      setState((prev) => ({
        ...prev,
        following: { ...prev.following, [p.id]: false },
      }));
      setToast("Unfollowed");
    }

    setConfirmOpen(false);
    setSelectedPro(null);
  }

  const emptyState = savedList.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → Discover")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X2.7 · Saved Pros</div>
          <button
            onClick={() => setFiltersOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header controls */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-3">
        <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTab("favorites")}
              className={`h-11 rounded-2xl font-semibold transition ${
                tab === "favorites"
                  ? "bg-white text-blue-700"
                  : "text-white hover:bg-white/10"
              }`}
            >
              Favorites
            </button>
            <button
              onClick={() => setTab("following")}
              className={`h-11 rounded-2xl font-semibold transition ${
                tab === "following"
                  ? "bg-white text-blue-700"
                  : "text-white hover:bg-white/10"
              }`}
            >
              Following
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search saved ${
                tab === "favorites" ? "favorites" : "following"
              }…`}
              className="w-full pl-9 pr-3 py-3 rounded-2xl bg-white/15 text-white placeholder:text-white/70 border border-white/20 outline-none focus:border-white/30"
            />
          </div>

          {/* Sort row */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-white/85 text-sm inline-flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Near you</span>
            </div>

            <button
              onClick={() => {
                const next =
                  sort === "recent"
                    ? "nearby"
                    : sort === "nearby"
                    ? "rating"
                    : "recent";
                setSort(next);
                setToast(`Sort: ${next}`);
              }}
              className="h-10 px-3 rounded-2xl bg-white/10 border border-white/15 text-white font-semibold inline-flex items-center gap-2 hover:bg-white/15"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm">
                {sort === "recent"
                  ? "Recent"
                  : sort === "nearby"
                  ? "Nearby"
                  : "Rating"}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Active filters chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {filterVerified && (
              <Chip
                label="Verified"
                onRemove={() => setFilterVerified(false)}
              />
            )}
            {filterLive && (
              <Chip label="Live" onRemove={() => setFilterLive(false)} />
            )}
            {!filterVerified && !filterLive && (
              <div className="text-xs text-white/70 inline-flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                <span>Tip again faster from saved list.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="relative">
        <div
          ref={pageRef}
          className="max-w-md mx-auto px-4 pb-28 h-[calc(100vh-242px)] overflow-y-auto pr-5"
        >
          {emptyState ? (
            <EmptyState
              tab={tab}
              onPrimary={() => alert("Go to Discover (mock)")}
              onSecondary={() => {
                setFilterVerified(false);
                setFilterLive(false);
                setQuery("");
                setToast("Cleared");
              }}
            />
          ) : (
            <div className="space-y-3">
              {savedList.map((p) => (
                <ProCard
                  key={p.id}
                  pro={p}
                  isFavorite={!!state.favorites[p.id]}
                  isFollowing={!!state.following[p.id]}
                  notifyOn={!!state.notifications[p.id]}
                  onToggleFav={() => toggleFavorite(p.id)}
                  onToggleFollow={() => toggleFollow(p.id)}
                  onToggleNotify={() => toggleNotify(p.id)}
                  onOpenProfile={() =>
                    alert("Next: X2.4 – Full Profile (mock)")
                  }
                  onTipNow={() => alert("Next: X1.1 – Tip Now (mock)")}
                  onRemove={() => openConfirm(p, "remove")}
                  onUnfollow={() => openConfirm(p, "unfollow")}
                  tab={tab}
                />
              ))}

              <div className="h-6" />
            </div>
          )}
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

      {/* Bottom Nav mock */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-2 flex items-center justify-between">
            <button
              className="flex-1 py-3 rounded-2xl text-white font-semibold hover:bg-white/10"
              onClick={() => alert("Discover (mock)")}
            >
              Discover
            </button>
            <button className="flex-1 py-3 rounded-2xl bg-white text-blue-700 font-semibold">
              Saved
            </button>
            <button
              className="flex-1 py-3 rounded-2xl text-white font-semibold hover:bg-white/10"
              onClick={() => alert("Wallet (mock) → X3.1")}
            >
              Wallet
            </button>
          </div>
        </div>
      </div>

      {/* Filters sheet */}
      {filtersOpen && (
        <Sheet title="Filters" onClose={() => setFiltersOpen(false)}>
          <div className="space-y-3">
            <ToggleRow
              title="Verified only"
              subtitle="Show identity-verified pros"
              checked={filterVerified}
              onChange={() => setFilterVerified((v) => !v)}
            />
            <ToggleRow
              title="Live now"
              subtitle="Show pros with Live tag"
              checked={filterLive}
              onChange={() => setFilterLive((v) => !v)}
            />

            <div className="mt-2 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5" />
              <span>Filters are applied to your Saved list only.</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => {
                  setFilterVerified(false);
                  setFilterLive(false);
                  setToast("Filters cleared");
                }}
                className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  setFiltersOpen(false);
                  setToast("Applied");
                }}
                className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
              >
                Apply
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {/* Confirm sheet */}
      {confirmOpen && selectedPro && (
        <Sheet
          title={
            confirmMode === "remove" ? "Remove from Favorites" : "Unfollow"
          }
          onClose={() => {
            setConfirmOpen(false);
            setSelectedPro(null);
          }}
        >
          <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <img
                src={selectedPro.image}
                alt={selectedPro.name}
                className="w-12 h-12 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <div className="font-semibold truncate">{selectedPro.name}</div>
                <div className="text-sm text-gray-500 truncate">
                  {selectedPro.role}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {confirmMode === "remove"
                ? "You can save them again anytime from their profile."
                : "You can follow again anytime to get updates."}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => {
                setConfirmOpen(false);
                setSelectedPro(null);
              }}
              className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmAction}
              className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
            >
              Confirm
            </button>
          </div>
        </Sheet>
      )}

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[60] transition-all duration-200 ${
          toast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg">
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function ProCard({
  pro,
  isFavorite,
  isFollowing,
  notifyOn,
  onToggleFav,
  onToggleFollow,
  onToggleNotify,
  onOpenProfile,
  onTipNow,
  onRemove,
  onUnfollow,
  tab,
}: {
  pro: Pro;
  isFavorite: boolean;
  isFollowing: boolean;
  notifyOn: boolean;
  onToggleFav: () => void;
  onToggleFollow: () => void;
  onToggleNotify: () => void;
  onOpenProfile: () => void;
  onTipNow: () => void;
  onRemove: () => void;
  onUnfollow: () => void;
  tab: "favorites" | "following";
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={pro.image}
            alt={pro.name}
            className="w-14 h-14 rounded-2xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-lg truncate">
                    {pro.name}
                  </div>
                  {pro.verified && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <BadgeCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {pro.role} · {formatDistance(pro.distanceMi)}
                </div>
              </div>

              <button
                onClick={onToggleFav}
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition ${
                  isFavorite
                    ? "bg-pink-50 border-pink-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
                aria-label="Favorite"
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite ? "text-pink-500 fill-pink-500" : "text-gray-700"
                  }`}
                />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-100 inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-500" /> {pro.rating} (
                {pro.reviews})
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                Avg tip {money(pro.avgTip)}
              </span>
              {pro.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={onOpenProfile}
                className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                View Profile
              </button>
              <button
                onClick={onTipNow}
                className="h-11 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
              >
                Tip Now
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {pro.tippedBefore ? (
                  <span>
                    Tipped before
                    {typeof pro.lastTippedDaysAgo === "number"
                      ? ` · ${pro.lastTippedDaysAgo}d ago`
                      : ""}
                  </span>
                ) : (
                  <span>Not tipped yet</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleNotify}
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition ${
                    notifyOn
                      ? "bg-blue-50 border-blue-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  aria-label="Notifications"
                >
                  <Bell
                    className={`w-4 h-4 ${
                      notifyOn ? "text-blue-700" : "text-gray-700"
                    }`}
                  />
                </button>

                <button
                  onClick={onToggleFollow}
                  className={`h-10 px-3 rounded-2xl border font-semibold inline-flex items-center gap-2 transition ${
                    isFollowing
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />{" "}
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              {tab === "favorites" ? (
                <button
                  onClick={onRemove}
                  className="text-gray-500 hover:underline"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={onUnfollow}
                  className="text-gray-500 hover:underline"
                >
                  Unfollow
                </button>
              )}
              <div className="text-gray-400">USD</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="h-9 px-3 rounded-full bg-white/15 border border-white/20 text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-white/20"
    >
      {label}
      <X className="w-4 h-4" />
    </button>
  );
}

function EmptyState({
  tab,
  onPrimary,
  onSecondary,
}: {
  tab: "favorites" | "following";
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const title =
    tab === "favorites" ? "No favorites yet" : "Not following anyone";
  const subtitle =
    tab === "favorites"
      ? "Save pros you like to tip faster next time."
      : "Follow pros to get updates when they're live nearby.";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Heart className="w-6 h-6 text-blue-700" />
      </div>
      <div className="mt-3 text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-gray-500">{subtitle}</div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={onPrimary}
          className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
        >
          Go to Discover
        </button>
        <button
          onClick={onSecondary}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Clear filters
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>
          Tip history stays in Wallet even if you remove a pro from Saved.
        </span>
      </div>
    </div>
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
    <button
      onClick={onChange}
      className="w-full text-left rounded-3xl border border-gray-100 bg-gray-50 p-4 hover:bg-gray-100 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
        </div>
        <div
          className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${
            checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </button>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setMounted(false);
    setTimeout(() => onClose(), 180);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-label="Close overlay"
      />
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
          mounted ? "translate-y-0" : "translate-y-[420px]"
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
            <div className="text-sm text-gray-500 mt-0.5">X2.7 (mock)</div>
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
      /* No custom scrollbar needed; we use a right-side indicator */
    `}</style>
  );
}
