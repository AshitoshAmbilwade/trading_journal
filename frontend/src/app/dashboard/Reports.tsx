"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, Download, Calendar, FileSpreadsheet, File, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportsApi, ExportLog, ExportType, ExportPeriod } from "@/api/exports";
import { Skeleton } from "@/components/ui/skeleton";

export function Reports() {
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>("monthly");

  useEffect(() => {
    loadExportLogs();
  }, []);

  const loadExportLogs = async () => {
    try {
      setLoading(true);
      const logs = await exportsApi.getAll("demo-user");
      setExportLogs(logs);
    } catch (error) {
      console.error("Error loading export logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (format: ExportType) => {
    try {
      setGenerating(true);
      await exportsApi.generate({
        userId: "demo-user",
        type: "trades",
        period: selectedPeriod,
        format,
        includeAI: true,
      });
      await loadExportLogs();
    } catch (error) {
      console.error("Error generating export:", error);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl mb-2">Reports & Export</h1>
          <p className="text-muted-foreground">
            Generate and download comprehensive trading reports
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Export Generator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>Select period and format to export your trades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Period Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Period</label>
                  <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as ExportPeriod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Export Format Cards */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Export Format</label>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* PDF Export */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => handleGenerate("PDF")}
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <File className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">PDF Report</h4>
                          <p className="text-xs text-muted-foreground">
                            Detailed report with charts
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={generating}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                    </motion.div>

                    {/* CSV Export */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => handleGenerate("CSV")}
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">CSV File</h4>
                          <p className="text-xs text-muted-foreground">
                            Raw data for analysis
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={generating}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                    </motion.div>

                    {/* Excel Export */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all cursor-pointer group"
                      onClick={() => handleGenerate("Excel")}
                    >
                      <div className="flex flex-col items-center text-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FileSpreadsheet className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Excel File</h4>
                          <p className="text-xs text-muted-foreground">
                            Formatted spreadsheet
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={generating}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Generate
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* AI Summary Toggle */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Include AI Summary</h4>
                      <p className="text-xs text-muted-foreground">
                        Add AI insights to your export
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Included
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Export History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Exports</CardTitle>
                <CardDescription>Download previous reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))
                  ) : exportLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No exports yet
                      </p>
                    </div>
                  ) : (
                    exportLogs.slice(0, 5).map((log) => (
                      <motion.div
                        key={log._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {log.exportType === "PDF" && <File className="h-4 w-4 text-red-500" />}
                            {log.exportType === "CSV" && <FileText className="h-4 w-4 text-green-500" />}
                            {log.exportType === "Excel" && <FileSpreadsheet className="h-4 w-4 text-blue-500" />}
                            <span className="text-sm font-medium">{log.fileName}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {log.exportType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {log.totalTrades} trades • {formatDate(log.generatedAt)}
                        </p>
                        <Button size="sm" variant="outline" className="w-full">
                          <Download className="h-3 w-3 mr-2" />
                          Download
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
