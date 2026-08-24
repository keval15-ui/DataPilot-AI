"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  cleanDataset, 
  type QualityReport, 
  type CleaningResponse 
} from "@/lib/services/quality";
import { 
  Sparkles, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Calendar, 
  Mail, 
  Hash, 
  TextCursorInput, 
  ListChecks 
} from "lucide-react";

interface CleanDatasetSectionProps {
  datasetId: string;
  report: QualityReport;
}

export function CleanDatasetSection({ datasetId, report }: CleanDatasetSectionProps) {
  const router = useRouter();

  // State: 'idle' | 'cleaning' | 'success' | 'error'
  const [cleaningState, setCleaningState] = useState<"idle" | "cleaning" | "success" | "error">("idle");
  const [activeStep, setActiveStep] = useState(0); // 0: Analyzing, 1: Cleaning, 2: Verifying
  const [result, setResult] = useState<CleaningResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});

  // 1. Calculate dynamic cleanable issues
  const getCleanableIssuesCount = (rep: QualityReport) => {
    let count = 0;
    if (rep.summary?.duplicate_rows) {
      count += rep.summary.duplicate_rows;
    }
    rep.columns?.forEach((col) => {
      col.issues?.forEach((issue) => {
        if (
          issue.type !== "statistical_outlier" &&
          issue.type !== "constant_column" &&
          issue.type !== "empty_column" &&
          issue.type !== "sql_column_name" &&
          issue.type !== "column_name_whitespace"
        ) {
          count += issue.count || 0;
        }
      });
    });
    return count;
  };

  const totalCleanable = getCleanableIssuesCount(report);

  // 2. Step progress transition simulation while fetching
  useEffect(() => {
    if (cleaningState !== "cleaning") return;

    setActiveStep(0);
    const timer1 = setTimeout(() => setActiveStep(1), 1800);
    const timer2 = setTimeout(() => setActiveStep(2), 3800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [cleaningState]);

  // 3. Trigger cleaning API call
  const handleClean = async () => {
    if (cleaningState === "cleaning") return;

    setCleaningState("cleaning");
    setErrorMsg(null);

    try {
      const res = await cleanDataset(datasetId);
      setResult(res);
      setCleaningState("success");
    } catch (err: any) {
      console.error("Dataset cleaning failed:", err);
      setErrorMsg(err.message || "An unexpected error occurred while cleaning the dataset.");
      setCleaningState("error");
    }
  };

  // 4. View Cleaned Quality report
  const handleViewCleaned = () => {
    if (!result) return;
    const cleanId = result.cleaned_dataset_id || result.dataset_id;
    // Set localStorage details for consistency
    const datasetObj = {
      dataset_id: cleanId,
      original_filename: result.cleaned_filename,
      rows: result.summary.cleaned_rows,
      columns: result.summary.cleaned_columns,
    };
    localStorage.setItem("dataset", JSON.stringify(datasetObj));
    
    // Navigate to Quality report for the cleaned dataset version
    router.push(`/quality?dataset=${cleanId}`);
  };

  // 5. Navigate to Chat using the Cleaned Dataset
  const handleChat = () => {
    if (!result) return;
    const cleanId = result.cleaned_dataset_id || result.dataset_id;
    // Set localStorage details for consistency
    const datasetObj = {
      dataset_id: cleanId,
      original_filename: result.cleaned_filename,
      rows: result.summary.cleaned_rows,
      columns: result.summary.cleaned_columns,
    };
    localStorage.setItem("dataset", JSON.stringify(datasetObj));
    
    // Navigate to Chat page
    router.push(`/chat?dataset=${cleanId}`);
  };

  // 6. Accordion toggle
  const toggleColumn = (colName: string) => {
    setExpandedColumns((prev) => ({
      ...prev,
      [colName]: !prev[colName],
    }));
  };

  // 7. Group column modifications from response
  const getChangesByColumnGrouped = () => {
    const grouped: Record<string, string[]> = {};
    if (!result || !result.changes_by_column) return grouped;

    const categories = [
      { key: "missing_values", label: "missing values fix" },
      { key: "whitespace", label: "whitespace fix" },
      { key: "categorical", label: "categorical fix" },
      { key: "numeric", label: "numeric fix" },
      { key: "dates", label: "date standardization" },
      { key: "email", label: "email whitespace fix" }
    ];

    categories.forEach(({ key, label }) => {
      const colMap = (result.changes_by_column as any)[key];
      if (colMap && typeof colMap === "object") {
        Object.entries(colMap).forEach(([colName, count]) => {
          if (typeof count === "number" && count > 0) {
            if (!grouped[colName]) {
              grouped[colName] = [];
            }
            const pluralizedLabel = count === 1 ? label : `${label}es`;
            grouped[colName].push(`${count} ${pluralizedLabel}`);
          }
        });
      }
    });

    return grouped;
  };

  const changesByColumnGrouped = getChangesByColumnGrouped();
  const hasChangesByColumn = Object.keys(changesByColumnGrouped).length > 0;

  // 8. Verification state
  const isVerified = result?.verification?.status === "clean" && result?.verification?.sql_ready === true;

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        
        {/* ====================================================
            STATE 1 — READY TO CLEAN
            ==================================================== */}
        {cleaningState === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-white/5 bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-900/40 p-6 backdrop-blur-xl shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-semibold text-base">
                    <Sparkles className="w-5 h-5" />
                    <span>Clean Dataset</span>
                  </div>
                  <p className="text-sm text-slate-300">
                    Fix safe data inconsistencies and create a verified copy of your dataset.
                  </p>
                  <p className="text-xs text-slate-500">
                    Your original file will not be modified.
                  </p>
                </div>
                <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0">
                  <Button
                    onClick={handleClean}
                    className="w-full md:w-auto font-semibold"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Clean Dataset
                  </Button>
                  <span className="text-2xs font-medium text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full text-center">
                    {totalCleanable} safe transformations detected
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ====================================================
            STATE 2 — CLEANING IN PROGRESS
            ==================================================== */}
        {cleaningState === "cleaning" && (
          <motion.div
            key="cleaning"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-white/5 bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-900/40 p-8 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-6">
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-base">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Cleaning Dataset</span>
              </div>

              {/* Step indicator */}
              <div className="relative flex items-center justify-between w-full max-w-sm mx-auto px-2 mt-6">
                <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-800" />
                <div 
                  className="absolute left-6 top-4 h-0.5 bg-sky-500 transition-all duration-1000 ease-out"
                  style={{
                    width: `${activeStep === 0 ? "15%" : activeStep === 1 ? "50%" : "85%"}`,
                  }}
                />
                {["Analyzing", "Cleaning", "Verifying"].map((step, idx) => {
                  const isCompleted = idx < activeStep;
                  const isActive = idx === activeStep;

                  return (
                    <div key={step} className="relative z-10 flex flex-col items-center">
                      <div 
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-500 ${
                          isCompleted 
                            ? "border-sky-500 bg-sky-500 text-white" 
                            : isActive 
                            ? "border-sky-500 bg-slate-950 text-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]" 
                            : "border-slate-800 bg-slate-950 text-slate-500"
                        }`}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                      <span 
                        className={`absolute top-10 whitespace-nowrap text-[10px] font-medium transition-colors duration-500 ${
                          isActive ? "text-sky-400 font-semibold" : isCompleted ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-10 space-y-3 w-full">
                <p className="text-sm text-slate-300 font-medium">
                  Creating a clean copy of your dataset...
                </p>
                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-1000 ease-out"
                    style={{
                      width: `${activeStep === 0 ? "33%" : activeStep === 1 ? "66%" : "95%"}`,
                    }}
                  />
                </div>
                <p className="text-3xs text-slate-500 font-medium pt-2">
                  Please don't close this page.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ====================================================
            STATE 3 — CLEANING COMPLETED (SUCCESS)
            ==================================================== */}
        {cleaningState === "success" && result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-white/5 bg-gradient-to-br from-slate-900/60 via-slate-950/70 to-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
              
              {/* Success Header */}
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Dataset Cleaned</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your original dataset was preserved. A cleaned copy has been created and verified.
                  </p>
                </div>
              </div>

              {/* Two Column Layout on Desktop */}
              <div className="grid gap-6 md:grid-cols-2 mt-6">
                
                {/* Left Column: Filenames & Skipped Details */}
                <div className="space-y-6">
                  
                  {/* Original vs Cleaned Dataset Filenames */}
                  <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 space-y-3.5 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800 border border-white/5 text-slate-400 shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Original Dataset</span>
                        <p className="text-xs font-mono font-semibold text-slate-300 truncate">{result.original_filename}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 border-t border-white/5 pt-3.5">
                      <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-sky-400 uppercase font-bold tracking-wider block">Cleaned Dataset</span>
                        <p className="text-xs font-mono font-semibold text-white truncate">{result.cleaned_filename}</p>
                      </div>
                    </div>
                    <div className="border-t border-white/5 pt-2 text-center">
                      <span className="text-[10px] text-slate-500 font-medium italic">Original dataset preserved</span>
                    </div>
                  </div>

                  {/* Skipped / Unsafe Changes Warning Card */}
                  <div className="rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4 text-amber-300 space-y-2">
                    <div className="flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-amber-400">Not Automatically Changed</h4>
                        <p className="mt-1 text-xs text-slate-400 leading-normal">
                          We left these values unchanged because they require domain-specific validation.
                        </p>
                      </div>
                    </div>
                    
                    <ul className="mt-3 space-y-2.5 text-[11px] text-slate-400 border-t border-white/5 pt-3">
                      <li className="flex flex-col">
                        <span className="font-semibold text-slate-300">• Ambiguous dates</span>
                        <span className="text-slate-500 pl-3 leading-normal">Skipped to avoid altering valid dates with ambiguous format mappings.</span>
                      </li>
                      <li className="flex flex-col">
                        <span className="font-semibold text-slate-300">• Invalid emails</span>
                        <span className="text-slate-500 pl-3 leading-normal">{result.skipped.invalid_emails}</span>
                      </li>
                      <li className="flex flex-col">
                        <span className="font-semibold text-slate-300">• Statistical outliers</span>
                        <span className="text-slate-500 pl-3 leading-normal">{result.skipped.outliers}</span>
                      </li>
                      <li className="flex flex-col">
                        <span className="font-semibold text-slate-300">• Constant columns</span>
                        <span className="text-slate-500 pl-3 leading-normal">{result.skipped.constant_columns}</span>
                      </li>
                      <li className="flex flex-col">
                        <span className="font-semibold text-slate-300">• Values whose meaning cannot be safely inferred</span>
                        <span className="text-slate-500 pl-3 leading-normal">{result.skipped.unknown_semantics}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Dynamic Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {isVerified ? (
                      <>
                        <Button 
                          variant="primary" 
                          onClick={handleChat}
                          className="flex-1 font-semibold"
                        >
                          Chat with Cleaned Dataset
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={handleViewCleaned}
                          className="flex-1 font-semibold"
                        >
                          View Cleaned Dataset
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="secondary" 
                        onClick={handleViewCleaned}
                        className="w-full font-semibold border-amber-500/25 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10"
                      >
                        View Data Quality
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right Column: Verification, Metrics & Detailed Changes */}
                <div className="space-y-6">
                  
                  {/* Verification Card */}
                  <div className={`rounded-2xl border p-4 backdrop-blur-sm shadow-sm ${
                    isVerified
                      ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.02)]"
                      : "border-amber-500/10 bg-amber-500/5 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.02)]"
                  }`}>
                    <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider">✓ Verification</h4>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        isVerified 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {result.verification.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-950/40 rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Quality Score</span>
                        <span className="text-sm font-bold text-white mt-1 block">
                          {result.verification.quality_score} <span className="text-[10px] text-slate-500">/ 100</span>
                        </span>
                      </div>
                      <div className="bg-slate-950/40 rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Status</span>
                        <span className="text-xs font-bold text-white mt-1 block capitalize truncate">
                          {result.verification.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 rounded-xl p-2 border border-white/5">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">SQL Ready</span>
                        <span className="text-xs font-bold text-white mt-1 block">
                          {result.verification.sql_ready ? "✓ Yes" : "✕ No"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-center font-medium leading-normal">
                      {isVerified 
                        ? "Dataset verified and ready for analysis." 
                        : "Dataset still needs attention."}
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Original Rows", value: result.summary.original_rows?.toLocaleString() ?? 0, desc: "Original file" },
                      { label: "Cleaned Rows", value: result.summary.cleaned_rows?.toLocaleString() ?? 0, desc: "Processed file" },
                      { label: "Rows Removed", value: (result.summary.original_rows - result.summary.cleaned_rows)?.toLocaleString() ?? 0, desc: "Duplicates removed", highlight: (result.summary.original_rows - result.summary.cleaned_rows) > 0 },
                      { label: "Columns", value: result.summary.cleaned_columns?.toLocaleString() ?? 0, desc: "Dataset fields" },
                    ].map((stat, i) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-slate-900/30 p-3 shadow-inner">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{stat.label}</span>
                        <p className={`text-lg font-bold mt-1 ${stat.highlight ? "text-amber-400" : "text-white"}`}>{stat.value}</p>
                        <span className="text-[9px] text-slate-600 block mt-0.5 leading-none">{stat.desc}</span>
                      </div>
                    ))}
                  </div>

                  {/* Changes Made */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Changes Made</h4>
                    
                    <div className="rounded-2xl border border-white/5 bg-slate-950/20 p-4 space-y-2.5">
                      {[
                        { label: "Missing values normalized", count: result.changes.missing_values_normalized, icon: Hash },
                        { label: "Whitespace trimmed", count: result.changes.whitespace_trimmed, icon: TextCursorInput },
                        { label: "Categorical values normalized", count: result.changes.categorical_values_normalized, icon: ListChecks },
                        { label: "Numeric values normalized", count: result.changes.numeric_values_normalized, icon: Hash },
                        { label: "Dates normalized", count: result.changes.dates_normalized, icon: Calendar },
                        { label: "Email whitespace cleaned", count: result.changes.email_whitespace_cleaned, icon: Mail },
                        { label: "Duplicate rows removed", count: result.changes.duplicate_rows_removed, icon: Trash2 },
                      ].map((item, idx) => {
                        if (item.count === undefined) return null;
                        const Icon = item.icon;
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{item.label}</span>
                            </div>
                            <span className={`font-mono font-semibold ${item.count > 0 ? "text-sky-400" : "text-slate-500"}`}>
                              {item.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Changes by Column Accordion */}
                  {hasChangesByColumn && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Changes by Column</h4>
                      <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
                        {Object.entries(changesByColumnGrouped).map(([colName, fixes]) => (
                          <div key={colName} className="rounded-xl border border-white/5 bg-slate-900/30 overflow-hidden">
                            <button 
                              onClick={() => toggleColumn(colName)}
                              className="flex w-full items-center justify-between p-3 text-left hover:bg-slate-900/50 transition-colors"
                            >
                              <span className="font-semibold text-xs text-white truncate max-w-[80%]">{colName}</span>
                              <span className="text-slate-400 text-xs shrink-0">
                                {expandedColumns[colName] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </span>
                            </button>
                            {expandedColumns[colName] && (
                              <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-1 bg-slate-950/20">
                                {fixes.map((fix, idx) => (
                                  <p key={idx} className="text-2xs text-slate-400 pl-2 border-l border-sky-500/40 font-medium">
                                    {fix}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ====================================================
            STATE 4 — ERROR / FAILURE STATE
            ==================================================== */}
        {cleaningState === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-xl shadow-xl text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <XCircle className="w-8 h-8" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cleaning Failed</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {errorMsg || "Something went wrong while cleaning this dataset."}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button 
                  variant="primary" 
                  onClick={handleClean}
                  className="font-semibold shadow-rose-500/10"
                >
                  Try Again
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setCleaningState("idle")}
                  className="font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
