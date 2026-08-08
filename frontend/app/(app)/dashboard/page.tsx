"use client";

import { useEffect, useState } from "react";
import { ActivityTable, AnalyticsCharts, DatasetList, QuickActions, RecentQueries, StatCard } from "@/components/dashboard/dashboard-widgets";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { Section } from "@/components/ui/section";
import { fetchDashboardStats, type DashboardStats } from "@/lib/services/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats", err);
        setLoading(false);
      });
  }, []);

  const formatRows = (rows: number) => {
    if (rows >= 1000000) return `${(rows / 1000000).toFixed(1)}M`;
    if (rows >= 1000) return `${(rows / 1000).toFixed(1)}K`;
    return rows.toString();
  };

  return (
    <Container className="space-y-8">
      <PageShell title="Analytics Dashboard" description="A real-time overview of your data operations and AI-assisted workflows." action={<Button>New report</Button>}>
        <Section title="Overview" description="Key indicators for your active workspace.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard 
              title="Total Datasets" 
              value={loading ? "..." : (stats?.total_datasets ?? 0).toString()} 
              detail={loading ? "Loading..." : `Across ${stats?.unique_sources ?? 0} connected sources`} 
              trend="+12%" 
            />
            <StatCard 
              title="Queries Executed" 
              value={loading ? "..." : (stats?.queries_executed ?? 0).toLocaleString()} 
              detail={loading ? "Loading..." : "Executed dynamically"} 
              trend="+9%" 
            />
            <StatCard 
              title="Rows Processed" 
              value={loading ? "..." : formatRows(stats?.total_rows ?? 0)} 
              detail={loading ? "Loading..." : "Structured and analyzed"} 
              trend="+18%" 
            />
            <StatCard 
              title="AI Insights" 
              value={loading ? "..." : (stats?.ai_insights ?? 0).toString()} 
              detail={loading ? "Loading..." : "Auto-generated summaries"} 
              trend="+24%" 
            />
          </div>
        </Section>

        <AnalyticsCharts />

        <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <ActivityTable />
          <QuickActions />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DatasetList />
          <RecentQueries />
        </div>
      </PageShell>
    </Container>
  );
}
