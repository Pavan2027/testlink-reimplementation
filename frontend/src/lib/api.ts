import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,  // sends httpOnly cookie automatically
  headers: { "Content-Type": "application/json" },
});

// Redirect to login on 401 (expired token)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/register") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Typed API helpers
export const authApi = {
  register: (data: any) => api.post("/auth/register", data),
  login: (data: any) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  changePassword: (data: any) => api.post("/auth/change-password", data),
};

export const usersApi = {
  list: () => api.get("/users/"),
  create: (data: any) => api.post("/users/", data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  deactivate: (id: string) => api.delete(`/users/${id}`),
};

export const projectsApi = {
  list: () => api.get("/projects/"),
  create: (data: any) => api.post("/projects/", data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const testPlansApi = {
  list: (projectId?: string) => api.get("/test-plans/", { params: { project_id: projectId } }),
  create: (data: any) => api.post("/test-plans/", data),
  update: (id: string, data: any) => api.patch(`/test-plans/${id}`, data),
};

export const testCasesApi = {
  list: (params?: any) => api.get("/test-cases/", { params }),
  create: (data: any) => api.post("/test-cases/", data),
  update: (id: string, data: any) => api.patch(`/test-cases/${id}`, data),
  delete: (id: string) => api.delete(`/test-cases/${id}`),
  aiGenerate: (data: any) => api.post("/test-cases/ai-generate", data),
};

export const executionsApi = {
  list: (testCaseId?: string) => api.get("/executions/", { params: { test_case_id: testCaseId } }),
  record: (data: any) => api.post("/executions/", data),
};

export const defectsApi = {
  list: (params?: any) => api.get("/defects/", { params }),
  create: (data: any) => api.post("/defects/", data),
  update: (id: string, data: any) => api.patch(`/defects/${id}`, data),
  aiAnalyze: (id: string) => api.post(`/defects/${id}/ai-analyze`),
};

export const reportsApi = {
  summary: (projectId?: string) => api.get("/reports/summary", { params: { project_id: projectId } }),
  aiInsights: (projectId?: string) => api.post("/reports/ai-insights", null, { params: { project_id: projectId } }),
};

export const chatApi = {
  query: (question: string) => api.post("/chat/query", null, { params: { question } }),
};