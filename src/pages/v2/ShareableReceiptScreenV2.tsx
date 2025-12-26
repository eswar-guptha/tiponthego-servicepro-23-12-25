import React, { useEffect, useMemo, useState } from "react";

/**
 * X3.2 — Shareable Receipt (Customer)
 * FULL SCREEN UI (single file)
 * Currency: USD
 * 
 * Goals
 * - Create a public, shareable receipt link view
 * - Support privacy rules (Private / ProOnly / Receipt) + "Show on receipt"
 * - Provide share actions (copy link, native share), QR mock, download mock
 * - Provide two modes: Public Viewer vs Owner View
 * 
 * Canvas-safe
 * - No framer-motion
 * - No external icon libs
 */

type Privacy = "Private" | "ProOnly" | "Receipt";

type ReceiptModel = {
  receiptNo: string;
  createdAt: string; // ISO
  status: "Paid" | "Refunded" | "Pending";

  proName: string;
  proRole: string;
  venue: string;

  tipAmount: number;
  fee: number;
  total: number;

  emoji: string | null;
  message: string;
  privacy: Privacy;
  showOnShareableReceipt: boolean;

  payment: {
    methodLabel: string; // e.g., Visa •••• 2140
    authCode: string;
  };

  receiptUrl: string;
  verification: {
    verified: boolean;
    signature: string;
  };

  // optional support links
  support: {
    disputeWindowDays: number;
  };
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `${date} · ${time}`;
  } catch {
    return iso;
  }
}

function getPublicMessage(r: ReceiptModel) {
  // Rules:
  // - Private: never show publicly
  // - ProOnly: never show publicly
  // - Receipt: show only if showOnShareableReceipt is true
  if (r.privacy === "Private") return { visible: false, reason: "Customer marked note private" } as const;
  if (r.privacy === "ProOnly") return { visible: false, reason: "Note visible to pro only" } as const;
  if (r.privacy === "Receipt" && !r.showOnShareableReceipt) return { visible: false, reason: "Note hidden from shareable receipt" } as const;
  if (!r.message?.trim()) return { visible: false, reason: "No note" } as const;
  return { visible: true, reason: "Visible on receipt" } as const;
}

