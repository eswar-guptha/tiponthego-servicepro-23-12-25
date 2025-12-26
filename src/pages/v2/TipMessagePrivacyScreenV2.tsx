import React, { useEffect, useMemo, useState } from "react";

/**
 * Screen Code: X1.4
 * Screen Name: Add Message / Emoji / Privacy
 * Currency: USD
 * Roles: Customer / Guest
 * Flow: X1.3 → X1.4 → X1.5 → X2.6
 *
 * Goals:
 *  - Let user add a short message and an emoji reaction quickly
 *  - Provide privacy controls (message visibility + receipt note visibility)
 *  - Keep it frictionless: suggested chips, templates, char counter
 *
 * Canvas-safe:
 *  - No framer-motion
 *  - No external icon libs (inline SVG)
 */

type Privacy = "Private" | "ProOnly" | "Receipt";

type State = {
  tipAmount: number; // from X1.3 (mock)
  proName: string;
  venue: string;
  receiptNo: string;
  emoji: string | null;
  message: string;
  privacy: Privacy;
  showOnShareableReceipt: boolean;
  allowProReply: boolean;
  saveAsTemplate: boolean;
};

const MAX_LEN = 120;

const EMOJIS = ["👏", "🙏", "😊", "🔥", "🌟", "💯", "🥳", "☕", "🍕", "💈", "💅", "🧾"];

const SUGGESTIONS = [
  "Thanks for the great service!",
  "Really appreciate you.",
  "Fast and friendly — thank you!",
  "You made my day 🙌",
  "Awesome attention to detail.",
];

const TEMPLATES: Array<{ title: string; body: string; emoji?: string }> = [
  { title: "Friendly", body: "Thanks {name}! Great service at {venue}.", emoji: "😊" },
  { title: "Quick", body: "Thank you!", emoji: "🙏" },
  { title: "Rave", body: "Amazing work {name} — you’re the best!", emoji: "🌟" },
  { title: "Coffee", body: "Perfect cup today ☕ Thanks {name}!", emoji: "☕" },
];

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function clampMessage(s: string) {
  const clean = (s ?? "").replace(/\s+/g, " ").trimStart();
  return clean.slice(0, MAX_LEN);
}

function applyVars(body: string, vars: { name: string; venue: string }) {
  return body.replaceAll("{name}", vars.name).replaceAll("{venue}", vars.venue);
}

