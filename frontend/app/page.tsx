import { Container } from "@/components/ui/container";
import { LandingSections } from "@/components/sections/landing-sections";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(167,139,250,0.2),_transparent_25%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-slate-100">
      <Container className="py-10 sm:py-16">
        <LandingSections />
      </Container>
    </div>
  );
}
