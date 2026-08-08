import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { deleteCookie, getCookie, setCookie } from "../lib/cookies";
import { AUTH_COOKIE_NAME } from "../lib/authCookie";

export interface HrManagerSummary {
  id: string;
  email: string;
}

interface AuthState {
  token: string | null;
  hrManager: HrManagerSummary | null;
  login: (token: string, hrManager: HrManagerSummary) => void;
  logout: () => void;
}

// Matches the backend JWT's own 8h expiry (backend/src/lib/jwt.ts) — the
// cookie shouldn't outlive the token it holds by much.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

// A cookie (not localStorage) so middleware.ts — which runs server-side,
// before any page renders — can read auth state too. See lib/cookies.ts.
const cookieStorage: StateStorage = {
  getItem: (name) => getCookie(name),
  setItem: (name, value) => setCookie(name, value, COOKIE_MAX_AGE_SECONDS),
  removeItem: (name) => deleteCookie(name),
};

// The one piece of cross-page client state in this app — which HR manager
// is logged in, persisted so a page refresh doesn't sign them out.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      hrManager: null,
      login: (token, hrManager) => set({ token, hrManager }),
      logout: () => set({ token: null, hrManager: null }),
    }),
    { name: AUTH_COOKIE_NAME, storage: createJSONStorage(() => cookieStorage) },
  ),
);
