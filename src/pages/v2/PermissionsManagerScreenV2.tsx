import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Info, Shield, X, CheckCircle2, CircleAlert } from "lucide-react";

/**
 * Screen Code: X5.5
 * Screen Name: App Permissions Manager
 * Currency: USD
 * Roles: Customer / Guest
 * Purpose:
 *  - Central hub to manage Location / Camera / Notifications permissions
 *  - Educate before OS prompts (pre-permission UX)
 *  - Provide clear fallback actions (Open OS Settings)
 * Notes:
 *  - Canvas-safe: no framer-motion
 *  - Avoids risky lucide icons (some sandboxes fail CDN fetch for certain icons)
 */

type Perm = "location" | "camera" | "notifications";

type LocationMode = "Off" | "Approx" | "Precise";

type Status = "Not asked" | "Allowed" | "Denied";

type ChannelFreq = "Off" | "Important only" | "Normal";

type PermState = {
  location: {
    status: Status;
    mode: LocationMode;
    background: boolean; // "Always" / background access
    lastPrompt: string;
  };
  camera: {
    status: Status;
    lastPrompt: string;
  };
  notifications: {
    status: Status;
    reminders: ChannelFreq;
    receipts: ChannelFreq;
    safety: ChannelFreq;
    lastPrompt: string;
  };
};

const DEFAULTS: PermState = {
  location: {
    status: "Not asked",
    mode: "Approx",
    background: false,
    lastPrompt: "—",
  },
  camera: {
    status: "Denied",
    lastPrompt: "Dec 22 · 6:10 PM",
  },
  notifications: {
    status: "Allowed",
    reminders: "Normal",
    receipts: "Important only",
    safety: "Normal",
    lastPrompt: "Dec 18 · 9:01 AM",
  },
};

