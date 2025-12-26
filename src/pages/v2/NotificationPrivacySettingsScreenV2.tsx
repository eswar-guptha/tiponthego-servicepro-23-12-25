import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Info,
  Lock,
  MapPin,
  Moon,
  Shield,
  Sliders,
  Trash2,
  X,
} from "lucide-react";

/**
 * Screen Code: X5.1
 * Screen Name: Notification & Privacy Settings
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From X2.9 Tip Reminder (Settings)
 *  - From Profile/Account (Settings)
 * Purpose:
 *  - Control Tip reminders: enable/disable, snooze rules, quiet hours
 *  - Control Location usage: nearby discovery + reminder signals
 *  - Control Data retention: delete location history, revoke share links (future)
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Uses CSS keyframes for subtle success tick
 */

type PermissionState = "granted" | "denied" | "not_set";

type LocationMode = "precise" | "approx" | "off";

type QuietPreset = "off" | "night" | "custom";

type ToggleKey =
  | "tipReminders"
  | "missedTipRecovery"
  | "nearbyDiscovery"
  | "promo"
  | "security"
  | "shareViews";

type SettingsState = {
  permission: PermissionState;
  tipReminders: boolean;
  missedTipRecovery: boolean;
  nearbyDiscovery: boolean;
  promo: boolean;
  security: boolean;
  shareViews: boolean;
  locationMode: LocationMode;
  quietPreset: QuietPreset;
  quietStart: string;
  quietEnd: string;
  retentionDays: 7 | 30 | 90;
  pauseDays: 1 | 7 | 30;
};

const DEFAULTS: SettingsState = {
  permission: "granted",
  tipReminders: true,
  missedTipRecovery: true,
  nearbyDiscovery: true,
  promo: false,
  security: true,
  shareViews: true,
  locationMode: "approx",
  quietPreset: "night",
  quietStart: "22:00",
  quietEnd: "08:00",
  retentionDays: 30,
  pauseDays: 7,
};

