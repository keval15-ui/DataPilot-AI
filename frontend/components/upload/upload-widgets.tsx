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
  const [isDragActive, setIsDragActive] = useState(false);
  const [dataset, setDataset] = useState<UploadResponse | null>(null);
  const [recentUploads, setRecentUploads] = useState<UploadResponse[]>([]);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    try {
      setUploading(true);
      setProgress(20);

      const response = await uploadDataset(file);
      console.log("Upload Response:", response);

      setProgress(100);
      setDataset(response);

      if (typeof window !== "undefined") {
        localStorage.setItem("dataset", JSON.stringify(response));
        
        try {
          const storedNotifs = localStorage.getItem("notifications");
          const list = storedNotifs ? JSON.parse(storedNotifs) : [];
          list.unshift({
            id: `upload-${Date.now()}`,
            type: "success",
            title: "Dataset uploaded",
            message: `${file.name} is ready for analysis.`,
            read: false,
            time: "Just now"
          });
          localStorage.setItem("notifications", JSON.stringify(list.slice(0, 20)));
        } catch (e) {
          console.error("Failed to save upload notification", e);
        }
      }

      setRecentUploads((prev) => [
        response,
        ...prev,
      ]);
      setError("");
      router.push(`/quality?dataset=${response.dataset_id}`);
    } catch (err) {
      let errorMessage = "Upload failed.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error(err);

      if (typeof window !== "undefined") {
        try {
          const storedNotifs = localStorage.getItem("notifications");
          const list = storedNotifs ? JSON.parse(storedNotifs) : [];
          
          let title = "Upload failed";
          let type = "error";

          if (errorMessage.toLowerCase().includes("only csv") || errorMessage.toLowerCase().includes("supported")) {
            title = "Unsupported file";
            type = "error";
          } else if (errorMessage.toLowerCase().includes("size") || errorMessage.toLowerCase().includes("50 mb")) {
            title = "File too large";
            type = "error";
          }

          list.unshift({
            id: `upload-fail-${Date.now()}`,
            type,
            title,
            message: errorMessage,
            read: false,
            time: "Just now"
          });
          localStorage.setItem("notifications", JSON.stringify(list.slice(0, 20)));
        } catch (e) {
          console.error("Failed to save upload error notification", e);
        }
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Maximum allowed file size is 50 MB.");
      return;
    }

    await uploadFile(file);
  }

  function handleDrag(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragActive(true);
    } else if (event.type === "dragleave") {
      setIsDragActive(false);
    }
  }

  async function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isSupported = fileName.endsWith(".csv") || 
                        fileName.endsWith(".xlsx") || 
                        fileName.endsWith(".xls") || 
                        fileName.endsWith(".db") || 
                        fileName.endsWith(".sqlite");

    if (!isSupported) {
      setError("Only CSV, Excel (XLSX, XLS), and SQLite (.db, .sqlite) files are supported.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("Maximum allowed file size is 50 MB.");
      return;
    }

    await uploadFile(file);
  }

  return (
    <div className="space-y-6">
      <Card 
        className={`overflow-hidden border-sky-400/20 transition-all duration-200 ${
          isDragActive ? "ring-2 ring-sky-500 scale-[1.01]" : ""
        }`}
      >
        <div 
          className={`rounded-3xl border border-dashed p-8 text-center transition-colors duration-200 ${
            isDragActive 
              ? "border-sky-500 bg-sky-500/10 text-white" 
              : "border-sky-400/30 bg-gradient-to-br from-sky-500/10 via-slate-950/70 to-violet-500/10"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
            {isDragActive ? "Drop to upload" : "Drag & drop your dataset here"}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {isDragActive ? "Ready to Ingest!" : "or click to browse"}
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Upload CSV files, Excel spreadsheets (XLSX, XLS), or SQLite databases (.db, .sqlite) up to 50 MB.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".csv,.xlsx,.xls,.db,.sqlite"
              onChange={handleFileUpload}
              disabled={uploading}
            />

            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
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
