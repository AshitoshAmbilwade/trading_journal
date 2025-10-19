"use client";
import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";
import { TrendingUp, Users, Target, Zap } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: 8500,
    suffix: "+",
    label: "Active Traders",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    value: 5.2,
    suffix: "Cr+",
    label: "Trades Auto-Synced",
    prefix: "₹",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Target,
    value: 12,
    suffix: "+",
    label: "Broker Integrations",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Zap,
    value: 2.5,
    suffix: "M+",
    label: "Backtests Completed",
    color: "from-orange-500 to-yellow-500",
  },
];

function Counter({ value, duration = 2 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}</span>;
}

export function Stats() {
  return (
    <section className="px-4 sm:px-6 py-12 sm:py-16 bg-gradient-to-b from-background via-secondary/20 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-400">Trusted by 8,500+ Indian Traders</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative group"
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 rounded-2xl transition-all duration-500 blur-xl`}></div>
                
                {/* Card */}
                <div className="relative p-6 sm:p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                  </div>

                  <div className="relative flex flex-col items-center text-center space-y-3">
                    {/* Icon with pulse animation */}
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1,
                      }}
                      className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}
                    >
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </motion.div>

                    <div>
                      <p className="text-2xl sm:text-3xl lg:text-4xl mb-1 bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                        {stat.prefix}
                        <Counter value={stat.value} />
                        {stat.suffix}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>

                  {/* Decorative corner accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-5 rounded-2xl blur-2xl`}></div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
