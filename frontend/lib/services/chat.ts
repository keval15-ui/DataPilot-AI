import { request } from "./api";

export interface ChartConfig {
  chart_type: string;
  x_key: string;
  y_keys: string[];
}

export interface ChatResponse {
  sql: string;
  result: Record<string, unknown>[];
  explanation?: string;
  chart_config?: ChartConfig;
}

export async function askAI(
  datasetId: string,
  question: string
): Promise<ChatResponse> {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: {
      dataset_id: datasetId,
      question,
    },
  });
}