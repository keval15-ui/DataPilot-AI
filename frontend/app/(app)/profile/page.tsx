import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <Container className="space-y-8">
      <Section title="Profile" description="A polished placeholder for your account and workspace identity.">
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-500 text-2xl font-semibold text-white">
                AD
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Alicia Davis</h3>
              <p className="mt-2 text-sm text-slate-400">Product Analytics Lead</p>
              <Button className="mt-5">Edit profile</Button>
            </div>
          </Card>

          <Card>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Workspace Summary</h3>
              <p className="mt-1 text-sm text-slate-400">A premium, future-ready profile surface for your account.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Workspace", "Northstar Studio"],
                ["Role", "Admin"],
                ["Plan", "Growth"],
                ["Region", "US West"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>
    </Container>
  );
}
