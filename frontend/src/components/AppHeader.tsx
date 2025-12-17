"use client";

import { useMemo, useState } from "react";
import { Menu, Bell, Crown, LogOut, User, ChevronDown, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

  const traderQuotes = [
    "The market is a device for transferring money from the impatient to the patient.",
    "Risk comes from not knowing what you're doing.",
    "Time in the market beats timing the market.",
    "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
    "Bulls make money, bears make money, pigs get slaughtered.",
    "The four most dangerous words in investing are: 'this time it's different.'"
  ];

  const randomQuote = useMemo(() => {
    return traderQuotes[Math.floor(Math.random() * traderQuotes.length)];
  }, []);

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
      planType: user?.subscription?.plan?.interval || "monthly"
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-xl supports-[backdrop-filter]:bg-neutral-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleSidebar}
            className="lg:hidden hover:bg-neutral-800"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden md:flex flex-col">
            <p className="text-sm text-neutral-300 font-medium">
              Welcome back, <span className="text-white font-semibold">{loadingUser ? "Loading…" : user?.name ?? "Trader"}</span>!
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-neutral-300 italic max-w-md truncate">
                "{randomQuote}"
              </span>
            </div>
          </div>

          {/* Mobile Welcome */}
          <div className="md:hidden">
            <p className="text-xs text-neutral-400">Welcome back</p>
            <p className="text-sm font-semibold text-white">
              {loadingUser ? "Loading…" : user?.name ?? "Trader"}
            </p>
          </div>
        </div>

        {/* CENTER SECTION - DESKTOP PLAN INFO */}
        <div className="hidden md:flex items-center gap-6">
          <div className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all duration-300",
            planInfo.paid
              ? "border-emerald-500/30 bg-gradient-to-r from-emerald-900/40 via-neutral-900 to-emerald-900/20 hover:border-emerald-500/50"
              : "border-indigo-500/30 bg-gradient-to-r from-indigo-900/40 via-neutral-900 to-indigo-900/20 hover:border-indigo-500/50"
          )}>
            <div className={cn(
              "p-2 rounded-lg",
              planInfo.paid 
                ? "bg-gradient-to-br from-emerald-500 to-emerald-700" 
                : "bg-gradient-to-br from-indigo-500 to-purple-600"
            )}>
              <Crown className="h-4 w-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{planInfo.label}</span>
                {planInfo.planType && (
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded",
                    planInfo.paid 
                      ? "bg-emerald-500/20 text-emerald-300" 
                      : "bg-indigo-500/20 text-indigo-300"
                  )}>
                    {planInfo.planType === "year" ? "Annual" : "Monthly"}
                  </span>
                )}
              </div>
              {planInfo.daysLeft !== null && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs text-neutral-400">{planInfo.daysLeft} days remaining</span>
                  </div>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-neutral-800 mx-2"></div>
            <Button
              size="sm"
              variant={planInfo.paid ? "outline" : "default"}
              className={cn(
                "h-8 px-4 rounded-md text-xs font-semibold transition-all duration-300",
                planInfo.paid 
                  ? "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/60"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/20"
              )}
              onClick={() => navigate("/pricing")}
            >
              {planInfo.paid ? (
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  Manage
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Crown className="h-3 w-3" />
                  Upgrade @ ₹499
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            size="icon"
            variant="ghost"
            className="relative hover:bg-neutral-800 rounded-lg"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full border border-neutral-950" />
          </Button>

          {/* Plan Info - Mobile */}
          <div className="md:hidden">
            <Button
              size="sm"
              variant={planInfo.paid ? "outline" : "default"}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium gap-1.5",
                !planInfo.paid && "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              )}
              onClick={() => navigate("/pricing")}
            >
              {planInfo.paid ? (
                <>
                  <Crown className="h-3.5 w-3.5" />
                  <span>Plan</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Upgrade</span>
                </>
              )}
            </Button>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2 hover:bg-neutral-800 transition-all"
              onClick={() => setOpen((s) => !s)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold text-white">
                  {user?.name ?? "User"}
                </span>
                <span className="text-xs text-neutral-400">
                  {user?.tier ?? "Free Tier"}
                </span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-neutral-400 transition-transform",
                open && "rotate-180"
              )} />
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 top-12 w-64 rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden">
                {/* User Info */}
                <div className="p-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.name ?? "User"}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {user?.email ?? "user@example.com"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-3.5 w-3.5 text-emerald-400" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">
                            {planInfo.label}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {planInfo.planType === "year" ? "Annual Plan" : "Monthly Plan"}
                          </span>
                        </div>
                      </div>
                      {planInfo.daysLeft !== null && (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-semibold text-emerald-400">
                            {planInfo.daysLeft}d
                          </span>
                          <span className="text-xs text-neutral-500">
                            remaining
                          </span>
                        </div>
                      )}
                    </div>
                    {!planInfo.paid && (
                      <button
                        className="mt-3 w-full py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                        onClick={() => {
                          navigate("/pricing");
                          setOpen(false);
                        }}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          Upgrade to Pro
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2 space-y-1">
                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-800 transition-colors"
                    onClick={() => {
                      navigate("/settings");
                      setOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 text-neutral-400" />
                    Profile & Settings
                  </button>

                  <button
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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

      {/* Quote Section - Mobile */}
      <div className="md:hidden px-4 pb-3 border-t border-neutral-800 pt-3">
        <div className="flex items-start gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-neutral-300 italic">
            "{randomQuote}"
          </p>
        </div>
      </div>
    </header>
  );
}