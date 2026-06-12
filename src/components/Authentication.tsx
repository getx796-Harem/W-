import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, HelpCircle, Mail, MessageSquare, CreditCard } from "lucide-react";
import { User } from "../types";

interface AuthenticationProps {
  onLoginSuccess: (user: User) => void;
}

export const Authentication: React.FC<AuthenticationProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"options" | "email_otp" | "loading" | "success" | "oauth_consent">("options");
  const [oauthPlatform, setOauthPlatform] = useState<"discord" | "google" | null>(null);
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [errorText, setErrorText] = useState("");
  const [tempUser, setTempUser] = useState<User | null>(null);

  // Focus code inputs automatically
  useEffect(() => {
    if (step === "email_otp") {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 300);
    }
  }, [step]);

  const handleOAuthLogin = (platform: "discord" | "google") => {
    setOauthPlatform(platform);
    setStep("oauth_consent");
  };

  const handleConfirmOAuth = () => {
    setStep("loading");
    setErrorText("");

    setTimeout(() => {
      let createdUser: User;
      const targetEmail: string = oauthPlatform === "discord" ? "gaming_legend@discord.net" : "kittisak.sandbox@gmail.com";
      const isAdminUser = targetEmail === "admin@gamestore.internal" || targetEmail === "getx796@gmail.com" || targetEmail === "gaming_legend@discord.net" || targetEmail === "kittisak.sandbox@gmail.com";

      if (oauthPlatform === "discord") {
        createdUser = {
          id: `usr-dc-${Math.floor(100000 + Math.random() * 900000)}`,
          username: `CyberPanda#${Math.floor(1000 + Math.random() * 8999)}`,
          email: "gaming_legend@discord.net",
          avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150",
          platform: "discord",
          balance: 0,
          isAdmin: isAdminUser,
        };
      } else {
        createdUser = {
          id: `usr-gg-${Math.floor(100000 + Math.random() * 900000)}`,
          username: "Kittisak S. (Google)",
          email: "kittisak.sandbox@gmail.com",
          avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
          platform: "google",
          balance: 0,
          isAdmin: isAdminUser,
        };
      }

      setTempUser(createdUser);
      setStep("success");
    }, 1500);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorText("กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }
    setErrorText("");
    setStep("email_otp");
  };

  const handleCodeChange = (index: number, val: string) => {
    // Only accept numeric entries
    const cleanVal = val.replace(/[^0-9]/g, "");
    if (!cleanVal) {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      return;
    }

    const newCode = [...code];
    newCode[index] = cleanVal.slice(-1);
    setCode(newCode);

    // Auto-advance
    if (index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    } else {
      // Last digit entered, verify immediately
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        verifyEmailCode(fullCode);
      }
    }
  };

  const verifyEmailCode = (fullCode: string) => {
    setStep("loading");
    // Simulate short network delay
    setTimeout(() => {
      const isAdminUser = email === "admin@gamestore.internal" || email === "getx796@gmail.com" || email === "gaming_legend@discord.net" || email === "kittisak.sandbox@gmail.com";
      const createdUser: User = {
        id: `usr-em-${Math.floor(100000 + Math.random() * 900000)}`,
        username: `${email.split("@")[0]}#${Math.floor(10 + Math.random() * 89)}`,
        email: email,
        avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150",
        platform: "email",
        balance: 0,
        isAdmin: isAdminUser,
      };
      setTempUser(createdUser);
      setStep("success");
    }, 1400);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handleCancelEmailOtp = () => {
    setStep("options");
    setCode(["", "", "", "", "", ""]);
    setErrorText("");
  };

  const handleFinishSuccess = () => {
    if (tempUser) {
      onLoginSuccess(tempUser);
    }
  };

  const handleAdminBypass = () => {
    // Hidden back-door to quickly log in as administrator with unlimited funds and dashboard controls directly
    const adminUser: User = {
      id: "admin-root",
      username: "Administrator",
      email: "admin@gamestore.internal",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150",
      platform: "google",
      balance: 99999,
      isAdmin: true,
    };
    onLoginSuccess(adminUser);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      {/* Absolute Header (Redesigned to Nexus Market spec) */}
      <header className="absolute top-6 left-12 flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-tr from-[#66FCF1] to-[#45A29E] rounded-lg"></div>
        <span className="text-xl font-bold text-white tracking-tight font-display">NEXUS<span className="text-[#66FCF1]">MARKET</span></span>
      </header>



      <div className="w-full max-w-md relative z-10">
        {/* Glow behind container (Nexus Teal/Cyan Glow) */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#66FCF1]/10 to-[#45A29E]/10 blur-xl pointer-events-none" />

        <div className="bg-[#11141a]/95 backdrop-blur-xl border border-[#45A29E]/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Accent decoration bar (Teal to Cyan Gradient) */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#66FCF1] to-[#45A29E]" />

          <AnimatePresence mode="wait">
            {/* Step 1: Login Options */}
            {step === "options" && (
              <motion.div
                key="step-options"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-white font-display">
                    Welcome to CyberStore
                  </h2>
                  <p className="text-sm text-[#C5C6C7]/80 font-light">
                    ระบบซื้อขายคีย์เกม/สิทธิ์เข้าใช้งานอัตโนมัติ 24 ชม.
                  </p>
                </div>

                {/* Authentication Channels */}
                <div className="space-y-3 pt-2">
                  {/* Google Login */}
                  <button
                    onClick={() => handleOAuthLogin("google")}
                    className="w-full relative group overflow-hidden bg-white hover:bg-zinc-100 text-zinc-950 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-lg"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.24 1 3.21 3.73 1.25 7.7l3.96 3.07C6.18 7.37 8.87 5.04 12 5.04z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.73 2.9C21.98 18.75 23.49 15.82 23.49 12.27z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.21 13.84c-.24-.73-.38-1.5-.38-2.31s.14-1.58.38-2.31L1.25 6.15C.45 7.75 0 9.53 0 11.41s.45 3.66 1.25 5.26l3.96-3.83z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.9c-1.1.74-2.52 1.18-4.23 1.18-3.13 0-5.82-2.33-6.79-5.73l-3.96 3.07C3.21 20.27 7.24 23 12 23z"
                      />
                    </svg>
                    <span className="font-sans text-sm">Sign in with Google</span>
                  </button>

                  {/* Discord Login */}
                  <button
                    onClick={() => handleOAuthLogin("discord")}
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-indigo-500/10 border border-indigo-400/20 cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 127.14 96.36">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53a105.73,105.73,0,0,0,32,16.29,80.68,80.68,0,0,0,6.71-11,68.6,68.6,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.65-2.1a75.22,75.22,0,0,0,70.71,0c.84.73,1.74,1.43,2.65,2.1a68.56,68.56,0,0,1-10.64,5.12,80.73,80.73,0,0,0,6.71,11,105.3,105.3,0,0,0,32-16.29C129.66,48.41,123.36,25.68,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.9,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96.14,53,91,65.69,84.69,65.69Z" />
                    </svg>
                    <span className="font-sans text-sm">Sign in with Discord</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <div className="h-px bg-[#45A29E]/15 flex-1" />
                  <span className="text-[#45A29E] font-mono text-[10px] tracking-wider">OR WITH SECURE EMAIL OTP</span>
                  <div className="h-px bg-[#45A29E]/15 flex-1" />
                </div>

                {/* Email Sign In */}
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-[#45A29E] group-focus-within:text-[#66FCF1] transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0B0C10] font-mono text-xs text-white border border-[#45A29E]/20 rounded-xl py-3.5 pl-11 pr-4 focus:outline-none focus:border-[#66FCF1]/50 focus:ring-1 focus:ring-[#66FCF1]/50 transition-all placeholder:text-[#C5C6C7]/30"
                    />
                  </div>

                  {errorText && <p className="text-rose-400 text-xs font-mono">{errorText}</p>}

                  <button
                    type="submit"
                    className="w-full bg-[#1F2833] hover:bg-[#1F2833]/80 text-[#66FCF1] border border-[#45A29E]/30 rounded-xl py-3 text-xs font-mono font-bold transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  >
                    Receive Sign In Code →
                  </button>
                </form>

                <p className="text-[10px] text-[#45A29E]/70 font-sans text-center pt-2 leading-relaxed">
                  เมื่อดำเนินการต่อคุณยอมรับ เงื่อนไขการให้บริการของแอร์พอร์ท และนโยบายความเป็นส่วนตัวของ Cyber Core
                </p>
              </motion.div>
            )}

            {/* Step 2: Custom OAuth Pop-up/Consent */}
            {step === "oauth_consent" && (
              <motion.div
                key="step-oauth"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <div className="flex justify-center">
                  {oauthPlatform === "discord" ? (
                    <div className="w-16 h-16 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/40 flex items-center justify-center text-[#5865F2] shadow-inner">
                      <svg className="w-8 h-8 animate-pulse" fill="currentColor" viewBox="0 0 127.14 96.36">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53a105.73,105.73,0,0,0,32,16.29,80.68,80.68,0,0,0,6.71-11,68.6,68.6,0,0,1-10.64-5.12c.91-.67,1.81-1.37,2.65-2.1a75.22,75.22,0,0,0,70.71,0c.84.73,1.74,1.43,2.65,2.1a68.56,68.56,0,0,1-10.64,5.12,80.73,80.73,0,0,0,6.71,11,105.3,105.3,0,0,0,32-16.29C129.66,48.41,123.36,25.68,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.9,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96.14,53,91,65.69,84.69,65.69Z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/20 flex items-center justify-center text-white shadow-inner">
                      <span className="text-2xl font-bold font-display animate-bounce">G</span>
                    </div>
                  )}
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-white font-display">
                    {oauthPlatform === "discord" ? "สิทธิ์การเข้าถึงผ่าน Discord" : "สิทธิ์การเข้าถึงผ่าน Google"}
                  </h3>
                  <p className="text-xs text-[#C5C6C7]/80 max-w-sm mx-auto leading-relaxed">
                    CyberStore ขอสิทธิ์เชื่อมต่อกับบัญชีของคุณเพื่อใช้ในการแสดงรูปโปรไฟล์, ยูสเซอร์เนม และสำหรับใช้ส่งคีย์สินค้าไปยังประวัติตะกร้าของคุณอย่างถูกต้อง
                  </p>
                </div>

                <div className="bg-[#0B0C10] rounded-xl p-4 border border-[#45A29E]/20 text-xs font-mono text-[#C5C6C7] space-y-2">
                  <div className="flex justify-between">
                    <span>• สิทธิ์ดึงข้อมูลโปรไฟล์ส่วนตัว</span>
                    <span className="text-[#66FCF1]">อนุญาต</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• สิทธิ์ตรวจสอบและยืนยันอีเมล</span>
                    <span className="text-[#66FCF1]">อนุญาต</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• การบันทึกคีย์ลงประวัติคำสั่งซื้อ</span>
                    <span className="text-[#66FCF1]">พร้อมใช้งาน</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("options")}
                    className="flex-1 bg-[#0B0C10] hover:bg-[#11141a] border border-[#45A29E]/30 text-xs font-mono text-[#C5C6C7] py-3 rounded-lg transition-colors cursor-pointer"
                  >
                    ยกเลิก / Cancel
                  </button>
                  <button
                    onClick={handleConfirmOAuth}
                    className="flex-1 bg-[#66FCF1] hover:bg-[#66FCF1]/90 text-xs font-mono text-[#0B0C10] font-bold py-3 rounded-lg transition-colors active:scale-[0.98] cursor-pointer shadow-[0_4px_14px_rgba(102,252,241,0.2)]"
                  >
                    อนุญาตและยืนยัน / Confirm
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Enter Verification Code */}
            {step === "email_otp" && (
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight font-display">คุณได้รับรหัสยืนยันแล้ว</h3>
                  <p className="text-sm text-[#C5C6C7]/80 leading-normal font-light">
                    ระบบทำการส่งรหัส OTP 6 หลักไปยัง <span className="text-[#66FCF1] font-mono font-medium">{email}</span>
                  </p>
                </div>

                {/* Digit Inputs Box */}
                <div className="flex items-center justify-center gap-1.5 py-4">
                  {code.map((digit, index) => (
                    <div key={index} className="relative w-12 h-12">
                      <input
                        ref={(el) => {
                          codeInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-full h-full text-center text-xl font-mono font-semibold bg-[#0B0C10] border border-[#45A29E]/30 rounded-lg text-white focus:outline-none focus:border-[#66FCF1]/50 focus:ring-1 focus:ring-[#66FCF1]/50 appearance-none transition-all"
                        style={{ caretColor: "transparent" }}
                      />
                      {!digit && (
                        <span className="absolute inset-0 flex items-center justify-center text-zinc-700 font-mono text-opacity-50 pointer-events-none">
                          •
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#45A29E]">
                  <button
                    onClick={() => {
                      setCode(["", "", "", "", "", ""]);
                    }}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    ล้างทั้งหมด / Clear Code
                  </button>
                  <span>ส่งโค้ดอีกครั้งใน 55 วินาที</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCancelEmailOtp}
                    className="w-[30%] bg-[#0B0C10] hover:bg-[#11141a] text-xs font-mono text-[#C5C6C7] border border-[#45A29E]/30 py-3.5 rounded-xl transition-colors cursor-pointer"
                  >
                    ถอยกลับ
                  </button>
                  <button
                    onClick={() => verifyEmailCode(code.join(""))}
                    disabled={code.some((val) => !val)}
                    className={`flex-1 rounded-xl text-center text-xs font-mono font-bold py-3.5 transition-all ${
                      !code.some((val) => !val)
                        ? "bg-[#66FCF1] text-[#0B0C10] hover:bg-[#66FCF1]/90 cursor-pointer shadow-[0_4px_14px_rgba(102,252,241,0.2)]"
                        : "bg-[#1F2833] text-[#45A29E] border border-[#45A29E]/10 cursor-not-allowed"
                    }`}
                  >
                    ยืนยันการลงชื่อเข้าใช้
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Full screen Spinner / Loading state */}
            {step === "loading" && (
              <motion.div
                key="step-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center space-y-4"
              >
                <div className="w-12 h-12 border-2 border-[#66FCF1]/20 border-t-[#66FCF1] rounded-full animate-spin mx-auto" />
                <p className="text-[#66FCF1] text-xs font-mono tracking-widest animate-pulse">
                  ESTABLISHING SECURE PROTOCOLS...
                </p>
              </motion.div>
            )}

            {/* Step 5: Success animation */}
            {step === "success" && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-6"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <svg
                    xmlns="http://www.w3.org/2500/svg"
                    className="h-8 w-8 animate-bounce"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white font-display">ลงชื่อเข้าใช้สำเร็จ!</h4>
                  <p className="text-xs text-[#C5C6C7]/80 font-mono">
                    ยินดีต้อนรับ {tempUser?.username} เข้าสู่ร้านค้าออนไลน์
                  </p>
                </div>

                <div className="bg-[#0B0C10] border border-[#45A29E]/20 rounded-xl p-4 font-mono text-[11px] text-[#C5C6C7] space-y-2">
                  <div className="flex justify-between items-center">
                    <span>บัญชีเชื่อมโยง:</span>
                    <span className="text-white font-semibold">
                      {tempUser?.platform.toUpperCase()} ID
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ยอดเงินเริ่มต้น:</span>
                    <span className="text-[#66FCF1] font-bold text-sm">
                      {tempUser?.balance.toLocaleString()} ฿
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleFinishSuccess}
                  className="w-full bg-white hover:bg-zinc-100 text-[#0B0C10] font-bold py-3.5 rounded-xl text-xs font-mono transition-all duration-200 active:scale-[0.98] shadow-lg cursor-pointer"
                >
                  START SHOPPING NOW →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
