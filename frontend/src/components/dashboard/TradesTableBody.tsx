// TradesTableBody.tsx
'use client';
import React from 'react';
import { motion } from 'motion/react';
import { BarChart3, TrendingUp, TrendingDown, Eye, Edit, Trash2 } from 'lucide-react';
import { TableRow, TableCell } from '../ui/table';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

type Trade = any;

type Props = {
  loading: boolean;
  filteredTrades: Trade[];
  formatDate: (d: string) => string;
  formatCurrency: (n: number) => string;
  handleEditTrade: (t: Trade) => void;
  handleDeleteTrade: (id: string) => Promise<void>;
  routerPush: (path: string) => void;
};

export default function TradesTableBody({
  loading,
  filteredTrades,
  formatDate,
  formatCurrency,
  handleEditTrade,
  handleDeleteTrade,
  routerPush,
}: Props) {
  if (loading) {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i} className="border-b border-gray-700/50">
            {[...Array(10)].map((_, j) => (
              <TableCell key={j}>
                <Skeleton className="h-4 w-full bg-gray-700" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    );
  }

  if (filteredTrades.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={10} className="text-center py-8">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <BarChart3 className="h-12 w-12 opacity-50" />
            <p className="font-medium">No trades found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {filteredTrades.map((trade: any) => (
        <motion.tr
          key={trade._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border-b border-gray-700/30 hover:bg-gray-800/40 transition-colors"
        >
          <TableCell className="py-4">
            <div className="font-medium">{formatDate(trade.tradeDate)}</div>
          </TableCell>
          <TableCell>
            <div className="font-semibold text-white">{trade.symbol}</div>
          </TableCell>
          <TableCell>
            <Badge
              className={`
                font-medium px-2 py-1 text-xs
                ${trade.type === "Buy" 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-red-500/10 text-red-400 border-red-500/20"
                }
              `}
            >
              {trade.type}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="font-medium">{trade.quantity}</div>
          </TableCell>
          <TableCell>
            <div className="font-medium">{formatCurrency(Number(trade.entryPrice))}</div>
          </TableCell>
          <TableCell>
            <div className={trade.exitPrice ? "font-medium" : "text-gray-500"}>
              {trade.exitPrice ? formatCurrency(Number(trade.exitPrice)) : "-"}
            </div>
          </TableCell>
          <TableCell>
            <div className={`flex items-center gap-1.5 font-semibold ${
              Number((trade as any).pnl || 0) >= 0 ? "text-green-400" : "text-red-400"
            }`}>
              {Number((trade as any).pnl || 0) >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {formatCurrency(Math.abs(Number((trade as any).pnl || 0)))}
            </div>
          </TableCell>
          <TableCell>
            <div className={trade.strategy ? "text-white" : "text-gray-500"}>
              {trade.strategy || "-"}
            </div>
          </TableCell>
          <TableCell>
            <div className={trade.broker ? "text-white" : "text-gray-500"}>
              {trade.broker || "Manual"}
            </div>
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 hover:bg-gray-700"
                onClick={() => routerPush(`/trades/${trade._id}`)}
                title="View details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 hover:bg-gray-700"
                onClick={() => handleEditTrade(trade)}
                title="Edit trade"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 hover:bg-red-500/10 text-red-400 hover:text-red-300"
                onClick={() => handleDeleteTrade(trade._id!)}
                title="Delete trade"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </motion.tr>
      ))}
    </>
  );
}
