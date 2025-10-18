import { fetchApi } from "../utils/apiHandler";

interface SignupData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  register: (data: SignupData) =>
    fetchApi({ url: "/auth/register", method: "POST", data }),

  login: (data: LoginData) =>
    fetchApi({ url: "/auth/login", method: "POST", data }),

  getMe: () =>
    fetchApi({ url: "/auth/me", method: "GET" }),
};
