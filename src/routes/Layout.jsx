import { Sidebar } from "../Layouts/Sidebar";
import { useMediaQuery } from "react-responsive";
import { cn } from "../utils/cn";
import { Header } from "../Layouts/Header";
import { Outlet } from "react-router-dom";
import { use, useEffect, useRef, useState } from "react";
import { useClickOutside } from "../hooks/use-click-outside";

const Layout = () => {
    const isDesktop = useMediaQuery({ query: "(min-width: 768px)" });
    const [collapsed, setCollapsed] = useState(!isDesktop);
    const sidebarRef = useRef(null);
    useEffect(() => {
        setCollapsed(!isDesktop);
    }, [isDesktop]);

    useClickOutside([sidebarRef], () => {
        if (!isDesktop && !collapsed) {
            setCollapsed(true);
        }
    });
    return (
        <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">
            <div
                className={cn(
                    "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
                    !collapsed && "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30",
                )}
            />
            <Sidebar
                ref={sidebarRef}
                collapsed={collapsed}
            />
            <div className={cn("transition-[margin] duration-300", collapsed ? "md:ml-20" : "md:ml-[240px]", "ml-0")}>
                <Header
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                />
                <div className="h-[calc(100vh-60px)] overflow-x-hidden overflow-y-auto p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
export default Layout;
