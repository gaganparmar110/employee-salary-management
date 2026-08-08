import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../proxy";
import { AUTH_COOKIE_NAME } from "../lib/authCookie";

function makeRequest(path: string, storeState?: { token: string | null }): NextRequest {
  const headers: Record<string, string> = {};
  if (storeState) {
    const cookieValue = JSON.stringify({ state: storeState, version: 0 });
    headers.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(cookieValue)}`;
  }
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy", () => {
  it("redirects an unauthenticated visitor away from a protected path to /login", () => {
    const res = proxy(makeRequest("/dashboard"));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("lets an unauthenticated visitor reach /login", () => {
    const res = proxy(makeRequest("/login"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("lets an authenticated visitor reach a protected path", () => {
    const res = proxy(makeRequest("/dashboard", { token: "tok-1" }));
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects an authenticated visitor away from /login to /dashboard", () => {
    const res = proxy(makeRequest("/login", { token: "tok-1" }));
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("treats a present-but-empty persisted cookie (never logged in) as unauthenticated", () => {
    const res = proxy(makeRequest("/dashboard", { token: null }));
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("routes / to /login when logged out and /dashboard when logged in", () => {
    expect(proxy(makeRequest("/")).headers.get("location")).toBe("http://localhost:3000/login");
    expect(proxy(makeRequest("/", { token: "tok-1" })).headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );
  });

  it("treats a malformed cookie value as unauthenticated instead of throwing", () => {
    const req = new NextRequest(new URL("/dashboard", "http://localhost:3000"), {
      headers: { cookie: `${AUTH_COOKIE_NAME}=not-json` },
    });
    expect(() => proxy(req)).not.toThrow();
    expect(proxy(req).headers.get("location")).toBe("http://localhost:3000/login");
  });
});
