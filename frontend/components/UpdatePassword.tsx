import { useState, useEffect } from "react";
import api from "./api/AxiosInstance";
import GlassCard from "./GlassCard";

const UpdatePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordPolicy, setPasswordPolicy] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  async function handleChangePassword() {
    setError(null);

    const passwordLower = newPassword.trim().toLowerCase();
    const nameParts = userData.name?.trim().toLowerCase().split(/\s+/) || [];
    const emailParts = userData.email?.toLowerCase().split(/[@.]/) || [];

    // Length
    if (passwordPolicy.minLength && newPassword.length < passwordPolicy.minLength) {
      setError(`Password must be at least ${passwordPolicy.minLength} characters long.`);
      return;
    }

    // Lowercase
    if (passwordPolicy.lowercase && !/[a-z]/.test(newPassword)) {
      setError("Password must include a lowercase letter.");
      return;
    }

    // Uppercase
    if (passwordPolicy.uppercase && !/[A-Z]/.test(newPassword)) {
      setError("Password must include an uppercase letter.");
      return;
    }

    // Number
    if (passwordPolicy.number && !/\d/.test(newPassword)) {
      setError("Password must include a number.");
      return;
    }

    // Symbol
    if (passwordPolicy.symbol && !/[^\w\s]/.test(newPassword)) {
      setError("Password must include a special character.");
      return;
    }

    // Email check
    if (passwordPolicy.noEmail) {
      for (const part of emailParts) {
        if (part.length >= 3 && passwordLower.includes(part)) {
          setError("Password cannot contain parts of your email.");
          return;
        }
      }
    }

    // Name check
    if ((passwordPolicy.noFirstName || passwordPolicy.noLastName) && nameParts.length) {
      for (const part of nameParts) {
        if (part.length >= 3 && passwordLower.includes(part)) {
          setError("Password cannot contain parts of your name.");
          return;
        }
      }
    }

    // Common passwords
    const commonPasswords = ["password", "123456", "qwerty", "admin"];
    if (passwordPolicy.noCommon) {
      for (const common of commonPasswords) {
        if (passwordLower.includes(common)) {
          setError("Password cannot contain common words or patterns.");
          return;
        }
      }
    }

    try {
      await api.post("/settings/update-password", { currentPassword, newPassword })
        .then(() => {
          setError("Password changed successfully.");
          window.location.href = "/";
        })
        .catch((err) => {
          const errMsg = err.response?.data?.error || "Error setting password. Please try again.";
          setError(errMsg);
          return;
        });
    } catch (error) {
      setError("Error setting password. Please try again.");
      return;
    }
  }

  useEffect(() => {
    api.get("/settings/get-password-policy")
      .then((res) => setPasswordPolicy(res.data))
      .catch((err) => console.error("Failed to fetch password policy:", err));
    api.get("/settings/get-user")
      .then((res) => setUserData(res.data))
      .catch((err) => console.error("Failed to fetch user data:", err));
  }, []);

  return (
    <GlassCard
      title="Update Password"
      subtitle="Update your password to keep your account secure."
      className="w-full mx-auto">
      <div className="flex items-center justify-center bg-slate-50 p-5 md:p-8 w-full rounded-xl">
        <div className="space-y-5 w-full">

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {setNewPassword(e.target.value); setError(null)}}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {setConfirmPassword(e.target.value); setError(null)}}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 transition"
            />
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            For better security, it is recommended to update your password every 30 days.
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-100 transition-all active:scale-[0.98]"
          >
            Change Password
          </button>

        </div>
      </div>
    </GlassCard>
  )
};

export default UpdatePassword;