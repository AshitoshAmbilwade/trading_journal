"use client";

import { useRouter } from "next/navigation";
import { TradeTable } from "@/components/dashboard/TradeTable";
import ImportCsv from "@/components/dashboard/ImportCsv";

export function Dashboard() {
  const router = useRouter();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid gap-4">
        {/* CSV Import */}
        <ImportCsv onImported={() => router.refresh()} />

        {/* Existing Trade Table */}
        <TradeTable />
      </div>
    </div>
  );
}
