"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LockIcon } from "@/components/ui/icons";
import { fetchDatasets } from "@/lib/services/api";

type DatasetItem = {
  dataset_id: string;
  original_filename: string;
  rows?: number;
  columns?: number;
};

type ConversationItem = {
  id: string;
  dataset_id: string;
  dataset_name: string;
  title: string;
  time: string;
};

type QueryItem = {
  question: string;
  time: string;
  sql: string;
};

type BookmarkItem = {
  title: string;
  type: "Insight" | "Chart";
  dataset_id: string;
};

export function HistoryPanel() {
  const [mounted, setMounted] = useState(false);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    setMounted(true);

    // Fetch live datasets
    fetchDatasets()
      .then((data) => {
        setDatasets(data);
      })
      .catch((err) => {
        console.error("Failed to fetch history datasets", err);
      });

    // Load conversations from localStorage
    try {
      const storedConvs = localStorage.getItem("conversations");
      if (storedConvs) {
        setConversations(JSON.parse(storedConvs));
      } else {
        // Seed default sample if empty
        const sampleConvs: ConversationItem[] = [
          { id: "sample-1", dataset_id: "demo", dataset_name: "Demo dataset", title: "Revenue spike analysis", time: "12 min ago" },
          { id: "sample-2", dataset_id: "demo", dataset_name: "Demo dataset", title: "Customer churn summary", time: "1 hour ago" },
        ];
        setConversations(sampleConvs);
        localStorage.setItem("conversations", JSON.stringify(sampleConvs));
      }

      // Load queries from localStorage
      const storedQueries = localStorage.getItem("queries");
      if (storedQueries) {
        setQueries(JSON.parse(storedQueries));
      } else {
        const sampleQueries: QueryItem[] = [
          { question: "Top products by margin", time: "4 min ago", sql: "SELECT name, margin FROM products ORDER BY margin DESC LIMIT 5;" },
          { question: "Weekly retention trend", time: "18 min ago", sql: "SELECT week, COUNT(user_id) FROM retention GROUP BY week;" },
        ];
        setQueries(sampleQueries);
        localStorage.setItem("queries", JSON.stringify(sampleQueries));
      }

      // Load bookmarks from localStorage
      const storedBookmarks = localStorage.getItem("bookmarks");
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      } else {
        const sampleBookmarks: BookmarkItem[] = [
          { title: "North region summary", type: "Insight", dataset_id: "demo" },
          { title: "Forecast snapshot", type: "Chart", dataset_id: "demo" },
        ];
        setBookmarks(sampleBookmarks);
        localStorage.setItem("bookmarks", JSON.stringify(sampleBookmarks));
      }
    } catch (e) {
      console.error("Error reading localStorage history data", e);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Loading history...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col h-[320px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Conversations</h3>
            <p className="mt-1 text-sm text-slate-400">Your recent AI-assisted conversations and prompts.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {conversations.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 text-center">No conversations yet.</p>
            ) : (
              conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/chat?dataset=${conversation.dataset_id}`}
                  className="block rounded-2xl border border-white/10 bg-slate-900/50 p-4 transition hover:bg-slate-800/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white hover:text-sky-400 transition">{conversation.title}</p>
                    <p className="text-xs text-slate-500">{conversation.time}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-400 truncate">Dataset: {conversation.dataset_name}</p>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="flex flex-col h-[320px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Uploaded Datasets</h3>
            <p className="mt-1 text-sm text-slate-400">Files that are currently available in your workspace.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {datasets.length === 0 ? (
              <div className="text-slate-500 text-sm italic p-4 text-center">
                No datasets uploaded yet. <Link href="/upload" className="text-sky-400 hover:underline">Upload one</Link> to start.
              </div>
            ) : (
              datasets.map((dataset) => (
                <div key={dataset.dataset_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 p-4 hover:bg-slate-800/40 transition">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium text-white truncate">{dataset.original_filename}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {dataset.rows?.toLocaleString() ?? 0} rows • {dataset.columns ?? 0} columns
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">Ready</span>
                    <Link
                      href={`/chat?dataset=${dataset.dataset_id}`}
                      className="rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white hover:bg-sky-600 transition"
                    >
                      Chat
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col h-[320px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recent SQL Queries</h3>
            <p className="mt-1 text-sm text-slate-400">Quick access to the queries you've run most recently.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {queries.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 text-center">No SQL queries run yet.</p>
            ) : (
              queries.map((query, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{query.question}</p>
                    <p className="text-xs text-slate-500">{query.time}</p>
                  </div>
                  <pre className="mt-2 overflow-x-auto rounded-xl border border-white/5 bg-slate-950/80 p-2 font-mono text-[10px] text-green-300 whitespace-pre">
                    {query.sql}
                  </pre>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="flex flex-col h-[320px]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Bookmarks</h3>
            <p className="mt-1 text-sm text-slate-400">Saved insights and views for faster access.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {bookmarks.length === 0 ? (
              <p className="text-sm text-slate-500 italic p-4 text-center">No bookmarks saved yet.</p>
            ) : (
              bookmarks.map((bookmark, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/50 p-4">
                  <p className="font-medium text-white">{bookmark.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs text-violet-200">{bookmark.type}</span>
                    {bookmark.dataset_id !== "demo" && (
                      <Link
                        href={`/chat?dataset=${bookmark.dataset_id}`}
                        className="text-xs text-sky-400 hover:underline"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Upcoming AI Features</h3>
          <p className="mt-1 text-sm text-slate-400">Premium capabilities that are queued for future rollout.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            "RAG Schema Retrieval",
            "Business Insights",
            "Root Cause Analysis",
            "Forecasting",
            "Dashboard Builder",
            "AI Reports",
            "Team Workspaces",
            "Authentication",
          ].map((feature) => (
            <div key={feature} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-3">
              <span className="font-medium text-white">{feature}</span>
              <div className="rounded-full border border-sky-400/20 bg-sky-500/10 p-2 text-sky-300">
                <LockIcon size={14} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
