// The frontend-side mirror of the backend's response envelope
// (backend/src/lib/apiResponse.ts + middleware/error.middleware.ts):
// { success: true, statusCode, message, data } on success,
// { success: false, statusCode, message, details? } on failure.

export class ApiRequestError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  details?: unknown;
}

export interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  params?: Record<string, string | number | undefined>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function buildUrl(path: string, params?: ApiRequestOptions["params"]): string {
  const query = params
    ? Object.entries(params)
        .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join("&")
    : "";

  const base = `${API_BASE_URL}${path}`;
  return query ? `${base}?${query}` : base;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!envelope.success) {
    throw new ApiRequestError(envelope.message, envelope.statusCode, envelope.details);
  }

  return envelope.data as T;
}
