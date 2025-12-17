"use client";

import { useEffect, useState, ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { AIBuddyWidget } from "./AIBuddyWidget";
import { AppHeader } from "./AppHeader";
import { useRouter } from "@/utils/routes";
import { authApi } from "@/api/auth";
import { toast } from "./ui/use-toast";

interface AppLayoutProps {
  children: ReactNode;
}

interface User {
  name?: string;
  email?: string;
  tier?: "Free" | "Premium" | "UltraPremium";
  subscription?: {
    status?: string;
    currentPeriodEnd?: string | Date | null;
    plan?: { name?: string };
  };
}

/** Narrow guard for API response shape: { user?: User } */
function hasUser(obj: unknown): obj is { user?: User } {
  return typeof obj === "object" && obj !== null && "user" in (obj as Record<string, unknown>);
}

/** Detect structured unauthorized sentinel from apiHandler */
function isUnauthorizedError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const r = err as Record<string, unknown>;
  return r["unauthorized"] === true;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // user state
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const { navigate } = useRouter();
  const isDev = process.env.NODE_ENV === "development";

  /* ---------------- Load user ---------------- */
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      setLoadingUser(true);
      try {
        const res = await authApi.getMe();
        const u = hasUser(res) && res.user ? res.user : null;

        if (isDev) {
          console.debug("[AppLayout] fetched user:", u ? {
            name: u.name,
            tier: u.tier,
          } : null);
        }

        if (mounted) setUser(u);
      } catch (err: unknown) {
        if (isUnauthorizedError(err)) {
          if (mounted) setUser(null);
        } else {
          if (isDev) console.error("[AppLayout] getMe failed:", err);
          if (mounted) setUser(null);
        }
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    loadUser();

    // refresh user when token changes in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") loadUser();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [isDev]);

  /* ---------------- Logout ---------------- */
  const performHardRedirectToLanding = () => {
    try {
      window.location.replace("/");
    } catch {
      window.location.href = "/";
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("token");
      setUser(null);

      // notify other tabs
      try {
        const ev = new StorageEvent("storage", { key: "token", newValue: null });
        window.dispatchEvent(ev);
      } catch {}

      toast({
        title: "Signed out",
        description: "You have been logged out.",
      });

      try {
        navigate("/");
      } catch {}

      setTimeout(() => performHardRedirectToLanding(), 100);
    } catch (err) {
      console.error("Logout failed:", err);
      toast({
        title: "Logout failed",
        description: "Something went wrong while logging out.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-black/80">
      {/* Sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <AppHeader
          user={user}
          loadingUser={loadingUser}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onLogout={logout}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* AI Buddy */}
      <AIBuddyWidget />
    </div>
  );
}

export default AppLayout;
