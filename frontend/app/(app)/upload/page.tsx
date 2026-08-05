import { UploadPanel } from "@/components/upload/upload-widgets";
import { Container } from "@/components/ui/container";
import { PageShell } from "@/components/ui/page-shell";

export default function UploadPage() {
  return (
    <Container className="space-y-8">
      <PageShell title="Upload & Ingest" description="Prepare your CSV, Excel, and SQLite data for AI-powered analysis.">
        <UploadPanel />
      </PageShell>
    </Container>
  );
}
