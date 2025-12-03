import { useMemo, useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Check, Loader2, Search, X } from "lucide-react";
import { usePackages, useServices, useItems } from "@/hooks/queries";
import type { Package } from "@/api/requests/packagesService";
import type { Service } from "@/api/requests/servicesService";

const PackagesPage = () => {
    const { t, lang } = useLang();

    const [selectedPackage, setSelectedPackage] = useState<Package | null>(() => {
        try {
            const stored = localStorage.getItem("selectedPackage");
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });
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

    // handler intentionally removed (not used)

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title text-xl sm:text-2xl lg:text-3xl">{t("service_packages")}</h1>
                    <p className="text-light-600 dark:text-dark-400 mt-1 text-sm sm:text-base">{t("service_packages_subtitle")}</p>
                </div>
                <div className="relative">
                    <Search className="text-light-600 dark:text-dark-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder={t("search_packages") || "Search packages..."}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-64 rounded-lg border bg-white py-2 pr-3 pl-10 text-sm transition-colors focus:outline-none"
                    />
                </div>
            </div>

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
                            className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                selectedServiceId === null
                                    ? "bg-light-700 dark:bg-dark-700 dark:text-dark-50 text-white"
                                    : "bg-light-100 text-light-900 dark:bg-dark-800 dark:text-dark-200"
                            }`}
                        >
                            All
                        </button>

                        {servicesWithCounts.map(({ service, count }) => (
                            <button
                                key={service._id}
                                type="button"
                                onClick={() => setSelectedServiceId(service._id)}
                                aria-pressed={selectedServiceId === service._id}
                                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                    selectedServiceId === service._id
                                        ? "bg-light-700 dark:bg-dark-700 dark:text-dark-50 text-white"
                                        : "bg-light-100 text-light-900 dark:bg-dark-800 dark:text-dark-200"
                                }`}
                            >
                                {lang === "ar" ? service.ar || service.en : service.en}
                                <span className="dark:bg-dark-700 ml-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredPackages.map((pkg) => {
                            return (
                                <div
                                    key={pkg._id}
                                    className={`group to-light-50 dark:from-dark-800 dark:to-dark-900 relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                                        selectedPackage?._id === pkg._id
                                            ? "border-primary-500 ring-primary-200 dark:ring-primary-900/50 ring-4"
                                            : "border-light-300 dark:border-dark-600"
                                    }`}
                                    onClick={() => setSelectedPackage(pkg)}
                                >
                                    {/* Decorative gradient overlay */}
                                    <div className="from-primary-400/20 to-primary-600/20 absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br blur-3xl"></div>

                                    {/* Package Name Header */}
                                    <div className="relative z-10 mb-6 text-center">
                                        <h3 className="text-light-900 dark:text-dark-50 text-2xl font-bold tracking-tight">
                                            {lang === "ar" ? pkg.nameAr : pkg.nameEn}
                                        </h3>
                                        {pkg.description && <p className="text-light-600 dark:text-dark-400 mt-2 text-sm">{pkg.description}</p>}
                                    </div>

                                    {/* Features Section */}
                                    <div className="relative z-10 mb-6 flex-1">
                                        {/* Table Header */}
                                        <div className="from-light-200 to-light-100 dark:from-dark-700 dark:to-dark-800 mb-4 rounded-t-xl bg-gradient-to-r p-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <h4 className="text-light-800 dark:text-dark-200 text-center text-sm font-bold tracking-wider uppercase">
                                                    {lang === "ar" ? "الميزات" : "Features"}
                                                </h4>
                                                <h4 className="text-light-800 dark:text-dark-200 text-center text-sm font-bold tracking-wider uppercase">
                                                    {lang === "ar" ? "المتاحة" : "Provided"}
                                                </h4>
                                            </div>
                                        </div>

                                        {/* Items list */}
                                        {pkg.items && pkg.items.length > 0 ? (
                                            <div className="border-light-200 dark:border-dark-700 dark:bg-dark-900/30 space-y-2 rounded-b-xl border-2 border-t-0 bg-white/50 p-2">
                                                {pkg.items.map((pkgItem, idx) => {
                                                    const raw = pkgItem as any;
                                                    const inner = raw?.item ?? raw;

                                                    let id = undefined as string | undefined;
                                                    let name = "(item)";

                                                    if (typeof inner === "string" || typeof inner === "number") {
                                                        id = String(inner);
                                                        name = itemsMap[id] || id;
                                                    } else if (inner && typeof inner === "object") {
                                                        id = inner._id || inner.id || undefined;
                                                        name =
                                                            inner.name ||
                                                            inner.nameEn ||
                                                            inner.nameAr ||
                                                            inner.en ||
                                                            inner.ar ||
                                                            inner.title ||
                                                            itemsMap[id || ""] ||
                                                            "(item)";
                                                    }

                                                    const quantity = raw?.quantity;
                                                    const note = raw?.note ?? inner?.note ?? "";
                                                    const key = id || `${pkg._id}-${idx}`;

                                                    return (
                                                        <div
                                                            key={key}
                                                            className="border-light-200 dark:border-dark-600 dark:bg-dark-800 grid grid-cols-2 gap-4 rounded-lg border bg-white p-3 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md"
                                                        >
                                                            <div>
                                                                <div className="text-light-900 dark:text-dark-50 text-sm font-medium">{name}</div>
                                                                {note && (
                                                                    <div className="text-light-600 dark:text-dark-400 mt-1 text-[11px]">{note}</div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-center">
                                                                {typeof quantity === "boolean" ? (
                                                                    quantity ? (
                                                                        <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900/30">
                                                                            <Check
                                                                                size={18}
                                                                                className="text-green-600 dark:text-green-400"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="rounded-full bg-red-100 p-1.5 dark:bg-red-900/30">
                                                                            <X
                                                                                size={18}
                                                                                className="text-red-600 dark:text-red-400"
                                                                            />
                                                                        </div>
                                                                    )
                                                                ) : typeof quantity === "number" ? (
                                                                    <span className="from-light-300 to-light-200 text-light-900 dark:from-dark-600 dark:to-dark-700 dark:text-dark-50 rounded-full bg-gradient-to-r px-4 py-1.5 text-sm font-bold shadow-sm">
                                                                        {quantity}
                                                                    </span>
                                                                ) : quantity !== undefined && quantity !== null ? (
                                                                    <span className="text-light-700 dark:text-dark-300 text-sm font-semibold">
                                                                        {quantity}
                                                                    </span>
                                                                ) : (
                                                                    <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900/30">
                                                                        <Check
                                                                            size={18}
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
                                            <p className="text-light-500 dark:text-dark-500 text-center text-sm">
                                                {lang === "ar" ? "لا توجد ميزات" : "No features"}
                                            </p>
                                        )}
                                    </div>

                                    {/* Price Section */}
                                    <div className="from-primary-500 to-primary-600 relative z-10 mt-auto rounded-xl bg-gradient-to-r p-4 text-center shadow-lg">
                                        <div className="text-sm font-medium text-white/80">{lang === "ar" ? "السعر" : "Price"}</div>
                                        <div className="mt-1 flex items-center justify-center gap-2">
                                            <span className="text-3xl font-bold text-white">{pkg.price}</span>
                                            <span className="text-lg font-medium text-white/90">{lang === "ar" ? "ج.م" : "EGP"}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {packages.length === 0 && !isLoading && (
                        <div className="text-light-600 dark:text-dark-400 py-12 text-center">{t("no_packages_found") || "No packages found"}</div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="btn-ghost px-3 py-1 disabled:opacity-50"
                            >
                                {t("previous") || "Previous"}
                            </button>
                            <span className="text-light-600 dark:text-dark-400 text-sm">
                                {t("page")} {currentPage} {t("of")} {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="btn-ghost px-3 py-1 disabled:opacity-50"
                            >
                                {t("next") || "Next"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PackagesPage;
