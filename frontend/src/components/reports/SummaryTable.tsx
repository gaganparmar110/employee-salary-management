import { formatMoney } from "../../lib/format";
import { scrollClassIfLong } from "../../lib/scroll";
import type { GroupSalarySummary } from "../../lib/reportsApi";

interface SummaryTableProps {
  groupLabel: string;
  rows: GroupSalarySummary[];
}

// Shared by the by-department and by-country reports — both return the
// same GroupSalarySummary shape, just grouped on a different field.
export function SummaryTable({ groupLabel, rows }: SummaryTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No data yet.</p>;
  }

  return (
    <div data-testid="summary-table-scroll" className={scrollClassIfLong(rows.length)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-muted">
            <th className="sticky top-0 bg-surface py-2 pr-4 font-medium">{groupLabel}</th>
            <th className="sticky top-0 bg-surface py-2 pr-4 font-medium">Currency</th>
            <th className="sticky top-0 bg-surface py-2 pr-4 font-medium">Headcount</th>
            <th className="sticky top-0 bg-surface py-2 pr-4 font-medium">Total cost</th>
            <th className="sticky top-0 bg-surface py-2 pr-4 font-medium">Average</th>
            <th className="sticky top-0 bg-surface py-2 font-medium">Median</th>
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
