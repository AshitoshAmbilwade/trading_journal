"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Filter, Download, Plus, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { tradesApi, Trade } from "../../api/trades";
import { Skeleton } from "../ui/skeleton";

export function TradeTable() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTrades();
  }, []);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const data = await tradesApi.getAll();
      setTrades(data);
    } catch (error) {
      console.error("Error loading trades:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades.filter(trade =>
    trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.broker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.strategy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur-xl relative overflow-hidden group hover:border-primary/30 transition-all">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <CardTitle>Trade Journal</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All your trades in one place
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="border-primary/30 hover:bg-primary/10">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Trade
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {/* Search and Filter */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by symbol, broker, or strategy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/30 border-border/50 focus:border-primary"
            />
          </div>
          <Button size="icon" variant="outline" className="border-primary/30 hover:bg-primary/10">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Entry/Exit</TableHead>
                <TableHead>P/L</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No trades found. Start trading or import your trades.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTrades.map((trade) => (
                  <motion.tr
                    key={trade._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-sm">
                      {formatDate(trade.tradeDate)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{trade.symbol}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={trade.type === "Buy" ? "default" : "secondary"}
                        className={trade.type === "Buy" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}
                      >
                        {trade.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell className="font-mono text-sm">
                      ₹{trade.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {trade.pnl >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={trade.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                          ₹{Math.abs(trade.pnl).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trade.strategy ? (
                        <Badge variant="outline">{trade.strategy}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {trade.broker ? (
                        <span className="text-sm">{trade.broker}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Manual</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
