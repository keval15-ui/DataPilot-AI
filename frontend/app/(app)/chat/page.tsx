import { ChatPanel } from "@/components/chat/chat-widgets";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";

export default function ChatPage() {
  return (
    <Container className="space-y-8">
      <PageShell title="AI Chat" description="A modern, responsive conversational workspace for your data questions.">
        <ChatPanel />
      </PageShell>
    </Container>
  );
}
