import React, { useEffect, useMemo, useState } from "react";

/**
 * Screen Code: X5.6
 * Screen Name: Quiet Hours + Tip Reminder Rules
 * Currency: USD
 * Roles: Customer / Guest
 * Purpose:
 *  - Let users control reminder timing (quiet hours), frequency, and smart triggers
 *  - Reduce annoyance while improving missed-tip recovery
 * Notes:
 *  - Canvas-safe: no framer-motion
 *  - Uses inline SVG icons (avoids icon CDN fetch issues)
 */

type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

type FreqCap = "Once per visit" | "Daily max 2" | "Daily max 3";

type SmartTrigger = "After leaving venue" | "Same day" | "Next morning";

type State = {
  remindersEnabled: boolean;
  smartReminders: boolean;
  receiptConfirmations: boolean;
  safetyAlerts: boolean;

  quietEnabled: boolean;
  quietStart: string; // HH:MM
  quietEnd: string; // HH:MM
  quietDays: DayKey[];

  trigger: SmartTrigger;
  sameDayTime: string; // HH:MM
  nextMorningTime: string; // HH:MM

  cap: FreqCap;
  minGapMinutes: number;
  coolDownHours: number;
  geoRequired: boolean;

  lastTest: string;
};

const DEFAULTS: State = {
  remindersEnabled: true,
  smartReminders: true,
  receiptConfirmations: true,
  safetyAlerts: true,

  quietEnabled: true,
  quietStart: "22:00",
  quietEnd: "08:00",
  quietDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

  trigger: "After leaving venue",
  sameDayTime: "18:00",
  nextMorningTime: "09:00",

  cap: "Daily max 2",
  minGapMinutes: 90,
  coolDownHours: 12,
  geoRequired: true,

  lastTest: "—",
};

