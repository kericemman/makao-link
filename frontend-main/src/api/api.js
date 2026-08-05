import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:5000/api" : "https://updates.rendahomes.com/api")
});

export default api;
