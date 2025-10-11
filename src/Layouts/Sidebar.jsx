import { forwardRef } from "react";
import { cn } from "../utils/cn";
import LightLogo from "../assets/logo-light.svg";
import DarkLogo from "../assets/logo-dark.svg";
import PropTypes from "prop-types";
import { navbarLinks } from "../constants";
import { NavLink } from "react-router-dom";

export const Sidebar = forwardRef(({ collapsed }, ref) => {
    return (
        <aside
            ref={ref}
            className={cn(
                "shadow:sm fixed z-[100] flex h-full w-[240px] flex-col overflow-x-hidden border-r border-slate-300 bg-white [transition:_width_300ms_cubic-bezier(0.4,_0,_0.2,_1),_left_300ms_cubic-bezier(0.4,_0,_0.2,_1),_background-color_150ms_cubic-bezier(0.4,_0,_0.2,_1),_border_150ms_cubic-bezier(0.4,_0,_0.2,_1)] dark:border-slate-700 dark:bg-slate-900",
                collapsed ? "md:w-20 md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0",
            )}
        >
            <div className="flex gap-x-3 p-3">
                <img
                    src={LightLogo}
                    alt="Vite UI Logo Light"
                    className="dark:hidden"
                />
                <img
                    src={DarkLogo}
                    alt="Vite UI Logo Dark"
                    className="hidden dark:block"
                />
                {!collapsed && <p className="translition text-lg font-medium text-slate-900 transition-colors dark:text-slate-50">Vite UI</p>}
            </div>
            <div className="gap y-4 flex w-full flex-col overflow-x-hidden overflow-y-auto p-3 [scrollbar-width:_thin]">
                {navbarLinks.map((navbarLink) => (
                    <nav
                        key={navbarLink.title}
                        className={cn("sidebar-group", collapsed && "md:items-center")}
                    >
                        <p className={cn("sidebar-group-title", collapsed && "md:w-[45px]")}>{navbarLink.title}</p>
                        {navbarLink.links.map((link) => (
                            <NavLink
                                key={link.label}
                                to={link.path}
                                className={cn("sidebar-item", collapsed && "md:w-[45px]")}
                            >
                                <link.icon
                                    size={22}
                                    className="flex-shrink-0"
                                />
                                {!collapsed && <span className="whitespace-nowarp">{link.label}</span>}
                            </NavLink>
                        ))}
                    </nav>
                ))}
            </div>
        </aside>
    );
});
Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapesd: PropTypes.bool,
};
