/**
 * Login Page Component
 * Handles user PIN authentication.
 * Displays login form and communicates with AuthContext to manage authentication state.
 * Only visible when login is enabled in the backend configuration.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { verifyPin } from "../services/authAPI";
import { login as loginIcon } from "../assets/icons";

const INVALID_PIN_MESSAGE = "Invalid PIN";
const VERIFYING_MESSAGE = "Verifying...";
const RATE_LIMITED_MESSAGE = "Too many attempts. Try again in";
const LOCKOUT_KEY = "centcon_pin_lockout_until";

const getRemainingSeconds = () => {
  const until = sessionStorage.getItem(LOCKOUT_KEY);
  if (!until) return 0;
  const remaining = Math.ceil((parseInt(until) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
};

const Login = () => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [countdown, setCountdown] = useState(() => getRemainingSeconds());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await verifyPin(pin);

      if (result.ok) {
        login();
      } else {
        setError(INVALID_PIN_MESSAGE);
        setPin("");
      }
    } catch (err) {
      if (err?.status === 429) {
        const until = Date.now() + 60 * 1000;
        sessionStorage.setItem(LOCKOUT_KEY, until.toString());
        setCountdown(60);
      } else {
        setError(err?.message || "Connection error. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-base sm:text-xl font-light tracking-[0.2em] text-white mb-2">
            CENTCON
          </h1>
          <p className="text-[#858585] text-xs tracking-[0.3em]">
            CENTRAL CONTROL NETWORK
          </p>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center">
            <input
              id="pin"
              type="password"
              // PINs are alphanumeric, so use text input mode intentionally.
              inputMode="text"
              pattern="[A-Z0-9]+"
              value={pin}
              onChange={(e) => setPin(e.target.value.toUpperCase())}
              className="w-[60%] px-4 py-3 bg-black border border-white/15 rounded-md text-white text-center text-md tracking-widest focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••"
              maxLength={4}
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="h-5 text-red-400 text-sm text-center">
            {countdown > 0 ? `${RATE_LIMITED_MESSAGE} ${countdown}s` : error}
          </div>

          <button
            type="submit"
            disabled={loading || pin.length === 0 || countdown > 0}
            className="group w-full py-3 text-white font-medium rounded-md 
             hover:text-gray-300 transition-colors 
             disabled:opacity-50 disabled:cursor-not-allowed 
             cursor-pointer flex items-center justify-center gap-3"
          >
            {loading ? (
              VERIFYING_MESSAGE
            ) : (
              <>
                <span className="tracking-widest font-normal">LOGIN</span>
                <img
                  src={loginIcon}
                  alt="Login icon"
                  className="w-5 h-5 min-w-5 min-h-5 
                   transition-all
                   group-hover:opacity-70"
                />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
