import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestOtp, verifyOtp, useSession } from "@/lib/supabase";

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

type Step = "email" | "code";

const OTP_LENGTH = 6;

export default function AuthModal({
  open,
  onClose,
  initialMode = "signin",
}: Props) {
  const { user } = useSession();

  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Auto-focus the first input when the modal opens / step changes.
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      // Reset after the close animation completes
      const t = setTimeout(() => {
        setStep("email");
        setEmail("");
        setCode("");
        setError(null);
        setInfo(null);
        setCooldown(0);
        setDevCode(null);
      }, 250);
      return () => clearTimeout(t);
    } else {
      // Focus appropriate field on open
      const t = setTimeout(() => {
        if (step === "email") emailRef.current?.focus();
        else codeRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cooldown countdown timer for "Resend code"
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // If user is already signed in, close immediately
  if (user && open) onClose();

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setInfo(null);
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSendingCode(true);
    try {
      const res = await requestOtp(email);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.cooldownSeconds && res.cooldownSeconds > 0) {
        setCooldown(res.cooldownSeconds);
      } else {
        setCooldown(45); // default cooldown
      }
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      // Always show the production-style success message. The dev code
      // is still returned by the backend for local debugging (visible
      // in React DevTools) but never shown to end users — there's no way
      // to log in without a real email inbox.
      setInfo(
        `We sent a 6-digit code to ${email}. Enter it below to continue.`
      );
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }
    setVerifying(true);
    try {
      const res = await verifyOtp(email, code);
      if (res.error) {
        setError(res.error);
        return;
      }
      // Success! useSession() will update automatically and trigger
      // the `if (user && open) onClose()` guard at the top.
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify code");
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    // Only digits, single character
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const newCode = code.padEnd(OTP_LENGTH, " ").split("");
    newCode[index] = digit || " ";
    const joined = newCode.join("").trimEnd();
    setCode(joined);
    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (text.length > 0) {
      e.preventDefault();
      setCode(text);
      // Focus the last filled box
      const lastIndex = Math.min(text.length, OTP_LENGTH - 1);
      codeRefs.current[lastIndex]?.focus();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white rounded-3xl shadow-2xl w-[calc(100%-2rem)] max-w-sm p-6 sm:p-7 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-xl font-black tracking-tight mb-1 pr-8">
              {step === "email"
                ? mode === "signin"
                  ? "Welcome back"
                  : "Create your account"
                : "Check your email"}
            </h2>
            <p className="text-xs text-[var(--foreground)]/60 mb-4">
              {step === "email"
                ? mode === "signin"
                  ? "We'll email you a code. No password needed."
                  : "Enter your email and we'll send a code to get you started."
                : `We sent a 6-digit code to ${email}.`}
            </p>

            {/* STEP 1: email entry */}
            {step === "email" && (
              <form onSubmit={handleSendCode} className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--foreground)]/40 pointer-events-none" />
                  <input
                    ref={emailRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 pl-9 pr-3 text-sm rounded-xl border border-[var(--foreground)]/15 focus:border-[var(--accent-brown)] focus:outline-none transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={sendingCode || !email}
                  className="w-full h-11 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white text-sm font-bold transition-colors mt-1 disabled:opacity-60"
                >
                  {sendingCode ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Sending code…
                    </>
                  ) : (
                    <>
                      Send me a sign-in code
                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="mt-3 text-center text-xs text-[var(--foreground)]/60">
                  {mode === "signin" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signup");
                          setError(null);
                        }}
                        className="font-semibold text-[var(--accent-brown)] hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setMode("signin");
                          setError(null);
                        }}
                        className="font-semibold text-[var(--accent-brown)] hover:underline"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>

                <p className="mt-2 text-[10px] text-center text-[var(--foreground)]/40">
                  Passwordless. Just verify your email — we never store passwords.
                </p>
              </form>
            )}

            {/* STEP 2: OTP entry */}
            {step === "code" && (
              <form onSubmit={handleVerify} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)]/60 mb-2 uppercase tracking-wider text-center">
                    Verification code
                  </label>
                  <div
                    className="flex justify-center gap-2"
                    onPaste={handleCodePaste}
                  >
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          codeRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={code[i] ?? ""}
                        onChange={(e) => handleCodeInput(i, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                        autoComplete="one-time-code"
                        aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                        className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold rounded-xl border border-[var(--foreground)]/15 focus:border-[var(--accent-brown)] focus:outline-none transition-colors bg-white"
                      />
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {info && !error && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
                    <span>{info}</span>
                  </div>
                )}

                {devCode && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 font-mono">
                    <span>Dev mode active! Code is: {devCode}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={verifying || code.length !== OTP_LENGTH}
                  className="w-full h-11 rounded-xl bg-[var(--foreground)] hover:bg-[var(--accent-brown)] text-white text-sm font-bold transition-colors disabled:opacity-60"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                      Verify & sign in
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setError(null);
                    }}
                    className="text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
                  >
                    ← Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendCode()}
                    disabled={cooldown > 0 || sendingCode}
                    className="text-[var(--accent-brown)] font-semibold hover:underline disabled:text-[var(--foreground)]/30 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : sendingCode
                      ? "Sending…"
                      : "Resend code"}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}