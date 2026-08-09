"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import {
  getEmployee,
  getSalaryHistory,
  updateSalary,
  type PayFrequency,
  type SalaryChangeReason,
} from "../../../lib/employeesApi";
import { useAsyncData } from "../../../lib/useAsyncData";
import { scrollClassIfLong } from "../../../lib/scroll";
import { formatMoney } from "../../../lib/format";
import { AppShell } from "../../../components/layout/AppShell";
import { Skeleton, TableSkeletonRows } from "../../../components/ui/Skeleton";

const UPDATE_REASONS: Exclude<SalaryChangeReason, "HIRE">[] = ["RAISE", "ADJUSTMENT", "CURRENCY_CHANGE", "CORRECTION"];

// Mirrors the backend's updateSalarySchema (zod) so obviously-bad input
// never round-trips to the server just to bounce back as a 400.
const CURRENCY_CODE_PATTERN = /^[A-Za-z]{3}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type UpdateSalaryFieldErrors = Partial<Record<"amount" | "currency" | "effectiveDate", string>>;

// Fixed-height reserved slot so a field's error appearing doesn't shift
// the rest of the row out of alignment with its neighbors.
function FieldError({ message }: { message?: string }) {
  return (
    <p role={message ? "alert" : undefined} className="mt-1 min-h-8 text-xs text-danger">
      {message ?? ""}
    </p>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as string;
  const token = useAuthStore((state) => state.token);

  const employee = useAsyncData(() => getEmployee(token as string, id));
  const history = useAsyncData(() => getSalaryHistory(token as string, id));

  useEffect(() => {
    if (!token) return;
    employee.run();
    history.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, id]);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("ANNUAL");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState<Exclude<SalaryChangeReason, "HIRE">>("RAISE");
  const [showSuccess, setShowSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<UpdateSalaryFieldErrors>({});

  const updateAction = useAsyncData(() =>
    updateSalary(token as string, id, {
      amount: Number(amount),
      currency,
      payFrequency,
      effectiveDate,
      reason,
    }),
  );

  useEffect(() => {
    if (updateAction.data) {
      employee.run();
      history.run();
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAction.data]);

  function validateUpdateSalaryForm(): boolean {
    const errors: UpdateSalaryFieldErrors = {};
    const amountValue = Number(amount);
    if (!amount || Number.isNaN(amountValue) || amountValue <= 0) {
      errors.amount = "Enter an amount greater than 0.";
    }
    if (!CURRENCY_CODE_PATTERN.test(currency)) {
      errors.currency = "Enter a 3-letter currency code, e.g. USD.";
    }
    if (!effectiveDate) {
      errors.effectiveDate = "Select an effective date.";
    } else if (!ISO_DATE_PATTERN.test(effectiveDate) || Number.isNaN(Date.parse(effectiveDate))) {
      errors.effectiveDate = "Enter a valid date.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowSuccess(false);
    if (!validateUpdateSalaryForm()) return;
    updateAction.run();
  }

  const initialLoading = (employee.loading && !employee.data) || (history.loading && !history.data);

  return (
    <AppShell
      headerRight={
        <Link href="/employees" className="text-sm text-muted hover:text-foreground">
          ← Back to employees
        </Link>
      }
    >
      <div className="space-y-8">
        {employee.error && (
          <p role="alert" className="text-sm text-danger">
            {employee.error}
          </p>
        )}

        {initialLoading && (
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        )}

        {employee.data && (
          <>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{employee.data.fullName}</h1>
              <p className="mt-1 text-sm text-muted">{employee.data.employeeCode}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <h2 className="text-sm font-medium text-foreground">Profile</h2>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Department</dt>
                    <dd className="text-foreground">{employee.data.department}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Country</dt>
                    <dd className="text-foreground">{employee.data.country}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Currency</dt>
                    <dd className="text-foreground">{employee.data.currency}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-border bg-surface p-4">
                <h2 className="text-sm font-medium text-foreground">Current salary</h2>
                {employee.data.currentSalary ? (
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Amount</dt>
                      <dd className="text-foreground">
                        {formatMoney(Number(employee.data.currentSalary.amount), employee.data.currentSalary.currency)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Pay frequency</dt>
                      <dd className="text-foreground">{employee.data.currentSalary.payFrequency}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Effective</dt>
                      <dd className="text-foreground">
                        {employee.data.currentSalary.effectiveDate.slice(0, 10)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Reason</dt>
                      <dd className="text-foreground">{employee.data.currentSalary.reason}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-2 text-sm text-muted">No salary on record.</p>
                )}
              </div>
            </div>

            <section>
              <h2 className="text-lg font-medium text-foreground">Salary history</h2>
              {history.loading && !history.data && (
                <div className="mt-3 rounded-xl border border-border bg-surface p-4">
                  <table className="w-full text-sm">
                    <tbody>
                      <TableSkeletonRows rows={4} columns={4} />
                    </tbody>
                  </table>
                </div>
              )}
              {history.data && (
                <div className="mt-3 rounded-xl border border-border bg-surface p-4">
                  <div className={scrollClassIfLong(history.data.length)}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-surface text-left text-muted">
                          <th className="sticky top-0 bg-surface py-2 pr-4 font-medium">Effective date</th>
                          <th className="sticky top-0 bg-surface py-2 pr-4 font-medium">Amount</th>
                          <th className="sticky top-0 bg-surface py-2 pr-4 font-medium">Reason</th>
                          <th className="sticky top-0 bg-surface py-2 font-medium">Recorded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.data.map((record) => (
                          <tr key={record.id} className="border-b border-border/50 text-foreground">
                            <td className="py-2 pr-4">{record.effectiveDate.slice(0, 10)}</td>
                            <td className="py-2 pr-4">{formatMoney(Number(record.amount), record.currency)}</td>
                            <td className="py-2 pr-4">{record.reason}</td>
                            <td className="py-2">{record.createdAt.slice(0, 10)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground">Update salary</h2>
              <p className="mt-1 text-xs text-muted">
                Appends a new salary record — the existing history is never overwritten.
              </p>
              <form
                onSubmit={handleUpdateSubmit}
                noValidate
                className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6"
              >
                <div className="flex flex-col">
                  <label htmlFor="update-salary-amount" className="text-sm text-muted">
                    Amount
                  </label>
                  <input
                    id="update-salary-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <FieldError message={fieldErrors.amount} />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="update-salary-currency" className="text-sm text-muted">
                    Currency
                  </label>
                  <input
                    id="update-salary-currency"
                    type="text"
                    maxLength={3}
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                    placeholder={employee.data.currency}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground uppercase"
                  />
                  <FieldError message={fieldErrors.currency} />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="update-salary-pay-frequency" className="text-sm text-muted">
                    Pay frequency
                  </label>
                  <select
                    id="update-salary-pay-frequency"
                    value={payFrequency}
                    onChange={(event) => setPayFrequency(event.target.value as PayFrequency)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="ANNUAL">ANNUAL</option>
                    <option value="MONTHLY">MONTHLY</option>
                  </select>
                  <FieldError />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="update-salary-effective-date" className="text-sm text-muted">
                    Effective date
                  </label>
                  <input
                    id="update-salary-effective-date"
                    type="date"
                    value={effectiveDate}
                    onChange={(event) => setEffectiveDate(event.target.value)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                  <FieldError message={fieldErrors.effectiveDate} />
                </div>
                <div className="flex flex-col">
                  <label htmlFor="update-salary-reason" className="text-sm text-muted">
                    Reason
                  </label>
                  <select
                    id="update-salary-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value as Exclude<SalaryChangeReason, "HIRE">)}
                    className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {UPDATE_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <FieldError />
                </div>
                <div className="flex flex-col justify-start">
                  <span className="text-sm text-muted">&nbsp;</span>
                  <button
                    type="submit"
                    disabled={updateAction.loading}
                    className="mt-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                  >
                    {updateAction.loading ? "Saving…" : "Update salary"}
                  </button>
                </div>
              </form>
              {updateAction.error && (
                <p role="alert" className="mt-2 text-sm text-danger">
                  {updateAction.error}
                </p>
              )}
              {showSuccess && <p className="mt-2 text-sm text-foreground">Salary updated successfully.</p>}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
