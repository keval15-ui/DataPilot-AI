"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, ZapIcon } from "@/components/ui/icons";

const features = [
  {
    title: "Natural language analytics",
    description: "Ask questions in plain English and get insight-rich answers instantly.",
  },
  {
    title: "Instant SQL generation",
    description: "Turn prompts into SQL and validate results with confidence.",
  },
  {
    title: "Interactive visuals",
    description: "Generate charts and dashboards that make trends obvious at a glance.",
  },
  {
    title: "Secure data workflows",
    description: "Keep your files and database connections private and well-structured.",
  },
];

const workflow = [
  "Upload CSVs, Excel files, or connect SQLite",
  "Ask business questions in natural language",
  "Receive SQL, charts, and plain-English insights",
];

const stack = ["Next.js", "TypeScript", "SQLite", "OpenAI", "Tailwind", "Framer Motion"];

const testimonials = [
  {
    quote: "The fastest way I’ve ever turned a spreadsheet into a decision-ready dashboard.",
    name: "Maya Chen",
    role: "Product Lead",
  },
  {
    quote: "It feels like a senior analyst is sitting beside me, explaining every trend.",
    name: "Darius Wright",
    role: "Founder",
  },
];

const faqs = [
  {
    question: "What file types are supported?",
    answer: "CSV, Excel spreadsheets, and SQLite databases are supported in the current experience.",
  },
  {
    question: "Is this connected to a backend yet?",
    answer: "The frontend architecture is ready for future FastAPI integration and richer data workflows.",
  },
  {
    question: "Can I use it for team collaboration?",
    answer: "Yes, the layout is designed to scale into shared workspaces and team dashboards.",
  },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      <p className="mt-4 text-lg leading-8 text-slate-400">{description}</p>
    </div>
  );
}

export function LandingSections() {
  return (
    <div className="space-y-24 pb-20 pt-8 sm:pt-12">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
            <SparklesIcon size={16} />
            Premium AI analytics workspace
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Talk to Your Data.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-400 sm:text-xl">
            Upload CSV files, Excel spreadsheets, or connect your SQLite database. Ask questions in natural language and let AI analyze your data, generate SQL, create interactive charts, and explain insights in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/dashboard">
              <Button size="lg">Start Analyzing</Button>
            </Link>
            <Link href="/chat">
              <Button size="lg" variant="secondary">View Demo</Button>
            </Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative">
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-sky-500/30 via-violet-500/20 to-transparent blur-3xl" />
          <Card className="relative overflow-hidden border-white/10 p-0">
            <div className="grid gap-4 border-b border-white/10 bg-slate-900/70 p-4 sm:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">AI Chat</p>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300">Live</span>
                </div>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="rounded-2xl bg-slate-800/80 p-3">What drove the Q3 spike?</div>
                  <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-3 text-sky-200">I can analyze that for you.</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                  <p className="text-sm text-slate-400">SQL Query</p>
                  <p className="mt-2 font-mono text-sm text-sky-200">SELECT region, SUM(revenue) FROM sales GROUP BY region;</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                    <p className="text-sm text-slate-400">KPI</p>
                    <p className="mt-2 text-2xl font-semibold text-white">+$182k</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                    <p className="text-sm text-slate-400">Growth</p>
                    <p className="mt-2 text-2xl font-semibold text-white">+24%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-[1fr_0.9fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                <p className="mb-3 text-sm text-slate-400">Line Chart</p>
                <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(167,139,250,0.2))]" />
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                <p className="mb-3 text-sm text-slate-400">Dataset Preview</p>
                <div className="space-y-2 text-sm text-slate-400">
                  <div className="flex justify-between rounded-xl bg-slate-800/80 px-3 py-2"><span>North</span><span>14.2k</span></div>
                  <div className="flex justify-between rounded-xl bg-slate-800/80 px-3 py-2"><span>West</span><span>9.1k</span></div>
                  <div className="flex justify-between rounded-xl bg-slate-800/80 px-3 py-2"><span>South</span><span>7.8k</span></div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Features" title="Built for modern analysts and founders" description="Everything needed to turn messy spreadsheets into useful stories and confident next steps." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="text-left">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 text-sky-200">
                <ZapIcon size={18} />
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Workflow" title="From upload to insight in three steps" description="A calm, guided experience designed for speed and momentum." />
        <div className="grid gap-4 lg:grid-cols-3">
          {workflow.map((step, index) => (
            <Card key={step}>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">0{index + 1}</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{step}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">The experience is structured so each step feels obvious, polished, and ready to scale.</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Technology Stack" title="Designed for future-ready product growth" description="The same visuals are ready to support richer AI, analytics, and backend integrations." />
        <div className="flex flex-wrap justify-center gap-3">
          {stack.map((item) => (
            <div key={item} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="Testimonials" title="Loved by teams that move quickly" description="Early impressions from product teams that want clarity without compromise." />
        <div className="grid gap-4 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name}>
              <p className="text-lg leading-8 text-slate-300">“{testimonial.quote}”</p>
              <div className="mt-6">
                <p className="font-semibold text-white">{testimonial.name}</p>
                <p className="text-sm text-slate-400">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading eyebrow="FAQ" title="Questions before you dive in?" description="A few of the common things teams ask before adopting a new analytics assistant." />
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((faq) => (
            <Card key={faq.question} className="p-5">
              <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{faq.answer}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 pt-8 text-center text-sm text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="font-semibold text-white">DataPilot AI</span>
          <span>•</span>
          <span>Built for intelligent analytics</span>
          <span>•</span>
          <span>© 2026</span>
        </div>
      </footer>
    </div>
  );
}
