import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Cpu,
  Download,
  FileText,
  Gauge,
  ImageIcon,
  Loader2,
  ScanSearch,
  ShieldAlert,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  analyzeImage,
  useSettings,
  violationsToCsv,
  type AnalyzeResponse,
} from "@/lib/gridlens";
import { ViolationBadge, StatusBadge } from "@/components/violation-badges";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const ACCEPT = ["image/jpeg", "image/jpg", "image/png"];

const TECH_BADGES = [
  { label: "YOLOv8", tone: "primary" as const },
  { label: "OpenCV", tone: "cyan" as const },
  { label: "EasyOCR", tone: "green" as const },
  { label: "FastAPI", tone: "amber" as const },
  { label: "Smart City AI", tone: "primary" as const },
];

function Dashboard() {
  const { settings } = useSettings();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDemoResult, setIsDemoResult] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!ACCEPT.includes(f.type)) {
      toast.error("Unsupported file", { description: "Only JPG, JPEG or PNG." });
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!file) {
      toast.error("Upload an image first");
      return;
    }
    setLoading(true);
    try {
      const { data, demo } = await analyzeImage(file, settings);
      setResult(data);
      setIsDemoResult(demo);
      if (demo) {
        toast.warning("Backend unreachable", {
          description: "Showing demo detection data.",
        });
      } else {
        toast.success("Analysis complete");
      }
    } catch (e) {
      toast.error("Analysis failed", { description: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setFile(null);
    setPreview(null);
    setIsDemoResult(false);
  };

  const downloadCsv = () => {
    if (!result?.violations?.length) {
      toast.error("No violations to export");
      return;
    }
    const blob = new Blob([violationsToCsv(result.violations)], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gridlens-violations-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  const stats = useMemo(() => {
    const d = result?.detections ?? [];
    const v = result?.violations ?? [];
    return {
      detections: d.length,
      violations: v.length,
      highConf: v.filter((x) => x.confidence >= 0.8).length,
      pending: v.filter((x) => /review|pending/i.test(x.status)).length,
    };
  }, [result]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of result?.violations ?? []) {
      map.set(v.violation_type, (map.get(v.violation_type) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
  }, [result]);

  const annotatedSrc = result?.annotated_image_base64
    ? result.annotated_image_base64.startsWith("data:")
      ? result.annotated_image_base64
      : `data:image/jpeg;base64,${result.annotated_image_base64}`
    : preview;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 shadow-[var(--shadow-lift)]">
        <div className="absolute inset-0 gradient-primary" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />

        <div className="relative z-10 grid gap-8 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-10">
          <div className="min-w-0 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Zap className="h-3.5 w-3.5" />
              AI-Powered Traffic Intelligence
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              GridLens AI
            </h1>
            <p className="mt-2 text-base font-medium text-white/90 md:text-lg">
              AI-Powered Traffic Violation Detection & Evidence Generation
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
              Upload traffic images, detect violations, extract plate text, and
              generate review-ready evidence reports — a modern control-room
              workflow for smart-city enforcement teams.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {TECH_BADGES.map((b) => (
                <TechBadge key={b.label} tone={b.tone}>
                  {b.label}
                </TechBadge>
              ))}
            </div>
          </div>

          {/* Right-side stat cluster */}
          <div className="grid grid-cols-2 gap-3 text-white md:w-64">
            <HeroStat icon={Camera} label="Cameras" value="1" />
            <HeroStat icon={ScanSearch} label="Threshold" value={settings.confidence_threshold.toFixed(2)} />
            <HeroStat icon={Cpu} label="Workflows" value={String(activeWorkflowCount(settings))} />
            <HeroStat icon={CheckCircle2} label="Status" value="Ready" />
          </div>
        </div>
      </section>

      {/* Upload + config */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                    <Upload className="h-3.5 w-3.5" />
                  </div>
                  Upload Traffic Image
                </CardTitle>
                <CardDescription className="mt-1">
                  Drag & drop JPG · JPEG · PNG. Configure workflows in the left panel.
                </CardDescription>
              </div>
              {isDemoResult && (
                <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                  Demo mode
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
              onClick={() => inputRef.current?.click()}
              className={`group relative flex min-h-52 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                dragOver
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/8"
              }`}
            >
              <div className="absolute inset-0 -z-10 bg-city-grid opacity-40" />
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl gradient-primary text-white shadow-[0_10px_30px_-10px_var(--glow-blue)] ring-1 ring-white/40">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="text-sm font-semibold">
                {file ? file.name : "Drop image or click to browse"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                JPG · JPEG · PNG · Max 20MB
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={analyze}
                disabled={!file || loading}
                className="gap-2 gradient-primary text-white shadow-[0_10px_24px_-12px_var(--glow-blue)] hover:opacity-95"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ScanSearch className="h-4 w-4" />
                )}
                {loading ? "Analyzing…" : "Analyze Image"}
              </Button>
              <Button variant="outline" onClick={clearResult} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
              <Button variant="outline" onClick={downloadCsv} className="gap-2">
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
              <Button variant="outline" asChild className="gap-2">
                <Link to="/records">
                  <FileText className="h-4 w-4" />
                  View Saved
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-accent/15 text-accent-foreground ring-1 ring-accent/25">
                <Gauge className="h-3.5 w-3.5" />
              </div>
              Pipeline Snapshot
            </CardTitle>
            <CardDescription>Live view of your detection stack.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ConfigRow label="Confidence threshold" value={settings.confidence_threshold.toFixed(2)} />
            <ConfigRow label="Image enhancement" value={settings.enhance_image ? "On" : "Off"} />
            <ConfigRow label="OCR / plate extraction" value={settings.enable_ocr ? "On" : "Off"} />
            <div className="mt-4 border-t border-border/60 pt-3">
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Enabled Workflows
              </div>
              <div className="flex flex-wrap gap-1.5">
                {settings.simulate_helmet && <WorkflowChip tone="amber">Helmet</WorkflowChip>}
                {settings.simulate_stop_line && <WorkflowChip tone="amber">Stop-line</WorkflowChip>}
                {settings.simulate_red_light && <WorkflowChip tone="red">Red-light</WorkflowChip>}
                {settings.simulate_illegal_parking && <WorkflowChip tone="blue">Parking</WorkflowChip>}
                {activeWorkflowCount(settings) === 0 && (
                  <span className="text-xs text-muted-foreground">No workflows enabled</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Analytics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Detections" value={stats.detections} icon={ScanSearch} accent="primary" />
        <StatCard label="Total Violations" value={stats.violations} icon={ShieldAlert} accent="destructive" />
        <StatCard label="High-Confidence" value={stats.highConf} icon={CheckCircle2} accent="success" />
        <StatCard label="Pending Review" value={stats.pending} icon={AlertTriangle} accent="warning" />
      </section>

      {/* Images side by side */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ImageCard
          title="Original Traffic Image"
          src={preview}
          loading={false}
          placeholder="Uploaded traffic image will appear here"
        />
        <ImageCard
          title="Annotated Evidence Output"
          src={result ? annotatedSrc : null}
          loading={loading}
          placeholder="Run analysis to see annotated detections"
          annotated
        />
      </section>

      {/* Chart + OCR */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Violation Type Distribution</CardTitle>
            <CardDescription>Count of violations by category.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {chartData.length === 0 ? (
              <EmptyState label="No violation data yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="type"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: "var(--color-primary)", fillOpacity: 0.06 }}
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-popover-foreground)",
                      boxShadow: "var(--shadow-soft)",
                    }}
                  />
                  <Bar dataKey="count" fill="url(#barGradient)" radius={[8, 8, 0, 0]} maxBarSize={64} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                <ScanSearch className="h-3.5 w-3.5" />
              </div>
              OCR Plate Candidates
            </CardTitle>
            <CardDescription>Extracted number plate text (EasyOCR).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(result?.ocr_candidates ?? []).length === 0 ? (
              <EmptyState label="No OCR results yet" />
            ) : (
              result!.ocr_candidates.map((c, i) => (
                <div key={i} className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-semibold tracking-widest text-foreground">
                      {c.text}
                    </span>
                    <Badge className="border-primary/25 bg-primary/10 text-primary hover:bg-primary/10">
                      {(c.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={c.confidence * 100} className="mt-2 h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Detection summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Detection Summary</CardTitle>
          <CardDescription>All road users detected in the image.</CardDescription>
        </CardHeader>
        <CardContent>
          {(result?.detections ?? []).length === 0 ? (
            <EmptyState label="No detections yet — analyze an image." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Object</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Object ID</TableHead>
                    <TableHead>Bounding Box</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result!.detections.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/25 bg-primary/5 capitalize text-primary">
                          {d.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={d.confidence * 100} className="h-1.5 w-24" />
                          <span className="w-9 text-right font-mono text-xs text-muted-foreground">
                            {(d.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.id ?? `obj_${i}`}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {d.box ? `[${d.box.join(", ")}]` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Violation Evidence Report</CardTitle>
          <CardDescription>Auditable list of detected violations with evidence.</CardDescription>
        </CardHeader>
        <CardContent>
          {(result?.violations ?? []).length === 0 ? (
            <EmptyState label="No violations detected yet." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Violation</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead>Evidence</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result!.violations.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap text-xs font-mono text-muted-foreground">
                        {v.timestamp}
                      </TableCell>
                      <TableCell><ViolationBadge type={v.violation_type} /></TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">{(v.confidence * 100).toFixed(0)}%</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.vehicle_id}</TableCell>
                      <TableCell>
                        <span className="rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-primary">
                          {v.number_plate}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">{v.evidence}</TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold text-primary">{value}</span>
    </div>
  );
}

function WorkflowChip({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "amber" | "red" | "green";
}) {
  const tones = {
    blue: "border-primary/25 bg-primary/10 text-primary",
    amber: "border-warning/30 bg-warning/15 text-warning",
    red: "border-destructive/25 bg-destructive/10 text-destructive",
    green: "border-success/25 bg-success/10 text-success",
  } as const;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: "primary" | "success" | "destructive" | "warning";
}) {
  const tone = {
    primary: "from-primary/15 to-primary/0 text-primary ring-primary/20",
    success: "from-success/15 to-success/0 text-success ring-success/20",
    destructive: "from-destructive/15 to-destructive/0 text-destructive ring-destructive/20",
    warning: "from-warning/20 to-warning/0 text-warning ring-warning/20",
  }[accent];
  return (
    <Card className="glass-card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tone} blur-2xl opacity-70`} />
      <CardContent className="relative flex items-center justify-between p-5">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ring-1 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ImageCard({
  title,
  src,
  placeholder,
  loading,
  annotated,
}: {
  title: string;
  src: string | null;
  placeholder: string;
  loading: boolean;
  annotated?: boolean;
}) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            {title}
          </span>
          {annotated && src && (
            <Badge className="border-success/25 bg-success/10 text-success hover:bg-success/10">
              Annotated
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted/40 to-muted/20">
          <div className="absolute inset-0 bg-city-grid opacity-40" />
          {loading ? (
            <div className="relative flex flex-col items-center gap-3 text-sm text-muted-foreground">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="font-medium text-foreground">Running detection…</div>
              <div className="text-xs">YOLOv8 → OCR → Evidence generation</div>
            </div>
          ) : src ? (
            <img
              src={src}
              alt={title}
              className="relative max-h-[420px] w-full object-contain"
            />
          ) : (
            <div className="relative flex flex-col items-center gap-3 p-8 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="text-sm text-muted-foreground">{placeholder}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function TechBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "primary" | "cyan" | "green" | "amber";
}) {
  const tones = {
    primary: "bg-white/15 border-white/30 text-white",
    cyan: "bg-white/15 border-white/30 text-white",
    green: "bg-white/15 border-white/30 text-white",
    amber: "bg-white/15 border-white/30 text-white",
  } as const;
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur ${tones[tone]}`}>
      {children}
    </span>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/25 bg-white/15 p-3 backdrop-blur">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-white/80">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 truncate text-lg font-semibold">{value}</div>
    </div>
  );
}

function activeWorkflowCount(s: {
  simulate_helmet: boolean;
  simulate_stop_line: boolean;
  simulate_red_light: boolean;
  simulate_illegal_parking: boolean;
}) {
  return (
    Number(s.simulate_helmet) +
    Number(s.simulate_stop_line) +
    Number(s.simulate_red_light) +
    Number(s.simulate_illegal_parking)
  );
}
