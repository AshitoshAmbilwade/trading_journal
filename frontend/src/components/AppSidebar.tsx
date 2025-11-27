// src/components/AppSidebar.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Home,
  FileText,
  Settings,
  TrendingUp,
  BarChart3,
  Award,
  Wallet,
  Bell,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useRouter } from "../utils/routes";
import { Badge } from "./ui/badge";
import { authApi } from "../api/auth";
import { tradesApi, Trade } from "../api/trades";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  name?: string;
  email?: string;
  tier?: string;
  role?: string;
}

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

const navItems: {
  icon: IconType;
  label: string;
  path: string;
  gradient?: string;
  badge?: string;
}[] = [
  { icon: Home, label: "Dashboard", path: "/dashboard", gradient: "from-cyan-500 to-blue-600" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", gradient: "from-purple-500 to-pink-600", badge: "New" },
  { icon: FileText, label: "Reports", path: "/reports", gradient: "from-orange-500 to-yellow-500" },
  { icon: TrendingUp, label: "Trading Lab", path: "/trading-lab/strategies", gradient: "from-green-500 to-emerald-600" },
  { icon: Award, label: "Achievements", path: "/achievements", gradient: "from-yellow-500 to-orange-600", badge: "New" },
];

const quickActions: {
  icon: IconType;
  label: string;
  gradient?: string;
  count?: number;
}[] = [
  { icon: Wallet, label: "Sync Brokers", gradient: "from-cyan-500 to-blue-600" },
  { icon: Bell, label: "Notifications", gradient: "from-purple-500 to-pink-600", count: 3 },
];

/* ----------------- Helpers ----------------- */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function hasUser(obj: unknown): obj is { user: unknown } {
  return isObject(obj) && "user" in obj;
}

function tryExtractUser(obj: unknown): User | null {
  if (!hasUser(obj)) return null;
  const u = obj.user;
  if (!isObject(u)) return null;
  return {
    name: typeof u.name === "string" ? u.name : undefined,
    email: typeof u.email === "string" ? u.email : undefined,
    tier: typeof u.tier === "string" ? u.tier : undefined,
    role: typeof u.role === "string" ? u.role : undefined,
  };
}

function isTradeArray(v: unknown): v is Trade[] {
  return Array.isArray(v) && v.every((it) => isObject(it));
}

function extractTradesFromResponse(res: unknown): Trade[] {
  // Accept either Trade[] or { trades: Trade[] } or { data: { trades: Trade[] } }, etc.
  if (isTradeArray(res)) return res as Trade[];

  if (isObject(res)) {
    const maybeTrades = (res as Record<string, unknown>).trades ?? (res as Record<string, unknown>).data ?? (res as Record<string, unknown>).items;
    if (isTradeArray(maybeTrades)) return maybeTrades as Trade[];
  }

  return [];
}

function getPnlFromUnknown(t: unknown): number {
  if (!isObject(t)) return 0;
  const raw = (t as Record<string, unknown>).pnl ?? (t as Record<string, unknown>).profit ?? (t as Record<string, unknown>).pnlValue;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw.replace(/[^0-9\.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/* ----------------- Component ----------------- */

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { currentPath, navigate } = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // New: stats from trades
  const [loadingStats, setLoadingStats] = useState(true);
  const [winRate, setWinRate] = useState<number | null>(null); // percent
  const [bestPnl, setBestPnl] = useState<number | null>(null); // INR numeric

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const res = await authApi.getMe();
        if (isDev) {
          // avoid logging entire user object in prod
          const u = tryExtractUser(res);
          console.debug("[AppSidebar] fetched user:", { name: u?.name, email: u?.email, tier: u?.tier });
        }
        if (mounted) {
          const extracted = tryExtractUser(res);
          setUser(extracted);
        }
      } catch (err) {
        if (isDev) console.error("[AppSidebar] Failed to fetch user:", err);
        else console.error("[AppSidebar] Failed to fetch user");
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };
    fetchUser();
    return () => { mounted = false; };
  }, [isDev]);

  useEffect(() => {
    const checkWidth = () => setIsDesktop(window.innerWidth >= 1024);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (!isDesktop) onClose();
  };

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "JD";

  const activePath = currentPath === "/" ? "/dashboard" : currentPath;

  // ---------------- Stats helpers ----------------
  function computeWinRate(trades: Trade[]) {
    if (!Array.isArray(trades) || trades.length === 0) return 0;
    const wins = trades.filter((t) => getPnlFromUnknown(t) > 0).length;
    return (wins / trades.length) * 100;
  }

  function computeBestPnl(trades: Trade[]) {
    if (!Array.isArray(trades) || trades.length === 0) return 0;
    const pnlVals = trades.map((t) => getPnlFromUnknown(t));
    return Math.max(...pnlVals);
  }

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        const res = await tradesApi.getAll();
        const loaded = extractTradesFromResponse(res);
        if (!mounted) return;

        if (isDev) console.debug("[AppSidebar] loaded trades count:", loaded.length);

        const rate = computeWinRate(loaded);
        const best = computeBestPnl(loaded);

        if (mounted) {
          setWinRate(Number(rate.toFixed(1)));
          setBestPnl(Number(best));
        }
      } catch (err) {
        if (isDev) console.error("[AppSidebar] Failed to fetch trades for stats:", err);
        else console.error("[AppSidebar] Failed to fetch trades for stats");
        if (mounted) {
          setWinRate(0);
          setBestPnl(0);
        }
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };

    loadStats();
    return () => { mounted = false; };
  }, [isDev]);

  const formatINR = (v: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v);

  return (
    <>
      {isOpen && !isDesktop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: isOpen || isDesktop ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-screen w-[280px] bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border z-50 flex flex-col lg:static shadow-2xl"
      >
        <div className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 opacity-50" />
          <div
            className="relative flex items-center gap-3 group cursor-pointer"
            onClick={() => handleNavigate("/dashboard")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleNavigate("/dashboard");
            }}
          >
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/50 transition-shadow">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Earnotic
              </h2>
              <p className="text-xs text-muted-foreground">Trading Journal</p>
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center ring-2 ring-cyan-500/50">
              <span className="text-white">{loadingUser ? "..." : userInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{loadingUser ? "Loading..." : user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {loadingUser ? "..." : `${user?.tier || "Free"} • ${user?.email ?? ""}`}
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-muted-foreground">Win Rate</p>
              <p className="text-green-500">
                {loadingStats ? "..." : `${winRate !== null ? winRate.toFixed(1) : "0.0"}%`}
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-muted-foreground">Best P&L</p>
              <p className="text-orange-500">
                {loadingStats ? "..." : bestPnl !== null ? formatINR(bestPnl) : formatINR(0)}
              </p>
            </div>
          </div>
        </div>

        <Separator className="mx-4 mb-4" />

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="text-xs text-muted-foreground px-3 mb-2 uppercase tracking-wider">Main Menu</p>

          {navItems.map((item) => {
            const isActive = activePath === item.path;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${isActive ? "bg-gradient-to-r text-white shadow-lg" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"}`}
                style={
                  isActive
                    ? {
                        backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                        backgroundSize: "200% 200%",
                      }
                    : undefined
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient ?? "from-cyan-500 to-blue-600"} opacity-100`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  {item.badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">{item.badge}</Badge>}
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </div>
              </motion.button>
            );
          })}

          <Separator className="my-4" />

          <p className="text-xs text-muted-foreground px-3 mb-2 uppercase tracking-wider">Quick Actions</p>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${action.gradient ?? "from-cyan-500 to-blue-600"} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm">{action.label}</span>
                </div>
                {action.count && <Badge className="bg-red-500 text-white text-[10px] h-5 min-w-5 flex items-center justify-center">{action.count}</Badge>}
              </motion.button>
            );
          })}
        </nav>

        <Separator className="mx-4 mb-4" />

        <div className="p-4 space-y-2">
          <Button
            onClick={() => handleNavigate("/settings")}
            variant="ghost"
            className={`w-full justify-start ${activePath === "/settings" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </motion.aside>
    </>
  );
}

export default AppSidebar;
