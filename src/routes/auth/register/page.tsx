import React, { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { register, setAuthCookies } from "@/api/requests/authService";
import axiosInstance from "@/api/axios";
import { cn } from "@/utils/cn";

const RegisterPage: React.FC = () => {
    const { t, lang, setLang } = useLang();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState<"admin" | "manager" | "employee">("employee");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validate = () => {
        if (!email || !password) return "Please enter email and password";
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Please enter a valid email";
        if (password.length < 8) return "Password must be at least 8 characters";
        return null;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        const v = validate();
        if (v) return setError(v);

        setLoading(true);
        try {
            const data = await register({ email, password, fullName, role });

            if (data?.accessToken) {
                setAuthCookies(data.accessToken, data.refreshToken);
                axiosInstance.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
            }

            navigate("/dashboard");
        } catch (err: any) {
            console.error("Register error", err);
            let msg = "Registration failed. Please try again.";

            if (err?.response?.status === 500) {
                msg = "Server error. Please try again later.";
            } else if (err?.response?.status === 409) {
                msg = "Email already exists. Please login instead.";
            } else if (err?.response?.status === 400) {
                msg = "Invalid registration data. Please check your inputs.";
            } else if (err?.response?.data?.message) {
                msg = err.response.data.message;
            } else if (err?.message) {
                msg = err.message;
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="bg-light-50 dark:bg-dark-950 flex min-h-screen items-center justify-center px-4 transition-colors"
            dir={lang === "ar" ? "rtl" : "ltr"}
        >
            {/* Theme and Language Toggle */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                {/* Language Switch */}
                <button
                    className="btn-ghost text-light-700 dark:text-dark-50 size-10 !p-2 text-sm"
                    title={lang === "en" ? "العربية" : "English"}
                    onClick={() => setLang(lang === "en" ? "ar" : "en")}
                >
                    {lang === "en" ? "ع" : "EN"}
                </button>

                {/* Theme Switch */}
                <button
                    className="btn-ghost size-10 !p-2"
                    aria-label="Toggle Theme"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun
                        size={20}
                        className="text-light-700 dark:hidden"
                    />
                    <Moon
                        size={20}
                        className="text-dark-50 hidden dark:block"
                    />
                </button>
            </div>

            <div className="w-full max-w-2xl">
                <div className="card mx-auto max-w-3xl">
                    <div className="card-header border-light-600 dark:border-dark-700 border-b pb-4">
                        <h2 className="card-title text-2xl">{t("register") || "Register"}</h2>
                    </div>
                    <div className="card-body">
                        {error && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                                {error}
                            </div>
                        )}
                        <form
                            onSubmit={handleSubmit}
                            className="grid grid-cols-1 gap-4 md:grid-cols-2"
                        >
                            <div>
                                <label
                                    className={cn("text-light-900 dark:text-dark-50 mb-2 block text-sm font-medium", lang === "ar" && "text-right")}
                                >
                                    {t("full_name") || "Full name"}
                                </label>
                                <input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="border-light-600 text-light-900 focus:border-light-500 focus:ring-light-500/20 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:focus:border-secdark-700 dark:focus:ring-secdark-700/20 w-full rounded-lg border bg-white px-4 py-2.5 transition-colors focus:ring-2 focus:outline-none"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label
                                    className={cn("text-light-900 dark:text-dark-50 mb-2 block text-sm font-medium", lang === "ar" && "text-right")}
                                >
                                    {t("email") || "Email"}
                                </label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    className="border-light-600 text-light-900 focus:border-light-500 focus:ring-light-500/20 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:focus:border-secdark-700 dark:focus:ring-secdark-700/20 w-full rounded-lg border bg-white px-4 py-2.5 transition-colors focus:ring-2 focus:outline-none"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <label
                                    className={cn("text-light-900 dark:text-dark-50 mb-2 block text-sm font-medium", lang === "ar" && "text-right")}
                                >
                                    {t("password") || "Password"}
                                </label>
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type="password"
                                    className="border-light-600 text-light-900 focus:border-light-500 focus:ring-light-500/20 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:focus:border-secdark-700 dark:focus:ring-secdark-700/20 w-full rounded-lg border bg-white px-4 py-2.5 transition-colors focus:ring-2 focus:outline-none"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div>
                                <label
                                    className={cn("text-light-900 dark:text-dark-50 mb-2 block text-sm font-medium", lang === "ar" && "text-right")}
                                >
                                    {t("role") || "Role"}
                                </label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as "admin" | "manager" | "employee")}
                                    className="border-light-600 text-light-900 focus:border-light-500 focus:ring-light-500/20 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:focus:border-secdark-700 dark:focus:ring-secdark-700/20 w-full rounded-lg border bg-white px-4 py-2.5 transition-colors focus:ring-2 focus:outline-none"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <button
                                    type="submit"
                                    className="btn-primary w-full py-2.5"
                                    disabled={loading}
                                >
                                    {loading ? t("registering") || "Registering..." : t("register") || "Register"}
                                </button>
                            </div>
                        </form>

                        <div className="text-light-900 dark:text-dark-50 mt-6 text-center text-sm">
                            <span>{t("have_account") || "Already have an account?"} </span>
                            <Link
                                to="/auth/login"
                                className="text-light-500 hover:text-light-600 dark:text-secdark-700 dark:hover:text-secdark-600 font-medium transition-colors"
                            >
                                {t("login") || "Login"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
