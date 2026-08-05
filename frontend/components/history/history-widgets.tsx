import { Card } from "@/components/ui/card";
import { LockIcon } from "@/components/ui/icons";

const conversations = [
  { title: "Revenue spike analysis", time: "12 min ago" },
  { title: "Customer churn summary", time: "1 hour ago" },
  { title: "Inventory anomaly review", time: "Yesterday" },
];

const datasets = [
  { name: "Quarterly Sales", rows: "12.8k", status: "Ready" },
  { name: "Warehouse Metrics", rows: "4.8k", status: "Ready" },
];

const queries = [
  { title: "Top products by margin", time: "4 min ago" },
  { title: "Weekly retention trend", time: "18 min ago" },
];

const bookmarks = [
  { title: "North region summary", type: "Insight" },
  { title: "Forecast snapshot", type: "Chart" },
];

export function HistoryPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Conversations</h3>
            <p className="mt-1 text-sm text-slate-400">Your recent AI-assisted conversations and prompts.</p>
          </div>
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <div key={conversation.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                <p className="font-medium text-white">{conversation.title}</p>
                <p className="mt-1 text-sm text-slate-400">{conversation.time}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Uploaded Datasets</h3>
            <p className="mt-1 text-sm text-slate-400">Files that are currently available in your workspace.</p>
          </div>
          <div className="space-y-3">
            {datasets.map((dataset) => (
              <div key={dataset.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                <div>
                  <p className="font-medium text-white">{dataset.name}</p>
                  <p className="text-sm text-slate-400">{dataset.rows} rows</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-sm text-emerald-300">{dataset.status}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Recent SQL Queries</h3>
            <p className="mt-1 text-sm text-slate-400">Quick access to the queries you've run most recently.</p>
          </div>
          <div className="space-y-3">
            {queries.map((query) => (
              <div key={query.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                <p className="font-medium text-white">{query.title}</p>
                <p className="mt-1 text-sm text-slate-400">{query.time}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Bookmarks</h3>
            <p className="mt-1 text-sm text-slate-400">Saved insights and views for faster access.</p>
          </div>
          <div className="space-y-3">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.title} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-3">
                <p className="font-medium text-white">{bookmark.title}</p>
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-sm text-violet-200">{bookmark.type}</span>
              </div>
            ))}
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
            "Notifications",
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
