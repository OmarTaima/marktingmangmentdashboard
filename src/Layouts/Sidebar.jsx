import { forwardRef, useEffect } from "react";
import { cn } from "../utils/cn";
import LightLogo from "../assets/logo-light.svg";
import DarkLogo from "../assets/logo-dark.svg";
import PropTypes from "prop-types";
import { navbarLinks } from "../constants";
import { NavLink, useLocation } from "react-router-dom";
import { useLang } from "../hooks/useLang";

export const Sidebar = forwardRef(({ collapsed, setCollapsed }, ref) => {
    const { lang, t } = useLang();
    const isArabic = lang === "ar";
    const location = useLocation();

    // 🧠 Close sidebar automatically on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 768) setCollapsed(true);
    }, [location.pathname, setCollapsed]);

    const borderSide = isArabic ? "border-l" : "border-r";
    const desktopPosition = isArabic ? "right-0 left-auto" : "left-0 right-auto";
    const mobileOffset = isArabic ? (collapsed ? "max-md:-right-full" : "max-md:right-0") : collapsed ? "max-md:-left-full" : "max-md:left-0";

    return (
        <>
            {/* 🌓 Mobile backdrop */}
            <div
                onClick={() => setCollapsed(true)}
                className={cn(
                    "fixed inset-0 z-[90] bg-black/40 transition-opacity md:hidden",
                    collapsed ? "pointer-events-none opacity-0" : "opacity-100",
                )}
            />

            {/* 🧭 Sidebar */}
            <aside
                ref={ref}
                dir={isArabic ? "rtl" : "ltr"}
                className={cn(
                    "shadow:sm dark:bg-secondary-900 fixed z-[100] flex h-full w-[240px] flex-col overflow-x-hidden bg-white transition-all duration-300 ease-in-out",
                    borderSide,
                    "border-secondary-200 dark:border-secondary-700",
                    desktopPosition,
                    collapsed ? "md:w-20 md:items-center" : "md:w-[240px]",
                    mobileOffset,
                )}
            >
                {/* Logo */}
                <div className={cn("flex items-center gap-x-3 p-3", isArabic && "flex-row-reverse")}>
                    <img
                        src={LightLogo}
                        alt="Logo Light"
                        className="dark:hidden"
                    />
                    <img
                        src={DarkLogo}
                        alt="Logo Dark"
                        className="hidden dark:block"
                    />
                    {!collapsed && (
                        <p
                            className={cn(
                                "text-secondary-900 dark:text-secondary-50 w-full text-lg font-medium transition-colors",
                                isArabic ? "text-right" : "text-left",
                            )}
                        >
                            {t("app_name")}
                        </p>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex w-full flex-col gap-y-4 overflow-x-hidden overflow-y-auto p-3 [scrollbar-width:_thin]">
                    {navbarLinks.map((navbarLink) => (
                        <nav
                            key={navbarLink.title}
                            className={cn("sidebar-group", collapsed && "md:items-center")}
                        >
                            <p className={cn("sidebar-group-title w-full", collapsed && "md:w-[45px]", isArabic ? "text-right" : "text-left")}>
                                {t(navbarLink.title)}
                            </p>

                            {navbarLink.links.map((link) => (
                                <NavLink
                                    key={link.label}
                                    to={link.path}
                                    end
                                    className={({ isActive }) =>
                                        cn(
                                            "sidebar-item flex items-center justify-start gap-x-3",
                                            collapsed && "md:w-[45px]",
                                            isArabic && "flex-row-reverse justify-end",
                                            isActive && "active",
                                        )
                                    }
                                    onClick={() => {
                                        // Only auto-close sidebar on small screens (mobile/tablet)
                                        if (typeof window !== "undefined" && window.innerWidth < 768) {
                                            setCollapsed(true);
                                        }
                                    }}
                                >
                                    <link.icon
                                        size={22}
                                        className={cn("flex-shrink-0", isArabic ? "order-2 ml-2" : "order-1 mr-2")}
                                    />
                                    {!collapsed && (
                                        <span className={cn("w-full whitespace-nowrap", isArabic ? "order-1 text-right" : "order-2 text-left")}>
                                            {t(link.label)}
                                        </span>
                                    )}
                                </NavLink>
                            ))}
                        </nav>
                    ))}
                </div>
            </aside>
        </>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};