function runDevChecks() {
  try {
    const r: ReceiptModel = {
      receiptNo: "R",
      createdAt: new Date().toISOString(),
      status: "Paid",
      proName: "P",
      proRole: "Role",
      venue: "V",
      tipAmount: 3,
      fee: 0.18,
      total: 3.18,
      emoji: "😊",
      message: "Hi",
      privacy: "Private",
      showOnShareableReceipt: true,
      payment: { methodLabel: "Visa", authCode: "A" },
      receiptUrl: "https://example",
      verification: { verified: true, signature: "sig" },
      support: { disputeWindowDays: 14 },
    };

    console.assert(money(1) === "$1.00", "money format");
    console.assert(getPublicMessage(r).visible === false, "private hides");

    const r2 = { ...r, privacy: "Receipt" as const, showOnShareableReceipt: false };
    console.assert(getPublicMessage(r2).visible === false, "receipt + showOff hides");

    const r3 = { ...r, privacy: "Receipt" as const, showOnShareableReceipt: true };
    console.assert(getPublicMessage(r3).visible === true, "receipt + showOn shows");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function X32_ShareableReceipt() {
  const demo = useMemo<ReceiptModel>(() => {
    const tipAmount = 3;
    const fee = Math.max(0.1, Math.round((tipAmount * 0.025 + 0.1) * 100) / 100);
    const total = Math.round((tipAmount + fee) * 100) / 100;
    return {
      receiptNo: "RCPT-481220",
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      status: "Paid",

      proName: "Alex",
      proRole: "Barista",
      venue: "Cafe Aura",

      tipAmount,
      fee,
      total,

      emoji: "😊",
      message: "Thanks for the great service!",
      privacy: "Receipt",
      showOnShareableReceipt: true,

      payment: {
        methodLabel: "Visa •••• 2140",
        authCode: "AUTH-9Q2K",
      },

      receiptUrl: "https://tiptap.example/r/RCPT-481220?sig=2d0b…",
      verification: {
        verified: true,
        signature: "2d0b9b6c-9e4d-4f7a-bf0f-7d0b…",
      },

      support: {
        disputeWindowDays: 14,
      },
    };
  }, []);

  // Viewer mode: public (no email, no payment auth code), owner (full details)
  const [mode, setMode] = useState<"public" | "owner">("public");
  const [toast, setToast] = useState<string | null>(null);

  // simple preferences in this preview (owner can choose what to show publicly)
  const [showReceiptBreakdown, setShowReceiptBreakdown] = useState(true);
  const [showProDetails, setShowProDetails] = useState(true);

  const publicMsg = useMemo(() => getPublicMessage(demo), [demo]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  function copyLink() {
    navigator.clipboard?.writeText(demo.receiptUrl);
    setToast("Link copied");
  }

  function shareLink() {
    const anyNav = navigator as any;
    if (anyNav?.share) {
      anyNav
        .share({ title: "Tip receipt", text: `Receipt ${demo.receiptNo}`, url: demo.receiptUrl })
        .then(() => setToast("Shared"))
        .catch(() => setToast("Share cancelled"));
      return;
    }
    navigator.clipboard?.writeText(demo.receiptUrl);
    setToast("Copied for sharing");
  }

  function downloadMock() {
    setToast("Downloading receipt… (mock)");
  }

  function reportIssueMock() {
    setToast("Open X4.2 Report/Dispute (mock)");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-black/30 backdrop-blur border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setToast("Back (mock)")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <IBack />
          </button>

          <div className="text-white font-semibold">X3.2 · Shareable Receipt</div>

          <button
            onClick={() => setMode((p) => (p === "public" ? "owner" : "public"))}
            className="h-10 px-3 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15"
          >
            {mode === "public" ? "Owner view" : "Public view"}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        {/* Mode banner */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold">
                {mode === "public" ? "Public viewer" : "Owner view"}
              </div>
              <div className="text-white/70 text-xs mt-0.5">
                {mode === "public"
                  ? "What someone sees when you share the receipt link"
                  : "Full details + controls for what appears publicly"}
              </div>
            </div>
            <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-black/20 text-white/80 font-semibold">
              USD
            </span>
          </div>
        </div>

        {/* Receipt header card */}
        <div className="mt-3 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-gray-500">Receipt</div>
                <div className="text-xl font-semibold truncate">{demo.receiptNo}</div>
                <div className="text-sm text-gray-600 mt-1">{formatDateTime(demo.createdAt)}</div>
              </div>
              <StatusPill status={demo.status} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Metric label="Tip" value={money(demo.tipAmount)} />
              <Metric label="Fee" value={money(demo.fee)} />
              <Metric label="Total" value={money(demo.total)} strong />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Tag icon={<ICheck />} label={demo.verification.verified ? "Verified" : "Unverified"} />
              <Tag icon={<IShield />} label={`Signature ${demo.verification.signature.slice(0, 8)}…`} />
              <Tag icon={<IClock />} label={`Dispute window: ${demo.support.disputeWindowDays}d`} />
            </div>
          </div>

          {/* Action row */}
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-2">
              <ActionBtn onClick={copyLink} icon={<ICopy />} label="Copy" />
              <ActionBtn onClick={shareLink} icon={<IShare />} label="Share" />
              <ActionBtn onClick={downloadMock} icon={<IDownload />} label="Download" />
            </div>
            <div className="mt-2 text-[11px] text-gray-500 break-all">{demo.receiptUrl}</div>
          </div>
        </div>

        {/* Public preferences (owner only) */}
        {mode === "owner" ? (
          <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="text-white font-semibold">Public link settings</div>
            <div className="text-white/70 text-sm mt-0.5">Control what the shared receipt shows.</div>

            <div className="mt-3 space-y-2">
              <ToggleRow
                title="Show breakdown"
                subtitle="Tip, fee and total"
                checked={showReceiptBreakdown}
                onChange={() => setShowReceiptBreakdown((p) => !p)}
              />
              <ToggleRow
                title="Show pro details"
                subtitle="Name, role and venue"
                checked={showProDetails}
                onChange={() => setShowProDetails((p) => !p)}
              />
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-white/80 text-xs font-semibold">Message visibility</div>
              <div className="text-white/70 text-xs mt-1">
                Current privacy: <b>{demo.privacy}</b> · Show on receipt: <b>{demo.showOnShareableReceipt ? "On" : "Off"}</b>
              </div>
              <div className="text-white/60 text-[11px] mt-2">
                (Rule) Only privacy = <b>Receipt</b> and toggle <b>On</b> will show message publicly.
              </div>
            </div>
          </div>
        ) : null}

        {/* Details card */}
        <div className="mt-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Details</div>
              <div className="text-sm text-gray-500 mt-0.5">Payment summary & service info.</div>
            </div>
            <button onClick={reportIssueMock} className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
              Report
            </button>
          </div>

          {showProDetails ? (
            <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-3xl border border-gray-100 bg-white flex items-center justify-center">
                  <IUser />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{demo.proName}</div>
                  <div className="text-sm text-gray-600 mt-0.5 truncate">
                    {demo.proRole} · {demo.venue}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-500">
                    <ILoc /> <span>Geo-tag: enabled (mock)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-sm text-gray-600">Pro details hidden by owner settings.</div>
            </div>
          )}

          {showReceiptBreakdown ? (
            <div className="mt-3 rounded-3xl border border-gray-200 bg-white p-4">
              <Row label="Tip" value={money(demo.tipAmount)} />
              <div className="h-px bg-gray-100 my-2" />
              <Row label="Platform fee" value={money(demo.fee)} hint="Secure processing" />
              <div className="h-px bg-gray-100 my-2" />
              <Row label="Total charged" value={money(demo.total)} strong />
              <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Payment method</div>
                <div className="mt-1 font-semibold">{demo.payment.methodLabel}</div>
                {mode === "owner" ? (
                  <div className="text-xs text-gray-500 mt-1">Auth code: {demo.payment.authCode}</div>
                ) : (
                  <div className="text-xs text-gray-500 mt-1">Auth code hidden</div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-3xl border border-gray-200 bg-white p-4">
              <div className="text-sm text-gray-600">Breakdown hidden by owner settings.</div>
            </div>
          )}

          {/* Message block */}
          <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">Note</div>
                <div className="text-sm text-gray-600 mt-0.5">Public visibility rules applied.</div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white font-semibold">{mode === "public" ? "Public" : "Owner"}</span>
            </div>

            {mode === "public" ? (
              publicMsg.visible ? (
                <div className="mt-3 rounded-3xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">Message</div>
                      <div className="text-xs text-gray-500 mt-0.5">Visible on receipt</div>
                    </div>
                    <div className="text-2xl">{demo.emoji ?? ""}</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-800">“{demo.message.trim()}”</div>
                </div>
              ) : (
                <div className="mt-3 rounded-3xl border border-gray-200 bg-white p-4">
                  <div className="text-sm text-gray-600">Message hidden.</div>
                  <div className="text-xs text-gray-500 mt-1">Reason: {publicMsg.reason}</div>
                </div>
              )
            ) : (
              <div className="mt-3 rounded-3xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">Your saved message</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Privacy: <b>{demo.privacy}</b> · Show on receipt: <b>{demo.showOnShareableReceipt ? "On" : "Off"}</b>
                    </div>
                  </div>
                  <div className="text-2xl">{demo.emoji ?? ""}</div>
                </div>
                <div className="mt-2 text-sm text-gray-800">{demo.message?.trim() ? `“${demo.message.trim()}”` : "No message"}</div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setToast("Edit message (X1.4) mock")}
                    className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                  >
                    Edit message
                  </button>
                  <button
                    onClick={() => setToast("Adjust privacy (X1.4) mock")}
                    className="h-11 rounded-2xl bg-gray-900 text-white font-semibold"
                  >
                    Privacy settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR / Verification section */}
        <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-white font-semibold">Verify this receipt</div>
              <div className="text-white/70 text-sm mt-0.5">Scan QR to open the same receipt link.</div>
            </div>
            <button onClick={() => setToast("Copy signature (mock)")} className="h-10 px-3 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold hover:bg-white/15">
              Signature
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-white p-3 border border-gray-100">
              <div className="text-xs text-gray-500">QR</div>
              <div className="mt-2 rounded-2xl border border-gray-100 bg-gray-50 p-3 flex items-center justify-center">
                <FakeQR />
              </div>
              <div className="mt-2 text-[11px] text-gray-500">(Mock) Encodes receipt URL</div>
            </div>

            <div className="rounded-3xl bg-white p-3 border border-gray-100">
              <div className="text-xs text-gray-500">Receipt integrity</div>
              <div className="mt-2 space-y-2">
                <IntegrityRow ok={demo.verification.verified} label="Verified signature" />
                <IntegrityRow ok={true} label="Not tampered" />
                <IntegrityRow ok={true} label="Server timestamp" />
              </div>
              <button onClick={() => setToast("Open verification details (mock)")} className="mt-3 w-full h-10 rounded-2xl bg-gray-900 text-white font-semibold">
                View details
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-white/60">Digital Tipping · Customer · X3.2 Shareable Receipt</div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="rounded-3xl border border-white/10 bg-black/25 backdrop-blur p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white">
                <div className="text-xs text-white/70">Next</div>
                <div className="text-sm font-semibold">X3.1 Wallet / Tip History</div>
              </div>
              <button
                onClick={() => setToast("Proceed to X3.1 (mock)")}
                className="h-11 px-4 rounded-2xl bg-white text-slate-900 font-semibold"
              >
                Continue
              </button>
            </div>
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
            <ICheck />
          </span>
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ReceiptModel["status"] }) {
  const meta =
    status === "Paid"
      ? { bg: "bg-emerald-50", bd: "border-emerald-200", tx: "text-emerald-800", label: "Paid" }
      : status === "Refunded"
      ? { bg: "bg-amber-50", bd: "border-amber-200", tx: "text-amber-800", label: "Refunded" }
      : { bg: "bg-gray-50", bd: "border-gray-200", tx: "text-gray-700", label: "Pending" };

  return <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${meta.bg} ${meta.bd} ${meta.tx}`}>{meta.label}</span>;
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-3xl border border-gray-100 bg-gray-50 p-3 ${strong ? "ring-1 ring-gray-900/10" : ""}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 ${strong ? "text-lg font-semibold" : "font-semibold"}`}>{value}</div>
    </div>
  );
}

function Row({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
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

function ActionBtn({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold flex items-center justify-center gap-2">
      <span className="inline-flex">{icon}</span>
      {label}
    </button>
  );
}

function Tag({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">
      <span className="inline-flex">{icon}</span>
      {label}
    </span>
  );
}

function ToggleRow({ title, subtitle, checked, onChange }: { title: string; subtitle: string; checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className="w-full rounded-3xl border border-white/10 bg-black/20 p-4 text-left hover:bg-white/10 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-white font-semibold">{title}</div>
          <div className="text-white/70 text-sm mt-0.5">{subtitle}</div>
        </div>
        <div className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${checked ? "bg-emerald-500/80 border-emerald-400/50" : "bg-white/5 border-white/15"}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </div>
    </button>
  );
}

function IntegrityRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-3">
      <div className="text-sm font-semibold text-gray-800">{label}</div>
      <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
        {ok ? "OK" : "Fail"}
      </span>
    </div>
  );
}

function FakeQR() {
  // A lightweight QR-like pattern (mock) — not a real QR.
  const cells = new Array(15).fill(0).map((_, i) => i);
  return (
    <div className="grid grid-cols-15 gap-0.5" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }} aria-label="QR mock">
      {cells.map((r) =>
        cells.map((c) => {
          const key = `${r}-${c}`;
          const on = (r * 17 + c * 11 + (r % 3) * 7) % 5 === 0 || (r < 4 && c < 4) || (r > 10 && c < 4) || (r < 4 && c > 10);
          return <div key={key} className={`w-2.5 h-2.5 rounded-[3px] ${on ? "bg-gray-900" : "bg-white"}`} />;
        })
      )}
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }

      /* Light scrollbar on dark background */
      ::-webkit-scrollbar{ width:10px; height:10px; }
      ::-webkit-scrollbar-thumb{ background: rgba(255,255,255,.16); border-radius: 999px; border: 3px solid rgba(0,0,0,.15); }
    `}</style>
  );
}

/* =========================
   Inline Icons
   ========================= */

function IBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ICopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 9h10v10H9V9Z" stroke="currentColor" strokeWidth="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 8a3 3 0 1 0-2.83-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12l8-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12l8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12a3 3 0 1 1-2.83-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 16a3 3 0 1 0 2.83 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IDownload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 21h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 21a8 8 0 1 0-16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ILoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ICheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 20 6v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
