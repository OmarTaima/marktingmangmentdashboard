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
 * Helper to get cookie value
 */
const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
};

/**
 * Login user
 * POST /auth/login
 */
export const login = async (payload: LoginPayload): Promise<AuthResponse | null> => {
    try {
        const resp = await axiosInstance.post(`${AUTH_ENDPOINT}/login`, payload);

        // API returns data directly (not wrapped in data.data)
        const data = resp.data as AuthResponse;

        return data;
    } catch (error: any) {
        throw error;
    }
};

/**
 * Register new user
 * POST /auth/register
 */
export const register = async (payload: RegisterPayload): Promise<AuthResponse | null> => {
    try {
        const resp = await axiosInstance.post(`${AUTH_ENDPOINT}/register`, payload);

        // API returns data directly (not wrapped in data.data)
        const data = resp.data as AuthResponse;

        return data;
    } catch (error: any) {
        throw error;
    }
};

/**
 * Refresh access token
 * POST /auth/refresh
 */
export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> => {
    try {
        const resp = await axiosInstance.post(`${AUTH_ENDPOINT}/refresh`, { refreshToken });

        // API returns data directly (not wrapped in data.data)
        const data = resp.data as { accessToken: string; refreshToken: string };

        return data;
    } catch (error: any) {
        throw error;
    }
};

/**
 * Logout user
 * POST /auth/logout
 */
export const logout = async (refreshToken?: string): Promise<void> => {
    try {
        // Get refreshToken from cookie if not provided
        const token = refreshToken || getCookie("refreshToken");

        await axiosInstance.post(`${AUTH_ENDPOINT}/logout`, { refreshToken: token });

        // Clear auth cookies
        clearAuthCookies();
    } catch (error: any) {
        // Clear local auth data even if server request fails
        clearAuthCookies();

        throw error;
    }
};

/**
 * Get current user profile
 * GET /auth/me
 * Requires Authorization header with Bearer token
 */
export const getCurrentUser = async (): Promise<{ user: AuthResponse["user"] } | null> => {
    try {
        const resp = await axiosInstance.get(`${AUTH_ENDPOINT}/me`);

        // API returns { user: {...} }
        const data = resp.data as { user: AuthResponse["user"] };

        return data;
    } catch (error: any) {
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
