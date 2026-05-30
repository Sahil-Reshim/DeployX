import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000",

  headers: {
    "Content-Type":
      "application/json",
  },

  timeout: 30000,
});

export default API;