import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileArchive,
  BarChart3,
  Info,
  Camera,
  ScanLine,
  HardHat,
  Octagon,
  TrafficCone,
  ParkingSquare,
  Wand2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "@/lib/gridlens";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Records", url: "/records", icon: FileArchive },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "About", url: "/about", icon: Info },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { settings, setSettings } = useSettings();

  type ToggleKey =
    | "enhance_image"
    | "enable_ocr"
    | "simulate_helmet"
    | "simulate_stop_line"
    | "simulate_red_light"
    | "simulate_illegal_parking";

  const pipeline: Array<{
    key: ToggleKey;
    label: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: "enhance_image", label: "Image Enhancement", hint: "Improve low-light frames", icon: Wand2 },
    { key: "enable_ocr", label: "OCR / Plate Extraction", hint: "EasyOCR number plate read", icon: ScanLine },
  ];

  const workflows: Array<{
    key: ToggleKey;
    label: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: "amber" | "red" | "blue" | "cyan";
  }> = [
    { key: "simulate_helmet", label: "Helmet Non-Compliance", hint: "Riders without helmet", icon: HardHat, tone: "amber" },
    { key: "simulate_stop_line", label: "Stop-Line Violation", hint: "Vehicles crossing stop-line", icon: Octagon, tone: "amber" },
    { key: "simulate_red_light", label: "Red-Light Violation", hint: "Red-phase intersection breach", icon: TrafficCone, tone: "red" },
    { key: "simulate_illegal_parking", label: "Illegal Parking", hint: "Obstruction / no-parking zone", icon: ParkingSquare, tone: "blue" },
  ];

  const toneClass = (t: "amber" | "red" | "blue" | "cyan") =>
    t === "amber"
      ? "bg-warning/15 text-warning ring-warning/25"
      : t === "red"
        ? "bg-destructive/10 text-destructive ring-destructive/25"
        : t === "blue"
          ? "bg-primary/10 text-primary ring-primary/25"
          : "bg-accent/15 text-accent-foreground ring-accent/25";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-[0_6px_16px_-8px_var(--glow-blue)] ring-1 ring-white/40">
            <Camera className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold tracking-tight">Control Panel</div>
              <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                GridLens AI · v1.0
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link to={item.url} className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Detection</SidebarGroupLabel>
              <SidebarGroupContent className="px-3 py-2">
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Confidence threshold
                  </Label>
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 font-mono text-[10px] text-primary">
                    {settings.confidence_threshold.toFixed(2)}
                  </Badge>
                </div>
                <Slider
                  value={[settings.confidence_threshold]}
                  min={0.1}
                  max={0.95}
                  step={0.01}
                  onValueChange={([v]) => setSettings({ confidence_threshold: v })}
                />
                <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                  Minimum confidence for a detection to be kept.
                </p>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Pipeline</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-2 px-2 py-2">
                {pipeline.map((t) => (
                  <ToggleRow
                    key={t.key}
                    id={t.key}
                    label={t.label}
                    hint={t.hint}
                    icon={t.icon}
                    tone="blue"
                    toneClass={toneClass("blue")}
                    checked={settings[t.key]}
                    onChange={(v) => setSettings({ [t.key]: v } as never)}
                  />
                ))}
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Violation Workflows</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-2 px-2 py-2">
                {workflows.map((t) => (
                  <ToggleRow
                    key={t.key}
                    id={t.key}
                    label={t.label}
                    hint={t.hint}
                    icon={t.icon}
                    tone={t.tone}
                    toneClass={toneClass(t.tone)}
                    checked={settings[t.key]}
                    onChange={(v) => setSettings({ [t.key]: v } as never)}
                  />
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <div className="mx-2 mb-2 rounded-lg border border-border/60 bg-card/60 p-2.5 text-[10px] leading-snug text-muted-foreground backdrop-blur">
            <div className="mb-1 flex items-center gap-1.5 text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span className="font-medium">System healthy</span>
            </div>
            Backend <span className="font-mono">localhost:8000</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  icon: Icon,
  toneClass,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "amber" | "red" | "blue" | "cyan";
  toneClass: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-2.5 rounded-lg border p-2 transition-colors ${
        checked
          ? "border-primary/20 bg-primary/5"
          : "border-transparent hover:bg-muted"
      }`}
    >
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ring-1 ${toneClass}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-foreground">{label}</span>
        <span className="block truncate text-[10px] text-muted-foreground">{hint}</span>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}