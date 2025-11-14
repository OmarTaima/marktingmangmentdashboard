import axios from "axios";

// Helper to get cookie value
const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
};

// Create axios instance with base configuration
const axiosInstance = axios.create({
    baseURL: "https://marketing-planner-tau.vercel.app/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 seconds timeout for auth requests
});

// Request interceptor (for adding auth tokens)
axiosInstance.interceptors.request.use(
    (config) => {
        // Only add token for non-auth endpoints
        const isAuthEndpoint = config.url?.includes("/auth/login") || config.url?.includes("/auth/register");

        if (!isAuthEndpoint) {
            // Get token from cookie
            const token = getCookie("accessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${decodeURIComponent(token)}`;
            }
        }

        // Ensure headers are always set
        if (!config.headers["Content-Type"]) {
            config.headers["Content-Type"] = "application/json";
        }

        // Remove any undefined or null headers
        Object.keys(config.headers).forEach((key) => {
            if (config.headers[key] === undefined || config.headers[key] === null) {
                delete config.headers[key];
            }
        });

        // Log request details for debugging
        console.log("📤 Request:", {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            data: config.data,
            headers: config.headers,
        });

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor (for handling errors globally)
axiosInstance.interceptors.response.use(
    (response) => {
        console.log("📥 Response:", {
            status: response.status,
            url: response.config.url,
            data: response.data,
        });
        return response;
    },
    (error) => {
        // Handle common errors
        if (error.response) {
            // Server responded with error status
            console.error("❌ API Error:", {
                status: error.response.status,
                url: error.config?.url,
                data: error.response.data,
                headers: error.response.headers,
            });
        } else if (error.request) {
            // Request made but no response
            console.error("❌ Network Error:", error.message);
        } else {
            // Something else happened
            console.error("❌ Error:", error.message);
        }
        return Promise.reject(error);
    },
);

export default axiosInstance;
