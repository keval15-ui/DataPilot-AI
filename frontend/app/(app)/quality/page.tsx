"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { scanDatasetQuality, type QualityReport, type ColumnReport } from "@/lib/services/quality";
import { CleanDatasetSection } from "@/components/quality/clean-dataset-section";

export default function QualityPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const datasetId = searchParams?.get("dataset");

  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(null);
  
  // Track if we have already triggered the scan to ensure exactly ONE request is made
  const scanTriggeredRef = useRef(false);

  useEffect(() => {
    if (!datasetId) {
      return;
    }

    if (scanTriggeredRef.current) return;
    scanTriggeredRef.current = true;

    setLoading(true);
    setError(null);

    scanDatasetQuality(datasetId)
      .then((res) => {
        setReport(res);
        setLoading(false);
        if (res && typeof window !== "undefined") {
          const datasetObj = {
            dataset_id: res.dataset_id,
            original_filename: res.filename,
            rows: res.summary?.rows,
            columns: res.summary?.columns,
          };
          window.localStorage.setItem("dataset", JSON.stringify(datasetObj));
        }
      })
      .catch((err) => {
        console.error("Quality scan failed:", err);
        setError(err.message || "An error occurred while scanning the dataset.");
        setLoading(false);
      });
  }, [datasetId]);

  // Select the first problematic column by default
  useEffect(() => {
    if (report?.columns && report.columns.length > 0) {
      const firstProblematic = report.columns.find(
        (c) => c.status === "problem" || c.status === "warning"
      );
      setSelectedColumnName(firstProblematic ? firstProblematic.name : report.columns[0].name);
    }
  }, [report]);

  if (!datasetId) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-slate-900 p-4 border border-white/5 shadow-2xl">
          <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="mt-6 text-xl font-semibold text-white">No Dataset Selected</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Please upload a dataset or select an existing one from the dashboard to run the quality scan.
        </p>
        <Button className="mt-6" onClick={() => router.push("/upload")}>
          Upload Dataset
        </Button>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute h-full w-full animate-ping rounded-full bg-sky-500/20" />
          <span className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-tr from-sky-500 to-violet-500 shadow-lg shadow-sky-500/30" />
        </div>
        <h2 className="mt-6 text-lg font-semibold text-white">Scanning Dataset</h2>
        <p className="mt-2 text-sm text-slate-400">Analyzing columns, invalid values, and SQL compatibility...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="rounded-full bg-rose-500/10 p-4 border border-rose-500/20 text-rose-400">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="mt-6 text-lg font-semibold text-white">Scan Failed</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={() => {
            scanTriggeredRef.current = false;
            setLoading(true);
            setError(null);
            scanDatasetQuality(datasetId)
              .then((res) => {
                setReport(res);
                setLoading(false);
                if (res && typeof window !== "undefined") {
                  const datasetObj = {
                    dataset_id: res.dataset_id,
                    original_filename: res.filename,
                    rows: res.summary?.rows,
                    columns: res.summary?.columns,
                  };
                  window.localStorage.setItem("dataset", JSON.stringify(datasetObj));
                }
              })
              .catch((err) => {
                setError(err.message || "Failed to scan.");
                setLoading(false);
              });
          }}>
            Retry Scan
          </Button>
          <Button onClick={() => router.push("/upload")}>Go to Upload</Button>
        </div>
      </Container>
    );
  }

  if (!report) {
    return null;
  }

  const { quality_score, status, sql_ready, summary, sql_issues, columns } = report;

  const selectedColumn = columns.find((c) => c.name === selectedColumnName) || null;

  // Determine styling based on status
  const getStatusBadge = (s: string) => {
    switch (s) {
      case "clean":
        return <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/25">Clean</span>;
      case "needs_attention":
        return <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-400 border border-amber-500/25">Needs Attention</span>;
      case "needs_cleaning":
        return <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-400 border border-rose-500/25">Needs Cleaning</span>;
      default:
        return <span className="rounded-full bg-slate-500/15 px-3 py-1 text-xs font-semibold text-slate-400">{s}</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 stroke-emerald-500";
    if (score >= 70) return "text-amber-400 stroke-amber-500";
    return "text-rose-400 stroke-rose-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "from-emerald-500/5 via-transparent to-slate-950/20";
    if (score >= 70) return "from-amber-500/5 via-transparent to-slate-950/20";
    return "from-rose-500/5 via-transparent to-slate-950/20";
  };

  return (
    <Container className="space-y-8 pb-12">
      <PageShell
        title={report.filename?.includes("_cleaned_") ? "Data Quality Report (Cleaned)" : "Data Quality Report"}
        description={`Quality scan report for ${report.filename || "Uploaded Dataset"}`}
        action={
          <Button onClick={() => router.push(`/chat?dataset=${datasetId}`)} className="shadow-lg shadow-sky-500/20 hover:scale-102 transition-transform">
            Analyze Dataset (Chat) →
          </Button>
        }
      >
        {/* Top Summary Block */}
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
          <Card className="flex flex-col justify-between border-white/5 bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-900/40 p-6 backdrop-blur-xl shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-slate-400">Diagnosis</p>
                  <h3 className="text-xl font-bold text-white mt-1">Dataset Health Audit</h3>
                </div>
                {getStatusBadge(status)}
              </div>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                {status === "clean" 
                  ? "Congratulations! Your dataset is fully compatible and clean. It is fully ready for high-fidelity SQL queries and chart creation."
                  : status === "needs_attention"
                  ? "We detected minor warnings (e.g. spaces in column names, missing values). SQL queries will run, but column references might require escaping."
                  : "Important data consistency issues were found (e.g. invalid numbers, incompatible formats). We recommend cleaning the source file or escaping variables."}
              </p>
            </div>

            {/* Overall SQL Readiness Alert */}
            <div className={`mt-6 rounded-2xl border p-4 backdrop-blur-sm transition-all duration-300 ${
              sql_ready 
                ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                : "border-amber-500/10 bg-amber-500/5 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">{sql_ready ? "✅" : "⚠️"}</span>
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wider">
                    {sql_ready ? "SQL Compatibility: Ready" : "SQL Compatibility: Escape Required"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 leading-normal">
                    {sql_ready 
                      ? "All column names are standard and fully compatible. Groq and DuckDB will execute queries directly."
                      : "Some columns contain spaces or non-standard characters. The query engine will wrap these references in double quotes."}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Radial score gauge */}
          <Card className={`flex flex-col items-center justify-center border-white/5 bg-gradient-to-br ${getScoreBg(quality_score)} p-6 text-center backdrop-blur-xl shadow-xl`}>
            <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total Quality Rating</p>
            
            <div className="relative mt-5 flex h-36 w-36 items-center justify-center">
              {/* Radial track background */}
              <svg className="absolute h-full w-full -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className="stroke-slate-800/40"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  className={`transition-all duration-1000 ${getScoreColor(quality_score)}`}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - quality_score / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-4xl font-bold tracking-tight text-white">{quality_score}</span>
                <span className="text-sm text-slate-400 font-semibold">%</span>
              </div>
            </div>
            <p className="mt-4 text-2xs text-slate-500 font-medium tracking-wide">Based on % of clean vs problem columns</p>
          </Card>
        </div>

        <CleanDatasetSection datasetId={datasetId} report={report} />

        {/* Quick Statistics Grid */}
        <Section title="Overview Statistics" description="Overall metrics from the data scan.">
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Total Rows", value: summary.rows?.toLocaleString() ?? 0 },
              { label: "Total Columns", value: summary.columns ?? 0 },
              { label: "Missing Values", value: summary.missing_values?.toLocaleString() ?? 0, highlight: summary.missing_values > 0 },
              { label: "Duplicate Rows", value: summary.duplicate_rows?.toLocaleString() ?? 0, highlight: summary.duplicate_rows > 0 },
              { label: "Invalid Values", value: summary.invalid_values?.toLocaleString() ?? 0, highlight: summary.invalid_values > 0 },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-slate-900/30 p-4 transition-all duration-300 hover:bg-slate-900/50 hover:border-white/10">
                <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`mt-2 text-2xl font-bold ${stat.highlight ? "text-amber-400" : "text-white"}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* SQL Issues Log */}
        {!sql_ready && sql_issues.length > 0 && (
          <Section title="SQL Compatibility Warnings" description="Issues that might complicate SQL statements.">
            <Card className="border-amber-500/10 bg-amber-500/5 p-5 shadow-lg">
              <div className="space-y-4">
                {sql_issues.map((issue) => (
                  <div key={issue.column} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                    <p className="font-semibold text-sm text-amber-300">{issue.column}</p>
                    <p className="mt-1 text-xs text-slate-400 leading-normal">
                      {issue.issue}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        )}

        {/* Column-by-Column details */}
        <Section title="Column Diagnostics" description="Detailed quality parameters evaluated for each database column.">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Left Side: Column List */}
            <Card className="flex flex-col border-white/5 bg-slate-950/20 p-4 h-[550px] shadow-xl">
              <div className="mb-3 px-2">
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Columns List</p>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {columns.map((col) => {
                  const isSelected = selectedColumnName === col.name;
                  
                  const getStatusBadgeMini = (status: string) => {
                    if (status === "clean") return <span className="h-2 w-2 rounded-full bg-emerald-500" />;
                    if (status === "warning") return <span className="h-2 w-2 rounded-full bg-amber-500" />;
                    return <span className="h-2 w-2 rounded-full bg-rose-500" />;
                  };

                  return (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColumnName(col.name)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-sky-500/40 bg-sky-500/10 shadow-inner"
                          : "border-white/5 bg-slate-900/40 hover:bg-slate-900/70 hover:border-white/10"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-white truncate">{col.name}</p>
                        <p className="mt-0.5 font-mono text-3xs text-slate-500">{col.datatype}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-2">
                        {col.issues && col.issues.length > 0 && (
                          <span className="text-3xs font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-white/5">
                            {col.issues.length} {col.issues.length === 1 ? "Issue" : "Issues"}
                          </span>
                        )}
                        {getStatusBadgeMini(col.status)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Right Side: Detailed Diagnostic Panel */}
            <Card className="flex flex-col border-white/5 bg-slate-950/20 p-6 h-[550px] shadow-xl overflow-y-auto">
              {selectedColumn ? (
                <div className="space-y-6">
                  {/* Selected Column Header */}
                  <div className="flex items-start justify-between flex-wrap gap-3 border-b border-white/5 pb-4">
                    <div>
                      <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400">Selected Column</p>
                      <h4 className="text-lg font-bold text-white mt-1">{selectedColumn.name}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-900 border border-white/10 font-mono px-3 py-1 text-xs text-slate-300">
                        {selectedColumn.datatype}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border ${
                        selectedColumn.status === "clean"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : selectedColumn.status === "warning"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      }`}>
                        {selectedColumn.status}
                      </span>
                    </div>
                  </div>

                  {/* Selected Column Metrics Grid */}
                  <div className="grid gap-3 grid-cols-3">
                    <div className="rounded-xl border border-white/5 bg-slate-900/20 p-3">
                      <p className="text-3xs text-slate-500 uppercase tracking-wider">Missing Values</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {selectedColumn.missing_count?.toLocaleString() ?? 0}
                      </p>
                      <p className="text-3xs text-slate-400 mt-0.5">
                        {selectedColumn.total_values > 0 
                          ? `${((selectedColumn.missing_count / selectedColumn.total_values) * 100).toFixed(1)}%`
                          : "0.0%"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-slate-900/20 p-3">
                      <p className="text-3xs text-slate-500 uppercase tracking-wider">Invalid Values</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {selectedColumn.invalid_count?.toLocaleString() ?? 0}
                      </p>
                      <p className="text-3xs text-slate-400 mt-0.5">
                        {selectedColumn.total_values > 0 
                          ? `${((selectedColumn.invalid_count / selectedColumn.total_values) * 100).toFixed(1)}%`
                          : "0.0%"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-slate-900/20 p-3">
                      <p className="text-3xs text-slate-500 uppercase tracking-wider">Unique Values</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {selectedColumn.unique_count?.toLocaleString() ?? 0}
                      </p>
                      <p className="text-3xs text-slate-400 mt-0.5">
                        In entire series
                      </p>
                    </div>
                  </div>

                  {/* Detailed Issues Log */}
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Diagnostic Details</h5>
                    {selectedColumn.issues && selectedColumn.issues.length > 0 ? (
                      <div className="space-y-3">
                        {selectedColumn.issues.map((issue, idx) => {
                          const isProblem = issue.severity === "problem";
                          const severityColor = isProblem
                            ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20";

                          return (
                            <div key={idx} className="rounded-xl border border-white/5 bg-slate-900/40 p-4 text-xs text-slate-300">
                              <div className="flex items-center gap-2 flex-wrap justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`rounded-full border px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider ${severityColor}`}>
                                    {issue.severity || "warning"}
                                  </span>
                                  <span className="font-semibold text-slate-200">
                                    {issue.type ? issue.type.replace(/_/g, " ") : "Anomaly"}
                                  </span>
                                </div>
                                {issue.count > 0 && (
                                  <span className="text-3xs text-slate-500 font-medium">
                                    {issue.count.toLocaleString()} occurrences
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                                {issue.message}
                              </p>
                              {issue.examples && issue.examples.length > 0 && (
                                <div className="mt-3 bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                                  <p className="text-3xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Anomalous Examples</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {issue.examples.slice(0, 5).map((ex, index) => (
                                      <span key={index} className="font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-300 text-3xs border border-white/5">
                                        {String(ex) === "" ? '""' : String(ex)}
                                      </span>
                                    ))}
                                    {issue.examples.length > 5 && (
                                      <span className="text-3xs text-slate-500 self-center">
                                        + {issue.examples.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-white/5 bg-slate-900/10 text-center">
                        <span className="text-3xl">✨</span>
                        <p className="mt-3 text-sm text-slate-300 font-medium">This Column is Clean</p>
                        <p className="mt-1 text-xs text-slate-500 max-w-xs">
                          No structural anomalies, type mismatches, or missing entries were detected.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sample Values Preview */}
                  {selectedColumn.sample_values && selectedColumn.sample_values.length > 0 && (
                    <div className="border-t border-white/5 pt-4">
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Head Sample Values</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedColumn.sample_values.map((val: any, idx: number) => (
                          <span key={idx} className="font-mono bg-slate-900 px-2.5 py-1 rounded-lg text-slate-300 text-xs border border-white/5 shadow-inner">
                            {String(val) === "" ? '""' : String(val)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                  <span className="text-4xl mb-4">👈</span>
                  <p className="text-sm">Select a column from the list to see diagnostics.</p>
                </div>
              )}
            </Card>
          </div>
        </Section>
      </PageShell>
    </Container>
  );
}
