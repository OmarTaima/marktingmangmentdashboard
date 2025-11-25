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
    timeout: 10000, // 10 seconds timeout - faster failure detection
    // Performance optimizations
    maxRedirects: 5,
    decompress: true,
    // Reuse TCP connections
    httpAgent: undefined,
    httpsAgent: undefined,
});

// Request interceptor (for adding auth tokens)
axiosInstance.interceptors.request.use(
    (config) => {
        // Endpoints that don't need authentication
        const publicEndpoints = ["/auth/login", "/auth/register"];
        const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));

        if (!isPublicEndpoint) {
            // Get token from cookie for all protected endpoints
            const token = getCookie("accessToken");
            if (token) {
                config.headers.Authorization = `Bearer ${decodeURIComponent(token)}`;
            } else {
                // Warn about missing token for protected endpoints
                if (!config.url?.includes("/auth/refresh")) {
                    console.warn("⚠️ No access token found for protected endpoint:", config.url);
                }
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

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Track if we're currently refreshing to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any = null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response interceptor (for handling errors globally)
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Handle common errors
        if (error.response) {
            // Only log in development
            if (process.env.NODE_ENV === "development") {
                console.error("❌ API Error:", error.response.status, error.config?.url);
            }

            // Handle backend populate errors (e.g., "Cannot populate path `quotations.services`")
            // This happens when the backend tries to populate a removed field
            if (error.response.status === 500 && !originalRequest._retryWithoutPopulate) {
                const errorMessage = error.response.data?.error?.message || error.response.data?.message || "";
                if (typeof errorMessage === "string" && errorMessage.toLowerCase().includes("populate")) {
                    console.warn("⚠️ Backend populate error detected, retrying without populate params:", errorMessage);
                    originalRequest._retryWithoutPopulate = true;

                    // Remove populate from query params
                    if (originalRequest.params) {
                        const { populate, ...restParams } = originalRequest.params;
                        originalRequest.params = restParams;
                    }

                    return axiosInstance(originalRequest);
                }
            }

            // Handle 401 authentication errors
            if (error.response.status === 401 && !originalRequest._retry) {
                const errorCode = error.response.data?.error?.code;

                // If token is expired and we haven't tried refreshing yet
                if (errorCode === "TOKEN_EXPIRED" || errorCode === "AUTHENTICATION_FAILED") {
                    if (isRefreshing) {
                        // If already refreshing, queue this request
                        return new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        })
                            .then((token) => {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                                return axiosInstance(originalRequest);
                            })
                            .catch((err) => {
                                return Promise.reject(err);
                            });
                    }

                    originalRequest._retry = true;
                    isRefreshing = true;

                    const refreshToken = getCookie("refreshToken");

                    if (refreshToken) {
                        try {
                            const response = await axiosInstance.post("/auth/refresh", {
                                refreshToken: decodeURIComponent(refreshToken),
                            });

                            const { accessToken, refreshToken: newRefreshToken } = response.data;

                            // Update cookies with new tokens
                            const setCookie = (name: string, value: string, days: number) => {
                                const maxAge = days * 24 * 60 * 60;
                                document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
                            };
                            setCookie("accessToken", accessToken, 1);
                            setCookie("refreshToken", newRefreshToken, 7);

                            // Update authorization header
                            axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
                            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                            processQueue(null, accessToken);

                            return axiosInstance(originalRequest);
                        } catch (refreshError) {
                            console.error("❌ Token refresh failed:", refreshError);
                            processQueue(refreshError, null);

                            // Clear invalid cookies and redirect to login
                            document.cookie = "accessToken=; Path=/; Max-Age=0";
                            document.cookie = "refreshToken=; Path=/; Max-Age=0";

                            if (!window.location.pathname.includes("/auth/login")) {
                                console.warn("⚠️ Redirecting to login page");
                                window.location.href = "/auth/login";
                            }

                            return Promise.reject(refreshError);
                        } finally {
                            isRefreshing = false;
                        }
                    } else {
                        // No refresh token available, clear auth and redirect
                        console.warn("⚠️ No refresh token found - redirecting to login");
                        document.cookie = "accessToken=; Path=/; Max-Age=0";
                        document.cookie = "refreshToken=; Path=/; Max-Age=0";

                        if (!window.location.pathname.includes("/auth/login")) {
                            window.location.href = "/auth/login";
                        }
                    }
                }
            }
        } else if (error.request && process.env.NODE_ENV === "development") {
            // Ignore and do not log canceled/aborted requests to reduce console noise
            // Axios emits a CanceledError with code 'ERR_CANCELED' and message 'canceled'
            if (error.code === "ERR_CANCELED" || error?.name === "CanceledError" || error?.message === "canceled") {
                // silently ignore
            } else {
                console.error("❌ Network Error:", error.message);
            }
        }
        return Promise.reject(error);
    },
);

export default axiosInstance;
