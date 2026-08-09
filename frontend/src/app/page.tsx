// middleware.ts always redirects "/" to /login or /dashboard based on auth
// state before this ever renders — this is just a static fallback in case
// that somehow doesn't fire, so no client-side logic (or test) is needed.
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted">Redirecting…</p>
    </main>
  );
}
