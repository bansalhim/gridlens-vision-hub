import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileArchive, Radar } from "lucide-react";

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
import { useSettings } from "@/lib/gridlens";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Saved Records", url: "/records", icon: FileArchive },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { settings, setSettings } = useSettings();

  const toggles: Array<{ key: keyof typeof settings; label: string }> = [
    { key: "enhance_image", label: "Image Enhancement" },
    { key: "enable_ocr", label: "OCR / Plate Extraction" },
    { key: "simulate_helmet", label: "Helmet Non-Compliance" },
    { key: "simulate_stop_line", label: "Stop-Line Violation" },
    { key: "simulate_red_light", label: "Red-Light Violation" },
    { key: "simulate_illegal_parking", label: "Illegal Parking" },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <Radar className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">GridLens AI</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Traffic Intelligence
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
                    <Link to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
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
                  <span className="text-xs font-mono text-primary">
                    {settings.confidence_threshold.toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[settings.confidence_threshold]}
                  min={0.1}
                  max={0.95}
                  step={0.01}
                  onValueChange={([v]) => setSettings({ confidence_threshold: v })}
                />
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Workflows</SidebarGroupLabel>
              <SidebarGroupContent className="space-y-3 px-3 py-2">
                {toggles.map((t) => (
                  <div key={t.key} className="flex items-center justify-between gap-2">
                    <Label htmlFor={t.key} className="text-xs">
                      {t.label}
                    </Label>
                    <Switch
                      id={t.key}
                      checked={settings[t.key] as boolean}
                      onCheckedChange={(v) => setSettings({ [t.key]: v } as never)}
                    />
                  </div>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] text-muted-foreground">
            v1.0 · Backend: <span className="font-mono">localhost:8000</span>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}