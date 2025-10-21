"use client";
import { motion, AnimatePresence } from "motion/react";
import { Router, useRouter } from "../../utils/routes";
import { AppLayout } from "@/components/AppLayout";

import { Dashboard } from "./Dashboard";
import { TradeBuddy } from "./TradeBuddy";
import { Reports } from "./Reports";
import { Settings } from "./Settings";



export default function App() {
  const { currentPath } = useRouter();
  const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};
  return (
    
    <AppLayout>
      <AnimatePresence mode="wait">
        {currentPath === "/" && (
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
        {currentPath === "/trade-buddy" && (
          <motion.div
            key="trade-buddy"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <TradeBuddy />
          </motion.div>
        )}
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
