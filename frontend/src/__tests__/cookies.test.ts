import { afterEach, describe, expect, it } from "vitest";
import { deleteCookie, getCookie, setCookie } from "../lib/cookies";

describe("cookies", () => {
  afterEach(() => {
    deleteCookie("test-cookie");
  });

  it("returns null when the cookie isn't set", () => {
    expect(getCookie("nonexistent")).toBeNull();
  });

  it("sets and reads back a cookie value", () => {
    setCookie("test-cookie", "hello world", 3600);
    expect(getCookie("test-cookie")).toBe("hello world");
  });

  it("round-trips values containing special characters (e.g. JSON)", () => {
    const value = JSON.stringify({ token: "abc", nested: { a: 1 }, note: "a;b=c" });
    setCookie("test-cookie", value, 3600);
    expect(getCookie("test-cookie")).toBe(value);
  });

  it("deleteCookie clears the value", () => {
    setCookie("test-cookie", "hello", 3600);
    deleteCookie("test-cookie");
    expect(getCookie("test-cookie")).toBeNull();
  });
});
