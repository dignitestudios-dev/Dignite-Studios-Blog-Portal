"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FiCheck, FiX, FiEye, FiEyeOff } from "react-icons/fi";

export function ProfileTab() {
  const { data: session, status, update } = useSession();
  
  const [name, setName] = useState(session?.user?.name || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const hasLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

  const isPasswordValid = hasLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = (oldPassword.length > 0 && isPasswordValid && doPasswordsMatch) || (oldPassword.length === 0 && newPassword.length === 0 && name !== session?.user?.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (newPassword && !isPasswordValid) {
      setError("Please ensure the new password meets all requirements.");
      return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          oldPassword,
          newPassword,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }
      
      setSuccess("Profile updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      if (name !== session?.user?.name) {
        await update({ name });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean, text: string }) => (
    <li className={`flex items-center gap-2 text-sm ${isValid ? "text-green-600" : "text-gray-400"}`}>
      {isValid ? <FiCheck size={16} /> : <FiX size={16} />}
      <span>{text}</span>
    </li>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm border border-green-100">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15C20]/20 focus:border-[#F15C20] transition-all"
            required
            autoComplete="off"
          />
        </div>
        
        <hr className="border-gray-100 my-6" />
        
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
        
        {/* Hidden inputs to trick browser autofill */}
        <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} />
        <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15C20]/20 focus:border-[#F15C20] transition-all pr-10"
              placeholder="Leave empty if you don't want to change password"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showOldPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>
        
        {oldPassword && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F15C20]/20 focus:border-[#F15C20] transition-all pr-10"
                  required={!!oldPassword}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">Password must contain:</p>
              <ul className="space-y-1">
                <ValidationItem isValid={hasLength} text="At least 8 characters" />
                <ValidationItem isValid={hasUppercase} text="One uppercase letter" />
                <ValidationItem isValid={hasLowercase} text="One lowercase letter" />
                <ValidationItem isValid={hasNumber} text="One number" />
                <ValidationItem isValid={hasSpecial} text="One special character" />
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all pr-10 ${
                    confirmPassword && !doPasswordsMatch 
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400" 
                      : "border-gray-200 focus:ring-[#F15C20]/20 focus:border-[#F15C20]"
                  }`}
                  required={!!oldPassword}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {confirmPassword && !doPasswordsMatch && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
          </>
        )}
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || (!canSubmit && oldPassword.length > 0)}
            className="bg-[#F15C20] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#d84e18] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
