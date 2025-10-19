"use client";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { motion } from "motion/react";

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "Try before you commit",
    features: [
      "100 trades/month (manual entry)",
      "Basic journal & notes",
      "Performance dashboard",
      "NSE & BSE support",
      "Export to CSV",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    description: "For serious traders",
    features: [
      "Auto-sync: Zerodha, Upstox, Dhan & more",
      "Unlimited trade journal",
      "Strategy backtesting engine",
      "AI performance analysis",
      "ITR-ready tax reports",
      "Advanced analytics (20+ metrics)",
      "Priority support",
    ],
    cta: "Start 7-Day Free Trial",
    highlighted: true,
    badge: "Most Popular",
    savings: "Save ₹1,200/year",
  },
  {
    name: "Elite",
    price: "₹1,299",
    period: "/month",
    description: "For pro traders & teams",
    features: [
      "Everything in Pro",
      "Multi-broker portfolio sync",
      "Advanced backtesting (custom indicators)",
      "API access for algos",
      "Priority broker sync (real-time)",
      "1-on-1 strategy review monthly",
      "White-label reports",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-background via-secondary/10 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-400">7-Day Free Trial • No Credit Card</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">Simple, Transparent Pricing</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your trading journey. Upgrade or downgrade anytime.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
            >
              <Card
                className={`relative p-6 sm:p-8 bg-card transition-all duration-300 h-full ${
                  plan.highlighted
                    ? "border-2 border-primary shadow-2xl shadow-primary/20 md:scale-105"
                    : "border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1 shadow-lg"
                    >
                      <Sparkles className="h-3 w-3" />
                      {plan.badge}
                    </motion.span>
                  </div>
                )}

                {plan.name === "Elite" && (
                  <div className="absolute -top-2 -right-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="space-y-5 sm:space-y-6">
                  {/* Plan name */}
                  <div>
                    <h3 className="text-xl sm:text-2xl mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text">{plan.price}</span>
                      {plan.period && (
                        <span className="text-muted-foreground">{plan.period}</span>
                      )}
                    </div>
                    {plan.savings && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs sm:text-sm text-green-400 mt-1 flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        {plan.savings}
                      </motion.p>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    className={`w-full transition-all ${
                      plan.highlighted
                        ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50"
                        : "hover:bg-secondary"
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                  >
                    {plan.cta}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    {plan.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: featureIndex * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 sm:mt-16 space-y-6"
        >
          <p className="text-sm text-muted-foreground">
            ✓ 30-day money-back guarantee &nbsp;•&nbsp; ✓ Cancel anytime &nbsp;•&nbsp; ✓ No hidden fees
          </p>
          
          {/* Payment methods */}
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-muted-foreground">
            <span>We accept:</span>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded bg-card border border-border">UPI</div>
              <div className="px-3 py-1.5 rounded bg-card border border-border">Cards</div>
              <div className="px-3 py-1.5 rounded bg-card border border-border">Net Banking</div>
              <div className="px-3 py-1.5 rounded bg-card border border-border">Paytm</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
