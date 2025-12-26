import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Gift,
  Info,
  Lock,
  Moon,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

/**
 * Screen Code: X5.3
 * Screen Name: Notification Soft Prompt (pre-OS prompt) for Tip Reminders
 * Currency: USD
 * Roles: Guest / Customer
 * Entry:
 *  - From X2.9 Tip Reminder screen when permission is not granted
 *  - After X5.2 location consent (optional step)
 *  - From onboarding stepper
 * Purpose:
 *  - Explain WHY notifications matter before OS permission prompt
 *  - Provide granular intent: reminders vs promos
 *  - Set quiet hours quickly (night preset)
 *  - Route to OS prompt only after user confirms
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Uses CSS keyframes for subtle hero glow + check pop
 */

type Perm = "not_set" | "granted" | "denied";

type Model = {
  perm: Perm;
  wantsTips: boolean;
  wantsSecurity: boolean;
  wantsPromos: boolean;
  quietNight: boolean;
  step: 0 | 1; // 0 = soft prompt, 1 = OS prompt preview
};

const DEFAULTS: Model = {
  perm: "not_set",
  wantsTips: true,
  wantsSecurity: true,
  wantsPromos: false,
  quietNight: true,
  step: 0,
};

function runDevChecks() {
  try {
    console.assert(DEFAULTS.wantsTips === true, "tips default on");
    console.assert(DEFAULTS.step === 0, "step starts");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function NotificationSoftPromptX53() {
  const [m, setM] = useState<Model>(DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const canContinue = useMemo(() => {
    if (m.perm === "granted") return true;
    // If user turns off everything, don't ask permission.
    return m.wantsTips || m.wantsSecurity || m.wantsPromos;
  }, [m.perm, m.wantsPromos, m.wantsSecurity, m.wantsTips]);

  function back() {
    if (m.step === 0) {
      alert("Back (mock) → X2.9 Tip Reminder");
      return;
    }
    setM((p) => ({ ...p, step: 0 }));
  }

  function next() {
    if (!canContinue) {
      setToast("Select at least one notification type");
      return;
    }

    if (m.perm === "granted") {
      alert("Next: X2.9 Tip Reminder (permission already granted)");
      return;
    }

    if (m.step === 0) {
      // If user only wants in-app (all off), skip OS prompt.
      if (!m.wantsTips && !m.wantsSecurity && !m.wantsPromos) {
        setToast("Continuing without notifications");
        alert("Next: X2.9 Tip Reminder (in-app only)");
        return;
      }
      setM((p) => ({ ...p, step: 1 }));
      return;
    }

    // step 1: simulate OS prompt
    setToast("Requesting OS permission…");
    window.setTimeout(() => {
      setM((p) => ({ ...p, perm: "granted" }));
      setToast("Notifications enabled");
      window.setTimeout(() => alert("Next: X2.9 Tip Reminder (mock)"), 350);
    }, 750);
  }

  function denyOS() {
    setM((p) => ({ ...p, perm: "denied", step: 0 }));
    setToast("Permission denied");
  }

  function toggle(key: "wantsTips" | "wantsSecurity" | "wantsPromos" | "quietNight") {
    setM((p) => ({ ...p, [key]: !p[key] } as Model));
    setToast("Saved");
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
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X5.3 · Notifications</div>
          <button
            onClick={() => setDetailOpen(true)}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3">
        {/* Step chip */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4 text-white">
          <div className="text-xs text-white/80">Pre-permission soft prompt</div>
          <div className="mt-2 text-xl font-semibold">Don’t miss a tip moment</div>
          <div className="text-sm text-white/85 mt-1">
            We’ll only ask OS permission after you choose what you want.
          </div>
          <div className="mt-3 inline-flex items-center gap-2 text-xs bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
            <Bell className="w-4 h-4" />
            <span>Step {m.step + 1} / 2</span>
          </div>
        </div>

        {/* Hero card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Convert missed tips</span>
                  </div>
                  <div className="mt-2 text-xl font-semibold">Smart reminders</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Get a gentle nudge after an encounter — or when a pro goes live.
                  </div>
                </div>
                <div className="w-14 h-14 rounded-3xl bg-white border border-gray-100 flex items-center justify-center heroGlow">
                  <Bell className="w-6 h-6 text-blue-700" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniValue title="Recover" desc="Missed tips" icon={<Gift className="w-4 h-4" />} />
                <MiniValue title="Secure" desc="Alerts" icon={<Shield className="w-4 h-4" />} />
                <MiniValue title="Control" desc="Quiet hours" icon={<Moon className="w-4 h-4" />} />
              </div>
            </div>

            {/* Soft prompt controls */}
            {m.step === 0 && (
              <div className="mt-4 space-y-2">
                <div className="font-semibold">Choose what to receive</div>
                <div className="text-sm text-gray-500">You can change anytime in X5.1 Settings.</div>

                <ToggleRow
                  title="Tip reminders"
                  subtitle="Missed tip recovery + pro live updates"
                  checked={m.wantsTips}
                  onChange={() => toggle("wantsTips")}
                  icon={<Gift className="w-4 h-4" />}
                />
                <ToggleRow
                  title="Security alerts"
                  subtitle="Suspicious activity, refund updates"
                  checked={m.wantsSecurity}
                  onChange={() => toggle("wantsSecurity")}
                  icon={<Shield className="w-4 h-4" />}
                />
                <ToggleRow
                  title="Promotions"
                  subtitle="Offers and updates (optional)"
                  checked={m.wantsPromos}
                  onChange={() => toggle("wantsPromos")}
                  icon={<Sparkles className="w-4 h-4" />}
                />

                <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">Quiet hours</div>
                      <div className="text-sm text-gray-600 mt-0.5">Mute reminders at night (22:00–08:00).</div>
                    </div>
                    <button
                      onClick={() => toggle("quietNight")}
                      className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${m.quietNight ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"}`}
                      aria-label="Toggle quiet hours"
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition ${m.quietNight ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 flex items-start gap-2">
                    <Lock className="w-4 h-4 mt-0.5" />
                    <span>We never ask for OTP/PIN via notifications.</span>
                  </div>
                </div>

                {!canContinue && (
                  <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                    <div className="font-semibold text-amber-900">Nothing selected</div>
                    <div className="text-sm text-amber-800 mt-1">Choose at least one type to enable notifications.</div>
                  </div>
                )}
              </div>
            )}

            {/* OS prompt preview */}
            {m.step === 1 && (
              <div className="mt-4">
                <div className="font-semibold">System permission (mock)</div>
                <div className="text-sm text-gray-500 mt-1">This is the OS prompt you’ll see next.</div>

                <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">OS prompt preview</div>
                  <div className="mt-2 rounded-3xl bg-white border border-gray-200 p-4">
                    <div className="font-semibold">Allow notifications?</div>
                    <div className="text-sm text-gray-600 mt-1">
                      You’ll receive: {summary(m)}
                      {m.quietNight ? " · Quiet hours enabled" : ""}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={denyOS}
                        className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                      >
                        Don’t Allow
                      </button>
                      <button
                        onClick={next}
                        className="h-11 rounded-2xl text-white font-semibold bg-gray-900"
                      >
                        Allow
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5" />
                    <span>Soft prompts increase opt-in by explaining value before the OS prompt.</span>
                  </div>
                </div>

                <button
                  onClick={() => setM((p) => ({ ...p, step: 0 }))}
                  className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  Change selection
                </button>
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <button
              onClick={next}
              disabled={!canContinue}
              className={`w-full h-12 rounded-2xl font-semibold inline-flex items-center justify-center gap-2 ${
                canContinue ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {m.step === 0 ? "Continue" : "Request permission"}
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="mt-2 text-xs text-gray-500 flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5" />
              <span>You’ll get in-app reminders even if you skip OS permission.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details modal */}
      {detailOpen && (
        <Modal title="Notification rules" onClose={() => setDetailOpen(false)}>
          <div className="space-y-3">
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="font-semibold">We send</div>
              <div className="text-sm text-gray-600 mt-2 space-y-2">
                <div className="inline-flex items-center gap-2"><Gift className="w-4 h-4" /> Missed tip recovery reminders</div>
                <div className="inline-flex items-center gap-2"><Shield className="w-4 h-4" /> Refund/security updates</div>
              </div>
            </div>
            <div className="rounded-3xl border border-gray-100 p-4">
              <div className="font-semibold">We don’t send</div>
              <div className="text-sm text-gray-600 mt-2 space-y-2">
                <div className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> OTP/PIN requests</div>
                <div className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> Excessive promos (unless you opt-in)</div>
              </div>
            </div>

            <button
              onClick={() => setDetailOpen(false)}
              className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg inline-flex items-center gap-2">
          <span className={toast?.includes("enabled") || toast?.includes("Saved") ? "okTick" : ""}>
            <Check className="w-4 h-4" />
          </span>
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function summary(m: Model) {
  const items: string[] = [];
  if (m.wantsTips) items.push("Tip reminders");
  if (m.wantsSecurity) items.push("Security alerts");
  if (m.wantsPromos) items.push("Promotions");
  return items.length ? items.join(", ") : "None";
}

function MiniValue({ title, desc, icon }: { title: string; desc: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3">
      <div className="text-xs text-gray-500 inline-flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </div>
      <div className="font-semibold text-sm mt-1">{desc}</div>
    </div>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
  icon,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button onClick={onChange} className="w-full text-left rounded-3xl border border-gray-100 bg-white px-4 py-3 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${checked ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700"}`}
          >
            {icon}
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
          </div>
        </div>
        <div className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </div>
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setMounted(false);
    setTimeout(() => onClose(), 160);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button className="absolute inset-0 bg-black/40" onClick={close} aria-label="Close overlay" />
      <div
        className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
          mounted ? "translate-y-0" : "translate-y-6"
        }`}
        role="dialog"
        aria-label={title}
      >
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <button onClick={close} className="w-9 h-9 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50" aria-label="Close">
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
      .heroGlow{ position: relative; }
      .heroGlow:after{
        content: "";
        position: absolute;
        inset: -2px;
        border-radius: 22px;
        background: rgba(37,99,235,.22);
        filter: blur(12px);
        opacity: .55;
        animation: heroGlow 1.5s infinite;
        z-index: -1;
      }
      @keyframes heroGlow{
        0%{ transform: scale(.96); opacity: .25; }
        55%{ transform: scale(1.02); opacity: .7; }
        100%{ transform: scale(.96); opacity: .25; }
      }
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }
    `}</style>
  );
}
