import { Link, useRouterState } from "@tanstack/react-router";
import { Leaf, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  role: string;
  roleColor?: string;
  nav: NavItem[];
  children: ReactNode;
  rightSlot?: ReactNode;
}

export function AppShell({ role, nav, children, rightSlot }: Props) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <Link to="/" className="px-6 py-6 flex items-center gap-2.5 border-b border-border">
          <div className="size-9 rounded-xl gradient-hero grid place-items-center text-primary-foreground shadow-soft">
            <Leaf className="size-5" />
          </div>
          <div>
            <div className="font-display text-lg leading-none">TenaMeal</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{role} portal</div>
          </div>
        </Link>
        <div className="h-1 pattern-band opacity-70" />
        <nav className="p-3 flex-1 space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-primary-soft text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Link
            to="/"
            className="block text-xs text-muted-foreground hover:text-foreground px-3 py-2"
          >
            ← Switch role
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-background/85 backdrop-blur border-b border-border">
          <div className="px-6 md:px-8 py-4 flex items-center justify-between gap-4">
            <div className="md:hidden flex items-center gap-2">
              <Link to="/" className="size-8 rounded-lg gradient-hero grid place-items-center text-primary-foreground">
                <Leaf className="size-4" />
              </Link>
              <span className="font-display">TenaMeal</span>
            </div>
            <div className="hidden md:block">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {role}
              </div>
              <div className="font-display text-xl">
                {nav.find((n) => n.to === pathname)?.label ?? "Dashboard"}
              </div>
            </div>
            <div className="flex items-center gap-3">{rightSlot}</div>
          </div>
          <nav className="md:hidden px-4 pb-3 flex gap-1 overflow-x-auto">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-3xl">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
