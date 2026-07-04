import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileArchive, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchRecords, type SavedRecord } from "@/lib/gridlens";
import { ViolationBadge, StatusBadge } from "@/components/violation-badges";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Saved Records — GridLens AI" },
      {
        name: "description",
        content:
          "Browse, search and filter saved traffic violation evidence records.",
      },
    ],
  }),
  component: Records,
});

function Records() {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, demo } = await fetchRecords();
    setRecords(data);
    setIsDemo(demo);
    setLoading(false);
    if (demo) toast.warning("Backend unreachable — showing demo records");
  };

  useEffect(() => {
    void load();
  }, []);

  const types = useMemo(
    () => Array.from(new Set(records.map((r) => r.violation_type))),
    [records],
  );
  const statuses = useMemo(
    () => Array.from(new Set(records.map((r) => r.status))),
    [records],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== "all" && r.violation_type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.number_plate.toLowerCase().includes(q) ||
        r.vehicle_id.toLowerCase().includes(q) ||
        r.violation_type.toLowerCase().includes(q) ||
        r.evidence.toLowerCase().includes(q)
      );
    });
  }, [records, query, typeFilter, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <FileArchive className="h-3.5 w-3.5" />
            Archive
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Saved Records</h1>
          <p className="text-sm text-muted-foreground">
            Previously stored violation reports from the GridLens AI backend.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
              Demo data
            </Badge>
          )}
          <Button variant="outline" onClick={load} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and narrow down archived records.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search plate, vehicle, evidence…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Violation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All violation types</SelectItem>
                {types.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>
            Records{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({filtered.length} of {records.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading records…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
              No records match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
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
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">#{r.id}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {r.timestamp}
                      </TableCell>
                      <TableCell><ViolationBadge type={r.violation_type} /></TableCell>
                      <TableCell className="font-mono text-xs">
                        {(r.confidence * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.vehicle_id}</TableCell>
                      <TableCell>
                        <span className="rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 font-mono text-xs font-semibold tracking-widest text-primary">
                          {r.number_plate}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">
                        {r.evidence}
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
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