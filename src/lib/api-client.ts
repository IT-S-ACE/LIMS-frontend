const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";
const TOKEN_KEY = "lims-auth-token";

export interface ApiEnvelope<T = unknown> {
  code: string;
  message: string;
  server_time: string;
  payload: T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>,
    status?: number,
  ) {
    super(message, "E002", status);
    this.name = "ValidationError";
  }
}

export function getToken(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

function handleUnauthorized(): void {
  clearToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lims:unauthorized"));
  }
}

function handleForbidden(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("lims:forbidden"));
  }
}

function requestId(): string | undefined {
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") return undefined;
  return crypto.randomUUID();
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${API_URL}${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string | number | undefined> } = {},
): Promise<T> {
  const { params, headers, ...requestOptions } = options;
  const token = getToken();
  const traceId = requestId();
  const response = await fetch(buildUrl(path, params), {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(requestOptions.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(traceId ? { "X-Request-ID": traceId } : {}),
      ...headers,
    },
  });

  let body: Partial<ApiEnvelope<T>> & {
    errors?: Record<string, string[]>;
    payload?: T & { errors?: Record<string, string[]> };
  };

  try {
    body = await response.json();
  } catch {
    throw new ApiError("The server returned an invalid response.", undefined, response.status);
  }

  if (response.status === 401) handleUnauthorized();
  if (response.status === 403) handleForbidden();

  const validationErrors =
    body.code === "E002"
      ? (body.payload as { errors?: Record<string, string[]> } | undefined)?.errors
      : body.errors;

  if (validationErrors) {
    throw new ValidationError(
      body.message ?? "Validation failed.",
      validationErrors,
      response.status,
    );
  }

  if (!response.ok || (body.code && !body.code.startsWith("S"))) {
    throw new ApiError(
      body.message ?? "The request could not be completed.",
      body.code,
      response.status,
    );
  }

  return body.payload as T;
}

export async function downloadFromApi(path: string, filename: string): Promise<void> {
  const token = getToken();
  const response = await fetch(buildUrl(path), {
    headers: {
      Accept: "text/csv",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (response.status === 401) handleUnauthorized();
  if (!response.ok) throw new ApiError("Export failed.", undefined, response.status);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
