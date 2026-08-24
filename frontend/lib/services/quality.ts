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

export interface CleaningResponse {
  dataset_id: string;
  cleaned_dataset_id?: string;
  original_filename: string;
  cleaned_filename: string;
  original_file_path: string;
  cleaned_file_path: string;
  status: string;
  summary: {
    original_rows: number;
    cleaned_rows: number;
    original_columns: number;
    cleaned_columns: number;
  };
  changes: {
    missing_values_normalized: number;
    whitespace_trimmed: number;
    categorical_values_normalized: number;
    numeric_values_normalized: number;
    dates_normalized: number;
    email_whitespace_cleaned: number;
    duplicate_rows_removed: number;
  };
  changes_by_column: {
    missing_values?: Record<string, number>;
    whitespace?: Record<string, number>;
    categorical?: Record<string, number>;
    numeric?: Record<string, number>;
    dates?: Record<string, number>;
    email?: Record<string, number>;
  };
  skipped: {
    ambiguous_or_unsafe_dates: any;
    outliers: string;
    invalid_emails: string;
    constant_columns: string;
    unknown_semantics: string;
  };
  verification: QualityReport;
}

export async function cleanDataset(datasetId: string): Promise<CleaningResponse> {
  return request<CleaningResponse>("/cleaning/clean", {
    method: "POST",
    body: { dataset_id: datasetId },
  });
}
