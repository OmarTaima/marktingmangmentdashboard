import  { useState } from "react";
import { ChevronsLeft, ChevronsRight, Sun, Moon, X } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/utils/cn";

interface HeaderProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const { lang, setLang, t } = useLang();

    // 🔍 Controls mobile search visibility
    const [showSearch, setShowSearch] = useState<boolean>(false);

    return (
        <header className="dark:bg-dark-950/80 sticky top-0 z-30 flex h-[64px] items-center justify-between bg-white/80 px-4 backdrop-blur-xl transition-all sm:px-6 md:px-8 border-b border-light-100 dark:border-dark-800">
            {/* Left Section */}
            <div className={cn("flex items-center gap-x-4", lang === "ar" && "flex-row-reverse")}>
                {/* Sidebar Toggle */}
                <button
                    className="btn-ghost size-10 !p-0 sm:size-11"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label="Toggle Sidebar"
                >
                    {lang === "ar" ? (
                        <ChevronsRight
                            size={20}
                            className={`${collapsed ? "rotate-180" : ""} text-light-600 dark:text-dark-400 transition-transform duration-300`}
                        />
                    ) : (
                        <ChevronsLeft
                            size={20}
                            className={`${collapsed ? "rotate-180" : ""} text-light-600 dark:text-dark-400 transition-transform duration-300`}
                        />
                    )}
                </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-x-3">
                {/* Language Switch */}
                <button
                    className="btn-ghost text-light-600 dark:text-dark-400 size-10 !p-0 font-bold text-xs sm:size-11 sm:text-sm hover:scale-105 transition-transform"
                    title={lang === "en" ? "العربية" : "English"}
                    onClick={() => setLang(lang === "en" ? "ar" : "en")}
                >
                    {lang === "en" ? "ع" : "EN"}
                </button>

                {/* Theme Switch */}
                <button
                    className="btn-ghost size-10 !p-0 sm:size-11 hover:scale-105 transition-transform"
                    aria-label="Toggle Theme"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun
                        size={20}
                        className="text-light-600 dark:hidden"
                    />
                    <Moon
                        size={20}
                        className="text-dark-400 hidden dark:block"
                    />
                </button>

                {/* Avatar */}
                <button className="ml-2 flex items-center gap-x-2 rounded-full p-1 transition-all hover:bg-light-100 dark:hover:bg-dark-800">
                    <img
                        src="https://i.pravatar.cc/300"
                        alt="User Avatar"
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-light-200 dark:ring-dark-700"
                    />
                </button>
            </div>
        </header>
    );
};