function runDevChecks() {
  try {
    console.assert(DEFAULTS.retentionDays === 30, "defaults ok");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function NotificationPrivacySettingsX51() {
  const [s, setS] = useState<SettingsState>(DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "permission" | "location" | "quiet" | "retention" | "pause" | "delete" | "reset">(null);
  const [sheetMounted, setSheetMounted] = useState(false);

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

  const warnings = useMemo(() => {
    const w: string[] = [];
    if (s.permission !== "granted") w.push("Notifications are not enabled at OS level.");
    if (!s.nearbyDiscovery) w.push("Nearby discovery is OFF; map results may be limited.");
    if (!s.tipReminders && s.missedTipRecovery) w.push("Missed Tip Recovery needs Tip reminders enabled.");
    if (s.locationMode === "off" && (s.nearbyDiscovery || s.missedTipRecovery)) w.push("Location is OFF; reminders may be inaccurate.");
    return w;
  }, [s]);

  function closeSheet() {
    setSheetMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function openSheet(kind: NonNullable<typeof sheet>) {
    setSheet(kind);
  }

  function toggle(key: ToggleKey) {
    setS((prev) => {
      const next = { ...prev, [key]: !prev[key] } as SettingsState;
      // Dependencies
      if (key === "tipReminders" && !next.tipReminders) {
        next.missedTipRecovery = false;
      }
      if (key === "missedTipRecovery" && next.missedTipRecovery) {
        next.tipReminders = true;
      }
      if (key === "nearbyDiscovery" && !next.nearbyDiscovery) {
        // keep location mode unchanged; user may still need location for other features
      }
      return next;
    });
    setToast("Saved");
  }

  function requestPermissionMock() {
    // Mock OS dialog
    setToast("Requesting permission…");
    window.setTimeout(() => {
      setS((p) => ({ ...p, permission: "granted" }));
      setToast("Permission granted");
    }, 700);
  }

  function setLocationMode(mode: LocationMode) {
    setS((p) => {
      const next = { ...p, locationMode: mode };
      if (mode === "off") {
        next.nearbyDiscovery = false;
        next.missedTipRecovery = false;
      }
      return next;
    });
    setToast("Updated");
    closeSheet();
  }

  function setQuietPreset(preset: QuietPreset) {
    setS((p) => {
      const next = { ...p, quietPreset: preset };
      if (preset === "night") {
        next.quietStart = "22:00";
        next.quietEnd = "08:00";
      }
      return next;
    });
  }

  function applyQuiet() {
    setToast("Quiet hours saved");
    closeSheet();
  }

  function applyRetention(days: 7 | 30 | 90) {
    setS((p) => ({ ...p, retentionDays: days }));
    setToast("Retention updated");
    closeSheet();
  }

  function applyPause(days: 1 | 7 | 30) {
    setS((p) => ({ ...p, pauseDays: days }));
    setToast(`Reminders paused ${days}d`);
    closeSheet();
  }

  function deleteLocationHistory() {
    setToast("Deleting location history…");
    window.setTimeout(() => {
      setToast("Location history deleted (mock)");
      closeSheet();
    }, 650);
  }

  function resetAll() {
    setS(DEFAULTS);
    setToast("Reset to defaults");
    closeSheet();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X2.9")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X5.1 · Settings</div>
          <button
            onClick={() => openSheet("reset")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Reset"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3">
        {/* OS permission banner */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4 text-white">
          <div className="text-xs text-white/80 inline-flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold">Permission: {labelPerm(s.permission)}</div>
              <div className="text-sm text-white/85 mt-1">Control missed tip recovery and updates.</div>
            </div>
            <PermBadge perm={s.permission} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => openSheet("permission")}
              className="h-11 rounded-2xl bg-white border border-gray-200 text-blue-700 font-semibold inline-flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              Manage
            </button>
            <button
              onClick={requestPermissionMock}
              className={`h-11 rounded-2xl text-white font-semibold inline-flex items-center justify-center gap-2 ${
                s.permission === "granted" ? "bg-white/10 border border-white/15" : "bg-gradient-to-r from-blue-600 to-green-500"
              }`}
            >
              {s.permission === "granted" ? "Enabled" : "Request"}
            </button>
          </div>

          {warnings.length > 0 && (
            <div className="mt-3 space-y-2">
              {warnings.slice(0, 2).map((w, i) => (
                <div key={i} className="rounded-2xl bg-white/10 border border-white/15 p-3 text-xs text-white/85 inline-flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reminders */}
        <Section title="Reminders" icon={<Bell className="w-4 h-4" />} subtitle="Controls for Tip reminders and recovery.">
          <ToggleRow
            title="Tip reminders"
            subtitle="Enable reminders for nearby interactions"
            checked={s.tipReminders}
            onChange={() => toggle("tipReminders")}
          />
          <ToggleRow
            title="Missed Tip Recovery"
            subtitle="Show quick-tip cards after encounters"
            checked={s.missedTipRecovery}
            onChange={() => toggle("missedTipRecovery")}
            disabled={!s.tipReminders}
          />

          <RowLink
            title="Pause reminders"
            subtitle={`Pause all reminders for ${s.pauseDays} days`}
            icon={<Clock className="w-4 h-4" />}
            onClick={() => openSheet("pause")}
          />

          <RowLink
            title="Quiet hours"
            subtitle={quietSummary(s)}
            icon={<Moon className="w-4 h-4" />}
            onClick={() => openSheet("quiet")}
          />
        </Section>

        {/* Discovery & Location */}
        <Section title="Discovery & Location" icon={<MapPin className="w-4 h-4" />} subtitle="Location improves map discovery and reminder accuracy.">
          <ToggleRow
            title="Nearby discovery"
            subtitle="Show pros near your location"
            checked={s.nearbyDiscovery}
            onChange={() => toggle("nearbyDiscovery")}
            disabled={s.locationMode === "off"}
          />

          <RowLink
            title="Location mode"
            subtitle={locationSummary(s.locationMode)}
            icon={<Lock className="w-4 h-4" />}
            onClick={() => openSheet("location")}
          />

          <RowLink
            title="Delete location history"
            subtitle="Remove stored coarse history used for reminders"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => openSheet("delete")}
            danger
          />
        </Section>

        {/* Privacy & Security */}
        <Section title="Privacy & Security" icon={<Shield className="w-4 h-4" />} subtitle="Reduce risk and control what you share.">
          <ToggleRow
            title="Security alerts"
            subtitle="Get notified for suspicious activity"
            checked={s.security}
            onChange={() => toggle("security")}
          />
          <ToggleRow
            title="Receipt link views"
            subtitle="Notify when a share link is opened"
            checked={s.shareViews}
            onChange={() => toggle("shareViews")}
          />
          <ToggleRow
            title="Promotional messages"
            subtitle="Occasional updates and offers"
            checked={s.promo}
            onChange={() => toggle("promo")}
          />

          <RowLink
            title="Data retention"
            subtitle={`Keep location signals for ${s.retentionDays} days`}
            icon={<Shield className="w-4 h-4" />}
            onClick={() => openSheet("retention")}
          />

          <div className="mt-2 text-xs text-gray-500 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5" />
            <span>Defaults follow privacy-first: approximate location + short retention. Production must comply with policy.</span>
          </div>
        </Section>

        {/* Footer quick links */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <RowLink
            title="Learn about reminders"
            subtitle="How we detect encounters"
            icon={<Info className="w-4 h-4" />}
            onClick={() => alert("Open FAQ (mock)")}
          />
          <Divider />
          <RowLink
            title="Privacy policy"
            subtitle="Read how data is handled"
            icon={<Shield className="w-4 h-4" />}
            onClick={() => alert("Open policy (mock)")}
          />
        </div>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Quick control</div>
              <div className="text-xs text-white/75">Pause reminders without disabling discovery.</div>
            </div>
            <button
              onClick={() => openSheet("pause")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Pause
            </button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet title={sheetTitle(sheet)} mounted={sheetMounted} onClose={closeSheet}>
          {sheet === "permission" && (
            <PermissionSheet perm={s.permission} onRequest={requestPermissionMock} onSet={(p) => setS((x) => ({ ...x, permission: p }))} onClose={closeSheet} />
          )}

          {sheet === "location" && (
            <LocationSheet value={s.locationMode} onPick={setLocationMode} onClose={closeSheet} />
          )}

          {sheet === "quiet" && (
            <QuietSheet
              preset={s.quietPreset}
              start={s.quietStart}
              end={s.quietEnd}
              onPreset={setQuietPreset}
              onStart={(v) => setS((p) => ({ ...p, quietStart: v, quietPreset: "custom" }))}
              onEnd={(v) => setS((p) => ({ ...p, quietEnd: v, quietPreset: "custom" }))}
              onApply={applyQuiet}
              onClose={closeSheet}
            />
          )}

          {sheet === "retention" && (
            <RetentionSheet value={s.retentionDays} onPick={applyRetention} onClose={closeSheet} />
          )}

          {sheet === "pause" && (
            <PauseSheet value={s.pauseDays} onPick={applyPause} onClose={closeSheet} />
          )}

          {sheet === "delete" && <DeleteLocationSheet onDelete={deleteLocationHistory} onClose={closeSheet} />}

          {sheet === "reset" && <ResetSheet onReset={resetAll} onClose={closeSheet} />}
        </Sheet>
      )}

      {/* Toast */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[70] transition-all duration-200 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
        aria-live="polite"
      >
        <div className="px-4 py-2 rounded-full bg-black/75 text-white text-sm shadow-lg inline-flex items-center gap-2">
          <span className={toast?.includes("Saved") || toast?.includes("Updated") || toast?.includes("granted") ? "okTick" : ""}>
            <Check className="w-4 h-4" />
          </span>
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function sheetTitle(s: "permission" | "location" | "quiet" | "retention" | "pause" | "delete" | "reset") {
  if (s === "permission") return "Notification permission";
  if (s === "location") return "Location mode";
  if (s === "quiet") return "Quiet hours";
  if (s === "retention") return "Data retention";
  if (s === "pause") return "Pause reminders";
  if (s === "delete") return "Delete location history";
  return "Reset settings";
}

function labelPerm(p: PermissionState) {
  if (p === "granted") return "Enabled";
  if (p === "denied") return "Denied";
  return "Not set";
}

function quietSummary(s: SettingsState) {
  if (s.quietPreset === "off") return "Off";
  return `${s.quietStart}–${s.quietEnd}` + (s.quietPreset === "night" ? " (Night)" : " (Custom)");
}

function locationSummary(m: LocationMode) {
  if (m === "precise") return "Precise";
  if (m === "approx") return "Approximate";
  return "Off";
}

function PermBadge({ perm }: { perm: PermissionState }) {
  const base = "text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2";
  const cls =
    perm === "granted"
      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
      : perm === "denied"
      ? "bg-amber-50 border-amber-100 text-amber-800"
      : "bg-gray-50 border-gray-200 text-gray-700";
  const icon = perm === "granted" ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />;
  return <span className={`${base} ${cls}`}>{icon} {labelPerm(perm)}</span>;
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
          </div>
        </div>
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gray-100" />;
}

function RowLink({
  title,
  subtitle,
  icon,
  onClick,
  danger,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-3 rounded-3xl hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${danger ? "bg-amber-50 border-amber-100" : "bg-white border-gray-200"}`}>
            {icon}
          </div>
          <div>
            <div className={`font-semibold ${danger ? "text-amber-900" : "text-gray-900"}`}>{title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 mt-4" />
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
      className={`w-full text-left px-3 py-3 rounded-3xl transition ${disabled ? "opacity-60" : "hover:bg-gray-50"}`}
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

function PermissionSheet({
  perm,
  onRequest,
  onSet,
  onClose,
}: {
  perm: PermissionState;
  onRequest: () => void;
  onSet: (p: PermissionState) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">OS permission</div>
        <div className="text-sm text-gray-500 mt-1">In production, this links to system settings.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 p-4">
        <div className="font-semibold">Current</div>
        <div className="text-sm text-gray-600 mt-1">{labelPerm(perm)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onRequest}
          className="h-12 rounded-2xl text-white font-semibold bg-gradient-to-r from-blue-600 to-green-500"
        >
          Request
        </button>
        <button
          onClick={() => {
            onSet("denied");
            onClose();
          }}
          className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
        >
          Simulate Deny
        </button>
      </div>

      <button
        onClick={() => {
          onSet("granted");
          onClose();
        }}
        className="w-full h-12 rounded-2xl bg-gray-900 text-white font-semibold"
      >
        Simulate Granted
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Bell className="w-4 h-4 mt-0.5" />
        <span>Best practice: show soft prompt before OS prompt.</span>
      </div>
    </div>
  );
}

function LocationSheet({ value, onPick, onClose }: { value: LocationMode; onPick: (m: LocationMode) => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Location usage</div>
        <div className="text-sm text-gray-500 mt-1">Choose the minimal access you’re comfortable with.</div>
      </div>

      <Choice
        title="Approximate"
        subtitle="Best default — enables discovery and reminders"
        active={value === "approx"}
        icon={<MapPin className="w-4 h-4" />}
        onClick={() => onPick("approx")}
      />
      <Choice
        title="Precise"
        subtitle="More accurate map + clusters"
        active={value === "precise"}
        icon={<MapPin className="w-4 h-4" />}
        onClick={() => onPick("precise")}
      />
      <Choice
        title="Off"
        subtitle="Disables discovery and missed-tip recovery"
        active={value === "off"}
        icon={<Lock className="w-4 h-4" />}
        onClick={() => onPick("off")}
      />

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>Production should provide consent text and retention details.</span>
      </div>
    </div>
  );
}

function QuietSheet({
  preset,
  start,
  end,
  onPreset,
  onStart,
  onEnd,
  onApply,
  onClose,
}: {
  preset: QuietPreset;
  start: string;
  end: string;
  onPreset: (p: QuietPreset) => void;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Quiet hours</div>
        <div className="text-sm text-gray-500 mt-1">Mute reminders during the selected window.</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Pill active={preset === "off"} label="Off" onClick={() => onPreset("off")} />
        <Pill active={preset === "night"} label="Night" onClick={() => onPreset("night")} />
        <Pill active={preset === "custom"} label="Custom" onClick={() => onPreset("custom")} />
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Time</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Start</div>
            <input type="time" value={start} onChange={(e) => onStart(e.target.value)} className="mt-1 w-full outline-none" />
          </div>
          <div className="rounded-2xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">End</div>
            <input type="time" value={end} onChange={(e) => onEnd(e.target.value)} className="mt-1 w-full outline-none" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">Tip: Night preset uses 22:00–08:00</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={onApply} className="h-12 rounded-2xl text-white font-semibold bg-gray-900">
          Save
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Moon className="w-4 h-4 mt-0.5" />
        <span>Production: handle timezone + DST. Store in local time.</span>
      </div>
    </div>
  );
}

function RetentionSheet({ value, onPick, onClose }: { value: 7 | 30 | 90; onPick: (d: 7 | 30 | 90) => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Data retention</div>
        <div className="text-sm text-gray-500 mt-1">How long we keep location signals for reminders.</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Pill active={value === 7} label="7 days" onClick={() => onPick(7)} />
        <Pill active={value === 30} label="30 days" onClick={() => onPick(30)} />
        <Pill active={value === 90} label="90 days" onClick={() => onPick(90)} />
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>Best practice: default to shortest and justify longer retention.</span>
      </div>
    </div>
  );
}

function PauseSheet({ value, onPick, onClose }: { value: 1 | 7 | 30; onPick: (d: 1 | 7 | 30) => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Pause reminders</div>
        <div className="text-sm text-gray-500 mt-1">Temporarily mute all reminder notifications.</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Pill active={value === 1} label="1 day" onClick={() => onPick(1)} />
        <Pill active={value === 7} label="7 days" onClick={() => onPick(7)} />
        <Pill active={value === 30} label="30 days" onClick={() => onPick(30)} />
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Clock className="w-4 h-4 mt-0.5" />
        <span>Production should show the exact resume date/time.</span>
      </div>
    </div>
  );
}

function DeleteLocationSheet({ onDelete, onClose }: { onDelete: () => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
        <div className="font-semibold">Delete location history?</div>
        <div className="text-sm text-amber-800 mt-1">This removes stored coarse location used for reminder signals.</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={onDelete} className="h-12 rounded-2xl text-white font-semibold bg-gray-900">
          Delete
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Trash2 className="w-4 h-4 mt-0.5" />
        <span>Production: deletion should be immediate and auditable.</span>
      </div>
    </div>
  );
}

function ResetSheet({ onReset, onClose }: { onReset: () => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Reset settings</div>
        <div className="text-sm text-gray-500 mt-1">Restore recommended defaults.</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Not now
        </button>
        <button onClick={onReset} className="h-12 rounded-2xl text-white font-semibold bg-gray-900">
          Reset
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>Production should show what changes before resetting.</span>
      </div>
    </div>
  );
}

function Choice({
  title,
  subtitle,
  active,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  active: boolean;
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
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
          </div>
        </div>
        {active ? (
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-600 text-white font-semibold inline-flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Active
          </span>
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 mt-4" />
        )}
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
          mounted ? "translate-y-0" : "translate-y-[560px]"
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
            <div className="text-sm text-gray-500 mt-0.5">X5.1 (mock)</div>
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
      .okTick{
        display:inline-flex;
        animation: okPop .22s ease-out;
      }
      @keyframes okPop{
        0%{ transform: scale(.92); opacity:.6; }
        100%{ transform: scale(1); opacity:1; }
      }
    `}</style>
  );
}
