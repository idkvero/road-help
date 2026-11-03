import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const login = (email, password) =>
  api.post("/auth/login", { email, password });

export const register = (email, password) =>
  api.post("/auth/register", { email, password });

export const fetchRequests = (search = "") =>
  api.get("/requests", { params: search ? { search } : {} });

export const createRequest = (data) => api.post("/requests", data);

export const updateRequest = (id, data) => api.put(`/requests/${id}`, data);

export const deleteRequest = (id) => api.delete(`/requests/${id}`);
