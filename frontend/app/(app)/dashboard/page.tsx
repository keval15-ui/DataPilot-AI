"use client";

import { useEffect, useState } from "react";
import { ActivityTable, AnalyticsCharts, DatasetList, QuickActions, RecentQueries, StatCard } from "@/components/dashboard/dashboard-widgets";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { Section } from "@/components/ui/section";
import { fetchDashboardStats, fetchExecutiveReport, type DashboardStats } from "@/lib/services/api";
import { getDataset } from "@/lib/utils/getDataset";
import type { UploadResponse } from "@/types/upload";

const steps = [
  "Analyzing schema structure...",
  "Executing summary analytics with SQLite...",
  "Drafting AI executive recommendations...",
  "Finalizing report compilation..."
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDataset] = useState<UploadResponse | null>(() => getDataset());
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStep, setReportStep] = useState(0);
  const [reportData, setReportData] = useState<any | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

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
  }, []);

  const handleOpenReport = async () => {
    if (!currentDataset) {
      setIsModalOpen(true);
      return;
    }
    setIsModalOpen(true);
    setReportLoading(true);
    setReportStep(0);
    setReportError(null);
    setReportData(null);

    const stepInterval = setInterval(() => {
      setReportStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    try {
      const data = await fetchExecutiveReport(currentDataset.dataset_id);
      setReportData(data);
    } catch (err: any) {
      setReportError(err.message || "Failed to generate AI executive report.");
    } finally {
      clearInterval(stepInterval);
      setReportLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-report");
    if (!printContent) return;

    const win = window.open("", "_blank");
    if (!win) return;
    // Copy current page styles (external stylesheets and inline styles)
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((n) => (n as HTMLElement).outerHTML)
      .join('\n');

    win.document.write(`<!doctype html><html><head><title>Executive Analytics Report - DataPilot AI</title>${styles}</head><body>${printContent.innerHTML}<script>window.onload=function(){window.print();window.close();}</script></body></html>`);
    win.document.close();
  };

  const handleQuestionClick = (question: string) => {
    if (typeof window !== "undefined" && currentDataset) {
      localStorage.setItem("chat_draft_question", question);
      window.location.href = `/chat?dataset=${currentDataset.dataset_id}`;
    }
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
                  <p className="text-xs text-slate-500 mt-2">Please upload a dataset or click &quot;Chat&quot; on an ingested dataset to select it first.</p>
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
              ) : reportError ? (
                <div className="py-8 text-center space-y-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 text-xl font-bold">
                    ⚠️
                  </span>
                  <h4 className="text-white font-medium">Failed to generate report</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">{reportError}</p>
                  <div className="flex justify-center gap-3 mt-4">
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>
                    <Button onClick={handleOpenReport}>Retry</Button>
                  </div>
                </div>
              ) : reportData ? (
                <div className="space-y-6 text-slate-300">
                  
                  {/* Printable report container */}
                  <div id="printable-report" className="space-y-8">
                    <div className="border-b border-white/5 pb-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">DataPilot AI Summary</p>
                      <h1 className="text-2xl font-bold text-white mt-1">Executive Summary: {reportData.overview.filename}</h1>
                      <p className="text-sm text-slate-400 mt-1">Generated dynamically on {new Date(reportData.overview.timestamp).toLocaleDateString()}</p>
                    </div>

                    {/* Section 1: Overview Cards */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Dataset Overview</h2>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Total Rows</span>
                          <p className="text-2xl font-bold text-white mt-1">{reportData.overview.rows?.toLocaleString() ?? "-"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Total Columns</span>
                          <p className="text-2xl font-bold text-white mt-1">{reportData.overview.columns ?? "-"}</p>
                        </div>
                        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Quality Score</span>
                          <p className="text-2xl font-bold text-emerald-400 mt-1">{reportData.quality.score}/100</p>
                        </div>
                      </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Section 2: Data Quality Details */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Data Quality Summary</h2>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Quality Status</p>
                          <p className={`text-sm font-medium mt-1 uppercase ${
                            reportData.quality.status === "clean" ? "text-emerald-400" :
                            reportData.quality.status === "warning" ? "text-amber-400" : "text-rose-400"
                          }`}>{reportData.quality.status.replace("_", " ")}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Total Missing Values</p>
                          <p className="text-sm font-medium text-white mt-1">{reportData.quality.total_missing?.toLocaleString() ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Duplicate Rows</p>
                          <p className="text-sm font-medium text-white mt-1">{reportData.quality.duplicate_rows ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Columns with Missing Data</p>
                          <p className="text-sm font-medium text-white mt-1">{reportData.quality.columns_with_missing_count ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Constant Columns</p>
                          <p className="text-sm font-medium text-white mt-1">{reportData.quality.constant_columns_count ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Schema Compatibility Issues</p>
                          <p className="text-sm font-medium text-white mt-1">{reportData.quality.schema_issues ?? 0}</p>
                        </div>
                      </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Section 3: Dataset Profile */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Dataset Profile</h2>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Numerical Columns</p>
                          <p className="text-sm font-medium text-white mt-1">{reportData.profile.numerical_columns_count ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Categorical Columns</p>
                          <p className="text-sm font-medium text-white mt-1">{reportData.profile.categorical_columns_count ?? 0}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3">
                          <p className="text-xs text-slate-400">Date/Time Columns</p>
                          <p className="text-sm font-medium text-white mt-1">{reportData.profile.date_columns_count ?? 0}</p>
                        </div>
                      </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Section 4 & 7: Numerical Summary Table */}
                    {reportData.numerical_summary && reportData.numerical_summary.length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Numerical Summary</h2>
                        <div className="overflow-x-auto rounded-xl border border-white/10">
                          <table className="min-w-full text-left text-xs">
                            <thead className="bg-slate-950/80 text-slate-400">
                              <tr>
                                <th className="px-3 py-2 font-semibold">Column</th>
                                <th className="px-3 py-2 font-semibold">Count</th>
                                <th className="px-3 py-2 font-semibold">Mean</th>
                                <th className="px-3 py-2 font-semibold">Median</th>
                                <th className="px-3 py-2 font-semibold">Min</th>
                                <th className="px-3 py-2 font-semibold">Max</th>
                                <th className="px-3 py-2 font-semibold">Std Dev</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.numerical_summary.map((col: any, idx: number) => (
                                <tr key={idx} className="border-t border-white/5 bg-slate-900/50">
                                  <td className="px-3 py-2 font-mono text-sky-300">{col.column}</td>
                                  <td className="px-3 py-2 text-slate-300">{col.count}</td>
                                  <td className="px-3 py-2 text-slate-300">{col.mean !== null ? col.mean : "-"}</td>
                                  <td className="px-3 py-2 text-slate-300">{col.median !== null ? col.median : "-"}</td>
                                  <td className="px-3 py-2 text-slate-300">{col.min !== null ? col.min : "-"}</td>
                                  <td className="px-3 py-2 text-slate-300">{col.max !== null ? col.max : "-"}</td>
                                  <td className="px-3 py-2 text-slate-300">{col.std !== null ? col.std : "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <hr className="border-white/5" />

                    {/* Section 5: Key Findings */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Key Findings</h2>
                      <ul className="list-disc pl-5 text-sm space-y-2 text-slate-300">
                        {reportData.narrative.findings.map((finding: string, idx: number) => (
                          <li key={idx}><span className="text-slate-200">{finding}</span></li>
                        ))}
                      </ul>
                    </div>

                    <hr className="border-white/5" />

                    {/* Section 6: Important Distributions */}
                    {reportData.distributions && Object.keys(reportData.distributions).length > 0 && (
                      <div className="space-y-3">
                        <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Important Distributions</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {Object.entries(reportData.distributions).map(([colName, dist]: [string, any]) => (
                            <div key={colName} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                              <h3 className="text-xs font-semibold text-sky-300 uppercase tracking-wider mb-3">{colName.replace("_", " ")} Distribution</h3>
                              <div className="space-y-3">
                                {dist.map((item: any, idx: number) => (
                                  <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-medium text-slate-300 truncate max-w-[150px]">{item.category}</span>
                                      <span className="text-slate-400">{item.count} ({item.percentage}%)</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full"
                                        style={{ width: `${item.percentage}%` }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <hr className="border-white/5" />

                    {/* Section 8: Patterns & Observations */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Patterns & Observations</h2>
                      <p className="text-sm leading-6 text-slate-300">
                        {reportData.narrative.patterns}
                      </p>
                    </div>

                    <hr className="border-white/5" />

                    {/* Section 9: AI Recommendations */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider">AI Recommendations</h2>
                      <ul className="list-disc pl-5 text-sm space-y-2 text-slate-300">
                        {reportData.narrative.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}><span className="text-slate-200">{rec}</span></li>
                        ))}
                      </ul>
                    </div>

                    <hr className="border-white/5" />

                    {/* Section 10: Suggested Questions */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Suggested Questions</h2>
                      <p className="text-xs text-slate-400 mb-2">Click a question below to send it directly into the AI Chat assistant workspace:</p>
                      <div className="space-y-2">
                        {reportData.narrative.suggested_questions.map((q: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleQuestionClick(q)}
                            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900/50 px-4 py-2.5 text-left text-xs text-slate-300 transition hover:border-sky-500/40 hover:bg-slate-800/80"
                          >
                            <span>{q}</span>
                            <span className="text-sky-300">→</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <hr className="border-white/5" />

                    {/* Section 11: Data Integrity & Limitations */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Data Integrity & Limitations</h2>
                      <ul className="list-disc pl-5 text-xs space-y-1.5 text-slate-400">
                        <li>The dataset contains {reportData.overview.rows} rows and {reportData.overview.columns} columns. Statistical findings reflect only this sample.</li>
                        <li>Missing/null values were profiled during data processing (Total found: {reportData.quality.total_missing}).</li>
                        <li>SQL queries for uploaded CSV/Excel datasets are executed against an in-memory SQLite representation of the complete dataset.</li>
                        <li>Statistical relationships/findings represent correlations and observations within the uploaded dataset, and do not necessarily establish direct causation.</li>
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
              ) : null}

            </div>
          </div>
        </div>
      )}

    </Container>
  );
}
