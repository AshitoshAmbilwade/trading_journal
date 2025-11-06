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
  timeout: 10000,
});

// Request interceptor: attach auth header, and remove Content-Type for FormData
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    try {
      // Attach token if present
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token && config.headers) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }

      // If request data is FormData (browser) — delete content-type so axios sets boundary
      if (config && config.data) {
        // In browser: FormData instanceof global FormData
        const isFormData =
          typeof FormData !== "undefined" && config.data instanceof FormData;

        // Also handle cases where some libraries wrap FormData or server-side – basic duck-check:
        const looksLikeFormData =
          !isFormData &&
          config.data &&
          typeof config.data === "object" &&
          typeof (config.data as any).get === "function" &&
          typeof (config.data as any).append === "function";

        if (isFormData || looksLikeFormData) {
          if (config.headers) {
            // remove any Content-Type to let browser/axios set multipart/form-data with boundary
            delete (config.headers as any)["Content-Type"];
            delete (config.headers as any)["content-type"];
          }
        } else {
          // For non-FormData payloads, ensure JSON content-type unless user set explicit header
          if (config.headers && !(config.headers as any)["Content-Type"] && !(config.headers as any)["content-type"]) {
            (config.headers as any)["Content-Type"] = "application/json";
          }
        }
      } else {
        // No data -> keep default headers minimal (but ensure auth remains)
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

// Response interceptor: return response (we let fetchApi pick response.data)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // prefer useful message during dev
    console.error("API Error:", error?.response?.data || error.message || error);
    return Promise.reject(error?.response?.data || error);
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
