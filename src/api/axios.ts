import axios from "axios";

// Create axios instance with base configuration
const axiosInstance = axios.create({
    baseURL: "https://marketing-planner-tau.vercel.app/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000, // 10 seconds timeout
});

// Request interceptor (for adding auth tokens in the future)
axiosInstance.interceptors.request.use(
    (config) => {
        // You can add auth token here if needed
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor (for handling errors globally)
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common errors
        if (error.response) {
            // Server responded with error status
            console.error("API Error:", error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error("Network Error:", error.message);
        } else {
            // Something else happened
            console.error("Error:", error.message);
        }
        return Promise.reject(error);
    },
);

export default axiosInstance;
