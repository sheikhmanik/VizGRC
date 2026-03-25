import { useEffect, useState } from "react";
import api from "./api/AxiosInstance";

const AcceptInvite = () => {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordPolicy, setPasswordPolicy] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  async function handlePasswordSetup() {
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordPolicy) {
      const passwordLower = confirmPassword.trim().toLowerCase();
      const nameParts = userData.name?.trim().toLowerCase().split(/\s+/) || [];
      const emailParts = userData.email?.toLowerCase().split(/[@.]/) || [];
  
      // Length
      if (passwordPolicy.minLength && confirmPassword.length < passwordPolicy.minLength) {
        setError(`Password must be at least ${passwordPolicy.minLength} characters long.`);
        return;
      }
  
      // Lowercase
      if (passwordPolicy.lowercase && !/[a-z]/.test(confirmPassword)) {
        setError("Password must include a lowercase letter.");
        return;
      }
  
      // Uppercase
      if (passwordPolicy.uppercase && !/[A-Z]/.test(confirmPassword)) {
        setError("Password must include an uppercase letter.");
        return;
      }
  
      // Number
      if (passwordPolicy.number && !/\d/.test(confirmPassword)) {
        setError("Password must include a number.");
        return;
      }
  
      // Symbol
      if (passwordPolicy.symbol && !/[^\w\s]/.test(confirmPassword)) {
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
    }

    if (!passwordPolicy) {
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#])[A-Za-z\d@$!%*?&^#]{12,}$/;
    
      if (!strongPasswordRegex.test(password)) {
        setError(
          "Password must be at least 12 characters and include uppercase, lowercase, number, and special character."
        );
        return;
      }
    }

    await api.post("/invitations/accept-invite", { token, password })
      .then((response) => {
        localStorage.setItem('token', response.data.tokenForLogin);
        setError("Account activated successfully.");
        window.location.href = "/";
      })
      .catch((err) => {
        console.error("Error activating account:", err.response?.data);
        const errMsg = err.response?.data?.error || "Error setting password.";
        setError(errMsg);
        return;
      })
    ;
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  useEffect(() => {
    api.get("/settings/get-password-policy")
      .then((res) => setPasswordPolicy(res.data))
      .catch((err) => console.error("Failed to fetch password policy:", err));
    api.get("/settings/get-user")
      .then((res) => setUserData(res.data))
      .catch((err) => console.error("Failed to fetch user data:", err));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
    
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Activate Your Account
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Set your secure password to complete your account activation.
          </p>
        </div>
    
        <div className="space-y-5">
    
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-blue-400 transition"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
    
          <button
            onClick={handlePasswordSetup}
            className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-100 transition-all active:scale-[0.98]"
          >
            Activate Account
          </button>
    
        </div>
    
      </div>
    </div>
  )
};

export default AcceptInvite;