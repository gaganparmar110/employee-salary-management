"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "../../store/authStore";
import { listEmployees } from "../../lib/employeesApi";
import { useAsyncData } from "../../lib/useAsyncData";
import { scrollClassIfLong } from "../../lib/scroll";

const PAGE_SIZE = 20;

// Unlike the Reports page, this loads automatically — browsing/searching
// employees is this page's whole purpose, not an optional question.
export default function EmployeesPage() {
  const token = useAuthStore((state) => state.token);

  const [searchInput, setSearchInput] = useState("");
  const [departmentInput, setDepartmentInput] = useState("");
  const [countryInput, setCountryInput] = useState("");
  const [committedFilters, setCommittedFilters] = useState({ search: "", department: "", country: "" });
  const [page, setPage] = useState(1);

  const list = useAsyncData(() =>
    listEmployees(token as string, { ...committedFilters, page, pageSize: PAGE_SIZE }),
  );

  useEffect(() => {
    if (!token) return;
    list.run();
    // Re-fetch whenever the committed filters or page change — `list.run`
    // itself is intentionally excluded, it's redefined every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, committedFilters, page]);

  function handleSearch() {
    setPage(1);
    setCommittedFilters({ search: searchInput, department: departmentInput, country: countryInput });
  }

  const totalPages = list.data ? Math.max(1, Math.ceil(list.data.total / PAGE_SIZE)) : 1;

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

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Employees</h1>
          <p className="mt-1 text-sm text-muted">Search and browse employee records.</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-muted">
            Name or employee code
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="e.g. Ada or EMP-00001"
              className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm text-muted">
            Department
            <input
              type="text"
              value={departmentInput}
              onChange={(event) => setDepartmentInput(event.target.value)}
              placeholder="e.g. Engineering"
              className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="text-sm text-muted">
            Country
            <input
              type="text"
              value={countryInput}
              onChange={(event) => setCountryInput(event.target.value)}
              placeholder="e.g. Germany"
              className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <button
            type="button"
            onClick={handleSearch}
            disabled={list.loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {list.error && (
          <p role="alert" className="text-sm text-danger">
            {list.error}
          </p>
        )}

        {list.loading && !list.data && <p className="text-sm text-muted">Loading employees…</p>}

        {list.data && (
          <>
            {list.data.items.length === 0 ? (
              <p className="text-sm text-muted">No employees found.</p>
            ) : (
              <div className="rounded-xl border border-border bg-surface p-4">
                <div className={scrollClassIfLong(list.data.items.length)}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="py-2 pr-4 font-medium">Code</th>
                        <th className="py-2 pr-4 font-medium">Name</th>
                        <th className="py-2 pr-4 font-medium">Department</th>
                        <th className="py-2 pr-4 font-medium">Country</th>
                        <th className="py-2 font-medium">Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.data.items.map((employee) => (
                        <tr key={employee.id} className="border-b border-border/50 text-foreground">
                          <td className="py-2 pr-4">{employee.employeeCode}</td>
                          <td className="py-2 pr-4">{employee.fullName}</td>
                          <td className="py-2 pr-4">{employee.department}</td>
                          <td className="py-2 pr-4">{employee.country}</td>
                          <td className="py-2">{employee.currency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted">
              <span>
                {list.data.total} employee{list.data.total === 1 ? "" : "s"} · page {list.data.page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
