/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, UserRole, UserSession } from "../types";
import { 
  Shield, Lock, UserCheck, Key, ShieldAlert, LogOut, ChevronDown, Check, 
  Smartphone, KeyRound, QrCode, Eye, EyeOff, Copy, CheckCircle, 
  Settings, RefreshCw, X, Sparkles, HelpCircle, AlertCircle
} from "lucide-react";

// Initial static profiles
const DEFAULT_ACCOUNTS = [
  {
    id: "user_admin",
    username: "cilapptor",
    email: "cilapptor@constructionledger.gov",
    role: "Administrator" as UserRole,
    passwordPlain: "Cilapptor#Secure_2026!",
    description: "Full controls across projects, financial workflows, system deletion, and logs."
  }
];

export interface LocalAccount {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  passwordPlain: string;
  description: string;
  twoFactorEnabled: boolean;
  twoFactorSecret: string;
}

// Helper to generate a valid Base32 secret (A-Z, 2-7) of 16 characters from username
export function generateBase32Secret(username: string): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const baseStr = "CAMOPLT" + username.toUpperCase();
  let val = 0;
  for (let i = 0; i < baseStr.length; i++) {
    val = (val << 5) - val + baseStr.charCodeAt(i);
  }
  let result = "";
  for (let i = 0; i < 16; i++) {
    val = (val * 1103515245 + 12345) & 0x7fffffff;
    result += characters[val % 32];
  }
  return result;
}

// Base32 decoding helper
function base32ToBuf(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const len = cleaned.length;
  const buf = new Uint8Array(Math.floor((len * 5) / 8));
  let val = 0;
  let bits = 0;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const c = cleaned[i];
    const charVal = alphabet.indexOf(c);
    if (charVal === -1) continue;
    val = (val << 5) | charVal;
    bits += 5;
    if (bits >= 8) {
      buf[idx++] = (val >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return buf;
}

// Generate real TOTP using Web Crypto API (HMAC-SHA1)
export async function getStandardTOTP(secret: string): Promise<string> {
  try {
    const timeStep = BigInt(Math.floor(Date.now() / 30000));
    const timeBuf = new Uint8Array(8);
    let temp = timeStep;
    for (let i = 7; i >= 0; i--) {
      timeBuf[i] = Number(temp & 255n);
      temp >>= 8n;
    }

    const keyBuf = base32ToBuf(secret);
    if (keyBuf.length === 0) {
      throw new Error("Invalid base32 secret");
    }
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBuf,
      { name: "HMAC", hash: { name: "SHA-1" } },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, timeBuf);
    const hmac = new Uint8Array(signature);

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, "0");
  } catch (err) {
    // Fallback: Use simulated OTP calculation
    return getSimulatedOTP(secret);
  }
}

// 30-second window code generator for simulated TOTP
export function getSimulatedOTP(secret: string): string {
  const timeStep = Math.floor(Date.now() / 30000);
  const str = secret + "_" + timeStep;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 1000000).toString().padStart(6, "0");
}

export function getSecondsRemaining(): number {
  return 30 - Math.floor((Date.now() % 30000) / 1000);
}

