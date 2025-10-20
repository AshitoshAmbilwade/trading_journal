"use client";
import { Button } from "../ui/button";
import { Play, TrendingUp, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { MockDashboard } from "./MockDashboard";
import { useRouter } from "next/navigation";

export function Hero() {
  const router = useRouter(); // ✅ added

  return (
    <section className="relative overflow-hidden bg-background px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 sm:space-y-8 text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all cursor-pointer group"
            >
              <Sparkles className="h-4 w-4 text-orange-500 group-hover:rotate-12 transition-transform" />
              <span className="text-sm text-orange-400">Auto-Sync with 10+ Indian Brokers</span>
              <ChevronRight className="h-3 w-3 text-orange-400 group-hover:translate-x-1 transition-transform" />
            </motion.div>

            <div className="space-y-4 sm:space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight"
              >
                India’s Own{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-orange-500 via-white to-green-600 bg-clip-text text-transparent animate-gradient">
                    AI-Powered Trading Journal
                  </span>
                  <motion.span
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-white to-green-600 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </span>{" "}
                + Backtesting Platform
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed"
              >
                Auto-sync trades from Zerodha, Upstox & 10+ Indian brokers. Backtest strategies, analyze performance, and trade smarter with AI-powered insights — proudly built for Indian traders.
              </motion.p>
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group"
                onClick={() => router.push("/register")}
              >
                <TrendingUp className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Connect Your Broker
              </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="group border-2 border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all px-8 py-6 text-base font-medium rounded-2xl backdrop-blur-sm"
                >
                  <Play className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform" />
                  See How It Works
                </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-muted-foreground justify-center lg:justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.1 }}
                      className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-green-600 border-2 border-background"
                    />
                  ))}
                </div>
                <span>5,000+ Indian traders</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">★★★★★</span>
                <span>4.9/5 rating</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right mockup - Real Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative mt-8 lg:mt-0"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-500">
              <MockDashboard />
            </div>

            {/* Floating decorative elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="hidden lg:block absolute -top-6 -right-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm"
            />
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="hidden lg:block absolute -bottom-6 -left-6 h-32 w-32 rounded-2xl bg-gradient-to-br from-orange-500/20 to-green-600/20 border border-orange-500/30 backdrop-blur-sm"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
