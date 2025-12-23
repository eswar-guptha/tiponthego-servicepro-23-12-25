import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Copy,
  Download,
  FileText,
  Info,
  Lock,
  MapPin,
  Receipt,
  Share2,
  Star,
  X,
} from "lucide-react";

/**
 * Screen Code: X1.2
 * Screen Name: Tip Receipt (Full Screen)
 * Currency: USD
 * Roles: Customer / Guest
 * Entry: X2.6 Tip Success OR X1.1 Tip Now success
 * Next: X3.1 Wallet / History (recommended)
 *
 * Canvas Compatibility:
 * - No framer-motion (avoids Illegal constructor in some sandbox previews)
 * - Uses CSS transitions + minimal JS for: toast + share sheet + right-side scroll indicator
 */

type Pro = {
  name: string;
  role: string;
  rating: number;
  verified: boolean;
  image: string;
};

type ReceiptModel = {
  receiptNo: string;
  createdAt: string;
  status: "Success" | "Pending" | "Failed";
  amountTip: number;
  platformFee: number;
  processingFee: number;
  tax: number;
  totalCharged: number;
  emoji: string;
  message?: string;
  paymentMethod: string;
  cardLast4?: string;
  pro: Pro;
  locationLabel: string;
  locationSub: string;
};

const DEMO: ReceiptModel = {
  receiptNo: `RCPT-${String(Date.now()).slice(-6)}`,
  createdAt: new Date().toLocaleString(),
  status: "Success",
  amountTip: 10,
  platformFee: 0.7,
  processingFee: 0.35,
  tax: 0.25,
  totalCharged: 11.3,
  emoji: "👏",
  message: "Loved the performance — keep it going!",
  paymentMethod: "Card",
  cardLast4: "4821",
  pro: {
    name: "Alex Johnson",
    role: "Street Performer",
    rating: 4.9,
    verified: true,
    image: "https://i.pravatar.cc/240?img=12",
  },
  locationLabel: "Downtown Plaza",
  locationSub: "Near fountain · 0.2 mi",
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money formats");
    console.assert(clamp01(-1) === 0, "clamp01 low");
    console.assert(clamp01(2) === 1, "clamp01 high");
    const sum =
      DEMO.amountTip + DEMO.platformFee + DEMO.processingFee + DEMO.tax;
    console.assert(
      Math.abs(sum - DEMO.totalCharged) < 0.02,
      "fees should add up to total"
    );
  } catch {
    // never crash UI
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function TipReceiptScreenV1() {
  const [toast, setToast] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMounted, setShareMounted] = useState(false);

  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({ size: 0.32, top: 0 }));

  const shareLink = useMemo(
    () => `https://tip.app/receipt/${DEMO.receiptNo}`,
    []
  );

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
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!shareOpen) return;
    setShareMounted(false);
    const t = setTimeout(() => setShareMounted(true), 10);
    return () => clearTimeout(t);
  }, [shareOpen]);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Copied");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setToast("Copied");
    }
  }

  function closeShare() {
    setShareMounted(false);
    setTimeout(() => setShareOpen(false), 180);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X2.6")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X1.2 · Tip Receipt</div>
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
        {/* Scrollable page */}
        <div
          ref={pageRef}
          className="max-w-md mx-auto px-4 pt-5 pb-28 h-[calc(100vh-64px)] overflow-y-auto pr-5"
        >
          {/* Receipt header card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-blue-700" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Receipt</div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      #{DEMO.receiptNo}
                    </div>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />{" "}
                  {DEMO.status}
                </span>
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
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                          <BadgeCheck className="w-3.5 h-3.5" /> Verified
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
                        {DEMO.emoji} Appreciation
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-gray-500">Total</div>
                    <div className="text-2xl font-semibold">
                      {money(DEMO.totalCharged)}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">USD</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShareOpen(true)}
                  className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={() => {
                    setToast("Downloading (mock)");
                    alert("Download PDF (mock)");
                  }}
                  className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5" />
                <span>
                  Protected receipt. No payment details are shared when you
                  share the link.
                </span>
              </div>
            </div>
          </div>

          {/* Receipt details */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="font-semibold">Details</div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Date" value={DEMO.createdAt} />
              <Row label="Currency" value="USD" />
              <Row
                label="Payment"
                value={`${DEMO.paymentMethod}${
                  DEMO.cardLast4 ? ` •••• ${DEMO.cardLast4}` : ""
                }`}
              />
              <Row label="Category" value="Digital Tipping" />
            </div>
          </div>

          {/* Location card */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Location</div>
              <button
                onClick={() => setToast("Opening map (mock)")}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                View
              </button>
            </div>
            <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-gray-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">
                    {DEMO.locationLabel}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {DEMO.locationSub}
                  </div>
                  <div className="mt-3 h-20 rounded-2xl bg-white border border-gray-200 overflow-hidden relative">
                    <div
                      className="absolute inset-0 opacity-60"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(0,0,0,.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.06) 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                      }}
                    />
                    <div className="absolute left-8 top-8 w-3 h-3 rounded-full bg-blue-600" />
                    <div className="absolute left-8 top-8 w-10 h-10 rounded-full bg-blue-600/20" />
                    <div className="absolute right-7 bottom-6 w-3 h-3 rounded-full bg-emerald-500" />
                    <div className="absolute right-7 bottom-6 w-10 h-10 rounded-full bg-emerald-500/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount breakdown */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="font-semibold">Amount breakdown</div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Tip" value={money(DEMO.amountTip)} />
              <Row label="Platform fee" value={money(DEMO.platformFee)} />
              <Row label="Processing" value={money(DEMO.processingFee)} />
              <Row label="Tax" value={money(DEMO.tax)} />
              <Divider />
              <Row
                label={<span className="font-semibold">Total charged</span>}
                value={
                  <span className="font-semibold">
                    {money(DEMO.totalCharged)}
                  </span>
                }
              />
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-semibold">Fees explained</div>
                <div className="mt-0.5">
                  Fees help run payments, fraud protection, and platform
                  operations.
                </div>
              </div>
            </div>
          </div>

          {/* Message / note */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Your note</div>
              <span className="text-xs text-gray-500">Optional</span>
            </div>
            <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm text-gray-700 leading-relaxed">
                {DEMO.message || "—"}
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="mt-4 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="font-semibold">Help</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => alert("Support chat (mock)")}
                className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <FileText className="w-4 h-4" /> Support
              </button>
              <button
                onClick={() => alert("Report issue (mock)")}
                className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
              >
                <Info className="w-4 h-4" /> Report
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Refunds depend on platform policy and local regulations.
            </div>
          </div>

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
              <div className="text-sm font-semibold truncate">
                Receipt #{DEMO.receiptNo}
              </div>
              <div className="text-xs text-gray-500">
                {money(DEMO.totalCharged)} · {DEMO.status}
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
                onClick={() => {
                  setToast("Downloading (mock)");
                  alert("Download PDF (mock)");
                }}
                className="h-11 px-4 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share sheet */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={closeShare}
            aria-label="Close overlay"
          />
          <div
            role="dialog"
            aria-label="Share receipt"
            className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
              shareMounted ? "translate-y-0" : "translate-y-[420px]"
            }`}
          >
            <div className="pt-3 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-gray-200" />
            </div>

            <div className="px-4 pt-3 pb-4 border-b bg-white flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-lg">Share receipt</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Link hides payment details.
                </div>
              </div>
              <button
                onClick={closeShare}
                className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                aria-label="Close share"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="text-xs text-gray-500">Receipt link</div>
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

              <button
                onClick={() => {
                  closeShare();
                  setToast("Shared (mock)");
                }}
                className="w-full h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share now
              </button>

              <div className="text-[11px] text-gray-500 flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5" />
                <span>
                  Share links are read-only and expire if a dispute is opened.
                </span>
              </div>
            </div>
          </div>
        </div>
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

function Divider() {
  return <div className="my-2 border-t border-gray-100" />;
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-gray-600">{label}</div>
      <div className="text-gray-900 text-right">{value}</div>
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      /* No custom scrollbar styles needed; we provide a right-side scroll indicator */
    `}</style>
  );
}
