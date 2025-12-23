import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  FileText,
  Filter,
  HelpCircle,
  Info,
  Mail,
  MessageSquare,
  Phone,
  Receipt,
  Search,
  Shield,
  Upload,
  User,
  X,
} from "lucide-react";

/**
 * Screen Code: X4.3
 * Screen Name: Case Status / Ticket Timeline
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - Post submit from X4.2
 *  - From Wallet > Reports list (future)
 * Purpose:
 *  - Show ticket status, SLA, and a transparent timeline
 *  - Allow user to add evidence, message support, or close case
 *  - Provide resolution outcomes and refund/adjustment summary (mock)
 *
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Sheets/modals use CSS transitions only
 */

type CaseStatus = "Submitted" | "Under review" | "Need info" | "Resolved";

type Channel = "In-app" | "Email" | "Phone";

type Attachment = {
  id: string;
  name: string;
  type: "image" | "pdf";
  sizeKb: number;
};

type TimelineItem = {
  id: string;
  at: string;
  title: string;
  desc: string;
  by: "You" | "Support" | "System";
  statusTag?: CaseStatus;
  action?: "upload" | "reply" | "none";
};

type Case = {
  id: string;
  receiptNo: string;
  proName: string;
  proRole: string;
  proImage: string;
  createdAt: string;
  category: string;
  severity: "Low" | "Medium" | "High";
  status: CaseStatus;
  contact: Channel;
  sla: string;
  refundAmount?: number;
  adjustmentNote?: string;
  attachments: Attachment[];
  timeline: TimelineItem[];
};

