import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAsyncData } from "../lib/useAsyncData";
import { ApiRequestError } from "../lib/apiClient";

describe("useAsyncData", () => {
  it("starts with no data and not loading", () => {
    const { result } = renderHook(() => useAsyncData(() => Promise.resolve(["x"])));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets data after run() resolves", async () => {
    const { result } = renderHook(() => useAsyncData(() => Promise.resolve(["a", "b"])));

    act(() => {
      result.current.run();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["a", "b"]);
    expect(result.current.error).toBeNull();
  });

  it("sets the ApiRequestError message on failure", async () => {
    const { result } = renderHook(() =>
      useAsyncData(() => Promise.reject(new ApiRequestError("Not found", 404))),
    );

    act(() => {
      result.current.run();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Not found");
    expect(result.current.data).toBeNull();
  });

  it("falls back to a generic message for a non-ApiRequestError failure", async () => {
    const { result } = renderHook(() => useAsyncData(() => Promise.reject(new Error("boom"))));

    act(() => {
      result.current.run();
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to load.");
  });
});
