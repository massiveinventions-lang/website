/**
 * Supabase browser client + auth hook.
 *
 * In dev with the backend in `MOCK_INTEGRATIONS=true` mode, Supabase
 * itself isn't required — the backend accepts OTP-issued session JWTs as
 * bearer tokens, and the token is stored in localStorage.
 *
 * When Supabase IS configured, real email-OTP goes through Supabase Auth's
 * `signInWithOtp` + `verifyOtp` methods. This file abstracts both flows
 * behind a single `requestOtp` / `verifyOtp` API.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { API_BASE } from "./api";

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!_client) {
    _client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "massive-inventions-auth",
      },
    });
  }
  return _client;
}

export const supabaseEnabled = (): boolean => Boolean(url && anonKey);

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role: "customer" | "admin";
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
}

const TOKEN_KEY = "dev_token";
const EMAIL_KEY = "dev_email";

/** Notify same-tab listeners that the session changed. */
function emitAuthChange() {
  window.dispatchEvent(new Event("authchange"));
}

/**
 * Reactive auth state. Subscribes to Supabase onAuthStateChange when
 * Supabase is configured, and to localStorage events for the dev token
 * otherwise.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const sb = getSupabase();

    if (!sb) {
      // Dev mock: read JWT from localStorage, decode the email out of it.
      const read = () => {
        const token = localStorage.getItem(TOKEN_KEY) ?? "";
        const email = localStorage.getItem(EMAIL_KEY) ?? "";
        if (token && email) {
          setState({
            user: {
              id: token,
              email,
              name: email.split("@")[0],
              role: "customer",
            },
            loading: false,
          });
        } else {
          setState({ user: null, loading: false });
        }
      };
      read();
      window.addEventListener("storage", read);
      window.addEventListener("authchange", read);
      return () => {
        window.removeEventListener("storage", read);
        window.removeEventListener("authchange", read);
      };
    }

    // Real Supabase path
    let cancelled = false;
    sb.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState({
        user: data.session?.user
          ? {
              id: data.session.user.id,
              email: data.session.user.email ?? "",
              name:
                (data.session.user.user_metadata as { name?: string } | null)
                  ?.name ?? undefined,
              role: (data.session.user.user_metadata as { role?: string } | null)?.role === "admin" ? "admin" : "customer",
            }
          : null,
        loading: false,
      });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setState({
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email ?? "",
              name:
                (session.user.user_metadata as { name?: string } | null)
                  ?.name ?? undefined,
              role: (session.user.user_metadata as { role?: string } | null)?.role === "admin" ? "admin" : "customer",
            }
          : null,
        loading: false,
      });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** Returns the JWT to send in `Authorization: Bearer`. */
export async function getAuthToken(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) {
    return localStorage.getItem(TOKEN_KEY);
  }
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

// ---- OTP-based authentication ----

export type RequestOtpResult = {
  error: string | null;
  devCode?: string; // mock mode only — shown in the UI for testing
  cooldownSeconds?: number;
};

export async function requestOtp(email: string): Promise<RequestOtpResult> {
  const sb = getSupabase();
  if (!sb) {
    // Dev/mock path: call our backend.
    const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      devCode?: string;
      cooldownSeconds?: number;
      error?: string;
    };
    if (!res.ok) {
      return { error: body.error ?? "Could not send code" };
    }
    return {
      error: null,
      devCode: body.devCode,
      cooldownSeconds: body.cooldownSeconds,
    };
  }
  // Real Supabase path: use Supabase's built-in OTP flow.
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  return { error: error?.message ?? null };
}

export type VerifyOtpResult = {
  error: string | null;
};

export async function verifyOtp(
  email: string,
  code: string
): Promise<VerifyOtpResult> {
  const sb = getSupabase();
  if (!sb) {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      token?: string;
      error?: string;
    };
    if (!res.ok || !body.token) {
      return { error: body.error ?? "Invalid code" };
    }
    localStorage.setItem(TOKEN_KEY, body.token);
    localStorage.setItem(EMAIL_KEY, email);
    emitAuthChange();
    return { error: null };
  }
  // Real Supabase path
  const { error } = await sb.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    emitAuthChange();
    return;
  }
  await sb.auth.signOut();
}

// ---- Password auth (legacy) ----
// Some components still import signInWithPassword / signUpWithPassword.
// This project primarily uses OTP auth (requestOtp / verifyOtp). To keep
// the app running, these legacy functions are mapped to OTP flow.
//
// In dev mode (no Supabase env vars configured), the backend endpoints
// /api/auth/request-otp and /api/auth/verify-otp must exist.
// In real Supabase mode, OTP is handled via sb.auth.signInWithOtp.

export type PasswordAuthResult = { error: string | null };

export async function signInWithPassword(
  email: string,
  _password: string
): Promise<PasswordAuthResult> {
  // Password ignored; trigger OTP.
  const otp = await requestOtp(email);
  return { error: otp.error };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  name: string
): Promise<PasswordAuthResult> {
  // Password and name ignored for OTP. shouldCreateUser=true is handled in requestOtp.
  const otp = await requestOtp(email);
  // Silence unused vars while keeping signature stable.
  void password;
  void name;
  return { error: otp.error };
}

