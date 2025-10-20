"use client";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Mail } from "lucide-react";

export function Newsletter() {
  return (
    <section className="relative px-4 sm:px-6 py-16 sm:py-20 lg:py-28 overflow-hidden bg-gradient-to-br from-cyan-600 via-blue-700 to-purple-800">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-purple-900/30 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      <div className="max-w-3xl mx-auto text-center">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white">
              Free Backtest Reports & Trading Tips
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100">
              Join 8,500+ Indian traders getting weekly backtesting strategies, broker updates, and proven setups.
            </p>
          </div>

          {/* Email form */}
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/95 backdrop-blur-sm border-white/20 text-black placeholder:text-gray-500 flex-1 h-12"
              />
              <Button size="lg" className="bg-white text-blue-700 hover:bg-white/90 shrink-0 h-12">
                <Mail className="mr-2 h-4 w-4" />
                Subscribe Free
              </Button>
            </div>
            <p className="text-sm text-blue-100 mt-3">
              💯 Free forever. Unsubscribe anytime. No spam.
            </p>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 pt-4 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📧</span>
              <span>Weekly tips</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span>Backtest reports</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <span>Broker updates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
