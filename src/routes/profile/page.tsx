import { useEffect, useMemo, useState } from "react";
import { Building2, Globe2, Mail, Phone, Save, ShieldCheck, UserRound } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useTheme } from "@/hooks/useTheme";
import { showToast } from "@/utils/swal";
import { getCurrentUser } from "@/api/requests/authService";

interface AuthUser {
    id?: string;
    email?: string;
    fullName?: string;
    role?: string;
}

interface ProfileForm {
    fullName: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    website: string;
}

const loadInitialProfile = (): ProfileForm => {
    const fallback: ProfileForm = {
        fullName: "Marketing Manager",
        email: "manager@company.com",
        phone: "+20 100 000 0000",
        company: "Growth Studio",
        role: "Owner",
        website: "https://company.com",
    };

    try {
        const storedUserRaw = localStorage.getItem("auth-user");
        const storedUser: AuthUser | null = storedUserRaw ? JSON.parse(storedUserRaw) : null;

        const stored = localStorage.getItem("profile-settings");
        const parsed = stored ? JSON.parse(stored) : null;

        const baseFromAuth: ProfileForm = {
            fullName: storedUser?.fullName || fallback.fullName,
            email: storedUser?.email || fallback.email,
            phone: fallback.phone,
            company: fallback.company,
            role: storedUser?.role || fallback.role,
            website: fallback.website,
        };

        return {
            fullName: parsed?.fullName || baseFromAuth.fullName,
            email: parsed?.email || baseFromAuth.email,
            phone: parsed?.phone || baseFromAuth.phone,
            company: parsed?.company || baseFromAuth.company,
            role: parsed?.role || baseFromAuth.role,
            website: parsed?.website || baseFromAuth.website,
        };
    } catch {
        return fallback;
    }
};

