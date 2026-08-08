import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "../store/authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, hrManager: null });
  });

  it("starts logged out", () => {
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().hrManager).toBeNull();
  });

  it("login sets the token and hrManager", () => {
    useAuthStore.getState().login("token-123", { id: "1", email: "hr@acme.test" });

    expect(useAuthStore.getState().token).toBe("token-123");
    expect(useAuthStore.getState().hrManager).toEqual({ id: "1", email: "hr@acme.test" });
  });

  it("logout clears the token and hrManager", () => {
    useAuthStore.getState().login("token-123", { id: "1", email: "hr@acme.test" });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().hrManager).toBeNull();
  });
});
