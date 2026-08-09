import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Skeleton, TableSkeletonRows } from "../components/ui/Skeleton";

describe("Skeleton", () => {
  it("renders a pulsing placeholder block", () => {
    render(<Skeleton data-testid="sk" className="h-4 w-20" />);
    const el = screen.getByTestId("sk");
    expect(el).toHaveClass("animate-pulse");
    expect(el).toHaveClass("h-4");
    expect(el).toHaveClass("w-20");
  });
});

describe("TableSkeletonRows", () => {
  it("renders the requested number of skeleton rows and columns", () => {
    render(
      <table>
        <tbody>
          <TableSkeletonRows rows={3} columns={4} />
        </tbody>
      </table>,
    );
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getAllByRole("cell")).toHaveLength(12);
  });
});
