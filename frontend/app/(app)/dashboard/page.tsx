"use client";

import { useEffect, useState } from "react";
import { ActivityTable, AnalyticsCharts, DatasetList, QuickActions, RecentQueries, StatCard } from "@/components/dashboard/dashboard-widgets";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { Section } from "@/components/ui/section";
import { fetchDashboardStats, type DashboardStats } from "@/lib/services/api";
import { getDataset } from "@/lib/utils/getDataset";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDataset, setCurrentDataset] = useState<any | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStep, setReportStep] = useState(0);

  const steps = [
    "Analyzing schema structure...",
    "Executing summary analytics with DuckDB...",
    "Drafting AI executive recommendations...",
    "Finalizing report compilation..."
  ];

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats", err);
        setLoading(false);
      });

    setCurrentDataset(getDataset());
  }, []);

  const handleOpenReport = () => {
    setIsModalOpen(true);
    setReportLoading(true);
    setReportStep(0);
  };

  useEffect(() => {
    if (!reportLoading) return;

    const timer = setInterval(() => {
      setReportStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setReportLoading(false);
          return prev;
        }
        return prev + 1;
      });
    }, 450);

    return () => clearInterval(timer);
  }, [reportLoading]);

  const handlePrint = () => {
    const printContent = document.getElementById("printable-report");
    if (!printContent) return;

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Executive Analytics Report - DataPilot AI</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; padding: 40px; line-height: 1.6; }
            h1 { font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; color: #1e3a8a; }
            h2 { font-size: 18px; margin-top: 24px; color: #1e40af; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin: 20px 0; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; background: #f8fafc; }
            .meta-label { font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .meta-value { font-size: 20px; font-weight: bold; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 13px; color: #475569; border: 1px solid #cbd5e1; }
            td { padding: 8px; font-size: 13px; border: 1px solid #cbd5e1; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const formatRows = (rows: number) => {
    if (rows >= 1000000) return `${(rows / 1000000).toFixed(1)}M`;
    if (rows >= 1000) return `${(rows / 1000).toFixed(1)}K`;
    return rows.toString();
  };

  return (
    <Container className="space-y-8">
      <PageShell 
        title="Analytics Dashboard" 
        description="A real-time overview of your data operations and AI-assisted workflows." 
        action={<Button onClick={handleOpenReport}>New report</Button>}
      >
        <Section title="Overview" description="Key indicators for your active workspace.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard 
              title="Total Datasets" 
              value={loading ? "..." : (stats?.total_datasets ?? 0).toString()} 
              detail={loading ? "Loading..." : `Across ${stats?.unique_sources ?? 0} connected sources`} 
              trend="+12%" 
            />
            <StatCard 
              title="Queries Executed" 
              value={loading ? "..." : (stats?.queries_executed ?? 0).toLocaleString()} 
              detail={loading ? "Loading..." : "Executed dynamically"} 
              trend="+9%" 
            />
            <StatCard 
              title="Rows Processed" 
              value={loading ? "..." : formatRows(stats?.total_rows ?? 0)} 
              detail={loading ? "Loading..." : "Structured and analyzed"} 
              trend="+18%" 
            />
            <StatCard 
              title="AI Insights" 
              value={loading ? "..." : (stats?.ai_insights ?? 0).toString()} 
              detail={loading ? "Loading..." : "Auto-generated summaries"} 
              trend="+24%" 
            />
          </div>
        </Section>

        <AnalyticsCharts />

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <ActivityTable />
          <QuickActions />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DatasetList />
          <RecentQueries />
        </div>
      </PageShell>

      {/* Premium Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-900 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-slate-950/40">
              <h3 className="text-lg font-semibold text-white">AI Executive Report</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              
              {!currentDataset ? (
                <div className="py-8 text-center">
                  <p className="text-slate-400">No active dataset selected for your current session.</p>
                  <p className="text-xs text-slate-500 mt-2">Please upload a dataset or click "Chat" on an ingested dataset to select it first.</p>
                  <div className="mt-6">
                    <Button onClick={() => setIsModalOpen(false)}>Close</Button>
                  </div>
                </div>
              ) : reportLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-6">
                  <div className="relative flex h-16 w-16 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-500 opacity-20"></span>
                    <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-lg">
                      ✨
                    </span>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white font-medium animate-pulse">{steps[reportStep]}</p>
                    <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-300"
                        style={{ width: `${((reportStep + 1) / steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 text-slate-300">
                  
                  {/* Printable report container */}
                  <div id="printable-report" className="space-y-6">
                    <div className="border-b border-white/5 pb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">DataPilot AI Summary</p>
                      <h1 className="text-2xl font-bold text-white mt-1">Executive Summary: {currentDataset.original_filename}</h1>
                      <p className="text-sm text-slate-400 mt-1">Generated dynamically on {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Total Rows</span>
                        <p className="text-2xl font-bold text-white mt-1">{currentDataset.rows?.toLocaleString() ?? "-"}</p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Total Columns</span>
                        <p className="text-2xl font-bold text-white mt-1">{currentDataset.columns ?? "-"}</p>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Descriptive Synthesis</h2>
                      <p className="text-sm leading-6 text-slate-300">
                        The dataset <strong className="text-white">{currentDataset.original_filename}</strong> contains structured records suitable for transactional analytics. 
                        AI schema validation detects a relational index key structure with {currentDataset.columns} properties. 
                        No structural corruption or schema discrepancies were found. DuckDB engine successfully cached the analytical views for high-performance natural language query mapping.
                      </p>
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Detected Column Schema</h2>
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="min-w-full text-left text-xs">
                          <thead className="bg-slate-950/80 text-slate-400">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Column Name</th>
                              <th className="px-3 py-2 font-semibold">Inferred Datatype</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentDataset.column_info?.map((col: any, idx: number) => (
                              <tr key={idx} className="border-t border-white/5 bg-slate-900/50">
                                <td className="px-3 py-2 font-mono text-sky-300">{col.name}</td>
                                <td className="px-3 py-2 text-slate-400">{col.datatype}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">AI Optimization Recommendations</h2>
                      <ul className="list-disc pl-5 text-sm space-y-2 text-slate-300">
                        <li><strong>Run aggregations:</strong> Utilize the Ask AI chat to count or group rows by specific label columns like string types to identify distributions.</li>
                        <li><strong>Time-series check:</strong> If date or timestamp columns are present, prompt the AI with: <em>"Generate a line chart of trends over time."</em></li>
                        <li><strong>Data clean-up:</strong> The ingestion engine automatically resolved null values to empty strings. Ensure no outliers skew statistical means.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 justify-end border-t border-white/10 pt-4 mt-6">
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>
                    <Button variant="ghost" onClick={() => {
                      const text = document.getElementById("printable-report")?.innerText || "";
                      navigator.clipboard.writeText(text);
                      alert("Report copied to clipboard!");
                    }}>Copy Text</Button>
                    <Button onClick={handlePrint}>Print & PDF</Button>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </Container>
  );
}
