"use client";
import { motion } from "motion/react";
import { RefreshCw, CheckCircle, Zap, Shield } from "lucide-react";
import { Button } from "./ui/button";

const brokers = [
  { name: "Zerodha", logo: "Z", color: "from-blue-500 to-cyan-500", popular: true },
  { name: "Upstox", logo: "U", color: "from-purple-500 to-pink-500" },
  { name: "Dhan", logo: "D", color: "from-orange-500 to-yellow-500" },
  { name: "Angel One", logo: "A", color: "from-red-500 to-orange-500" },
  { name: "Groww", logo: "G", color: "from-green-500 to-emerald-500" },
  { name: "5paisa", logo: "5", color: "from-indigo-500 to-blue-500" },
];

const features = [
  {
    icon: RefreshCw,
    title: "Auto-Sync Trades",
    description: "All your trades sync automatically every day",
  },
  {
    icon: Zap,
    title: "Instant Updates",
    description: "Real-time synchronization with your broker",
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "Bank-grade encryption for your data",
  },
  {
    icon: CheckCircle,
    title: "Zero Manual Entry",
    description: "Never type a single trade manually",
  },
];

export function BrokerIntegration() {
  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-background via-secondary/10 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <RefreshCw className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-400">Automatic Trade Sync</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">
            Connect Your{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Indian Broker
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            One-click integration with all major Indian brokers. Your trades sync automatically—no manual entry needed.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-12">
          {/* Left - Broker Grid */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              {brokers.map((broker, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="relative group"
                >
                  {broker.popular && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full shadow-lg">
                        Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="relative p-6 sm:p-8 rounded-2xl bg-card/80 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 aspect-square flex flex-col items-center justify-center group-hover:shadow-2xl group-hover:shadow-primary/20">
                    {/* Glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${broker.color} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity blur-xl -z-10`}></div>
                    
                    {/* Logo */}
                    <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br ${broker.color} flex items-center justify-center shadow-lg mb-3 group-hover:scale-110 transition-transform`}>
                      <span className="text-2xl sm:text-3xl text-white">{broker.logo}</span>
                    </div>
                    
                    {/* Name */}
                    <span className="text-sm sm:text-base text-center">{broker.name}</span>
                    
                    {/* Connected indicator */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* More brokers badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
                <span className="text-sm text-muted-foreground">+ 10 more brokers supported</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 8 }}
                  className="flex items-start gap-4 p-4 sm:p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/30 transition-all group"
                >
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg mb-1 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all group">
            <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
            Connect Your Broker Now
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            ✓ Takes less than 2 minutes  •  ✓ No password sharing  •  ✓ Read-only access
          </p>
        </motion.div>
      </div>
    </section>
  );
}
