"use client";
import { Button } from "./ui/button";
import { Menu, TrendingUp, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 z-50 w-full border-b transition-all duration-300 ${
        scrolled
          ? "border-border bg-background/95 backdrop-blur-xl shadow-lg shadow-primary/5"
          : "border-border/50 bg-background/80 backdrop-blur-lg"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-primary/25 relative">
              <TrendingUp className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 blur-sm opacity-50 -z-10"></div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl">Earnotic</span>
                <span className="text-lg sm:text-xl text-primary">Pro</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">Journal + Backtest</span>
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "Pricing", "Reviews", "Refer & Earn"].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase().replace(" & ", "-").replace(" ", "")}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                whileHover={{ y: -2 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hover:bg-secondary">
              Login
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
              Start Free
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="py-4 space-y-3">
                {["Features", "Pricing", "Reviews", "Refer & Earn"].map((item) => (
                  <motion.a
                    key={item}
                    href={`#${item.toLowerCase().replace(" & ", "-").replace(" ", "")}`}
                    className="block py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg px-3 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                    whileTap={{ scale: 0.98 }}
                  >
                    {item}
                  </motion.a>
                ))}
                <div className="pt-3 space-y-2">
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    Start Free
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
