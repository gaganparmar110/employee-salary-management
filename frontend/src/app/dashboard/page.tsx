"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";

// Landing page after login — links out to Reports and Employees. Route
// protection lives in proxy.ts now, not a client-side layout guard.
export default function DashboardPage() {
  const router = useRouter();
  const hrManager = useAuthStore((state) => state.hrManager);
  const logout = useAuthStore((state) => state.logout);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-foreground">Employee Salary Management</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{hrManager?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground">Welcome back{hrManager?.email ? `, ${hrManager.email}` : ""}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Manage employee salary records and answer questions about how the org pays its
          people — headcount cost, pay by department and country, and how pay has changed
          over time — without exporting anything to Excel first.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/employees"
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <h2 className="text-sm font-medium text-foreground">Employees →</h2>
            <p className="mt-1 text-sm text-muted">Search and browse employee records.</p>
          </Link>
          <Link
            href="/reports"
            className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <h2 className="text-sm font-medium text-foreground">Reports →</h2>
            <p className="mt-1 text-sm text-muted">
              Headcount cost, top earners, pay-over-time, and more.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
