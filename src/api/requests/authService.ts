import axiosInstance from "../axios";

/**
 * Auth API Service
 * Handles all authentication-related API calls
 */

const AUTH_ENDPOINT = "/auth";

export type LoginPayload = {
    email: string;
    password: string;
};

export type RegisterPayload = {
    email: string;
    password: string;
    fullName?: string;
    role?: "admin" | "manager" | "employee";
};

export type AuthResponse = {
    user: {
        id: string;
        email: string;
        fullName?: string;
        role: string;
    };
    accessToken: string;
    refreshToken: string;
};

/**
 * Helper to set auth cookies
 */
export const setAuthCookies = (accessToken: string, refreshToken?: string) => {
    const setCookie = (name: string, value: string, days: number) => {
        const maxAge = days * 24 * 60 * 60;
        document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    };
    setCookie("accessToken", accessToken, 1);
    if (refreshToken) setCookie("refreshToken", refreshToken, 7);
};

/**
 * Helper to clear auth cookies
 */
export const clearAuthCookies = () => {
    document.cookie = "accessToken=; Path=/; Max-Age=0";
    document.cookie = "refreshToken=; Path=/; Max-Age=0";
};

/**
 * Login user
 */
export const login = async (payload: LoginPayload): Promise<AuthResponse | null> => {
    try {
        const resp = await axiosInstance.post(`${AUTH_ENDPOINT}/login`, payload);
        const data = resp.data?.data || resp.data || {};
        return data as AuthResponse;
    } catch (error: any) {
        console.error("Login error:", error);

        // If 500 error, provide helpful message about backend
        if (error?.response?.status === 500) {
            const backendError = new Error(
                "Backend server error. Please check:\n1. Backend logs on Vercel\n2. Database connection\n3. Environment variables\n4. /auth/login endpoint code",
            );
            backendError.name = "BackendError";
            throw backendError;
        }

        throw error;
    }
};

/**
 * Register new user
 */
export const register = async (payload: RegisterPayload): Promise<AuthResponse | null> => {
    try {
        const resp = await axiosInstance.post(`${AUTH_ENDPOINT}/register`, payload);
        const data = resp.data?.data || resp.data || {};
        return data as AuthResponse;
    } catch (error) {
        console.error("Register error:", error);
        throw error;
    }
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> => {
    try {
        const resp = await axiosInstance.post(`${AUTH_ENDPOINT}/refresh`, { refreshToken });
        const data = resp.data?.data || resp.data || {};
        return data;
    } catch (error) {
        console.error("Refresh token error:", error);
        throw error;
    }
};

/**
 * Logout user
 */
export const logout = async (refreshToken?: string): Promise<void> => {
    try {
        await axiosInstance.post(`${AUTH_ENDPOINT}/logout`, { refreshToken });
        clearAuthCookies();
        localStorage.removeItem("user");
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<any> => {
    try {
        const resp = await axiosInstance.get(`${AUTH_ENDPOINT}/me`);
        const data = resp.data?.data || resp.data || {};
        return data.user || data;
    } catch (error) {
        console.error("Get current user error:", error);
        throw error;
    }
};

// Export all functions as default object
export default {
    login,
    register,
    refreshToken,
    logout,
    getCurrentUser,
    setAuthCookies,
    clearAuthCookies,
};
