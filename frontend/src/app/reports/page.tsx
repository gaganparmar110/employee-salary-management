"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import {
  getByCountry,
  getByDepartment,
  getByDepartmentCountry,
  getOverview,
  getPayOverTime,
  getSalaryDistribution,
  getTopEarners,
  type SalaryBand,
} from "../../lib/reportsApi";
import { formatMoney } from "../../lib/format";
import { SummaryTable } from "../../components/reports/SummaryTable";
import { useAsyncData } from "../../lib/useAsyncData";

const SCROLL_THRESHOLD = 10;

// Any table/list past this many rows gets wrapped so the page doesn't grow
// unbounded — it scrolls within itself instead.
function scrollClass(rowCount: number): string | undefined {
  return rowCount > SCROLL_THRESHOLD ? "max-h-96 overflow-y-auto" : undefined;
}

export default function ReportsPage() {
  const token = useAuthStore((state) => state.token);

  // Every section is fetched only when its own button is clicked — nothing
  // loads automatically on page visit.
  const overview = useAsyncData(() => getOverview(token as string));
  const byDepartment = useAsyncData(() => getByDepartment(token as string));
  const byCountry = useAsyncData(() => getByCountry(token as string));
  const distribution = useAsyncData(() => getSalaryDistribution(token as string, 5));

  const [fairnessDepartment, setFairnessDepartment] = useState("");
  const [fairnessCountry, setFairnessCountry] = useState("");
  const deptCountry = useAsyncData(() =>
    getByDepartmentCountry(token as string, {
      department: fairnessDepartment || undefined,
      country: fairnessCountry || undefined,
    }),
  );

  const [earnersCurrency, setEarnersCurrency] = useState("");
  const earners = useAsyncData(() => getTopEarners(token as string, { currency: earnersCurrency || undefined, limit: 5 }));

  const [trendDepartment, setTrendDepartment] = useState("");
  const [trendCountry, setTrendCountry] = useState("");
  const payOverTime = useAsyncData(() =>
    getPayOverTime(token as string, {
      department: trendDepartment || undefined,
      country: trendCountry || undefined,
    }),
  );

  const distributionByCurrency = distribution.data
    ? Array.from(
        distribution.data.reduce<Map<string, SalaryBand[]>>((acc, band) => {
          const list = acc.get(band.currency);
          if (list) list.push(band);
          else acc.set(band.currency, [band]);
          return acc;
        }, new Map()),
      )
    : [];

  const payOverTimeRowCount = payOverTime.data?.reduce((sum, period) => sum + period.summary.length, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold text-foreground">Employee Salary Management</span>
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
            ← Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted">Click a question to fetch its answer.</p>
        </div>

        {/* How much are we spending overall? */}
        <section>
          <h2 className="text-lg font-medium text-foreground">How much are we spending overall?</h2>
          <div className="mt-3">
            <button
              type="button"
              onClick={overview.run}
              disabled={overview.loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {overview.loading ? "Loading…" : "Show overview"}
            </button>
          </div>
          {overview.error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {overview.error}
            </p>
          )}
          {overview.data && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {overview.data.map((row) => (
                <div key={row.currency} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">{row.currency}</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {formatMoney(row.totalCost, row.currency)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {row.headcount} employees · avg {formatMoney(row.averageSalary, row.currency)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Which department is most expensive? */}
        <section>
          <h2 className="text-lg font-medium text-foreground">Which department is most expensive?</h2>
          <p className="mt-1 text-xs text-muted">Sorted by total cost within each currency.</p>
          <div className="mt-3">
            <button
              type="button"
              onClick={byDepartment.run}
              disabled={byDepartment.loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {byDepartment.loading ? "Loading…" : "Show departments"}
            </button>
          </div>
          {byDepartment.error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {byDepartment.error}
            </p>
          )}
          {byDepartment.data && (
            <div className="mt-3 rounded-xl border border-border bg-surface p-4">
              <SummaryTable
                groupLabel="Department"
                rows={[...byDepartment.data].sort((a, b) => b.totalCost - a.totalCost)}
              />
            </div>
          )}
        </section>

        {/* How do we pay by country? */}
        <section>
          <h2 className="text-lg font-medium text-foreground">How do we pay by country?</h2>
          <div className="mt-3">
            <button
              type="button"
              onClick={byCountry.run}
              disabled={byCountry.loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {byCountry.loading ? "Loading…" : "Show countries"}
            </button>
          </div>
          {byCountry.error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {byCountry.error}
            </p>
          )}
          {byCountry.data && (
            <div className="mt-3 rounded-xl border border-border bg-surface p-4">
              <SummaryTable groupLabel="Country" rows={[...byCountry.data].sort((a, b) => b.totalCost - a.totalCost)} />
            </div>
          )}
        </section>

        {/* Are we paying fairly across countries? */}
        <section>
          <h2 className="text-lg font-medium text-foreground">Are we paying fairly across countries?</h2>
          <p className="mt-1 text-xs text-muted">
            Enter a department and/or country to compare average pay precisely (leave blank for all).
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm text-muted">
              Department
              <input
                type="text"
                value={fairnessDepartment}
                onChange={(event) => setFairnessDepartment(event.target.value)}
                placeholder="e.g. Engineering"
                className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="text-sm text-muted">
              Country
              <input
                type="text"
                value={fairnessCountry}
                onChange={(event) => setFairnessCountry(event.target.value)}
                placeholder="e.g. Germany"
                className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={deptCountry.run}
              disabled={deptCountry.loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {deptCountry.loading ? "Loading…" : "Show"}
            </button>
          </div>
          {deptCountry.error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {deptCountry.error}
            </p>
          )}
          {deptCountry.data && (
            <div className="mt-3 rounded-xl border border-border bg-surface p-4">
              {deptCountry.data.length === 0 ? (
                <p className="text-sm text-muted">No matching data.</p>
              ) : (
                <div className={scrollClass(deptCountry.data.length)}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="py-2 pr-4 font-medium">Department</th>
                        <th className="py-2 pr-4 font-medium">Country</th>
                        <th className="py-2 pr-4 font-medium">Currency</th>
                        <th className="py-2 pr-4 font-medium">Headcount</th>
                        <th className="py-2 pr-4 font-medium">Average</th>
                        <th className="py-2 font-medium">Median</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptCountry.data.map((row) => (
                        <tr
                          key={`${row.department}-${row.country}-${row.currency}`}
                          className="border-b border-border/50 text-foreground"
                        >
                          <td className="py-2 pr-4">{row.department}</td>
                          <td className="py-2 pr-4">{row.country}</td>
                          <td className="py-2 pr-4">{row.currency}</td>
                          <td className="py-2 pr-4">{row.headcount}</td>
                          <td className="py-2 pr-4">{formatMoney(row.averageSalary, row.currency)}</td>
                          <td className="py-2">{formatMoney(row.medianSalary, row.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Who are the highest/lowest paid employees? */}
        <section>
          <h2 className="text-lg font-medium text-foreground">Who are the highest/lowest paid employees?</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm text-muted">
              Currency
              <input
                type="text"
                value={earnersCurrency}
                onChange={(event) => setEarnersCurrency(event.target.value)}
                placeholder="e.g. GBP (blank = all)"
                className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={earners.run}
              disabled={earners.loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {earners.loading ? "Loading…" : "Show"}
            </button>
          </div>
          {earners.error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {earners.error}
            </p>
          )}
          {earners.data && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {earners.data.map((report) => (
                <div key={report.currency} className="rounded-xl border border-border bg-surface p-4">
                  <p className="text-xs uppercase tracking-wide text-muted">{report.currency}</p>
                  <p className="mt-2 text-xs font-medium text-foreground">Highest paid</p>
                  <ul className="mt-1 space-y-1 text-sm text-foreground">
                    {report.top.map((entry) => (
                      <li key={entry.employeeCode} className="flex justify-between">
                        <span>{entry.fullName}</span>
                        <span className="text-muted">{formatMoney(entry.amount, report.currency)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-medium text-foreground">Lowest paid</p>
                  <ul className="mt-1 space-y-1 text-sm text-foreground">
                    {report.bottom.map((entry) => (
                      <li key={entry.employeeCode} className="flex justify-between">
                        <span>{entry.fullName}</span>
                        <span className="text-muted">{formatMoney(entry.amount, report.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Salary distribution */}
        <section>
          <h2 className="text-lg font-medium text-foreground">What does our salary distribution look like?</h2>
          <div className="mt-3">
            <button
              type="button"
              onClick={distribution.run}
              disabled={distribution.loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {distribution.loading ? "Loading…" : "Show distribution"}
            </button>
          </div>
          {distribution.error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {distribution.error}
            </p>
          )}
          {distribution.data && (
            <div className="mt-3 space-y-4">
              {distributionByCurrency.map(([currency, bands]) => {
                const maxCount = Math.max(...bands.map((band) => band.count), 1);
                return (
                  <div key={currency} className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">{currency}</p>
                    <div className="mt-2 space-y-1">
                      {bands.map((band) => (
                        <div key={`${band.min}-${band.max}`} className="flex items-center gap-2 text-xs text-muted">
                          <span className="w-36 shrink-0">
                            {formatMoney(band.min, currency)}–{formatMoney(band.max, currency)}
                          </span>
                          <div className="h-3 flex-1 rounded bg-background">
                            <div
                              className="h-3 rounded bg-accent"
                              style={{ width: `${(band.count / maxCount) * 100}%` }}
                            />
                          </div>
                          <span className="w-10 text-right">{band.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* How has salary changed over time? */}
        <section>
          <h2 className="text-lg font-medium text-foreground">How has salary changed over time?</h2>
          <p className="mt-1 text-xs text-muted">Optionally narrow to one department and/or country.</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-sm text-muted">
              Department
              <input
                type="text"
                value={trendDepartment}
                onChange={(event) => setTrendDepartment(event.target.value)}
                placeholder="e.g. Engineering"
                className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="text-sm text-muted">
              Country
              <input
                type="text"
                value={trendCountry}
                onChange={(event) => setTrendCountry(event.target.value)}
                placeholder="e.g. Germany"
                className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={payOverTime.run}
              disabled={payOverTime.loading}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {payOverTime.loading ? "Loading…" : "Show trend"}
            </button>
          </div>
          {payOverTime.error && (
            <p role="alert" className="mt-2 text-sm text-danger">
              {payOverTime.error}
            </p>
          )}
          {payOverTime.data && (
            <div className="mt-3 rounded-xl border border-border bg-surface p-4">
              {payOverTime.data.length === 0 ? (
                <p className="text-sm text-muted">No history yet.</p>
              ) : (
                <div className={scrollClass(payOverTimeRowCount)}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="py-2 pr-4 font-medium">Period</th>
                        <th className="py-2 pr-4 font-medium">Currency</th>
                        <th className="py-2 pr-4 font-medium">Headcount</th>
                        <th className="py-2 font-medium">Total cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payOverTime.data.flatMap((period) =>
                        period.summary.map((row) => (
                          <tr
                            key={`${period.period}-${row.currency}`}
                            className="border-b border-border/50 text-foreground"
                          >
                            <td className="py-2 pr-4">{period.period}</td>
                            <td className="py-2 pr-4">{row.currency}</td>
                            <td className="py-2 pr-4">{row.headcount}</td>
                            <td className="py-2">{formatMoney(row.totalCost, row.currency)}</td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
