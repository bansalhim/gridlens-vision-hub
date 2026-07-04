import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchRecords, type SavedRecord } from "@/lib/gridlens";
import { ViolationBadge, StatusBadge } from "@/components/violation-badges";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — GridLens AI" },
      { name: "description", content: "Aggregate analytics for detected traffic violations." },
    ],
  }),
  component: Analytics,
});

const COLORS = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-destructive)",
];

function Analytics() {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data, demo } = await fetchRecords();
      setRecords(data);
      setIsDemo(demo);
    })();
  }, []);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) map.set(r.violation_type, (map.get(r.violation_type) ?? 0) + 1);
    return Array.from(map, ([type, count]) => ({ type, count }));
  }, [records]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) map.set(r.status, (map.get(r.status) ?? 0) + 1);
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [records]);

  const total = records.length;
  const highConf = records.filter((r) => r.confidence >= 0.8).length;
  const pending = records.filter((r) => /pending|review/i.test(r.status)).length;
  const avgConf =
    total === 0 ? 0 : records.reduce((s, r) => s + r.confidence, 0) / total;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Traffic Enforcement Insights
          </h1>
          <p className="text-sm text-muted-foreground">
            Aggregated analytics from stored violation records.
          </p>
        </div>
        {isDemo && (
          <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
            Demo data
          </Badge>
        )}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Records" value={total} icon={Activity} tone="primary" />
        <MetricCard label="High Confidence" value={highConf} icon={CheckCircle2} tone="success" />
        <MetricCard label="Pending Review" value={pending} icon={AlertTriangle} tone="warning" />
        <MetricCard
          label="Avg Confidence"
          value={total ? `${(avgConf * 100).toFixed(0)}%` : "—"}
          icon={ShieldAlert}
          tone="destructive"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Violations by Type</CardTitle>
            <CardDescription>Total count of each violation category.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.85} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="type" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
                <RechartsTooltip
                  cursor={{ fill: "var(--color-primary)", fillOpacity: 0.06 }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    boxShadow: "var(--shadow-soft)",
                  }}
                />
                <Bar dataKey="count" fill="url(#ag)" radius={[8, 8, 0, 0]} maxBarSize={64} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Status Split</CardTitle>
            <CardDescription>Distribution of review statuses.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {byStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--color-card)" strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    boxShadow: "var(--shadow-soft)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {byStatus.map((s, i) => (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {s.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
          <CardDescription>Latest 5 violations from the archive.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {records.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
              >
                <div className="flex items-center gap-3">
                  <ViolationBadge type={r.violation_type} />
                  <span className="rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-primary">
                    {r.number_plate}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{r.timestamp}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "destructive";
}) {
  const t = {
    primary: "from-primary/15 to-primary/0 text-primary ring-primary/20",
    success: "from-success/15 to-success/0 text-success ring-success/20",
    warning: "from-warning/20 to-warning/0 text-warning ring-warning/20",
    destructive: "from-destructive/15 to-destructive/0 text-destructive ring-destructive/20",
  }[tone];
  return (
    <Card className="glass-card relative overflow-hidden">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${t} blur-2xl opacity-70`} />
      <CardContent className="relative flex items-center justify-between p-5">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ring-1 ${t}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}