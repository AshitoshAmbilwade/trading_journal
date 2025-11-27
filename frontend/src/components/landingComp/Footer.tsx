"use client";
import { Twitter, Youtube, Instagram, TrendingUp, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="px-4 sm:px-6 py-12 bg-black border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl">Earnotic</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              India&apos;s most advanced AI-powered trading journal. Built by traders, for traders.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href="mailto:support@earnotic.com" className="hover:text-primary transition-colors">
                support@earnotic.com
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Mobile App
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Trading Guide
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Refund Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © 2025 Earnotic Journal. Made in India 🇮🇳 for Indian Traders
          </p>

          {/* Social icons */}
          <div className="flex gap-3">
            <a
              href="#"
              className="h-9 w-9 rounded-full bg-secondary hover:bg-primary hover:text-white flex items-center justify-center transition-all"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="h-9 w-9 rounded-full bg-secondary hover:bg-primary hover:text-white flex items-center justify-center transition-all"
            >
              <Youtube className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="h-9 w-9 rounded-full bg-secondary hover:bg-primary hover:text-white flex items-center justify-center transition-all"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
