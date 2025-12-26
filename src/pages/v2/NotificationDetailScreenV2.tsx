import React, { useEffect, useMemo, useState } from "react";

/**
 * Screen Code: X5.9
 * Screen Name: Notification Detail (Deep Links + Receipt Preview)
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From X5.8 Inbox (tap notification)
 * Purpose:
 *  - Provide a rich, contextual detail page for a single notification
 *  - Show inline preview (Receipt / Tip / Case / Refund / Security)
 *  - Offer one primary CTA (deep link) + secondary actions (copy, mute topic, archive)
 * Notes:
 *  - Canvas-safe: no framer-motion
 *  - No lucide import (inline SVG icons to avoid CDN fetch issues)
 */

type NType = "Receipt" | "Reminder" | "Support" | "Refund" | "Security" | "Promo";

type Priority = "High" | "Normal";

type Notification = {
  id: string;
  type: NType;
  priority: Priority;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  topicKey: "tips" | "receipts" | "support" | "refunds" | "security" | "promos";
  meta?: {
    amount?: number;
    receiptNo?: string;
    proName?: string;
    venue?: string;
    method?: string;
    caseId?: string;
    refundRef?: string;
    device?: string;
    location?: string;
  };
  deepLink:
    | { kind: "tip"; screen: "X1.2"; receiptNo: string }
    | { kind: "receipt"; screen: "X3.2"; receiptNo: string }
    | { kind: "refund"; screen: "X4.5"; caseId: string }
    | { kind: "case"; screen: "X4.4"; caseId: string }
    | { kind: "security"; screen: "X6.2" }
    | { kind: "settings"; screen: "X5.4" }
    | { kind: "none" };
};

type Sheet = null | "actions" | "mute";

type ReceiptPreview = {
  receiptNo: string;
  amount: number;
  currency: "USD";
  proName: string;
  venue: string;
  date: string;
  method: string;
  refId: string;
  note?: string;
};

type SupportPreview = {
  caseId: string;
  status: "Open" | "In review" | "Resolved";
  lastMsg: string;
  sla: string;
};

type RefundPreview = {
  caseId: string;
  amount: number;
  eta: string;
  state: "In progress" | "Settled" | "Delayed";
  refId: string;
};

const DEMO_RECEIPT: ReceiptPreview = {
  receiptNo: "RCPT-481220",
  amount: 3.95,
  currency: "USD",
  proName: "Alex",
  venue: "Cafe Aura",
  date: "Dec 03, 2025 · 11:20 AM",
  method: "Visa •••• 2140",
  refId: "TIP-9B72-11F4",
  note: "Thanks for the great service!",
};

const DEMO_SUPPORT: SupportPreview = {
  caseId: "CASE-10492",
  status: "In review",
  lastMsg: "Please share your bank statement screenshot (last 4 digits only).",
  sla: "Reply within 24h",
};

const DEMO_REFUND: RefundPreview = {
  caseId: "CASE-10492",
  amount: 3.95,
  eta: "Expected in 3–7 business days",
  state: "In progress",
  refId: "RFND-7A2C-19F3",
};

