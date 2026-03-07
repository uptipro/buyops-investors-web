import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Mail,
  Moon,
  Globe,
  User,
  Lock,
  Shield,
  FileText,
  Star,
  HelpCircle,
  Info,
  ChevronRight,
  Settings} from "lucide-react";
import { NairaSign } from "../components/NairaSign";

type ToggleProps = { checked: boolean; onChange: (v: boolean) => void };

const Toggle = ({ checked, onChange }: ToggleProps) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? "bg-primary" : "bg-slate-200"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">
    {children}
  </h2>
);

const RowLink = ({
  to,
  icon,
  label,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
}) => (
  <Link
    to={to}
    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
  >
    <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300" />
  </Link>
);

const RowToggle = ({
  icon,
  label,
  description,
  storageKey,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  storageKey: string;
  onToggle?: (v: boolean) => void;
}) => {
  const [checked, setChecked] = useState(() => {
    return localStorage.getItem(storageKey) !== "false";
  });

  const handleChange = (v: boolean) => {
    setChecked(v);
    localStorage.setItem(storageKey, String(v));
    onToggle?.(v);
  };

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={handleChange} />
    </div>
  );
};

const RowSelect = ({
  icon,
  label,
  storageKey,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  storageKey: string;
  options: { value: string; label: string }[];
}) => {
  const [value, setValue] = useState(
    () => localStorage.getItem(storageKey) ?? options[0]?.value,
  );

  const handleChange = (v: string) => {
    setValue(v);
    localStorage.setItem(storageKey, v);
  };

  return (
    <div className="flex items-center gap-4 p-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
      </div>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg px-3 py-1.5 border-0 focus:ring-2 focus:ring-primary/30 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
};

const RowButton = ({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left first:rounded-t-2xl last:rounded-b-2xl"
  >
    <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      {description && <p className="text-xs text-slate-500">{description}</p>}
    </div>
    <ChevronRight className="w-4 h-4 text-slate-300" />
  </button>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
    {children}
  </div>
);

export default function SettingsPage() {
  const handleDarkMode = (on: boolean) => {
    document.documentElement.classList.toggle("dark", on);
  };

  // Sync dark mode from localStorage on mount
  useEffect(() => {
    const dark = localStorage.getItem("settings_dark_mode") !== "false";
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-100 rounded-xl">
          <Settings className="w-6 h-6 text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your preferences</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <section>
          <SectionTitle>Notifications</SectionTitle>
          <Card>
            <RowToggle
              icon={<Bell className="w-4 h-4 text-blue-500" />}
              label="Push Notifications"
              description="Receive alerts in your browser"
              storageKey="settings_notifications"
            />
            <RowToggle
              icon={<Mail className="w-4 h-4 text-green-500" />}
              label="Email Notifications"
              description="Receive updates via email"
              storageKey="settings_email_notifications"
            />
          </Card>
        </section>

        {/* Appearance */}
        <section>
          <SectionTitle>Appearance</SectionTitle>
          <Card>
            <RowToggle
              icon={<Moon className="w-4 h-4 text-indigo-500" />}
              label="Dark Mode"
              description="Toggle dark theme"
              storageKey="settings_dark_mode"
              onToggle={handleDarkMode}
            />
          </Card>
        </section>

        {/* Preferences */}
        <section>
          <SectionTitle>Preferences</SectionTitle>
          <Card>
            <RowSelect
              icon={<NairaSign className="w-4 h-4 text-yellow-500" />}
              label="Currency"
              storageKey="settings_currency"
              options={[
                { value: "NGN", label: "NGN (₦)" },
                { value: "USD", label: "USD ($)" },
                { value: "GBP", label: "GBP (£)" },
                { value: "EUR", label: "EUR (€)" },
              ]}
            />
            <RowSelect
              icon={<Globe className="w-4 h-4 text-cyan-500" />}
              label="Language"
              storageKey="settings_language"
              options={[
                { value: "en", label: "English" },
                { value: "fr", label: "Français" },
                { value: "yo", label: "Yorùbá" },
                { value: "ig", label: "Igbo" },
                { value: "ha", label: "Hausa" },
              ]}
            />
          </Card>
        </section>

        {/* Account */}
        <section>
          <SectionTitle>Account</SectionTitle>
          <Card>
            <RowLink
              to="/profile"
              icon={<User className="w-4 h-4 text-slate-500" />}
              label="Edit Profile"
            />
            <RowLink
              to="/profile"
              icon={<Lock className="w-4 h-4 text-slate-500" />}
              label="Change Password"
            />
            <RowButton
              icon={<Shield className="w-4 h-4 text-slate-500" />}
              label="Privacy Policy"
              onClick={() =>
                window.open("https://buyops.com/privacy", "_blank")
              }
            />
            <RowButton
              icon={<FileText className="w-4 h-4 text-slate-500" />}
              label="Terms of Service"
              onClick={() => window.open("https://buyops.com/terms", "_blank")}
            />
          </Card>
        </section>

        {/* App */}
        <section>
          <SectionTitle>App</SectionTitle>
          <Card>
            <RowButton
              icon={<Star className="w-4 h-4 text-yellow-400" />}
              label="Rate Us"
              description="Enjoying BuyOps? Leave a review"
            />
            <RowButton
              icon={<HelpCircle className="w-4 h-4 text-blue-400" />}
              label="Help & Support"
              description="Get help with your account"
              onClick={() => window.open("mailto:support@buyops.com")}
            />
            <RowButton
              icon={<Info className="w-4 h-4 text-slate-400" />}
              label="About BuyOps"
              onClick={() => window.open("https://buyops.com", "_blank")}
            />
          </Card>
        </section>
      </div>
    </div>
  );
}