const ProfilePage = () => {
    const { t, lang, setLang } = useLang();
    const { theme, setTheme } = useTheme();

    const tr = (key: string, fallback: string) => {
        const value = t(key);
        return value && value !== key ? value : fallback;
    };

    const [profile, setProfile] = useState<ProfileForm>(loadInitialProfile());

    useEffect(() => {
        let mounted = true;

        const hydrateUser = async () => {
            try {
                const response = await getCurrentUser();
                const user = response?.user;
                if (!user) return;

                try {
                    localStorage.setItem("auth-user", JSON.stringify(user));
                } catch {
                    // ignore storage failures
                }

                if (!mounted) return;

                setProfile((prev) => ({
                    ...prev,
                    fullName: user.fullName || prev.fullName,
                    email: user.email || prev.email,
                    role: user.role || prev.role,
                }));
            } catch {
                // Keep local values when /auth/me is unavailable.
            }
        };

        void hydrateUser();

        return () => {
            mounted = false;
        };
    }, []);

    const initials = useMemo(() => {
        const parts = profile.fullName.trim().split(" ").filter(Boolean);
        if (parts.length === 0) return "MM";
        const first = parts[0][0] || "";
        const second = parts[1]?.[0] || parts[0]?.[1] || "";
        return (first + second).toUpperCase();
    }, [profile.fullName]);

    const updateField = (field: keyof ProfileForm, value: string) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        localStorage.setItem("profile-settings", JSON.stringify(profile));
        showToast(tr("profile_updated", "Profile updated successfully"), "success");
    };

    return (
        <div className="space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
                <div className="absolute -top-20 -right-8 h-52 w-52 rounded-full bg-light-400/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-secdark-700/15 blur-3xl" />

                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-light-700 text-xl font-black text-white shadow-lg dark:bg-dark-700">
                            {initials}
                        </div>
                        <div>
                            <p className="text-light-500 dark:text-dark-400 text-xs font-bold uppercase tracking-[0.12em]">
                                {tr("profile", "Profile")}
                            </p>
                            <h1 className="title mt-1 text-2xl sm:text-3xl">{profile.fullName}</h1>
                            <p className="text-light-600 dark:text-dark-300 mt-1 text-sm">
                                {profile.role} - {profile.company}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        className="btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5"
                    >
                        <Save size={16} />
                        {tr("save_changes", "Save Changes")}
                    </button>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-6">
                    <h2 className="text-light-900 dark:text-dark-50 text-lg font-semibold">{tr("account_details", "Account Details")}</h2>
                    <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                        {tr("account_details_sub", "Manage your personal information used across dashboard modules.")}
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="space-y-1.5">
                            <span className="text-light-700 dark:text-dark-300 text-xs font-semibold uppercase tracking-wide">
                                {tr("full_name", "Full Name")}
                            </span>
                            <div className="relative">
                                <UserRound size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-light-500" />
                                <input
                                    value={profile.fullName}
                                    onChange={(e) => updateField("fullName", e.target.value)}
                                    className="input w-full pl-9"
                                />
                            </div>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-light-700 dark:text-dark-300 text-xs font-semibold uppercase tracking-wide">
                                {tr("email", "Email")}
                            </span>
                            <div className="relative">
                                <Mail size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-light-500" />
                                <input
                                    value={profile.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    className="input w-full pl-9"
                                />
                            </div>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-light-700 dark:text-dark-300 text-xs font-semibold uppercase tracking-wide">
                                {tr("phone", "Phone")}
                            </span>
                            <div className="relative">
                                <Phone size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-light-500" />
                                <input
                                    value={profile.phone}
                                    onChange={(e) => updateField("phone", e.target.value)}
                                    className="input w-full pl-9"
                                />
                            </div>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-light-700 dark:text-dark-300 text-xs font-semibold uppercase tracking-wide">
                                {tr("company", "Company")}
                            </span>
                            <div className="relative">
                                <Building2 size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-light-500" />
                                <input
                                    value={profile.company}
                                    onChange={(e) => updateField("company", e.target.value)}
                                    className="input w-full pl-9"
                                />
                            </div>
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-light-700 dark:text-dark-300 text-xs font-semibold uppercase tracking-wide">
                                {tr("role", "Role")}
                            </span>
                            <input
                                value={profile.role}
                                onChange={(e) => updateField("role", e.target.value)}
                                className="input w-full"
                            />
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-light-700 dark:text-dark-300 text-xs font-semibold uppercase tracking-wide">
                                {tr("website", "Website")}
                            </span>
                            <div className="relative">
                                <Globe2 size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-light-500" />
                                <input
                                    value={profile.website}
                                    onChange={(e) => updateField("website", e.target.value)}
                                    className="input w-full pl-9"
                                />
                            </div>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-6">
                        <h3 className="text-light-900 dark:text-dark-50 text-base font-semibold">{tr("preferences", "Preferences")}</h3>
                        <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                            {tr("preferences_sub", "Adjust your dashboard experience quickly.")}
                        </p>

                        <div className="mt-4 space-y-3">
                            <div className="flex flex-col gap-2">
                                <span className="text-light-700 dark:text-dark-300 text-xs font-semibold uppercase tracking-wide">
                                    {tr("language", "Language")}
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLang("en")}
                                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                            lang === "en"
                                                ? "border-light-700 bg-light-700 text-white dark:border-dark-600 dark:bg-dark-700"
                                                : "border-light-300 bg-white text-light-800 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200"
                                        }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLang("ar")}
                                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                            lang === "ar"
                                                ? "border-light-700 bg-light-700 text-white dark:border-dark-600 dark:bg-dark-700"
                                                : "border-light-300 bg-white text-light-800 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200"
                                        }`}
                                    >
                                        العربية
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <span className="text-light-700 dark:text-dark-300 text-xs font-semibold uppercase tracking-wide">
                                    {tr("theme", "Theme")}
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTheme("light")}
                                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                            theme === "light"
                                                ? "border-light-700 bg-light-700 text-white"
                                                : "border-light-300 bg-white text-light-800 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200"
                                        }`}
                                    >
                                        {tr("light", "Light")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTheme("dark")}
                                        className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                            theme === "dark"
                                                ? "border-light-700 bg-light-700 text-white"
                                                : "border-light-300 bg-white text-light-800 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200"
                                        }`}
                                    >
                                        {tr("dark", "Dark")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-6">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-light-600 dark:text-dark-300" />
                            <h3 className="text-light-900 dark:text-dark-50 text-base font-semibold">{tr("security", "Security")}</h3>
                        </div>
                        <p className="text-light-600 dark:text-dark-400 mt-2 text-sm">
                            {tr("security_note", "Your account session is secured. For password changes, please use your authentication provider.")}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default ProfilePage;
