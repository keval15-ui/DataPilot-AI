"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getDataset } from "@/lib/utils/getDataset";
import type { UploadResponse } from "@/types/upload";

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
  return (
    <div className="grid gap-4 xl:grid-cols-2">

      <ChartCard
        title="AI Dataset Status"
        description="Current status of your uploaded dataset"
      >
        <div className="flex h-full flex-col justify-center space-y-4">

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <span className="text-slate-400">
              Dataset
            </span>

            <span className="font-medium text-white">
              Health_Survey.xlsx
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <span className="text-slate-400">
              Rows
            </span>

            <span className="font-medium text-white">
              41
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <span className="text-slate-400">
              Columns
            </span>

            <span className="font-medium text-white">
              24
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
            <span className="text-slate-400">
              AI Status
            </span>

            <span className="font-semibold text-emerald-400">
              Ready ✅
            </span>
          </div>

        </div>
      </ChartCard>

      <ChartCard
        title="Suggested Questions"
        description="Start exploring your uploaded dataset"
      >
        <div className="space-y-3">

          {[
            "How many people have stomach pain?",
            "Count patients by gender",
            "Average age of patients",
            "How many smokers are there?",
            "Which disease occurs most frequently?",
          ].map((question) => (
            <button
              key={question}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-300 transition hover:border-sky-500/40 hover:bg-slate-800/80"
            >
              <span>{question}</span>

              <span className="text-sky-300">
                →
              </span>
            </button>
          ))}

        </div>
      </ChartCard>


      <ChartCard
        title="Upcoming Visualizations"
        description="Charts generated automatically from your dataset"
      >
        <div className="grid h-full grid-cols-2 gap-4">

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/70">
            <span className="text-4xl">
              📊
            </span>

            <p className="mt-3 text-sm text-slate-400">
              Bar Chart
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/70">
            <span className="text-4xl">
              🥧
            </span>

            <p className="mt-3 text-sm text-slate-400">
              Pie Chart
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/70">
            <span className="text-4xl">
              📈
            </span>

            <p className="mt-3 text-sm text-slate-400">
              Line Chart
            </p>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/70">
            <span className="text-4xl">
              📉
            </span>

            <p className="mt-3 text-sm text-slate-400">
              Histogram
            </p>
          </div>

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

  const [dataset, setDataset] =
    useState<UploadResponse | null>(null);

  useEffect(() => {
    setMounted(true);
    setDataset(getDataset());
  }, []);

  if (!mounted) {
    return (
      <Card>
        <div className="p-6 text-slate-400">
          Loading dataset...
        </div>
      </Card>
    );
  }

    

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          Current Dataset
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Dataset currently loaded into DataPilot AI
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">
                {dataset?.original_filename ?? "No Dataset"}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {dataset?.rows ?? "-"} Rows • {dataset?.columns ?? "-"} Columns
              </p>
            </div>

            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
              {dataset ? "Ready" : "Waiting"}
            </span>
          </div>
        </div>
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
