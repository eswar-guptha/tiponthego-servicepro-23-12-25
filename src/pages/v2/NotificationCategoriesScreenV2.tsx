import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Gift,
  Info,
  Lock,
  Moon,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";

/**
 * Screen Code: X5.4
 * Screen Name: Notification Categories Manager (Granular topics + frequency sliders)
 * Currency: USD
 * Roles: Guest / Customer
 * Entry:
 *  - From X5.1 Settings → Notifications
 *  - From X5.3 Soft Prompt → “Manage categories”
 * Purpose:
 *  - Offer granular opt-in topics with per-topic frequency
 *  - Provide global controls: master switch, quiet hours, OS permission state
 *  - Explain what each topic sends + preview examples
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Uses CSS keyframes for subtle pulse and slider highlight
 */

type Perm = "not_set" | "granted" | "denied";

type Freq = 0 | 1 | 2 | 3; // 0=Off, 1=Low, 2=Normal, 3=High

type TopicKey =
  | "missedTip"
  | "proLive"
  | "receiptReady"
  | "refund"
  | "caseUpdates"
  | "security"
  | "promos"
  | "weekly";

type Topic = {
  key: TopicKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  group: "Tips" | "Receipts" | "Support" | "Security" | "Marketing";
  defaultFreq: Freq;
  // Examples used in the preview drawer
  examples: string[];
};

type State = {
  perm: Perm;
  masterOn: boolean;
  quietNight: boolean;
  quietStart: string;
  quietEnd: string;
  topics: Record<TopicKey, Freq>;
};

const TOPICS: Topic[] = [
  {
    key: "missedTip",
    title: "Missed tip recovery",
    subtitle: "Nudge after an encounter so you can tip later",
    icon: <Gift className="w-4 h-4" />,
    group: "Tips",
    defaultFreq: 2,
    examples: [
      "You met Alex nearby · Tip in 10 seconds",
      "Missed tip? Alex is still live · Tip now",
    ],
  },
  {
    key: "proLive",
    title: "Pro goes live",
    subtitle: "When a saved pro starts a live session",
    icon: <Bell className="w-4 h-4" />,
    group: "Tips",
    defaultFreq: 1,
    examples: [
      "Maya is live near Downtown Plaza",
      "Diego is live · Market Street",
    ],
  },
  {
    key: "receiptReady",
    title: "Receipt ready",
    subtitle: "Tip receipt saved / share link created",
    icon: <Check className="w-4 h-4" />,
    group: "Receipts",
    defaultFreq: 2,
    examples: [
      "Receipt saved · $6.00 tip to Alex",
      "Share link created · Tap to copy",
    ],
  },
  {
    key: "refund",
    title: "Refund tracking",
    subtitle: "Refund initiated, processing, completed",
    icon: <Clock className="w-4 h-4" />,
    group: "Support",
    defaultFreq: 2,
    examples: [
      "Refund started · ETA 3–5 days",
      "Refund completed · $8.00 returned",
    ],
  },
  {
    key: "caseUpdates",
    title: "Case updates",
    subtitle: "Ticket timeline and agent replies",
    icon: <Info className="w-4 h-4" />,
    group: "Support",
    defaultFreq: 2,
    examples: [
      "Support replied · Tap to open chat",
      "Case status: Under review",
    ],
  },
  {
    key: "security",
    title: "Security alerts",
    subtitle: "Suspicious activity, payment risk signals",
    icon: <Shield className="w-4 h-4" />,
    group: "Security",
    defaultFreq: 3,
    examples: [
      "New device login detected",
      "Unusual tipping pattern · Verify activity",
    ],
  },
  {
    key: "weekly",
    title: "Weekly summary",
    subtitle: "Once-a-week recap of tips & receipts",
    icon: <Volume2 className="w-4 h-4" />,
    group: "Receipts",
    defaultFreq: 1,
    examples: [
      "Your week: 3 tips · $18.50 total",
      "Top pro: Alex · $9.00 tipped",
    ],
  },
  {
    key: "promos",
    title: "Promotions",
    subtitle: "Offers and product updates",
    icon: <Sparkles className="w-4 h-4" />,
    group: "Marketing",
    defaultFreq: 0,
    examples: [
      "New: QR quick tip — try it today",
      "Offer: fee-free tips this weekend",
    ],
  },
];

