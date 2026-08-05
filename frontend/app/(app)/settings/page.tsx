import { SettingsPanel } from "@/components/settings/settings-widgets";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export default function SettingsPage() {
  return (
    <Container className="space-y-8">
      <Section title="Settings" description="Manage your workspace preferences, integrations, and feature access.">
        <SettingsPanel />
      </Section>
    </Container>
  );
}
