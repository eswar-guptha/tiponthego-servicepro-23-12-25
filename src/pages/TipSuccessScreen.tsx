import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Heart,
  Info,
  Link2,
  Lock,
  MessageCircle,
  QrCode,
  Receipt,
  Share2,
  Sparkles,
  Star,
  UserPlus,
  X,
} from "lucide-react";

/**
 * Screen Code: X2.6
 * Screen Name: Tip Success (Animated + Share)
 * Currency: USD
 * Roles: Customer / Guest
 * Entry: From X2.5 Confirm & Pay OR X1.1 Tip Now
 * Next: X1.2 Tip Receipt (full screen)
 *
 * Debug Fix:
 * - Removed framer-motion (can throw `TypeError: Illegal constructor` in some sandboxed runtimes)
 * - Replaced animations with lightweight CSS keyframes + CSS transitions
 * - Added missing icon imports (Lock, Info)
 */

type Pro = {
  name: string;
  role: string;
  rating: number;
  verified: boolean;
  image: string;
};

const DEMO = {
  pro: {
    name: "Alex Johnson",
    role: "Street Performer",
    rating: 4.9,
    verified: true,
    image: "https://i.pravatar.cc/240?img=12",
  } satisfies Pro,
  amount: 10,
  emoji: "👏",
  txnId: `TXN-${String(Date.now()).slice(-6)}`,
  when: new Date().toLocaleString(),
  location: "Downtown Plaza",
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money format");
    console.assert(clamp01(-1) === 0, "clamp01 low");
    console.assert(clamp01(2) === 1, "clamp01 high");
    console.assert(
      typeof DEMO.txnId === "string" && DEMO.txnId.startsWith("TXN-"),
      "txn id format"
    );
  } catch {
    // never crash UI due to checks
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function TipSuccessScreen() {
  const [shareOpen, setShareOpen] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({ size: 0.32, top: 0 }));

  const shareLink = useMemo(() => `https://tip.app/r/${DEMO.txnId}`, []);

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Link copied");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setToast("Link copied");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X2.5")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X2.6 · Tip Success</div>
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
        {/* Scrollable body */}
        <div
          ref={pageRef}
          className="max-w-md mx-auto px-4 pt-5 pb-28 h-[calc(100vh-64px)] overflow-y-auto pr-5"
        >
          {/* Success hero */}
          <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div
                      className="absolute inset-0 rounded-2xl pulse-emerald"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <div className="text-xl font-semibold">Tip sent!</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Your appreciation made their day.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setLiked((v) => !v)}
                  className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition ${
                    liked
                      ? "bg-pink-50 border-pink-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  aria-label="Like"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      liked ? "text-pink-500 fill-pink-500" : "text-gray-700"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={DEMO.pro.image}
                    alt={DEMO.pro.name}
                    className="w-14 h-14 rounded-2xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-lg truncate">
                        {DEMO.pro.name}
                      </div>
                      {DEMO.pro.verified && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {DEMO.pro.role}
                    </div>
                    <div className="mt-2 text-xs text-gray-600 inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-500" />{" "}
                        {DEMO.pro.rating}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-700" />{" "}
                        {DEMO.emoji}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-gray-500">Amount</div>
                    <div className="text-xl font-semibold">
                      {money(DEMO.amount)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confetti particles (CSS animation) */}
              <Confetti emoji={DEMO.emoji} />
            </div>
          </div>

          {/* Primary actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setToast("Opening receipt (mock)");
                alert("Next: X1.2 – Tip Receipt (mock route)");
              }}
              className="h-12 rounded-2xl bg-white border border-gray-100 shadow-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <Receipt className="w-4 h-4" /> Receipt
            </button>

            <button
              onClick={() => setShareOpen(true)}
              className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
          </div>

          {/* Secondary actions */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setToast("Tip again (mock)");
                alert("Back to X2.4 / X2.3 (mock)");
              }}
              className="h-12 rounded-2xl bg-white border border-gray-100 shadow-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <ExternalLink className="w-4 h-4" /> Tip again
            </button>

            <button
              onClick={() => {
                setFollowed((v) => !v);
                setToast(!followed ? "Followed" : "Unfollowed");
              }}
              className={`h-12 rounded-2xl border shadow-sm font-semibold inline-flex items-center justify-center gap-2 transition ${
                followed
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-white border-gray-100 hover:bg-gray-50"
              }`}
            >
              <UserPlus className="w-4 h-4" />{" "}
              {followed ? "Following" : "Follow"}
            </button>
          </div>

          {/* Tip details */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="font-semibold">Transaction</div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Receipt #" value={DEMO.txnId} />
              <Row label="Date" value={DEMO.when} />
              <Row label="Location" value={DEMO.location} />
              <Row
                label="Status"
                value={
                  <span className="text-emerald-700 font-semibold">
                    Success
                  </span>
                }
              />
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-semibold">Protected tip</div>
                <div className="mt-0.5">
                  We monitor fraud and disputes. Your receipt is always
                  available.
                </div>
              </div>
            </div>
          </div>

          {/* Suggestions / upsell */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="font-semibold">Do more</div>
            <div className="text-xs text-gray-500 mt-1">
              Optional actions to improve retention
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <ActionCard
                icon={<QrCode className="w-4 h-4" />}
                title="Scan QR"
                subtitle="Tip instantly"
                onClick={() => alert("Next: X2.2 – QR Scan (mock route)")}
              />
              <ActionCard
                icon={<MessageCircle className="w-4 h-4" />}
                title="Send thanks"
                subtitle="Quick message"
                onClick={() => setToast("Thanks sent (mock)")}
              />
              <ActionCard
                icon={<Link2 className="w-4 h-4" />}
                title="Copy link"
                subtitle="Share receipt"
                onClick={() => copyToClipboard(shareLink)}
              />
              <ActionCard
                icon={<Download className="w-4 h-4" />}
                title="Download"
                subtitle="PDF invoice"
                onClick={() => alert("Download receipt PDF (mock)")}
              />
            </div>
          </div>

          {/* Spacer */}
          <div className="h-8" />
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

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-3 flex items-center gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">Sent</div>
              <div className="text-xs text-gray-500">
                {money(DEMO.amount)} · {DEMO.emoji}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShareOpen(true)}
                className="h-11 px-4 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={() => alert("Next: X1.2 – Tip Receipt (mock route)")}
                className="h-11 px-4 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
              >
                <Receipt className="w-4 h-4" /> Receipt
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share sheet (CSS transitions, no AnimatePresence) */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-label="Share tip"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShareOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden slide-up">
            <div className="pt-3 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-gray-200" />
            </div>

            <div className="px-4 pt-3 pb-4 border-b bg-white flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-lg">Share your tip</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Send a link or a message.
                </div>
              </div>
              <button
                onClick={() => setShareOpen(false)}
                className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                aria-label="Close share"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Share link</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 min-w-0 font-mono text-xs bg-white border border-gray-200 rounded-2xl px-3 py-3 truncate">
                    {shareLink}
                  </div>
                  <button
                    onClick={() => copyToClipboard(shareLink)}
                    className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    aria-label="Copy"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <ShareChip
                  label="WhatsApp"
                  onClick={() => setToast("WhatsApp (mock)")}
                />
                <ShareChip label="SMS" onClick={() => setToast("SMS (mock)")} />
                <ShareChip
                  label="Instagram"
                  onClick={() => setToast("Instagram (mock)")}
                />
                <ShareChip
                  label="More"
                  onClick={() => setToast("More… (mock)")}
                />
              </div>

              <button
                onClick={() => {
                  setShareOpen(false);
                  setToast("Shared (mock)");
                }}
                className="w-full h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share now
              </button>

              <div className="text-[11px] text-gray-500 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5" />
                <span>
                  Only share links with people you trust. Receipts never expose
                  payment details.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast (CSS transitions) */}
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

function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-3xl border border-gray-100 bg-gray-50 p-4 hover:bg-gray-100 transition"
    >
      <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
        <span className="text-gray-900">{icon}</span>
      </div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
    </button>
  );
}

function ShareChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold text-sm hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

function Confetti({ emoji }: { emoji: string }) {
  const pieces = useMemo(() => Array.from({ length: 18 }, (_, i) => i), []);
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {pieces.map((i) => {
        const left = 30 + (i % 6) * 12; // percent
        const delay = (i * 0.03).toFixed(2);
        const duration = (1.05 + (i % 4) * 0.08).toFixed(2);
        const size = 18 + (i % 3) * 4;
        return (
          <span
            key={i}
            className="confetti"
            style={
              {
                left: `${left}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                fontSize: `${size}px`,
              } as React.CSSProperties
            }
          >
            {emoji}
          </span>
        );
      })}
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      .pulse-emerald {
        background: rgba(16,185,129,.25);
        animation: pulse 1.6s ease-in-out infinite;
      }
      @keyframes pulse {
        0% { opacity: .35; transform: scale(1); }
        50% { opacity: 0; transform: scale(1.25); }
        100% { opacity: .35; transform: scale(1); }
      }

      .slide-up {
        animation: slideUp 220ms ease-out;
      }
      @keyframes slideUp {
        from { transform: translateY(28px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      .confetti {
        position: absolute;
        top: 62%;
        transform: translate(-50%, 0);
        opacity: 0;
        filter: drop-shadow(0 8px 12px rgba(0,0,0,.12));
        animation-name: confettiUp;
        animation-timing-function: ease-out;
        animation-fill-mode: both;
      }
      @keyframes confettiUp {
        0% { opacity: 0; transform: translate(-50%, 110px) rotate(0deg) scale(.9); }
        15% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, -260px) rotate(360deg) scale(1.05); }
      }
    `}</style>
  );
}
