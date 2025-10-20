"use client";
import { motion } from "motion/react";
import { Brain, Bell, Shield, Smartphone, BarChart3, FileText, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const features = [
  {
    title: "Strategy Backtesting",
    description: "Test your strategies on years of historical data before risking real capital",
    icon: Brain,
    gradient: "from-purple-500 to-pink-500",
    span: "lg:col-span-2 lg:row-span-2",
    image: "https://images.unsplash.com/photo-1759661966728-4a02e3c6ed91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmFseXRpY3MlMjBkYXNoYm9hcmQlMjBncmFwaHN8ZW58MXx8fHwxNzYwODY1MzU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    title: "Trade Alerts",
    description: "Get notified of patterns and opportunities",
    icon: Bell,
    gradient: "from-blue-500 to-cyan-500",
    span: "lg:col-span-1",
  },
  {
    title: "Secure & Private",
    description: "Bank-grade encryption, no password sharing",
    icon: Shield,
    gradient: "from-green-500 to-emerald-500",
    span: "lg:col-span-1",
  },
  {
    title: "Mobile Journal",
    description: "Review trades anywhere with iOS & Android apps",
    icon: Smartphone,
    gradient: "from-orange-500 to-red-500",
    span: "lg:col-span-1",
    image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzYwODU1ODIzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    title: "Performance Metrics",
    description: "20+ analytics: win rate, profit factor, drawdown",
    icon: BarChart3,
    gradient: "from-cyan-500 to-blue-500",
    span: "lg:col-span-1",
  },
  {
    title: "ITR Tax Reports",
    description: "Tax-ready reports with all trades and calculations",
    icon: FileText,
    gradient: "from-yellow-500 to-orange-500",
    span: "lg:col-span-2",
  },
];

export function BentoShowcase() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">
            More Than Just a{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Trade Journal
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Backtest strategies, analyze performance, and trade with confidence using data
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[200px]">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLarge = feature.span.includes("row-span-2");
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`${feature.span} relative group cursor-pointer`}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-all duration-500 blur-xl -z-10`}></div>
                
                <div className="h-full p-6 sm:p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Icon badge */}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                      className={`inline-flex h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br ${feature.gradient} items-center justify-center mb-4 shadow-lg ring-2 ring-border/50 group-hover:ring-primary/30 transition-all`}
                    >
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </motion.div>

                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>

                    {/* Image preview for large cards */}
                    {isLarge && feature.image && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 rounded-xl overflow-hidden border border-border/50 group-hover:border-primary/30 transition-all"
                      >
                        <ImageWithFallback
                          src={feature.image}
                          alt={feature.title}
                          className="w-full h-32 object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                      </motion.div>
                    )}

                    {/* Mini preview for mobile card */}
                    {!isLarge && feature.image && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="mt-auto pt-4"
                      >
                        <div className="h-16 w-16 rounded-lg overflow-hidden border border-border/50 group-hover:border-primary/30 transition-all ml-auto">
                          <ImageWithFallback
                            src={feature.image}
                            alt={feature.title}
                            className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Decorative elements */}
                  <div className={`absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${feature.gradient} opacity-5 blur-2xl group-hover:opacity-15 transition-opacity`}></div>
                  
                  {/* Sparkle effect on hover */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <Sparkles className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
