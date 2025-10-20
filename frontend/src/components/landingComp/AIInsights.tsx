"use client";
import { Button } from "../ui/button";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle, Brain, Zap } from "lucide-react";
import { motion } from "motion/react";

export function AIInsights() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-center lg:text-left order-2 lg:order-1"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20"
              >
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-purple-400">Powered by Advanced AI</span>
              </motion.div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-tight">
                AI Analyzes Your{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Trade History
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Our AI engine reviews your synced trading history to find patterns, winning setups, and costly mistakes—automatically.
              </p>
            </div>

            {/* AI Insights examples with enhanced styling */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-3 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-4 hover:border-green-500/40 transition-all group cursor-pointer"
              >
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-sm sm:text-base">Your backtests show <span className="text-green-400">82% win rate</span> when you trade Nifty Bank between 9:15-10:30 AM</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex items-start gap-3 bg-gradient-to-r from-red-500/10 to-orange-500/5 border border-red-500/20 rounded-xl p-4 hover:border-red-500/40 transition-all group cursor-pointer"
              >
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-sm sm:text-base">Your synced data shows <span className="text-red-400">65% losses</span> when you revenge trade after a loss—avoid it!</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border border-primary/20 rounded-xl p-4 hover:border-primary/40 transition-all group cursor-pointer"
              >
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <p className="text-sm sm:text-base">Backtesting shows <span className="text-primary">+28%</span> profit when you stick to your 1:2 risk-reward ratio</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group">
                <Sparkles className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                Start Backtesting Free
              </Button>
            </motion.div>
          </motion.div>

          {/* Right visual - Enhanced AI visualization */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-card via-secondary/30 to-card p-8 border border-border shadow-2xl">
              {/* Central AI core */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="h-48 w-48 sm:h-56 sm:w-56 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 blur-2xl"
                />
              </div>

              <div className="relative h-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="h-40 w-40 sm:h-48 sm:w-48 rounded-full border-2 border-dashed border-primary/30"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center backdrop-blur-sm border border-primary/30"
                  >
                    <Brain className="h-16 w-16 sm:h-20 sm:w-20 text-primary" />
                  </motion.div>
                </div>
              </div>

              {/* Orbiting particles */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: [angle, angle + 360],
                  }}
                  transition={{
                    duration: 10 + i * 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    transformOrigin: "0 0",
                  }}
                >
                  <div className={`h-3 w-3 rounded-full ${
                    i % 3 === 0 ? 'bg-cyan-500' : i % 3 === 1 ? 'bg-blue-500' : 'bg-purple-500'
                  } blur-sm`} style={{ transform: `translate(-50%, -50%) translateX(${80 + i * 5}px)` }} />
                </motion.div>
              ))}

              {/* Feature badges */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                className="absolute top-4 right-4 bg-card/80 backdrop-blur-md rounded-lg px-3 py-2 border border-primary/20 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs">Real-time</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-md rounded-lg px-3 py-2 border border-green-500/20 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs">Learning</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
