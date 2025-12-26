import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Info,
  Lock,
  MapPin,
  Shield,
  Sparkles,
  X,
} from "lucide-react";

/**
 * Screen Code: X5.2
 * Screen Name: Location Consent / Onboarding Gate (Pre-permission UX)
 * Currency: USD
 * Roles: Guest / Customer
 * Entry:
 *  - First run (before X2.1 map)
 *  - When user taps "Enable nearby" CTA in Discovery
 *  - When location is OFF and user attempts Missed Tip Recovery
 * Purpose:
 *  - Explain value clearly BEFORE OS permission prompt
 *  - Offer minimal choices: Approx / Precise / Not now
 *  - Capture consent intent and route to OS prompt
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Uses CSS keyframes for subtle hero pulse
 */

type Step = 0 | 1 | 2;

type LocationChoice = "approx" | "precise" | "later";

type PermState = "not_set" | "granted" | "denied";

type Model = {
  step: Step;
  choice: LocationChoice | null;
  perm: PermState;
  remindersOn: boolean;
  discoveryOn: boolean;
  retentionDays: 7 | 30;
};

const DEFAULTS: Model = {
  step: 0,
  choice: null,
  perm: "not_set",
  remindersOn: true,
  discoveryOn: true,
  retentionDays: 30,
};

