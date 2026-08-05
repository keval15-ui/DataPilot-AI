import { ActivityTable, AnalyticsCharts, DatasetList, QuickActions, RecentQueries, StatCard } from "@/components/dashboard/dashboard-widgets";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";
import { Section } from "@/components/ui/section";

export default function DashboardPage() {
  return (
    <Container className="space-y-8">
      <PageShell title="Analytics Dashboard" description="A realistic overview of your data operations and AI-assisted workflows." action={<Button>New report</Button>}>
        <Section title="Overview" description="Key indicators for your active workspace.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Total Datasets" value="24" detail="Across 6 connected sources" trend="+12%" />
            <StatCard title="Queries Executed" value="1,482" detail="This week" trend="+9%" />
            <StatCard title="Rows Processed" value="4.8M" detail="Structured and analyzed" trend="+18%" />
            <StatCard title="AI Insights" value="89" detail="Auto-generated summaries" trend="+24%" />
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
