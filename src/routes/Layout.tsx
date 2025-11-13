import { useRef, useState, useEffect } from "react";
import { useMediaQuery } from "react-responsive";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../Layouts/Sidebar";
import { Header } from "../Layouts/Header";
import { cn } from "../utils/cn";
import { useClickOutside } from "../hooks/use-click-outside";
import { useLang } from "@/hooks/useLang";

const Layout = () => {
    // Detect screen width
    const isDesktop = useMediaQuery({ query: "(min-width: 768px)" });

    // Sidebar state
    const [collapsed, setCollapsed] = useState(!isDesktop);
    const sidebarRef = useRef(null);

    // Auto-update sidebar state when resizing
    useEffect(() => {
        setCollapsed(!isDesktop);
    }, [isDesktop]);

    // Close sidebar when clicking outside (mobile only)
    useClickOutside([sidebarRef], () => {
        if (!isDesktop && !collapsed) setCollapsed(true);
    });

    const { lang } = useLang();
    const isArabic = lang === "ar";

    // Adjust layout margin depending on language and collapse state
    const mdOffsetClass = collapsed ? (isArabic ? "md:mr-20" : "md:ml-20") : isArabic ? "md:mr-[240px]" : "md:ml-[240px]";

    const baseOffsetClass = isArabic ? "mr-0" : "ml-0";

    return (
        <div className="dark:bg-dark-950 bg-light-50 min-h-screen transition-colors">
            {/* Background overlay for mobile */}
            <div
                className={cn(
                    "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity duration-300",
                    !collapsed && "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30",
                )}
            />

            {/* Sidebar */}
            <Sidebar
                ref={sidebarRef}
                {...({ collapsed, setCollapsed } as any)}
            />

            {/* Main content area */}
            <div className={cn("flex flex-col transition-[margin] duration-300", mdOffsetClass, baseOffsetClass)}>
                {/* Header */}
                <Header
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                />

                {/* Routed content */}
                <main className="h-[calc(100vh-60px)] overflow-x-hidden overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
