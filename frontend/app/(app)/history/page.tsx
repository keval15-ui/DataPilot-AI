import { HistoryPanel } from "@/components/history/history-widgets";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export default function HistoryPage() {
  return (
    <Container className="space-y-8">
      <Section title="History" description="Track your recent conversations, uploads, and AI-assisted workflows.">
        <HistoryPanel />
      </Section>
    </Container>
  );
}
