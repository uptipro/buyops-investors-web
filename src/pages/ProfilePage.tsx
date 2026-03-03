import { useState, useEffect } from "react";
import {
  User,
  Shield,
  ShieldOff,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { investorApi, authApi } from "../services/api-service";

export function ProfilePage() {
  const { user, updateUser } = useAuth();

  /* Profile edit */
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState((user as any)?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  /* Password change */
  const [showPwd, setShowPwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [savingPwd, setSavingPwd] = useState(false);

  /* 2FA */
  const [twoFAEnabled, setTwoFAEnabled] = useState(
    (user as any)?.twoFactorEnabled ?? false,
  );
  const [tfaScreen, setTfaScreen] = useState<"idle" | "setup" | "disable">(
    "idle",
  );
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [tfaToken, setTfaToken] = useState("");
  const [tfaLoading, setTfaLoading] = useState(false);
  const [tfaMsg, setTfaMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone((user as any)?.phone ?? "");
    setTwoFAEnabled((user as any)?.twoFactorEnabled ?? false);
  }, [user]);

  /* ── Profile save ── */
  const saveProfile = async () => {
    setSaving(true);
    setProfileMsg(null);
    try {
      const res = await investorApi.profile.update({ name, phone });
      updateUser(res.data);
      setProfileMsg({ ok: true, text: "Profile updated." });
      setEditing(false);
    } catch {
      setProfileMsg({ ok: false, text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  /* ── Password save ── */
  const savePassword = async () => {
    setPwdMsg(null);
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdMsg({ ok: false, text: "Passwords do not match." });
      return;
    }
    setSavingPwd(true);
    try {
      await authApi.changePassword({
        currentPassword: pwdForm.current,
        newPassword: pwdForm.next,
      });
      setPwdMsg({ ok: true, text: "Password changed successfully." });
      setPwdForm({ current: "", next: "", confirm: "" });
    } catch {
      setPwdMsg({ ok: false, text: "Failed to change password." });
    } finally {
      setSavingPwd(false);
    }
  };

  /* ── 2FA setup ── */
  const startSetup = async () => {
    setTfaLoading(true);
    setTfaMsg(null);
    try {
      const res = await authApi.setup2FA();
      setQrCode(res.data?.qrCode ?? "");
      setSecret(res.data?.secret ?? "");
      setTfaScreen("setup");
    } catch {
      setTfaMsg({ ok: false, text: "Failed to start 2FA setup." });
    } finally {
      setTfaLoading(false);
    }
  };

  const enable2FA = async () => {
    setTfaLoading(true);
    setTfaMsg(null);
    try {
      await authApi.enable2FA(tfaToken);
      setTwoFAEnabled(true);
      setTfaScreen("idle");
      setTfaToken("");
      setTfaMsg({ ok: true, text: "2FA enabled successfully." });
    } catch {
      setTfaMsg({ ok: false, text: "Invalid code. Please try again." });
    } finally {
      setTfaLoading(false);
    }
  };

  const disable2FA = async () => {
    setTfaLoading(true);
    setTfaMsg(null);
    try {
      await authApi.disable2FA(tfaToken);
      setTwoFAEnabled(false);
      setTfaScreen("idle");
      setTfaToken("");
      setTfaMsg({ ok: true, text: "2FA disabled." });
    } catch {
      setTfaMsg({ ok: false, text: "Invalid code. Please try again." });
    } finally {
      setTfaLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      {/* ── Profile info ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-semibold text-slate-900">
              Personal Information
            </h2>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-primary hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Name
              </label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Phone
              </label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setProfileMsg(null);
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <span className="text-slate-500 w-20">Name</span>
              <span className="font-medium text-slate-900">{user?.name}</span>
            </div>
            <div className="flex gap-4">
              <span className="text-slate-500 w-20">Email</span>
              <span className="font-medium text-slate-900">{user?.email}</span>
            </div>
            {(user as any)?.phone && (
              <div className="flex gap-4">
                <span className="text-slate-500 w-20">Phone</span>
                <span className="font-medium text-slate-900">
                  {(user as any).phone}
                </span>
              </div>
            )}
          </div>
        )}
        {profileMsg && (
          <p
            className={`text-sm ${profileMsg.ok ? "text-green-600" : "text-red-600"}`}
          >
            {profileMsg.text}
          </p>
        )}
      </div>

      {/* ── 2FA ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              {twoFAEnabled ? (
                <Shield className="w-5 h-5 text-green-600" />
              ) : (
                <ShieldOff className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                Two-Factor Authentication
              </h2>
              <p
                className={`text-xs font-medium ${twoFAEnabled ? "text-green-600" : "text-slate-400"}`}
              >
                {twoFAEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          {tfaScreen === "idle" &&
            (twoFAEnabled ? (
              <button
                onClick={() => {
                  setTfaScreen("disable");
                  setTfaMsg(null);
                }}
                className="text-sm text-red-500 hover:underline"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={startSetup}
                disabled={tfaLoading}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                {tfaLoading && <Loader2 className="w-3 h-3 animate-spin" />} Set
                Up
              </button>
            ))}
        </div>

        {tfaScreen === "setup" && (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">
              Scan this QR code with your authenticator app (e.g. Google
              Authenticator).
            </p>
            {qrCode && (
              <img
                src={qrCode}
                alt="QR Code"
                className="w-44 h-44 rounded-xl border border-slate-200"
              />
            )}
            {secret && (
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Or enter this key manually:
                </p>
                <code className="block bg-slate-100 rounded-lg px-3 py-2 text-sm font-mono break-all">
                  {secret}
                </code>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Enter the 6-digit code to verify
              </label>
              <input
                className="input tracking-widest font-mono"
                maxLength={6}
                value={tfaToken}
                onChange={(e) => setTfaToken(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={enable2FA}
                disabled={tfaLoading || tfaToken.length !== 6}
                className="btn-primary flex items-center gap-2"
              >
                {tfaLoading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                Enable 2FA
              </button>
              <button
                onClick={() => {
                  setTfaScreen("idle");
                  setTfaToken("");
                  setTfaMsg(null);
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {tfaScreen === "disable" && (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">
              Enter your authenticator code to disable 2FA.
            </p>
            <input
              className="input tracking-widest font-mono"
              maxLength={6}
              value={tfaToken}
              onChange={(e) => setTfaToken(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
            />
            <div className="flex gap-2">
              <button
                onClick={disable2FA}
                disabled={tfaLoading || tfaToken.length !== 6}
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
              >
                {tfaLoading && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                Disable 2FA
              </button>
              <button
                onClick={() => {
                  setTfaScreen("idle");
                  setTfaToken("");
                  setTfaMsg(null);
                }}
                className="btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {tfaMsg && (
          <p
            className={`text-sm flex items-center gap-1.5 ${tfaMsg.ok ? "text-green-600" : "text-red-600"}`}
          >
            {tfaMsg.ok && <CheckCircle className="w-4 h-4" />}
            {tfaMsg.text}
          </p>
        )}
      </div>

      {/* ── Change password ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Change Password</h2>
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              className="input pr-10"
              placeholder="Current password"
              value={pwdForm.current}
              onChange={(e) =>
                setPwdForm((p) => ({ ...p, current: e.target.value }))
              }
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPwd ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <input
            type="password"
            className="input"
            placeholder="New password"
            value={pwdForm.next}
            onChange={(e) =>
              setPwdForm((p) => ({ ...p, next: e.target.value }))
            }
          />
          <input
            type="password"
            className="input"
            placeholder="Confirm new password"
            value={pwdForm.confirm}
            onChange={(e) =>
              setPwdForm((p) => ({ ...p, confirm: e.target.value }))
            }
          />
        </div>
        {pwdMsg && (
          <p
            className={`text-sm ${pwdMsg.ok ? "text-green-600" : "text-red-600"}`}
          >
            {pwdMsg.text}
          </p>
        )}
        <button
          onClick={savePassword}
          disabled={savingPwd || !pwdForm.current || !pwdForm.next}
          className="btn-primary flex items-center gap-2"
        >
          {savingPwd && <Loader2 className="w-4 h-4 animate-spin" />} Update
          Password
        </button>
      </div>
    </div>
  );
}
