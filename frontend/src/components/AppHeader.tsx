"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Menu,
  Bell,
  LogOut,
  User,
  ChevronDown,
  TrendingUp,
  Zap,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "@/utils/routes";

interface AppHeaderProps {
  user: any;
  loadingUser: boolean;
  onToggleSidebar: () => void;
  onLogout: () => Promise<void>;
}

export function AppHeader({
  user,
  loadingUser,
  onToggleSidebar,
  onLogout,
}: AppHeaderProps) {
  const { navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<string | null>(null);

  const traderQuotes = useMemo(
    () => [
      "The market is a device for transferring money from the impatient to the patient.",
      "Risk comes from not knowing what you're doing.",
      "Time in the market beats timing the market.",
      "The four most dangerous words in investing are: this time it's different.",
    ],
    []
  );

  useEffect(() => {
    setQuote(traderQuotes[Math.floor(Math.random() * traderQuotes.length)]);
  }, [traderQuotes]);

  const planInfo = useMemo(() => {
    const end = user?.subscription?.currentPeriodEnd
      ? new Date(user.subscription.currentPeriodEnd)
      : null;

    if (!end) return { daysLeft: null, paid: false };

    return {
      daysLeft: Math.ceil(
        (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
      paid: true,
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="hidden lg:flex items-center gap-4">
              <p className="text-sm text-neutral-300">
                Welcome back,{" "}
                <span className="font-semibold text-white">
                  {loadingUser ? "…" : user?.name ?? "Trader"}
                </span>
              </p>

              {quote && (
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="truncate max-w-md">
                    “{quote}”
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CENTER */}
          <div className="hidden md:flex items-center gap-2 text-sm text-neutral-300">
            {planInfo.paid ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span>
                  {planInfo.daysLeft} days remaining
                </span>
                <button
                  onClick={() => navigate("/pricing")}
                  className="text-emerald-400 hover:underline underline-offset-4"
                >
                  Manage
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/pricing")}
                className="flex items-center gap-2 text-indigo-400 hover:underline underline-offset-4"
              >
                <Zap className="h-4 w-4" />
                Upgrade
              </button>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Bell className="h-5 w-5" />
            </Button>

            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/5 transition"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-neutral-400 transition-transform",
                    open && "rotate-180"
                  )}
                />
              </button>

              {open && (
                <div className="absolute right-0 top-10 w-56 rounded-lg bg-neutral-900 shadow-xl">
                  <button
                    className="w-full px-4 py-2 text-sm text-left hover:bg-white/5"
                    onClick={() => navigate("/settings")}
                  >
                    Profile & Settings
                  </button>
                  <button
                    className="w-full px-4 py-2 text-sm text-left text-red-400 hover:bg-red-500/10"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
