"use client";
import { Card } from "../ui/card";
import { Star, Quote } from "lucide-react";
import { motion } from "motion/react";

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Intraday Trader, Mumbai",
    avatar: "https://images.unsplash.com/photo-1708195886023-3ecb00ac7a49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=150",
    quote:
      "Zerodha auto-sync is a game changer! All my trades appear automatically. Backtesting showed me my best setups—win rate jumped from 52% to 71%.",
    rating: 5,
    stat: "+19% Win Rate",
  },
  {
    name: "Priya Kapoor",
    role: "Options Trader, Delhi",
    avatar: "https://images.unsplash.com/photo-1708195886023-3ecb00ac7a49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=150",
    quote:
      "Connected my Upstox account in 2 minutes. Every trade syncs daily. No more Excel sheets! The ITR report saved me during tax season.",
    rating: 5,
    stat: "Zero manual entry",
  },
  {
    name: "Arjun Patel",
    role: "Swing Trader, Ahmedabad",
    avatar: "https://images.unsplash.com/photo-1708195886023-3ecb00ac7a49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=150",
    quote:
      "Backtesting feature is incredible! Tested my strategy on 2 years of data before going live. Saved me from costly mistakes.",
    rating: 5,
    stat: "₹1.2L saved",
  },
  {
    name: "Sneha Reddy",
    role: "F&O Trader, Bangalore",
    avatar: "https://images.unsplash.com/photo-1708195886023-3ecb00ac7a49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=150",
    quote:
      "The AI analyzed my Dhan trades and found I lose money when I revenge trade. That one insight alone made this worth it!",
    rating: 5,
    stat: "+₹58K monthly",
  },
  {
    name: "Vikram Singh",
    role: "Day Trader, Jaipur",
    avatar: "https://images.unsplash.com/photo-1708195886023-3ecb00ac7a49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=150",
    quote:
      "Best ₹499 I've spent. Auto-sync from Angel One works flawlessly. I just trade and review—no data entry BS.",
    rating: 5,
    stat: "Daily user for 8m",
  },
  {
    name: "Meera Joshi",
    role: "Positional Trader, Pune",
    avatar: "https://images.unsplash.com/photo-1708195886023-3ecb00ac7a49?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=150",
    quote:
      "The analytics dashboard shows exactly where I'm profitable. Love that all my Groww trades sync automatically!",
    rating: 5,
    stat: "3.2x profit factor",
  },
];

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-background via-secondary/10 to-background relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 mb-4">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-sm text-yellow-500">8,500+ Happy Traders</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl">Trusted by Indian Traders</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of Indian traders who auto-sync trades and backtest strategies daily
          </p>
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className="p-5 sm:p-6 bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group cursor-pointer h-full">
                <div className="space-y-4">
                  {/* Quote icon */}
                  <div className="flex justify-between items-start">
                    <Quote className="h-8 w-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <span className="text-xs text-green-400">{testimonial.stat}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      <img src={testimonial.avatar} alt={testimonial.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm sm:text-base">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-12 sm:mt-16 flex flex-wrap justify-center items-center gap-6 sm:gap-12 text-sm text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <p className="text-foreground">8,500+</p>
              <p className="text-xs">Active Traders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
              <span className="text-xl">★</span>
            </div>
            <div>
              <p className="text-foreground">4.9/5</p>
              <p className="text-xs">Average Rating</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <p className="text-foreground">₹5.2Cr+</p>
              <p className="text-xs">Auto-Synced Trades</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