function runDevChecks() {
  try {
    console.assert(isHHMM("00:00") && isHHMM("23:59"), "valid hh:mm");
    console.assert(!isHHMM("24:00") && !isHHMM("9:00"), "invalid hh:mm");
    console.assert(formatTimeLabel("22:00") === "10:00 PM", "format 22:00");
    console.assert(nextPreview({ ...DEFAULTS, trigger: "Same day" }).includes("Today"), "preview same day");
    console.assert(nextPreview({ ...DEFAULTS, trigger: "Next morning" }).includes("Tomorrow"), "preview next morning");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function QuietHoursTipRulesX56() {
  const [s, setS] = useState<State>(DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "quiet" | "trigger" | "cap" | "advanced" | "help">(null);
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

  const quietSummary = useMemo(() => {
    if (!s.quietEnabled) return "Off";
    const days = s.quietDays.length === 7 ? "Every day" : s.quietDays.join(", ");
    return `${formatTimeLabel(s.quietStart)} – ${formatTimeLabel(s.quietEnd)} · ${days}`;
  }, [s.quietDays, s.quietEnabled, s.quietEnd, s.quietStart]);

  const rulesSummary = useMemo(() => {
    if (!s.remindersEnabled) return "Disabled";
    const t =
      s.trigger === "After leaving venue"
        ? "After leaving venue"
        : s.trigger === "Same day"
        ? `Same day · ${formatTimeLabel(s.sameDayTime)}`
        : `Next morning · ${formatTimeLabel(s.nextMorningTime)}`;
    const geo = s.geoRequired ? "Geo-verified" : "No geo";
    return `${t} · ${s.cap} · ${geo}`;
  }, [s.cap, s.geoRequired, s.nextMorningTime, s.remindersEnabled, s.sameDayTime, s.trigger]);

  const preview = useMemo(() => nextPreview(s), [s]);

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

  function toggle<K extends keyof State>(key: K) {
    setS((p) => ({ ...p, [key]: !p[key] } as State));
    setToast("Updated");
  }

  function setVal<K extends keyof State>(key: K, value: State[K]) {
    setS((p) => ({ ...p, [key]: value }));
    setToast("Updated");
  }

  function sendTest() {
    const when = nowStamp();
    setVal("lastTest", when);
    setToast("Test notification sent (mock)");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X5.5")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <IconBack />
          </button>
          <div className="text-white font-semibold">X5.6 · Quiet Hours</div>
          <button
            onClick={() => open("help")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Help"
          >
            <IconInfo />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-3">
        {/* Hero */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                  <IconBell />
                  <span>Tip reminders</span>
                </div>
                <div className="mt-1 text-2xl font-semibold">Rules & quiet hours</div>
                <div className="text-sm text-gray-600 mt-1">Keep reminders helpful — never spammy.</div>
              </div>
              <Pill tone={s.remindersEnabled ? "emerald" : "gray"} label={s.remindersEnabled ? "On" : "Off"} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => toggle("remindersEnabled")}
                className={`h-11 rounded-2xl font-semibold border transition ${
                  s.remindersEnabled ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                {s.remindersEnabled ? "Disable" : "Enable"}
              </button>
              <button onClick={sendTest} className="h-11 rounded-2xl text-white font-semibold bg-gray-900 pulse">
                Send test
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500">Last test: {s.lastTest}</div>
          </div>
        </div>

        {/* Quick toggles */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold">Notification toggles</div>
            <div className="text-sm text-gray-500 mt-0.5">Control what you receive</div>
          </div>
          <div className="p-2 space-y-2">
            <ToggleRow
              icon={<IconSpark />}
              title="Smart reminders"
              subtitle="Suggest tips when you leave a venue"
              checked={s.smartReminders}
              onClick={() => toggle("smartReminders")}
              disabled={!s.remindersEnabled}
            />
            <ToggleRow
              icon={<IconReceipt />}
              title="Receipt confirmations"
              subtitle="Get receipt + status updates"
              checked={s.receiptConfirmations}
              onClick={() => toggle("receiptConfirmations")}
            />
            <ToggleRow
              icon={<IconShield />}
              title="Safety alerts"
              subtitle="Suspicious activity & account warnings"
              checked={s.safetyAlerts}
              onClick={() => toggle("safetyAlerts")}
            />
          </div>
        </div>

        {/* Quiet hours */}
        <CardRow
          title="Quiet hours"
          subtitle={quietSummary}
          leftIcon={<IconMoon />}
          right={<IconChevron />}
          onClick={() => open("quiet")}
        />

        {/* Rules */}
        <CardRow
          title="Reminder rules"
          subtitle={rulesSummary}
          leftIcon={<IconRule />}
          right={<IconChevron />}
          onClick={() => open("trigger")}
        />

        {/* Preview */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold">Preview</div>
            <div className="text-sm text-gray-500 mt-0.5">How it will behave (example)</div>
          </div>
          <div className="p-4">
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center">
                  <IconBell />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">Don’t forget your tip</div>
                  <div className="text-sm text-gray-600 mt-0.5">You visited “Cafe Aura”. Want to tip Alex?</div>
                  <div className="text-xs text-gray-500 mt-2">{preview}</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setToast("Snoozed 1 hour (mock)")}
                  className="h-11 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
                >
                  Snooze
                </button>
                <button
                  onClick={() => setToast("Open tip flow (mock) → X2.10")}
                  className="h-11 rounded-2xl bg-gray-900 text-white font-semibold"
                >
                  Tip now
                </button>
              </div>
            </div>

            <button
              onClick={() => open("advanced")}
              className="mt-3 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Advanced controls
            </button>

            <button
              onClick={() => open("cap")}
              className="mt-2 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
            >
              Frequency & caps
            </button>

            <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
              <IconInfoSmall />
              <span>Production: show “Quiet hours active” banner when current time is within the window.</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X5.6</div>
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
            <IconCheck />
          </span>
          {toast ?? ""}
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet title={sheetTitle(sheet)} mounted={mounted} onClose={close}>
          {sheet === "quiet" ? (
            <QuietSheet
              quietEnabled={s.quietEnabled}
              start={s.quietStart}
              end={s.quietEnd}
              days={s.quietDays}
              onToggle={() => toggle("quietEnabled")}
              onSetStart={(v) => setVal("quietStart", v)}
              onSetEnd={(v) => setVal("quietEnd", v)}
              onToggleDay={(d) => {
                setS((p) => {
                  const has = p.quietDays.includes(d);
                  const nextDays = has ? p.quietDays.filter((x) => x !== d) : [...p.quietDays, d];
                  return { ...p, quietDays: nextDays };
                });
                setToast("Updated");
              }}
              onClose={close}
            />
          ) : sheet === "trigger" ? (
            <TriggerSheet
              enabled={s.remindersEnabled}
              smart={s.smartReminders}
              trigger={s.trigger}
              sameDayTime={s.sameDayTime}
              nextMorningTime={s.nextMorningTime}
              geoRequired={s.geoRequired}
              onSetTrigger={(t) => setVal("trigger", t)}
              onSetSameDay={(t) => setVal("sameDayTime", t)}
              onSetNextMorning={(t) => setVal("nextMorningTime", t)}
              onToggleGeo={() => toggle("geoRequired")}
              onClose={close}
            />
          ) : sheet === "cap" ? (
            <CapSheet cap={s.cap} minGapMinutes={s.minGapMinutes} onSetCap={(c) => setVal("cap", c)} onSetMinGap={(n) => setVal("minGapMinutes", n)} onClose={close} />
          ) : sheet === "advanced" ? (
            <AdvancedSheet coolDownHours={s.coolDownHours} onSetCoolDown={(n) => setVal("coolDownHours", n)} onClose={close} />
          ) : (
            <HelpSheet onClose={close} />
          )}
        </Sheet>
      )}
    </div>
  );
}

function sheetTitle(k: string) {
  switch (k) {
    case "quiet":
      return "Quiet hours";
    case "trigger":
      return "Reminder rules";
    case "cap":
      return "Frequency & caps";
    case "advanced":
      return "Advanced";
    case "help":
      return "Help";
    default:
      return "";
  }
}

function isHHMM(v: string) {
  if (!/^\d{2}:\d{2}$/.test(v)) return false;
  const [h, m] = v.split(":").map((x) => Number(x));
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function formatTimeLabel(hhmm: string) {
  if (!isHHMM(hhmm)) return "—";
  const [h, m] = hhmm.split(":").map((x) => Number(x));
  const d = new Date();
  d.setHours(h);
  d.setMinutes(m);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nextPreview(s: State) {
  if (!s.remindersEnabled) return "Reminders are disabled.";
  if (s.quietEnabled && s.quietDays.length > 0) {
    // just a friendly hint; not a strict scheduler
    return `Next reminder: ${nextPreviewCore(s)} (respects quiet hours)`;
  }
  return `Next reminder: ${nextPreviewCore(s)}`;
}

function nextPreviewCore(s: State) {
  if (s.trigger === "After leaving venue") return "~10 minutes after leaving the venue";
  if (s.trigger === "Same day") return `Today at ${formatTimeLabel(s.sameDayTime)}`;
  return `Tomorrow at ${formatTimeLabel(s.nextMorningTime)}`;
}

function nextPreviewForTest(s: State) {
  // kept for tests only
  return nextPreview(s);
}

function CardRow({
  title,
  subtitle,
  leftIcon,
  right,
  onClick,
}: {
  title: string;
  subtitle: string;
  leftIcon: React.ReactNode;
  right: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-3xl shadow-sm border border-gray-100 p-4 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center">{leftIcon}</div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
          </div>
        </div>
        <div className="mt-2 text-gray-400">{right}</div>
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
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => {
        if (!disabled) onClick();
      }}
      className={`w-full text-left rounded-3xl border px-4 py-4 transition ${
        disabled ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-100 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${checked ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-gray-200 text-gray-700"}`}>
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

function Pill({ tone, label }: { tone: "emerald" | "gray"; label: string }) {
  const cls =
    tone === "emerald" ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-gray-50 border-gray-200 text-gray-700";
  return <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${cls}`}>{label}</span>;
}

function QuietSheet({
  quietEnabled,
  start,
  end,
  days,
  onToggle,
  onSetStart,
  onSetEnd,
  onToggleDay,
  onClose,
}: {
  quietEnabled: boolean;
  start: string;
  end: string;
  days: DayKey[];
  onToggle: () => void;
  onSetStart: (v: string) => void;
  onSetEnd: (v: string) => void;
  onToggleDay: (d: DayKey) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Quiet hours</div>
        <div className="text-sm text-gray-600 mt-1">During quiet hours, tip reminders are paused. Safety alerts can still come through.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold">Enable quiet hours</div>
            <div className="text-sm text-gray-500 mt-0.5">Recommended</div>
          </div>
          <button
            onClick={onToggle}
            className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${quietEnabled ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}
            aria-label="Toggle quiet hours"
          >
            <div className={`w-5 h-5 rounded-full bg-white transition ${quietEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <TimeSelect label="Start" value={start} onChange={onSetStart} disabled={!quietEnabled} />
          <TimeSelect label="End" value={end} onChange={onSetEnd} disabled={!quietEnabled} />
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-500">Days</div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {DAYS.map((d) => {
              const active = days.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => onToggleDay(d)}
                  disabled={!quietEnabled}
                  className={`h-10 rounded-2xl text-xs font-semibold border transition ${
                    !quietEnabled
                      ? "bg-gray-50 border-gray-100 text-gray-400"
                      : active
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {d[0]}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">Tip: If your quiet hours cross midnight (e.g., 10 PM → 8 AM), that’s supported.</div>
        </div>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function TriggerSheet({
  enabled,
  smart,
  trigger,
  sameDayTime,
  nextMorningTime,
  geoRequired,
  onSetTrigger,
  onSetSameDay,
  onSetNextMorning,
  onToggleGeo,
  onClose,
}: {
  enabled: boolean;
  smart: boolean;
  trigger: SmartTrigger;
  sameDayTime: string;
  nextMorningTime: string;
  geoRequired: boolean;
  onSetTrigger: (t: SmartTrigger) => void;
  onSetSameDay: (t: string) => void;
  onSetNextMorning: (t: string) => void;
  onToggleGeo: () => void;
  onClose: () => void;
}) {
  const disabled = !enabled;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Reminder rules</div>
        <div className="text-sm text-gray-600 mt-1">Choose when a reminder should fire after a visit.</div>
      </div>

      <div className={`rounded-3xl border p-4 ${disabled ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-100"}`}>
        <div className="font-semibold">Trigger</div>
        <div className="text-sm text-gray-500 mt-0.5">Smart reminders must be enabled for “After leaving venue”.</div>

        <div className="mt-3 space-y-2">
          <RadioRow
            title="After leaving venue"
            subtitle="~10 minutes after you exit (best for missed tips)"
            active={trigger === "After leaving venue"}
            onClick={() => {
              if (disabled) return;
              if (!smart) return;
              onSetTrigger("After leaving venue");
            }}
            locked={!smart}
          />
          <RadioRow
            title="Same day"
            subtitle={`Send at ${formatTimeLabel(sameDayTime)}`}
            active={trigger === "Same day"}
            onClick={() => {
              if (disabled) return;
              onSetTrigger("Same day");
            }}
          />
          {trigger === "Same day" ? (
            <div className="mt-2">
              <TimeSelect label="Time" value={sameDayTime} onChange={onSetSameDay} disabled={disabled} />
            </div>
          ) : null}

          <RadioRow
            title="Next morning"
            subtitle={`Send at ${formatTimeLabel(nextMorningTime)}`}
            active={trigger === "Next morning"}
            onClick={() => {
              if (disabled) return;
              onSetTrigger("Next morning");
            }}
          />
          {trigger === "Next morning" ? (
            <div className="mt-2">
              <TimeSelect label="Time" value={nextMorningTime} onChange={onSetNextMorning} disabled={disabled} />
            </div>
          ) : null}
        </div>

        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">Require geo-verification</div>
              <div className="text-sm text-gray-600 mt-0.5">Only remind if we detected a real venue visit.</div>
            </div>
            <button
              onClick={() => {
                if (!disabled) onToggleGeo();
              }}
              className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${geoRequired ? "bg-gray-900 border-gray-900" : "bg-white border-gray-200"}`}
              aria-label="Toggle geo"
            >
              <div className={`w-5 h-5 rounded-full bg-white transition ${geoRequired ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">Recommended ON to prevent false reminders.</div>
        </div>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      {!enabled ? (
        <div className="text-xs text-gray-500 flex items-start gap-2">
          <IconWarn />
          <span>Enable Tip reminders to edit rules.</span>
        </div>
      ) : null}
    </div>
  );
}

function CapSheet({
  cap,
  minGapMinutes,
  onSetCap,
  onSetMinGap,
  onClose,
}: {
  cap: FreqCap;
  minGapMinutes: number;
  onSetCap: (c: FreqCap) => void;
  onSetMinGap: (n: number) => void;
  onClose: () => void;
}) {
  const caps: FreqCap[] = ["Once per visit", "Daily max 2", "Daily max 3"];

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Frequency & caps</div>
        <div className="text-sm text-gray-600 mt-1">Keep it respectful: choose how often reminders can be sent.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Daily cap</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {caps.map((c) => (
            <button
              key={c}
              onClick={() => onSetCap(c)}
              className={`h-11 rounded-2xl border font-semibold transition ${c === cap ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
            >
              {c === "Once per visit" ? "Visit" : c.replace("Daily ", "")}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="font-semibold">Minimum gap</div>
          <div className="text-sm text-gray-600 mt-0.5">At least {minGapMinutes} minutes between reminders.</div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => onSetMinGap(Math.max(30, minGapMinutes - 15))}
              className="w-11 h-11 rounded-2xl border border-gray-200 bg-white font-semibold hover:bg-gray-50"
            >
              −
            </button>
            <div className="flex-1 h-11 rounded-2xl border border-gray-200 bg-white px-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Gap</span>
              <span className="font-semibold">{minGapMinutes}m</span>
            </div>
            <button
              onClick={() => onSetMinGap(Math.min(240, minGapMinutes + 15))}
              className="w-11 h-11 rounded-2xl border border-gray-200 bg-white font-semibold hover:bg-gray-50"
            >
              +
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-500">Range: 30–240 minutes.</div>
        </div>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function AdvancedSheet({ coolDownHours, onSetCoolDown, onClose }: { coolDownHours: number; onSetCoolDown: (n: number) => void; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Advanced</div>
        <div className="text-sm text-gray-600 mt-1">Extra guardrails that reduce annoyance.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Cool down after tipping</div>
        <div className="text-sm text-gray-600 mt-0.5">Pause reminders for {coolDownHours} hours after you tip.</div>
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onSetCoolDown(Math.max(1, coolDownHours - 1))}
            className="w-11 h-11 rounded-2xl border border-gray-200 bg-white font-semibold hover:bg-gray-50"
          >
            −
          </button>
          <div className="flex-1 h-11 rounded-2xl border border-gray-200 bg-white px-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">Cooldown</span>
            <span className="font-semibold">{coolDownHours}h</span>
          </div>
          <button
            onClick={() => onSetCoolDown(Math.min(72, coolDownHours + 1))}
            className="w-11 h-11 rounded-2xl border border-gray-200 bg-white font-semibold hover:bg-gray-50"
          >
            +
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">Range: 1–72 hours.</div>

        <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
          <div className="font-semibold">Recommended defaults</div>
          <div className="mt-2 space-y-2">
            <MiniCard title="Gentle" body="Daily max 2 · 90m gap · 12h cooldown" />
            <MiniCard title="Strict" body="Once per visit · 120m gap · 24h cooldown" />
          </div>
        </div>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <IconInfoSmall />
        <span>Production: add per-venue allowlist/denylist (favorite places).</span>
      </div>
    </div>
  );
}

function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">How this works</div>
        <div className="text-sm text-gray-600 mt-1">We try to remind you only when it’s likely you meant to tip.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-2">
        <HelpBullet title="Quiet hours" body="We pause reminders at night or during your selected window." />
        <HelpBullet title="Geo verification" body="Reduces false reminders by confirming you visited a venue." />
        <HelpBullet title="Caps" body="Prevents repeated reminders in a short time." />
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>
    </div>
  );
}

function HelpBullet({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{body}</div>
    </div>
  );
}

function MiniCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{body}</div>
    </div>
  );
}

function RadioRow({
  title,
  subtitle,
  active,
  onClick,
  locked,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-3xl border p-4 transition ${active ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 hover:bg-gray-50"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold inline-flex items-center gap-2">
            <span>{title}</span>
            {locked ? (
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${active ? "border-white/25 bg-white/10" : "border-gray-200 bg-gray-50"}`}>Requires Smart</span>
            ) : null}
          </div>
          <div className={`text-sm mt-0.5 ${active ? "text-white/80" : "text-gray-600"}`}>{subtitle}</div>
        </div>
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${active ? "border-white/35" : "border-gray-300"}`}>
          <div className={`w-3.5 h-3.5 rounded-full ${active ? "bg-white" : "bg-transparent"}`} />
        </div>
      </div>
    </button>
  );
}

function TimeSelect({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const options = useMemo(() => buildTimeOptions(), []);
  return (
    <div className={`rounded-3xl border p-4 ${disabled ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100"}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`mt-2 w-full h-11 rounded-2xl border px-3 font-semibold ${
          disabled ? "bg-gray-100 border-gray-100 text-gray-400" : "bg-white border-gray-200"
        }`}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {formatTimeLabel(o)}
          </option>
        ))}
      </select>
    </div>
  );
}

function buildTimeOptions() {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0"));
    }
  }
  return out;
}

function Sheet({ title, mounted, onClose, children }: { title: string; mounted: boolean; onClose: () => void; children: React.ReactNode }) {
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
            <div className="text-sm text-gray-500 mt-0.5">X5.6 (mock)</div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50" aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/* =========================
   Inline Icons (SVG)
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function IconInfoSmall() {
  return (
    <span className="mt-0.5 text-gray-400">
      <IconInfo />
    </span>
  );
}

function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWarn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M10.3 4.3 2.7 18.1A2 2 0 0 0 4.4 21h15.2a2 2 0 0 0 1.7-2.9L13.7 4.3a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9.5 20a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 13a7 7 0 0 1-10-10 9 9 0 1 0 10 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconRule() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 4h12v4H6V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 10h12v10H6V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 13h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22s8-4 8-10V6l-8-4-8 4v6c0 6 8 10 8 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IconReceipt() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2h12v20l-2-1-2 1-2-1-2 1-2-1-2 1V2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7h6M9 11h6M9 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M19 14l.7 3 2.3.8-2.3.8-.7 3-.7-3-2.3-.8 2.3-.8.7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/* =========================
   Styles
   ========================= */

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
