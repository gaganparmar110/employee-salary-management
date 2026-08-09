import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  headerRight?: ReactNode;
}

// The shell every authenticated page sits in: a fixed header and a
// scrollable content area beneath it, so the header never scrolls out of
// view — the browser's own document never grows taller than the viewport.
// Individual tables inside `children` layer their own bounded scroll +
// sticky column header on top of this for long row lists.
export function AppShell({ children, headerRight }: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-foreground">Employee Salary Management</span>
          {headerRight}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
