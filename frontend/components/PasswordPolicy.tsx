import React, { useState, useEffect} from "react";
import api from "./api/AxiosInstance";

const POLICY_PRESETS = {
  Custom: null,
  Standard: {
    lowercase: true,
    uppercase: true,
    number: true,
    symbol: false,
    noEmail: true,
    noFirstName: false,
    noLastName: false,
    noCommon: true,
    minLength: 8,
    expiry: 2,
  },
  Strict: {
    lowercase: true,
    uppercase: true,
    number: true,
    symbol: true,
    noEmail: true,
    noFirstName: true,
    noLastName: true,
    noCommon: true,
    minLength: 12,
    expiry: 1,
  }
};

const PasswordPolicy = () => {
  
  const [policy, setPolicy] = useState({
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false,
    noEmail: false,
    noFirstName: false,
    noLastName: false,
    noCommon: false,
    minLength: 8,
    expiry: 1,
  });
  const [fetchedPolicy, setFetchedPolicy] = useState<typeof policy | null>(null);
  const [isFectchedPolicy, setIsFectchedPolicy] = useState<Boolean | null>(null);
  const [preset, setPreset] = useState<"Custom" | "Standard" | "Strict">("Custom");

  const handlePresetChange = (value: "Custom" | "Standard" | "Strict") => {
    setPreset(value);
  
    if (value !== "Custom") {
      setPolicy(POLICY_PRESETS[value]!);
    }
  };

  const toggle = (key: keyof typeof policy) => {
    if (key === "minLength") return;
    setPreset("Custom");
    setPolicy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function updatePasswordPolicy(updatedPolicy: typeof policy) {
    try {
      await api.post("/settings/update-password-policy", updatedPolicy).then(() => 
        setFetchedPolicy(updatedPolicy)
      );
      alert("Password policy updated successfully.");
    } catch (error) {
      alert("Error updating password policy. Please try again.");
    }
  }

  useEffect(() => {
    setIsFectchedPolicy(false);
    const fetchedPolicy = async () => {
      try {
        const res = await api.get("/settings/get-password-policy");
        if (res.data) {
          setPolicy(res.data);
          setFetchedPolicy(res.data);
        }
      } catch (error) {
        console.error("Error fetching password policy:", error);
        alert("Error fetching password policy. Please try again.");
        return;
      } finally {
        setIsFectchedPolicy(true);
      }
    };
    fetchedPolicy();
  }, []);

  if (!isFectchedPolicy) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm w-full max-w-2xl">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-semibold text-slate-700 tracking-wide">
          Complexity requirements
        </h2>
        <select
          value={preset}
          onChange={(e) => handlePresetChange(e.target.value as any)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="Custom">Custom</option>
          <option value="Standard">Standard</option>
          <option value="Strict">Strict</option>
        </select>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {[
          { key: "lowercase", label: "Lowercase letter" },
          { key: "uppercase", label: "Uppercase letter" },
          { key: "number", label: "Number (0-9)" },
          { key: "symbol", label: "Symbol (e.g., !@#$%^&*)" },
          { key: "noEmail", label: "Does not contain part of email" },
          { key: "noFirstName", label: "Does not contain first name" },
          { key: "noLastName", label: "Does not contain last name" },
          { key: "noCommon", label: "Does not contain common passwords" },
        ].map(item => (
          <label
            key={item.key}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={policy[item.key as keyof typeof policy] as boolean}
              onChange={() => toggle(item.key as keyof typeof policy)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition">
              {item.label}
            </span>
          </label>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-6"></div>

      {/* Min Length */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600 font-medium">
          Minimum password length
        </span>

        <select
          value={policy.minLength}
          onChange={(e) => {
            setPreset("Custom");
            setPolicy(prev => ({
              ...prev,
              minLength: Number(e.target.value),
            }))
          }}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          {[8, 10, 12, 14, 16].map(len => (
            <option key={len} value={len}>
              {len} characters
            </option>
          ))}
        </select>
      </div>
      
      {/* Password expiry */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-slate-600 font-medium">
          Password expiry
        </span>

        <select
          value={policy.expiry}
          onChange={(e) => {
            setPreset("Custom");
            setPolicy(prev => ({
              ...prev,
              expiry: Number(e.target.value),
            }))
          }}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          {[1, 2, 3, 4, 5].map(len => (
            <option key={len} value={len}>
              {len} months
            </option>
          ))}
        </select>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-6"></div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          disabled={JSON.stringify(policy) === JSON.stringify(fetchedPolicy)}
          onClick={() => updatePasswordPolicy(policy)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600">
          Save Policy
        </button>
      </div>
    </div>
  );
};

export default PasswordPolicy;