function runDevChecks() {
  try {
    console.assert(DEFAULTS.step === 0, "step starts at 0");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function LocationConsentX52() {
  const [m, setM] = useState<Model>(DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const canContinue = useMemo(() => {
    if (m.step === 0) return m.choice !== null;
    if (m.step === 1) return true;
    return true;
  }, [m.choice, m.step]);

  function pick(choice: LocationChoice) {
    setM((p) => ({ ...p, choice }));
    setToast(choice === "later" ? "You can enable anytime" : choice === "approx" ? "Approximate selected" : "Precise selected");
  }

  function next() {
    if (!canContinue) return;

    if (m.step === 0) {
      // If later, skip OS prompt and route to limited discovery.
      if (m.choice === "later") {
        setM((p) => ({ ...p, step: 2, perm: "denied", discoveryOn: false }));
        setToast("Continuing without location");
        return;
      }
      setM((p) => ({ ...p, step: 1 }));
      return;
    }

    if (m.step === 1) {
      // Simulate OS permission prompt.
      setToast("Requesting OS permission…");
      window.setTimeout(() => {
        setM((p) => ({ ...p, perm: "granted", step: 2 }));
        setToast("Location enabled");
      }, 750);
      return;
    }

    // step 2 — go to app
    alert(routeAfter(m));
  }

  function back() {
    if (m.step === 0) {
      alert("Back (mock) → previous screen");
      return;
    }
    setM((p) => ({ ...p, step: ((p.step - 1) as Step) }));
  }

  function routeAfter(model: Model) {
    // Mock routing behavior.
    if (model.perm === "granted") {
      if (model.discoveryOn) return "Next: X2.1 Nearby Discovery (Full map)";
      return "Next: X2.1 Nearby Discovery (Limited)";
    }
    return "Next: X2.1 Nearby Discovery (Limited, no location)";
  }

  function toggle(key: "remindersOn" | "discoveryOn") {
    setM((p) => ({ ...p, [key]: !p[key] } as Model));
  }

  function setRetention(days: 7 | 30) {
    setM((p) => ({ ...p, retentionDays: days }));
    setToast("Retention updated");
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
          <div className="text-white font-semibold">X5.2 · Location setup</div>
          <button
            onClick={() => setShowDetail(true)}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Details"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3">
        {/* Step indicator */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4 text-white">
          <div className="text-xs text-white/80">Step {m.step + 1} of 3</div>
          <div className="mt-2 flex items-center gap-2">
            <Dot active={m.step >= 0} />
            <div className="h-1 w-8 rounded-full bg-white/30" />
            <Dot active={m.step >= 1} />
            <div className="h-1 w-8 rounded-full bg-white/30" />
            <Dot active={m.step >= 2} />
          </div>
          <div className="mt-3 text-xl font-semibold">Enable nearby tips</div>
          <div className="text-sm text-white/85 mt-1">We’ll ask for OS permission next — after you choose your mode.</div>
        </div>

        {/* Hero */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-blue-50 to-emerald-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>Nearby discovery + reminders</span>
                  </div>
                  <div className="mt-2 text-xl font-semibold">Tip the right pro, fast</div>
                  <div className="text-sm text-gray-600 mt-1">See nearby pros and recover missed tips after you leave.</div>
                </div>
                <div className="w-14 h-14 rounded-3xl bg-white border border-gray-100 flex items-center justify-center heroPulse">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniValue title="Discover" desc="Near-by pros" />
                <MiniValue title="Recover" desc="Missed tips" />
                <MiniValue title="Privacy" desc="You control" />
              </div>
            </div>

            {/* Step screens */}
            {m.step === 0 && (
              <div className="mt-4">
                <div className="font-semibold">Choose your location mode</div>
                <div className="text-sm text-gray-500 mt-1">You can change this anytime in X5.1 Settings.</div>

                <div className="mt-3 space-y-2">
                  <Choice
                    active={m.choice === "approx"}
                    title="Approximate (Recommended)"
                    subtitle="Good enough for discovery and reminders"
                    icon={<MapPin className="w-4 h-4" />}
                    onClick={() => pick("approx")}
                  />
                  <Choice
                    active={m.choice === "precise"}
                    title="Precise"
                    subtitle="More accurate pins + clusters (best for busy areas)"
                    icon={<MapPin className="w-4 h-4" />}
                    onClick={() => pick("precise")}
                  />
                  <Choice
                    active={m.choice === "later"}
                    title="Not now"
                    subtitle="Continue with limited discovery"
                    icon={<Lock className="w-4 h-4" />}
                    onClick={() => pick("later")}
                  />
                </div>

                <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="font-semibold">Controls</div>
                  <div className="text-sm text-gray-600 mt-1">Pick what features can use location.</div>

                  <div className="mt-3 space-y-2">
                    <ToggleRow
                      title="Nearby discovery"
                      subtitle="Map pins and nearby list"
                      checked={m.discoveryOn}
                      onChange={() => toggle("discoveryOn")}
                      disabled={m.choice === "later"}
                    />
                    <ToggleRow
                      title="Tip reminders"
                      subtitle="Missed tip recovery and nudges"
                      checked={m.remindersOn}
                      onChange={() => toggle("remindersOn")}
                      disabled={m.choice === "later"}
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5" />
                    <span>We use coarse signals by default and keep them for a limited time.</span>
                  </div>
                </div>
              </div>
            )}

            {m.step === 1 && (
              <div className="mt-4">
                <div className="font-semibold">Before we ask iOS/Android</div>
                <div className="text-sm text-gray-500 mt-1">This is the system prompt you’ll see next.</div>

                <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-xs text-gray-500">System prompt (mock)</div>
                  <div className="mt-2 rounded-3xl bg-white border border-gray-200 p-4">
                    <div className="font-semibold">Allow “Digital Tipping” to access your location?</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Used for nearby discovery and reminders. Mode: <b>{m.choice === "precise" ? "Precise" : "Approximate"}</b>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setM((p) => ({ ...p, perm: "denied", step: 2, discoveryOn: false, remindersOn: false }));
                          setToast("Permission denied");
                        }}
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
                    <span>We show a soft prompt first because OS prompts are irreversible for many users.</span>
                  </div>
                </div>
              </div>
            )}

            {m.step === 2 && (
              <div className="mt-4">
                <div className="font-semibold">You’re set</div>
                <div className="text-sm text-gray-500 mt-1">You can update this anytime in X5.1.</div>

                <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Permission</div>
                      <div className="font-semibold">{m.perm === "granted" ? "Granted" : "Not enabled"}</div>
                      <div className="text-sm text-gray-600 mt-1">Mode: {m.choice === "precise" ? "Precise" : m.choice === "approx" ? "Approximate" : "Off"}</div>
                    </div>
                    <Badge ok={m.perm === "granted"} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-3">
                      <div className="text-xs text-gray-500">Discovery</div>
                      <div className="font-semibold">{m.discoveryOn && m.perm === "granted" ? "On" : "Limited"}</div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-3">
                      <div className="text-xs text-gray-500">Reminders</div>
                      <div className="font-semibold">{m.remindersOn && m.perm === "granted" ? "On" : "Off"}</div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-3xl border border-gray-100 bg-white p-4">
                    <div className="font-semibold">Data retention</div>
                    <div className="text-sm text-gray-500 mt-1">How long we keep coarse encounter signals.</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Pill active={m.retentionDays === 7} label="7 days" onClick={() => setRetention(7)} />
                      <Pill active={m.retentionDays === 30} label="30 days" onClick={() => setRetention(30)} />
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5" />
                    <span>We never store precise GPS by default in this mock. Follow policy in production.</span>
                  </div>
                </div>
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
              {m.step === 0 ? "Continue" : m.step === 1 ? "Request permission" : "Go to Discovery"}
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="mt-2 text-xs text-gray-500 flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5" />
              <span>We’ll only request OS permission after you choose your mode.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {showDetail && (
        <Modal title="What we collect" onClose={() => setShowDetail(false)}>
          <div className="space-y-3">
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="font-semibold">We use location for</div>
              <div className="text-sm text-gray-600 mt-2 space-y-2">
                <div className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> Nearby discovery (pins + list)</div>
                <div className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4" /> Missed tip recovery prompts</div>
                <div className="inline-flex items-center gap-2"><Shield className="w-4 h-4" /> Fraud prevention signals (coarse)</div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 p-4">
              <div className="font-semibold">We don’t use location for</div>
              <div className="text-sm text-gray-600 mt-2 space-y-2">
                <div className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> Advertising / selling data</div>
                <div className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> Tracking you across apps</div>
              </div>
            </div>

            <button
              onClick={() => setShowDetail(false)}
              className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Done
            </button>

            <div className="text-xs text-gray-500 flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5" />
              <span>Production: link to privacy policy and consent logs.</span>
            </div>
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
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg">{toast ?? ""}</div>
      </div>
    </div>
  );
}

function Dot({ active }: { active: boolean }) {
  return <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-white" : "bg-white/40"}`} />;
}

function MiniValue({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3">
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
    </div>
  );
}

function Badge({ ok }: { ok: boolean }) {
  return (
    <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2 ${ok ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
      <span className={ok ? "okTick" : ""}><Check className="w-4 h-4" /></span>
      {ok ? "Enabled" : "Limited"}
    </span>
  );
}

function Choice({
  active,
  title,
  subtitle,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-3xl border p-4 transition ${active ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100 hover:bg-gray-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${active ? "bg-white border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700"}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
          </div>
        </div>
        {active ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-600 text-white font-semibold inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Selected
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 mt-4" />
        )}
      </div>
    </button>
  );
}

function ToggleRow({
  title,
  subtitle,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => {
        if (disabled) return;
        onChange();
      }}
      className={`w-full text-left rounded-3xl border border-gray-100 bg-white px-4 py-3 transition ${disabled ? "opacity-60" : "hover:bg-gray-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
        </div>
        <div className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"}`}>
          <div className={`w-5 h-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </div>
      </div>
    </button>
  );
}

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-2xl border font-semibold inline-flex items-center justify-center transition ${
        active ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
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
      .heroPulse{ position: relative; }
      .heroPulse:after{
        content: "";
        position: absolute;
        inset: -2px;
        border-radius: 22px;
        background: rgba(16,185,129,.20);
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
