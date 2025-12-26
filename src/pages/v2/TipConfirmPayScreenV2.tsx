import React, { useEffect, useMemo, useState } from "react";

/**
 * Screen Code: X1.5
 * Screen Name: Confirm Tip / Payment Review / Submit
 * Currency: USD
 * Roles: Customer / Guest
 * Flow: X1.3 → X1.4 → X1.5 → X2.6
 *
 * Goals:
 *  - Clear review summary (amount, fee, total, recipient, receipt ref)
 *  - Allow quick edits (back to Amount / Message)
 *  - Show trust + policy (refund/dispute availability)
 *  - Provide realistic submit interaction (processing → success / failure)
 *
 * Canvas-safe:
 *  - No framer-motion
 *  - No external icon libs (inline SVG)
 */

type Privacy = "Private" | "ProOnly" | "Receipt";

type PaymentMethod = {
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  exp: string;
  token: string;
};

type State = {
  tipAmount: number;
  proName: string;
  proRole: string;
  venue: string;
  receiptNo: string;
  emoji: string | null;
  message: string;
  privacy: Privacy;
  showOnShareableReceipt: boolean;
  allowProReply: boolean;
  method: PaymentMethod;
  saveAsTemplate: boolean;
  addToFavorites: boolean;
  sendReceiptEmail: boolean;
};

type SubmitState = "idle" | "processing" | "success" | "failed";

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function calcFee(tip: number) {
  // must match X1.3 mock fee model
  const feeRaw = tip * 0.025 + 0.1;
  const fee = Math.max(0.1, Math.round(feeRaw * 100) / 100);
  const total = Math.round((tip + fee) * 100) / 100;
  return { fee, total };
}

function privacyLabel(p: Privacy) {
  if (p === "Private") return "Only you";
  if (p === "ProOnly") return "Pro only";
  return "On receipt";
}

