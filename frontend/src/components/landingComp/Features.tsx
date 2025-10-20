"use client";

import { BookOpen, BarChart3, Brain, FileDown, IndianRupee, Smartphone, RefreshCw, Lock, Target } from "lucide-react";
import { Card } from "../ui/card";
import { motion } from "motion/react";

const features = [
  {
    icon: RefreshCw,
    title: "Auto-Sync Trades",
    description: "Connect Zerodha, Upstox, Dhan & more. All trades sync automatically—zero manual entry.",
    gradient: "from-green-500/10 to-emerald-500/10",
    iconColor: "text-green-500",
    borderColor: "hover:border-green-500/50",
  },
  {
    icon: Target,
    title: "Strategy Backtesting",
    description: "Test your trading strategies on historical data. See what works before risking real money.",
    gradient: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-purple-500",
    borderColor: "hover:border-purple-500/50",
  },
  {
    icon: BookOpen,
    title: "Complete Trade Journal",
    description: "Every trade logged with entry/exit, P&L, screenshots, and detailed notes for review.",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-cyan-500",
    borderColor: "hover:border-cyan-500/50",
  },
  {
    icon: Brain,
    title: "AI Performance Analysis",
    description: "AI identifies patterns, mistakes, and opportunities from your trading history automatically.",
    gradient: "from-orange-500/10 to-yellow-500/10",
    iconColor: "text-orange-500",
    borderColor: "hover:border-orange-500/50",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track 20+ metrics: win rate, profit factor, drawdown, best/worst trades, and more.",
    gradient: "from-cyan-500/10 to-blue-500/10",
    iconColor: "text-cyan-500",
    borderColor: "hover:border-cyan-500/50",
  },
  {
    icon: IndianRupee,
    title: "P&L Calculator",
    description: "Automatic profit/loss calculation with brokerage, taxes, and STT included for NSE/BSE.",
    gradient: "from-teal-500/10 to-green-500/10",
    iconColor: "text-teal-500",
    borderColor: "hover:border-teal-500/50",
  },
  {
    icon: FileDown,
    title: "ITR-Ready Reports",
    description: "Generate tax-ready reports for ITR filing with all trades, P&L, and tax calculations.",
    gradient: "from-red-500/10 to-orange-500/10",
    iconColor: "text-red-400",
    borderColor: "hover:border-red-500/50",
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    description: "Your data is encrypted with 256-bit SSL. We never store your broker passwords.",
    gradient: "from-slate-500/10 to-gray-500/10",
    iconColor: "text-slate-400",
    borderColor: "hover:border-slate-500/50",
  },
  {
    icon: Smartphone,
    title: "Mobile & Desktop",
    description: "Access your journal anywhere—web, iOS, and Android apps with offline support.",
    gradient: "from-indigo-500/10 to-blue-500/10",
    iconColor: "text-indigo-400",
    borderColor: "hover:border-indigo-500/50",
  },
];

export function Features() {
  return (
    <section id="features" className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">
            Journal, Backtest & Analyze{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              All in One Place
            </span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            The complete trading toolkit for Indian traders—from auto-sync to backtesting
          </p>
        </motion.div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card
                  className={`p-6 sm:p-8 bg-card border border-border ${feature.borderColor} hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer h-full`}
                >
                  <div className="space-y-4">
                    <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-7 w-7 ${feature.iconColor}`} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
