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
  CheckCircle2,
  Download,
  FileText,
  Gauge,
  ImageIcon,
  Loader2,
  ScanSearch,
  ShieldAlert,
  Trash2,
  Upload,
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
  statusVariant,
  type AnalyzeResponse,
} from "@/lib/gridlens";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const ACCEPT = ["image/jpeg", "image/jpg", "image/png"];

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
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/15 via-card to-accent/10 p-6 md:p-10">
        <div className="absolute inset-0 -z-0 opacity-40 [mask-image:radial-gradient(circle_at_top_right,black,transparent_70%)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent">
            AI-powered traffic intelligence
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            GridLens AI
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Automated Traffic Violation Detection & Evidence Generation
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Upload traffic imagery and GridLens AI detects road users, identifies
            possible violations, extracts number-plate text, and generates
            court-ready evidence reports — all in one clean, auditable workflow.
          </p>
        </div>
      </section>

      {/* Upload */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              Upload Traffic Image
            </CardTitle>
            <CardDescription>
              Drag and drop a JPG, JPEG or PNG. Adjust workflows in the sidebar.
            </CardDescription>
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
              className={`group relative flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-border/70 bg-muted/30 hover:border-primary/60 hover:bg-primary/5"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium">
                {file ? file.name : "Drop image or click to browse"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                JPG · JPEG · PNG · up to 20MB
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={analyze} disabled={!file || loading} className="gap-2">
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
                  Saved Records
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {isDemoResult && (
                <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                  Demo data
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Active Configuration
            </CardTitle>
            <CardDescription>Snapshot of your detection pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ConfigRow label="Confidence threshold" value={settings.confidence_threshold.toFixed(2)} />
            <ConfigRow label="Image enhancement" value={settings.enhance_image ? "On" : "Off"} />
            <ConfigRow label="OCR / plate extraction" value={settings.enable_ocr ? "On" : "Off"} />
            <div className="mt-4 border-t border-border/60 pt-3">
              <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                Workflows
              </div>
              <div className="flex flex-wrap gap-1.5">
                {settings.simulate_helmet && <WorkflowChip>Helmet</WorkflowChip>}
                {settings.simulate_stop_line && <WorkflowChip>Stop-line</WorkflowChip>}
                {settings.simulate_red_light && <WorkflowChip>Red-light</WorkflowChip>}
                {settings.simulate_illegal_parking && <WorkflowChip>Parking</WorkflowChip>}
                {!settings.simulate_helmet &&
                  !settings.simulate_stop_line &&
                  !settings.simulate_red_light &&
                  !settings.simulate_illegal_parking && (
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
        <StatCard label="High-Confidence" value={stats.highConf} icon={CheckCircle2} accent="accent" />
        <StatCard label="Pending Review" value={stats.pending} icon={AlertTriangle} accent="warning" />
      </section>

      {/* Images side by side */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ImageCard title="Original Traffic Image" src={preview} placeholder="Uploaded image will appear here" />
        <ImageCard
          title="Annotated Evidence Output"
          src={result ? annotatedSrc : null}
          placeholder="Run analysis to see annotated detections"
          annotated
        />
      </section>

      {/* Chart + OCR */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="type"
                    stroke="var(--color-muted-foreground)"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OCR / Plate Candidates</CardTitle>
            <CardDescription>Extracted number plate text.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(result?.ocr_candidates ?? []).length === 0 ? (
              <EmptyState label="No OCR results yet" />
            ) : (
              result!.ocr_candidates.map((c, i) => (
                <div key={i} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm tracking-wider">{c.text}</span>
                    <Badge variant="secondary">{(c.confidence * 100).toFixed(0)}%</Badge>
                  </div>
                  <Progress value={c.confidence * 100} className="mt-2 h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {/* Detection summary */}
      <Card>
        <CardHeader>
          <CardTitle>Detection Summary</CardTitle>
          <CardDescription>All road users detected in the image.</CardDescription>
        </CardHeader>
        <CardContent>
          {(result?.detections ?? []).length === 0 ? (
            <EmptyState label="No detections yet — analyze an image." />
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <Table>
                <TableHeader>
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
                      <TableCell className="font-medium capitalize">{d.label}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={d.confidence * 100} className="h-1.5 w-24" />
                          <span className="text-xs font-mono text-muted-foreground">
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
      <Card>
        <CardHeader>
          <CardTitle>Violation Evidence Report</CardTitle>
          <CardDescription>Auditable list of detected violations with evidence.</CardDescription>
        </CardHeader>
        <CardContent>
          {(result?.violations ?? []).length === 0 ? (
            <EmptyState label="No violations detected yet." />
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <Table>
                <TableHeader>
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
                      <TableCell className="font-medium">{v.violation_type}</TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">{(v.confidence * 100).toFixed(0)}%</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{v.vehicle_id}</TableCell>
                      <TableCell className="font-mono text-xs tracking-wider">{v.number_plate}</TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">{v.evidence}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(v.status)}>{v.status}</Badge>
                      </TableCell>
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
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-primary">{value}</span>
    </div>
  );
}

function WorkflowChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
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
  accent: "primary" | "accent" | "destructive" | "warning";
}) {
  const tone = {
    primary: "bg-primary/15 text-primary ring-primary/30",
    accent: "bg-accent/15 text-accent ring-accent/30",
    destructive: "bg-destructive/15 text-destructive ring-destructive/30",
    warning: "bg-warning/15 text-warning ring-warning/30",
  }[accent];
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ring-1 ${tone}`}>
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
  annotated,
}: {
  title: string;
  src: string | null;
  placeholder: string;
  annotated?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {annotated && src && (
            <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent">
              Annotated
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-64 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/30">
          {src ? (
            <img src={src} alt={title} className="max-h-[420px] w-full object-contain" />
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">{placeholder}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-32 items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
