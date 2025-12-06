"use client";

import * as React from "react";
import { authApi } from "@/api/auth"; // using your existing authApi

// Match your backend user model shape (minimal fields you care about)
export interface User {
  _id?: string;
  name?: string;
  email?: string;
  number?: string;
  tier?: "Free" | "Premium" | "UltraPremium";
  subscription?: {
    status?: "inactive" | "trial" | "active" | "past_due" | "cancelled";
    razorpaySubscriptionId?: string | null;
    razorpayPaymentIds?: string[];
    plan?: {
      name: string;
      baseAmount: number;
      gstPercent: number;
      totalAmount: number;
      currency: string;
    };
    currentPeriodEnd?: string | null;
  };
}

interface UseUserState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

/* ---------- small helpers (same idea as AppSidebar) ---------- */

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasUser(obj: unknown): obj is { user: unknown } {
  return isObject(obj) && "user" in obj;
}

function tryExtractUserFromResponse(res: unknown): User | null {
  if (!hasUser(res)) return null;
  const u = res.user;
  if (!isObject(u)) return null;

  return {
    _id: typeof u._id === "string" ? u._id : undefined,
    name: typeof u.name === "string" ? u.name : undefined,
    email: typeof u.email === "string" ? u.email : undefined,
    number: typeof u.number === "string" ? u.number : undefined,
    tier:
      typeof u.tier === "string" &&
      (u.tier === "Free" || u.tier === "Premium" || u.tier === "UltraPremium")
        ? u.tier
        : undefined,
    subscription: isObject(u.subscription) ? (u.subscription as User["subscription"]) : undefined,
  };
}

/**
 * useUser()
 * Fetches logged-in user using your existing `authApi.getMe()`,
 * without relying on `res.user` in TypeScript types.
 */
export function useUser(): UseUserState {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchUser = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.getMe(); // type is basically unknown / {}
      const extracted = tryExtractUserFromResponse(res as unknown);
      setUser(extracted);
    } catch (err) {
      console.error("useUser: failed to fetch user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    refresh: fetchUser,
  };
}
