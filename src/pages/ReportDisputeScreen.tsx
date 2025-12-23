import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileText,
  HelpCircle,
  Image as ImageIcon,
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
 * Screen Code: X4.2
 * Screen Name: Report / Dispute Flow
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From X3.1 Wallet -> Receipt sheet -> Report
 *  - From X1.2 Tip Receipt -> Report issue
 * Purpose:
 *  - Safety & Trust: let users report payment issues / fraud / wrong pro / abusive content
 *  - Compliance: capture evidence + contact preference + timeline
 *
 * UX Notes:
 *  - 3-step wizard on a single screen (no routing)
 *  - Smart presets: auto-fill with selected transaction
 *  - High clarity on what happens next + SLA
 *
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Sheets/modals use CSS transitions
 */

type TxStatus = "Success" | "Pending" | "Failed";

type Tx = {
  id: string;
  receiptNo: string;
  proName: string;
  proRole: string;
  proImage: string;
  createdAt: string;
  amount: number;
  tip: number;
  fees: number;
  status: TxStatus;
  channel: "Nearby" | "QR" | "Favorite" | "Search";
  location: string;
};

const DEMO_TX: Tx[] = [
  {
    id: "t1",
    receiptNo: "RCPT-482193",
    proName: "Alex Johnson",
    proRole: "Street Performer",
    proImage: "https://i.pravatar.cc/240?img=12",
    createdAt: "Today · 7:42 PM",
    amount: 11.3,
    tip: 10,
    fees: 1.3,
    status: "Success",
    channel: "Nearby",
    location: "Downtown Plaza · Fountain",
  },
  {
    id: "t4",
    receiptNo: "RCPT-481220",
    proName: "Diego Rivera",
    proRole: "Delivery Partner",
    proImage: "https://i.pravatar.cc/240?img=54",
    createdAt: "Dec 02 · 1:22 PM",
    amount: 3.95,
    tip: 3.5,
    fees: 0.45,
    status: "Pending",
    channel: "QR",
    location: "Market Street · Zone 4",
  },
  {
    id: "t5",
    receiptNo: "RCPT-480980",
    proName: "Alex Johnson",
    proRole: "Street Performer",
    proImage: "https://i.pravatar.cc/240?img=12",
    createdAt: "Nov 26 · 8:12 PM",
    amount: 7.1,
    tip: 6.5,
    fees: 0.6,
    status: "Failed",
    channel: "Search",
    location: "Downtown Plaza",
  },
];

type Category =
  | "Payment issue"
  | "Wrong pro / wrong place"
  | "Fraud / scam"
  | "Abusive content"
  | "Duplicate charge"
  | "Other";

type Contact = "In-app" | "Email" | "Phone";

type Severity = "Low" | "Medium" | "High";