function runDevChecks() {
  try {
    console.assert(clampMessage("   hi") === "hi", "trim start");
    console.assert(clampMessage("a".repeat(999)).length === MAX_LEN, "max len");
    console.assert(applyVars("Hi {name} @ {venue}", { name: "A", venue: "B" }) === "Hi A @ B", "vars");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function TipMessagePrivacyX14() {
  const ctx = useMemo(
    () => ({
      tipAmount: 3.0,
      proName: "Alex",
      venue: "Cafe Aura",
      receiptNo: "RCPT-481220",
    }),
    []
  );

  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "emoji" | "templates" | "privacyInfo">(null);
  const [mounted, setMounted] = useState(false);

  const [s, setS] = useState<State>(() => ({
    tipAmount: ctx.tipAmount,
    proName: ctx.proName,
    venue: ctx.venue,
    receiptNo: ctx.receiptNo,
    emoji: "😊",
    message: "Thanks for the great service!",
    privacy: "ProOnly",
    showOnShareableReceipt: true,
    allowProReply: false,
    saveAsTemplate: false,
  }));

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

  const remaining = MAX_LEN - s.message.length;
  const privacySummary = useMemo(() => privacyLabel(s.privacy), [s.privacy]);

  function back() {
    alert("Back (mock) → X1.3");
  }

  function closeSheet() {
    setMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function openSheet(k: NonNullable<typeof sheet>) {
    setSheet(k);
  }

  function setMessage(v: string) {
    const next = clampMessage(v);
    setS((p) => ({ ...p, message: next }));
  }

  function pickEmoji(e: string | null) {
    setS((p) => ({ ...p, emoji: e }));
    setToast(e ? `Emoji ${e}` : "Emoji cleared");
  }

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    const msg = applyVars(t.body, { name: s.proName, venue: s.venue });
    setS((p) => ({ ...p, message: clampMessage(msg), emoji: t.emoji ?? p.emoji }));
    setToast("Template applied");
    closeSheet();
  }

  function continueToConfirm() {
    // Basic moderation mock: block obvious spam
    const lower = s.message.toLowerCase();
    if (lower.includes("http://") || lower.includes("https://")) {
      setToast("Links are not allowed in messages");
      return;
    }
    setToast("Open X1.5 (mock) · Review & pay");
  }

  function saveDraft() {
    setToast("Draft saved (mock)");
  }

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
          <div className="text-white font-semibold">X1.4 · Message</div>
          <button
            onClick={() => openSheet("privacyInfo")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Info"
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
            <div className="text-white/80 text-xs">Step 2 of 3</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StepChip active label="Amount" />
            <StepChip active label="Message" />
            <StepChip active={false} label="Confirm" />
          </div>
          <div className="mt-2 text-white/80 text-xs">Add a note and choose who can see it.</div>
        </div>

        {/* Context */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-gray-100 flex items-center justify-center">
                <IconUser />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{s.proName}</div>
                <div className="text-sm text-gray-500 mt-0.5 truncate">{s.venue}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">Tip {money(s.tipAmount)}</span>
                  <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">Receipt {s.receiptNo}</span>
                </div>
              </div>
            </div>
            <button
              onClick={saveDraft}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Save
            </button>
          </div>
        </div>

        {/* Emoji + message */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Message</div>
              <div className="text-sm text-gray-500 mt-0.5">Optional, but it feels great to receive.</div>
            </div>
            <button
              onClick={() => openSheet("templates")}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Templates
            </button>
          </div>

          {/* Emoji row */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => openSheet("emoji")}
                className="w-14 h-14 rounded-3xl border border-gray-200 bg-gray-50 flex items-center justify-center text-2xl"
                aria-label="Pick emoji"
              >
                {s.emoji ?? "🙂"}
              </button>
              <div className="min-w-0">
                <div className="text-sm font-semibold">Emoji reaction</div>
                <div className="text-xs text-gray-500 mt-0.5">Tap to change</div>
              </div>
            </div>
            <button
              onClick={() => pickEmoji(null)}
              className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-4">
            <div className="text-xs text-gray-500">Quick suggestions</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((x) => (
                <button
                  key={x}
                  onClick={() => {
                    setMessage(x);
                    setToast("Suggestion added");
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold hover:bg-gray-100"
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="mt-4 rounded-3xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="text-sm font-semibold">Your note</div>
              <div className={`text-xs font-semibold ${remaining < 10 ? "text-amber-700" : "text-gray-500"}`}>{remaining} left</div>
            </div>
            <div className="p-3 bg-white">
              <textarea
                value={s.message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Say something nice…"
                className="w-full min-h-[110px] resize-none outline-none text-sm"
              />
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">No links. Be respectful.</div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(s.message);
                    setToast("Copied message");
                  }}
                  className="h-9 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <IconCopy />
                    Copy
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Privacy</div>
              <div className="text-sm text-gray-500 mt-0.5">Control message visibility.</div>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 font-semibold">{privacySummary}</span>
          </div>

          <div className="mt-4 space-y-2">
            <RadioRow
              title="Private"
              subtitle="Only you can see this note"
              checked={s.privacy === "Private"}
              onClick={() => {
                setS((p) => ({ ...p, privacy: "Private", showOnShareableReceipt: false }));
                setToast("Privacy: Private");
              }}
              icon={<IconLock />}
            />
            <RadioRow
              title="Pro only"
              subtitle="Pro can see it in their dashboard"
              checked={s.privacy === "ProOnly"}
              onClick={() => {
                setS((p) => ({ ...p, privacy: "ProOnly" }));
                setToast("Privacy: Pro only");
              }}
              icon={<IconShield />}
            />
            <RadioRow
              title="Receipt"
              subtitle="Show note on shareable receipt link"
              checked={s.privacy === "Receipt"}
              onClick={() => {
                setS((p) => ({ ...p, privacy: "Receipt", showOnShareableReceipt: true }));
                setToast("Privacy: Receipt");
              }}
              icon={<IconReceipt />}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <ToggleRow
              title="Show on receipt"
              subtitle="When you share receipt"
              checked={s.showOnShareableReceipt}
              onChange={() => {
                const next = !s.showOnShareableReceipt;
                setS((p) => ({ ...p, showOnShareableReceipt: next, privacy: next ? "Receipt" : p.privacy }));
                setToast(next ? "Will show on receipt" : "Hidden from receipt");
              }}
            />
            <ToggleRow
              title="Allow pro reply"
              subtitle="Enable thanks message"
              checked={s.allowProReply}
              onChange={() => {
                setS((p) => ({ ...p, allowProReply: !p.allowProReply }));
                setToast("Updated");
              }}
            />
          </div>

          <div className="mt-2">
            <ToggleRow
              title="Save as template"
              subtitle="Reuse message later"
              checked={s.saveAsTemplate}
              onChange={() => {
                setS((p) => ({ ...p, saveAsTemplate: !p.saveAsTemplate }));
                setToast("Updated");
              }}
            />
          </div>

          <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
            <span className="mt-0.5"><IconInfo /></span>
            <span>Production: add content moderation and allow anonymous tips.</span>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="font-semibold">Preview</div>
          <div className="text-sm text-gray-500 mt-0.5">How it will appear to the pro.</div>

          <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Tip {money(s.tipAmount)} · {s.venue}</div>
                <div className="text-xs text-gray-500 mt-0.5">Receipt {s.receiptNo} · Visibility: {privacySummary}</div>
              </div>
              <div className="text-2xl">{s.emoji ?? ""}</div>
            </div>
            <div className="mt-3 text-sm text-gray-800">{s.message ? `“${s.message.trim()}”` : <span className="text-gray-400">No message</span>}</div>
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X1.4</div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-white">
                <div className="text-xs text-white/75">Next</div>
                <div className="text-sm font-semibold">Review & pay (X1.5)</div>
              </div>
              <button
                onClick={continueToConfirm}
                className="h-11 px-4 rounded-2xl font-semibold bg-white text-blue-700"
                aria-label="Continue"
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
            <IconCheck />
          </span>
          {toast ?? ""}
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet
          title={sheet === "emoji" ? "Pick an emoji" : sheet === "templates" ? "Message templates" : "Privacy help"}
          subtitle={sheet === "privacyInfo" ? "Understand who sees your note" : ""}
          mounted={mounted}
          onClose={closeSheet}
        >
          {sheet === "emoji" ? (
            <EmojiSheet
              selected={s.emoji}
              onSelect={(e) => {
                pickEmoji(e);
                closeSheet();
              }}
              onClear={() => {
                pickEmoji(null);
                closeSheet();
              }}
            />
          ) : sheet === "templates" ? (
            <TemplatesSheet templates={TEMPLATES} onPick={applyTemplate} onClose={closeSheet} />
          ) : (
            <PrivacyInfoSheet onClose={closeSheet} />
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

function privacyLabel(p: Privacy) {
  if (p === "Private") return "Only you";
  if (p === "ProOnly") return "Pro only";
  return "On receipt";
}

function RadioRow({
  title,
  subtitle,
  checked,
  onClick,
  icon,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-3xl border p-4 text-left transition ${checked ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${checked ? "border-white/20 bg-white/10" : "border-gray-200 bg-gray-50"}`}>{icon}</div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className={`text-sm mt-0.5 ${checked ? "text-white/80" : "text-gray-600"}`}>{subtitle}</div>
          </div>
        </div>
        <div className={`mt-2 w-6 h-6 rounded-full border flex items-center justify-center ${checked ? "border-white/30" : "border-gray-300"}`}>
          {checked ? <div className="w-3 h-3 rounded-full bg-white" /> : null}
        </div>
      </div>
    </button>
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

function EmojiSheet({
  selected,
  onSelect,
  onClear,
}: {
  selected: string | null;
  onSelect: (e: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Choose a reaction</div>
        <div className="text-sm text-gray-600 mt-1">This appears in the pro’s notification.</div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {EMOJIS.map((e) => {
          const on = selected === e;
          return (
            <button
              key={e}
              onClick={() => onSelect(e)}
              className={`h-12 rounded-2xl border text-2xl transition ${on ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
              aria-label={`Emoji ${e}`}
            >
              {e}
            </button>
          );
        })}
      </div>

      <button onClick={onClear} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Clear emoji
      </button>
    </div>
  );
}

function TemplatesSheet({
  templates,
  onPick,
  onClose,
}: {
  templates: typeof TEMPLATES;
  onPick: (t: (typeof TEMPLATES)[number]) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Templates</div>
        <div className="text-sm text-gray-600 mt-1">Tap to apply. You can edit after.</div>
      </div>

      <div className="space-y-2">
        {templates.map((t) => (
          <button
            key={t.title}
            onClick={() => onPick(t)}
            className="w-full rounded-3xl border border-gray-200 bg-white p-4 text-left hover:bg-gray-50 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold inline-flex items-center gap-2">
                  {t.emoji ? <span className="text-lg">{t.emoji}</span> : null}
                  <span>{t.title}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{t.body}</div>
              </div>
              <IconChevron />
            </div>
          </button>
        ))}
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function PrivacyInfoSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Privacy explained</div>
        <div className="text-sm text-gray-600 mt-1">Choose the right visibility for your note.</div>
      </div>

      <InfoCard
        icon={<IconLock />}
        title="Private"
        body="Your note stays on your device and is not shown to the pro or on receipts."
      />
      <InfoCard
        icon={<IconShield />}
        title="Pro only"
        body="The pro can see your note in their dashboard and receipt context."
      />
      <InfoCard
        icon={<IconReceipt />}
        title="Receipt"
        body="Your note appears on the shareable receipt link (X3.2). Avoid personal info."
      />

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Got it
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <span className="mt-0.5"><IconInfo /></span>
        <span>Production: add “anonymous tip” and “hide my name” controls.</span>
      </div>
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
          mounted ? "translate-y-0" : "translate-y-[780px]"
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

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 9h10v10H9V9Z" stroke="currentColor" strokeWidth="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 11h12v10H6V11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
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
