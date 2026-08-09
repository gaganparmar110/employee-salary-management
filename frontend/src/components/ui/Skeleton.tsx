interface SkeletonProps {
  className?: string;
  "data-testid"?: string;
}

// One primitive — a pulsing placeholder block. Composed directly where
// needed (table rows, cards) rather than a proliferation of specialized
// skeleton components.
export function Skeleton({ className, "data-testid": testId }: SkeletonProps) {
  return <div data-testid={testId} className={`animate-pulse rounded bg-border/60 ${className ?? ""}`} />;
}

interface TableSkeletonRowsProps {
  rows?: number;
  columns?: number;
}

export function TableSkeletonRows({ rows = 5, columns = 5 }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-border/50">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="py-2 pr-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
