import type { UploadResponse } from "@/types/upload";

export function getDataset(): UploadResponse | null {
  if (typeof window === "undefined") return null;

  const dataset = localStorage.getItem("dataset");

  if (!dataset) return null;

  return JSON.parse(dataset);
}