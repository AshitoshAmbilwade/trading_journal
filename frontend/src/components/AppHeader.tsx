"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Menu,
  Bell,
  Crown,
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

  // 🔒 Hydration-safe quote handling
  const [quote, setQuote] = useState<string | null>(null);

  const traderQuotes = useMemo(
    () => [
      "The market is a device for transferring money from the impatient to the patient.",
      "Risk comes from not knowing what you're doing.",
      "Time in the market beats timing the market.",
      "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
      "Bulls make money, bears make money, pigs get slaughtered.",
      "The four most dangerous words in investing are: 'this time it's different.'",
    ],
    []
  );

  // ✅ Run ONLY on client after mount
  useEffect(() => {
    const random =
      traderQuotes[Math.floor(Math.random() * traderQuotes.length)];
    setQuote(random);
  }, [traderQuotes]);

  const planInfo = useMemo(() => {
    const end = user?.subscription?.currentPeriodEnd
      ? new Date(user.subscription.currentPeriodEnd)
      : null;

    if (!end) {
      return { label: "Free Plan", daysLeft: null, paid: false };
    }

    const daysLeft = Math.ceil(
      (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      label: user?.subscription?.plan?.name ?? "Active Plan",
      daysLeft,
      paid: true,
      planType: user?.subscription?.plan?.interval || "monthly",
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 
    bg-gradient-to-b from-neutral-950/90 to-neutral-950/70 
    backdrop-blur-xl supports-[backdrop-filter]:bg-neutral-950/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* LEFT */}
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleSidebar}
            className="lg:hidden hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden lg:flex items-center gap-4">
            <div>
              <p className="text-sm text-neutral-300 font-medium">
                Welcome back,{" "}
                <span className="text-white font-semibold">
                  {loadingUser ? "Loading…" : user?.name ?? "Trader"}
                </span>
              </p>
            </div>

            {quote && (
              <div className="flex items-center gap-3">
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-start gap-2 max-w-md rounded-full 
                bg-white/5 px-4 py-2 border border-white/10 
                hover:bg-white/10 transition-all">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400 mt-0.5" />
                  <p className="text-xs text-neutral-300 font-medium">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CENTER */}
        <div className="hidden md:flex">
          <div
            className={cn(
              "flex items-center gap-5 rounded-2xl px-5 py-3 shadow-lg transition-all hover:scale-[1.01]",
              planInfo.paid
                ? "border border-emerald-500/20 bg-gradient-to-r from-emerald-900/30 via-emerald-900/10 to-transparent"
                : "border border-indigo-500/20 bg-gradient-to-r from-indigo-900/30 via-indigo-900/10 to-transparent"
            )}
          >
            <div
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center",
                planInfo.paid
                  ? "bg-emerald-500/10 border border-emerald-500/30"
                  : "bg-indigo-500/10 border border-indigo-500/30"
              )}
            >
              {planInfo.paid ? (
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              ) : (
                <Crown className="h-4 w-4 text-indigo-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-sm font-semibold text-white">
                  {planInfo.daysLeft !== null
                    ? `${planInfo.daysLeft} days`
                    : "No expiry"}
                </span>
              </div>
              <span className="text-xs text-neutral-400">
                {planInfo.paid ? "Plan active" : "Free plan"}
              </span>
            </div>

            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 px-4 rounded-lg text-xs",
                planInfo.paid
                  ? "text-emerald-400 hover:bg-emerald-500/10"
                  : "text-indigo-400 hover:bg-indigo-500/10"
              )}
              onClick={() => navigate("/pricing")}
            >
              {planInfo.paid ? "Manage" : "Upgrade"}
            </Button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="relative rounded-full bg-white/5 hover:bg-white/10"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full border border-neutral-950" />
          </Button>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/10 transition-all"
            >
              <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 flex items-center justify-center text-white font-semibold shadow-lg">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-neutral-950" />
              </div>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-neutral-400 transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>

            {open && (
              <div className="absolute right-0 top-12 w-72 rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur-2xl shadow-2xl">
                <div className="p-2">
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
                    onClick={() => navigate("/settings")}
                  >
                    <User className="h-4 w-4 text-neutral-400" />
                    Profile & Settings
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
