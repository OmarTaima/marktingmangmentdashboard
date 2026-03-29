import { useMemo, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Check, Loader2, Search, X } from "lucide-react";
import { usePackages, useServices, useItems } from "@/hooks/queries";
import type { Package } from "@/api/requests/packagesService";
import type { Service } from "@/api/requests/servicesService";

const PackagesPage = () => {
    const { t, lang } = useLang();
    const tr = (key: string, fallback: string) => {
        const value = t(key);
        return !value || value === key ? fallback : value;
    };

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [error, _setError] = useState<string>("");

    // React Query hook
    const { data: packagesResponse, isLoading } = usePackages({
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
    });
    const packages = packagesResponse?.data || [];
    const totalPages = packagesResponse?.meta.totalPages || 1;

    // Services for tabs (load a large limit to get all services)
    const { data: servicesResponse } = useServices({ limit: 1000 });
    const services = servicesResponse?.data || [];
    const { data: itemsResponse } = useItems({ limit: 1000 });
    const items = itemsResponse?.data || [];

    const itemsMap = useMemo(() => {
        const m: Record<string, string> = {};
        items.forEach((it: any) => {
            const display = it?.name || it?.nameEn || it?.nameAr || it?.en || it?.ar || it?.title || "(item)";
            if (it && it._id) m[it._id] = display;
            if (it && it.id) m[it.id] = display;
        });
        return m;
    }, [items]);

    // Helper to determine if a package belongs to a service id
    const packageMatchesService = (pkg: Package, serviceId: string) => {
        const anyPkg: any = pkg as any;
        // possible shapes: pkg.service (object or id), pkg.serviceId
        if (!serviceId) return false;
        if (anyPkg.service) {
            if (typeof anyPkg.service === "string") return anyPkg.service === serviceId;
            if (anyPkg.service._id) return anyPkg.service._id === serviceId;
            if (anyPkg.service.id) return anyPkg.service.id === serviceId;
        }
        if (anyPkg.serviceId) return anyPkg.serviceId === serviceId;
        return false;
    };

    // Build list of services that actually have packages
    const servicesWithCounts = useMemo(() => {
        const map: { service: Service; count: number }[] = [];
        services.forEach((s) => {
            // Prefer counting by scanning packages for references, but fall back to
            // `service.packages` if the backend returns packages nested under the service.
            const byPackages = packages.filter((p) => packageMatchesService(p, s._id)).length;
            const byServiceList = s.packages?.length || 0;
            const count = byPackages > 0 ? byPackages : byServiceList;
            if (count > 0) map.push({ service: s, count });
        });
        return map;
    }, [services, packages]);

    const filteredPackages = useMemo(() => {
        if (!selectedServiceId) return packages;
        const svc = services.find((s) => s._id === selectedServiceId);
        if (svc && svc.packages && svc.packages.length > 0) {
            // If the packages list already contains the full package objects, prefer
            // returning those so the display matches the 'All' view (including item names).
            return (svc.packages as any[]).map((sp) => {
                const found = packages.find((p) => p._id === (sp._id || sp.id));
                if (found) return found;

                const normalized: Package = {
                    _id: sp._id || sp.id || String(sp._id || Math.random()),
                    nameEn: sp.nameEn || sp.en || sp.name || "",
                    nameAr: sp.nameAr || sp.ar || "",
                    price: typeof sp.price === "number" ? sp.price : Number(sp.price) || 0,
                    description: sp.description || sp.desc || "",
                    items: (sp.items || []).map((it: any) => {
                        // ServicePackage.items might be a different shape; normalize to Item-like object
                        if (!it) return it;
                        if (typeof it === "string") return { _id: it, name: itemsMap[it] || it };
                        return {
                            _id: it._id || it.id,
                            name: it.name || it.nameEn || it.nameAr || it.en || it.ar || itemsMap[it._id || it.id] || "(item)",
                            description: it.description || it.desc || undefined,
                            type: it.type,
                        } as any;
                    }),
                };
                return normalized;
            }) as Package[];
        }
        return packages.filter((p) => packageMatchesService(p, selectedServiceId));
    }, [packages, selectedServiceId, services, itemsMap]);

    const normalizePackageItem = (pkgItem: any, pkgId: string, idx: number) => {
        const raw = pkgItem as any;
        const inner = raw?.item ?? raw;

        let id = undefined as string | undefined;
        let name = "(item)";

        if (typeof inner === "string" || typeof inner === "number") {
            id = String(inner);
            name = itemsMap[id] || id;
        } else if (inner && typeof inner === "object") {
            id = inner._id || inner.id || undefined;
            name = inner.name || inner.nameEn || inner.nameAr || inner.en || inner.ar || inner.title || itemsMap[id || ""] || "(item)";
        }

        return {
            id,
            key: id || `${pkgId}-${idx}`,
            name,
            quantity: raw?.quantity,
            note: raw?.note ?? inner?.note ?? "",
        };
    };

    // handler intentionally removed (not used)

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
                <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-light-400/20 blur-3xl dark:bg-light-500/10" />
                <div className="absolute -bottom-24 -left-14 h-56 w-56 rounded-full bg-secdark-700/20 blur-3xl dark:bg-secdark-700/20" />
                <div className="relative flex flex-col gap-4">
                    <div>
                        <span className="inline-flex w-fit items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                            Package Library
                        </span>
                        <h1 className="title mt-3 text-xl sm:text-2xl lg:text-3xl">{tr("service_packages", "Service Packages")}</h1>
                        <p className="text-light-600 dark:text-dark-300 mt-1 text-sm sm:text-base">
                            {tr("service_packages_subtitle", "Explore and compare service packages with full feature visibility.")}
                        </p>
                    </div>

                    <div className="relative max-w-xs">
                        <Search className="text-light-600 dark:text-dark-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={tr("search_packages", "Search packages...")}
                            className="input w-full rounded-xl pr-3 pl-10"
                        />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("total_packages", "Total Packages")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{packages.length}</p>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("active_services", "Services With Packages")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{servicesWithCounts.length}</p>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("visible_packages", "Visible Packages")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{filteredPackages.length}</p>
                </div>
            </section>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="text-light-500 dark:text-light-500 h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Tabs: All + services that have packages */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedServiceId(null)}
                            aria-pressed={selectedServiceId === null}
                            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                selectedServiceId === null
                                    ? "border-light-700 bg-light-700 text-white dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                                    : "border-light-300 bg-white text-light-900 hover:border-light-400 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-200"
                            }`}
                        >
                            {tr("all", "All")}
                        </button>

                        {servicesWithCounts.map(({ service, count }) => (
                            <button
                                key={service._id}
                                type="button"
                                onClick={() => setSelectedServiceId(service._id)}
                                aria-pressed={selectedServiceId === service._id}
                                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                    selectedServiceId === service._id
                                        ? "border-light-700 bg-light-700 text-white dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                                        : "border-light-300 bg-white text-light-900 hover:border-light-400 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-200"
                                }`}
                            >
                                {lang === "ar" ? service.ar || service.en : service.en}
                                <span className="ml-2 inline-block rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">{count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredPackages.map((pkg) => {
                            return (
                                <div
                                    key={pkg._id}
                                    className="group to-light-50 dark:from-dark-800 dark:to-dark-900 relative flex flex-col overflow-hidden rounded-3xl border border-light-200/80 bg-gradient-to-br from-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-dark-700/80"
                                >
                                    <div className="from-primary-400/20 to-primary-600/20 absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br blur-3xl" />

                                    <div className="relative z-10 mb-4 flex items-center justify-between">
                                        <span className="rounded-full border border-light-300/80 bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-light-700 shadow-sm dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                                            {(pkg.items || []).length} {tr("items", "items")}
                                        </span>
                                        <span className="text-light-500 dark:text-dark-400 text-[11px] font-semibold uppercase tracking-[0.08em]">
                                            {tr("package_card", "Package Card")}
                                        </span>
                                    </div>

                                    <div className="relative z-10 mb-5 text-center">
                                        <h3 className="text-light-900 dark:text-dark-50 text-[30px] leading-tight font-bold tracking-tight">
                                            {lang === "ar" ? pkg.nameAr : pkg.nameEn}
                                        </h3>
                                        {pkg.description && <p className="text-light-600 dark:text-dark-400 mt-2 line-clamp-2 text-sm">{pkg.description}</p>}
                                    </div>

                                    <div className="relative z-10 mb-5 flex-1">
                                        <div className="mb-3 rounded-2xl border border-light-200/70 bg-gradient-to-r from-light-100/90 to-light-200/80 p-3 dark:border-dark-700/80 dark:from-dark-700 dark:to-dark-800">
                                            <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                                                <h4 className="text-light-800 dark:text-dark-200 text-left text-[13px] font-extrabold tracking-[0.1em] uppercase">
                                                    {lang === "ar" ? "الميزات" : "Features"}
                                                </h4>
                                                <h4 className="text-light-800 dark:text-dark-200 text-right text-[13px] font-extrabold tracking-[0.1em] uppercase">
                                                    {lang === "ar" ? "المتاحة" : "Provided"}
                                                </h4>
                                            </div>
                                        </div>

                                        {pkg.items && pkg.items.length > 0 ? (
                                            <div className="border-light-200/80 dark:border-dark-700/80 dark:bg-dark-900/30 max-h-[252px] space-y-2 overflow-auto rounded-2xl border bg-white/55 p-2.5 pr-1.5 shadow-inner scrollbar-thin">
                                                {pkg.items.map((pkgItem, idx) => {
                                                    const item = normalizePackageItem(pkgItem, pkg._id, idx);

                                                    return (
                                                        <div
                                                            key={item.key}
                                                            className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-light-200/80 bg-white/95 px-3 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-dark-600/80 dark:bg-dark-800/95"
                                                        >
                                                            <div className="min-w-0">
                                                                <div className="text-light-900 dark:text-dark-50 text-sm font-medium">{item.name}</div>
                                                                {item.note && (
                                                                    <div className="text-light-600 dark:text-dark-400 mt-1 truncate text-[11px]">{item.note}</div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-end">
                                                                {typeof item.quantity === "boolean" ? (
                                                                    item.quantity ? (
                                                                        <div className="rounded-full border border-emerald-200 bg-emerald-100/90 p-1.5 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-900/30">
                                                                            <Check
                                                                                size={17}
                                                                                className="text-green-600 dark:text-green-400"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="rounded-full border border-red-200 bg-red-100/90 p-1.5 shadow-sm dark:border-red-500/30 dark:bg-red-900/30">
                                                                            <X
                                                                                size={17}
                                                                                className="text-red-600 dark:text-red-400"
                                                                            />
                                                                        </div>
                                                                    )
                                                                ) : typeof item.quantity === "number" ? (
                                                                    <span className="inline-flex min-w-[40px] items-center justify-center rounded-full bg-gradient-to-r from-light-300 to-light-200 px-3.5 py-1.5 text-sm font-extrabold text-light-900 shadow-sm dark:from-dark-600 dark:to-dark-700 dark:text-dark-50">
                                                                        {item.quantity}
                                                                    </span>
                                                                ) : item.quantity !== undefined && item.quantity !== null ? (
                                                                    <span className="inline-flex max-w-[120px] truncate rounded-full bg-light-200 px-3 py-1 text-xs font-semibold text-light-800 dark:bg-dark-700 dark:text-dark-100">
                                                                        {item.quantity}
                                                                    </span>
                                                                ) : (
                                                                    <div className="rounded-full border border-emerald-200 bg-emerald-100/90 p-1.5 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-900/30">
                                                                        <Check
                                                                            size={17}
                                                                            className="text-green-600 dark:text-green-400"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-light-500 dark:text-dark-500 rounded-2xl border border-dashed border-light-200/70 py-4 text-center text-sm dark:border-dark-700/70">
                                                {lang === "ar" ? "لا توجد ميزات" : "No features"}
                                            </p>
                                        )}
                                    </div>

                                    <div className="relative z-10 mt-auto rounded-2xl border border-primary-300/25 bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-center shadow-lg shadow-primary-500/20">
                                        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80">
                                            {lang === "ar" ? "السعر" : "Price"}
                                        </div>
                                        <div className="mt-1 flex items-center justify-center gap-2">
                                            <span className="text-4xl leading-none font-extrabold text-white tabular-nums">{pkg.price}</span>
                                            <span className="text-xl font-semibold text-white/90">{lang === "ar" ? "ج.م" : "EGP"}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {packages.length === 0 && !isLoading && (
                        <div className="text-light-600 dark:text-dark-400 py-12 text-center">{tr("no_packages_found", "No packages found")}</div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn-ghost rounded-xl px-3 py-1 disabled:opacity-50"
                            >
                                {tr("previous", "Previous")}
                            </button>
                            <span className="text-light-600 dark:text-dark-400 text-sm">
                                {tr("page", "Page")} {currentPage} {tr("of", "of")} {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn-ghost rounded-xl px-3 py-1 disabled:opacity-50"
                            >
                                {tr("next", "Next")}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PackagesPage;
