import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 30000,
});

export default API;