function runDevChecks() {
  try {
    const f = calcFee(5);
    console.assert(f.total > 5, "fee added");
    console.assert(privacyLabel("Receipt") === "On receipt", "privacy label");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function TipConfirmPayX15() {
  // Mock payload from X1.3 + X1.4
  const ctx = useMemo(
    () => ({
      tipAmount: 3.0,
      proName: "Alex",
      proRole: "Barista",
      venue: "Cafe Aura",
      receiptNo: "RCPT-481220",
      emoji: "😊" as string | null,
      message: "Thanks for the great service!",
      privacy: "ProOnly" as Privacy,
      showOnShareableReceipt: true,
      allowProReply: false,
      saveAsTemplate: false,
      method: { brand: "Visa" as const, last4: "2140", exp: "08/28", token: "pm_mock_2140" },
    }),
    []
  );

  const [s, setS] = useState<State>(() => ({
    tipAmount: ctx.tipAmount,
    proName: ctx.proName,
    proRole: ctx.proRole,
    venue: ctx.venue,
    receiptNo: ctx.receiptNo,
    emoji: ctx.emoji,
    message: ctx.message,
    privacy: ctx.privacy,
    showOnShareableReceipt: ctx.showOnShareableReceipt,
    allowProReply: ctx.allowProReply,
    method: ctx.method,
    saveAsTemplate: ctx.saveAsTemplate,
    addToFavorites: true,
    sendReceiptEmail: true,
  }));

  const [toast, setToast] = useState<string | null>(null);
  const [submit, setSubmit] = useState<SubmitState>("idle");
  const [sheet, setSheet] = useState<null | "policy" | "payment" | "whyFailed">(null);
  const [mounted, setMounted] = useState(false);

  const { fee, total } = useMemo(() => calcFee(s.tipAmount), [s.tipAmount]);
  const privacySummary = useMemo(() => privacyLabel(s.privacy), [s.privacy]);

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

  function back() {
    alert("Back (mock) → X1.4");
  }

  function openSheet(k: NonNullable<typeof sheet>) {
    setSheet(k);
  }

  function closeSheet() {
    setMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function editAmount() {
    setToast("Edit amount (mock) → X1.3");
  }

  function editMessage() {
    setToast("Edit message (mock) → X1.4");
  }

  function mockSubmit() {
    if (submit === "processing") return;

    // Guardrails
    if (s.tipAmount < 1) {
      setToast("Minimum tip is $1.00");
      return;
    }

    setSubmit("processing");
    setToast("Processing…");

    // Deterministic-ish mock: fail if amount ends with .13 or if message contains 'fail'
    const shouldFail =
      Math.round(s.tipAmount * 100) % 100 === 13 ||
      s.message.toLowerCase().includes(" fail") ||
      s.message.toLowerCase().startsWith("fail");

    setTimeout(() => {
      if (shouldFail) {
        setSubmit("failed");
        setToast("Tip failed");
        openSheet("whyFailed");
        return;
      }
      setSubmit("success");
      setToast("Tip sent ✓");
      // In the real app: navigate to X2.6
      setTimeout(() => {
        alert("Navigate (mock) → X2.6 Tip Success");
      }, 650);
    }, 1200);
  }

  const primaryLabel = submit === "processing" ? "Processing…" : submit === "success" ? "Sent" : "Send tip";

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
            <IconBack />
          </button>
          <div className="text-white font-semibold">X1.5 · Confirm</div>
          <button
            onClick={() => openSheet("policy")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Policy"
          >
            <IconInfo />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3">
        {/* Stepper */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
          <div className="flex items-center justify-between">
            <div className="text-white text-sm font-semibold">Complete tip</div>
            <div className="text-white/80 text-xs">Step 3 of 3</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StepChip active label="Amount" />
            <StepChip active label="Message" />
            <StepChip active label="Confirm" />
          </div>
          <div className="mt-2 text-white/80 text-xs">Review details and send your tip securely.</div>
        </div>

        {/* Recipient + summary */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-gray-100 flex items-center justify-center">
                <IconUser />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{s.proName}</div>
                <div className="text-sm text-gray-500 mt-0.5 truncate">{s.proRole} · {s.venue}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill label={`Receipt ${s.receiptNo}`} />
                  <Pill label={`${s.method.brand} •••• ${s.method.last4} · Exp ${s.method.exp}`} />
                </div>
              </div>
            </div>
            <button
              onClick={() => setToast("Open pro profile (mock)")}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              View
            </button>
          </div>
        </div>

        {/* Amount breakdown */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Payment</div>
              <div className="text-sm text-gray-500 mt-0.5">Total charged today.</div>
            </div>
            <button
              onClick={editAmount}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Edit
            </button>
          </div>

          <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
            <Row label="Tip amount" value={money(s.tipAmount)} />
            <Row label="Platform fee" value={money(fee)} hint="Secure processing" />
            <div className="my-3 h-px bg-gray-200" />
            <Row label="You pay" value={money(total)} strong />
            <div className="mt-2 text-xs text-gray-500">Production: show tax/VAT if applicable.</div>
          </div>

          <button
            onClick={() => openSheet("payment")}
            className="mt-3 w-full rounded-3xl border border-gray-200 bg-white px-4 py-4 text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <IconCard />
                </div>
                <div>
                  <div className="font-semibold">Payment method</div>
                  <div className="text-sm text-gray-600 mt-0.5">{s.method.brand} •••• {s.method.last4}</div>
                </div>
              </div>
              <IconChevron />
            </div>
          </button>
        </div>

        {/* Message review */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Message</div>
              <div className="text-sm text-gray-500 mt-0.5">Visibility: {privacySummary}</div>
            </div>
            <button
              onClick={editMessage}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Edit
            </button>
          </div>

          <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">To {s.proName}</div>
                <div className="text-xs text-gray-500 mt-0.5">Receipt {s.receiptNo} · {privacySummary}</div>
              </div>
              <div className="text-2xl">{s.emoji ?? ""}</div>
            </div>
            <div className="mt-3 text-sm text-gray-800">
              {s.message ? `“${s.message.trim()}”` : <span className="text-gray-400">No message</span>}
            </div>
          </div>
        </div>

        {/* Optional toggles */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="font-semibold">Options</div>
          <div className="text-sm text-gray-500 mt-0.5">Improve your experience.</div>

          <div className="mt-4 space-y-2">
            <ToggleRow
              title="Add to favorites"
              subtitle="Follow this pro for quick tipping"
              checked={s.addToFavorites}
              onChange={() => {
                setS((p) => ({ ...p, addToFavorites: !p.addToFavorites }));
                setToast("Updated");
              }}
            />
            <ToggleRow
              title="Email me the receipt"
              subtitle="Send a copy to your inbox"
              checked={s.sendReceiptEmail}
              onChange={() => {
                setS((p) => ({ ...p, sendReceiptEmail: !p.sendReceiptEmail }));
                setToast("Updated");
              }}
            />
            <ToggleRow
              title="Save message as template"
              subtitle="Reuse this note later"
              checked={s.saveAsTemplate}
              onChange={() => {
                setS((p) => ({ ...p, saveAsTemplate: !p.saveAsTemplate }));
                setToast("Updated");
              }}
            />
            <ToggleRow
              title="Allow pro reply"
              subtitle="Let the pro send a thank-you"
              checked={s.allowProReply}
              onChange={() => {
                setS((p) => ({ ...p, allowProReply: !p.allowProReply }));
                setToast("Updated");
              }}
            />
          </div>

          <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
            <span className="mt-0.5"><IconShield /></span>
            <span>Refunds/disputes are available from X4.2 if something goes wrong.</span>
          </div>
        </div>

        {/* Trust & policy */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center">
              <IconShield />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold">Secure checkout</div>
              <div className="text-sm text-gray-600 mt-1">Your payment is processed securely. You’ll get an instant receipt.</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill label="Instant receipt" />
                <Pill label="Support chat" />
                <Pill label="Refund tracking" />
              </div>
              <button
                onClick={() => openSheet("policy")}
                className="mt-3 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                View policies
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X1.5</div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white">
                <div className="text-xs text-white/75">Total</div>
                <div className="text-sm font-semibold">{money(total)}</div>
              </div>
              <button
                onClick={mockSubmit}
                disabled={submit === "processing" || submit === "success"}
                className={`h-11 px-4 rounded-2xl font-semibold ${
                  submit === "processing" || submit === "success" ? "bg-white/40 text-white" : "bg-white text-blue-700"
                }`}
                aria-label="Send tip"
              >
                {primaryLabel}
              </button>
            </div>
            {submit === "failed" ? (
              <div className="mt-2 text-xs text-white/85">Tip failed. Review reason and try again.</div>
            ) : submit === "processing" ? (
              <div className="mt-2 text-xs text-white/85">Do not close the app while processing.</div>
            ) : null}
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
          <span className={toast ? "okTick" : ""}>
            <IconCheck />
          </span>
          {toast ?? ""}
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet
          title={sheet === "policy" ? "Policies" : sheet === "payment" ? "Payment method" : "Why it failed"}
          subtitle={sheet === "policy" ? "Refunds, disputes, and receipts" : sheet === "payment" ? "Choose or manage" : "Fix and retry"}
          mounted={mounted}
          onClose={closeSheet}
        >
          {sheet === "policy" ? (
            <PolicySheet onClose={closeSheet} />
          ) : sheet === "payment" ? (
            <PaymentSheet
              selected={s.method.token}
              onSelect={(pm) => {
                setS((p) => ({ ...p, method: pm }));
                setToast("Payment method updated");
                closeSheet();
              }}
            />
          ) : (
            <WhyFailedSheet
              onRetry={() => {
                setToast("Try again");
                closeSheet();
                setSubmit("idle");
              }}
              onGoToDispute={() => {
                setToast("Open X4.2 (mock) · Report/Dispute");
                closeSheet();
              }}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}

function StepChip({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`h-10 rounded-2xl border flex items-center justify-center text-sm font-semibold ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white/10 text-white border-white/20"
      }`}
    >
      {label}
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">{label}</span>;
}

function Row({
  label,
  value,
  hint,
  strong,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className={`text-sm ${strong ? "font-semibold" : "text-gray-700"}`}>{label}</div>
        {hint ? <div className="text-xs text-gray-500 mt-0.5">{hint}</div> : null}
      </div>
      <div className={`text-sm ${strong ? "font-semibold" : "font-semibold text-gray-800"}`}>{value}</div>
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
    <button onClick={onChange} className="w-full rounded-3xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-600 mt-0.5">{subtitle}</div>
        </div>
        <div className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </div>
    </button>
  );
}

function PolicySheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Refunds & disputes</div>
        <div className="text-sm text-gray-600 mt-1">If the tip doesn’t reach the pro, you can report it.</div>
      </div>

      <InfoCard icon={<IconReceipt />} title="Instant receipt" body="A receipt is generated immediately after successful payment." />
      <InfoCard icon={<IconShield />} title="Support" body="Chat with support and attach evidence from the case flow." />
      <InfoCard icon={<IconInfo />} title="Refund tracking" body="If approved, refunds can be tracked via X4.5." />

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Close
      </button>

      <div className="text-xs text-gray-500">Production: show localized policy, timelines, and fee refunds.</div>
    </div>
  );
}

function PaymentSheet({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (pm: PaymentMethod) => void;
}) {
  const methods: PaymentMethod[] = [
    { brand: "Visa", last4: "2140", exp: "08/28", token: "pm_mock_2140" },
    { brand: "Mastercard", last4: "1109", exp: "01/29", token: "pm_mock_1109" },
    { brand: "Amex", last4: "0005", exp: "12/27", token: "pm_mock_0005" },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Choose a card</div>
        <div className="text-sm text-gray-600 mt-1">Mock selection only.</div>
      </div>

      <div className="space-y-2">
        {methods.map((m) => {
          const on = m.token === selected;
          return (
            <button
              key={m.token}
              onClick={() => onSelect(m)}
              className={`w-full rounded-3xl border p-4 text-left transition ${on ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${on ? "border-white/20 bg-white/10" : "border-gray-200 bg-gray-50"}`}>
                    <IconCard />
                  </div>
                  <div>
                    <div className="font-semibold">{m.brand}</div>
                    <div className={`text-sm mt-0.5 ${on ? "text-white/80" : "text-gray-600"}`}>•••• {m.last4} · Exp {m.exp}</div>
                  </div>
                </div>
                <div className={`mt-2 w-6 h-6 rounded-full border flex items-center justify-center ${on ? "border-white/30" : "border-gray-300"}`}>
                  {on ? <div className="w-3 h-3 rounded-full bg-white" /> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => alert("Add new card (mock)")}
        className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
      >
        + Add new card
      </button>

      <div className="text-xs text-gray-500">Production: support Apple Pay / Google Pay + saved UPI where applicable.</div>
    </div>
  );
}

function WhyFailedSheet({
  onRetry,
  onGoToDispute,
}: {
  onRetry: () => void;
  onGoToDispute: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
        <div className="font-semibold text-red-800">Tip failed</div>
        <div className="text-sm text-red-700/80 mt-1">We couldn’t complete the payment. This is a mock failure state.</div>
      </div>

      <InfoCard icon={<IconInfo />} title="Common reasons" body="Bank declined, network timeout, or card requires verification." />
      <InfoCard icon={<IconCard />} title="Try another method" body="Switch payment method and retry." />
      <InfoCard icon={<IconShield />} title="Need help?" body="Open a dispute if the receipt shows charged but not received." />

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onGoToDispute} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Report (X4.2)
        </button>
        <button onClick={onRetry} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
          Retry
        </button>
      </div>

      <div className="text-xs text-gray-500">Mock fail trigger: amount ends with .13 OR message contains “fail”.</div>
    </div>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center">{icon}</div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-600 mt-1">{body}</div>
        </div>
      </div>
    </div>
  );
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
            {subtitle ? <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div> : null}
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
   Inline icons
   ========================= */

function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 20 6v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7h6M9 11h6M9 15h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h18v10H3V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