const DEMO_CASES: Case[] = [
  {
    id: "CASE-10492",
    receiptNo: "RCPT-481220",
    proName: "Diego Rivera",
    proRole: "Delivery Partner",
    proImage: "https://i.pravatar.cc/240?img=54",
    createdAt: "Dec 02 · 1:25 PM",
    category: "Payment issue",
    severity: "Medium",
    status: "Need info",
    contact: "In-app",
    sla: "We typically respond in 24–48h",
    refundAmount: 3.95,
    adjustmentNote: "Refund initiated after verification.",
    attachments: [
      { id: "a1", name: "screenshot_1.png", type: "image", sizeKb: 640 },
      { id: "a2", name: "statement_1.pdf", type: "pdf", sizeKb: 210 },
    ],
    timeline: [
      {
        id: "e1",
        at: "Dec 02 · 1:25 PM",
        title: "Case submitted",
        desc: "We received your dispute and started a review.",
        by: "System",
        statusTag: "Submitted",
        action: "none",
      },
      {
        id: "e2",
        at: "Dec 02 · 2:05 PM",
        title: "Under review",
        desc: "Support is verifying payment processor logs.",
        by: "Support",
        statusTag: "Under review",
        action: "none",
      },
      {
        id: "e3",
        at: "Dec 02 · 4:12 PM",
        title: "Need info",
        desc: "Please confirm whether you saw a success screen after paying and share any additional proof.",
        by: "Support",
        statusTag: "Need info",
        action: "upload",
      },
      {
        id: "e4",
        at: "Dec 03 · 10:04 AM",
        title: "You replied",
        desc: "Added details: payment app showed pending for 10 minutes.",
        by: "You",
        action: "reply",
      },
      {
        id: "e5",
        at: "Dec 03 · 11:20 AM",
        title: "Refund initiated",
        desc: "Refund of $3.95 started. It may take 3–7 business days.",
        by: "Support",
        statusTag: "Resolved",
        action: "none",
      },
    ],
  },
  {
    id: "CASE-10451",
    receiptNo: "RCPT-480980",
    proName: "Alex Johnson",
    proRole: "Street Performer",
    proImage: "https://i.pravatar.cc/240?img=12",
    createdAt: "Nov 26 · 8:22 PM",
    category: "Wrong pro / wrong place",
    severity: "Low",
    status: "Resolved",
    contact: "Email",
    sla: "Resolved within 18h",
    refundAmount: 7.1,
    adjustmentNote: "Tip canceled and refunded.",
    attachments: [
      { id: "b1", name: "screenshot_1.png", type: "image", sizeKb: 512 },
    ],
    timeline: [
      {
        id: "f1",
        at: "Nov 26 · 8:22 PM",
        title: "Case submitted",
        desc: "We received your report.",
        by: "System",
        statusTag: "Submitted",
      },
      {
        id: "f2",
        at: "Nov 26 · 9:10 PM",
        title: "Under review",
        desc: "Support validated location + QR mapping.",
        by: "Support",
        statusTag: "Under review",
      },
      {
        id: "f3",
        at: "Nov 27 · 2:40 PM",
        title: "Resolved",
        desc: "Refund processed. Please retry tipping the correct pro.",
        by: "Support",
        statusTag: "Resolved",
      },
    ],
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function uid() {
  return Math.random().toString(16).slice(2);
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money formats");
    console.assert(clamp01(-1) === 0, "clamp01 low");
    console.assert(clamp01(2) === 1, "clamp01 high");
    console.assert(uid().length > 0, "uid ok");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function CaseStatusScreenV1() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatus>("All");
  const [activeId, setActiveId] = useState(DEMO_CASES[0].id);

  const [sheet, setSheet] = useState<
    null | "filters" | "addEvidence" | "message" | "close"
  >(null);
  const [sheetMounted, setSheetMounted] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  // Evidence (mock)
  const [newAttachments, setNewAttachments] = useState<Attachment[]>([]);

  // Messaging (mock)
  const [channel, setChannel] = useState<Channel>("In-app");
  const [email, setEmail] = useState("adusu.india@gmail.com");
  const [phone, setPhone] = useState("+1 (555) 012-9087");
  const [message, setMessage] = useState("");

  // Scroll indicator
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({ size: 0.32, top: 0 }));

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!sheet) return;
    setSheetMounted(false);
    const t = setTimeout(() => setSheetMounted(true), 10);
    return () => clearTimeout(t);
  }, [sheet]);

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_CASES.filter((c) => {
      const matchesQ =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.receiptNo.toLowerCase().includes(q) ||
        c.proName.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "All" ? true : c.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [query, statusFilter]);

  const active = useMemo(() => {
    const byId = DEMO_CASES.find((c) => c.id === activeId);
    return byId ?? filtered[0] ?? DEMO_CASES[0];
  }, [activeId, filtered]);

  // Keep user contact in sync with the case preference
  useEffect(() => {
    setChannel(active.contact);
  }, [active.id]);

  function closeSheet() {
    setSheetMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function openSheet(kind: NonNullable<typeof sheet>) {
    setSheet(kind);
  }

  function addAttachment(kind: "image" | "pdf") {
    const a: Attachment = {
      id: uid(),
      name:
        kind === "image"
          ? `evidence_${newAttachments.length + 1}.png`
          : `evidence_${newAttachments.length + 1}.pdf`,
      type: kind,
      sizeKb: kind === "image" ? 580 : 240,
    };
    setNewAttachments((prev) => [...prev, a]);
    setToast("Added evidence (mock)");
  }

  function removeNewAttachment(id: string) {
    setNewAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function submitEvidence() {
    if (newAttachments.length === 0) {
      setToast("Add at least one attachment");
      return;
    }
    setToast("Evidence submitted (mock)");
    setNewAttachments([]);
    closeSheet();
  }

  function sendMessage() {
    if (!message.trim()) {
      setToast("Write a short message");
      return;
    }
    if (channel === "Email" && !email.includes("@")) {
      setToast("Enter a valid email");
      return;
    }
    if (channel === "Phone" && phone.trim().length < 6) {
      setToast("Enter a valid phone");
      return;
    }
    setToast("Message sent (mock)");
    setMessage("");
    closeSheet();
  }

  function closeCase() {
    setToast("Case closed (mock)");
    closeSheet();
  }

  const statusTone = useMemo(() => {
    if (active.status === "Resolved") return "emerald";
    if (active.status === "Need info") return "amber";
    if (active.status === "Under review") return "blue";
    return "gray";
  }, [active.status]);

  const progress = useMemo(() => {
    const order: CaseStatus[] = [
      "Submitted",
      "Under review",
      "Need info",
      "Resolved",
    ];
    const idx = order.indexOf(active.status);
    return Math.max(0, idx) / (order.length - 1);
  }, [active.status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X3.1 Wallet")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X4.3 · Case status</div>
          <button
            onClick={() => setToast("Help (mock)")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={pageRef}
          className="max-w-md mx-auto px-4 pb-28 pt-4 h-[calc(100vh-64px)] overflow-y-auto pr-5"
        >
          {/* Header */}
          <div className="bg-white/15 border border-white/20 rounded-3xl p-4">
            <div className="text-white">
              <div className="text-xs text-white/80 inline-flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Ticket timeline · USD</span>
              </div>
              <div className="text-2xl font-semibold mt-1">{active.id}</div>
              <div className="text-xs text-white/80 mt-1">{active.sla}</div>
            </div>

            {/* Search + filter */}
            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cases…"
                  className="w-full pl-9 pr-3 py-3 rounded-2xl bg-white/15 text-white placeholder:text-white/70 border border-white/20 outline-none focus:border-white/30"
                />
              </div>
              <button
                onClick={() => openSheet("filters")}
                className="w-11 h-11 rounded-2xl bg-white text-blue-700 font-semibold inline-flex items-center justify-center"
                aria-label="Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Case picker */}
            <div className="mt-3">
              <button
                onClick={() => setToast("Tap a case in the list below")}
                className="w-full rounded-2xl bg-white/10 border border-white/15 text-white px-3 py-3 flex items-center justify-between"
              >
                <span className="text-sm font-semibold">
                  Active: {active.id} · #{active.receiptNo}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Status row */}
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={active.status} />
              <div className="text-white/85 text-sm inline-flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  Updated: {active.timeline[active.timeline.length - 1]?.at}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <div className="mt-2 grid grid-cols-4 text-[11px] text-white/80">
                <span>Submitted</span>
                <span className="text-center">Review</span>
                <span className="text-center">Need info</span>
                <span className="text-right">Resolved</span>
              </div>
            </div>
          </div>

          {/* Case list (compact) */}
          <div className="mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="font-semibold">Your cases</div>
              <div className="text-xs text-gray-500">
                {filtered.length} shown
              </div>
            </div>
            <div className="p-3 space-y-2">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    setToast(`Opened ${c.id}`);
                  }}
                  className={`w-full text-left rounded-3xl border p-3 transition ${
                    c.id === active.id
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={c.proImage}
                      alt={c.proName}
                      className="w-12 h-12 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.id}</div>
                          <div className="text-sm text-gray-500 truncate">
                            #{c.receiptNo} · {c.proName}
                          </div>
                        </div>
                        <span className="text-xs font-semibold">
                          {money(c.refundAmount ?? 0)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusPillMini status={c.status} />
                        <div className="text-xs text-gray-500">
                          {c.timeline[c.timeline.length - 1]?.at}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Case summary */}
          <div className="mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-start gap-3">
              <img
                src={active.proImage}
                alt={active.proName}
                className="w-14 h-14 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-lg truncate">
                    {active.proName}
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Receipt
                  </span>
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {active.proRole} · {active.createdAt}
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100">
                    {active.category}
                  </span>
                  <span className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100">
                    Severity {active.severity}
                  </span>
                  <span className="text-xs bg-gray-50 text-gray-700 px-2.5 py-1 rounded-full border border-gray-100">
                    Contact {active.contact}
                  </span>
                </div>
              </div>
            </div>

            {/* Resolution box */}
            <div
              className={`mt-4 rounded-3xl border p-4 ${
                statusTone === "emerald"
                  ? "bg-emerald-50 border-emerald-100"
                  : statusTone === "amber"
                  ? "bg-amber-50 border-amber-100"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
                  {active.status === "Resolved" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Info className="w-5 h-5 text-blue-700" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">
                    {active.status === "Resolved" ? "Resolved" : active.status}
                  </div>
                  <div className="text-sm text-gray-700 mt-0.5">
                    {active.adjustmentNote ?? "We’re reviewing your case."}
                  </div>
                  {typeof active.refundAmount === "number" && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-500">Refund:</span>{" "}
                      <span className="font-semibold">
                        {money(active.refundAmount)}
                      </span>
                      <span className="text-gray-500"> · USD</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-600">
                    Keep this ticket for reference. Payment method details are
                    never shared.
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => openSheet("addEvidence")}
                className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Add evidence
              </button>
              <button
                onClick={() => openSheet("message")}
                className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500 inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Message support
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(active.id);
                  setToast("Copied ticket ID");
                }}
                className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" /> Copy ID
              </button>
              <button
                onClick={() => openSheet("close")}
                className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                Close case
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="font-semibold">Timeline</div>
              <div className="text-xs text-gray-500">
                {active.timeline.length} events
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {active.timeline.map((e, idx) => (
                  <TimelineRow
                    key={e.id}
                    item={e}
                    last={idx === active.timeline.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="h-6" />
        </div>

        {/* Right-side scroll indicator */}
        <div className="pointer-events-none absolute top-3 bottom-3 right-3 w-[6px] rounded-full bg-white/20">
          <div
            className="absolute left-0 right-0 rounded-full bg-blue-600"
            style={{
              height: `${thumb.size * 100}%`,
              top: `${thumb.top * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Tip protection</div>
              <div className="text-xs text-white/75">
                We keep receipts and cases auditable.
              </div>
            </div>
            <button
              onClick={() => setToast("Open FAQ (mock)")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet
          title={sheetTitle(sheet)}
          onClose={closeSheet}
          mounted={sheetMounted}
        >
          {sheet === "filters" && (
            <FiltersPanel
              status={statusFilter}
              onSetStatus={setStatusFilter}
              onClear={() => {
                setStatusFilter("All");
                setQuery("");
                setToast("Cleared");
              }}
              onApply={() => {
                setToast("Applied");
                closeSheet();
              }}
            />
          )}

          {sheet === "addEvidence" && (
            <AddEvidencePanel
              existing={active.attachments}
              pending={newAttachments}
              onAdd={addAttachment}
              onRemove={removeNewAttachment}
              onSubmit={submitEvidence}
            />
          )}

          {sheet === "message" && (
            <MessagePanel
              channel={channel}
              setChannel={setChannel}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              message={message}
              setMessage={setMessage}
              onSend={sendMessage}
            />
          )}

          {sheet === "close" && (
            <ClosePanel
              status={active.status}
              onCloseCase={closeCase}
              onKeep={closeSheet}
            />
          )}
        </Sheet>
      )}

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] transition-all duration-200 ${
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

function sheetTitle(s: "filters" | "addEvidence" | "message" | "close") {
  if (s === "filters") return "Filters";
  if (s === "addEvidence") return "Add evidence";
  if (s === "message") return "Message support";
  return "Close case";
}

function StatusBadge({ status }: { status: CaseStatus }) {
  const base =
    "text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2";
  if (status === "Resolved")
    return (
      <span
        className={`${base} bg-emerald-50 border-emerald-100 text-emerald-800`}
      >
        <CheckCircle2 className="w-4 h-4" /> Resolved
      </span>
    );
  if (status === "Need info")
    return (
      <span className={`${base} bg-amber-50 border-amber-100 text-amber-800`}>
        <Info className="w-4 h-4" /> Need info
      </span>
    );
  if (status === "Under review")
    return (
      <span className={`${base} bg-blue-50 border-blue-100 text-blue-800`}>
        <Shield className="w-4 h-4" /> Under review
      </span>
    );
  return (
    <span className={`${base} bg-gray-50 border-gray-200 text-gray-700`}>
      <Clock className="w-4 h-4" /> Submitted
    </span>
  );
}

function StatusPillMini({ status }: { status: CaseStatus }) {
  const base = "text-xs px-2.5 py-1 rounded-full border font-semibold";
  if (status === "Resolved")
    return (
      <span
        className={`${base} bg-emerald-50 border-emerald-100 text-emerald-800`}
      >
        Resolved
      </span>
    );
  if (status === "Need info")
    return (
      <span className={`${base} bg-amber-50 border-amber-100 text-amber-800`}>
        Need info
      </span>
    );
  if (status === "Under review")
    return (
      <span className={`${base} bg-blue-50 border-blue-100 text-blue-800`}>
        Review
      </span>
    );
  return (
    <span className={`${base} bg-gray-50 border-gray-200 text-gray-700`}>
      Submitted
    </span>
  );
}

function TimelineRow({ item, last }: { item: TimelineItem; last: boolean }) {
  const tone =
    item.by === "Support" ? "blue" : item.by === "You" ? "gray" : "emerald";
  const dot =
    tone === "emerald"
      ? "bg-emerald-600"
      : tone === "blue"
      ? "bg-blue-600"
      : "bg-gray-600";

  return (
    <div className="flex items-start gap-3">
      <div className="relative flex flex-col items-center">
        <div className={`w-3.5 h-3.5 rounded-full ${dot}`} />
        {!last && <div className="w-[2px] flex-1 bg-gray-200 mt-2" />}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold">{item.title}</div>
            <div className="text-sm text-gray-600 mt-0.5">{item.desc}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">{item.at}</div>
            <div className="text-xs text-gray-500">{item.by}</div>
          </div>
        </div>

        {item.statusTag && (
          <div className="mt-2">
            <StatusPillMini status={item.statusTag} />
          </div>
        )}

        {item.action === "upload" && (
          <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Support requested more evidence.</span>
          </div>
        )}

        {item.action === "reply" && (
          <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Message sent to support.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FiltersPanel({
  status,
  onSetStatus,
  onClear,
  onApply,
}: {
  status: "All" | CaseStatus;
  onSetStatus: (v: any) => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const statuses: Array<"All" | CaseStatus> = [
    "All",
    "Submitted",
    "Under review",
    "Need info",
    "Resolved",
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="font-semibold">Status</div>
        <div className="text-sm text-gray-500 mt-1">
          Filter your cases by state.
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => onSetStatus(s)}
              className={`h-12 rounded-2xl border font-semibold transition ${
                status === s
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onClear}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Clear
        </button>
        <button
          onClick={onApply}
          className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
        >
          Apply
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>Filters apply to your own cases only.</span>
      </div>
    </div>
  );
}

function AddEvidencePanel({
  existing,
  pending,
  onAdd,
  onRemove,
  onSubmit,
}: {
  existing: Attachment[];
  pending: Attachment[];
  onAdd: (t: "image" | "pdf") => void;
  onRemove: (id: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Existing evidence</div>
        <div className="text-sm text-gray-500 mt-1">
          Already attached to this case.
        </div>
        <div className="mt-3 space-y-2">
          {existing.map((a) => (
            <AttachmentRow key={a.id} a={a} readOnly />
          ))}
          {existing.length === 0 && (
            <div className="text-sm text-gray-500">None yet</div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 p-4">
        <div className="font-semibold">Add new evidence</div>
        <div className="text-sm text-gray-500 mt-1">
          Upload screenshots or statements.
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => onAdd("image")}
            className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" /> Image
          </button>
          <button
            onClick={() => onAdd("pdf")}
            className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>

        {pending.length > 0 && (
          <div className="mt-3 space-y-2">
            {pending.map((a) => (
              <AttachmentRow key={a.id} a={a} onRemove={() => onRemove(a.id)} />
            ))}
          </div>
        )}

        <button
          onClick={onSubmit}
          className="mt-3 w-full h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
        >
          Submit evidence
        </button>

        <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
          <Shield className="w-4 h-4 mt-0.5" />
          <span>
            Evidence is encrypted and used only for resolving this ticket.
          </span>
        </div>
      </div>
    </div>
  );
}

function AttachmentRow({
  a,
  readOnly,
  onRemove,
}: {
  a: Attachment;
  readOnly?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
          {a.type === "image" ? (
            <Upload className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
        </div>
        <div>
          <div className="font-semibold text-sm">{a.name}</div>
          <div className="text-xs text-gray-500">{a.sizeKb} KB</div>
        </div>
      </div>
      {!readOnly && (
        <button
          onClick={onRemove}
          className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-100"
          aria-label="Remove"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function MessagePanel({
  channel,
  setChannel,
  email,
  setEmail,
  phone,
  setPhone,
  message,
  setMessage,
  onSend,
}: {
  channel: Channel;
  setChannel: (v: Channel) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Contact method</div>
        <div className="text-sm text-gray-500 mt-1">
          Choose how support should respond.
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <ContactBtn
            active={channel === "In-app"}
            icon={<MessageSquare className="w-4 h-4" />}
            label="In-app"
            onClick={() => setChannel("In-app")}
          />
          <ContactBtn
            active={channel === "Email"}
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            onClick={() => setChannel("Email")}
          />
          <ContactBtn
            active={channel === "Phone"}
            icon={<Phone className="w-4 h-4" />}
            label="Phone"
            onClick={() => setChannel("Phone")}
          />
        </div>

        {channel === "Email" && (
          <label className="mt-3 block rounded-3xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full outline-none font-semibold"
            />
          </label>
        )}

        {channel === "Phone" && (
          <label className="mt-3 block rounded-3xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Phone</div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full outline-none font-semibold"
            />
          </label>
        )}
      </div>

      <div className="rounded-3xl border border-gray-100 p-4">
        <div className="font-semibold">Message</div>
        <div className="text-sm text-gray-500 mt-1">
          Add new information or answer support questions.
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Write a short message…"
          className="mt-2 w-full rounded-3xl border border-gray-200 bg-white p-4 outline-none focus:border-blue-300"
        />
        <button
          onClick={onSend}
          className="mt-3 w-full h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
        >
          Send
        </button>
        <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5" />
          <span>Messages are stored in your ticket timeline.</span>
        </div>
      </div>
    </div>
  );
}

function ClosePanel({
  status,
  onCloseCase,
  onKeep,
}: {
  status: CaseStatus;
  onCloseCase: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Close this case?</div>
        <div className="text-sm text-gray-500 mt-1">
          {status === "Resolved"
            ? "Closing confirms you’re satisfied with the resolution."
            : "If you close now, support may stop investigating."}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onKeep}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Keep open
        </button>
        <button
          onClick={onCloseCase}
          className="h-12 rounded-2xl text-white font-semibold bg-gray-900"
        >
          Close case
        </button>
      </div>
      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>You can reopen within 7 days (mock policy).</span>
      </div>
    </div>
  );
}

function ContactBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-2xl border font-semibold inline-flex items-center justify-center gap-2 transition ${
        active
          ? "bg-blue-600 border-blue-600 text-white"
          : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Sheet({
  title,
  mounted,
  onClose,
  children,
}: {
  title: string;
  mounted: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  function close() {
    // parent controls mounted state
    onClose();
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
          mounted ? "translate-y-0" : "translate-y-[520px]"
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
            <div className="text-sm text-gray-500 mt-0.5">X4.3 (mock)</div>
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
      /* Minimal styling: use Tailwind; scroll indicator covers visibility */
    `}</style>
  );
}
