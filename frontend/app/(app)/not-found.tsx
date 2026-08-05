import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="py-16">
      <Card className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">The route you requested does not exist yet, but the app is ready for future expansion.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
          <Link href="/upload">
            <Button variant="secondary">Upload data</Button>
          </Link>
        </div>
      </Card>
    </Container>
  );
}
