"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { User, Bell, Shield, Palette, Database, RefreshCw, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);

  const brokers = [
    { name: "Zerodha", status: "connected", logo: "Z", color: "from-blue-500 to-cyan-500" },
    { name: "Upstox", status: "connected", logo: "U", color: "from-purple-500 to-pink-500" },
    { name: "Dhan", status: "disconnected", logo: "D", color: "from-orange-500 to-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, brokers, and preferences
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
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
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+91 98765 43210" />
                  </div>
                  <Separator />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Brokers Tab */}
            <TabsContent value="brokers">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Broker Connections</CardTitle>
                      <CardDescription>Manage your connected trading accounts</CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Broker
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brokers.map((broker) => (
                    <motion.div
                      key={broker.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border border-border bg-background/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${broker.color} flex items-center justify-center shadow-lg`}>
                            <span className="text-white text-xl">{broker.logo}</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{broker.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {broker.status === "connected" ? "Last synced: 2 mins ago" : "Not connected"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {broker.status === "connected" ? (
                            <>
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                Connected
                              </Badge>
                              <Button size="sm" variant="outline">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sync
                              </Button>
                              <Button size="sm" variant="outline">
                                Disconnect
                              </Button>
                            </>
                          ) : (
                            <Button size="sm">Connect</Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications for important updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationsEnabled}
                      onCheckedChange={setNotificationsEnabled}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get daily summary emails of your trading activity
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>AI Insights</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly AI-generated insights and recommendations
                      </p>
                    </div>
                    <Switch
                      checked={aiInsights}
                      onCheckedChange={setAiInsights}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>App Preferences</CardTitle>
                  <CardDescription>Customize your trading experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Input value="₹ INR" disabled />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Input value="Asia/Kolkata (IST)" disabled />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Input value="DD/MM/YYYY" disabled />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Currently enabled (automatic theme coming soon)
                      </p>
                    </div>
                    <Switch checked disabled />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
