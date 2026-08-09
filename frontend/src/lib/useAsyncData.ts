import { useState } from "react";
import { ApiRequestError } from "./apiClient";

// The same fetch/loading/error pattern repeats across every click-to-fetch
// report section — this is the one place it's written.
export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  return { data, loading, error, run };
}
