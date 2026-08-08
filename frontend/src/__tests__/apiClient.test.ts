import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiRequestError } from "../lib/apiClient";

function mockFetchOnce(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => body,
    }),
  );
}

describe("apiRequest", () => {
  beforeEach(() => {
    mockFetchOnce({ success: true, statusCode: 200, message: "ok", data: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the given path", async () => {
    await apiRequest("/api/v1/health");
    const [url] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("/api/v1/health");
  });

  it("defaults to a GET request with no body", async () => {
    await apiRequest("/api/v1/health");
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
  });

  it("appends query params, skipping undefined values", async () => {
    await apiRequest("/api/v1/employees", {
      params: { department: "Engineering", country: undefined, page: 2 },
    });
    const [url] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain("department=Engineering");
    expect(url).toContain("page=2");
    expect(url).not.toContain("country");
  });

  it("attaches an Authorization header only when a token is given", async () => {
    await apiRequest("/api/v1/employees", { token: "abc123" });
    const [, withToken] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(withToken.headers.Authorization).toBe("Bearer abc123");

    await apiRequest("/api/v1/health");
    const [, withoutToken] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(withoutToken.headers.Authorization).toBeUndefined();
  });

  it("sends the body as JSON for a POST request", async () => {
    await apiRequest("/api/v1/employees", { method: "POST", body: { fullName: "Ada" } });
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ fullName: "Ada" });
  });

  it("returns the unwrapped data on success", async () => {
    mockFetchOnce({ success: true, statusCode: 200, message: "ok", data: { id: "1" } });
    const result = await apiRequest("/api/v1/employees/1");
    expect(result).toEqual({ id: "1" });
  });

  it("throws ApiRequestError with message/statusCode/details on failure", async () => {
    mockFetchOnce({ success: false, statusCode: 404, message: "Not found", details: { foo: "bar" } });
    await expect(apiRequest("/api/v1/employees/999")).rejects.toMatchObject({
      message: "Not found",
      statusCode: 404,
      details: { foo: "bar" },
    });
    await expect(apiRequest("/api/v1/employees/999")).rejects.toBeInstanceOf(ApiRequestError);
  });
});
