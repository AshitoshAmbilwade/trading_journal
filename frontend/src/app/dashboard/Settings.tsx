"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User, Bell, Palette, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authApi } from "@/api/auth"; // ✅ import your API

// Minimal user shape used in this component
interface CurrentUser {
  name?: string;
  email?: string;
  number?: string;
  tier?: string;
  [key: string]: unknown;
}

// Expected shapes from authApi
interface GetMeResponse {
  user?: CurrentUser;
}

interface UpdateMeResponse {
  user?: CurrentUser;
  success?: boolean;
  message?: string;
}

export function Settings() {
  const [user, setUser] = useState<CurrentUser | null>(null); // typed current user
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = (await authApi.getMe()) as GetMeResponse;
        // safe assignment — res.user may be undefined
        setUser(res.user ?? null);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Update handler
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        name: (user.name as string) ?? undefined,
        email: (user.email as string) ?? undefined,
        number: (user.number as string) ?? undefined,
      };
      const res = (await authApi.updateMe(payload)) as UpdateMeResponse;
      setUser(res.user ?? user);
      // keep original UX
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8 text-center">Loading...</p>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl sm:text-4xl mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account, brokers, and preferences</p>
        </motion.div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="brokers">
              <Database className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Brokers</span>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your Name"
                    value={user?.name || ""}
                    onChange={(e) => setUser({ ...(user ?? {}), name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={user?.email || ""}
                    onChange={(e) => setUser({ ...(user ?? {}), email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="number">Phone Number</Label>
                  <Input
                    id="number"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={user?.number || ""}
                    onChange={(e) => setUser({ ...(user ?? {}), number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label>
                  <Input
                    id="tier"
                    value={user?.tier || "Free"}
                    disabled
                  />
                </div>
                <Separator />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brokers / Notifications / Preferences Tabs */}
          {/* ...keep your existing code for these tabs */}
        </Tabs>
      </div>
    </div>
  );
}