const NOTIFICATIONS: Notification[] = [
  {
    id: "n_02",
    type: "Receipt",
    priority: "Normal",
    title: "Receipt saved",
    body: "$3.95 tip · Alex (Cafe Aura) · Tap to view/share.",
    time: "Today · 2:10 PM",
    unread: false,
    topicKey: "receipts",
    meta: { amount: 3.95, receiptNo: "RCPT-481220", proName: "Alex", venue: "Cafe Aura", method: "Visa •••• 2140" },
    deepLink: { kind: "receipt", screen: "X3.2", receiptNo: "RCPT-481220" },
  },
  {
    id: "n_01",
    type: "Reminder",
    priority: "High",
    title: "Tip reminder · Cafe Aura",
    body: "You left Cafe Aura 12 minutes ago. Want to tip Alex?",
    time: "Today · 12:42 PM",
    unread: true,
    topicKey: "tips",
    meta: { proName: "Alex", venue: "Cafe Aura", receiptNo: "RCPT-481220" },
    deepLink: { kind: "tip", screen: "X1.2", receiptNo: "RCPT-481220" },
  },
  {
    id: "n_04",
    type: "Support",
    priority: "High",
    title: "Support replied",
    body: "Case CASE-10492: Please share your bank statement screenshot (last 4 digits only).",
    time: "Dec 21 · 10:04 AM",
    unread: true,
    topicKey: "support",
    meta: { caseId: "CASE-10492" },
    deepLink: { kind: "case", screen: "X4.4", caseId: "CASE-10492" },
  },
  {
    id: "n_03",
    type: "Refund",
    priority: "Normal",
    title: "Refund initiated",
    body: "We started your refund. Track status and expected posting time.",
    time: "Dec 20 · 6:30 PM",
    unread: false,
    topicKey: "refunds",
    meta: { caseId: "CASE-10492", refundRef: "RFND-7A2C-19F3", amount: 3.95 },
    deepLink: { kind: "refund", screen: "X4.5", caseId: "CASE-10492" },
  },
  {
    id: "n_05",
    type: "Security",
    priority: "Normal",
    title: "New device sign-in",
    body: "We detected a sign-in from Chrome on Windows · Hyderabad, IN.",
    time: "Dec 19 · 9:18 PM",
    unread: false,
    topicKey: "security",
    meta: { device: "Chrome on Windows", location: "Hyderabad, IN" },
    deepLink: { kind: "security", screen: "X6.2" },
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function runDevChecks() {
  try {
    console.assert(money(3.95) === "$3.95", "money formats");
    console.assert(primaryCtaLabel("Receipt") === "View receipt", "cta label");
    console.assert(primaryCtaLabel("Reminder") === "Tip now", "cta label 2");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function NotificationDetailX59() {
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [mounted, setMounted] = useState(false);

  const [idx, setIdx] = useState(0);
  const n = NOTIFICATIONS[idx];

  const [archived, setArchived] = useState<Record<string, boolean>>({});
  const [mutedTopics, setMutedTopics] = useState<Record<Notification["topicKey"], boolean>>({
    tips: false,
    receipts: false,
    support: false,
    refunds: false,
    security: false,
    promos: false,
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!sheet) return;
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, [sheet]);

  const tone = useMemo(() => toneFor(n.type, n.priority), [n.type, n.priority]);

  function closeSheet() {
    setMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function deepLink() {
    const d = n.deepLink;
    if (d.kind === "tip") return setToast(`Open ${d.screen} · ${d.receiptNo} (mock)`);
    if (d.kind === "receipt") return setToast(`Open ${d.screen} · ${d.receiptNo} (mock)`);
    if (d.kind === "case") return setToast(`Open ${d.screen} · ${d.caseId} (mock)`);
    if (d.kind === "refund") return setToast(`Open ${d.screen} · ${d.caseId} (mock)`);
    if (d.kind === "security") return setToast(`Open ${d.screen} (mock)`);
    if (d.kind === "settings") return setToast(`Open ${d.screen} (mock)`);
    return setToast("No destination");
  }

  function copyAll() {
    const lines = [
      n.title,
      n.body,
      `Time: ${n.time}`,
      n.meta?.receiptNo ? `Receipt: ${n.meta.receiptNo}` : "",
      n.meta?.caseId ? `Case: ${n.meta.caseId}` : "",
      n.meta?.refundRef ? `Refund: ${n.meta.refundRef}` : "",
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join("\n"));
    setToast("Copied");
  }

  function archive() {
    setArchived((p) => ({ ...p, [n.id]: true }));
    setToast("Archived (mock)");
  }

  function unarchive() {
    setArchived((p) => ({ ...p, [n.id]: false }));
    setToast("Restored (mock)");
  }

  const isArchived = !!archived[n.id];
  const isMuted = !!mutedTopics[n.topicKey];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X5.8")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <IconBack />
          </button>
          <div className="text-white font-semibold">X5.9 · Detail</div>
          <button
            onClick={() => setSheet("actions")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="More"
          >
            <IconDots />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3">
        {/* Demo selector */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
          <div className="text-white text-xs font-semibold">Demo notification</div>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {NOTIFICATIONS.map((x, i) => (
              <button
                key={x.id}
                onClick={() => {
                  setIdx(i);
                  setToast("Loaded");
                }}
                className={`h-10 rounded-2xl border text-xs font-semibold ${
                  idx === i ? "bg-gray-900 text-white border-gray-900" : "bg-white/10 text-white border-white/20 hover:bg-white/15"
                }`}
                title={x.type}
              >
                {shortType(x.type)}
              </button>
            ))}
          </div>
          <div className="mt-2 text-white/80 text-xs">Switch types to see different previews & deep links.</div>
        </div>

        {/* Header card */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${tone.iconCls}`}>{iconFor(n.type)}</div>
            <div className="min-w-0 flex-1 text-white">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-lg truncate">{n.title}</div>
                  <div className="text-xs text-white/80 mt-0.5">{n.time}</div>
                </div>
                {n.priority === "High" ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 font-semibold">High</span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/20 bg-white/10 text-white font-semibold">Normal</span>
                )}
              </div>
              <div className="mt-2 text-sm text-white/90">{n.body}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${tone.pillCls}`}>{pillFor(n.type)}</span>
                {n.meta?.amount != null ? (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-800 font-semibold">{money(n.meta.amount)}</span>
                ) : null}
                {isMuted ? (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-800 font-semibold">Muted</span>
                ) : null}
                {isArchived ? (
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700 font-semibold">Archived</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={deepLink}
              className="h-12 rounded-2xl bg-white text-blue-700 font-semibold hover:bg-gray-50"
            >
              {primaryCtaLabel(n.type)}
            </button>
            <button
              onClick={() => setSheet("actions")}
              className="h-12 rounded-2xl bg-white/10 text-white border border-white/20 font-semibold hover:bg-white/15"
            >
              More actions
            </button>
          </div>

          <div className="mt-3 text-xs text-white/80 flex items-start gap-2">
            <span className="mt-0.5">
              <IconInfo />
            </span>
            <span>Deep link opens the relevant screen (mock). Preview below is a condensed snapshot.</span>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Preview</div>
              <div className="text-sm text-gray-500 mt-0.5">Auto-generated based on notification type.</div>
            </div>
            <button
              onClick={() => setToast("Preview expanded (mock)")}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Expand
            </button>
          </div>

          <div className="mt-3">
            {n.type === "Receipt" ? (
              <ReceiptCard r={DEMO_RECEIPT} />
            ) : n.type === "Reminder" ? (
              <TipReminderCard r={DEMO_RECEIPT} />
            ) : n.type === "Support" ? (
              <SupportCard s={DEMO_SUPPORT} />
            ) : n.type === "Refund" ? (
              <RefundCard r={DEMO_REFUND} />
            ) : n.type === "Security" ? (
              <SecurityCard device={n.meta?.device ?? "Unknown device"} location={n.meta?.location ?? "Unknown"} />
            ) : (
              <PromoCard />
            )}
          </div>
        </div>

        {/* Related items */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="font-semibold">Related</div>
          <div className="text-sm text-gray-500 mt-0.5">Quick shortcuts based on metadata.</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniAction
              icon={<IconReceipt />}
              title="Receipts"
              subtitle="Open X3.2"
              onClick={() => setToast("Open X3.2 (mock)")}
            />
            <MiniAction
              icon={<IconChat />}
              title="Support"
              subtitle="Open X4.4"
              onClick={() => setToast("Open X4.4 (mock)")}
            />
            <MiniAction
              icon={<IconShield />}
              title="Security"
              subtitle="Open X6.2"
              onClick={() => setToast("Open X6.2 (mock)")}
            />
            <MiniAction
              icon={<IconGear />}
              title="Categories"
              subtitle="Open X5.4"
              onClick={() => setToast("Open X5.4 (mock)")}
            />
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X5.9</div>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Keep it clean</div>
              <div className="text-xs text-white/75">Mute topics you don’t want to see.</div>
            </div>
            <button
              onClick={() => setSheet("mute")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Mute topics
            </button>
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
          <span className={toast?.includes("Open") || toast?.includes("Copied") || toast?.includes("Loaded") ? "okTick" : ""}>
            <IconCheck />
          </span>
          {toast ?? ""}
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet
          title={sheet === "actions" ? "Actions" : "Mute topics"}
          subtitle={sheet === "actions" ? `For: ${pillFor(n.type)}` : "Silence specific notifications"}
          mounted={mounted}
          onClose={closeSheet}
        >
          {sheet === "actions" ? (
            <ActionsSheet
              archived={isArchived}
              muted={isMuted}
              onCopy={copyAll}
              onArchive={archive}
              onUnarchive={unarchive}
              onMute={() => {
                setMutedTopics((p) => ({ ...p, [n.topicKey]: true }));
                setToast("Muted topic");
                closeSheet();
              }}
              onUnmute={() => {
                setMutedTopics((p) => ({ ...p, [n.topicKey]: false }));
                setToast("Unmuted topic");
                closeSheet();
              }}
              onOpenSettings={() => {
                setToast("Open X5.4 (mock)");
                closeSheet();
              }}
              onClose={closeSheet}
            />
          ) : (
            <MuteTopicsSheet
              state={mutedTopics}
              onToggle={(k) => setMutedTopics((p) => ({ ...p, [k]: !p[k] }))}
              onDone={() => {
                setToast("Saved");
                closeSheet();
              }}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}

function MiniAction({
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
    <button onClick={onClick} className="rounded-3xl border border-gray-100 bg-gray-50 p-4 text-left hover:bg-gray-100 transition">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-gray-700">{icon}</div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function ReceiptCard({ r }: { r: ReceiptPreview }) {
  return (
    <div className="rounded-3xl border border-gray-100 overflow-hidden">
      <div className="p-4 bg-gradient-to-br from-gray-900 to-gray-700 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-white/75">Receipt preview</div>
            <div className="text-xl font-semibold mt-1">{money(r.amount)}</div>
            <div className="text-xs text-white/75 mt-1">{r.currency} · {r.date}</div>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-full border border-white/20 bg-white/10 font-semibold">{r.receiptNo}</span>
        </div>
      </div>
      <div className="p-4 bg-white">
        <div className="grid grid-cols-2 gap-2">
          <Meta label="Pro" value={r.proName} />
          <Meta label="Venue" value={r.venue} />
          <Meta label="Method" value={r.method} />
          <Meta label="Ref" value={r.refId} mono />
        </div>
        {r.note ? (
          <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-3">
            <div className="text-xs text-gray-500">Note</div>
            <div className="text-sm text-gray-800 mt-1">“{r.note}”</div>
          </div>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => alert("Share receipt (mock) → X3.2") } className="h-11 rounded-2xl bg-gray-900 text-white font-semibold">Share</button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(r.receiptNo);
            }}
            className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
          >
            Copy #
          </button>
        </div>
      </div>
    </div>
  );
}

function TipReminderCard({ r }: { r: ReceiptPreview }) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white border border-blue-200 text-blue-700 flex items-center justify-center">
          <IconClock />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Tip Alex now?</div>
          <div className="text-sm text-blue-900/80 mt-1">Cafe Aura · Receipt {r.receiptNo}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => alert("Open X1.2 tip flow (mock)")} className="h-11 rounded-2xl bg-gray-900 text-white font-semibold">Tip</button>
            <button onClick={() => alert("Snooze reminder (mock)")} className="h-11 rounded-2xl bg-white border border-blue-200 font-semibold hover:bg-gray-50">Snooze</button>
          </div>
          <div className="mt-2 text-xs text-blue-900/70">Tip reminders follow your quiet hours & venue rules.</div>
        </div>
      </div>
    </div>
  );
}

function SupportCard({ s }: { s: SupportPreview }) {
  const tone = s.status === "Resolved" ? "emerald" : s.status === "In review" ? "amber" : "blue";
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">Case</div>
          <div className="font-semibold mt-0.5">{s.caseId}</div>
        </div>
        <StatusPill tone={tone} label={s.status} />
      </div>
      <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-3">
        <div className="text-xs text-gray-500">Latest message</div>
        <div className="text-sm text-gray-800 mt-1">{s.lastMsg}</div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">SLA: <b>{s.sla}</b></div>
        <button onClick={() => alert("Open X4.4 chat (mock)")} className="h-10 px-3 rounded-2xl bg-gray-900 text-white font-semibold inline-flex items-center gap-2">
          <IconChat /> Reply
        </button>
      </div>
    </div>
  );
}

function RefundCard({ r }: { r: RefundPreview }) {
  const tone = r.state === "Settled" ? "emerald" : r.state === "Delayed" ? "amber" : "blue";
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">Refund</div>
          <div className="font-semibold mt-0.5">{money(r.amount)}</div>
          <div className="text-xs text-gray-500 mt-1">{r.eta}</div>
        </div>
        <StatusPill tone={tone} label={r.state} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Meta label="Case" value={r.caseId} mono />
        <Meta label="Ref" value={r.refId} mono />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => alert("Open X4.5 tracking (mock)")} className="h-11 rounded-2xl bg-gray-900 text-white font-semibold">Track</button>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(r.refId);
          }}
          className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Copy ref
        </button>
      </div>
    </div>
  );
}

function SecurityCard({ device, location }: { device: string; location: string }) {
  return (
    <div className="rounded-3xl border border-rose-100 bg-rose-50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white border border-rose-200 text-rose-700 flex items-center justify-center">
          <IconShield />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-rose-900">Security alert</div>
          <div className="text-sm text-rose-900/80 mt-1">{device} · {location}</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => alert("This was me (mock)")} className="h-11 rounded-2xl bg-gray-900 text-white font-semibold">This was me</button>
            <button onClick={() => alert("Secure account (mock) → X6.2")} className="h-11 rounded-2xl bg-white border border-rose-200 font-semibold hover:bg-gray-50">Secure</button>
          </div>
          <div className="mt-2 text-xs text-rose-900/70">We never ask for OTP/PIN in chat.</div>
        </div>
      </div>
    </div>
  );
}

function PromoCard() {
  return (
    <div className="rounded-3xl border border-purple-100 bg-purple-50 p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white border border-purple-200 text-purple-700 flex items-center justify-center">
          <IconSpark />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-purple-900">Invite & earn</div>
          <div className="text-sm text-purple-900/80 mt-1">Invite friends and earn credits when they tip.</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => alert("Share invite (mock)")} className="h-11 rounded-2xl bg-gray-900 text-white font-semibold">Invite</button>
            <button onClick={() => alert("Turn off promos (mock)")} className="h-11 rounded-2xl bg-white border border-purple-200 font-semibold hover:bg-gray-50">Mute promos</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ tone, label }: { tone: "emerald" | "amber" | "blue"; label: string }) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
      : tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-800"
      : "bg-blue-50 border-blue-100 text-blue-800";
  return <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${cls}`}>{label}</span>;
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 font-semibold truncate ${mono ? "font-mono text-[13px]" : ""}`}>{value}</div>
    </div>
  );
}

