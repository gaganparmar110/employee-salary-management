// The cookie name the auth store persists to (store/authStore.ts) and
// middleware.ts reads for route protection. Kept in its own dependency-free
// file — middleware runs in the Edge runtime and can't import anything
// that touches `document` (see lib/cookies.ts), so this constant can't
// live alongside the store or the cookie helpers themselves.
export const AUTH_COOKIE_NAME = "esm-auth";
