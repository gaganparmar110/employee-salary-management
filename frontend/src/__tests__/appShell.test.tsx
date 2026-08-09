import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "../components/layout/AppShell";

describe("AppShell", () => {
  it("renders the app name, header-right content, and children", () => {
    render(
      <AppShell headerRight={<span>Header extra</span>}>
        <p>Page content</p>
      </AppShell>,
    );

    expect(screen.getByText("Employee Salary Management")).toBeInTheDocument();
    expect(screen.getByText("Header extra")).toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("keeps the header outside the scrollable content region", () => {
    render(<AppShell>Content</AppShell>);
    const header = screen.getByRole("banner");
    const main = screen.getByRole("main");
    expect(header).toHaveClass("shrink-0");
    expect(main).toHaveClass("overflow-y-auto");
  });
});
