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
                        {filteredPackages.map((pkg) => (
                            <div
                                key={pkg._id}
                                className={`card flex min-h-[400px] cursor-pointer flex-col justify-between p-4 transition-all duration-300 hover:shadow-lg sm:p-6 ${
                                    selectedPackage?._id === pkg._id ? "ring-light-500 ring-2" : ""
                                }`}
                                onClick={() => setSelectedPackage(pkg)}
                            >
                                <div>
                                    <div className="text-center">
                                        <h3 className="card-title mb-2 text-lg font-semibold break-words sm:text-xl">
                                            {lang === "ar" ? pkg.nameAr : pkg.nameEn}
                                        </h3>
                                        <div className="mb-4">
                                            <p className="text-light-500 dark:text-secdark-700 mb-4 text-2xl font-bold break-words sm:text-3xl">
                                                {pkg.price} {lang === "ar" ? "ج.م" : "EGP"}
                                            </p>
                                        </div>
                                    </div>
                                    {pkg.description && <p className="text-light-600 dark:text-dark-400 mt-2 text-sm">{pkg.description}</p>}

                                    {pkg.items && pkg.items.length > 0 && (
                                        <ul className="mt-4 space-y-2 sm:space-y-3">
                                            {pkg.items.map((pkgItem, idx) => {
                                                const raw = pkgItem as any;
                                                // Normalize to inner item object or id
                                                const inner = raw?.item ?? raw;

                                                let id = undefined as string | undefined;
                                                let name = "(item)";
                                                let description = null as string | null;

                                                if (typeof inner === "string" || typeof inner === "number") {
                                                    id = String(inner);
                                                    name = itemsMap[id] || id;
                                                } else if (inner && typeof inner === "object") {
                                                    id = inner._id || inner.id || undefined;
                                                    // Try many possible name fields
                                                    name =
                                                        inner.name ||
                                                        inner.nameEn ||
                                                        inner.nameAr ||
                                                        inner.en ||
                                                        inner.ar ||
                                                        inner.title ||
                                                        itemsMap[id || ""] ||
                                                        "(item)";
                                                    description = inner.description || inner.desc || null;
                                                }

                                                const quantity = raw?.quantity;

                                                const key = id || `${pkg._id}-${idx}`;

                                                const note = raw?.note ?? inner?.note ?? "";

                                                return (
                                                    <li
                                                        key={key}
                                                        className="flex flex-col items-start gap-1"
                                                    >
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-dark-700 dark:text-dark-50 text-sm break-words sm:text-base">
                                                                {name}
                                                                {description && (
                                                                    <span className="text-light-600 dark:text-dark-400 ml-1 text-xs">
                                                                        - {description}
                                                                    </span>
                                                                )}
                                                            </span>

                                                            {typeof quantity !== "undefined" &&
                                                                (typeof quantity === "boolean" ? (
                                                                    <span className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs">
                                                                        {quantity ? (
                                                                            <Check
                                                                                size={14}
                                                                                className="text-green-500"
                                                                            />
                                                                        ) : (
                                                                            <X
                                                                                size={14}
                                                                                className="text-danger-600"
                                                                            />
                                                                        )}
                                                                    </span>
                                                                ) : typeof quantity === "number" ? (
                                                                    <span className="bg-light-100 dark:bg-dark-700 text-light-900 dark:text-dark-50 ml-2 inline-block rounded-md px-2 py-0.5 text-xs">
                                                                        x{quantity}
                                                                    </span>
                                                                ) : (
                                                                    <span className="bg-light-100 dark:bg-dark-700 text-light-900 dark:text-dark-50 ml-2 inline-block rounded-md px-2 py-0.5 text-xs">
                                                                        {quantity}
                                                                    </span>
                                                                ))}
                                                        </div>

                                                        {note ? (
                                                            <small className="text-light-600 dark:text-dark-400 mt-0.5 text-[11px]">{note}</small>
                                                        ) : null}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
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
