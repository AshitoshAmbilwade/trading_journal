"use client";

import { useEffect, useState } from "react";
import {
  Home,
  MessageSquare,
  FileText,
  Settings,
  TrendingUp,
  LogOut,
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

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  name: string;
  email: string;
  tier: string;
  role?: string;
}

const navItems = [
  {
    icon: Home,
    label: "Dashboard",
    path: "/",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    path: "/analytics",
    gradient: "from-purple-500 to-pink-600",
    badge: "Soon",
  },
  {
    icon: MessageSquare,
    label: "Trade Buddy",
    path: "/trade-buddy",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    icon: FileText,
    label: "Reports",
    path: "/reports",
    gradient: "from-orange-500 to-yellow-500",
  },
  {
    icon: Award,
    label: "Achievements",
    path: "/achievements",
    gradient: "from-yellow-500 to-orange-600",
    badge: "New",
  },
];

const quickActions = [
  {
    icon: Wallet,
    label: "Sync Brokers",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Bell,
    label: "Notifications",
    gradient: "from-purple-500 to-pink-600",
    count: 3,
  },
];

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { currentPath, navigate } = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await authApi.getMe();
      console.log("User API response:", res); // should log the full object
      if (res?.user) setUser(res.user);      // ✅ use res.user instead of res.data
    } catch (err) {
      console.error("Failed to fetch user:", err);
    } finally {
      setLoadingUser(false);
    }
  };
  fetchUser();
}, []);


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
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "JD";

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && !isDesktop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen || isDesktop ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-screen w-[280px] bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border z-50 flex flex-col lg:static shadow-2xl"
      >
        {/* Logo/Header */}
        <div className="p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 opacity-50" />
          <div className="relative flex items-center gap-3 group cursor-pointer">
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

        {/* User Stats Card */}
        <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-purple-600/10 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center ring-2 ring-cyan-500/50">
              <span className="text-white">
                {loadingUser ? "..." : userInitials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {loadingUser ? "Loading..." : user?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {loadingUser
                  ? "..."
                  : `${user?.tier || "Free"} • ${user?.email}`}
              </p>
            </div>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-muted-foreground">Win Rate</p>
              <p className="text-green-500">68.5%</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-muted-foreground">Streak</p>
              <p className="text-orange-500">7 days</p>
            </div>
          </div>
        </div>

        <Separator className="mx-4 mb-4" />

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="text-xs text-muted-foreground px-3 mb-2 uppercase tracking-wider">
            Main Menu
          </p>

          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <motion.button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${
                  isActive
                    ? "bg-gradient-to-r text-white shadow-lg"
                    : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
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
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-100`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-3 relative z-10">
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0 h-5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </div>
              </motion.button>
            );
          })}

          <Separator className="my-4" />

          <p className="text-xs text-muted-foreground px-3 mb-2 uppercase tracking-wider">
            Quick Actions
          </p>
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-8 w-8 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}
                >
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">{action.label}</span>
              </div>
              {action.count && (
                <Badge className="bg-red-500 text-white text-[10px] h-5 min-w-5 flex items-center justify-center">
                  {action.count}
                </Badge>
              )}
            </motion.button>
          ))}
        </nav>

        <Separator className="mx-4 mb-4" />

        {/* Settings */}
        <div className="p-4 space-y-2">
          <Button
            onClick={() => handleNavigate("/settings")}
            variant="ghost"
            className={`w-full justify-start ${
              currentPath === "/settings"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </motion.aside>
    </>
  );
}
