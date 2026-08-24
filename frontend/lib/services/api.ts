export type ApiMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export type ApiRequestOptions = {
  method?: ApiMethod;
  headers?: Record<string, string>;
  body?: unknown;
};

let API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

if (API_BASE_URL.includes("localhost")) {
  API_BASE_URL = API_BASE_URL.replace("localhost", "127.0.0.1");
}

/* -------------------------
   JSON Requests
-------------------------- */

export async function request<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  console.log("[API Request] Fetching URL:", url);
  const response = await fetch(
    url,
    {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
      body: options.body
        ? JSON.stringify(options.body)
        : undefined,
    }
  );

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const error = await response.json();

      if (error.detail) {
        message = `${response.status}: ${error.detail}`;
      }
    } catch {
      // Ignore if response is not JSON
    }

    throw new Error(message);
  }

  return response.json();
}

/* -------------------------
   Upload Dataset
-------------------------- */

export async function uploadDataset(
  file: File
) {
  const formData = new FormData();

  formData.append("file", file);

  const url = `${API_BASE_URL}/upload`;
  console.log("[API Request] Uploading to:", url);
  const response = await fetch(
    url,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    let message = "Upload failed";

    try {
      const error = await response.json();

      if (error.detail) {
        message = error.detail;
      }
    } catch {
      // Ignore if response is not JSON
    }

    throw new Error(message);
  }

  return response.json();
}

/* -------------------------
   Dashboard & Dataset lists
-------------------------- */

export interface DashboardStats {
  total_datasets: number;
  total_rows: number;
  unique_sources: number;
  queries_executed: number;
  ai_insights: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/datasets/stats");
}

export async function fetchDatasets(): Promise<any[]> {
  return request<any[]>("/datasets");
}

export async function fetchDatasetById(datasetId: string): Promise<any> {
  return request<any>(`/datasets/${datasetId}`);
}