import axios from "axios";

// Central axios instance. Attaches the JWT (if present) to every request.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Uploads an image file and returns its public URL.
export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);
  const res = await api.post("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.url;
}

// Normalize backend error messages for display.
export function apiError(err) {
  return (
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong. Please try again."
  );
}
