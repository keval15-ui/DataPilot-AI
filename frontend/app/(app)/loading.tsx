import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="py-8">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-full bg-slate-800" />
      <LoadingSkeleton rows={4} />
    </Container>
  );
}
