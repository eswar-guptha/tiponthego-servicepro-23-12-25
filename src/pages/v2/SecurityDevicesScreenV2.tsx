import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  CircleAlert,
  Copy,
  KeyRound,
  Lock,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";

/**
 * Screen Code: X6.2
 * Screen Name: Security & Devices
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From X6.1 → Security score card / settings
 * Purpose:
 *  - Show active sessions/devices and allow revoke
 *  - Manage 2FA, biometric/passcode, and security alerts
 *  - Provide transparent “Recent security events” audit log
 * Canvas Compatibility:
 *  - Avoids framer-motion
 *  - Avoids lucide icons that may fail CDN fetch in some sandboxes
 */

type VerifyState = "off" | "on";

type DeviceType = "phone" | "laptop";

type Device = {
  id: string;
  type: DeviceType;
  name: string;
  os: string;
  location: string;
  lastActive: string;
  isThisDevice?: boolean;
  trusted: boolean;
};

type EventLevel = "info" | "warn" | "danger";

type SecurityEvent = {
  id: string;
  title: string;
  detail: string;
  at: string;
  level: EventLevel;
};

type State = {
  twoFA: VerifyState;
  biometrics: VerifyState;
  securityAlerts: VerifyState;
  locationChecks: VerifyState;
  recoveryCode: string;
  devices: Device[];
  events: SecurityEvent[];
};

const DEMO: State = {
  twoFA: "on",
  biometrics: "on",
  securityAlerts: "on",
  locationChecks: "on",
  recoveryCode: "RCV-8K2M-19F3",
  devices: [
    {
      id: "DEV-THIS",
      type: "phone",
      name: "iPhone 14",
      os: "iOS 17",
      location: "Hyderabad, IN",
      lastActive: "Now",
      isThisDevice: true,
      trusted: true,
    },
    {
      id: "DEV-2",
      type: "laptop",
      name: "MacBook Air",
      os: "macOS 14",
      location: "Hyderabad, IN",
      lastActive: "Dec 22 · 9:10 PM",
      trusted: true,
    },
    {
      id: "DEV-3",
      type: "phone",
      name: "Android",
      os: "Android 14",
      location: "Bengaluru, IN",
      lastActive: "Dec 18 · 6:42 PM",
      trusted: false,
    },
  ],
  events: [
    {
      id: "EV-1",
      title: "Login approved",
      detail: "OTP verified on iPhone 14",
      at: "Dec 23 · 10:12 AM",
      level: "info",
    },
    {
      id: "EV-2",
      title: "New device detected",
      detail: "Android 14 · Bengaluru, IN",
      at: "Dec 18 · 6:42 PM",
      level: "warn",
    },
    {
      id: "EV-3",
      title: "Suspicious attempt blocked",
      detail: "Rate-limited login attempts",
      at: "Dec 12 · 1:22 AM",
      level: "danger",
    },
  ],
};

