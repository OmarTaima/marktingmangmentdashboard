import { useState, KeyboardEvent, useRef } from "react";
import { Plus, Edit2, Trash2, Check, X, Loader2, Search } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { showConfirm } from "@/utils/swal";
import { useServices, useCreateService, useUpdateService, useDeleteService, usePackages } from "@/hooks/queries";
import type { Service } from "@/api/requests/servicesService";

const ServicesPage = () => {
    const { t, lang } = useLang();
    const tr = (key: string, fallback: string) => {
        const value = t(key);
        return !value || value === key ? fallback : value;
    };
    const [inputEn, setInputEn] = useState<string>("");
    const [inputAr, setInputAr] = useState<string>("");
    const [inputDescription, setInputDescription] = useState<string>("");
    const [inputPackages, setInputPackages] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string>("");
    const [editingValueEn, setEditingValueEn] = useState<string>("");
    const [editingValueAr, setEditingValueAr] = useState<string>("");
    const [editingDescription, setEditingDescription] = useState<string>("");
    const [editingPackages, setEditingPackages] = useState<string[]>([]);
    const [showPackageDropdown, setShowPackageDropdown] = useState<boolean>(false);
    const [showEditPackageDropdown, setShowEditPackageDropdown] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [error, setError] = useState<string>("");

    // React Query hooks
    const { data: servicesResponse, isLoading } = useServices({
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
    });
    const services = servicesResponse?.data || [];
    const totalPages = servicesResponse?.meta.totalPages || 1;

    const { data: packagesResponse } = usePackages({ limit: 100 });
    const packages = packagesResponse?.data || [];

    const createServiceMutation = useCreateService();
    const updateServiceMutation = useUpdateService();
    const deleteServiceMutation = useDeleteService();

    const isSaving = createServiceMutation.isPending || updateServiceMutation.isPending;

    const getSelectedPackagesLabel = (selectedIds: string[]) => {
        if (!selectedIds || selectedIds.length === 0) {
            return t("select_packages") || "Select packages";
        }

        const names = packages
            .filter((pkg: any) => selectedIds.includes(String(pkg._id)))
            .map((pkg: any) => (lang === "ar" ? pkg.nameAr : pkg.nameEn))
            .filter(Boolean);

        if (names.length === 0) {
            return `${selectedIds.length} ${t("selected") || "selected"}`;
        }

        if (names.length <= 2) {
            return names.join(", ");
        }

        return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
    };

    const handleAdd = async () => {
        const en = (inputEn || "").trim();
        const ar = (inputAr || "").trim();
        const desc = (inputDescription || "").trim();

        if (!en || !ar) {
            setError(t("service_name_required") || "English and Arabic names are required");
            return;
        }

        try {
            setError("");
            await createServiceMutation.mutateAsync({
                en,
                ar,
                description: desc || undefined,
                
                packages: inputPackages.length > 0 ? inputPackages : undefined,
            });
            setInputEn("");
            setInputAr("");
            setInputDescription("");
            setInputPackages([]);
            setShowPackageDropdown(false);
            setInputPackages([]);
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to create service");
        }
    };

    const handleCreateKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            // If the package dropdown is open, don't treat Enter as "create" — it should operate on dropdown items
            if (showPackageDropdown) return;
            e.preventDefault();
            e.stopPropagation();
            ignorePackageToggleRef.current = true;
            try {
                handleAdd();
            } finally {
                setTimeout(() => (ignorePackageToggleRef.current = false), 50);
            }
        }
    };

    const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            // If the edit-package dropdown is open, let Enter act on it instead of saving
            if (showEditPackageDropdown) return;
            e.preventDefault();
            e.stopPropagation();
            ignorePackageToggleRef.current = true;
            try {
                if (editingId) saveEdit(editingId);
            } finally {
                setTimeout(() => (ignorePackageToggleRef.current = false), 50);
            }
        }
    };

    // Prevent package buttons in dropdown from responding when Enter-triggered submit is happening
    const ignorePackageToggleRef = useRef(false);
    // Track if the last user action was selecting a package so Enter pressed immediately after will submit
    const lastPackageSelectRef = useRef(false);

    const startEdit = (service: Service) => {
        setEditingId(service._id);
        setEditingValueEn(service.en || "");
        setEditingValueAr(service.ar || "");
        setEditingDescription(service.description || "");
        // Extract package IDs from package objects
        const packageIds = service.packages?.map((pkg) => (typeof pkg === "string" ? pkg : pkg._id)) || [];
        setEditingPackages(packageIds);
    };

    const saveEdit = async (id: string) => {
        const en = (editingValueEn || "").trim();
        const ar = (editingValueAr || "").trim();
        const desc = (editingDescription || "").trim();

        if (!en || !ar) {
            setError(t("service_name_required") || "English and Arabic names are required");
            return;
        }

        try {
            setError("");
            // Ensure packages are string IDs only
            const packageIds = editingPackages.map((pkg) => (typeof pkg === "string" ? pkg : (pkg as any)?._id)).filter(Boolean);
            await updateServiceMutation.mutateAsync({
                id,
                data: {
                    en,
                    ar,
                    description: desc || undefined,
                    
                    packages: packageIds.length > 0 ? packageIds : undefined,
                },
            });
            setEditingId("");
            setEditingValueEn("");
            setEditingValueAr("");
            setEditingDescription("");
            setEditingPackages([]);
            setShowEditPackageDropdown(false);
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to update service");
        }
    };

    const cancelEdit = () => {
        setEditingId("");
        setEditingValueEn("");
        setEditingValueAr("");
        setEditingDescription("");
     
        setEditingPackages([]);
        setShowEditPackageDropdown(false);
    };

    const remove = async (service: Service) => {
        const confirmed = await showConfirm(t("confirm_delete_service") || "Delete this service category?", t("yes") || "Yes", t("no") || "No");
        if (!confirmed) return;

        try {
            setError("");
            await deleteServiceMutation.mutateAsync(service._id);
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to delete service");
        }
    };

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
                <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-light-400/20 blur-3xl dark:bg-light-500/10" />
                <div className="absolute -bottom-24 -left-14 h-56 w-56 rounded-full bg-secdark-700/20 blur-3xl dark:bg-secdark-700/20" />
                <div className="relative flex flex-col gap-2">
                    <span className="inline-flex w-fit items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                        Service Catalog
                    </span>
                    <h1 className="title text-2xl sm:text-3xl">{tr("Services", "Service Categories")}</h1>
                    <p className="text-light-600 dark:text-dark-300 text-sm sm:text-base">
                        {tr(
                            "manage_service_categories_sub",
                            "Manage service categories that contain items. These act as categories for your items.",
                        )}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("total_services", "Total Services")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{services.length}</p>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("total_packages", "Linked Packages")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{packages.length}</p>
                </div>
                
            </section>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            <div className="rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-light-900 dark:text-dark-50 text-lg font-semibold">
                        {tr("manage_services", "Manage Service Categories")}
                    </h2>
                    <div className="relative w-full sm:w-auto">
                        <Search className="text-light-600 dark:text-dark-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={tr("search_services", "Search services...")}
                            className="input w-full rounded-xl pr-3 pl-10 sm:w-64"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="text-light-500 dark:text-light-500 h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3">
                            {services.length > 0 ? (
                                services.map((service) => (
                                    <div
                                        key={service._id}
                                        className="flex flex-col gap-3 rounded-2xl border border-light-200/80 bg-white px-3 py-3 text-light-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-dark-700/80 dark:bg-dark-800 dark:text-dark-50 sm:flex-row sm:items-start sm:justify-between"
                                    >
                                        <div className="w-full min-w-0">
                                            {editingId === service._id ? (
                                                <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_0.8fr_1fr]">
                                                    <input
                                                        value={editingValueEn}
                                                        onChange={(e) => setEditingValueEn(e.target.value)}
                                                        onKeyDown={handleEditKeyDown}
                                                        className="input w-full"
                                                        placeholder={tr("english_label", "English")}
                                                    />
                                                    <input
                                                        value={editingValueAr}
                                                        onChange={(e) => setEditingValueAr(e.target.value)}
                                                        onKeyDown={handleEditKeyDown}
                                                        className="input w-full"
                                                        placeholder={tr("arabic_label", "Arabic")}
                                                    />
                                                    <input
                                                        value={editingDescription}
                                                        onChange={(e) => setEditingDescription(e.target.value)}
                                                        onKeyDown={handleEditKeyDown}
                                                        className="input w-full"
                                                        placeholder={tr("service_description", "Description")}
                                                    />
                                                   
                                                    <div className="relative w-full min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowEditPackageDropdown(!showEditPackageDropdown)}
                                                            onKeyDown={(e) => {
                                                                if (showEditPackageDropdown && e.key === "Enter") {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                }
                                                            }}
                                                                className="input flex w-full items-center gap-2 overflow-hidden text-left"
                                                        >
                                                                <span className="truncate">{getSelectedPackagesLabel(editingPackages)}</span>
                                                                {editingPackages.length > 0 && (
                                                                    <span className="bg-light-100 text-light-700 dark:bg-dark-700 dark:text-dark-200 ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">
                                                                        {editingPackages.length}
                                                                    </span>
                                                                )}
                                                        </button>
                                                        {showEditPackageDropdown && (
                                                            <div className="border-light-300 dark:border-dark-700 dark:bg-dark-800 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white p-2 shadow-lg">
                                                                {packages && packages.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {packages.map((pkg) => {
                                                                            const isSelected = editingPackages.some((id) =>
                                                                                typeof id === "string"
                                                                                    ? id === pkg._id
                                                                                    : (id as any)?._id === pkg._id,
                                                                            );
                                                                            return (
                                                                                <button
                                                                                    key={pkg._id}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (isSelected) {
                                                                                            setEditingPackages(
                                                                                                editingPackages.filter((id) => id !== pkg._id),
                                                                                            );
                                                                                        } else {
                                                                                            setEditingPackages([...editingPackages, pkg._id]);
                                                                                        }
                                                                                    }}
                                                                                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                                                                                        isSelected
                                                                                            ? "bg-light-500 dark:bg-secdark-700 text-white"
                                                                                            : "bg-light-100 text-light-700 hover:bg-light-200 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
                                                                                    }`}
                                                                                >
                                                                                    {lang === "ar" ? pkg.nameAr : pkg.nameEn}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-light-600 dark:text-dark-400 px-3 py-2 text-sm">
                                                                        {t("no_packages_available") || "No packages available"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full min-w-0">
                                                        <div className="w-full min-w-0">
                                                            <div className="flex min-w-0 flex-col">
                                                            <span className="text-light-900 dark:text-dark-50 text-sm font-semibold">
                                                                {lang === "ar" ? service.ar : service.en}
                                                            </span>
                                                            {service.description && (
                                                                <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                                    {service.description}
                                                                </span>
                                                            )}
                                                           
                                                            {service.packages && service.packages.length > 0 && (
                                                                <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                                    {t("packages") || "Packages"}: {service.packages.length}{" "}
                                                                    {t("selected") || "selected"}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                                            {editingId === service._id ? (
                                                <>
                                                    <button
                                                        onClick={() => saveEdit(service._id)}
                                                        disabled={isSaving}
                                                        className="btn-ghost flex items-center gap-2 rounded-xl"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="btn-ghost flex items-center gap-2 rounded-xl"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(service)}
                                                        className="btn-ghost flex items-center gap-2 rounded-xl"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => remove(service)}
                                                        className="btn-ghost text-danger-500 flex items-center gap-2 rounded-xl"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-light-600">{t("no_services_defined") || "No service categories defined yet."}</p>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="btn-ghost rounded-xl px-3 py-1 disabled:opacity-50"
                                >
                                    {t("previous") || "Previous"}
                                </button>
                                <span className="text-light-600 dark:text-dark-400 text-sm">
                                    {t("page")} {currentPage} {t("of")} {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="btn-ghost rounded-xl px-3 py-1 disabled:opacity-50"
                                >
                                    {t("next") || "Next"}
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div
                    className="mt-4 grid gap-2 lg:grid-cols-[1fr_1fr_1fr_0.8fr_0.9fr_auto]"
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === "Enter") {
                            // if user just selected a package, submit the create form
                            if (lastPackageSelectRef.current) {
                                e.preventDefault();
                                e.stopPropagation();
                                lastPackageSelectRef.current = false;
                                handleAdd();
                            }
                        }
                    }}
                >
                    <input
                        value={inputEn}
                        onChange={(e) => setInputEn(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={tr("add_service_placeholder", "Service (English)")}
                        disabled={isSaving}
                        className="input w-full disabled:opacity-50"
                    />
                    <input
                        value={inputAr}
                        onChange={(e) => setInputAr(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={tr("add_service_placeholder_arabic", "الخدمة (بالعربية)")}
                        disabled={isSaving}
                        className="input w-full disabled:opacity-50"
                    />
                    <input
                        value={inputDescription}
                        onChange={(e) => setInputDescription(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={tr("service_description", "Description")}
                        disabled={isSaving}
                        className="input w-full disabled:opacity-50"
                    />
                   
                    <div className="relative w-full">
                        <button
                            type="button"
                            onClick={() => setShowPackageDropdown(!showPackageDropdown)}
                            onKeyDown={(e) => {
                                if (showPackageDropdown && e.key === "Enter") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }}
                            disabled={isSaving}
                            className="input flex w-full items-center gap-2 overflow-hidden text-left disabled:opacity-50"
                        >
                            <span className="truncate">{getSelectedPackagesLabel(inputPackages)}</span>
                            {inputPackages.length > 0 && (
                                <span className="bg-light-100 text-light-700 dark:bg-dark-700 dark:text-dark-200 ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold">
                                    {inputPackages.length}
                                </span>
                            )}
                        </button>
                        {showPackageDropdown && !isSaving && (
                            <div className="border-light-300 dark:border-dark-700 dark:bg-dark-800 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white p-2 shadow-lg">
                                {packages && packages.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {packages.map((pkg) => {
                                            const isSelected = inputPackages.includes(pkg._id);
                                            return (
                                                <button
                                                    key={pkg._id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (ignorePackageToggleRef.current) return;
                                                        // mark that the user just selected a package
                                                        lastPackageSelectRef.current = true;
                                                        setTimeout(() => (lastPackageSelectRef.current = false), 800);
                                                        if (isSelected) {
                                                            setInputPackages(inputPackages.filter((id) => id !== pkg._id));
                                                        } else {
                                                            setInputPackages([...inputPackages, pkg._id]);
                                                        }
                                                    }}
                                                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                                                        isSelected
                                                            ? "bg-light-500 dark:bg-secdark-700 text-white"
                                                            : "bg-light-100 text-light-700 hover:bg-light-200 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
                                                    }`}
                                                >
                                                    {lang === "ar" ? pkg.nameAr : pkg.nameEn}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-light-600 dark:text-dark-400 px-3 py-2 text-sm">
                                        {t("no_packages_available") || "No packages available"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={isSaving}
                        className="btn-primary h-[42px] min-w-[110px] justify-center rounded-xl disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2
                                size={14}
                                className="text-light-500 animate-spin"
                            />
                        ) : (
                            <Plus size={14} />
                        )}
                        {t("add")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