function runDevChecks() {
  try {
    console.assert(DEFAULTS.location.mode === "Approx", "default location mode");
    console.assert(["Off", "Important only", "Normal"].includes(DEFAULTS.notifications.reminders), "channel freq enum");
    console.assert(renderBadgeTone("Allowed") === "emerald", "badge tone allowed");
    console.assert(renderBadgeTone("Denied") === "amber", "badge tone denied");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function PermissionsManagerX55() {
  const [s, setS] = useState<PermState>(DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | Perm | "why" | "os">(null);
  const [mounted, setMounted] = useState(false);

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

  const health = useMemo(() => {
    // Simple scoring to drive a helpful “setup complete” feel
    let score = 0;
    if (s.location.status === "Allowed" && s.location.mode !== "Off") score += 40;
    if (s.notifications.status === "Allowed") score += 40;
    if (s.camera.status === "Allowed") score += 20;
    return score;
  }, [s.camera.status, s.location.mode, s.location.status, s.notifications.status]);

  function nowStamp() {
    return "Today · " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function open(k: NonNullable<typeof sheet>) {
    setSheet(k);
  }

  function close() {
    setMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function requestPermission(p: Perm) {
    // Mock OS prompt result based on current state
    setToast("Requesting permission… (mock)");
    window.setTimeout(() => {
      setS((prev) => {
        const next = structuredClone(prev);
        if (p === "location") {
          next.location.status = "Allowed";
          next.location.mode = next.location.mode === "Off" ? "Approx" : next.location.mode;
          next.location.lastPrompt = nowStamp();
        }
        if (p === "camera") {
          next.camera.status = "Allowed";
          next.camera.lastPrompt = nowStamp();
        }
        if (p === "notifications") {
          next.notifications.status = "Allowed";
          next.notifications.lastPrompt = nowStamp();
        }
        return next;
      });
      setToast("Updated");
    }, 700);
  }

  function denyPermission(p: Perm) {
    setS((prev) => {
      const next = structuredClone(prev);
      if (p === "location") {
        next.location.status = "Denied";
        next.location.mode = "Off";
        next.location.background = false;
        next.location.lastPrompt = nowStamp();
      }
      if (p === "camera") {
        next.camera.status = "Denied";
        next.camera.lastPrompt = nowStamp();
      }
      if (p === "notifications") {
        next.notifications.status = "Denied";
        next.notifications.reminders = "Off";
        next.notifications.receipts = "Off";
        next.notifications.safety = "Off";
        next.notifications.lastPrompt = nowStamp();
      }
      return next;
    });
    setToast("Permission denied (mock)");
  }

  function openOSSettings() {
    setToast("Opening OS Settings… (mock)");
    close();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → Settings")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X5.5 · Permissions</div>
          <button
            onClick={() => open("why")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Why"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-3">
        {/* Setup card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Permission health</span>
                </div>
                <div className="mt-1 text-2xl font-semibold">{health}%</div>
                <div className="text-sm text-gray-600 mt-1">Enable what you need — you’re always in control.</div>
              </div>
              <span
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${
                  health >= 80
                    ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                    : health >= 50
                    ? "bg-amber-50 border-amber-100 text-amber-800"
                    : "bg-red-50 border-red-100 text-red-800"
                }`}
              >
                {health >= 80 ? "Ready" : health >= 50 ? "Almost" : "Needs setup"}
              </span>
            </div>

            <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-gray-900" style={{ width: `${health}%` }} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => open("os")}
                className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                OS status
              </button>
              <button
                onClick={() => {
                  setToast("Testing notifications… (mock)");
                }}
                className="h-11 rounded-2xl text-white font-semibold bg-gray-900 pulse"
              >
                Send test
              </button>
            </div>
          </div>
        </div>

        {/* Permission rows */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold">Manage permissions</div>
            <div className="text-sm text-gray-500 mt-0.5">Tap any item for details and actions</div>
          </div>
          <div className="p-2 space-y-2">
            <PermRow
              icon={<LocationSvg />}
              title="Location"
              subtitle={
                s.location.status === "Allowed"
                  ? `${s.location.mode}${s.location.background ? " · Always" : " · While using"}`
                  : s.location.status
              }
              badge={<StatusBadge status={s.location.status} />}
              onClick={() => open("location")}
            />
            <PermRow
              icon={<CameraSvg />}
              title="Camera"
              subtitle={s.camera.status === "Allowed" ? "Enabled for QR scanning" : s.camera.status}
              badge={<StatusBadge status={s.camera.status} />}
              onClick={() => open("camera")}
            />
            <PermRow
              icon={<BellSvg />}
              title="Notifications"
              subtitle={
                s.notifications.status === "Allowed"
                  ? `Reminders: ${s.notifications.reminders}`
                  : s.notifications.status
              }
              badge={<StatusBadge status={s.notifications.status} />}
              onClick={() => open("notifications")}
            />
          </div>
        </div>

        {/* Explainers */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold">Why we ask</div>
            <div className="text-sm text-gray-500 mt-0.5">Clear reasons + privacy-by-default</div>
          </div>
          <div className="p-4 space-y-2">
            <WhyItem
              title="Location"
              body="Find nearby pros and verify you’re at the venue. Default is Approx — you can turn it off anytime."
            />
            <WhyItem title="Camera" body="Scan QR codes quickly and safely. Camera is only used when you open the scanner." />
            <WhyItem
              title="Notifications"
              body="Tip reminders and receipt confirmations. You can choose categories and quiet hours."
            />
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X5.5</div>
      </div>

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-8 z-[70] transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg inline-flex items-center gap-2">
          <span className={toast?.includes("Updated") ? "okTick" : ""}>
            <CheckCircle2 className="w-4 h-4" />
          </span>
          {toast ?? ""}
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet title={sheetTitle(sheet)} mounted={mounted} onClose={close}>
          {sheet === "why" ? (
            <WhySheet onClose={close} />
          ) : sheet === "os" ? (
            <OsSheet s={s} onClose={close} />
          ) : sheet === "location" ? (
            <LocationSheet
              value={s.location}
              onSetMode={(mode) => {
                setS((p) => ({
                  ...p,
                  location: {
                    ...p.location,
                    status: mode === "Off" ? "Denied" : "Allowed",
                    mode,
                    background: mode === "Off" ? false : p.location.background,
                    lastPrompt: nowStamp(),
                  },
                }));
                setToast("Updated");
              }}
              onToggleBackground={() => {
                setS((p) => ({
                  ...p,
                  location: {
                    ...p.location,
                    status: p.location.status === "Denied" ? "Allowed" : p.location.status,
                    mode: p.location.mode === "Off" ? "Approx" : p.location.mode,
                    background: !p.location.background,
                    lastPrompt: nowStamp(),
                  },
                }));
                setToast("Updated");
              }}
              onRequest={() => requestPermission("location")}
              onDeny={() => denyPermission("location")}
              onOpenSettings={openOSSettings}
              onClose={close}
            />
          ) : sheet === "camera" ? (
            <SimplePermSheet
              perm="Camera"
              status={s.camera.status}
              lastPrompt={s.camera.lastPrompt}
              benefits={["Fast QR scan", "Safer than typing IDs", "Used only during scan"]}
              onRequest={() => requestPermission("camera")}
              onDeny={() => denyPermission("camera")}
              onOpenSettings={openOSSettings}
              onClose={close}
            />
          ) : (
            <NotificationSheet
              value={s.notifications}
              onSet={(patch) => {
                setS((p) => ({
                  ...p,
                  notifications: {
                    ...p.notifications,
                    ...patch,
                    status: patch.status ?? p.notifications.status,
                    lastPrompt: nowStamp(),
                  },
                }));
                setToast("Updated");
              }}
              onRequest={() => requestPermission("notifications")}
              onDeny={() => denyPermission("notifications")}
              onOpenSettings={openOSSettings}
              onClose={close}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}

function sheetTitle(k: string) {
  if (k === "why") return "Why permissions";
  if (k === "os") return "OS status";
  if (k === "location") return "Location";
  if (k === "camera") return "Camera";
  if (k === "notifications") return "Notifications";
  return "";
}

function renderBadgeTone(status: Status): "emerald" | "amber" | "gray" {
  if (status === "Allowed") return "emerald";
  if (status === "Denied") return "amber";
  return "gray";
}

function StatusBadge({ status }: { status: Status }) {
  const tone = renderBadgeTone(status);
  const base = "text-xs px-2.5 py-1 rounded-full border font-semibold";
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
      : tone === "amber"
      ? "bg-amber-50 border-amber-100 text-amber-800"
      : "bg-gray-50 border-gray-200 text-gray-700";
  return <span className={`${base} ${cls}`}>{status}</span>;
}

function PermRow({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-3xl border border-gray-100 bg-white px-4 py-4 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center">{icon}</div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
        </div>
      </div>
    </button>
  );
}

function WhyItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{body}</div>
    </div>
  );
}

function WhySheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Privacy promise</div>
        <div className="text-sm text-gray-600 mt-1">
          We only request permissions that improve tipping. You can change them anytime, and the app still works with limited access.
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-2">
        <Bullet icon={<Shield className="w-4 h-4" />} text="We never sell personal data." />
        <Bullet icon={<Shield className="w-4 h-4" />} text="Camera is used only when scanning QR." />
        <Bullet icon={<Shield className="w-4 h-4" />} text="Location defaults to Approx, not Precise." />
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function OsSheet({ s, onClose }: { s: PermState; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">What the OS sees</div>
        <div className="text-sm text-gray-600 mt-1">Read-only snapshot (mock). Use “Open OS Settings” to change.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-3">
        <Line label="Location" value={`${s.location.status} · ${s.location.mode}${s.location.background ? " · Always" : ""}`} />
        <Line label="Camera" value={`${s.camera.status}`} />
        <Line label="Notifications" value={`${s.notifications.status}`} />
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function LocationSheet({
  value,
  onSetMode,
  onToggleBackground,
  onRequest,
  onDeny,
  onOpenSettings,
  onClose,
}: {
  value: PermState["location"];
  onSetMode: (m: LocationMode) => void;
  onToggleBackground: () => void;
  onRequest: () => void;
  onDeny: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Location</div>
        <div className="text-sm text-gray-600 mt-1">Improves nearby discovery and verifies venue presence for safer tips.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Status</div>
            <div className="text-sm text-gray-500 mt-0.5">Last prompt: {value.lastPrompt}</div>
          </div>
          <StatusBadge status={value.status} />
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-500">Location mode</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Choice active={value.mode === "Off"} label="Off" onClick={() => onSetMode("Off")} />
            <Choice active={value.mode === "Approx"} label="Approx" onClick={() => onSetMode("Approx")} />
            <Choice active={value.mode === "Precise"} label="Precise" onClick={() => onSetMode("Precise")} />
          </div>
          <div className="mt-2 text-xs text-gray-500">Default: Approx (recommended). Precise improves pin accuracy.</div>
        </div>

        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Allow in background</div>
              <div className="text-sm text-gray-600 mt-0.5">Optional. Helps auto-suggest tips after you leave a venue.</div>
            </div>
            <button
              onClick={onToggleBackground}
              className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${
                value.background ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"
              }`}
              aria-label="Toggle background"
            >
              <div className={`w-5 h-5 rounded-full bg-white transition ${value.background ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onRequest} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
            Request
          </button>
          <button onClick={onOpenSettings} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            Open OS Settings
          </button>
        </div>

        <button onClick={onDeny} className="mt-2 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Deny (mock)
        </button>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>If location is Off, you can still tip using QR or search by name.</span>
      </div>
    </div>
  );
}

function SimplePermSheet({
  perm,
  status,
  lastPrompt,
  benefits,
  onRequest,
  onDeny,
  onOpenSettings,
  onClose,
}: {
  perm: string;
  status: Status;
  lastPrompt: string;
  benefits: string[];
  onRequest: () => void;
  onDeny: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">{perm}</div>
        <div className="text-sm text-gray-600 mt-1">Last prompt: {lastPrompt}</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Status</div>
          <StatusBadge status={status} />
        </div>

        <div className="mt-3 rounded-3xl border border-gray-100 bg-gray-50 p-4 space-y-2">
          <div className="font-semibold">Benefits</div>
          {benefits.map((b, i) => (
            <Bullet key={i} icon={<CheckCircle2 className="w-4 h-4" />} text={b} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onRequest} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
            Request
          </button>
          <button onClick={onOpenSettings} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            Open OS Settings
          </button>
        </div>

        <button onClick={onDeny} className="mt-2 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Deny (mock)
        </button>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <CircleAlert className="w-4 h-4 mt-0.5" />
        <span>If denied, the app will prompt you to enable it when needed.</span>
      </div>
    </div>
  );
}

function NotificationSheet({
  value,
  onSet,
  onRequest,
  onDeny,
  onOpenSettings,
  onClose,
}: {
  value: PermState["notifications"];
  onSet: (p: Partial<PermState["notifications"]>) => void;
  onRequest: () => void;
  onDeny: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Notifications</div>
        <div className="text-sm text-gray-600 mt-1">Control topics and frequency. Last prompt: {value.lastPrompt}</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Status</div>
          <StatusBadge status={value.status} />
        </div>

        <div className="mt-4 space-y-2">
          <ChannelRow label="Tip reminders" value={value.reminders} onChange={(v) => onSet({ reminders: v, status: v === "Off" ? value.status : "Allowed" })} />
          <ChannelRow label="Receipt updates" value={value.receipts} onChange={(v) => onSet({ receipts: v, status: v === "Off" ? value.status : "Allowed" })} />
          <ChannelRow label="Safety alerts" value={value.safety} onChange={(v) => onSet({ safety: v, status: v === "Off" ? value.status : "Allowed" })} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onRequest} className="h-12 rounded-2xl bg-gray-900 text-white font-semibold">
            Request
          </button>
          <button onClick={onOpenSettings} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
            Open OS Settings
          </button>
        </div>

        <button onClick={onDeny} className="mt-2 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Deny (mock)
        </button>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>Production: add Quiet Hours + per-topic schedules (X5.6).</span>
      </div>
    </div>
  );
}

function ChannelRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ChannelFreq;
  onChange: (v: ChannelFreq) => void;
}) {
  const opts: ChannelFreq[] = ["Off", "Important only", "Normal"];
  return (
    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-sm text-gray-600 mt-0.5">Frequency: {value}</div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {opts.map((o) => (
            <button
              key={o}
              onClick={() => onChange(o)}
              className={`h-9 px-2 rounded-2xl text-xs font-semibold border transition ${
                o === value ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              {o === "Important only" ? "Important" : o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bullet({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-700">
      <span className="mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-gray-900 text-right">{value}</div>
    </div>
  );
}

function Choice({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-2xl border font-semibold transition ${
        active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"
      }`}
    >
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
            <div className="text-sm text-gray-500 mt-0.5">X5.5 (mock)</div>
          </div>
          <button
            onClick={onClose}
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

function LocationSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s7-4.5 7-12a7 7 0 1 0-14 0c0 7.5 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CameraSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h2l1.2-1.5h4.6L15.5 5h2A2.5 2.5 0 0 1 20 7.5V18a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18V7.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 16a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 12 16Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BellSvg() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
        border: 2px solid rgba(0,0,0,.12);
        opacity: 0;
        animation: pulse 1.4s infinite;
      }
      @keyframes pulse{ 0%{ transform: scale(.98); opacity:.0; } 20%{ opacity:.5; } 100%{ transform: scale(1.06); opacity:0; } }
    `}</style>
  );
}
