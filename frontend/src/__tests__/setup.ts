import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Without `test.globals: true` in vitest.config, RTL can't auto-detect a
// global afterEach to unmount between tests — do it explicitly so each
// test starts from an empty DOM.
afterEach(() => {
  cleanup();
});
