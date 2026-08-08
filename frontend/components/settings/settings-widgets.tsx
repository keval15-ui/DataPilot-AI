"use client";

import { useTheme } from "@/components/layout/theme-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LockIcon } from "@/components/ui/icons";

const futureFeatures = [
  { title: "RAG Schema Retrieval", description: "Semantic context for your database schemas and queries." },
  { title: "Business Insights", description: "Executive summaries and trend narratives for key metrics." },
  { title: "Root Cause Analysis", description: "Automated analysis of anomalies and operational drivers." },
  { title: "Forecasting", description: "Scenario planning and predictive trend modeling." },
  { title: "Dashboard Builder", description: "Low-code dashboard composition with AI assistance." },
  { title: "AI Reports", description: "Narrative reporting with polished summaries and exports." },
  { title: "Team Workspaces", description: "Shared collaboration spaces for data teams and operators." },
  { title: "Authentication", description: "Role-based access and secure workspace controls." },
];

const activeFeatures = [
  { title: "Notifications", description: "Real-time AI alerts and workflow updates." }
];

export function SettingsPanel() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Appearance</h3>
            <p className="mt-1 text-sm text-slate-400">Switch between light and dark themes for your workspace.</p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            {theme === "dark" ? "Switch to light" : "Switch to dark"}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">API Key</h3>
          <p className="mt-1 text-sm text-slate-400">Secure your AI connections and keep your environment ready for future integration.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <p className="mt-1 font-medium text-white">Not configured</p>
            </div>
            <Button variant="secondary">Add API Key</Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Application Version</h3>
            <p className="mt-1 text-sm text-slate-400">Current frontend build for the DataPilot AI workspace.</p>
          </div>
          <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm text-violet-200">v0.1.0</span>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Feature Integrations</h3>
          <p className="mt-1 text-sm text-slate-400">Manage active capabilities and view upcoming releases.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {/* Active Features */}
          {activeFeatures.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{feature.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                </div>
                <div className="rounded-full border border-sky-400/20 bg-sky-500/10 p-2 text-sky-300">
                  ✨
                </div>
              </div>
              <span className="mt-4 inline-flex rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
                Active & Live
              </span>
            </div>
          ))}

          {/* Upcoming Features */}
          {futureFeatures.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{feature.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
                </div>
                <div className="rounded-full border border-white/10 bg-slate-950 p-2 text-slate-400">
                  <LockIcon size={14} />
                </div>
              </div>
              <span className="mt-4 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
