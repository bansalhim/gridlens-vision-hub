import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SettingsContext, defaultSettings, type Settings } from "@/lib/gridlens";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { Radar, ShieldCheck } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GridLens AI — Automated Traffic Violation Detection" },
      {
        name: "description",
        content:
          "GridLens AI detects road users, identifies traffic violations, extracts number plates and generates evidence reports from uploaded traffic imagery.",
      },
      { name: "author", content: "GridLens AI" },
      { property: "og:title", content: "GridLens AI — Traffic Violation Detection" },
      {
        property: "og:description",
        content:
          "Automated traffic violation detection and evidence generation dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const setSettings = useCallback(
    (patch: Partial<Settings>) =>
      setSettingsState((prev) => ({ ...prev, ...patch })),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsContext.Provider value={{ settings, setSettings }}>
        <SidebarProvider>
          <div className="relative flex min-h-screen w-full text-foreground">
            {/* Ambient smart-city grid overlay */}
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 -z-10 bg-city-grid opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]"
            />
            <AppSidebar />
            <div className="flex flex-1 flex-col">
              <TopNav />
              <main className="flex-1">
                {/* Required: nested routes render here. */}
                <Outlet />
              </main>
              <SiteFooter />
            </div>
          </div>
          <Toaster />
        </SidebarProvider>
      </SettingsContext.Provider>
    </QueryClientProvider>
  );
}

function TopNav() {
  const navItems: Array<{ to: "/" | "/records" | "/analytics" | "/about"; label: string }> = [
    { to: "/", label: "Dashboard" },
    { to: "/records", label: "Records" },
    { to: "/analytics", label: "Analytics" },
    { to: "/about", label: "About" },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-[0_6px_20px_-6px_var(--glow-blue)] ring-1 ring-white/40">
            <Radar className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold tracking-tight">
              GridLens AI
            </div>
            <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Smart City Traffic Control
            </div>
          </div>
        </div>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
              activeOptions={{ exact: true }}
              activeProps={{
                className:
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold bg-primary/10 text-primary ring-1 ring-primary/20",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live monitoring
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur lg:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            API <span className="font-mono text-foreground/70">gridlens-backend-my.onrender.com</span>
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border/40 px-4 py-2 md:hidden">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{
              className:
                "whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-border/50 bg-background/50 px-6 py-6 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div>
          © {new Date().getFullYear()} GridLens AI · Smart City Traffic Intelligence
        </div>
       <div className="font-mono">v1.0 · Backend gridlens-backend-my.onrender.com</div>
      </div>
    </footer>
  );
}
