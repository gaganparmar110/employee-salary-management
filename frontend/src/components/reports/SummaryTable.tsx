import { formatMoney } from "../../lib/format";
import type { GroupSalarySummary } from "../../lib/reportsApi";

interface SummaryTableProps {
  groupLabel: string;
  rows: GroupSalarySummary[];
}

const SCROLL_THRESHOLD = 10;

// Shared by the by-department and by-country reports — both return the
// same GroupSalarySummary shape, just grouped on a different field.
export function SummaryTable({ groupLabel, rows }: SummaryTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No data yet.</p>;
  }

  const scrollable = rows.length > SCROLL_THRESHOLD;

  return (
    <div
      data-testid="summary-table-scroll"
      className={scrollable ? "max-h-96 overflow-y-auto" : undefined}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="py-2 pr-4 font-medium">{groupLabel}</th>
            <th className="py-2 pr-4 font-medium">Currency</th>
            <th className="py-2 pr-4 font-medium">Headcount</th>
            <th className="py-2 pr-4 font-medium">Total cost</th>
            <th className="py-2 pr-4 font-medium">Average</th>
            <th className="py-2 font-medium">Median</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.group}-${row.currency}`} className="border-b border-border/50 text-foreground">
              <td className="py-2 pr-4">{row.group}</td>
              <td className="py-2 pr-4">{row.currency}</td>
              <td className="py-2 pr-4">{row.headcount}</td>
              <td className="py-2 pr-4">{formatMoney(row.totalCost, row.currency)}</td>
              <td className="py-2 pr-4">{formatMoney(row.averageSalary, row.currency)}</td>
              <td className="py-2">{formatMoney(row.medianSalary, row.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
