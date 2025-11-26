// src/utils/apiHandler.ts
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

/**
 * Minimal local typings for the shapes we use.
 * We avoid importing axios exported types to prevent mismatch with different axios install/type versions.
 */
type SimpleRequestConfig = {
  url?: string;
  method?: string;
  data?: unknown;
  headers?: Record<string, string | undefined>;
  params?: Record<string, unknown>;
  timeout?: number;
  [key: string]: unknown;
};

type SimpleResponse<T = unknown> = {
  data: T;
  status: number;
  statusText?: string;
  headers?: Record<string, string>;
  config?: SimpleRequestConfig;
};

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 250000,
});

// helper to detect "looks like FormData"
function looksLikeFormData(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { get?: unknown }).get === "function" &&
    typeof (data as { append?: unknown }).append === "function"
  );
}

/**
 * Request interceptor
 * Note: we do NOT annotate the `config` parameter with a custom type here.
 * Letting TS infer the parameter type avoids overload mismatches with axios.
 */
apiClient.interceptors.request.use(
  (config) => {
    try {
      // Attach token if present
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (token && config.headers) {
        const headers = config.headers as Record<string, string | undefined>;
        headers.Authorization = `Bearer ${token}`;
      }

      // If request data is FormData (browser) — delete content-type so axios sets boundary
      if (config && (config as any).data) {
        const data = (config as any).data;
        const isFormData =
          typeof FormData !== "undefined" && data instanceof FormData;
        const duckFormData = looksLikeFormData(data);

        if (isFormData || duckFormData) {
          if (config.headers) {
            const headers = config.headers as Record<string, string | undefined>;
            delete headers["Content-Type"];
            delete headers["content-type"];
          }
        } else {
          // For non-FormData payloads, ensure JSON content-type unless user set explicit header
          if (config.headers) {
            const headers = config.headers as Record<string, string | undefined>;
            if (!headers["Content-Type"] && !headers["content-type"]) {
              headers["Content-Type"] = "application/json";
            }
          }
        }
      }

      return config;
    } catch (err) {
      // don't block request on interceptor error
      // eslint-disable-next-line no-console
      console.warn("Request interceptor error:", err);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Again: no explicit type annotation on the param to avoid overload mismatches.
 * We normalize errors safely using `unknown` casts.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const maybeErr = error as { response?: { status?: number; data?: unknown }; message?: string };
    const status = maybeErr.response?.status;
    const data = maybeErr.response?.data;

    if (status === 401) {
      return Promise.reject({ unauthorized: true, status: 401, data: data ?? null });
    }

    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("API Error:", data ?? maybeErr.message ?? error);
    } else {
      // eslint-disable-next-line no-console
      console.error("API Error:", (maybeErr.message as string) ?? "see server logs");
    }

    return Promise.reject(data ?? error);
  }
);

/**
 * fetchApi helper
 * We accept an axios-like config and return response.data.
 * We cast the config at the call site to `any` because axios.request expects its internal shapes;
 * this cast is limited in scope and avoids broader typing problems.
 */
export const fetchApi = async <T = unknown>(config: SimpleRequestConfig): Promise<T> => {
  const response = await apiClient.request(config as any);
  return (response as SimpleResponse<T>).data as T;
};

export default apiClient;