function ActionsSheet({
  archived,
  muted,
  onCopy,
  onArchive,
  onUnarchive,
  onMute,
  onUnmute,
  onOpenSettings,
  onClose,
}: {
  archived: boolean;
  muted: boolean;
  onCopy: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onMute: () => void;
  onUnmute: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <ActionBtn icon={<IconCopy />} title="Copy message" subtitle="Copy title + body + meta" onClick={onCopy} />
      {!archived ? (
        <ActionBtn icon={<IconArchive />} title="Archive" subtitle="Hide from inbox" onClick={onArchive} />
      ) : (
        <ActionBtn icon={<IconUndo />} title="Restore" subtitle="Move back to inbox" onClick={onUnarchive} />
      )}
      {!muted ? (
        <ActionBtn icon={<IconBellOff />} title="Mute this topic" subtitle="Stop similar notifications" onClick={onMute} />
      ) : (
        <ActionBtn icon={<IconBell />} title="Unmute this topic" subtitle="Resume notifications" onClick={onUnmute} />
      )}
      <ActionBtn icon={<IconGear />} title="Manage categories" subtitle="Open X5.4" onClick={onOpenSettings} />

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <span className="mt-0.5"><IconInfo /></span>
        <span>Production: include “Report notification” and “Mark unread”.</span>
      </div>
    </div>
  );
}

