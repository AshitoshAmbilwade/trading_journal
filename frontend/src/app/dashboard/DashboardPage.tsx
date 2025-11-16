"use client";
import { motion, AnimatePresence } from "motion/react";
import { Router, useRouter } from "../../utils/routes";
import { AppLayout } from "../../components/AppLayout";
import { Dashboard } from "./Dashboard";
import { TradeBuddy } from "./TradeBuddy";
import { Reports } from "./Reports";
import { Settings } from "./Settings";
import { AnalyticsShell } from "../../components/analytics";
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

  return (
    <AppLayout>
      <AnimatePresence mode="wait">

        {/* 🔥 UPDATED: Dashboard now handled at /dashboard */}
        {currentPath === "/dashboard" && (
          <motion.div
            key="dashboard"
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
            key="analytics"
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
            key="reports"
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
            key="trading-lab-strategies"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <TradingLabStrategiesPage />
          </motion.div>
        )}

        {/* Settings */}
        {currentPath === "/settings" && (
          <motion.div
            key="settings"
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