type Attachment = {
  id: string;
  name: string;
  type: "image" | "pdf";
  sizeKb: number;
};

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
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function ReportDisputeScreen() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Transaction selector
  const [query, setQuery] = useState("");
  const [txId, setTxId] = useState<string>(DEMO_TX[1].id);

  const tx = useMemo(
    () => DEMO_TX.find((t) => t.id === txId) ?? DEMO_TX[0],
    [txId]
  );

  // Step 2: details
  const [category, setCategory] = useState<Category>("Payment issue");
  const [severity, setSeverity] = useState<Severity>("Medium");
  const [amountWrong, setAmountWrong] = useState(false);
  const [expectedAmount, setExpectedAmount] = useState<number>(tx.amount);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Step 3: contact
  const [contact, setContact] = useState<Contact>("In-app");
  const [email, setEmail] = useState("adusu.india@gmail.com");
  const [phone, setPhone] = useState("+1 (555) 012-9087");
  const [consent, setConsent] = useState(true);

  // UI
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMounted, setConfirmMounted] = useState(false);

  // Scroll indicator
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState(() => ({ size: 0.32, top: 0 }));

  // Reset expected amount when changing tx
  useEffect(() => {
    setExpectedAmount(tx.amount);
    setAmountWrong(false);
  }, [tx.id]);

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

  function next() {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      // minimal validation
      if (!message.trim()) {
        setToast("Please add a short description");
        return;
      }
      if (amountWrong && (expectedAmount < 0.5 || expectedAmount > 5000)) {
        setToast("Expected amount looks invalid");
        return;
      }
      setStep(3);
      return;
    }
  }

  function back() {
    if (step === 1) {
      alert("Back (mock) → X3.1");
      return;
    }
    setStep((s) => (s === 3 ? 2 : 1));
  }

  function addAttachment(kind: "image" | "pdf") {
    const a: Attachment = {
      id: uid(),
      name:
        kind === "image"
          ? `screenshot_${attachments.length + 1}.png`
          : `statement_${attachments.length + 1}.pdf`,
      type: kind,
      sizeKb: kind === "image" ? 640 : 210,
    };
    setAttachments((prev) => [...prev, a]);
    setToast("Attached (mock)");
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function openConfirm() {
    if (!consent) {
      setToast("Please accept consent to submit");
      return;
    }
    if (contact === "Email" && !email.includes("@")) {
      setToast("Enter a valid email");
      return;
    }
    if (contact === "Phone" && phone.trim().length < 6) {
      setToast("Enter a valid phone");
      return;
    }
    setConfirmOpen(true);
  }

  useEffect(() => {
    if (!confirmOpen) return;
    setConfirmMounted(false);
    const t = setTimeout(() => setConfirmMounted(true), 10);
    return () => clearTimeout(t);
  }, [confirmOpen]);

  function closeConfirm() {
    setConfirmMounted(false);
    setTimeout(() => setConfirmOpen(false), 180);
  }

  function submit() {
    closeConfirm();
    setToast("Report submitted (mock)");
    // Simulate post-submit outcome
    setTimeout(() => {
      alert(
        "Submitted ✅\n\nNext: X4.3 – Case Status / Ticket Timeline (recommended)"
      );
    }, 350);
  }

  const txMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = DEMO_TX.filter((t) =>
      !q
        ? true
        : t.proName.toLowerCase().includes(q) ||
          t.receiptNo.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q)
    );
    return list;
  }, [query]);

  const riskBanner = useMemo(() => {
    if (category === "Fraud / scam")
      return {
        tone: "rose",
        title: "Fraud alert",
        msg: "We may temporarily lock related tips while we investigate.",
      };
    if (category === "Abusive content")
      return {
        tone: "amber",
        title: "Safety review",
        msg: "Reports are reviewed by safety team. Evidence helps speed this up.",
      };
    if (tx.status === "Pending")
      return {
        tone: "amber",
        title: "Pending payment",
        msg: "Processing can take a few minutes. Submit if it’s stuck.",
      };
    if (tx.status === "Failed")
      return {
        tone: "rose",
        title: "Failed payment",
        msg: "No money captured (in most cases). We’ll confirm and update you.",
      };
    return {
      tone: "blue",
      title: "Support case",
      msg: "We’ll respond within 24–48 hours. High severity may be faster.",
    };
  }, [category, tx.status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={back}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">
            X4.2 · Report / Dispute
          </div>
          <button
            onClick={() => setToast("Help (mock)")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        <div
          ref={pageRef}
          className="max-w-md mx-auto px-4 pb-28 pt-4 h-[calc(100vh-64px)] overflow-y-auto pr-5"
        >
          {/* Stepper */}
          <div className="bg-white/15 border border-white/20 rounded-3xl p-4">
            <div className="text-white">
              <div className="text-xs text-white/80">Step {step} of 3</div>
              <div className="text-2xl font-semibold mt-1">
                {step === 1
                  ? "Select receipt"
                  : step === 2
                  ? "Describe issue"
                  : "Contact & submit"}
              </div>
              <div className="text-xs text-white/80 mt-1">
                USD · Reports are encrypted and reviewed by support.
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <StepperPill
                active={step === 1}
                done={step > 1}
                label="Receipt"
              />
              <StepperPill
                active={step === 2}
                done={step > 2}
                label="Details"
              />
              <StepperPill active={step === 3} done={false} label="Submit" />
            </div>
          </div>

          {/* Risk banner */}
          <Banner
            tone={riskBanner.tone as any}
            title={riskBanner.title}
            message={riskBanner.msg}
          />

          {/* Step bodies */}
          {step === 1 && (
            <div className="mt-4 space-y-3">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
                <div className="font-semibold">Find your receipt</div>
                <div className="text-sm text-gray-500 mt-1">
                  Search by pro name, receipt number, or place.
                </div>

                <div className="mt-3 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search receipts…"
                    className="w-full pl-9 pr-3 py-3 rounded-2xl bg-white border border-gray-200 outline-none focus:border-blue-300"
                  />
                </div>

                <div className="mt-3 space-y-2">
                  {txMatches.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTxId(t.id);
                        setToast(`Selected ${t.receiptNo}`);
                      }}
                      className={`w-full text-left rounded-3xl border p-3 transition ${
                        txId === t.id
                          ? "bg-blue-50 border-blue-200"
                          : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={t.proImage}
                          alt={t.proName}
                          className="w-12 h-12 rounded-2xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold truncate">
                                {t.proName}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {t.createdAt} · {t.location}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-gray-500">Total</div>
                              <div className="font-semibold">
                                {money(t.amount)}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              #{t.receiptNo}
                            </div>
                            <span
                              className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${statusPill(
                                t.status
                              )}`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5" />
                  <span>
                    If you can’t find it, submit without a receipt (next:
                    X4.2b). For now select one.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => alert("Open receipt (mock) → X1.2")}
                  className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" /> View receipt
                </button>
                <button
                  onClick={next}
                  className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-4 space-y-3">
              <SelectedTxCard tx={tx} />

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
                <div className="font-semibold">Issue category</div>
                <div className="text-sm text-gray-500 mt-1">
                  Choose the best match so we route correctly.
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      "Payment issue",
                      "Duplicate charge",
                      "Wrong pro / wrong place",
                      "Fraud / scam",
                      "Abusive content",
                      "Other",
                    ] as Category[]
                  ).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCategory(c);
                        setToast(`Category: ${c}`);
                      }}
                      className={`h-12 rounded-2xl border font-semibold transition ${
                        category === c
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="font-semibold">Severity</div>
                  <div className="text-sm text-gray-500 mt-1">
                    High severity may trigger faster review.
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["Low", "Medium", "High"] as Severity[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSeverity(s)}
                        className={`h-11 rounded-2xl border font-semibold transition ${
                          severity === s
                            ? "bg-gray-900 border-gray-900 text-white"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">Amount mismatch</div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        If you expected a different total, enter it.
                      </div>
                    </div>
                    <Toggle
                      checked={amountWrong}
                      onChange={() => setAmountWrong((v) => !v)}
                    />
                  </div>

                  {amountWrong && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-white border border-gray-200 p-3">
                        <div className="text-xs text-gray-500">Charged</div>
                        <div className="font-semibold">{money(tx.amount)}</div>
                      </div>
                      <label className="rounded-2xl bg-white border border-gray-200 p-3">
                        <div className="text-xs text-gray-500">Expected</div>
                        <input
                          type="number"
                          value={expectedAmount}
                          onChange={(e) =>
                            setExpectedAmount(Number(e.target.value))
                          }
                          className="mt-1 w-full outline-none font-semibold"
                          min={0}
                          step={0.01}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="font-semibold">Describe what happened</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Include any details that help us verify quickly.
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Example: Tip shows as failed but money deducted. Or: I tipped the wrong person near the plaza…"
                    className="mt-2 w-full rounded-3xl border border-gray-200 bg-white p-4 outline-none focus:border-blue-300"
                  />
                </div>

                <div className="mt-4">
                  <div className="font-semibold">Attachments (optional)</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Upload screenshots or statements to speed up review.
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => addAttachment("image")}
                      className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" /> Add image
                    </button>
                    <button
                      onClick={() => addAttachment("pdf")}
                      className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Add PDF
                    </button>
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {attachments.map((a) => (
                        <div
                          key={a.id}
                          className="rounded-2xl border border-gray-100 bg-gray-50 p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
                              {a.type === "image" ? (
                                <ImageIcon className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                {a.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {a.sizeKb} KB
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAttachment(a.id)}
                            className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                            aria-label="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                    <Upload className="w-4 h-4 mt-0.5" />
                    <span>
                      Mock attachments only. Real product should scan for
                      malware and strip metadata.
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={back}
                  className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={next}
                  className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-4 space-y-3">
              <SelectedTxCard tx={tx} compact />

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
                <div className="font-semibold">Contact preference</div>
                <div className="text-sm text-gray-500 mt-1">
                  How should we update you about this case?
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <ContactBtn
                    active={contact === "In-app"}
                    icon={<MessageSquare className="w-4 h-4" />}
                    label="In-app"
                    onClick={() => setContact("In-app")}
                  />
                  <ContactBtn
                    active={contact === "Email"}
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    onClick={() => setContact("Email")}
                  />
                  <ContactBtn
                    active={contact === "Phone"}
                    icon={<Phone className="w-4 h-4" />}
                    label="Phone"
                    onClick={() => setContact("Phone")}
                  />
                </div>

                {contact === "Email" && (
                  <label className="mt-3 block rounded-3xl border border-gray-200 bg-white p-4">
                    <div className="text-xs text-gray-500">Email</div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full outline-none font-semibold"
                      placeholder="name@email.com"
                    />
                  </label>
                )}

                {contact === "Phone" && (
                  <label className="mt-3 block rounded-3xl border border-gray-200 bg-white p-4">
                    <div className="text-xs text-gray-500">Phone</div>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full outline-none font-semibold"
                      placeholder="+1 555 000 0000"
                    />
                  </label>
                )}

                <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="font-semibold">What happens next</div>
                      <div className="text-sm text-gray-600 mt-0.5">
                        We’ll confirm details, contact the pro if required, and
                        update you.
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Typical response: 24–48h · High severity: faster
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setConsent((v) => !v)}
                  className={`mt-4 w-full text-left rounded-3xl border p-4 transition ${
                    consent
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">Consent</div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        I confirm the information provided is accurate to the
                        best of my knowledge.
                      </div>
                    </div>
                    <div
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center ${
                        consent
                          ? "bg-emerald-600 border-emerald-600"
                          : "bg-white border-gray-300"
                      }`}
                    >
                      {consent && (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </button>

                <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <span>
                    False reports may result in account restrictions. Please
                    report responsibly.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={back}
                  className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={openConfirm}
                  className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
                >
                  Submit
                </button>
              </div>

              <div className="h-3" />
            </div>
          )}
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

      {/* Footer actions (sticky) */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Need help?</div>
              <div className="text-xs text-white/75">
                Support keeps your tips protected.
              </div>
            </div>
            <button
              onClick={() => setToast("Contact support (mock)")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Contact
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button
            className="absolute inset-0 bg-black/45"
            onClick={closeConfirm}
            aria-label="Close overlay"
          />
          <div
            className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
              confirmMounted ? "translate-y-0" : "translate-y-[520px]"
            }`}
            role="dialog"
            aria-label="Confirm submit"
          >
            <div className="pt-3 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-gray-200" />
            </div>
            <div className="px-4 pt-3 pb-4 border-b flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-lg">Confirm submission</div>
                <div className="text-sm text-gray-500 mt-0.5">X4.2 (mock)</div>
              </div>
              <button
                onClick={closeConfirm}
                className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <div className="font-semibold">Case summary</div>
                <div className="mt-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Receipt</span>
                    <span className="font-semibold">#{tx.receiptNo}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-500">Category</span>
                    <span className="font-semibold">{category}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-500">Severity</span>
                    <span className="font-semibold">{severity}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-500">Contact</span>
                    <span className="font-semibold">{contact}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={closeConfirm}
                  className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={submit}
                  className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
                >
                  Submit
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5" />
                <span>
                  You’ll receive a ticket ID and status updates after
                  submission.
                </span>
              </div>
            </div>
          </div>
        </div>
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

function statusPill(status: TxStatus) {
  const base = "text-xs px-3 py-1.5 rounded-full border font-semibold";
  if (status === "Success")
    return `${base} bg-emerald-50 border-emerald-100 text-emerald-800`;
  if (status === "Pending")
    return `${base} bg-amber-50 border-amber-100 text-amber-800`;
  return `${base} bg-rose-50 border-rose-100 text-rose-800`;
}

function StepperPill({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div
      className={`h-10 rounded-2xl border flex items-center justify-center font-semibold text-sm transition ${
        done
          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
          : active
          ? "bg-white border-white text-blue-700"
          : "bg-white/10 border-white/15 text-white"
      }`}
    >
      {done ? (
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {label}
        </span>
      ) : (
        label
      )}
    </div>
  );
}

function Banner({
  tone,
  title,
  message,
}: {
  tone: "blue" | "amber" | "rose";
  title: string;
  message: string;
}) {
  const styles =
    tone === "rose"
      ? "bg-rose-50 border-rose-100 text-rose-900"
      : tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-900"
      : "bg-blue-50 border-blue-100 text-blue-900";

  const icon =
    tone === "rose" ? (
      <AlertTriangle className="w-5 h-5" />
    ) : tone === "amber" ? (
      <Info className="w-5 h-5" />
    ) : (
      <Shield className="w-5 h-5" />
    );

  return (
    <div
      className={`mt-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden`}
    >
      <div className={`p-4 border-b border-gray-100 ${styles}`}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm opacity-90 mt-0.5">{message}</div>
          </div>
        </div>
      </div>
      <div className="p-4 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>Ticket ID (generated after submit)</span>
          <span className="font-semibold">CASE-•••••</span>
        </div>
      </div>
    </div>
  );
}

function SelectedTxCard({ tx, compact }: { tx: Tx; compact?: boolean }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <img
          src={tx.proImage}
          alt={tx.proName}
          className={`rounded-2xl object-cover ${
            compact ? "w-12 h-12" : "w-14 h-14"
          }`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold text-lg truncate">{tx.proName}</div>
              <div className="text-sm text-gray-500 truncate">
                {tx.proRole} · {tx.createdAt}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-xl font-semibold">{money(tx.amount)}</div>
              <div className="text-xs text-gray-500">USD</div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-gray-500">Receipt #{tx.receiptNo}</div>
            <span className={statusPill(tx.status)}>{tx.status}</span>
          </div>

          {!compact && (
            <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tip</span>
                <span className="font-semibold">{money(tx.tip)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-500">Fees</span>
                <span className="font-semibold">{money(tx.fees)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-500">Channel</span>
                <span className="font-semibold">{tx.channel}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-500">Location</span>
                <span className="font-semibold truncate ml-3">
                  {tx.location}
                </span>
              </div>
            </div>
          )}

          <div className="mt-3 flex gap-2 flex-wrap">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(tx.receiptNo);
                // best-effort
              }}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
            >
              <Copy className="w-4 h-4" /> Copy #
            </button>
            <button
              onClick={() => alert("Open receipt (mock) → X1.2")}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
            >
              <Receipt className="w-4 h-4" /> Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${
        checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
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

function StyleBlock() {
  return (
    <style>{`
      /* Minimal: rely on Tailwind. */
    `}</style>
  );
}
