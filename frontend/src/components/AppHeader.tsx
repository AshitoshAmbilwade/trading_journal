"use client";

import { useMemo, useState } from "react";
import { Menu, Bell, Crown, LogOut, User, ChevronDown, TrendingUp, Zap, Calendar, CheckCircle } from "lucide-react";
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
        {/* LEFT SECTION - WELCOME & QUOTE */}
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleSidebar}
            className="lg:hidden hover:bg-neutral-800"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="hidden lg:flex items-center gap-4">
            <div className="flex flex-col">
              <p className="text-sm text-neutral-300 font-medium">
                Welcome back, <span className="text-white font-semibold">{loadingUser ? "Loading…" : user?.name ?? "Trader"}</span>
              </p>
            </div>
            
            {/* Quote Section */}
            <div className="flex items-center gap-3">
              <div className="h-4 w-px bg-gradient-to-b from-neutral-700 via-neutral-600 to-neutral-700"></div>
              <div className="flex items-start gap-2 max-w-md">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-neutral-300 font-medium">
                  "{randomQuote}"
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Welcome */}
          <div className="lg:hidden">
            <p className="text-xs text-neutral-400">Welcome back</p>
            <p className="text-sm font-semibold text-white">
              {loadingUser ? "Loading…" : user?.name ?? "Trader"}
            </p>
          </div>
        </div>

        {/* CENTER SECTION - PLAN INFO */}
        <div className="hidden md:flex items-center">
          <div className={cn(
            "flex items-center gap-4 rounded-xl px-4 py-2.5 transition-all duration-300",
            planInfo.paid
              ? "border border-emerald-500/20 bg-gradient-to-r from-emerald-900/20 to-emerald-900/5"
              : "border border-indigo-500/20 bg-gradient-to-r from-indigo-900/20 to-indigo-900/5"
          )}>
            {/* Plan Status Indicator */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center justify-center h-9 w-9 rounded-lg",
                planInfo.paid 
                  ? "bg-emerald-500/10 border border-emerald-500/30" 
                  : "bg-indigo-500/10 border border-indigo-500/30"
              )}>
                {planInfo.paid ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Crown className="h-4 w-4 text-indigo-400" />
                )}
              </div>
              
              {/* Days Remaining */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="text-sm font-semibold text-white">
                    {planInfo.daysLeft !== null ? `${planInfo.daysLeft} days` : "No expiry"}
                  </span>
                </div>
                <span className="text-xs text-neutral-400">
                  {planInfo.paid ? "Plan active" : "Free plan"}
                </span>
              </div>
            </div>

            {/* Manage Button */}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 px-4 rounded-lg text-xs font-medium transition-all duration-300",
                planInfo.paid 
                  ? "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300" 
                  : "text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
              )}
              onClick={() => navigate("/pricing")}
            >
              {planInfo.paid ? (
                <span className="flex items-center gap-2">
                  Manage
                  <ChevronDown className="h-3 w-3" />
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  Upgrade
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* RIGHT SECTION - USER MENU */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button
            size="icon"
            variant="ghost"
            className="relative hover:bg-neutral-800 rounded-full"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full border border-neutral-950"></span>
          </Button>

          {/* Mobile Plan Button */}
          <div className="md:hidden">
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium gap-2",
                planInfo.paid 
                  ? "text-emerald-400" 
                  : "text-indigo-400"
              )}
              onClick={() => navigate("/pricing")}
            >
              {planInfo.paid ? (
                <>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{planInfo.daysLeft}d</span>
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
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-neutral-800/50 transition-all group"
              onClick={() => setOpen((s) => !s)}
            >
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-neutral-950 bg-emerald-500"></div>
              </div>
              
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-semibold text-white">
                  {user?.name ?? "User"}
                </span>
                <span className="text-xs text-neutral-400">
                  {planInfo.paid ? "Premium Member" : "Free Member"}
                </span>
              </div>
              
              <ChevronDown className={cn(
                "h-4 w-4 text-neutral-400 transition-transform",
                open && "rotate-180"
              )} />
            </button>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 top-12 w-64 rounded-xl border border-neutral-800 bg-neutral-900/95 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden">
                {/* User Info */}
                <div className="p-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-neutral-900 bg-emerald-500 flex items-center justify-center">
                        <CheckCircle className="h-2 w-2 text-neutral-900" />
                      </div>
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
                  
                  {/* Plan Info in Dropdown */}
                  <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-neutral-900 to-neutral-800 border border-neutral-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {planInfo.paid ? (
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Crown className="h-3.5 w-3.5 text-indigo-400" />
                        )}
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
                            left
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {!planInfo.paid && (
                      <button
                        className="mt-3 w-full py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
                        onClick={() => {
                          navigate("/pricing");
                          setOpen(false);
                        }}
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Upgrade to Pro
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

      {/* Mobile Quote Section */}
      <div className="lg:hidden px-4 py-3 border-t border-neutral-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-sm text-neutral-300 font-medium flex-1">
            "{randomQuote}"
          </p>
        </div>
      </div>

      {/* Mobile Plan Info */}
      <div className="md:hidden px-4 pb-3 border-t border-neutral-800 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center h-10 w-10 rounded-lg",
              planInfo.paid 
                ? "bg-emerald-500/10 border border-emerald-500/30" 
                : "bg-indigo-500/10 border border-indigo-500/30"
            )}>
              {planInfo.paid ? (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              ) : (
                <Crown className="h-5 w-5 text-indigo-400" />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-sm font-semibold text-white">
                  {planInfo.daysLeft !== null ? `${planInfo.daysLeft} days remaining` : "No expiry"}
                </span>
              </div>
              <span className="text-xs text-neutral-400">
                {planInfo.paid ? "Active plan" : "Free plan"}
              </span>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 px-4 rounded-lg text-xs font-medium",
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
    </header>
  );
}