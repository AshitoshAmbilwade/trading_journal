// src/utils/apiHandler.ts
import axios from "axios";
// Types fallback for older axios + TS setups
type AxiosRequestConfig = any;
type AxiosResponse<T = any> = any;

const API_BASE = "http://localhost:5000/api";

/**
 * IMPORTANT:
 * - Do NOT set a global Content-Type of application/json here.
 * - Let axios/browser set Content-Type automatically for FormData.
 */
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 90000
});

// helper to detect "looks like FormData"
function looksLikeFormData(data: any) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.get === "function" &&
    typeof data.append === "function"
  );
}

// Request interceptor: attach auth header, and remove Content-Type for FormData
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    try {
      // Attach token if present
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token && config.headers) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }

      // If request data is FormData (browser) — delete content-type so axios sets boundary
      if (config && config.data) {
        const isFormData =
          typeof FormData !== "undefined" && config.data instanceof FormData;
        const duckFormData = looksLikeFormData(config.data);

        if (isFormData || duckFormData) {
          if (config.headers) {
            delete (config.headers as any)["Content-Type"];
            delete (config.headers as any)["content-type"];
          }
        } else {
          // For non-FormData payloads, ensure JSON content-type unless user set explicit header
          if (
            config.headers &&
            !(config.headers as any)["Content-Type"] &&
            !(config.headers as any)["content-type"]
          ) {
            (config.headers as any)["Content-Type"] = "application/json";
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

// Response interceptor: return response (we let fetchApi pick response.data)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    // Normalize axios error object safely
    const status = error?.response?.status;
    const data = error?.response?.data;

    // If 401 -> mark unauthorized so callers can handle without console spam
    if (status === 401) {
      // return a small structured object so callers can check err?.unauthorized
      return Promise.reject({ unauthorized: true, status: 401, data: data || null });
    }

    // In development log more details, in prod minimize leak
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("API Error:", data ?? error?.message ?? error);
    } else {
      // eslint-disable-next-line no-console
      console.error("API Error:", error?.message ?? "see server logs");
    }

    return Promise.reject(data || error);
  }
);

/**
 * Helper to call API and return response.data
 * Accepts full axios config (url, method, data, headers, params, etc.)
 */
export const fetchApi = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<T>(config);
  return response.data;
};

export default apiClient;