function getSavedAccounts(): LocalAccount[] {
  const stored = localStorage.getItem("CAMO_PLT_ACCOUNTS");
  if (!stored) {
    const initial: LocalAccount[] = DEFAULT_ACCOUNTS.map(acc => ({
      ...acc,
      twoFactorEnabled: false,
      twoFactorSecret: generateBase32Secret(acc.username),
    }));
    localStorage.setItem("CAMO_PLT_ACCOUNTS", JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(stored) as LocalAccount[];
    
    // PERFORM ACTIVE MIGRATION:
    // 1. Rename any admin account to cilapptor with the complex password & standard standard secret
    // 2. Remove other default legacy users (pm_manager, finance_officer)
    let migrated = false;
    
    let hasCilapptor = parsed.some(acc => acc.username === "cilapptor");
    let hasAdmin = parsed.some(acc => acc.username === "admin" || acc.id === "user_admin");
    
    let updated = parsed;
    if (!hasCilapptor) {
      if (hasAdmin) {
        updated = updated.map(acc => {
          if (acc.username === "admin" || acc.id === "user_admin") {
            return {
              ...acc,
              id: "user_admin",
              username: "cilapptor",
              email: "cilapptor@constructionledger.gov",
              role: "Administrator" as UserRole,
              passwordPlain: acc.passwordPlain === "admin123" ? "Cilapptor#Secure_2026!" : acc.passwordPlain,
              twoFactorSecret: generateBase32Secret("cilapptor")
            };
          }
          return acc;
        });
        migrated = true;
      } else {
        // Neither exist, inject cilapptor
        updated.push({
          id: "user_admin",
          username: "cilapptor",
          email: "cilapptor@constructionledger.gov",
          role: "Administrator" as UserRole,
          passwordPlain: "Cilapptor#Secure_2026!",
          description: "Full controls across projects, financial workflows, system deletion, and logs.",
          twoFactorEnabled: false,
          twoFactorSecret: generateBase32Secret("cilapptor")
        });
        migrated = true;
      }
    }

    // 2. Remove default accounts
    const lenBefore = updated.length;
    updated = updated.filter(acc => acc.username !== "pm_manager" && acc.username !== "finance_officer" && acc.username !== "admin");
    if (updated.length !== lenBefore) {
      migrated = true;
    }

    // Standard standard 2FA base32 check
    updated = updated.map(acc => {
      if (!acc.twoFactorSecret || acc.twoFactorSecret.includes("_") || /[^A-Z2-7]/.test(acc.twoFactorSecret) || acc.twoFactorSecret.length !== 16) {
        acc.twoFactorSecret = generateBase32Secret(acc.username);
        migrated = true;
      }
      return acc;
    });

    if (migrated) {
      localStorage.setItem("CAMO_PLT_ACCOUNTS", JSON.stringify(updated));
    }
    return updated;
  } catch (e) {
    const initial: LocalAccount[] = DEFAULT_ACCOUNTS.map(acc => ({
      ...acc,
      twoFactorEnabled: false,
      twoFactorSecret: generateBase32Secret(acc.username),
    }));
    localStorage.setItem("CAMO_PLT_ACCOUNTS", JSON.stringify(initial));
    return initial;
  }
}

function saveAccounts(accounts: LocalAccount[]) {
  localStorage.setItem("CAMO_PLT_ACCOUNTS", JSON.stringify(accounts));
}

interface AuthContextType {
  currentUser: User | null;
  sessionToken: string | null;
  login: (username: string, passwordPlain: string) => Promise<{ success: boolean; require2FA?: boolean; error?: string }>;
  loginWith2FA: (username: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (action: "view" | "create" | "edit" | "delete", target: "projects" | "financials" | "tasks" | "documents") => boolean;
  updatePassword: (newPasswordPlain: string) => Promise<void>;
  toggleTwoFactor: (enabled: boolean, secret: string) => Promise<void>;
  getTwoFactorSecret: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

async function sha256(message: string): Promise<string> {
  try {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (err) {
    return btoa(message).replace(/=/g, "");
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const activeAccounts = getSavedAccounts(); // ensure initialized and migrated
    const stored = localStorage.getItem("PRJ_LEDGER_AUTH_SESSION");
    if (stored) {
      try {
        const session: UserSession = JSON.parse(stored);
        // Find if this session user is an active legitimate account (or matches root renamed account)
        const match = activeAccounts.find(a => 
          a.id === session.user.id || 
          a.username.toLowerCase() === session.user.username.toLowerCase() ||
          (session.user.username.toLowerCase() === "admin" && a.username === "cilapptor")
        );
        
        if (match) {
          // Sync with mapped or migrated user details
          const updatedUser: User = {
            ...session.user,
            id: match.id,
            username: match.username,
            email: match.email,
            role: match.role,
            twoFactorEnabled: match.twoFactorEnabled,
            twoFactorSecret: match.twoFactorSecret
          };
          
          setCurrentUser(updatedUser);
          setSessionToken(session.token);
          
          // Save updated session to storage
          const updatedSession: UserSession = {
            ...session,
            user: updatedUser
          };
          localStorage.setItem("PRJ_LEDGER_AUTH_SESSION", JSON.stringify(updatedSession));
        } else {
          // Deactivated user or unmapped, clean logout
          localStorage.removeItem("PRJ_LEDGER_AUTH_SESSION");
          setCurrentUser(null);
          setSessionToken(null);
        }
      } catch (err) {
        localStorage.removeItem("PRJ_LEDGER_AUTH_SESSION");
      }
    }
    setIsInitializing(false);
  }, []);

  const login = async (username: string, passwordPlain: string): Promise<{ success: boolean; require2FA?: boolean; error?: string }> => {
    const accounts = getSavedAccounts();
    const account = accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase().trim());
    if (!account) {
      return { success: false, error: "Authentication failed: User account not found." };
    }
    if (passwordPlain !== account.passwordPlain) {
      return { success: false, error: "Authentication failed: Invalid credentials." };
    }
    if (account.twoFactorEnabled) {
      return { success: true, require2FA: true };
    }

    const pHash = await sha256(passwordPlain);
    const authenticatedUser: User = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: account.role,
      passwordHash: pHash,
      createdAt: new Date().toISOString(),
      twoFactorEnabled: account.twoFactorEnabled,
      twoFactorSecret: account.twoFactorSecret
    };

    const session: UserSession = {
      user: authenticatedUser,
      token: "jwt_sec_token_" + btoa(username + Date.now()).substring(0, 20),
      loginTime: new Date().toISOString()
    };

    setCurrentUser(authenticatedUser);
    setSessionToken(session.token);
    localStorage.setItem("PRJ_LEDGER_AUTH_SESSION", JSON.stringify(session));
    return { success: true, require2FA: false };
  };

  const loginWith2FA = async (username: string, code: string): Promise<{ success: boolean; error?: string }> => {
    const accounts = getSavedAccounts();
    const account = accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase().trim());
    if (!account) return { success: false, error: "Authentication failed: User not found." };

    const expectedSimulated = getSimulatedOTP(account.twoFactorSecret);
    const expectedStandard = await getStandardTOTP(account.twoFactorSecret);
    if (code !== expectedSimulated && code !== expectedStandard) {
      return { success: false, error: "Authentication failed: Incorrect Two-Factor code." };
    }

    const pHash = await sha256(account.passwordPlain);
    const authenticatedUser: User = {
      id: account.id,
      username: account.username,
      email: account.email,
      role: account.role,
      passwordHash: pHash,
      createdAt: new Date().toISOString(),
      twoFactorEnabled: account.twoFactorEnabled,
      twoFactorSecret: account.twoFactorSecret
    };

    const session: UserSession = {
      user: authenticatedUser,
      token: "jwt_sec_token_" + btoa(username + Date.now()).substring(0, 20),
      loginTime: new Date().toISOString()
    };

    setCurrentUser(authenticatedUser);
    setSessionToken(session.token);
    localStorage.setItem("PRJ_LEDGER_AUTH_SESSION", JSON.stringify(session));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setSessionToken(null);
    localStorage.removeItem("PRJ_LEDGER_AUTH_SESSION");
  };

  const updatePassword = async (newPasswordPlain: string): Promise<void> => {
    if (!currentUser) return;
    const accounts = getSavedAccounts();
    const updated = accounts.map(acc => {
      if (acc.id === currentUser.id) {
        return { ...acc, passwordPlain: newPasswordPlain };
      }
      return acc;
    });
    saveAccounts(updated);

    const pHash = await sha256(newPasswordPlain);
    const updatedUser: User = { ...currentUser, passwordHash: pHash };
    setCurrentUser(updatedUser);

    const stored = localStorage.getItem("PRJ_LEDGER_AUTH_SESSION");
    if (stored) {
      try {
        const session: UserSession = JSON.parse(stored);
        session.user = updatedUser;
        localStorage.setItem("PRJ_LEDGER_AUTH_SESSION", JSON.stringify(session));
      } catch (err) {}
    }
  };

  const toggleTwoFactor = async (enabled: boolean, secret: string): Promise<void> => {
    if (!currentUser) return;
    const accounts = getSavedAccounts();
    const updated = accounts.map(acc => {
      if (acc.id === currentUser.id) {
        return { ...acc, twoFactorEnabled: enabled, twoFactorSecret: secret };
      }
      return acc;
    });
    saveAccounts(updated);

    const updatedUser: User = {
      ...currentUser,
      twoFactorEnabled: enabled,
      twoFactorSecret: secret
    };
    setCurrentUser(updatedUser);

    const stored = localStorage.getItem("PRJ_LEDGER_AUTH_SESSION");
    if (stored) {
      try {
        const session: UserSession = JSON.parse(stored);
        session.user = updatedUser;
        localStorage.setItem("PRJ_LEDGER_AUTH_SESSION", JSON.stringify(session));
      } catch (err) {}
    }
  };

  const getTwoFactorSecret = (): string => {
    if (!currentUser) return "";
    return currentUser.twoFactorSecret || ("CAMOPLT_" + currentUser.username.toUpperCase() + "_SECRET_KEY");
  };

  const hasPermission = (
    action: "view" | "create" | "edit" | "delete",
    target: "projects" | "financials" | "tasks" | "documents"
  ): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;
    if (role === "Administrator") return true;

    if (role === "Project Manager") {
      if (action === "view") return true;
      if (target === "projects" || target === "tasks" || target === "documents" || target === "financials") {
        if (action === "create" || action === "edit") return true;
      }
    }
    if (role === "Finance Officer") {
      if (action === "view") return true;
      if (target === "projects" || target === "financials" || target === "documents" || target === "tasks") {
        if (action === "create" || action === "edit") return true;
      }
    }
    return false;
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-mono">Verifying Active Token...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      sessionToken, 
      login, 
      loginWith2FA, 
      logout, 
      hasPermission,
      updatePassword,
      toggleTwoFactor,
      getTwoFactorSecret
    }}>
      {!currentUser ? (
        <LoginScreen onLoginSuccess={async (u, p) => { await login(u, p); }} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Password policy indicator helper
const getPasswordStrength = (pass: string) => {
  return {
    length: pass.length >= 8,
    upper: /[A-Z]/.test(pass),
    lower: /[a-z]/.test(pass),
    number: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass)
  };
};

interface LoginScreenProps {
  onLoginSuccess: (u: string, p: string) => Promise<void>;
}

const LoginScreen: React.FC<LoginScreenProps> = () => {
  const { login, loginWith2FA } = useAuth();
  const [screenState, setScreenState] = useState<"LOGIN" | "MFA_GATE" | "FORGOT_PASSWORD">("LOGIN");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [mfaCode, setMfaCode] = useState("");
  const [simulatedMfaCode, setSimulatedMfaCode] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryStep, setRecoveryStep] = useState<"EMAIL" | "VERIFY_PIN" | "SET_PASSWORD" | "SUCCESS">("EMAIL");
  const [simulatedResetPin, setSimulatedResetPin] = useState("");
  const [userInputResetPin, setUserInputResetPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (screenState !== "MFA_GATE") return;
    const updateOtp = () => {
      const accounts = getSavedAccounts();
      const match = accounts.find(a => a.username.toLowerCase() === username.toLowerCase().trim());
      if (match) {
        setSimulatedMfaCode(getSimulatedOTP(match.twoFactorSecret));
      }
      setSecondsRemaining(getSecondsRemaining());
    };
    updateOtp();
    const inv = setInterval(updateOtp, 1000);
    return () => clearInterval(inv);
  }, [screenState, username]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await login(username, password);
      if (!result.success) throw new Error(result.error || "Authentication failed.");
      if (result.require2FA) {
        setScreenState("MFA_GATE");
        setMfaCode("");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length !== 6) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await loginWith2FA(username, mfaCode);
      if (!res.success) throw new Error(res.error || "Verification failed.");
    } catch (err: any) {
      setError(err?.message || "Incorrect Two-Factor dynamic key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!recoveryEmail) return;
    const accounts = getSavedAccounts();
    const match = accounts.find(a => a.email.toLowerCase().trim() === recoveryEmail.toLowerCase().trim());
    if (!match) {
      setError("No registered security clearing user profile matches this email.");
      return;
    }
    setRecoveryUsername(match.username);
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedResetPin(pin);
    setRecoveryStep("VERIFY_PIN");
  };

  const handleForgotPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (userInputResetPin !== simulatedResetPin) {
      setError("Verification code mismatch. Re-enter the pin printed above.");
      return;
    }
    setRecoveryStep("SET_PASSWORD");
  };

  const handleForgotSetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const strength = getPasswordStrength(newPassword);
    const isStrong = strength.length && strength.upper && strength.lower && strength.number && strength.special;
    if (!isStrong) {
      setError("Security Policy block: Password does not meet system complexity criteria.");
      return;
    }
    const accounts = getSavedAccounts();
    const updated = accounts.map(a => {
      if (a.username === recoveryUsername) {
        return { ...a, passwordPlain: newPassword };
      }
      return a;
    });
    saveAccounts(updated);
    setRecoveryStep("SUCCESS");
  };

  const pStrength = getPasswordStrength(newPassword);
  const metChecksCount = Object.values(pStrength).filter(Boolean).length;
  let strengthLabel = "Weak";
  let strengthColor = "bg-rose-500 w-1/4";
  if (metChecksCount >= 5) {
    strengthLabel = "Excellent";
    strengthColor = "bg-emerald-500 w-full";
  } else if (metChecksCount >= 3) {
    strengthLabel = "Medium";
    strengthColor = "bg-amber-500 w-3/5";
  }

  return (
    <div 
      className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden"
      style={{
        backgroundImage: "radial-gradient(at 0% 0%, #1e293b 0%, transparent 60%), radial-gradient(at 100% 100%, #1e1b4b 0%, transparent 60%)"
      }}
    >
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full filter blur-3xl"></div>

      <div className="w-full max-w-sm z-10 animate-fadeIn bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-[0_0_12px_rgba(34,197,94,0.3)]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M50 4 
                   C52.2 4, 53.2 10.5, 53.8 17 
                   C57.5 18.5, 61 21, 64 24 
                   L71 18.5 
                   C72 17.5, 74.5 17.5, 75.5 18.5 
                   L82 25 
                   C83 26, 83 28.5, 82 29.5 
                   L76.5 36.5 
                   C79 39.5, 81 43, 82.5 47 
                   L90.5 48.5 
                   C92 49, 93 51, 93 52.5 
                   L93 61.5 
                   C93 63, 92 65, 90.5 65.5 
                   L82.5 67 
                   C81 71, 79 74.5, 76.5 77.5 
                   L82 84.5 
                   C83 85.5, 83 88, 82 89 
                   L75.5 95.5 
                   C74.5 96.5, 72 96.5, 71 95.5 
                   L64 90 
                   C61 93, 57.5 95.5, 53.8 97 
                   L52.5 103.5 
                   L47.5 103.5 
                   L46.2 97 
                   C42.5 95.5, 39 93, 36 90 
                   L29 95.5 
                   C28 96.5, 25.5 96.5, 24.5 95.5 
                   L18 89 
                   C17 88, 17 85.5, 18 84.5 
                   L23.5 77.5 
                   C21 74.5, 19 71, 17.5 67 
                   L9.5 65.5 
                   C8 65, 7 63, 7 61.5 
                   L7 52.5 
                   C7 51, 8 49, 9.5 48.5 
                   L17.5 47 
                   C19 43, 21 39.5, 23.5 36.5 
                   L18 29.5 
                   C17 28.5, 17 26, 18 25 
                   L24.5 18.5 
                   C25.5 17.5, 28 17.5, 29 18.5 
                   L36 24 
                   C39 21, 42.5 18.5, 46.2 17 
                   C46.8 10.5, 47.8 4, 50 4 Z" 
                fill="#15803d" 
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinejoin="bevel"
              />
              <circle cx="50" cy="56" r="22" fill="#0f172a" />
              <path 
                d="M 61 47 
                   C 58 42, 54 40, 49 40 
                   C 40.2 40, 33 47.2, 33 56 
                   C 33 64.8, 40.2 72, 49 72 
                   C 54 72, 58 70, 61 65 
                   L 53.5 60.5 
                   C 52.5 62.5, 51 63.5, 49 63.5 
                   C 44.8 63.5, 41.5 60.2, 41.5 56 
                   C 41.5 51.8, 44.8 48.5, 49 48.5 
                   C 51 48.5, 52.5 49.5, 53.5 51.5 
                   Z" 
                fill="white" 
              />
            </svg>
          </div>
          <span className="text-lg font-sans font-black tracking-tight text-white block leading-none">
            Camo <span className="text-emerald-400 font-semibold font-mono">PLT</span>
          </span>
        </div>

        {error && (
          <div className="w-full p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] rounded-xl flex items-start text-left gap-2 animate-shake">
            <ShieldAlert size={14} className="mt-0.5 flex-shrink-0 text-rose-400" />
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {screenState === "LOGIN" && (
          <div className="w-full flex flex-col gap-3">
            <div className="w-full border-b border-white/5 pb-1">
              <h3 className="text-sm font-sans font-black text-white text-left">Login</h3>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-3 w-full text-left">
              <div>
                <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">Safe Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-white/10 rounded-xl text-xs text-white pr-10 focus:outline-hidden"
                  />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => { setError(null); setScreenState("FORGOT_PASSWORD"); setRecoveryStep("EMAIL"); }}
                    className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <UserCheck size={13} /> {isLoading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        )}

        {screenState === "MFA_GATE" && (
          <div className="w-full space-y-3 text-left">
            <div>
              <h3 className="text-sm font-sans font-black text-white flex items-center gap-1.5">
                <Smartphone className="text-indigo-400 animate-pulse" size={15} /> Two-Factor Verification
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Please insert the Dynamic dynamic passcode.</p>
            </div>

            {/* Simulated OTP Display */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10.5px] p-2.5 rounded-xl space-y-1">
              <span className="font-bold text-[9px] font-mono text-emerald-450 block uppercase">Simulated Authenticator App Key:</span>
              <div className="flex items-center gap-2">
                <strong className="bg-slate-950 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/10 tracking-widest">{simulatedMfaCode}</strong>
                <span className="text-[9px] text-slate-400 font-mono">Rotates in {secondsRemaining}s</span>
              </div>
            </div>

            <form onSubmit={handleMfaSubmit} className="space-y-3">
              <div>
                <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">6-Digit OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 123456"
                  className="w-full text-center tracking-widest font-mono px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white uppercase focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setScreenState("LOGIN")}
                  className="w-1/3 py-2 border border-white/10 text-xs font-bold text-slate-300 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={mfaCode.length !== 6 || isLoading}
                  className="w-2/3 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg transition"
                >
                  Authorize Session
                </button>
              </div>
            </form>
          </div>
        )}

        {screenState === "FORGOT_PASSWORD" && (
          <div className="w-full flex flex-col gap-3">
            <h3 className="text-sm font-sans font-black text-white text-left flex items-center gap-1.5">
              <KeyRound className="text-indigo-400" size={15} /> Account Recovery
            </h3>

            {recoveryStep === "EMAIL" && (
              <form onSubmit={handleForgotEmailSubmit} className="space-y-3 text-left">
                <p className="text-[10px] text-slate-400">Validate with email credentials to reset password.</p>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="e.g. cilapptor@constructionledger.gov"
                    className="w-full px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScreenState("LOGIN")}
                    className="w-1/3 py-2 border border-white/10 text-slate-350 text-xs font-bold rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg"
                  >
                    Send code
                  </button>
                </div>
              </form>
            )}

            {recoveryStep === "VERIFY_PIN" && (
              <form onSubmit={handleForgotPinSubmit} className="space-y-3 text-left">
                <div className="bg-[#102a43] border border-sky-505/20 text-sky-200 text-[10.5px] p-2.5 rounded-xl space-y-1">
                  <span className="font-bold text-[9px] font-mono text-sky-400 uppercase tracking-wider block">Simulated Email Inbox:</span>
                  <p className="leading-tight">Verify recovery pin code: <strong className="bg-[#022c22] px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30 font-mono text-xs select-all inline-block">{simulatedResetPin}</strong></p>
                </div>
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={userInputResetPin}
                    onChange={(e) => setUserInputResetPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter Simulated PIN"
                    className="w-full tracking-widest text-center px-3 py-2 bg-slate-950 border border-white/10 rounded-xl font-mono text-xs text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep("EMAIL")}
                    className="w-1/3 py-2 border border-white/10 text-slate-350 text-xs font-bold rounded-xl"
                  >
                    Back
                  </button>
                  <button type="submit" className="w-2/3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">Next</button>
                </div>
              </form>
            )}

            {recoveryStep === "SET_PASSWORD" && (
              <form onSubmit={handleForgotSetPasswordSubmit} className="space-y-3 text-left">
                <p className="text-[10px] text-slate-400">Reset password for username: <span className="text-indigo-400 font-bold">@{recoveryUsername}</span></p>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase mb-1 font-bold">New Safe Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter strong password"
                      className="w-full px-3.5 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showNewPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>

                {/* Strength Meter dashboard */}
                <div className="bg-slate-950 border border-white/5 rounded-xl p-2.5 space-y-2 text-[10px] leading-none font-medium">
                  <div className="flex items-center justify-between text-[9px] tracking-wider uppercase font-bold">
                    <span className="text-slate-400">Policy: {strengthLabel}</span>
                    <span className={metChecksCount >= 5 ? "text-emerald-450" : metChecksCount >= 3 ? "text-amber-450" : "text-rose-450"}>{metChecksCount}/5 met</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${strengthColor}`}></div>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-1 gap-y-1 mt-1 text-[9px] text-slate-400 font-semibold">
                    <li className={pStrength.length ? "text-emerald-400" : ""}>✓ Min 8 Char</li>
                    <li className={pStrength.upper ? "text-emerald-400" : ""}>✓ Uppercase A-Z</li>
                    <li className={pStrength.lower ? "text-emerald-400" : ""}>✓ Lowercase a-z</li>
                    <li className={pStrength.number ? "text-emerald-400" : ""}>✓ Numeral 0-9</li>
                    <li className={pStrength.special ? "text-emerald-400" : ""}>✓ Symbol (!#$)</li>
                  </ul>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep("VERIFY_PIN")}
                    className="w-1/3 py-2 border border-white/10 text-slate-350 text-xs font-bold rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={metChecksCount < 5}
                    className="w-2/3 py-2 bg-indigo-600 disabled:opacity-45 text-white text-xs font-bold rounded-xl"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            )}

            {recoveryStep === "SUCCESS" && (
              <div className="text-center space-y-3 pt-1">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                  <Check size={20} strokeWidth={3} />
                </div>
                <h4 className="text-white text-xs font-bold">Updated Successful</h4>
                <p className="text-[10.5px] text-slate-400">Your secure login profile has been synchronized successfully.</p>
                <button
                  type="button"
                  onClick={() => { setError(null); setScreenState("LOGIN"); setPassword(""); }}
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-xs font-bold text-white rounded-xl"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// UserNavWidget Dropdown & Control Modal
export const UserNavWidget: React.FC = () => {
  const { currentUser, logout, updatePassword, toggleTwoFactor, getTwoFactorSecret } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"PASS" | "MFA" | "USERS">("PASS");
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confPass, setConfPass] = useState("");

  const [mfaSecret, setMfaSecret] = useState("");
  const [userInputOtp, setUserInputOtp] = useState("");
  const [simulatedSetupOtp, setSimulatedSetupOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [setupState, setSetupState] = useState<"START" | "SCAN">("START");

  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!modalOpen || activeTab !== "MFA" || !mfaSecret) return;
    const calculateOtp = () => {
      setSimulatedSetupOtp(getSimulatedOTP(mfaSecret));
      setSecondsLeft(getSecondsRemaining());
    };
    calculateOtp();
    const inv = setInterval(calculateOtp, 1000);
    return () => clearInterval(inv);
  }, [modalOpen, activeTab, mfaSecret]);

  if (!currentUser) return null;

  const handlePassUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    setAlertSuccess(null);

    const accounts = getSavedAccounts();
    const match = accounts.find(a => a.id === currentUser.id);
    if (!match || match.passwordPlain !== curPass) {
      setAlertError("Current password validation failed.");
      return;
    }
    const strength = getPasswordStrength(newPass);
    const isStrong = strength.length && strength.upper && strength.lower && strength.number && strength.special;
    if (!isStrong) {
      setAlertError("Security error: New password is not compliant.");
      return;
    }
    if (newPass !== confPass) {
      setAlertError("Mismatched confirm password.");
      return;
    }

    await updatePassword(newPass);
    setAlertSuccess("Master security password reassigned successfully.");
    setCurPass("");
    setNewPass("");
    setConfPass("");
  };

  const startMfaSetup = () => {
    const rawSec = getTwoFactorSecret();
    setMfaSecret(rawSec);
    setSetupState("SCAN");
    setAlertError(null);
    setAlertSuccess(null);
  };

  const handleMfaEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    const correctSimulated = getSimulatedOTP(mfaSecret);
    const correctStandard = await getStandardTOTP(mfaSecret);
    if (userInputOtp !== correctSimulated && userInputOtp !== correctStandard) {
      setAlertError("MFA Verification failed: Dynamic OTP mismatch.");
      return;
    }
    await toggleTwoFactor(true, mfaSecret);
    setAlertSuccess("MFA authentication layer established successfully.");
    setUserInputOtp("");
    setSetupState("START");
  };

  const handleMfaDisable = async () => {
    setAlertError(null);
    setAlertSuccess(null);
    const secret = getTwoFactorSecret();
    const correctSimulated = getSimulatedOTP(secret);
    const val = prompt("CONFIRM DEACTIVATION:\nPlease enter the active 6-digit dynamic TOTP token code to process:");
    if (val === null) return;
    const correctStandard = await getStandardTOTP(secret);
    if (val !== correctSimulated && val !== correctStandard) {
      alert("Verification failed: 2FA removal aborted.");
      return;
    }
    await toggleTwoFactor(false, "");
    setAlertSuccess("Two-Factor dynamic authentication shield has been dismounted.");
    setSetupState("START");
  };

  const m強度 = getPasswordStrength(newPass);
  const mMetCount = Object.values(m強度).filter(Boolean).length;
  let mLabel = "Weak";
  let mColor = "bg-rose-500 w-1/4";
  if (mMetCount >= 5) {
    mLabel = "Compliant";
    mColor = "bg-emerald-500 w-full";
  } else if (mMetCount >= 3) {
    mLabel = "Medium";
    mColor = "bg-amber-500 w-3/5";
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 px-3 py-1.5 rounded-xl transition duration-150 cursor-pointer focus:outline-hidden"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center font-mono font-bold text-xs text-indigo-300">
          {currentUser.username[0].toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-white leading-tight">{currentUser.username}</div>
          <span className="text-[8px] font-mono border border-indigo-500/30 px-1 py-[1px] text-indigo-350 bg-indigo-500/5 rounded-full uppercase">
            {currentUser.role}
          </span>
        </div>
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-white/10 rounded-2xl p-2 shadow-2xl z-50 animate-fadeIn">
            <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
              <span className="text-[8.5px] uppercase font-mono font-bold text-slate-400 block truncate">Cleared clearance:</span>
              <span className="text-xs font-extrabold text-slate-200 block truncate">{currentUser.email}</span>
            </div>
            
            <button
              onClick={() => { setDropdownOpen(false); setModalOpen(true); }}
              className="w-full flex items-center gap-2 hover:bg-white/5 p-2 rounded-xl text-xs font-sans font-bold text-indigo-300 transition text-left cursor-pointer"
            >
              <Settings size={13} /> Account Security Center
            </button>

            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-2 text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl text-xs font-sans font-bold transition text-left cursor-pointer"
            >
              <LogOut size={13} /> Sign Out Session
            </button>
          </div>
        </>
      )}

      {/* SECURITY PROFILE SHIELD MODULE */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="bg-slate-900 border-b border-white/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Shield className="text-emerald-450" size={16} />
                <span className="text-xs font-black font-sans">Account Security Center</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-white/5">
                <X size={14} />
              </button>
            </div>

            <div className="flex bg-slate-900/50 border-b border-white/5 p-1">
              <button
                onClick={() => { setActiveTab("PASS"); setAlertError(null); setAlertSuccess(null); }}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${activeTab === "PASS" ? "bg-white/5 text-white" : "text-slate-400"}`}
              >
                🔒 Password
              </button>
              <button
                onClick={() => { setActiveTab("MFA"); setAlertError(null); setAlertSuccess(null); }}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${activeTab === "MFA" ? "bg-white/5 text-white" : "text-slate-400"}`}
              >
                📱 2FA
              </button>
              {currentUser.role === "Administrator" && (
                <button
                  onClick={() => { setActiveTab("USERS"); setAlertError(null); setAlertSuccess(null); }}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition ${activeTab === "USERS" ? "bg-white/5 text-white" : "text-slate-400"}`}
                >
                  👥 Users
                </button>
              )}
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-left text-xs">
              {alertError && <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-350 rounded-xl leading-tight text-[11px]">{alertError}</div>}
              {alertSuccess && <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl leading-tight text-[11px]">{alertSuccess}</div>}

              {activeTab === "PASS" && (
                <form onSubmit={handlePassUpdate} className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-mono uppercase mb-1 font-bold text-slate-400">Current Password</label>
                    <input
                      type="password"
                      required
                      value={curPass}
                      onChange={(e) => setCurPass(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase mb-1 font-bold text-slate-400">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase mb-1 font-bold text-slate-400">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confPass}
                      onChange={(e) => setConfPass(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="bg-slate-950 border border-white/5 rounded-xl p-2.5 space-y-1.5 text-[9px]">
                    <div className="flex items-center justify-between font-bold text-[8.5px] uppercase font-mono">
                      <span>Strength: {mLabel}</span>
                      <span className="text-slate-405">{mMetCount}/5 met</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${mColor}`}></div>
                    </div>
                    <ul className="grid grid-cols-2 gap-1 text-[8px] text-slate-400">
                      <li className={m強度.length ? "text-emerald-450 font-bold" : ""}>✓ Min 8 Characters</li>
                      <li className={m強度.upper ? "text-emerald-450 font-bold" : ""}>✓ Capital A-Z</li>
                      <li className={m強度.lower ? "text-emerald-450 font-bold" : ""}>✓ Lowercase a-z</li>
                      <li className={m強度.number ? "text-emerald-450 font-bold" : ""}>✓ Numeral 0-9</li>
                      <li className={m強度.special ? "text-emerald-450 font-bold" : ""}>✓ Symbol (!@#)</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={mMetCount < 5 || newPass !== confPass}
                    className="w-full py-2 bg-indigo-600 disabled:opacity-45 text-white font-bold text-xs rounded-xl"
                  >
                    Recalibrate Password
                  </button>
                </form>
              )}

              {activeTab === "MFA" && (
                <div className="space-y-3">
                  {currentUser.twoFactorEnabled ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl flex gap-2">
                        <Shield className="text-emerald-400 mt-0.5 shrink-0" size={15} />
                        <div>
                          <h4 className="text-slate-205 font-bold">2FA Active</h4>
                          <p className="text-[10px] text-slate-405 mt-0.5 leading-tight">Session coverage is fortified. Secure OTP is mandatory on startup.</p>
                        </div>
                      </div>
                      <div className="border border-white/5 bg-slate-900 p-2 rounded-lg flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[9px] text-slate-400">SECRET CODE: <span className="text-white ml-2 select-all">{getTwoFactorSecret()}</span></span>
                      </div>
                      <button
                        type="button"
                        onClick={handleMfaDisable}
                        className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-505/20 text-rose-300 font-bold rounded-xl"
                      >
                        Deactivate Two-Factor
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {setupState === "START" && (
                        <div className="space-y-3">
                          <p className="text-[10.5px] text-slate-400 leading-normal">Hardens your console credential structure by requesting an incremental Dynamic Code.</p>
                          <button
                            type="button"
                            onClick={startMfaSetup}
                            className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl"
                          >
                            Setup 2FA Key
                          </button>
                        </div>
                      )}

                      {setupState === "SCAN" && (
                        <div className="space-y-3.5">
                          <div className="flex gap-3 bg-slate-900 border border-white/5 p-2.5 rounded-xl items-center">
                            <MockQRCode username={currentUser.username} secret={mfaSecret} />
                            <div className="space-y-1">
                              <span className="text-[8px] bg-indigo-500/10 text-indigo-300 font-mono px-1 py-0.5 rounded uppercase font-bold">1: Scan Box</span>
                              <h4 className="text-[11px] font-bold text-white">Capture Vector Pattern</h4>
                              <p className="text-[9.5px] text-slate-400 leading-tight">Or use backup coordinate system code:</p>
                              <code className="text-[10px] font-mono text-indigo-300 block">{mfaSecret}</code>
                            </div>
                          </div>

                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl space-y-1">
                            <span className="text-[8.5px] font-mono uppercase text-emerald-400 tracking-wider block font-bold">Simulated Authenticator app code:</span>
                            <div className="flex items-center gap-1.5">
                              <strong className="bg-slate-950 px-2 py-0.5 rounded text-white font-mono text-[11px] tracking-wider select-all">{simulatedSetupOtp}</strong>
                              <span className="text-[9px] text-slate-450">Rotates in {secondsLeft}s</span>
                            </div>
                          </div>

                          <form onSubmit={handleMfaEnable} className="space-y-2.5">
                            <div>
                              <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Enter Verification OTP</label>
                              <input
                                type="text"
                                maxLength={6}
                                required
                                value={userInputOtp}
                                onChange={(e) => setUserInputOtp(e.target.value.replace(/\D/g, ""))}
                                placeholder="000000"
                                className="w-full tracking-widest text-center px-3 py-1.5 font-mono text-xs bg-slate-950 border border-white/10 rounded-xl"
                              />
                            </div>
                            <div className="flex gap-2 text-center text-xs">
                              <button type="button" onClick={() => setSetupState("START")} className="w-1/3 py-2 border border-white/10 text-slate-300 rounded-xl">Back</button>
                              <button type="submit" disabled={userInputOtp.length !== 6} className="w-2/3 py-2 bg-indigo-600 disabled:opacity-45 text-white font-bold rounded-xl">Activate 2FA</button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "USERS" && currentUser.role === "Administrator" && (
                <UserManagementTab 
                  setAlertError={setAlertError} 
                  setAlertSuccess={setAlertSuccess} 
                />
              )}
            </div>

            <div className="bg-slate-900 border-t border-white/10 px-4 py-2 flex items-center justify-between text-[8px] font-mono text-slate-500">
              <span>LEDGER PROTOCOL STANDARD STAGES 1-6</span>
              <span>CAMO v2.6.1</span>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const UserManagementTab: React.FC<{
  setAlertError: (msg: string | null) => void;
  setAlertSuccess: (msg: string | null) => void;
}> = ({ setAlertError, setAlertSuccess }) => {
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Project Manager");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    setAccounts(getSavedAccounts());
  }, []);

  const refreshAccounts = () => {
    setAccounts(getSavedAccounts());
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);
    setAlertSuccess(null);

    const usernameClean = newUsername.trim().toLowerCase();
    const emailClean = newEmail.trim().toLowerCase();

    if (!usernameClean || !emailClean || !newPassword) {
      setAlertError("All user profile fields are mandatory.");
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
      setAlertError("Invalid email address format.");
      return;
    }

    // Check uniqueness
    const existing = getSavedAccounts();
    if (existing.some(a => a.username.toLowerCase() === usernameClean)) {
      setAlertError(`A user with username "@${newUsername.trim()}" already exists.`);
      return;
    }
    if (existing.some(a => a.email.toLowerCase() === emailClean)) {
      setAlertError("A user with this email address already exists.");
      return;
    }

    // Password strength check
    const strength = getPasswordStrength(newPassword);
    const isStrong = strength.length && strength.upper && strength.lower && strength.number && strength.special;
    if (!isStrong) {
      setAlertError("Password policy failure: Complete sequence criteria not met.");
      return;
    }

    // Role-specific description
    let description = "";
    if (newRole === "Administrator") {
      description = "Full controls across projects, financial workflows, system deletion, and logs.";
    } else if (newRole === "Project Manager") {
      description = "Manages projects, schedules, RFQs, PFIs, POs, tasks & project doc attachments.";
    } else {
      description = "Approves milestone invoices, creates payment advices, logs expenses, and releases funds.";
    }

    const newUser: LocalAccount = {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      username: newUsername.trim(),
      email: emailClean,
      role: newRole,
      passwordPlain: newPassword,
      description,
      twoFactorEnabled: false,
      twoFactorSecret: generateBase32Secret(newUsername.trim())
    };

    const updated = [...existing, newUser];
    saveAccounts(updated);
    setAlertSuccess(`Successfully registered security profile for @${newUser.username}.`);
    
    // Reset form
    setNewUsername("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("Project Manager");
    setShowAddForm(false);
    refreshAccounts();
  };

  const handleDeleteUser = (userid: string, username: string) => {
    if (username === "cilapptor") {
      alert("System security failure: Root administrator profile cannot be purged.");
      return;
    }
    if (!confirm(`Are you absolutely sure you want to deactivate and delete user @${username}? This action is irreversible.`)) {
      return;
    }

    setAlertError(null);
    setAlertSuccess(null);

    const existing = getSavedAccounts();
    const updated = existing.filter(a => a.id !== userid);
    saveAccounts(updated);
    setAlertSuccess(`Purged secure user entry @${username} successfully.`);
    refreshAccounts();
  };

  const strength = getPasswordStrength(newPassword);
  const metChecks = Object.values(strength).filter(Boolean).length;
  let sLabel = "Weak";
  let sColor = "bg-rose-500 w-1/4";
  if (metChecks >= 5) {
    sLabel = "Compliant";
    sColor = "bg-emerald-500 w-full";
  } else if (metChecks >= 3) {
    sLabel = "Medium";
    sColor = "bg-amber-500 w-3/5";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">Active User Directory</h4>
        <button
          onClick={() => { setShowAddForm(!showAddForm); setAlertError(null); setAlertSuccess(null); }}
          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer"
        >
          {showAddForm ? <X size={11} /> : <Sparkles size={11} />}
          {showAddForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={handleCreateUser} className="bg-slate-900 border border-white/5 rounded-2xl p-3.5 space-y-3 animate-fadeIn">
          <div className="border-b border-white/5 pb-1 mb-2">
            <span className="text-[10px] font-bold text-white uppercase tracking-wider block">Create New User Profile</span>
          </div>

          <div>
            <label className="block text-[8.5px] font-mono uppercase mb-1 font-bold text-slate-400">Username</label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="e.g. jdoe_manager"
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-[8.5px] font-mono uppercase mb-1 font-bold text-slate-400">Email Address</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. jdoe@constructionledger.gov"
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-[8.5px] font-mono uppercase mb-1 font-bold text-slate-400">Assigned Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="Project Manager">Project Manager</option>
              <option value="Finance Officer">Finance Officer</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <div>
            <label className="block text-[8.5px] font-mono uppercase mb-1 font-bold text-slate-400">Default Secure Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>

            {newPassword && (
              <div className="bg-slate-950 border border-white/5 rounded-xl p-2.5 mt-2 space-y-1.5 text-[8px]">
                <div className="flex items-center justify-between font-bold text-[8px] uppercase font-mono">
                  <span>Strength: {sLabel}</span>
                  <span className="text-slate-405">{metChecks}/5 met</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className={`h-full ${sColor}`}></div>
                </div>
                <ul className="grid grid-cols-2 gap-1 text-[7.5px] text-slate-400">
                  <li className={strength.length ? "text-emerald-450 font-bold" : ""}>✓ Min 8 Characters</li>
                  <li className={strength.upper ? "text-emerald-450 font-bold" : ""}>✓ Capital A-Z</li>
                  <li className={strength.lower ? "text-emerald-450 font-bold" : ""}>✓ Lowercase a-z</li>
                  <li className={strength.number ? "text-emerald-450 font-bold" : ""}>✓ Numeral 0-9</li>
                  <li className={strength.special ? "text-emerald-450 font-bold" : ""}>✓ Symbol (!@#)</li>
                </ul>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={metChecks < 5}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl"
          >
            Register User Account
          </button>
        </form>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between p-2.5 bg-slate-900 border border-white/5 rounded-xl">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center font-mono font-bold text-xs text-indigo-400">
                  {acc.username[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[11px] font-bold text-white truncate">@{acc.username}</span>
                    <span className="text-[7.5px] font-mono border border-indigo-500/35 px-1 py-[1px] text-indigo-350 bg-indigo-500/5 rounded uppercase">
                      {acc.role === "Administrator" ? "Admin" : acc.role === "Project Manager" ? "PM" : "Finance"}
                    </span>
                  </div>
                  <span className="text-[9.5px] text-slate-400 block truncate">{acc.email}</span>
                </div>
              </div>
              
              {acc.username !== "cilapptor" && (
                <button
                  type="button"
                  onClick={() => handleDeleteUser(acc.id, acc.username)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-rose-500/15 text-rose-450/80 hover:text-rose-400 transition"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MockQRCode: React.FC<{ username?: string; secret?: string }> = ({ username, secret }) => {
  if (!username || !secret) {
    return (
      <div className="bg-white p-2 rounded-xl inline-block shadow-md shrink-0">
        <div className="w-16 h-16 bg-slate-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  const label = encodeURIComponent(`CamoPLT:${username}`);
  const issuer = encodeURIComponent("CamoPLT");
  const otpauthURI = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=4&data=${encodeURIComponent(otpauthURI)}`;

  return (
    <div className="bg-white p-2 rounded-xl inline-block shadow-md shrink-0 border border-slate-200/50">
      <img
        src={qrCodeUrl}
        alt="Two-Factor QR Code"
        className="w-16 h-16 select-none object-contain block"
        style={{ imageRendering: "pixelated" }}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={(e) => {
          console.error("QR Code image loading error.");
        }}
      />
    </div>
  );
};
