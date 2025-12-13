// src/app/dashboard/dashboardPage.tsx
"use client";

import { motion, AnimatePresence } from "motion/react";
import { Router, useRouter } from "../../utils/routes";
import { AppLayout } from "../../components/AppLayout";
import { Dashboard } from "./Dashboard";
import { TradeBuddy } from "./TradeBuddy";
import  Reports  from "./Reports";
import { Settings } from "./Settings";
import { AnalyticsShell } from "../../components/analytics";
import PricingPage from "../pricing/page";
import TradingLabStrategiesPage from "./../trading-lab/strategies/page";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.4,
};

function AppRoutes() {
  const { currentPath } = useRouter();

  // Treat "/" as dashboard as well — ensures dashboard renders immediately
  // when user is navigated programmatically from the landing page.
  const showDashboard =
    currentPath === "/dashboard" ||
    currentPath === "/" ||
    currentPath.startsWith("/dashboard");

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        {/* 🔥 UPDATED: Dashboard now handled at /dashboard — also handle "/" */}
        {showDashboard && (
          <motion.div
            key={`dashboard:${currentPath}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Dashboard />
          </motion.div>
        )}

        {/* Analytics */}
        {currentPath === "/analytics" && (
          <motion.div
            key={`analytics:${currentPath}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <AnalyticsShell />
          </motion.div>
        )}

        {/* Reports */}
        {currentPath === "/reports" && (
          <motion.div
            key={`reports:${currentPath}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Reports />
          </motion.div>
        )}

        {/* Trading Lab → Strategies */}
        {currentPath === "/trading-lab/strategies" && (
          <motion.div
            key={`trading-lab-strategies:${currentPath}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <TradingLabStrategiesPage />
          </motion.div>
        )}

        {currentPath === "/pricing" && (
          <motion.div
            key={`Pricing Plan:${currentPath}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <PricingPage />
          </motion.div>
        )}

        {/* Settings */}
        {currentPath === "/settings" && (
          <motion.div
            key={`settings:${currentPath}`}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Settings />
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
