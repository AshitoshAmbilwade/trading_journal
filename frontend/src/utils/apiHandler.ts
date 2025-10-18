import axios from "axios";
// Some axios versions don't export AxiosRequestConfig/AxiosResponse as named exports for TS;
// use local fallback aliases to avoid the "no exported member" compile error.
type AxiosRequestConfig = any;
type AxiosResponse<T = any> = any;

const API_BASE = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response, // return full response to satisfy TS
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

// Helper to extract data
export const fetchApi = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<T>(config);
  return response.data;
};

export default apiClient;