function ActionBtn({
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
    <button onClick={onClick} className="w-full rounded-3xl border border-gray-100 bg-white p-4 text-left hover:bg-gray-50 transition">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700">{icon}</div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
        </div>
      </div>
    </button>
  );
}

function MuteTopicsSheet({
  state,
  onToggle,
  onDone,
}: {
  state: Record<Notification["topicKey"], boolean>;
  onToggle: (k: Notification["topicKey"]) => void;
  onDone: () => void;
}) {
  const topics: Array<{ k: Notification["topicKey"]; label: string; hint: string; icon: React.ReactNode }> = [
    { k: "tips", label: "Tip reminders", hint: "Missed tip nudges", icon: <IconClock /> },
    { k: "receipts", label: "Receipts", hint: "Saved receipts & share links", icon: <IconReceipt /> },
    { k: "support", label: "Support", hint: "Case messages", icon: <IconChat /> },
    { k: "refunds", label: "Refunds", hint: "Settlement tracking", icon: <IconRefund /> },
    { k: "security", label: "Security", hint: "Login & device alerts", icon: <IconShield /> },
    { k: "promos", label: "Promos", hint: "Offers & campaigns", icon: <IconSpark /> },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Mute topics</div>
        <div className="text-sm text-gray-600 mt-1">Muted topics won’t appear in inbox.</div>
      </div>

      <div className="space-y-2">
        {topics.map((t) => (
          <ToggleRow
            key={t.k}
            title={t.label}
            subtitle={t.hint}
            on={state[t.k]}
            onToggle={() => onToggle(t.k)}
            left={t.icon}
          />
        ))}
      </div>

      <button onClick={onDone} className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold">
        Save
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <span className="mt-0.5"><IconInfo /></span>
        <span>Production: support Quiet Hours + per-venue overrides (X5.6 + X5.7).</span>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  subtitle,
  on,
  onToggle,
  left,
}: {
  title: string;
  subtitle: string;
  on: boolean;
  onToggle: () => void;
  left?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 p-4 flex items-start justify-between gap-3 bg-white">
      <div className="flex items-start gap-3 min-w-0">
        {left ? (
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${on ? "bg-gray-900 border-gray-900 text-white" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            {left}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          <div className="text-sm text-gray-600 mt-0.5">{subtitle}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${on ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}
        aria-label={`Toggle ${title}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white transition ${on ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function primaryCtaLabel(t: NType) {
  if (t === "Receipt") return "View receipt";
  if (t === "Reminder") return "Tip now";
  if (t === "Support") return "Reply";
  if (t === "Refund") return "Track refund";
  if (t === "Security") return "Review";
  return "Learn more";
}

function pillFor(t: NType) {
  if (t === "Receipt") return "Receipts";
  if (t === "Reminder") return "Reminders";
  if (t === "Support") return "Support";
  if (t === "Refund") return "Refunds";
  if (t === "Security") return "Security";
  return "Promos";
}

function shortType(t: NType) {
  if (t === "Receipt") return "Rcp";
  if (t === "Reminder") return "Tip";
  if (t === "Support") return "CS";
  if (t === "Refund") return "Rfnd";
  if (t === "Security") return "Sec";
  return "Pro";
}

function toneFor(type: NType, pri: Priority) {
  const high = pri === "High";
  if (type === "Security")
    return {
      iconCls: high ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-gray-50 border-gray-200 text-gray-700",
      pillCls: high ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-gray-50 border-gray-200 text-gray-700",
    };
  if (type === "Refund" || type === "Support")
    return { iconCls: "bg-amber-50 border-amber-100 text-amber-700", pillCls: "bg-amber-50 border-amber-100 text-amber-800" };
  if (type === "Receipt")
    return { iconCls: "bg-emerald-50 border-emerald-100 text-emerald-700", pillCls: "bg-emerald-50 border-emerald-100 text-emerald-800" };
  if (type === "Reminder")
    return {
      iconCls: high ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-sky-50 border-sky-100 text-sky-700",
      pillCls: high ? "bg-blue-50 border-blue-100 text-blue-800" : "bg-sky-50 border-sky-100 text-sky-800",
    };
  return { iconCls: "bg-purple-50 border-purple-100 text-purple-700", pillCls: "bg-purple-50 border-purple-100 text-purple-800" };
}

function iconFor(t: NType) {
  if (t === "Receipt") return <IconReceipt />;
  if (t === "Reminder") return <IconClock />;
  if (t === "Support") return <IconChat />;
  if (t === "Refund") return <IconRefund />;
  if (t === "Security") return <IconShield />;
  return <IconSpark />;
}

function Sheet({
  title,
  subtitle,
  mounted,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  mounted: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close overlay" />
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
          mounted ? "translate-y-0" : "translate-y-[820px]"
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
            <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* =========================
   Inline Icons
   ========================= */

function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconDots() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h.01M12 12h.01M19 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
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

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 9h10v10H9V9Z" stroke="currentColor" strokeWidth="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconUndo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 17a8 8 0 0 0-8-8H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBellOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7h6M9 11h6M9 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 9h10M7 13h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconRefund() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 3v7h-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 20 6v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l1.2 6.2L20 10l-6.8 1.8L12 18l-1.2-6.2L4 10l6.8-1.8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.5-2-3.5-2.4.6a8 8 0 0 0-1.7-1L15 3h-6l-.4 2.6a8 8 0 0 0-1.7 1L4.5 6.1l-2 3.5 2 1.5a7.9 7.9 0 0 0 .1 2l-2 1.5 2 3.5 2.4-.6a8 8 0 0 0 1.7 1L9 21h6l.4-2.6a8 8 0 0 0 1.7-1l2.4.6 2-3.5-2-1.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* =========================
   Styles
   ========================= */

function StyleBlock() {
  return (
    <style>{`
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }
      /* light scrollbar */
      ::-webkit-scrollbar{ width:10px; height:10px; }
      ::-webkit-scrollbar-thumb{ background: rgba(0,0,0,.12); border-radius: 999px; border: 3px solid rgba(255,255,255,.9); }
    `}</style>
  );
}
