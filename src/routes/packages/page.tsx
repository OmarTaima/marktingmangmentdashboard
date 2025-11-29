import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Check, Loader2, Search, X } from "lucide-react";
import { usePackages } from "@/hooks/queries";
import type { Package } from "@/api/requests/packagesService";

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
    const [error, _setError] = useState<string>("");

    // React Query hook
    const { data: packagesResponse, isLoading } = usePackages({
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
    });
    const packages = packagesResponse?.data || [];
    const totalPages = packagesResponse?.meta.totalPages || 1;

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
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {packages.map((pkg) => (
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
                                                // pkgItem may come in different shapes:
                                                // - { _id, name, description }
                                                // - { item: { _id, name, description }, quantity }
                                                // - legacy: { quantity, buffer: { ... } }
                                                const inner = (pkgItem as any).item || (pkgItem as any);
                                                const id = (inner && (inner._id || inner.id)) || `${pkg._id}-${idx}`;
                                                const name = inner?.name || inner?.nameEn || inner?.nameAr || "(item)";
                                                const description = inner?.description || inner?.desc || null;
                                                const quantity = (pkgItem as any).quantity;

                                                return (
                                                    <li
                                                        key={id}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <span className="text-dark-700 dark:text-dark-50 text-sm break-words sm:text-base">
                                                            {name}
                                                            {description && (
                                                                <span className="text-light-600 dark:text-dark-400 ml-1 text-xs">
                                                                    - {description}
                                                                </span>
                                                            )}
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
                                                        </span>
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
