// Shared by every table/list that can grow past a page's worth of
// rows (SummaryTable, the reports page's inline tables, the employee
// list) — one threshold, one place, instead of each screen picking its
// own number.
export const SCROLL_ROW_THRESHOLD = 10;

export function scrollClassIfLong(rowCount: number): string | undefined {
  return rowCount > SCROLL_ROW_THRESHOLD ? "max-h-96 overflow-y-auto" : undefined;
}
