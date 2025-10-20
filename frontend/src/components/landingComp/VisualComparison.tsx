"use client";
import { motion } from "motion/react";
import { X, Check, Clock, Zap } from "lucide-react";

export function VisualComparison() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-red-500/5 via-yellow-500/5 to-green-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">
            Stop Wasting Time on{" "}
            <span className="bg-gradient-to-r from-red-400 via-orange-500 to-yellow-600 bg-clip-text text-transparent">
              Manual Entry
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            See how much time you save by letting your trades sync automatically
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
          {/* Manual Way - Old Method */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="p-6 sm:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border-2 border-red-500/30 relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 text-xs bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                  Old Way
                </span>
              </div>

              {/* Icon */}
              <div className="h-14 w-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                <Clock className="h-7 w-7 text-red-400" />
              </div>

              {/* Title */}
              <h3 className="text-2xl mb-4 text-red-300">Manual Journaling</h3>

              {/* Time */}
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-muted-foreground mb-1">Time spent per day:</p>
                <p className="text-3xl text-red-400">30-45 mins</p>
              </div>

              {/* Problems */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span>Type every trade manually into Excel/sheets</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span>Risk of typos and data entry errors</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span>Calculate P&L, brokerage, taxes yourself</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span>No backtesting or AI analysis possible</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <X className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <span>Boring, repetitive work every single day</span>
                </div>
              </div>

              {/* Wasted time callout */}
              <div className="mt-6 p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-xs text-red-400/80">
                  = 180+ hours wasted per year on data entry
                </p>
              </div>
            </div>
          </motion.div>

          {/* Earnotic Way - New Method */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="p-6 sm:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border-2 border-green-500/50 relative overflow-hidden shadow-xl shadow-green-500/10">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 rounded-2xl"></div>

              {/* Badge */}
              <div className="absolute top-4 right-4">
                <motion.span
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full border border-green-500/40 shadow-lg"
                >
                  Smart Way
                </motion.span>
              </div>

              {/* Icon */}
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-6 border border-green-500/30 shadow-lg relative">
                <Zap className="h-7 w-7 text-green-400" />
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-20 blur-xl rounded-xl"></div>
              </div>

              {/* Title */}
              <h3 className="text-2xl mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Earnotic Auto-Sync
              </h3>

              {/* Time */}
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-muted-foreground mb-1">Time spent per day:</p>
                <p className="text-3xl text-green-400">0 seconds ⚡</p>
              </div>

              {/* Benefits */}
              <div className="space-y-3 relative">
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <span>All trades sync automatically from your broker</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <span>100% accurate data, zero manual errors</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <span>P&L, brokerage, taxes calculated instantly</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Backtest strategies on historical data</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Focus 100% on trading, not data entry</span>
                </div>
              </div>

              {/* Savings callout */}
              <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-400">
                  = Save 180+ hours per year. Just trade and review!
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-lg sm:text-xl text-muted-foreground mb-2">
            Ready to save <span className="text-green-400">180+ hours</span> this year?
          </p>
          <p className="text-sm text-muted-foreground">
            Connect your broker in under 2 minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}
