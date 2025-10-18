import { ChevronsLeft, ChevronsRight, Search, Sun, Moon, Bell } from "lucide-react";
import PropType from "prop-types";
import { useTheme } from "../hooks/useTheme";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/utils/cn";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const { lang, setLang, t } = useLang();

    return (
        <header className="realative dark:bg-secondary-900 z-10 flex h-[60px] items-center justify-between bg-white px-4 shadow-md transition-colors">
            <div className={cn("flex items-center gap-x-3", lang === "ar" && "flex-row-reverse")}>
                <button
                    className="btn-ghost size-10 !p-2"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    {lang === "ar" ? (
                        <ChevronsRight
                            size={24}
                            className={collapsed && "rotate-180"}
                        />
                    ) : (
                        <ChevronsLeft
                            size={24}
                            className={collapsed && "rotate-180"}
                        />
                    )}
                </button>
                <div className={cn("input flex items-center", lang === "ar" && "flex-row-reverse")}>
                    <Search
                        size={20}
                        className="text-secondary-200"
                    />
                    <input
                        type="text"
                        name="search"
                        placeholder={t("search_placeholder")}
                        className={cn(
                            "text-secondary-900 placeholder:text-secondary-300 dark:text-secondary-50 w-full bg-transparent outline-0",
                            lang === "ar" && "text-right",
                        )}
                    />
                </div>
            </div>
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10 !p-2"
                    title={lang === "en" ? "العربية" : "English"}
                    onClick={() => setLang(lang === "en" ? "ar" : "en")}
                >
                    <span className="text-sm">{lang === "en" ? "ع" : "EN"}</span>
                </button>

                <button
                    className="btn-ghost size-10 !p-2"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                    <Sun
                        size={24}
                        className="dark:hidden"
                    />
                    <Moon
                        size={24}
                        className="hidden dark:block"
                    />
                </button>
                <button className="btn-ghost size-10 !p-2">
                    <Bell size={24} />
                </button>
                <button className="size-10 overflow-hidden rounded-full">
                    <img
                        src="https://i.pravatar.cc/300"
                        alt="User Avatar"
                        className="h-8 w-8 rounded-full object-cover"
                    />
                </button>
            </div>
        </header>
    );
};
Header.propTypes = {
    collapsed: PropType.bool,
    setCollapsed: PropType.func,
};
