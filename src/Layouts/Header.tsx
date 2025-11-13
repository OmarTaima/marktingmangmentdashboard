import React, { useState } from "react";
import { ChevronsLeft, ChevronsRight, Search, Sun, Moon, Bell, X } from "lucide-react";
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
        <header className="dark:bg-dark-900 relative z-10 flex h-[60px] items-center justify-between bg-white px-3 shadow-md transition-colors sm:px-4 md:px-6">
            {/* Left Section */}
            <div className={cn("flex items-center gap-x-2 sm:gap-x-3", lang === "ar" && "flex-row-reverse")}>
                {/* Sidebar Toggle */}
                <button
                    className="btn-ghost size-9 !p-2 sm:size-10"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label="Toggle Sidebar"
                >
                    {lang === "ar" ? (
                        <ChevronsRight
                            size={22}
                            className={`${collapsed ? "rotate-180" : ""} text-light-700 dark:text-dark-400`}
                        />
                    ) : (
                        <ChevronsLeft
                            size={22}
                            className={`${collapsed ? "rotate-180" : ""} text-light-700 dark:text-dark-50`}
                        />
                    )}
                </button>

                {/* Search Input (Desktop) */}
                <div
                    className={cn(
                        "xs:flex border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 hidden w-[150px] items-center rounded-md border px-2 py-1 transition-colors sm:w-[200px] md:w-[250px] lg:w-[300px]",
                        lang === "ar" && "flex-row-reverse",
                    )}
                >
                    <Search
                        size={18}
                        className="text-light-500 dark:text-dark-50"
                    />
                    <input
                        type="text"
                        name="search"
                        placeholder={t("search_placeholder")}
                        className={cn(
                            "text-light-900 placeholder:text-dark-400 dark:text-dark-50 w-full bg-transparent px-2 text-sm outline-0 sm:text-base",
                            lang === "ar" && "text-right",
                        )}
                    />
                </div>

                {/* Compact Search Icon (Mobile) */}
                <button
                    className="btn-ghost xs:hidden size-9 !p-2"
                    aria-label="Search"
                    onClick={() => setShowSearch(true)}
                >
                    <Search
                        size={20}
                        className="text-light-700 dark:text-dark-50"
                    />
                </button>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-x-2 sm:gap-x-3">
                {/* Language Switch */}
                <button
                    className="btn-ghost text-light-700 dark:text-dark-50 size-9 !p-2 text-xs sm:size-10 sm:text-sm"
                    title={lang === "en" ? "العربية" : "English"}
                    onClick={() => setLang(lang === "en" ? "ar" : "en")}
                >
                    {lang === "en" ? "ع" : "EN"}
                </button>

                {/* Theme Switch */}
                <button
                    className="btn-ghost size-9 !p-2 sm:size-10"
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

                {/* Notifications */}
                <button
                    className="btn-ghost size-9 !p-2 sm:size-10"
                    aria-label="Notifications"
                >
                    <Bell
                        size={20}
                        className="text-light-700 dark:text-dark-50"
                    />
                </button>

                {/* Avatar */}
                <button className="size-9 overflow-hidden rounded-full sm:size-10">
                    <img
                        src="https://i.pravatar.cc/300"
                        alt="User Avatar"
                        className="h-8 w-8 rounded-full object-cover"
                    />
                </button>
            </div>

            {/* 🔍 Mobile Search Overlay */}
            {showSearch && (
                <div className="dark:bg-dark-900 absolute inset-0 flex items-center justify-between bg-white px-3 transition-all duration-200 sm:px-4">
                    <div
                        className={cn(
                            "border-dark-200 dark:border-dark-700 bg-dark-50 dark:bg-dark-800 flex flex-grow items-center gap-x-2 rounded-md border px-2 py-1",
                            lang === "ar" && "flex-row-reverse",
                        )}
                    >
                        <Search
                            size={20}
                            className="text-light-700 dark:text-dark-400"
                        />
                        <input
                            type="text"
                            autoFocus
                            placeholder={t("search_placeholder")}
                            className={cn(
                                "text-light-900 dark:text-dark-50 placeholder:text-dark-400 w-full bg-transparent text-sm outline-none",
                                lang === "ar" && "text-right",
                            )}
                        />
                    </div>
                    <button
                        className="text-dark-500 hover:text-dark-700 dark:hover:text-dark-50 ml-2 flex-shrink-0 rounded-md p-2"
                        onClick={() => setShowSearch(false)}
                        aria-label="Close Search"
                    >
                        <X
                            size={22}
                            className="text-light-700 dark:text-dark-400"
                        />
                    </button>
                </div>
            )}
        </header>
    );
};
