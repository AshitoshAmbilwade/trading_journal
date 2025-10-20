"use client";
import { Button } from "../ui/button";
import { Users, Gift, IndianRupee, Share2 } from "lucide-react";

export function ReferEarn() {
  return (
    <section id="refer" className="px-4 sm:px-6 py-16 sm:py-20 lg:py-28 bg-gradient-to-b from-secondary/20 to-background">
      <div className="max-w-5xl mx-auto text-center">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl">
              Refer & Earn Extra Income
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
              Share Earnotic Pro with fellow traders and earn 20% recurring commission on every paid subscription.
            </p>
          </div>

          {/* Visual representation */}
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 py-6 sm:py-8">
            <div className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
              <Share2 className="h-7 w-7 sm:h-10 sm:w-10" />
            </div>
            <div className="text-primary text-xl sm:text-2xl">→</div>
            <div className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
              <Users className="h-7 w-7 sm:h-10 sm:w-10" />
            </div>
            <div className="text-primary text-xl sm:text-2xl">→</div>
            <div className="flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
              <IndianRupee className="h-7 w-7 sm:h-10 sm:w-10" />
            </div>
          </div>

          {/* Benefits */}
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="space-y-2 p-4 sm:p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-center gap-1">
                <p className="text-3xl sm:text-4xl">20</p>
                <p className="text-2xl sm:text-3xl text-primary">%</p>
              </div>
              <p className="text-sm text-muted-foreground">Recurring Commission</p>
            </div>
            <div className="space-y-2 p-4 sm:p-6 rounded-xl bg-card border border-border">
              <p className="text-3xl sm:text-4xl">∞</p>
              <p className="text-sm text-muted-foreground">Unlimited Referrals</p>
            </div>
            <div className="space-y-2 p-4 sm:p-6 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-center gap-1">
                <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" />
                <p className="text-3xl sm:text-4xl">10K+</p>
              </div>
              <p className="text-sm text-muted-foreground">Avg Monthly Earnings</p>
            </div>
          </div>

          {/* Example calculation */}
          <div className="max-w-md mx-auto p-4 sm:p-6 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">Example: Refer 10 traders to Pro plan</p>
            <p className="text-xl sm:text-2xl">₹499 × 10 × 20% = <span className="text-primary">₹998/month</span></p>
          </div>

          {/* CTA */}
          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
            <Gift className="mr-2 h-5 w-5" />
            Start Referring Now
          </Button>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Payouts via UPI, Bank Transfer, or Paytm. No minimum threshold.
          </p>
        </div>
      </div>
    </section>
  );
}