const DEFAULTS: State = {
  perm: "granted",
  masterOn: true,
  quietNight: true,
  quietStart: "22:00",
  quietEnd: "08:00",
  topics: {
    missedTip: 2,
    proLive: 1,
    receiptReady: 2,
    refund: 2,
    caseUpdates: 2,
    security: 3,
    promos: 0,
    weekly: 1,
  },
};

function runDevChecks() {
  try {
    console.assert(freqLabel(0) === "Off", "freq label off");
    console.assert(freqLabel(3) === "High", "freq label high");
    console.assert(TOPICS.length >= 6, "topics present");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function NotificationCategoriesX54() {
  const [s, setS] = useState<State>(DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<null | { key: TopicKey }>(null);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [sheet, setSheet] = useState<null | "quiet" | "os">(null);
  const [sheetMounted, setSheetMounted] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1700);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!drawer) return;
    setDrawerMounted(false);
    const t = setTimeout(() => setDrawerMounted(true), 10);
    return () => clearTimeout(t);
  }, [drawer]);

  useEffect(() => {
    if (!sheet) return;
    setSheetMounted(false);
    const t = setTimeout(() => setSheetMounted(true), 10);
    return () => clearTimeout(t);
  }, [sheet]);

  const groups = useMemo(() => {
    const map = new Map<string, Topic[]>();
    for (const t of TOPICS) {
      if (!map.has(t.group)) map.set(t.group, []);
      map.get(t.group)!.push(t);
    }
    return Array.from(map.entries());
  }, []);

  const enabledCount = useMemo(() => {
    if (!s.masterOn || s.perm !== "granted") return 0;
    return Object.values(s.topics).filter((f) => f !== 0).length;
  }, [s.masterOn, s.perm, s.topics]);

  function setMaster(on: boolean) {
    setS((p) => ({ ...p, masterOn: on }));
    setToast(on ? "Notifications enabled" : "Notifications muted");
  }

  function setTopicFreq(key: TopicKey, freq: Freq) {
    setS((p) => ({ ...p, topics: { ...p.topics, [key]: freq } }));
    setToast("Saved");
  }

  function openDrawer(key: TopicKey) {
    setDrawer({ key });
  }

  function closeDrawer() {
    setDrawerMounted(false);
    setTimeout(() => setDrawer(null), 180);
  }

  function openSheet(kind: NonNullable<typeof sheet>) {
    setSheet(kind);
  }

  function closeSheet() {
    setSheetMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function toggleQuietNight() {
    setS((p) => ({ ...p, quietNight: !p.quietNight }));
    setToast("Updated");
  }

  function applyQuiet(start: string, end: string) {
    setS((p) => ({ ...p, quietStart: start, quietEnd: end, quietNight: true }));
    setToast("Quiet hours saved");
    closeSheet();
  }

  function requestOSMock() {
    setToast("Requesting OS permission…");
    window.setTimeout(() => {
      setS((p) => ({ ...p, perm: "granted" }));
      setToast("OS permission granted");
      closeSheet();
    }, 750);
  }

  function denyOSMock() {
    setS((p) => ({ ...p, perm: "denied" }));
    setToast("Permission denied");
    closeSheet();
  }

  const permissionBlocked = s.perm !== "granted";
  const effectiveMuted = !s.masterOn || permissionBlocked;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-cyan-500">
      <StyleBlock />

      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-blue-700/25 backdrop-blur border-b border-white/15">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => alert("Back (mock) → X5.1")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-white font-semibold">X5.4 · Categories</div>
          <button
            onClick={() => openSheet("os")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="OS Permission"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-28 space-y-3">
        {/* Summary card */}
        <div className="bg-white/15 border border-white/20 rounded-3xl p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-white/80 inline-flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span>Notification manager</span>
              </div>
              <div className="mt-2 text-xl font-semibold">Granular controls</div>
              <div className="text-sm text-white/85 mt-1">Choose what you get and how often.</div>
            </div>
            <PermPill perm={s.perm} />
          </div>

          <div className="mt-4 rounded-3xl bg-white/10 border border-white/15 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Master notifications</div>
                <div className="text-xs text-white/75">Enabled topics: {enabledCount}</div>
              </div>
              <TogglePill checked={s.masterOn} onChange={() => setMaster(!s.masterOn)} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-white/85 inline-flex items-center gap-2">
                <Moon className="w-4 h-4" />
                <span>Quiet hours</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <button
                  onClick={toggleQuietNight}
                  className={`h-9 px-3 rounded-2xl border text-xs font-semibold ${
                    s.quietNight ? "bg-white text-blue-700 border-white" : "bg-white/10 text-white border-white/15"
                  }`}
                >
                  Night
                </button>
                <button
                  onClick={() => openSheet("quiet")}
                  className="h-9 px-3 rounded-2xl bg-white/10 border border-white/15 text-white text-xs font-semibold hover:bg-white/15"
                >
                  {s.quietStart}–{s.quietEnd}
                </button>
              </div>
            </div>

            {permissionBlocked && (
              <div className="mt-3 rounded-2xl bg-amber-500/15 border border-amber-200/30 p-3 text-xs text-white/90 inline-flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5" />
                <span>
                  OS permission is <b>{s.perm}</b>. Topics will be stored but no push will be delivered.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Topic groups */}
        <div className="space-y-3">
          {groups.map(([groupName, items]) => (
            <div key={groupName} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{groupName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Tap a topic to see examples</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100 text-gray-700 font-semibold">
                  {items.filter((t) => s.topics[t.key] !== 0).length}/{items.length} on
                </span>
              </div>

              <div className="p-2 space-y-2">
                {items.map((t) => (
                  <TopicRow
                    key={t.key}
                    topic={t}
                    freq={s.topics[t.key]}
                    disabled={effectiveMuted}
                    onOpen={() => openDrawer(t.key)}
                    onSet={(f) => setTopicFreq(t.key, f)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={() => alert("Next: X5.5 Quiet Hours Advanced (mock)")}
            className="w-full text-left px-4 py-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold">Advanced quiet hours</div>
                  <div className="text-sm text-gray-500 mt-0.5">Custom schedule, exceptions</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 mt-4" />
            </div>
          </button>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Preview & test</div>
              <div className="text-xs text-white/75">Tap any topic for examples</div>
            </div>
            <button
              onClick={() => setToast("Test notification sent (mock)")}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Send test
            </button>
          </div>
        </div>
      </div>

      {/* Topic drawer */}
      {drawer && (
        <Drawer
          mounted={drawerMounted}
          title="Topic preview"
          onClose={closeDrawer}
        >
          <TopicPreview
            topic={TOPICS.find((x) => x.key === drawer.key)!}
            freq={s.topics[drawer.key]}
            muted={effectiveMuted}
            perm={s.perm}
            masterOn={s.masterOn}
            quiet={{ enabled: s.quietNight, start: s.quietStart, end: s.quietEnd }}
            onSet={(f) => setTopicFreq(drawer.key, f)}
            onToast={setToast}
          />
        </Drawer>
      )}

      {/* Sheets */}
      {sheet === "quiet" && (
        <Sheet title="Quiet hours" mounted={sheetMounted} onClose={closeSheet}>
          <QuietSheet start={s.quietStart} end={s.quietEnd} onApply={applyQuiet} onClose={closeSheet} />
        </Sheet>
      )}

      {sheet === "os" && (
        <Sheet title="OS permission" mounted={sheetMounted} onClose={closeSheet}>
          <OSPermissionSheet perm={s.perm} onRequest={requestOSMock} onDeny={denyOSMock} onClose={closeSheet} />
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
          <span className={toast?.includes("Saved") || toast?.includes("enabled") || toast?.includes("granted") ? "okTick" : ""}>
            <Check className="w-4 h-4" />
          </span>
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function freqLabel(f: Freq) {
  if (f === 0) return "Off";
  if (f === 1) return "Low";
  if (f === 2) return "Normal";
  return "High";
}

function freqHelper(f: Freq) {
  if (f === 0) return "No push";
  if (f === 1) return "Only important";
  if (f === 2) return "Recommended";
  return "All activity";
}

function PermPill({ perm }: { perm: Perm }) {
  const base = "text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2";
  if (perm === "granted")
    return (
      <span className={`${base} bg-emerald-50 border-emerald-100 text-emerald-800`}>
        <Check className="w-4 h-4" /> Granted
      </span>
    );
  if (perm === "denied")
    return (
      <span className={`${base} bg-amber-50 border-amber-100 text-amber-800`}>
        <Lock className="w-4 h-4" /> Denied
      </span>
    );
  return (
    <span className={`${base} bg-gray-50 border-gray-200 text-gray-700`}>
      <Bell className="w-4 h-4" /> Not set
    </span>
  );
}

function TopicRow({
  topic,
  freq,
  disabled,
  onSet,
  onOpen,
}: {
  topic: Topic;
  freq: Freq;
  disabled: boolean;
  onSet: (f: Freq) => void;
  onOpen: () => void;
}) {
  const isOff = freq === 0;
  return (
    <div className={`rounded-3xl border border-gray-100 bg-white px-3 py-3 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={onOpen} className="flex items-start gap-3 text-left flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${isOff ? "bg-white border-gray-200 text-gray-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
            {topic.icon}
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{topic.title}</div>
            <div className="text-sm text-gray-500 mt-0.5 truncate">{topic.subtitle}</div>
            <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full border ${isOff ? "bg-gray-50 border-gray-200" : "bg-emerald-50 border-emerald-100"}`}>
                {freqLabel(freq)}
              </span>
              <span>·</span>
              <span>{freqHelper(freq)}</span>
            </div>
          </div>
        </button>

        <div className="w-[128px]">
          <FreqSlider
            value={freq}
            disabled={disabled}
            onChange={(v) => onSet(v)}
          />
        </div>
      </div>
    </div>
  );
}

function FreqSlider({
  value,
  disabled,
  onChange,
}: {
  value: Freq;
  disabled: boolean;
  onChange: (v: Freq) => void;
}) {
  return (
    <div className="select-none">
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) as Freq)}
        className={`w-full slider ${disabled ? "opacity-60" : ""}`}
        aria-label="Frequency slider"
      />
      <div className="mt-1 flex justify-between text-[10px] text-gray-500">
        <span>Off</span>
        <span>High</span>
      </div>
    </div>
  );
}

function TogglePill({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-7 rounded-full border flex items-center px-1 transition ${checked ? "bg-white border-white" : "bg-white/10 border-white/15"}`}
      aria-label="Toggle master"
    >
      <div className={`w-5 h-5 rounded-full bg-blue-700 transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function Drawer({
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
          mounted ? "translate-y-0" : "translate-y-[640px]"
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
            <div className="text-sm text-gray-500 mt-0.5">X5.4 (mock)</div>
          </div>
          <button onClick={close} className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function TopicPreview({
  topic,
  freq,
  muted,
  perm,
  masterOn,
  quiet,
  onSet,
  onToast,
}: {
  topic: Topic;
  freq: Freq;
  muted: boolean;
  perm: Perm;
  masterOn: boolean;
  quiet: { enabled: boolean; start: string; end: string };
  onSet: (f: Freq) => void;
  onToast: (t: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${freq === 0 ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
              {topic.icon}
            </div>
            <div>
              <div className="font-semibold">{topic.title}</div>
              <div className="text-sm text-gray-600 mt-0.5">{topic.subtitle}</div>
              <div className="mt-2 text-xs text-gray-500">Group: {topic.group}</div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 font-semibold">
            {freqLabel(freq)}
          </span>
        </div>

        <div className="mt-3 text-xs text-gray-500 flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5" />
          <span>
            Delivery: {muted ? "Muted" : "Active"} · Permission: {perm} · Master: {masterOn ? "On" : "Off"}
            {quiet.enabled ? ` · Quiet ${quiet.start}–${quiet.end}` : ""}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Frequency</div>
        <div className="text-sm text-gray-500 mt-1">Control how often you receive this notification.</div>

        <div className="mt-3">
          <FreqSlider value={freq} disabled={false} onChange={onSet} />
        </div>

        <div className="mt-2 text-xs text-gray-600">
          <b>{freqLabel(freq)}</b> · {freqHelper(freq)}
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <QuickPill label="Off" active={freq === 0} onClick={() => onSet(0)} />
          <QuickPill label="Low" active={freq === 1} onClick={() => onSet(1)} />
          <QuickPill label="Normal" active={freq === 2} onClick={() => onSet(2)} />
          <QuickPill label="High" active={freq === 3} onClick={() => onSet(3)} />
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Example notifications</div>
        <div className="text-sm text-gray-500 mt-1">Preview what you’ll see.</div>

        <div className="mt-3 space-y-2">
          {topic.examples.map((ex, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Digital Tipping</div>
              <div className="mt-1 font-semibold">{topic.title}</div>
              <div className="text-sm text-gray-700 mt-1">{ex}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onToast("Test notification sent (mock)")}
          className="mt-3 w-full h-12 rounded-2xl text-white font-semibold bg-gray-900"
        >
          Send test for this topic
        </button>

        <div className="mt-2 text-xs text-gray-500 flex items-start gap-2">
          <Lock className="w-4 h-4 mt-0.5" />
          <span>Production: respect OS notification channels and user-level opt-outs.</span>
        </div>
      </div>
    </div>
  );
}

function QuickPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 rounded-2xl border font-semibold inline-flex items-center justify-center transition ${
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
            <div className="text-sm text-gray-500 mt-0.5">X5.4 (mock)</div>
          </div>
          <button onClick={close} className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function QuietSheet({
  start,
  end,
  onApply,
  onClose,
}: {
  start: string;
  end: string;
  onApply: (s: string, e: string) => void;
  onClose: () => void;
}) {
  const [st, setSt] = useState(start);
  const [en, setEn] = useState(end);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Set quiet hours</div>
        <div className="text-sm text-gray-500 mt-1">Mute push notifications in this window.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Time</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">Start</div>
            <input type="time" value={st} onChange={(e) => setSt(e.target.value)} className="mt-1 w-full outline-none" />
          </div>
          <div className="rounded-2xl border border-gray-200 p-3">
            <div className="text-xs text-gray-500">End</div>
            <input type="time" value={en} onChange={(e) => setEn(e.target.value)} className="mt-1 w-full outline-none" />
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">Production: handle timezone + DST.</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={() => onApply(st, en)} className="h-12 rounded-2xl text-white font-semibold bg-gray-900">
          Save
        </button>
      </div>
    </div>
  );
}

function OSPermissionSheet({
  perm,
  onRequest,
  onDeny,
  onClose,
}: {
  perm: Perm;
  onRequest: () => void;
  onDeny: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">OS permission</div>
        <div className="text-sm text-gray-500 mt-1">In production, this links to system settings.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Current</div>
        <div className="text-sm text-gray-600 mt-1">{perm}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onRequest} className="h-12 rounded-2xl text-white font-semibold bg-gray-900">
          Request
        </button>
        <button onClick={onDeny} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Simulate Deny
        </button>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Lock className="w-4 h-4 mt-0.5" />
        <span>Production: use OS notification channels (Android) / settings deep link (iOS).</span>
      </div>
    </div>
  );
}

function StyleBlock() {
  return (
    <style>{`
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }

      /* Slider styling */
      .slider{
        -webkit-appearance: none;
        appearance: none;
        height: 8px;
        border-radius: 9999px;
        background: #e5e7eb;
        outline: none;
      }
      .slider::-webkit-slider-thumb{
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: #111827;
        border: 2px solid #fff;
        box-shadow: 0 6px 16px rgba(17,24,39,.18);
        animation: thumbPop .2s ease-out;
      }
      .slider::-moz-range-thumb{
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background: #111827;
        border: 2px solid #fff;
        box-shadow: 0 6px 16px rgba(17,24,39,.18);
      }
      @keyframes thumbPop{
        0%{ transform: scale(.92); }
        100%{ transform: scale(1); }
      }
    `}</style>
  );
}
