"use client";
import { useState, ReactNode } from "react";
import { Menu, Bell, Search } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { AIBuddyWidget } from "./AIBuddyWidget";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            {/* Mobile Menu & Search */}
            <div className="flex items-center gap-3 flex-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Search */}
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search trades, strategies..."
                    className="pl-9 bg-muted/30 border-border/50 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center gap-2 mr-auto -ml-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-sm">E</span>
                </div>
              </div>

              {/* Notifications */}
              <Button size="icon" variant="ghost" className="relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                  3
                </Badge>
              </Button>

              {/* Profile */}
              <Button
                variant="ghost"
                className="hidden sm:flex items-center gap-2 px-2"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center ring-2 ring-cyan-500/50">
                  <span className="text-white text-sm">JD</span>
                </div>
                <span className="text-sm hidden md:inline">John Doe</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* AI Buddy Widget */}
      <AIBuddyWidget />
    </div>
  );
}
