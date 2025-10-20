"use client";
import { motion } from "motion/react";
import { Upload, Brain, TrendingUp, Target } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Connect Your Broker",
    description: "One-click integration with Zerodha, Upstox, Dhan, or any Indian broker. Takes under 2 minutes.",
    icon: Upload,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    number: "02",
    title: "Trades Auto-Sync Daily",
    description: "All your NSE, BSE, and F&O trades automatically sync to your journal every day—no manual entry needed.",
    icon: TrendingUp,
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    number: "03",
    title: "Backtest & Analyze",
    description: "Test your strategies on historical data and get AI-powered insights on your trading patterns and performance.",
    icon: Brain,
    gradient: "from-purple-500 to-pink-600",
  },
  {
    number: "04",
    title: "Trade Smarter",
    description: "Apply data-driven insights, avoid repeated mistakes, and improve your win rate month after month.",
    icon: Target,
    gradient: "from-orange-500 to-yellow-500",
  },
];

export function HowItWorks() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary">Simple Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">
            From Broker to{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Better Trader
            </span>
            {" "}in 4 Steps
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect your broker, let trades sync automatically, and start improving with AI insights
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-orange-500 opacity-20 -translate-y-1/2"></div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  {/* Card */}
                  <div className="relative p-6 sm:p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group h-full">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    </div>

                    {/* Number badge */}
                    <div className="absolute -top-4 -right-4 h-12 w-12 rounded-xl bg-gradient-to-br from-card to-secondary border border-border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <span className="text-lg bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{step.number}</span>
                    </div>

                    <div className="relative space-y-4">
                      {/* Icon */}
                      <motion.div
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.5 }}
                        className={`inline-flex h-14 w-14 rounded-xl bg-gradient-to-br ${step.gradient} items-center justify-center shadow-lg ring-4 ring-border/50 group-hover:ring-primary/30 transition-all`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </motion.div>

                      {/* Content */}
                      <div>
                        <h3 className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors">
                          {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Decorative glow */}
                    <div className={`absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity`}></div>
                  </div>

                  {/* Arrow connector - desktop only */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-6 w-6 rounded-full bg-card border border-primary/50 flex items-center justify-center shadow-lg"
                      >
                        <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