function runDevChecks() {
  try {
    console.assert(DEMO.devices.length >= 1, "has devices");
    console.assert(DEMO.recoveryCode.startsWith("RCV-"), "recovery code format");

    // Added tests
    console.assert(mask("RCV-ABCD-1234").endsWith("1234"), "mask keeps last4");
    console.assert(mask("") === "—", "mask empty");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function SecurityDevicesX62() {
  const [s, setS] = useState<State>(DEMO);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<
    null | "twoFA" | "biometrics" | "alerts" | "recovery" | "revoke" | "trust" | "help"
  >(null);
  const [mounted, setMounted] = useState(false);
  const [targetDevice, setTargetDevice] = useState<Device | null>(null);

  useEffect(() => {
    if (!sheet) return;
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, [sheet]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  const securityScore = useMemo(() => {
    let score = 40; // base
    if (s.twoFA === "on") score += 25;
    if (s.biometrics === "on") score += 10;
    if (s.securityAlerts === "on") score += 10;
    if (s.locationChecks === "on") score += 5;
    const untrusted = s.devices.filter((d) => !d.trusted).length;
    score -= Math.min(20, untrusted * 10);
    return Math.max(0, Math.min(100, score));
  }, [s.biometrics, s.devices, s.locationChecks, s.securityAlerts, s.twoFA]);

  const scoreTone = securityScore >= 85 ? "emerald" : securityScore >= 65 ? "amber" : "red";

  function back() {
    alert("Back (mock) → X6.1");
  }

  function open(k: NonNullable<typeof sheet>, device?: Device) {
    if (device) setTargetDevice(device);
    setSheet(k);
  }

  function close() {
    setMounted(false);
    setTimeout(() => {
      setSheet(null);
      setTargetDevice(null);
    }, 180);
  }

  function toggle(key: "twoFA" | "biometrics" | "securityAlerts" | "locationChecks") {
    setS((p) => ({ ...p, [key]: p[key] === "on" ? "off" : "on" } as State));
    setToast("Updated");
  }

  function copyRecovery() {
    navigator.clipboard?.writeText(s.recoveryCode);
    setToast("Copied recovery code");
  }

  function regenRecovery() {
    const next =
      "RCV-" +
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    setS((p) => ({ ...p, recoveryCode: next }));
    setToast("New code generated");
  }

  function revokeDevice(id: string) {
    setS((p) => ({
      ...p,
      devices: p.devices.filter((d) => d.id !== id),
      events: [
        {
          id: "EV-" + Date.now(),
          title: "Session revoked",
          detail: `Device removed: ${id}`,
          at: nowStamp(),
          level: "info",
        },
        ...p.events,
      ],
    }));
    setToast("Session revoked");
    close();
  }

  function setTrusted(id: string, trusted: boolean) {
    setS((p) => ({
      ...p,
      devices: p.devices.map((d) => (d.id === id ? { ...d, trusted } : d)),
      events: [
        {
          id: "EV-" + Date.now(),
          title: trusted ? "Device trusted" : "Device untrusted",
          detail: `Updated trust for ${id}`,
          at: nowStamp(),
          level: trusted ? "info" : "warn",
        },
        ...p.events,
      ],
    }));
    setToast(trusted ? "Marked trusted" : "Marked untrusted");
    close();
  }

  function revokeAll() {
    setToast("Revoking others…");
    window.setTimeout(() => {
      setS((p) => ({
        ...p,
        devices: p.devices.filter((d) => d.isThisDevice),
        events: [
          {
            id: "EV-" + Date.now(),
            title: "Revoked all other sessions",
            detail: "Only this device remains signed in",
            at: nowStamp(),
            level: "info",
          },
          ...p.events,
        ],
      }));
      setToast("Done");
    }, 700);
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
          <div className="text-white font-semibold">X6.2 · Security</div>
          <button
            onClick={() => open("help")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Help"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-3">
        {/* Score card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Security score</span>
                </div>
                <div className="mt-1 text-2xl font-semibold">{securityScore}/100</div>
                <div className="text-sm text-gray-600 mt-1">Revoke unknown devices and keep 2FA enabled.</div>
              </div>
              <TonePill
                tone={scoreTone}
                label={scoreTone === "emerald" ? "Strong" : scoreTone === "amber" ? "Good" : "At risk"}
              />
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  scoreTone === "emerald" ? "bg-emerald-600" : scoreTone === "amber" ? "bg-amber-500" : "bg-red-600"
                }`}
                style={{ width: `${securityScore}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={revokeAll} className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
                Revoke others
              </button>
              <button
                onClick={() => setToast("Security scan complete (mock)")}
                className="h-11 rounded-2xl text-white font-semibold bg-gray-900 pulse"
              >
                Run scan
              </button>
            </div>
          </div>
        </div>

        {/* Security controls */}
        <Section title="Security controls" subtitle="Protect access and detect unusual activity">
          <ToggleRow
            icon={<KeyRound className="w-4 h-4" />}
            title="Two‑factor authentication"
            subtitle="OTP required on new device logins"
            checked={s.twoFA === "on"}
            onClick={() => open("twoFA")}
          />
          <ToggleRow
            icon={<BiometricIcon />}
            title="Biometric / Passcode"
            subtitle="Unlock to view receipts and confirm tips"
            checked={s.biometrics === "on"}
            onClick={() => open("biometrics")}
          />
          <ToggleRow
            icon={<Bell className="w-4 h-4" />}
            title="Security alerts"
            subtitle="Notify on new device, password change"
            checked={s.securityAlerts === "on"}
            onClick={() => open("alerts")}
          />
          <ToggleRow
            icon={<MapPin className="w-4 h-4" />}
            title="Location checks"
            subtitle="Flag logins far from your usual area"
            checked={s.locationChecks === "on"}
            onClick={() => toggle("locationChecks")}
          />
        </Section>

        {/* Recovery */}
        <Section title="Recovery" subtitle="Backup access if you lose your phone">
          <Row
            icon={<Lock className="w-4 h-4" />}
            title="Recovery code"
            value={mask(s.recoveryCode)}
            right={<ChevronRight className="w-4 h-4 text-gray-400" />}
            onClick={() => open("recovery")}
          />
        </Section>

        {/* Devices */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Devices & sessions</div>
              <div className="text-sm text-gray-500 mt-0.5">Tap a device to manage</div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full border bg-gray-50 border-gray-200 text-gray-700 font-semibold">
              {s.devices.length}
            </span>
          </div>
          <div className="p-2 space-y-2">
            {s.devices.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setTargetDevice(d);
                  setToast(`${d.name} · ${d.lastActive}`);
                }}
                className="w-full text-left rounded-3xl border border-gray-100 bg-white px-4 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
                        d.trusted ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-800"
                      }`}
                    >
                      {d.type === "phone" ? <Smartphone className="w-4 h-4" /> : <DeviceLaptopIcon />}
                    </div>
                    <div>
                      <div className="font-semibold inline-flex items-center gap-2">
                        <span>{d.name}</span>
                        {d.isThisDevice ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full border bg-blue-50 border-blue-100 text-blue-800 font-semibold">
                            This device
                          </span>
                        ) : null}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {d.os} · {d.location}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Last active: {d.lastActive}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                        d.trusted ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-amber-50 border-amber-100 text-amber-800"
                      }`}
                    >
                      {d.trusted ? "Trusted" : "Untrusted"}
                    </span>
                    {!d.isThisDevice ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          open("revoke", d);
                        }}
                        className="h-9 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          open("trust", d);
                        }}
                        className="h-9 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent events */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold">Recent security events</div>
            <div className="text-sm text-gray-500 mt-0.5">Audit log for peace of mind</div>
          </div>
          <div className="p-2 space-y-2">
            {s.events.slice(0, 5).map((ev) => (
              <div key={ev.id} className="rounded-3xl border border-gray-100 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
                        ev.level === "info"
                          ? "bg-blue-50 border-blue-100 text-blue-800"
                          : ev.level === "warn"
                          ? "bg-amber-50 border-amber-100 text-amber-800"
                          : "bg-red-50 border-red-100 text-red-800"
                      }`}
                    >
                      {ev.level === "info" ? <Shield className="w-4 h-4" /> : <CircleAlert className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold">{ev.title}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{ev.detail}</div>
                      <div className="text-xs text-gray-500 mt-1">{ev.at}</div>
                    </div>
                  </div>
                  {ev.level !== "info" ? (
                    <button
                      onClick={() => setToast("Reported (mock)")}
                      className="h-9 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                    >
                      Not me
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X6.2</div>
      </div>

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-8 z-[70] transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg inline-flex items-center gap-2">
          <span className={toast?.includes("Updated") || toast?.includes("Copied") || toast?.includes("Done") ? "okTick" : ""}>
            <ShieldCheck className="w-4 h-4" />
          </span>
          {toast ?? ""}
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet title={sheetTitle(sheet)} mounted={mounted} onClose={close}>
          {sheet === "twoFA" ? (
            <ToggleSheet
              title="Two‑factor authentication"
              desc="Require OTP when logging in from a new device."
              checked={s.twoFA === "on"}
              onToggle={() => toggle("twoFA")}
              onClose={close}
            />
          ) : sheet === "biometrics" ? (
            <ToggleSheet
              title="Biometric / Passcode"
              desc="Use device lock (Face/Touch/PIN) to approve sensitive actions."
              checked={s.biometrics === "on"}
              onToggle={() => toggle("biometrics")}
              onClose={close}
            />
          ) : sheet === "alerts" ? (
            <ToggleSheet
              title="Security alerts"
              desc="Get notified for logins, password changes, and unusual activity."
              checked={s.securityAlerts === "on"}
              onToggle={() => toggle("securityAlerts")}
              onClose={close}
            />
          ) : sheet === "recovery" ? (
            <RecoverySheet code={s.recoveryCode} onCopy={copyRecovery} onRegen={regenRecovery} onClose={close} />
          ) : sheet === "revoke" ? (
            <RevokeSheet device={targetDevice} onRevoke={(id) => revokeDevice(id)} onClose={close} />
          ) : sheet === "trust" ? (
            <TrustSheet device={targetDevice} onSetTrusted={setTrusted} onClose={close} />
          ) : (
            <HelpSheet onClose={close} />
          )}
        </Sheet>
      )}
    </div>
  );
}

function sheetTitle(s: string) {
  switch (s) {
    case "twoFA":
      return "Two‑factor authentication";
    case "biometrics":
      return "Biometric / Passcode";
    case "alerts":
      return "Security alerts";
    case "recovery":
      return "Recovery code";
    case "revoke":
      return "Revoke session";
    case "trust":
      return "Trusted device";
    case "help":
      return "Security help";
    default:
      return "";
  }
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function Row({
  icon,
  title,
  value,
  right,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  right: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-3xl border border-gray-100 bg-white px-4 py-4 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center">{icon}</div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{value}</div>
          </div>
        </div>
        <div className="mt-2">{right}</div>
      </div>
    </button>
  );
}

function ToggleRow({
  icon,
  title,
  subtitle,
  checked,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-3xl border border-gray-100 bg-white px-4 py-4 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
              checked ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700"
            }`}
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

function TonePill({ tone, label }: { tone: "emerald" | "amber" | "red"; label: string }) {
  const base = "text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2";
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
      : tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-800"
      : "bg-red-50 border-red-100 text-red-800";
  const icon = tone === "emerald" ? <ShieldCheck className="w-4 h-4" /> : <CircleAlert className="w-4 h-4" />;
  return (
    <span className={`${base} ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

function ToggleSheet({
  title,
  desc,
  checked,
  onToggle,
  onClose,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-gray-600 mt-1">{desc}</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">Status</div>
            <div className="text-sm text-gray-500 mt-0.5">{checked ? "Enabled" : "Disabled"}</div>
          </div>
          <div className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"}`}>
            <div className={`w-5 h-5 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`mt-3 w-full h-12 rounded-2xl font-semibold ${checked ? "bg-gray-900 text-white" : "bg-white border border-gray-200 hover:bg-gray-50"}`}
        >
          {checked ? "Disable" : "Enable"}
        </button>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>Security changes may require re-login on other devices.</span>
      </div>
    </div>
  );
}

function RecoverySheet({
  code,
  onCopy,
  onRegen,
  onClose,
}: {
  code: string;
  onCopy: () => void;
  onRegen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Recovery code</div>
        <div className="text-sm text-gray-600 mt-1">Store it safely. It can help you regain access if you lose your phone.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="text-xs text-gray-500">Your code</div>
        <div className="mt-1 font-semibold text-lg tracking-wider">{code}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={onCopy} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50">
            <Copy className="w-4 h-4" /> Copy
          </button>
          <button onClick={onRegen} className="h-12 rounded-2xl text-white font-semibold bg-gray-900 inline-flex items-center justify-center gap-2">
            <Trash2 className="w-4 h-4" /> Regenerate
          </button>
        </div>
        <div className="mt-3 text-xs text-gray-500">Regenerating invalidates the previous code.</div>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function RevokeSheet({
  device,
  onRevoke,
  onClose,
}: {
  device: Device | null;
  onRevoke: (id: string) => void;
  onClose: () => void;
}) {
  if (!device) {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="font-semibold">No device selected</div>
          <div className="text-sm text-gray-600 mt-1">Select a device to revoke.</div>
        </div>
        <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
        <div className="font-semibold text-red-800">Revoke session?</div>
        <div className="text-sm text-red-700/80 mt-1">This will sign out the device immediately.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">{device.name}</div>
        <div className="text-sm text-gray-600 mt-1">
          {device.os} · {device.location}
        </div>
        <div className="text-xs text-gray-500 mt-1">Last active: {device.lastActive}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={() => onRevoke(device.id)} className="h-12 rounded-2xl bg-red-600 text-white font-semibold">
          Revoke
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <CircleAlert className="w-4 h-4 mt-0.5" />
        <span>If you don’t recognize this device, also change your password.</span>
      </div>
    </div>
  );
}

function TrustSheet({
  device,
  onSetTrusted,
  onClose,
}: {
  device: Device | null;
  onSetTrusted: (id: string, trusted: boolean) => void;
  onClose: () => void;
}) {
  if (!device) {
    return (
      <div className="space-y-3">
        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="font-semibold">No device selected</div>
          <div className="text-sm text-gray-600 mt-1">Select a device to manage trust.</div>
        </div>
        <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Device trust</div>
        <div className="text-sm text-gray-600 mt-1">Trusted devices won’t be flagged as unusual.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">{device.name}</div>
        <div className="text-sm text-gray-600 mt-1">
          {device.os} · {device.location}
        </div>
        <div className="text-xs text-gray-500 mt-1">Last active: {device.lastActive}</div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button onClick={() => onSetTrusted(device.id, true)} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
            Mark trusted
          </button>
          <button onClick={() => onSetTrusted(device.id, false)} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            Mark untrusted
          </button>
        </div>
      </div>

      {!device.isThisDevice ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-4">
          <div className="font-semibold">More actions</div>
          <button onClick={() => onSetTrusted(device.id, false)} className="mt-3 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            Require OTP next login
          </button>
        </div>
      ) : null}

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Phone className="w-4 h-4 mt-0.5" />
        <span>Production: show device fingerprint + IP for investigations.</span>
      </div>
    </div>
  );
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Security help</div>
        <div className="text-sm text-gray-600 mt-1">Quick guidance for safer tipping.</div>
      </div>

      <HelpItem icon={<KeyRound className="w-4 h-4" />} title="Use 2FA" body="Stops most account takeovers from password leaks." />
      <HelpItem icon={<Bell className="w-4 h-4" />} title="Enable alerts" body="You’ll know instantly when a new device logs in." />
      <HelpItem icon={<DeviceLaptopIcon />} title="Revoke unknown devices" body="Sign out sessions you don’t recognize." />

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>We never ask for OTP/PIN. Don’t share verification codes.</span>
      </div>
    </div>
  );
}

function HelpItem({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center">{icon}</div>
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
  mounted,
  onClose,
  children,
}: {
  title: string;
  mounted: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close overlay" />
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden transition-transform duration-200 ${
          mounted ? "translate-y-0" : "translate-y-[740px]"
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
            <div className="text-sm text-gray-500 mt-0.5">X6.2 (mock)</div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function mask(code: string) {
  if (!code) return "—";
  const last = code.slice(-4);
  return "••••-••••-" + last;
}

function nowStamp() {
  return "Today · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function BiometricIcon() {
  // Local SVG (avoids CDN icon fetch issues)
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4.5A2.5 2.5 0 0 0 4.5 7v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 4.5A2.5 2.5 0 0 1 19.5 7v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 19.5A2.5 2.5 0 0 1 4.5 17v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 19.5A2.5 2.5 0 0 0 19.5 17v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 12a3 3 0 0 1 6 0v2a3 3 0 0 1-6 0v-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function DeviceLaptopIcon() {
  // Local SVG (avoids CDN icon fetch issues)
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5V16H4V6.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M2.5 20h19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StyleBlock() {
  return (
    <style>{`
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }
      .pulse{ position: relative; }
      .pulse:after{
        content:"";
        position:absolute;
        inset:-2px;
        border-radius: 18px;
        border: 2px solid rgba(255,255,255,.35);
        opacity: 0;
        animation: pulse 1.4s infinite;
      }
      @keyframes pulse{ 0%{ transform: scale(.98); opacity:.0; } 20%{ opacity:.6; } 100%{ transform: scale(1.06); opacity:0; } }
    `}</style>
  );
}
