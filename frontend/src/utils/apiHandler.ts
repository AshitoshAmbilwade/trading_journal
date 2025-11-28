// src/utils/apiHandler.ts
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "http://localhost:5000/api"; 
/**
 * 
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
 * Note: we create a local typed view `cfg` to avoid using `any` and avoid axios type coupling.
 */
apiClient.interceptors.request.use(
  (config) => {
    // interpret the axios config as our simpler local shape for safe access
    const cfg = config as SimpleRequestConfig;
    try {
      // Attach token if present
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (token && cfg.headers) {
        const headers = cfg.headers as Record<string, string | undefined>;
        headers.Authorization = `Bearer ${token}`;
      }

      // If request data is FormData (browser) — delete content-type so axios sets boundary
      if (cfg && cfg.data) {
        const data = cfg.data;
        const isFormData =
          typeof FormData !== "undefined" && data instanceof FormData;
        const duckFormData = looksLikeFormData(data);

        if (isFormData || duckFormData) {
          if (cfg.headers) {
            const headers = cfg.headers as Record<string, string | undefined>;
            delete headers["Content-Type"];
            delete headers["content-type"];
          }
        } else {
          // For non-FormData payloads, ensure JSON content-type unless user set explicit header
          if (cfg.headers) {
            const headers = cfg.headers as Record<string, string | undefined>;
            if (!headers["Content-Type"] && !headers["content-type"]) {
              headers["Content-Type"] = "application/json";
            }
          }
        }
      }

      return config;
    } catch (err) {
      // don't block request on interceptor error
      console.warn("Request interceptor error:", err);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Normalize errors safely using `unknown` casts.
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
      console.error("API Error:", data ?? maybeErr.message ?? error);
    } else {
      console.error("API Error:", (maybeErr.message as string) ?? "see server logs");
    }

    return Promise.reject(data ?? error);
  }
);

/**
 * fetchApi helper
 * We accept a simple config and return response.data.
 * Use a single-line ts-ignore to avoid axios overload type mismatch.
 */
export const fetchApi = async <T = unknown>(config: SimpleRequestConfig): Promise<T> => {
  // Axios' typedefs are sometimes stricter than our local SimpleRequestConfig.
  // Using ts-ignore here keeps the cast localized and prevents spreading `any` or broad type hacks.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const response = await apiClient.request(config);
  return (response as SimpleResponse<T>).data as T;
};

export default apiClient;
