import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getDataset } from "@/lib/utils/getDataset";
import type { UploadResponse } from "@/types/upload";
import { fetchDatasets } from "@/lib/services/api";

type StatCardProps = {
  title: string;
  value: string;
  detail: string;
  trend: string;
};

export function StatCard({ title, value, detail, trend }: StatCardProps) {
  return (
    <Card>
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-400">{detail}</span>
        <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-sky-300">{trend}</span>
      </div>
    </Card>
  );
}

type ChartCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <div className="h-72">{children}</div>
    </Card>
  );
}


export function AnalyticsCharts() {
  const [currentDataset, setCurrentDataset] = useState<any | null>(null);

  useEffect(() => {
    setCurrentDataset(getDataset());
  }, []);

  return (
    <div className="grid gap-4 xl:grid-cols-2">

      <ChartCard
        title="AI Dataset Status"
        description="Current status of your active dataset"
      >
        <div className="flex h-full flex-col justify-center space-y-4">

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <span className="text-slate-400">
              Dataset
            </span>

            <span className="font-medium text-white truncate max-w-[200px]">
              {currentDataset?.original_filename ?? "No active dataset"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <span className="text-slate-400">
              Rows
            </span>

            <span className="font-medium text-white">
              {currentDataset?.rows?.toLocaleString() ?? "-"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <span className="text-slate-400">
              Columns
            </span>

            <span className="font-medium text-white">
              {currentDataset?.columns ?? "-"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <span className="text-slate-400">
              AI Status
            </span>

            <span className={`font-semibold ${currentDataset ? "text-emerald-400" : "text-amber-400"}`}>
              {currentDataset ? "Ready ✅" : "No active dataset"}
            </span>
          </div>

        </div>
      </ChartCard>

      <ChartCard
        title="Suggested Questions"
        description="Start exploring your uploaded dataset"
      >
        <div className="space-y-3">

          {currentDataset ? (
            [
              `How many total rows are in the dataset?`,
              "Count records by a unique label",
              "Show column distributions",
              "Which value appears most frequently?",
              "Average or aggregate summary of columns",
            ].map((question) => (
              <a
                key={question}
                href={`/chat?dataset=${currentDataset.dataset_id}`}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-sky-500/40 hover:bg-slate-800/80"
              >
                <span>{question}</span>

                <span className="text-sky-300">
                  →
                </span>
              </a>
            ))
          ) : (
            <div className="flex h-full flex-col justify-center items-center text-center p-4">
              <p className="text-slate-400 text-sm italic">
                Upload a dataset to see suggested analysis questions.
              </p>
              <a href="/upload" className="mt-4 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-600">
                Go to Upload
              </a>
            </div>
          )}

        </div>
      </ChartCard>

    </div>
  );
}


export function ActivityTable() {
  const rows = [
    {
      time: "09:30",
      action: "Dataset Uploaded",
      status: "Completed",
    },
    {
      time: "09:32",
      action: "AI Generated SQL",
      status: "Completed",
    },
    {
      time: "09:33",
      action: "DuckDB Executed Query",
      status: "Completed",
    },
    {
      time: "09:34",
      action: "Results Returned",
      status: "Completed",
    },
  ];

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          AI Activity
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Latest actions performed by DataPilot AI
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">

          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.time}-${row.action}`}
                className="border-t border-white/10 bg-slate-950/60 text-slate-300"
              >
                <td className="px-4 py-3">
                  {row.time}
                </td>

                <td className="px-4 py-3">
                  {row.action}
                </td>

                <td className="px-4 py-3">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm text-emerald-300">
                    {row.status}
                  </span>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </Card>
  );
}


export function DatasetList() {
  const [mounted, setMounted] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [currentDataset, setCurrentDataset] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentDataset(getDataset());
    fetchDatasets()
      .then((data) => {
        setDatasets(data);
      })
      .catch((err) => {
        console.error("Failed to fetch datasets", err);
      });
  }, []);

  if (!mounted) {
    return (
      <Card>
        <div className="p-6 text-slate-400">
          Loading datasets...
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[350px]">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          Ingested Datasets
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          All datasets successfully registered in Supabase
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {datasets.length === 0 ? (
          <div className="text-slate-500 text-sm italic p-4 text-center">
            No datasets uploaded yet. Click "Upload Dataset" to get started.
          </div>
        ) : (
          datasets.map((d) => {
            const isCurrent = currentDataset?.dataset_id === d.dataset_id;
            return (
              <div 
                key={d.dataset_id} 
                className={`rounded-2xl border p-4 transition-all ${
                  isCurrent 
                    ? "border-sky-500/40 bg-sky-950/20" 
                    : "border-white/10 bg-slate-900/50 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white truncate">
                      {d.original_filename}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {d.rows?.toLocaleString() ?? 0} Rows • {d.columns ?? 0} Columns
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
                        Active
                      </span>
                    )}
                    <a 
                      href={`/chat?dataset=${d.dataset_id}`}
                      className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20 transition"
                    >
                      Chat →
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export function QuickActions() {
  const actions = [
    {
      title: "Upload Dataset",
      description: "Import a CSV or Excel file",
      link: "/upload",
    },
    {
      title: "Ask AI",
      description: "Chat with your dataset",
      link: "/chat",
    },
    {
      title: "View Dashboard",
      description: "Analyze uploaded data",
      link: "/dashboard",
    },
    {
      title: "Upload History",
      description: "View previous datasets",
      link: "/upload",
    },
  ];

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          Quick Actions
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Navigate quickly through DataPilot AI
        </p>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <a
            key={action.title}
            href={action.link}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 transition hover:bg-slate-800/80"
          >
            <div>
              <p className="font-medium text-white">
                {action.title}
              </p>

              <p className="text-sm text-slate-400">
                {action.description}
              </p>
            </div>

            <span className="text-sky-300 text-xl">
              →
            </span>
          </a>
        ))}
      </div>
    </Card>
  );
}

export function RecentQueries() {
  const queries = [
    {
      question: "How many people have stomach pain?",
      status: "Completed",
    },
    {
      question: "Count patients by gender",
      status: "Completed",
    },
    {
      question: "Average age of patients",
      status: "Completed",
    },
    {
      question: "Show all diabetic patients",
      status: "Completed",
    },
  ];

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          Recent AI Queries
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Recently executed natural language questions
        </p>
      </div>

      <div className="space-y-3">
        {queries.map((query) => (
          <div
            key={query.question}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
          >
            <div>
              <p className="font-medium text-white">
                {query.question}
              </p>

              <p className="text-sm text-slate-400">
                Natural Language Query
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm text-emerald-300">
              {query.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
