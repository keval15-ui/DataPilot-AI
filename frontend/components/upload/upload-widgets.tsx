"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadDataset } from "@/lib/services/api";
import type { UploadResponse } from "@/types/upload";

const supportedTypes = ["CSV", "Excel", "SQLite"];

export function UploadPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [progress, setProgress] = useState(0);

  const [uploading, setUploading] = useState(false);

  const [dataset, setDataset] =
    useState<UploadResponse | null>(null);

  const [recentUploads, setRecentUploads] =
    useState<UploadResponse[]>([]);

  const [error, setError] = useState("");

  async function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);
      setProgress(20);

      const response = await uploadDataset(file);
      // router.push(`/chat?dataset=${response.dataset_id}`);

console.log("Upload Response:", response);

      setProgress(100);

      setDataset(response);

      setRecentUploads((prev) => [
        response,
        ...prev,
      ]);
setError("");

router.push(`/chat?dataset=${response.dataset_id}`);
     ;

      setError("");
    } catch (err) {
      setError("Upload failed.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-sky-400/20">
        <div className="rounded-3xl border border-dashed border-sky-400/30 bg-gradient-to-br from-sky-500/10 via-slate-950/70 to-violet-500/10 p-8 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
            Drag and drop
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            Drop your data files here
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Upload CSV files, Excel spreadsheets, or connect a SQLite database and prepare them for AI analysis.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
            />

            <Button onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {supportedTypes.map((type) => (
              <span
                key={type}
                className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-sm text-slate-300"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Upload Status</h3>
              <p className="mt-1 text-sm text-slate-400">
                Previewing the latest import job
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              {uploading ? "Uploading" : dataset ? "Ready" : "Waiting"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between">
                <p className="truncate font-medium text-white">
                  {dataset?.original_filename ?? "No dataset uploaded"}
                </p>
                <p className="text-sm text-slate-400">{progress}%</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">Rows</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {dataset?.rows ?? "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">Columns</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {dataset?.columns ?? "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">Type</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {dataset?.original_filename?.split(".").pop()?.toUpperCase() ?? "-"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Dataset Summary</h3>
            <p className="mt-1 text-sm text-slate-400">
              Information about the currently uploaded dataset.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-slate-400">Dataset</p>
              <p className="mt-2 truncate font-medium text-white">
                {dataset?.original_filename ?? "No dataset uploaded"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">Rows</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {dataset?.rows ?? "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">Columns</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {dataset?.columns ?? "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">File Type</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {dataset?.original_filename?.split(".").pop()?.toUpperCase() ?? "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <p className="text-sm text-slate-400">AI Status</p>
                <p className="mt-2 font-semibold text-emerald-400">
                  {dataset ? "Ready ✅" : "Waiting"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
