import { request } from "./api";

export interface QualitySummary {
  rows: number;
  columns: number;
  missing_values: number;
  duplicate_rows: number;
  invalid_values: number;
  clean_columns: number;
  warning_columns: number;
  problem_columns: number;
}

export interface SQLIssue {
  column: string;
  issue: string;
}

export interface Issue {
  type: string;
  severity: string;
  count: number;
  examples: any[];
  message: string;
}

export interface ColumnReport {
  name: string;
  datatype: string;
  total_values: number;
  missing_count: number;
  unique_count: number;
  invalid_count: number;
  issues: Issue[];
  status: "clean" | "warning" | "problem";
  sample_values?: any[];
}

export interface QualityReport {
  dataset_id: string;
  filename: string;
  status: "clean" | "needs_attention" | "needs_cleaning";
  quality_score: number;
  sql_ready: boolean;
  summary: QualitySummary;
  sql_issues: SQLIssue[];
  columns: ColumnReport[];
}

export async function scanDatasetQuality(datasetId: string): Promise<QualityReport> {
  return request<QualityReport>(`/quality/scan?dataset_id=${datasetId}`, {
    method: "POST",
  });
}
