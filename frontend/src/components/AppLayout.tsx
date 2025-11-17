// src/components/AppLayout.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { Menu, Bell, LogOut, User as UserIcon } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { AIBuddyWidget } from "./AIBuddyWidget";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useRouter } from "@/utils/routes";
import { authApi } from "@/api/auth";
import { toast } from "./ui/use-toast";

interface AppLayoutProps {
  children: ReactNode;
}

interface User {
  name?: string;
  email?: string;
  tier?: string;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // user state
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  const { navigate } = useRouter();

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      setLoadingUser(true);
      try {
        const res = await authApi.getMe();
        const u = res && (res as any).user ? (res as any).user : null;
        if (isDev)
          console.debug(
            "[AppLayout] fetched user (masked):",
            u ? { name: u.name, tier: u.tier } : null
          );
        if (mounted) setUser(u);
      } catch (err: any) {
        // handle structured unauthorized sentinel from apiHandler
        if (err?.unauthorized) {
          // No token / invalid token — silent and expected.
          if (mounted) setUser(null);
        } else {
          // unexpected error — log in dev, but keep UX quiet in prod
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

  const performHardRedirectToLanding = () => {
    try {
      // replace prevents an extra history entry
      window.location.replace("/");
    } catch (err) {
      // last resort
      window.location.href = "/";
    }
  };

  const logout = async () => {
    // close menu immediately
    setProfileOpen(false);

    try {
      // clear client token + local user state
      localStorage.removeItem("token");
      setUser(null);

      // also broadcast a storage event so other tabs react
      try {
        // some browsers won't allow constructing StorageEvent directly; guard it
        const ev = new StorageEvent("storage", { key: "token", newValue: null as any });
        window.dispatchEvent(ev);
      } catch {
        // fallback: set and remove a dummy key
        try {
          localStorage.setItem("__auth__cleared", Date.now().toString());
          localStorage.removeItem("__auth__cleared");
        } catch {}
      }

      toast({
        title: "Signed out",
        description: "You have been logged out.",
      });

      // First try SPA navigation (keeps Router state consistent)
      try {
        navigate("/");
      } catch (err) {
        if (isDev) console.debug("[AppLayout] navigate('/') threw:", err);
      }

      // If SPA somehow doesn't unmount dashboard or still shows protected UI,
      // force a hard redirect to landing to fully reset the app state.
      // Use a small timeout to let SPA navigate() run first.
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

  const userInitials = (() => {
    if (!user?.name) return "JD";
    return user.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  })();

  return (
    <div className="flex min-h-screen bg-black/80">
      {/* Sidebar */}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-60 bg-black/90 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Mobile Menu */}
            <div className="flex items-center gap-3 flex-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 relative">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center gap-2 mr-auto -ml-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm">E</span>
                </div>
              </div>

              {/* Notifications */}
              <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                  3
                </Badge>
              </Button>

              {/* Profile */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center gap-2 px-2"
                  onClick={() => setProfileOpen((s) => !s)}
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center ring-2 ring-cyan-500/50">
                    <span className="text-white text-sm">{loadingUser ? "..." : userInitials}</span>
                  </div>
                  <span className="text-sm hidden md:inline">
                    {loadingUser ? "Loading..." : user?.name ?? "John Doe"}
                  </span>
                </Button>

                {/* Dropdown */}
                {profileOpen && (
                  <div
                    role="menu"
                    aria-label="Profile menu"
                    className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center ring-2 ring-cyan-500/50">
                          <span className="text-white text-sm">{loadingUser ? "..." : userInitials}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user?.name ?? "John Doe"}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.tier ?? "Free"} • {user?.email ?? ""}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col p-2">
                      <button
                        className="text-sm text-left px-3 py-2 rounded-md hover:bg-muted/50"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/settings");
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4" /> <span>View profile</span>
                        </div>
                      </button>

                      <button
                        className="text-sm text-left px-3 py-2 rounded-md hover:bg-muted/50 text-destructive"
                        onClick={() => logout()}
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="h-4 w-4" /> <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* AI Buddy Widget */}
      <AIBuddyWidget />
    </div>
  );
}

export default AppLayout;
