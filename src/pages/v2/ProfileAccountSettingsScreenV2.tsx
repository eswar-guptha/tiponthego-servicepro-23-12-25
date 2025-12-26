import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bell,
  Camera,
  Check,
  ChevronRight,
  Copy,
  Clock,
  Download,
  Globe,
  HelpCircle,
  Info,
  KeyRound,
  Languages,
  LogOut,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react";

/**
 * Screen Code: X6.1
 * Screen Name: Profile & Account Settings
 * Currency: USD
 * Roles: Customer / Guest
 * Entry:
 *  - From bottom nav → Profile
 *  - From X5.* settings hubs
 * Purpose:
 *  - Single place to manage identity, contact verification, and account actions
 *  - Provide safe and reversible flows for sign-out and deletion
 * Canvas Compatibility:
 *  - No framer-motion
 *  - Uses CSS keyframes for subtle success pop
 */

type VerifyState = "unverified" | "pending" | "verified";

type State = {
  displayName: string;
  handle: string;
  email: string;
  phone: string;
  emailState: VerifyState;
  phoneState: VerifyState;
  currency: "USD";
  language: "English (US)" | "English (India)" | "Spanish";
  region: "United States" | "India";
  timezone: "America/Los_Angeles" | "Asia/Kolkata";
  locationMode: "Approx" | "Precise" | "Off";
  marketingEmails: boolean;
  pushEnabled: boolean;
  receiptSharing: "Private" | "Link-only";
  publicProfile: boolean;
  lastLogin: string;
  accountId: string;
};

const DEFAULTS: State = {
  displayName: "Adusu",
  handle: "@adusu",
  email: "adusu.india@gmail.com",
  phone: "+91 9XXXX-XXXXX",
  emailState: "verified",
  phoneState: "pending",
  currency: "USD",
  language: "English (India)",
  region: "India",
  timezone: "Asia/Kolkata",
  locationMode: "Approx",
  marketingEmails: false,
  pushEnabled: true,
  receiptSharing: "Link-only",
  publicProfile: false,
  lastLogin: "Dec 23 · 10:12 AM",
  accountId: "USR-9F2A-18C1",
};

function normalizeHandle(input: string) {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return "@";
  const core = trimmed.replace(/^@+/, "");
  return "@" + core;
}

function runDevChecks() {
  try {
    console.assert(DEFAULTS.currency === "USD", "currency USD");
    console.assert(DEFAULTS.accountId.startsWith("USR-"), "accountId format");

    // Added tests
    console.assert(normalizeHandle("adusu") === "@adusu", "normalizeHandle adds @");
    console.assert(normalizeHandle("@@adusu") === "@adusu", "normalizeHandle collapses @");
    console.assert(normalizeHandle("  @x  ") === "@x", "normalizeHandle trims");
  } catch {
    // no-op
  }
}

if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
  runDevChecks();
}

