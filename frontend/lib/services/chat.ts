import { request } from "./api";

export interface ChatResponse {
  sql: string;
  result: Record<string, unknown>[];
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