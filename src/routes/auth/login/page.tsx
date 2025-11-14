import React, { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { login, setAuthCookies } from "@/api/requests/authService";
import axiosInstance from "@/api/axios";
import { cn } from "@/utils/cn";

const LoginPage: React.FC = () => {
    const { t, lang, setLang } = useLang();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
            const data = await login({ email, password });

            if (data?.accessToken) {
                setAuthCookies(data.accessToken, data.refreshToken);
                if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
                axiosInstance.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;
            }

            navigate("/dashboard");
        } catch (err: any) {
            console.error("Login error", err);
            let msg = "Login failed. Please try again.";

            if (err?.response?.status === 500) {
                msg = "Server error. Please check your credentials or try again later.";
            } else if (err?.response?.status === 401) {
                msg = "Invalid email or password.";
            } else if (err?.response?.status === 404) {
                msg = "Account not found. Please register first.";
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

            <div className="w-full max-w-lg">
                <div className="card">
                    <div className="card-header border-light-600 dark:border-dark-700 border-b pb-4">
                        <h2 className="card-title text-2xl">{t("login") || "Login"}</h2>
                    </div>
                    <div className="card-body">
                        {error && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                                {error}
                            </div>
                        )}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >
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
                                    autoComplete="current-password"
                                />
                            </div>

                            <div className={cn("flex items-center justify-between text-sm", lang === "ar" && "flex-row-reverse")}>
                                <label className="text-light-900 dark:text-dark-50 inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="border-light-600 text-light-500 focus:ring-light-500/20 dark:border-dark-700 dark:bg-dark-800 dark:text-secdark-700 dark:focus:ring-secdark-700/20 h-4 w-4 rounded transition-colors focus:ring-2"
                                    />
                                    <span>{t("remember_me") || "Remember me"}</span>
                                </label>
                                <Link
                                    to="/auth/forgot"
                                    className="text-light-500 hover:text-light-600 dark:text-secdark-700 dark:hover:text-secdark-600 font-medium transition-colors"
                                >
                                    {t("forgot_password") || "Forgot password?"}
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full py-2.5"
                                disabled={loading}
                            >
                                {loading ? t("logging_in") || "Logging in..." : t("login") || "Login"}
                            </button>
                        </form>

                        <div className="text-light-900 dark:text-dark-50 mt-6 text-center text-sm">
                            <span>{t("no_account") || "Don't have an account?"} </span>
                            <Link
                                to="/auth/register"
                                className="text-light-500 hover:text-light-600 dark:text-secdark-700 dark:hover:text-secdark-600 font-medium transition-colors"
                            >
                                {t("register") || "Register"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
