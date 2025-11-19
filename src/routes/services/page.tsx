import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Loader2, Search } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useServices, useCreateService, useUpdateService, useDeleteService, usePackages } from "@/hooks/queries";
import type { Service } from "@/api/requests/servicesService";

const ServicesPage = () => {
    const { t, lang } = useLang();
    const [inputEn, setInputEn] = useState<string>("");
    const [inputAr, setInputAr] = useState<string>("");
    const [inputDescription, setInputDescription] = useState<string>("");
    const [inputPrice, setInputPrice] = useState<string>("");
    const [inputPackages, setInputPackages] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string>("");
    const [editingValueEn, setEditingValueEn] = useState<string>("");
    const [editingValueAr, setEditingValueAr] = useState<string>("");
    const [editingDescription, setEditingDescription] = useState<string>("");
    const [editingPrice, setEditingPrice] = useState<string>("");
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

    const handleAdd = async () => {
        const en = (inputEn || "").trim();
        const ar = (inputAr || "").trim();
        const desc = (inputDescription || "").trim();
        const price = inputPrice ? parseFloat(inputPrice) : undefined;

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
                price,
                packages: inputPackages.length > 0 ? inputPackages : undefined,
            });
            setInputEn("");
            setInputAr("");
            setInputDescription("");
            setInputPrice("");
            setInputPackages([]);
            setShowPackageDropdown(false);
            setInputPackages([]);
        } catch (e: any) {
            console.error("Error creating service:", e);
            setError(e.response?.data?.message || "Failed to create service");
        }
    };

    const startEdit = (service: Service) => {
        setEditingId(service._id);
        setEditingValueEn(service.en || "");
        setEditingValueAr(service.ar || "");
        setEditingDescription(service.description || "");
        setEditingPrice(service.price?.toString() || "");
        setEditingPackages((service as any).packages || []);
    };

    const saveEdit = async (id: string) => {
        const en = (editingValueEn || "").trim();
        const ar = (editingValueAr || "").trim();
        const desc = (editingDescription || "").trim();
        const price = editingPrice ? parseFloat(editingPrice) : undefined;

        if (!en || !ar) {
            setError(t("service_name_required") || "English and Arabic names are required");
            return;
        }

        try {
            setError("");
            await updateServiceMutation.mutateAsync({
                id,
                data: {
                    en,
                    ar,
                    description: desc || undefined,
                    price,
                    packages: editingPackages.length > 0 ? editingPackages : undefined,
                },
            });
            setEditingId("");
            setEditingValueEn("");
            setEditingValueAr("");
            setEditingDescription("");
            setEditingPrice("");
            setEditingPackages([]);
            setShowEditPackageDropdown(false);
        } catch (e: any) {
            console.error("Error updating service:", e);
            setError(e.response?.data?.message || "Failed to update service");
        }
    };

    const cancelEdit = () => {
        setEditingId("");
        setEditingValueEn("");
        setEditingValueAr("");
        setEditingDescription("");
        setEditingPrice("");
        setEditingPackages([]);
        setShowEditPackageDropdown(false);
    };

    const remove = async (service: Service) => {
        if (!confirm(t("confirm_delete_service") || "Delete this service category?")) return;

        try {
            setError("");
            await deleteServiceMutation.mutateAsync(service._id);
        } catch (e: any) {
            console.error("Error deleting service:", e);
            setError(e.response?.data?.message || "Failed to delete service");
        }
    };

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("Services") || "Service Categories"}</h1>
                    <p className="text-light-600 dark:text-dark-400">
                        {t("manage_service_categories_sub") ||
                            "Manage service categories that contain items. These act as categories for your items."}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            <div className="card">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="card-title">{t("manage_services") || "Manage Service Categories"}</h2>
                    <div className="relative">
                        <Search className="text-light-600 dark:text-dark-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t("search_services") || "Search services..."}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-64 rounded-lg border bg-white py-2 pr-3 pl-10 text-sm transition-colors focus:outline-none"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="text-light-500 dark:text-dark-400 h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3">
                            {services.length > 0 ? (
                                services.map((service) => (
                                    <div
                                        key={service._id}
                                        className="border-light-600 text-light-900 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-50 flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                                    >
                                        <div className="flex w-full items-center gap-3">
                                            {editingId === service._id ? (
                                                <div className="flex w-full gap-2">
                                                    <input
                                                        value={editingValueEn}
                                                        onChange={(e) => setEditingValueEn(e.target.value)}
                                                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                        placeholder={t("english_label") || "English"}
                                                    />
                                                    <input
                                                        value={editingValueAr}
                                                        onChange={(e) => setEditingValueAr(e.target.value)}
                                                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                        placeholder={t("arabic_label") || "Arabic"}
                                                    />
                                                    <input
                                                        value={editingDescription}
                                                        onChange={(e) => setEditingDescription(e.target.value)}
                                                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none"
                                                        placeholder={t("service_description") || "Description"}
                                                    />
                                                    <input
                                                        value={editingPrice}
                                                        onChange={(e) => setEditingPrice(e.target.value)}
                                                        type="number"
                                                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/5 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none"
                                                        placeholder={t("price") || "Price"}
                                                    />
                                                    <div className="relative w-1/5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowEditPackageDropdown(!showEditPackageDropdown)}
                                                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-2 py-2 text-left text-sm transition-colors focus:outline-none"
                                                        >
                                                            {editingPackages.length > 0
                                                                ? `${editingPackages.length} ${t("selected") || "selected"}`
                                                                : t("select_packages") || "Select packages"}
                                                        </button>
                                                        {showEditPackageDropdown && (
                                                            <div className="border-light-300 dark:border-dark-700 dark:bg-dark-800 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white p-2 shadow-lg">
                                                                {packages && packages.length > 0 ? (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {packages.map((pkg) => {
                                                                            const isSelected = editingPackages.includes(pkg._id);
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
                                                <div className="flex w-full">
                                                    <div className="flex w-full items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-light-900 dark:text-dark-50 text-sm font-semibold">
                                                                {lang === "ar" ? service.ar : service.en}
                                                            </span>
                                                            {service.description && (
                                                                <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                                    {service.description}
                                                                </span>
                                                            )}
                                                            {service.price !== undefined && (
                                                                <span className="text-light-600 dark:text-dark-400 mt-1 text-xs font-semibold">
                                                                    {t("starting_price") || "Starting Price"}: {service.price}
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
                                        <div className="flex items-center gap-2">
                                            {editingId === service._id ? (
                                                <>
                                                    <button
                                                        onClick={() => saveEdit(service._id)}
                                                        disabled={isSaving}
                                                        className="btn-ghost flex items-center gap-2"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="btn-ghost flex items-center gap-2"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(service)}
                                                        className="btn-ghost flex items-center gap-2"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => remove(service)}
                                                        className="btn-ghost text-danger-500 flex items-center gap-2"
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

                <div className="mt-4 flex gap-2">
                    <input
                        value={inputEn}
                        onChange={(e) => setInputEn(e.target.value)}
                        placeholder={t("add_service_placeholder") || "Service (English)"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <input
                        value={inputAr}
                        onChange={(e) => setInputAr(e.target.value)}
                        placeholder={t("add_service_placeholder_arabic") || "الخدمة (بالعربية)"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <input
                        value={inputDescription}
                        onChange={(e) => setInputDescription(e.target.value)}
                        placeholder={t("service_description") || "Description"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <input
                        value={inputPrice}
                        onChange={(e) => setInputPrice(e.target.value)}
                        type="number"
                        placeholder={t("price") || "Price (optional)"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/5 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <div className="relative w-1/5">
                        <button
                            type="button"
                            onClick={() => setShowPackageDropdown(!showPackageDropdown)}
                            disabled={isSaving}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-2 py-2 text-left text-sm transition-colors focus:outline-none disabled:opacity-50"
                        >
                            {inputPackages.length > 0
                                ? `${inputPackages.length} ${t("selected") || "selected"}`
                                : t("select_packages") || "Select packages"}
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
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2
                                size={14}
                                className="animate-spin"
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
