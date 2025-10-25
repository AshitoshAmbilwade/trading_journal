'use client';

import { TradeTable } from "@/components/dashboard/TradeTable";


export function Dashboard (){ 
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid gap-4">
        {/* Add your dashboard content here */}
        <TradeTable/>
      </div>
    </div>
  );


};