export default function ProfileAccountSettingsX61() {
  const [s, setS] = useState<State>(DEFAULTS);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "editProfile" | "verifyEmail" | "verifyPhone" | "changePass" | "logout" | "delete" | "help">(null);
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

  const securityScore = useMemo(() => {
    let score = 0;
    if (s.emailState === "verified") score += 30;
    if (s.phoneState === "verified") score += 30;
    if (s.pushEnabled) score += 10;
    if (s.locationMode !== "Off") score += 10;
    if (!s.publicProfile) score += 20;
    return Math.min(100, score);
  }, [s.emailState, s.locationMode, s.phoneState, s.publicProfile, s.pushEnabled]);

  function back() {
    alert("Back (mock) → Profile Home");
  }

  function open(k: NonNullable<typeof sheet>) {
    setSheet(k);
  }

  function close() {
    setMounted(false);
    setTimeout(() => setSheet(null), 180);
  }

  function saveProfile(p: Partial<State>) {
    setS((prev) => ({ ...prev, ...p }));
    setToast("Saved");
    close();
  }

  function copyId() {
    navigator.clipboard?.writeText(s.accountId);
    setToast("Copied Account ID");
  }

  function simulateVerify(type: "email" | "phone") {
    if (type === "email") setS((p) => ({ ...p, emailState: "verified" }));
    if (type === "phone") setS((p) => ({ ...p, phoneState: "verified" }));
    setToast("Verified");
    close();
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
          <div className="text-white font-semibold">X6.1 · Account</div>
          <button
            onClick={() => open("help")}
            className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 text-white flex items-center justify-center hover:bg-white/15"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-24 space-y-3">
        {/* Profile header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-gray-100 flex items-center justify-center">
                    <User className="w-7 h-7 text-blue-700" />
                  </div>
                  <button
                    onClick={() => {
                      setToast("Photo updated (mock)");
                    }}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-lg"
                    aria-label="Change photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-xl font-semibold truncate">{s.displayName}</div>
                    {s.publicProfile ? (
                      <span className="text-xs px-2.5 py-1 rounded-full border bg-blue-50 border-blue-100 text-blue-800 font-semibold">Public</span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full border bg-gray-50 border-gray-200 text-gray-700 font-semibold">Private</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5 truncate">{s.handle}</div>
                  <div className="text-xs text-gray-500 mt-2">Last login: {s.lastLogin}</div>
                </div>
              </div>

              <button
                onClick={() => open("editProfile")}
                className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50"
              >
                Edit
              </button>
            </div>

            {/* Security meter */}
            <div className="mt-4 rounded-3xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Security score</span>
                  </div>
                  <div className="mt-1 text-xl font-semibold">{securityScore}/100</div>
                  <div className="text-sm text-gray-600 mt-1">Verify phone + keep profile private for best safety.</div>
                </div>
                <div
                  className={`w-14 h-14 rounded-3xl border bg-white flex items-center justify-center ${
                    securityScore >= 80 ? "border-emerald-100" : "border-amber-100"
                  }`}
                >
                  <BadgeCheck className={`w-7 h-7 ${securityScore >= 80 ? "text-emerald-600" : "text-amber-600"}`} />
                </div>
              </div>

              <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gray-900" style={{ width: `${securityScore}%` }} />
              </div>
            </div>

            {/* Account ID */}
            <div className="mt-3 rounded-3xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-500">Account ID</div>
                  <div className="font-semibold mt-1">{s.accountId}</div>
                  <div className="text-xs text-gray-500 mt-1">Use this when contacting support.</div>
                </div>
                <button
                  onClick={copyId}
                  className="h-10 px-3 rounded-2xl bg-white border border-gray-200 font-semibold inline-flex items-center gap-2 hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & verification */}
        <Section title="Contact & verification" subtitle="Keep your account recoverable">
          <Row icon={<Mail className="w-4 h-4" />} title="Email" value={s.email} right={<VerifyPill state={s.emailState} />} onClick={() => open("verifyEmail")} />
          <Row icon={<Phone className="w-4 h-4" />} title="Phone" value={s.phone} right={<VerifyPill state={s.phoneState} />} onClick={() => open("verifyPhone")} />
          <Row
            icon={<KeyRound className="w-4 h-4" />}
            title="Password"
            value="Change password"
            right={<ChevronRight className="w-4 h-4 text-gray-400" />}
            onClick={() => open("changePass")}
          />
        </Section>

        {/* Preferences */}
        <Section title="Preferences" subtitle="Language, region, and display">
          <Row
            icon={<Globe className="w-4 h-4" />}
            title="Region"
            value={`${s.region} · ${s.currency}`}
            right={<ChevronRight className="w-4 h-4 text-gray-400" />}
            onClick={() => {
              saveProfile({ region: s.region === "India" ? "United States" : "India" });
              setToast("Region toggled (mock)");
            }}
          />
          <Row
            icon={<Languages className="w-4 h-4" />}
            title="Language"
            value={s.language}
            right={<ChevronRight className="w-4 h-4 text-gray-400" />}
            onClick={() => {
              const next =
                s.language === "English (India)" ? "English (US)" : s.language === "English (US)" ? "Spanish" : "English (India)";
              saveProfile({ language: next });
            }}
          />
          <Row
            icon={<ClockIcon />}
            title="Timezone"
            value={s.timezone}
            right={<ChevronRight className="w-4 h-4 text-gray-400" />}
            onClick={() => {
              saveProfile({ timezone: s.timezone === "Asia/Kolkata" ? "America/Los_Angeles" : "Asia/Kolkata" });
            }}
          />
        </Section>

        {/* Privacy & controls */}
        <Section title="Privacy & controls" subtitle="Control visibility and receipts">
          <ToggleRow
            icon={<Lock className="w-4 h-4" />}
            title="Public profile"
            subtitle="If on, your handle can be discovered"
            checked={s.publicProfile}
            onChange={() => {
              setS((p) => ({ ...p, publicProfile: !p.publicProfile }));
              setToast("Updated");
            }}
          />
          <Row
            icon={<Download className="w-4 h-4" />}
            title="Receipt sharing"
            value={s.receiptSharing}
            right={<ChevronRight className="w-4 h-4 text-gray-400" />}
            onClick={() => {
              saveProfile({ receiptSharing: s.receiptSharing === "Private" ? "Link-only" : "Private" });
            }}
          />
          <Row
            icon={<MapPin className="w-4 h-4" />}
            title="Location mode"
            value={s.locationMode}
            right={<ChevronRight className="w-4 h-4 text-gray-400" />}
            onClick={() => {
              const next = s.locationMode === "Approx" ? "Precise" : s.locationMode === "Precise" ? "Off" : "Approx";
              saveProfile({ locationMode: next });
            }}
          />
        </Section>

        {/* Notifications shortcut */}
        <Section title="Notifications" subtitle="Quick controls">
          <ToggleRow
            icon={<Bell className="w-4 h-4" />}
            title="Push notifications"
            subtitle="Required for tip reminders"
            checked={s.pushEnabled}
            onChange={() => {
              setS((p) => ({ ...p, pushEnabled: !p.pushEnabled }));
              setToast("Updated");
            }}
          />
          <ToggleRow
            icon={<Mail className="w-4 h-4" />}
            title="Marketing emails"
            subtitle="Offers and updates"
            checked={s.marketingEmails}
            onChange={() => {
              setS((p) => ({ ...p, marketingEmails: !p.marketingEmails }));
              setToast("Updated");
            }}
          />
        </Section>

        {/* Danger zone */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold text-red-700">Danger zone</div>
            <div className="text-sm text-gray-500 mt-0.5">Irreversible actions require confirmation</div>
          </div>
          <div className="p-2 space-y-2">
            <button
              onClick={() => open("logout")}
              className="w-full text-left rounded-3xl border border-gray-200 bg-white px-4 py-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl border border-gray-200 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold">Log out</div>
                    <div className="text-sm text-gray-500 mt-0.5">Sign out of this device</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 mt-4" />
              </div>
            </button>

            <button
              onClick={() => open("delete")}
              className="w-full text-left rounded-3xl border border-red-100 bg-red-50 px-4 py-4 hover:bg-red-100/50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl border border-red-200 bg-white flex items-center justify-center text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-red-800">Delete account</div>
                    <div className="text-sm text-red-700/80 mt-0.5">Permanently remove your data</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 mt-4" />
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-white/85">Digital Tipping · Customer · X6.1</div>
      </div>

      {/* Bottom helper */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <div className="max-w-md mx-auto p-4">
          <div className="bg-white/15 border border-white/20 rounded-3xl p-3 flex items-center justify-between">
            <div className="text-white">
              <div className="text-sm font-semibold">Need account help?</div>
              <div className="text-xs text-white/75">Use Account ID for support.</div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(s.accountId);
                setToast("Copied Account ID");
              }}
              className="h-11 px-4 rounded-2xl bg-white text-blue-700 font-semibold"
            >
              Copy ID
            </button>
          </div>
        </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <Sheet title={sheetTitle(sheet)} mounted={mounted} onClose={close}>
          {sheet === "editProfile" ? (
            <EditProfilePanel s={s} onSave={saveProfile} onClose={close} />
          ) : sheet === "verifyEmail" ? (
            <VerifyPanel
              kind="Email"
              value={s.email}
              state={s.emailState}
              onSend={() => {
                setS((p) => ({ ...p, emailState: "pending" }));
                setToast("Verification sent");
              }}
              onVerify={() => simulateVerify("email")}
              onClose={close}
            />
          ) : sheet === "verifyPhone" ? (
            <VerifyPanel
              kind="Phone"
              value={s.phone}
              state={s.phoneState}
              onSend={() => {
                setS((p) => ({ ...p, phoneState: "pending" }));
                setToast("OTP sent (mock)");
              }}
              onVerify={() => simulateVerify("phone")}
              onClose={close}
            />
          ) : sheet === "changePass" ? (
            <PasswordPanel
              onSave={() => {
                setToast("Password updated");
                close();
              }}
              onClose={close}
            />
          ) : sheet === "logout" ? (
            <ConfirmPanel
              tone="neutral"
              title="Log out of this device?"
              body="You can log back in anytime. This won’t affect your tips or receipts."
              primary="Log out"
              onPrimary={() => {
                setToast("Logged out (mock)");
                close();
              }}
              secondary="Cancel"
              onSecondary={close}
            />
          ) : sheet === "delete" ? (
            <DeleteAccountPanel
              accountId={s.accountId}
              onDelete={() => {
                setToast("Deletion requested (mock)");
                close();
              }}
              onClose={close}
            />
          ) : (
            <HelpPanel onClose={close} />
          )}
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
          <span className={toast?.includes("Saved") || toast?.includes("updated") || toast?.includes("Verified") ? "okTick" : ""}>
            <Check className="w-4 h-4" />
          </span>
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}

function sheetTitle(s: string) {
  switch (s) {
    case "editProfile":
      return "Edit profile";
    case "verifyEmail":
      return "Verify email";
    case "verifyPhone":
      return "Verify phone";
    case "changePass":
      return "Change password";
    case "logout":
      return "Log out";
    case "delete":
      return "Delete account";
    case "help":
      return "Help";
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
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button onClick={onChange} className="w-full text-left rounded-3xl border border-gray-100 bg-white px-4 py-4 hover:bg-gray-50 transition">
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

function VerifyPill({ state }: { state: VerifyState }) {
  const base = "text-xs px-3 py-1.5 rounded-full border font-semibold inline-flex items-center gap-2";
  if (state === "verified") {
    return (
      <span className={`${base} bg-emerald-50 border-emerald-100 text-emerald-800`}>
        <BadgeCheck className="w-4 h-4" /> Verified
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className={`${base} bg-amber-50 border-amber-100 text-amber-800`}>
        <Info className="w-4 h-4" /> Pending
      </span>
    );
  }
  return (
    <span className={`${base} bg-gray-50 border-gray-200 text-gray-700`}>
      <Info className="w-4 h-4" /> Unverified
    </span>
  );
}

function ClockIcon() {
  return <Clock className="w-4 h-4" />;
}

function EditProfilePanel({
  s,
  onSave,
  onClose,
}: {
  s: State;
  onSave: (p: Partial<State>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(s.displayName);
  const [handle, setHandle] = useState(s.handle);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Edit profile</div>
        <div className="text-sm text-gray-500 mt-1">Update your public handle and display name.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-3">
        <Field label="Display name" value={name} onChange={setName} placeholder="Your name" />
        <Field label="Handle" value={handle} onChange={setHandle} placeholder="@handle" />
        <div className="text-xs text-gray-500">Handle must start with @. Production: check availability.</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button
          onClick={() => {
            onSave({
              displayName: name.trim() || s.displayName,
              handle: normalizeHandle(handle),
            });
          }}
          className="h-12 rounded-2xl text-white font-semibold bg-gray-900"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function VerifyPanel({
  kind,
  value,
  state,
  onSend,
  onVerify,
  onClose,
}: {
  kind: "Email" | "Phone";
  value: string;
  state: VerifyState;
  onSend: () => void;
  onVerify: () => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Verify {kind}</div>
        <div className="text-sm text-gray-500 mt-1">We’ll send a code to: {value}</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Status</div>
          <VerifyPill state={state} />
        </div>
        <button onClick={onSend} className="mt-3 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Send code
        </button>

        <div className="mt-3">
          <Field label="Enter code" value={code} onChange={setCode} placeholder="123456" />
          <div className="mt-2 text-xs text-gray-500">Mock: any 4+ digits will verify.</div>
        </div>

        <button
          onClick={() => {
            if (code.trim().length < 4) return;
            onVerify();
          }}
          className={`mt-3 w-full h-12 rounded-2xl font-semibold ${code.trim().length >= 4 ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}
          disabled={code.trim().length < 4}
        >
          Verify
        </button>
      </div>

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5" />
        <span>We never ask for OTP/PIN via chat. Verify only inside the app.</span>
      </div>
    </div>
  );
}

function PasswordPanel({ onSave, onClose }: { onSave: () => void; onClose: () => void }) {
  const [oldP, setOldP] = useState("");
  const [newP, setNewP] = useState("");
  const [conf, setConf] = useState("");
  const ok = newP.length >= 8 && newP === conf && oldP.length > 0;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Change password</div>
        <div className="text-sm text-gray-500 mt-1">Use a strong password (8+ characters).</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4 space-y-3">
        <Field label="Current password" value={oldP} onChange={setOldP} placeholder="••••••••" type="password" />
        <Field label="New password" value={newP} onChange={setNewP} placeholder="••••••••" type="password" />
        <Field label="Confirm new password" value={conf} onChange={setConf} placeholder="••••••••" type="password" />
        <div className="text-xs text-gray-500">Mock validation only.</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onClose} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={onSave} disabled={!ok} className={`h-12 rounded-2xl font-semibold ${ok ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"}`}>
          Save
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Lock className="w-4 h-4 mt-0.5" />
        <span>Production: add strength meter and breach checks.</span>
      </div>
    </div>
  );
}

function ConfirmPanel({
  tone,
  title,
  body,
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  tone: "neutral" | "danger";
  title: string;
  body: string;
  primary: string;
  secondary: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className={`rounded-3xl border p-4 ${tone === "danger" ? "border-red-100 bg-red-50" : "border-gray-100 bg-gray-50"}`}>
        <div className={`font-semibold ${tone === "danger" ? "text-red-800" : ""}`}>{title}</div>
        <div className={`text-sm mt-1 ${tone === "danger" ? "text-red-700/80" : "text-gray-600"}`}>{body}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={onSecondary} className="h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          {secondary}
        </button>
        <button onClick={onPrimary} className={`h-12 rounded-2xl font-semibold ${tone === "danger" ? "bg-red-600 text-white" : "bg-gray-900 text-white"}`}>
          {primary}
        </button>
      </div>
    </div>
  );
}

function DeleteAccountPanel({ accountId, onDelete, onClose }: { accountId: string; onDelete: () => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const ok = text.trim().toUpperCase() === "DELETE";

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-red-100 bg-red-50 p-4">
        <div className="font-semibold text-red-800">Delete account</div>
        <div className="text-sm text-red-700/80 mt-1">This permanently removes your profile and disables tips & receipts.</div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-4">
        <div className="font-semibold">Confirm</div>
        <div className="text-sm text-gray-600 mt-1">
          Type <b>DELETE</b> to confirm. Account: <b>{accountId}</b>
        </div>
        <div className="mt-3">
          <Field label="Type DELETE" value={text} onChange={setText} placeholder="DELETE" />
        </div>

        <button onClick={onDelete} disabled={!ok} className={`mt-3 w-full h-12 rounded-2xl font-semibold ${ok ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400"}`}>
          Delete permanently
        </button>

        <button onClick={onClose} className="mt-2 w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
          Cancel
        </button>
      </div>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5" />
        <span>Production: export data + grace period before hard delete.</span>
      </div>
    </div>
  );
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
        <div className="font-semibold">Account help</div>
        <div className="text-sm text-gray-500 mt-1">Common actions and safety tips.</div>
      </div>

      <HelpItem icon={<Shield className="w-4 h-4" />} title="Keep your account safe" body="Verify email + phone, and keep your profile private." />
      <HelpItem icon={<Bell className="w-4 h-4" />} title="Tip reminders" body="Enable push notifications for missed tip recovery." />
      <HelpItem icon={<MapPin className="w-4 h-4" />} title="Nearby discovery" body="Use Approx location mode for best privacy-by-default." />

      <button onClick={onClose} className="w-full h-12 rounded-2xl bg-white border border-gray-200 font-semibold hover:bg-gray-50">
        Done
      </button>

      <div className="text-xs text-gray-500 flex items-start gap-2">
        <Lock className="w-4 h-4 mt-0.5" />
        <span>We never ask for OTP/PIN. Don’t share codes with anyone.</span>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-gray-500">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type ?? "text"}
        className="mt-1 w-full h-11 rounded-2xl border border-gray-200 px-3 outline-none focus:ring-2 focus:ring-blue-200"
      />
    </label>
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
          mounted ? "translate-y-0" : "translate-y-[680px]"
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
            <div className="text-sm text-gray-500 mt-0.5">X6.1 (mock)</div>
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

function StyleBlock() {
  return (
    <style>{`
      .okTick{ display:inline-flex; animation: okPop .22s ease-out; }
      @keyframes okPop{ 0%{ transform: scale(.92); opacity:.6; } 100%{ transform: scale(1); opacity:1; } }
    `}</style>
  );
}
