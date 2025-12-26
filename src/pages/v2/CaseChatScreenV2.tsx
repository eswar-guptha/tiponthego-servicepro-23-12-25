import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Receipt,
  Send,
  Shield,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";

/**
 * Screen Code: X4.4
 * Screen Name: Case Chat / Support Conversation
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From X4.3 (Message support)
 * Purpose:
 *  - Threaded support chat with evidence attachments and system updates
 *  - High-trust visibility (SLA, ticket ID, escalation)
 *
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Modals/sheets use CSS transitions only
 */

type Channel = "In-app" | "Email" | "Phone";

type Attachment = {
  id: string;
  name: string;
  type: "image" | "pdf";
  sizeKb: number;
};

type MsgKind = "text" | "system" | "evidence";

type Msg = {
  id: string;
  at: string;
  by: "You" | "Support" | "System";
  kind: MsgKind;
  text?: string;
  attachments?: Attachment[];
  metaTag?: string; // e.g., "Refund initiated"
};

type CaseHeader = {
  caseId: string;
  receiptNo: string;
  proName: string;
  proRole: string;
  proImage: string;
  category: string;
  contact: Channel;
  amount: number;
  status: "Need info" | "Under review" | "Resolved";
  sla: string;
};

const HEADER: CaseHeader = {
  caseId: "CASE-10492",
  receiptNo: "RCPT-481220",
  proName: "Diego Rivera",
  proRole: "Delivery Partner",
  proImage: "https://i.pravatar.cc/240?img=54",
  category: "Payment issue",
  contact: "In-app",
  amount: 3.95,
  status: "Need info",
  sla: "Typical response: 24–48h · High severity: faster",
};

const INITIAL_ATTACHMENTS: Attachment[] = [
  { id: "a1", name: "screenshot_1.png", type: "image", sizeKb: 640 },
  { id: "a2", name: "statement_1.pdf", type: "pdf", sizeKb: 210 },
];

