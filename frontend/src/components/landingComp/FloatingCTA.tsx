"use client";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { TrendingUp, X } from "lucide-react";
import { Button } from "../ui/button";

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling down 500px
      if (window.scrollY > 500 && !isDismissed) {
        setIsVisible(true);
      } else if (window.scrollY <= 500) {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <div className="relative">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-secondary border border-border hover:bg-destructive/20 hover:border-destructive transition-all flex items-center justify-center z-10"
            >
              <X className="h-3 w-3" />
            </button>

            {/* CTA Card */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-primary via-blue-600 to-purple-600 rounded-2xl shadow-2xl shadow-primary/50 p-4 pr-6 flex items-center gap-4 border border-primary/50"
            >
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/90 mb-1">Ready to auto-sync your trades?</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Connect Broker Free
                </Button>
              </div>
            </motion.div>

            {/* Pulse animation */}
            <div className="absolute inset-0 -z-10">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-primary rounded-2xl blur-xl"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
