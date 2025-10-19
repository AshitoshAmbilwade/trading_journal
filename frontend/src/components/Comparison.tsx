"use client";
import { motion } from "motion/react";
import { Check, X, Zap, Shield } from "lucide-react";
import { Button } from "./ui/button";

const features = [
  "Auto-Sync with Brokers",
  "Strategy Backtesting",
  "AI Performance Analysis",
  "Zerodha/Upstox/Dhan Integration",
  "Trade Journal & Notes",
  "ITR-Ready Tax Reports",
  "Advanced Analytics Dashboard",
  "Mobile & Desktop Apps",
];

export function Comparison() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-background via-secondary/10 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-400">The Smart Choice</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">
            Manual Journaling vs{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Earnotic Auto-Sync
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Stop wasting hours logging trades manually. Auto-sync and focus on trading better.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl"
        >
          {/* Header Row */}
          <div className="grid grid-cols-3 gap-4 p-4 sm:p-6 bg-gradient-to-br from-secondary/80 to-secondary/40 border-b border-border">
            <div className="text-sm sm:text-base text-muted-foreground">Feature</div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <X className="h-3 w-3 text-red-400" />
                <span className="text-xs sm:text-sm text-red-400">Others</span>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 shadow-lg shadow-primary/20">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-xs sm:text-sm text-primary">Earnotic</span>
              </div>
            </div>
          </div>

          {/* Feature Rows */}
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
              className="grid grid-cols-3 gap-4 p-4 sm:p-6 border-b border-border/50 last:border-b-0 transition-all duration-200 group"
            >
              <div className="text-sm sm:text-base flex items-center group-hover:text-primary transition-colors">{feature}</div>
              <div className="flex justify-center items-center">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/20 transition-all"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                </motion.div>
              </div>
              <div className="flex justify-center items-center">
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 group-hover:shadow-lg group-hover:shadow-green-500/20 transition-all"
                >
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                </motion.div>
              </div>
            </motion.div>
          ))}

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/5 relative overflow-hidden"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>

            <div className="relative text-center space-y-4">
              <p className="text-base sm:text-lg">
                Join <span className="text-primary">8,500+ traders</span> who ditched manual journaling
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all group">
                  <Zap className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Start Your Free Trial
                </Button>
                <span className="text-xs text-muted-foreground">No credit card required • 7-day trial</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