const INITIAL_THREAD: Msg[] = [
  {
    id: "m1",
    at: "Dec 02 · 1:25 PM",
    by: "System",
    kind: "system",
    metaTag: "Case submitted",
    text: "We received your dispute. Your ticket is now in review.",
  },
  {
    id: "m2",
    at: "Dec 02 · 2:05 PM",
    by: "Support",
    kind: "text",
    text: "Thanks — we’re checking payment processor logs. Did you see a success screen after paying?",
  },
  {
    id: "m3",
    at: "Dec 02 · 4:12 PM",
    by: "Support",
    kind: "system",
    metaTag: "Need info",
    text: "Please share any screenshots (bank app / wallet pending screen) to speed up review.",
  },
  {
    id: "m4",
    at: "Dec 03 · 10:04 AM",
    by: "You",
    kind: "text",
    text: "It stayed pending for ~10 minutes. I didn’t see a final success screen.",
  },
  {
    id: "m5",
    at: "Dec 03 · 10:08 AM",
    by: "You",
    kind: "evidence",
    text: "Attaching my screenshots.",
    attachments: INITIAL_ATTACHMENTS,
  },
  {
    id: "m6",
    at: "Dec 03 · 11:20 AM",
    by: "Support",
    kind: "system",
    metaTag: "Refund initiated",
    text: "Refund of $3.95 started. It may take 3–7 business days depending on your bank.",
  },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function uid() {
  return Math.random().toString(16).slice(2);
}

function runDevChecks() {
  try {
    console.assert(money(2) === "$2.00", "money formats");
    console.assert(uid().length > 0, "uid ok");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function CaseChatX44() {
  const [toast, setToast] = useState<string | null>(null);

  // Thread
  const [thread, setThread] = useState<Msg[]>(INITIAL_THREAD);

  // Composer
  const [draft, setDraft] = useState("");
  const [quickOpen, setQuickOpen] = useState(false);

  // Attachments staged for next message
  const [staged, setStaged] = useState<Attachment[]>([]);

  // Typing indicator mock
  const [supportTyping, setSupportTyping] = useState(false);

  // Sheets
  const [sheet, setSheet] = useState<null | "attachments" | "caseActions" | "contact">(null);
  const [sheetMounted, setSheetMounted] = useState(false);

  // Contact
  const [channel, setChannel] = useState<Channel>(HEADER.contact);
  const [email, setEmail] = useState("adusu.india@gmail.com");
  const [phone, setPhone] = useState("+1 (555) 012-9087");

  // Scroll to bottom
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [pinnedToBottom, setPinnedToBottom] = useState(true);

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

  // Keep view pinned if user is at bottom
  useEffect(() => {
    if (!pinnedToBottom) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread, pinnedToBottom]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    function onScroll() {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      setPinnedToBottom(nearBottom);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function closeSheet() {
    setSheetMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function openSheet(kind: NonNullable<typeof sheet>) {
    setSheet(kind);
  }

  function addStaged(kind: "image" | "pdf") {
    const a: Attachment = {
      id: uid(),
      name: kind === "image" ? `evidence_${staged.length + 1}.png` : `evidence_${staged.length + 1}.pdf`,
      type: kind,
      sizeKb: kind === "image" ? 580 : 240,
    };
    setStaged((prev) => [...prev, a]);
    setToast("Added attachment (mock)");
  }

  function removeStaged(id: string) {
    setStaged((prev) => prev.filter((a) => a.id !== id));
  }

  function sendUserMessage(text: string, attachments?: Attachment[]) {
    const trimmed = text.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) {
      setToast("Write a message or attach evidence");
      return;
    }

    const msg: Msg = {
      id: uid(),
      at: nowStamp(),
      by: "You",
      kind: attachments && attachments.length ? "evidence" : "text",
      text: trimmed || (attachments?.length ? "Attached evidence" : ""),
      attachments: attachments && attachments.length ? attachments : undefined,
    };

    setThread((prev) => [...prev, msg]);
    setDraft("");
    setStaged([]);

    // Mock support typing + reply
    setSupportTyping(true);
    window.setTimeout(() => {
      setSupportTyping(false);
      setThread((prev) => [
        ...prev,
        {
          id: uid(),
          at: nowStamp(),
          by: "Support",
          kind: "text",
          text: replyFor(trimmed, attachments),
        },
      ]);
    }, 900);
  }

  function onSend() {
    sendUserMessage(draft, staged);
    setQuickOpen(false);
  }

  const quickReplies = useMemo(
    () =>
      [
        "I did not see a success screen.",
        "My bank shows pending / deducted.",
        "Here are my screenshots.",
        "Please escalate to a supervisor.",
      ] as const,
    []
  );

  const headerTone = useMemo(() => {
    if (HEADER.status === "Resolved") return "emerald";
    if (HEADER.status === "Need info") return "amber";
    return "blue";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X4.3")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X4.4 · Support chat</div>
          <button
            onClick={() => setToast("Help (mock)")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28">
        {/* Case header card */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4">
          <div className="flex items-start gap-3">
            <img src={HEADER.proImage} alt={HEADER.proName} className="w-12 h-12 rounded-2xl object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-white font-semibold truncate">{HEADER.caseId}</div>
                  <div className="text-white/80 text-xs truncate">#{HEADER.receiptNo} · {HEADER.category} · USD</div>
                </div>
                <StatusChip tone={headerTone as any} label={HEADER.status} />
              </div>
              <div className="mt-2 text-white/85 text-sm truncate">{HEADER.proName} · {HEADER.proRole}</div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-white/80 text-xs inline-flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{HEADER.sla}</span>
                </div>
                <div className="text-white font-semibold">{money(HEADER.amount)}</div>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(HEADER.caseId);
                    setToast("Copied ticket ID");
                  }}
                  className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" /> Copy ID
                </button>
                <button
                  onClick={() => alert("Open receipt (mock) → X1.2")}
                  className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
                >
                  <Receipt className="w-4 h-4" /> Receipt
                </button>
                <button
                  onClick={() => openSheet("caseActions")}
                  className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
                >
                  <Shield className="w-4 h-4" /> Actions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="mt-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="font-semibold">Conversation</div>
            <button
              onClick={() => openSheet("contact")}
              className="text-xs font-semibold px-3 py-2 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100 inline-flex items-center gap-2"
            >
              <User className="w-4 h-4" /> {channel}
            </button>
          </div>

          <div ref={listRef} className="h-[52vh] overflow-y-auto p-4 bg-gradient-to-b from-white to-gray-50">
            <div className="space-y-3">
              {thread.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}

              {supportTyping && (
                <div className="flex items-end gap-2">
                  <Avatar type="support" />
                  <div className="max-w-[78%] rounded-3xl bg-white border border-gray-200 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <TypingDots />
                      <span>Support is typing…</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {!pinnedToBottom && (
            <button
              onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })}
              className="absolute left-1/2 -translate-x-1/2 -mt-12 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold shadow-lg"
            >
              Jump to latest
            </button>
          )}

          {/* Quick replies */}
          <div className="px-4 py-3 border-t border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Quick replies</div>
              <button
                onClick={() => setQuickOpen((v) => !v)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100"
              >
                {quickOpen ? "Hide" : "Show"}
              </button>
            </div>

            {quickOpen && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {quickReplies.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setDraft(q);
                      setToast("Added to composer");
                    }}
                    className="text-xs font-semibold px-3 py-2 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="px-4 pb-4 bg-white">
            {staged.length > 0 && (
              <div className="mb-3 rounded-3xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">Attachments</div>
                  <button
                    onClick={() => setStaged([])}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {staged.map((a) => (
                    <AttachmentChip key={a.id} a={a} onRemove={() => removeStaged(a.id)} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2">
              <button
                onClick={() => openSheet("attachments")}
                className="w-11 h-11 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                aria-label="Add"
              >
                <Plus className="w-4 h-4" />
              </button>

              <div className="flex-1 rounded-3xl border border-gray-200 bg-white overflow-hidden">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={1}
                  placeholder="Write a message…"
                  className="w-full resize-none outline-none p-3 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                />
              </div>

              <button
                onClick={onSend}
                className="w-11 h-11 rounded-2xl text-white bg-gradient-to-r from-blue-600 to-green-500 flex items-center justify-center"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2 text-[11px] text-gray-500 flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5" />
              <span>Never share passwords, OTPs, or card PINs. Support will not ask for them.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Need urgent help?</div>
              <div className="text-xs text-white/75">Escalate if a refund is time-sensitive.</div>
            </div>
            <button
              onClick={() => {
                setToast("Escalation requested (mock)");
                setSupportTyping(true);
                window.setTimeout(() => setSupportTyping(false), 900);
              }}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Escalate
            </button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet title={sheetTitle(sheet)} mounted={sheetMounted} onClose={closeSheet}>
          {sheet === "attachments" && (
            <AttachmentsPanel
              staged={staged}
              onAdd={addStaged}
              onRemove={removeStaged}
              onSend={() => {
                closeSheet();
                sendUserMessage(draft, staged);
              }}
            />
          )}

          {sheet === "caseActions" && (
            <CaseActionsPanel
              onMarkResolved={() => {
                setToast("Marked as resolved (mock)");
                closeSheet();
                setThread((prev) => [
                  ...prev,
                  {
                    id: uid(),
                    at: nowStamp(),
                    by: "System",
                    kind: "system",
                    metaTag: "Closed by you",
                    text: "You marked this case as resolved. You can reopen within 7 days (mock).",
                  },
                ]);
              }}
              onExport={() => setToast("Export transcript (mock)")}
              onReopen={() => {
                setToast("Reopen requested (mock)");
                closeSheet();
              }}
              onClose={closeSheet}
            />
          )}

          {sheet === "contact" && (
            <ContactPanel
              channel={channel}
              setChannel={setChannel}
              email={email}
              setEmail={setEmail}
              phone={phone}
              setPhone={setPhone}
              onSave={() => {
                setToast("Updated contact preference");
                closeSheet();
              }}
            />
          )}
        </Sheet>
      )}

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg">{toast ?? ""}</div>
      </div>
    </div>
  );
}

function sheetTitle(s: "attachments" | "caseActions" | "contact") {
  if (s === "attachments") return "Add attachments";
  if (s === "caseActions") return "Case actions";
  return "Contact preference";
}

function nowStamp() {
  // lightweight mock
  return "Today · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function replyFor(text: string, attachments?: Attachment[]) {
  const t = (text || "").toLowerCase();
  if (attachments && attachments.length) {
    return "Thanks — I can see the attachments. We’ll verify with the payment processor and update your timeline.";
  }
  if (t.includes("escalate")) {
    return "Understood. I’ve flagged this for priority review. You’ll get an update soon.";
  }
  if (t.includes("pending")) {
    return "Got it. If the bank shows pending for over 24 hours, we can confirm settlement or auto-refund.";
  }
  if (t.includes("success")) {
    return "Thanks. We’ll reconcile whether the payment was captured and ensure you’re not charged twice.";
  }
  return "Thanks — I’ve noted that. If you have screenshots, please attach them to speed things up.";
}

function StatusChip({ tone, label }: { tone: "emerald" | "amber" | "blue" | "gray"; label: string }) {
  const base = "text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2";
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
      : tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-800"
      : tone === "blue"
      ? "bg-blue-50 border-blue-100 text-blue-800"
      : "bg-gray-50 border-gray-200 text-gray-700";
  const icon =
    tone === "emerald" ? <CheckCircle2 className="w-4 h-4" /> : tone === "amber" ? <Info className="w-4 h-4" /> : <Shield className="w-4 h-4" />;

  return <span className={`${base} ${cls}`}>{icon} {label}</span>;
}

function Avatar({ type }: { type: "support" | "system" | "you" }) {
  const base = "w-9 h-9 rounded-2xl flex items-center justify-center border";
  if (type === "support") return <div className={`${base} bg-blue-50 border-blue-100 text-blue-700`}><Shield className="w-4 h-4" /></div>;
  if (type === "system") return <div className={`${base} bg-emerald-50 border-emerald-100 text-emerald-700`}><Sparkles className="w-4 h-4" /></div>;
  return <div className={`${base} bg-gray-50 border-gray-200 text-gray-700`}><User className="w-4 h-4" /></div>;
}

function MessageBubble({ m }: { m: Msg }) {
  if (m.by === "System" || m.kind === "system") {
    return (
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <Avatar type="system" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">System</div>
              <div className="text-xs text-gray-500">{m.at}</div>
            </div>
            {m.metaTag && <div className="mt-1 text-xs font-semibold inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200"><BadgeCheck className="w-4 h-4" /> {m.metaTag}</div>}
            {m.text && <div className="mt-2 text-sm text-gray-700">{m.text}</div>}
          </div>
        </div>
      </div>
    );
  }

  const isMe = m.by === "You";
  return (
    <div className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && <Avatar type="support" />}

      <div className={`max-w-[78%] rounded-3xl px-4 py-3 shadow-sm border ${isMe ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
        <div className="text-xs opacity-80 flex items-center justify-between gap-2">
          <span className="font-semibold">{isMe ? "You" : "Support"}</span>
          <span>{m.at}</span>
        </div>
        {m.text && <div className={`mt-2 text-sm ${isMe ? "text-white" : "text-gray-800"}`}>{m.text}</div>}

        {m.attachments && m.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {m.attachments.map((a) => (
              <div key={a.id} className={`rounded-2xl border px-3 py-2 flex items-center justify-between ${isMe ? "bg-white/10 border-white/20" : "bg-gray-50 border-gray-100"}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${isMe ? "bg-white/10 border-white/20" : "bg-white border-gray-200"}`}>
                    {a.type === "image" ? <ImageIcon className={`w-4 h-4 ${isMe ? "text-white" : "text-gray-700"}`} /> : <FileText className={`w-4 h-4 ${isMe ? "text-white" : "text-gray-700"}`} />}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isMe ? "text-white" : "text-gray-900"}`}>{a.name}</div>
                    <div className={`text-xs ${isMe ? "text-white/80" : "text-gray-500"}`}>{a.sizeKb} KB</div>
                  </div>
                </div>
                <button
                  onClick={() => alert("Preview attachment (mock)")}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${isMe ? "bg-white/10 border-white/20 text-white" : "bg-white border-gray-200 text-gray-800 hover:bg-gray-50"}`}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isMe && <Avatar type="you" />}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="dot" />
      <span className="dot delay1" />
      <span className="dot delay2" />
    </span>
  );
}

function AttachmentChip({ a, onRemove }: { a: Attachment; onRemove: () => void }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
          {a.type === "image" ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
        </div>
        <div>
          <div className="font-semibold text-sm">{a.name}</div>
          <div className="text-xs text-gray-500">{a.sizeKb} KB</div>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
        aria-label="Remove"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function AttachmentsPanel({
  staged,
  onAdd,
  onRemove,
  onSend,
}: {
  staged: Attachment[];
  onAdd: (t: "image" | "pdf") => void;
  onRemove: (id: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Add evidence</div>
        <div className="text-sm text-gray-500 mt-1">Attach screenshots or statements (mock).</div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => onAdd("image")}
            className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-4 h-4" /> Image
          </button>
          <button
            onClick={() => onAdd("pdf")}
            className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" /> PDF
          </button>
        </div>

        {staged.length > 0 && (
          <div className="mt-3 space-y-2">
            {staged.map((a) => (
              <div key={a.id} className="rounded-2xl border border-gray-100 bg-white p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {a.type === "image" ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.sizeKb} KB</div>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(a.id)}
                  className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onSend}
        className="w-full h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
      >
        Send with attachments
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>Real product should remove metadata and scan uploads.</span>
      </div>
    </div>
  );
}

function CaseActionsPanel({
  onMarkResolved,
  onExport,
  onReopen,
  onClose,
}: {
  onMarkResolved: () => void;
  onExport: () => void;
  onReopen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Actions</div>
        <div className="text-sm text-gray-500 mt-1">Manage this case and transcript.</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onExport}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
        >
          <FileText className="w-4 h-4" /> Export
        </button>
        <button
          onClick={onReopen}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" /> Reopen
        </button>
      </div>

      <button
        onClick={onMarkResolved}
        className="w-full h-12 rounded-2xl text-white font-semibold bg-gray-900 inline-flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-4 h-4" /> Mark as resolved
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>Marking resolved is reversible for 7 days (mock policy).</span>
      </div>

      <button onClick={onClose} className="w-full h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Close
      </button>
    </div>
  );
}

function ContactPanel({
  channel,
  setChannel,
  email,
  setEmail,
  phone,
  setPhone,
  onSave,
}: {
  channel: Channel;
  setChannel: (v: Channel) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Contact preference</div>
        <div className="text-sm text-gray-500 mt-1">How should support respond?</div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <ContactBtn active={channel === "In-app"} icon={<MessageSquare className="w-4 h-4" />} label="In-app" onClick={() => setChannel("In-app")} />
          <ContactBtn active={channel === "Email"} icon={<Mail className="w-4 h-4" />} label="Email" onClick={() => setChannel("Email")} />
          <ContactBtn active={channel === "Phone"} icon={<Phone className="w-4 h-4" />} label="Phone" onClick={() => setChannel("Phone")} />
        </div>

        {channel === "Email" && (
          <label className="mt-3 block rounded-3xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full outline-none font-semibold" />
          </label>
        )}

        {channel === "Phone" && (
          <label className="mt-3 block rounded-3xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Phone</div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full outline-none font-semibold" />
          </label>
        )}

        <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
          <Shield className="w-4 h-4 mt-0.5" />
          <span>We never ask for OTP/PIN. Keep private info safe.</span>
        </div>
      </div>

      <button onClick={onSave} className="w-full h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500">
        Save
      </button>
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
        active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 hover:bg-gray-50"
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
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button className="absolute inset-0 bg-black/40" onClick={close} aria-label="Close overlay" />
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
            <div className="text-sm text-gray-500 mt-0.5">X4.4 (mock)</div>
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
      .dot{width:6px;height:6px;border-radius:999px;background:#6b7280;display:inline-block;animation:blink 1s infinite;}
      .dot.delay1{animation-delay:.15s}
      .dot.delay2{animation-delay:.3s}
      @keyframes blink{0%,100%{opacity:.25}50%{opacity:1}}
    `}</style>
  );
}
