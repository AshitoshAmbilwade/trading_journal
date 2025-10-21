"use client";
import { motion } from "motion/react";
import { RefreshCw, CheckCircle, AlertCircle, Plus, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface Broker {
  id: string;
  name: string;
  logo: string;
  status: "active" | "error" | "syncing";
  lastSync: string;
  color: string;
  trades: number;
}

const brokers: Broker[] = [
  {
    id: "1",
    name: "Zerodha",
    logo: "Z",
    status: "active",
    lastSync: "2 mins ago",
    color: "from-blue-500 to-cyan-500",
    trades: 156,
  },
  {
    id: "2",
    name: "Upstox",
    logo: "U",
    status: "active",
    lastSync: "5 mins ago",
    color: "from-purple-500 to-pink-500",
    trades: 89,
  },
  {
    id: "3",
    name: "Dhan",
    logo: "D",
    status: "syncing",
    lastSync: "Syncing...",
    color: "from-orange-500 to-yellow-500",
    trades: 0,
  },
];

export function BrokerSyncCard() {
  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-primary/30 transition-all">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <CardTitle>Broker Sync</CardTitle>
            </div>
            <CardDescription className="mt-2">
              Connected brokers and sync status
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="space-y-3">
          {brokers.map((broker, index) => (
            <motion.div
              key={broker.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
              className="p-4 rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm hover:border-primary/30 transition-all cursor-pointer group/broker relative overflow-hidden"
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${broker.color} opacity-0 group-hover/broker:opacity-5 transition-opacity`} />
              
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-3 flex-1">
                  {/* Broker Logo */}
                  <motion.div 
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${broker.color} flex items-center justify-center shadow-lg group-hover/broker:shadow-xl transition-shadow`}
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-white text-lg">{broker.logo}</span>
                  </motion.div>
                  
                  {/* Broker Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{broker.name}</h4>
                      {broker.trades > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {broker.trades} trades
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {broker.status === "active" && (
                        <>
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {broker.lastSync}
                          </span>
                        </>
                      )}
                      {broker.status === "error" && (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs text-red-500">Sync failed</span>
                        </>
                      )}
                      {broker.status === "syncing" && (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 text-cyan-500 animate-spin" />
                          <span className="text-xs text-cyan-500">{broker.lastSync}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <Badge
                  className={
                    broker.status === "active"
                      ? "bg-green-500/10 text-green-500 border-green-500/30"
                      : broker.status === "error"
                      ? "bg-red-500/10 text-red-500 border-red-500/30"
                      : "bg-cyan-500/10 text-cyan-500 border-cyan-500/30"
                  }
                >
                  {broker.status === "active" ? "Active" : broker.status === "error" ? "Error" : "Syncing"}
                </Badge>
              </div>
            </motion.div>
          ))}

          {/* Add Broker Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="outline" 
              className="w-full border-dashed border-2 border-border hover:border-primary/50 hover:bg-primary/5 h-12 group/add relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover/add:opacity-100 transition-opacity" />
              <Plus className="h-4 w-4 mr-2 relative" />
              <span className="relative">Add New Broker</span>
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
