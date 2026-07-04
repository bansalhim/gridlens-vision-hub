import { Badge } from "@/components/ui/badge";

function violationTone(type: string): {
  className: string;
} {
  const t = type.toLowerCase();
  if (t.includes("red")) {
    return { className: "border-destructive/30 bg-destructive/10 text-destructive" };
  }
  if (t.includes("parking")) {
    return { className: "border-primary/25 bg-primary/10 text-primary" };
  }
  if (t.includes("clean") || t.includes("approved") || t.includes("ok")) {
    return { className: "border-success/25 bg-success/10 text-success" };
  }
  // Helmet, Stop-line, Triple riding, etc. → amber
  return { className: "border-warning/30 bg-warning/15 text-warning" };
}

export function ViolationBadge({ type }: { type: string }) {
  const tone = violationTone(type);
  return (
    <Badge variant="outline" className={`whitespace-nowrap font-medium ${tone.className}`}>
      {type}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let cls = "border-primary/25 bg-primary/10 text-primary";
  if (s.includes("confirm") || s.includes("approved")) {
    cls = "border-success/25 bg-success/10 text-success";
  } else if (s.includes("review")) {
    cls = "border-destructive/25 bg-destructive/10 text-destructive";
  } else if (s.includes("pending")) {
    cls = "border-warning/30 bg-warning/15 text-warning";
  } else if (s.includes("dismiss")) {
    cls = "border-border bg-muted text-muted-foreground";
  }
  return (
    <Badge variant="outline" className={`whitespace-nowrap font-medium ${cls}`}>
      {status}
    </Badge>
  );
}

export function OcrBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge className="border-primary/25 bg-primary/10 text-primary hover:bg-primary/10">
      {children}
    </Badge>
  );
}