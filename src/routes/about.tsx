import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Camera,
  Cpu,
  FileText,
  Radar,
  ScanLine,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — GridLens AI" },
      {
        name: "description",
        content:
          "Learn about GridLens AI, an AI-powered traffic violation detection and evidence generation system.",
      },
    ],
  }),
  component: About,
});

const FEATURES = [
  { icon: Camera, title: "Traffic Image Ingestion", body: "Drag & drop images from any junction camera; supports JPG, JPEG and PNG." },
  { icon: Radar, title: "Road-User Detection", body: "YOLOv8 identifies cars, motorcycles, pedestrians and cyclists with bounding boxes." },
  { icon: ScanLine, title: "Number-Plate OCR", body: "EasyOCR extracts number plate text with per-candidate confidence scores." },
  { icon: ShieldCheck, title: "Violation Workflows", body: "Helmet, stop-line, red-light and illegal parking enforcement pipelines." },
  { icon: FileText, title: "Evidence Reports", body: "Auto-generates review-ready reports with plate, timestamp, and evidence line." },
  { icon: Cpu, title: "Smart-City Ready", body: "FastAPI backend + configurable pipeline for city-wide deployments." },
];

const STACK = ["YOLOv8", "OpenCV", "EasyOCR", "FastAPI", "React", "TailwindCSS", "TanStack Router", "Recharts"];

function About() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 shadow-[var(--shadow-lift)]">
        <div className="absolute inset-0 gradient-primary" />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
        <div className="relative z-10 max-w-3xl p-6 text-white md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Zap className="h-3.5 w-3.5" />
            About the project
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">GridLens AI</h1>
          <p className="mt-2 text-base font-medium text-white/90 md:text-lg">
            A modern control-room dashboard for AI-driven traffic enforcement.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
            GridLens AI turns raw junction imagery into structured, auditable
            evidence — detecting road users, extracting number plates, applying
            configurable violation workflows and producing court-ready reports.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="gap-2 bg-white text-primary hover:bg-white/90">
              <Link to="/">Open Dashboard <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="gap-2 border-white/40 bg-white/10 text-white hover:bg-white/20">
              <Link to="/analytics">View Analytics</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="glass-card">
            <CardHeader>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <f.icon className="h-5 w-5" />
              </div>
              <CardTitle className="mt-3 text-base">{f.title}</CardTitle>
              <CardDescription>{f.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Technology Stack</CardTitle>
          <CardDescription>Built with a modern, deployable stack.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {STACK.map((s) => (
              <span
                key={s}
                className="rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Frontend renders detections and evidence returned by the FastAPI
            backend at{" "}
           <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
  https://gridlens-backend-my.onrender.com
</span>
            . Demo data is shown automatically when the backend is unreachable.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}