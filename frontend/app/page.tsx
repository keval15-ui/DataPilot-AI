import { Container } from "@/components/ui/container";
import { LandingSections } from "@/components/sections/landing-sections";

export default function HomePage() {
  return (
    <div className="min-h-screen app-bg">
      <Container className="py-10 sm:py-16">
        <LandingSections />
      </Container>
    </div>
  );
}
