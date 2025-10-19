"use client";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function DashboardPreview() {
  return (
    <section className="relative px-4 sm:px-6 py-16 sm:py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-background via-secondary/10 to-background">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Main dashboard container */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-2">
            {/* Browser chrome */}
            <div className="bg-secondary/50 rounded-t-xl px-4 py-3 flex items-center gap-2 border-b border-border">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
              </div>
              <div className="flex-1 ml-4">
                <div className="bg-background/50 rounded-md px-3 py-1.5 text-xs text-muted-foreground max-w-md">
                  app.earnoticjournal.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="relative rounded-b-xl overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1748609278627-4b0e483b9b70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaW5hbmNpYWwlMjBhbmFseXRpY3MlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzYwODY0NTI0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Dashboard Preview"
                className="w-full h-auto"
              />
              {/* Overlay gradient for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent"></div>
            </div>
          </div>

          {/* Floating callout labels with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="absolute top-8 sm:top-12 -left-2 sm:-left-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-md rounded-xl shadow-xl px-4 py-3 border border-green-500/30 hidden lg:block group hover:scale-105 transition-transform"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-sm">
                <span className="text-green-400">72.3%</span> Win Rate
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="absolute top-1/3 -right-2 sm:-right-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-xl shadow-xl px-4 py-3 border border-purple-500/30 hidden lg:block group hover:scale-105 transition-transform"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
              <p className="text-sm">
                <span className="text-purple-400">AI</span> Insights Active
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 sm:bottom-12 left-1/4 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-md rounded-xl shadow-xl px-4 py-3 border border-primary/30 hidden lg:block group hover:scale-105 transition-transform"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <p className="text-sm">
                <span className="text-primary">₹1.2L+</span> Monthly Profit
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 sm:mt-16"
        >
          <p className="text-2xl sm:text-3xl lg:text-4xl tracking-tight">
            <span className="text-muted-foreground">Track.</span>{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">Analyze.</span>{" "}
            <span className="text-muted-foreground">Profit.</span>
          </p>
          <p className="text-sm sm:text-base text-muted-foreground mt-4 max-w-2xl mx-auto">
            Real-time analytics, AI-powered insights, and comprehensive reporting—all in one beautiful dashboard
          </p>
        </motion.div>
      </div>
    </section>
  );
}
