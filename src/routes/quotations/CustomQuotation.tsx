import { useState } from "react";
import { Plus, FileText, Loader2, Trash2 } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { showAlert, showToast } from "@/utils/swal";
import { useServices, useCreateQuotation } from "@/hooks/queries";
import type { CustomService, CreateQuotationPayload } from "@/api/requests/quotationsService";

interface CustomQuotationProps {
    clientName: string;
    onBack: () => void;
    // onSuccess receives optional clientId (if returned by API)
    onSuccess?: (clientId?: string, clientName?: string) => void; // Called after successful create
}

const CustomQuotation = ({ clientName, onBack, onSuccess }: CustomQuotationProps) => {
    const { t, lang } = useLang();

    const { data: servicesResponse, isLoading: servicesLoading } = useServices({ limit: 100 });
    const services = servicesResponse?.data || [];

    const createQuotationMutation = useCreateQuotation();
    const isSaving = createQuotationMutation.isPending;

    const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
    const [customServices, setCustomServices] = useState<CustomService[]>([]);
    const [enteredClientName, setEnteredClientName] = useState<string>(clientName || "");
    const [quotationNote, setQuotationNote] = useState<string>("");
    const [discountValue, setDiscountValue] = useState<string>("");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
    const [validUntil, setValidUntil] = useState<string>("");

    const [customServiceName, setCustomServiceName] = useState<string>("");
    const [customNameAr, setCustomNameAr] = useState<string>("");
    const [customPrice, setCustomPrice] = useState<string>("");
    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

    const toggleExpandService = (serviceId: string) => {
        setExpandedServiceId((prev) => (prev === serviceId ? null : serviceId));
    };

    const togglePackage = (packageId: string) => {
        if (selectedPackages.includes(packageId)) setSelectedPackages(selectedPackages.filter((id) => id !== packageId));
        else setSelectedPackages([...selectedPackages, packageId]);
    };

    const addCustomService = () => {
        const name = customServiceName.trim();
        const nameAr = customNameAr.trim();
        const price = parseFloat(customPrice);
        if ((!name && !nameAr) || isNaN(price) || price <= 0) return;

        const newCustomService: CustomService = { id: `custom_${Date.now()}`, en: name || nameAr, ar: nameAr || name, price };
        setCustomServices([...customServices, newCustomService]);
        setCustomServiceName("");
        setCustomNameAr("");
        setCustomPrice("");
    };

    const removeCustomService = (id: string) => setCustomServices(customServices.filter((s) => s.id !== id));

    const calculateSubtotal = () => {
        const allPackages = services.flatMap((s: any) => s.packages || []);
        const packagesTotal = selectedPackages.reduce((sum, pkgId) => {
            const pkg = allPackages.find((p: any) => p._id === pkgId);
            return sum + (pkg?.price || 0);
        }, 0);
        const customTotal = customServices.reduce((sum, s) => sum + s.price, 0);
        return packagesTotal + customTotal;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discount = parseFloat(discountValue) || 0;
        let discountAmount = 0;
        if (discountType === "percentage") discountAmount = (subtotal * discount) / 100;
        else discountAmount = Math.min(discount, subtotal);
        return subtotal - discountAmount;
    };

    const handleCreate = async () => {
        if (selectedPackages.length === 0 && customServices.length === 0) {
            showAlert(t("please_select_services") || "Please select at least one service", "warning");
            return;
        }

        if (!enteredClientName.trim()) {
            showAlert(t("please_enter_client_name") || "Please enter client name", "warning");
            return;
        }

        try {
            const payload: CreateQuotationPayload = {
                packages: selectedPackages.length > 0 ? selectedPackages : undefined,
                customServices: customServices.length > 0 ? customServices : undefined,
                clientName: enteredClientName,
                discountValue: parseFloat(discountValue) || 0,
                discountType,
                note: quotationNote || undefined,
                validUntil: validUntil || undefined,
            };

            const result: any = await createQuotationMutation.mutateAsync(payload);
            showToast(t("quotation_created_successfully") || "Quotation created successfully!", "success");

            const created = result?.data ?? result;
            const resultingClientId = created?.clientId ?? created?.client?._id;
            const navName = created?.clientName ?? clientName;
            if (onSuccess) {
                onSuccess(resultingClientId, navName);
            } else {
                onBack();
            }
        } catch (error: any) {
            showAlert(error.response?.data?.message || t("failed_to_save_quotation") || "Failed to save quotation", "error");
        }
    };

    return (
        <div className="space-y-6">
            <div className="card bg-dark-50 dark:bg-dark-800/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="btn-ghost"
                    >
                        <LocalizedArrow size={20} />
                    </button>
                    <div>
                        <h2 className="text-light-900 dark:text-dark-50 text-xl font-bold">
                            {t("create_custom_quotation") || "Create Custom Quotation"}
                        </h2>
                        <p className="text-light-600 dark:text-dark-50 text-sm">{enteredClientName}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="mb-6">
                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm font-semibold">{t("client_name") || "Client Name"} *</label>
                    <input
                        type="text"
                        value={enteredClientName}
                        onChange={(e) => setEnteredClientName(e.target.value)}
                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                    />
                </div>

                <div className="mb-6">
                    <h4 className="text-light-900 dark:text-dark-50 mb-3 font-semibold">{t("select_services") || "Select Services"}</h4>
                    {servicesLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2
                                className="text-light-500 animate-spin"
                                size={32}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {services.map((service) => {
                                const isExpanded = expandedServiceId === service._id;
                                const hasPackages = service.packages && service.packages.length > 0;
                                const selectedCount = hasPackages
                                    ? (service.packages ?? []).filter((pkg: any) => selectedPackages.includes(pkg._id)).length
                                    : 0;

                                return (
                                    <div
                                        key={service._id}
                                        className="border-light-600 dark:border-dark-700 bg-light-50 dark:bg-dark-800 overflow-hidden rounded-lg border"
                                    >
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-light-900 dark:text-dark-50 text-base font-semibold">
                                                        {lang === "ar" ? service.ar : service.en}
                                                    </div>
                                                    {selectedCount > 0 && (
                                                        <span className="bg-light-500 dark:bg-secdark-700 rounded-full px-2 py-0.5 text-xs font-medium text-white">
                                                            {selectedCount} {t("selected") || "selected"}
                                                        </span>
                                                    )}
                                                </div>
                                                {service.description && (
                                                    <div className="text-light-600 dark:text-dark-400 mt-1 text-sm">{service.description}</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {service.price != null && (
                                                    <div className="text-light-900 dark:text-dark-50 text-sm font-medium">
                                                        {service.price} {lang === "ar" ? "ج.م" : "EGP"}
                                                    </div>
                                                )}
                                                {hasPackages && (
                                                    <button
                                                        onClick={() => toggleExpandService(service._id)}
                                                        className="btn-primary text-sm"
                                                    >
                                                        {isExpanded
                                                            ? t("hide_packages") || "Hide"
                                                            : `${t("view") || "View"} ${service.packages?.length || 0} ${t("packages") || "packages"}`}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && hasPackages && (
                                            <div className="dark:bg-dark-900 border-light-600 dark:border-dark-700 border-t bg-white px-4 py-3">
                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {(service.packages || []).map((pkg: any) => {
                                                        const isSelected = selectedPackages.includes(pkg._id);
                                                        return (
                                                            <div
                                                                key={pkg._id}
                                                                onClick={() => togglePackage(pkg._id)}
                                                                className={`cursor-pointer rounded-lg border px-3 py-3 transition-all hover:shadow-md ${
                                                                    isSelected
                                                                        ? "border-light-500 bg-light-500 dark:bg-secdark-700 dark:border-secdark-700 text-white shadow-sm"
                                                                        : "border-light-600 dark:border-dark-700 dark:bg-dark-800 text-light-900 dark:text-dark-50 hover:border-light-500 dark:hover:border-secdark-700 bg-white"
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div
                                                                            className={`mb-1 text-sm font-medium ${isSelected ? "text-white" : "text-light-900 dark:text-dark-50"}`}
                                                                        >
                                                                            {lang === "ar" ? pkg.nameAr : pkg.nameEn}
                                                                        </div>
                                                                        {pkg.description && (
                                                                            <div
                                                                                className={`line-clamp-2 text-xs ${isSelected ? "text-white opacity-90" : "text-light-600 dark:text-dark-400"}`}
                                                                            >
                                                                                {pkg.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div
                                                                        className={`text-sm font-semibold whitespace-nowrap ${isSelected ? "text-white" : "text-light-900 dark:text-dark-50"}`}
                                                                    >
                                                                        {pkg.price} {lang === "ar" ? "ج.م" : "EGP"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <h4 className="text-light-900 dark:text-dark-50 mb-3 font-semibold">{t("custom_services") || "Custom Services"}</h4>
                    {customServices.length > 0 && (
                        <div className="mb-3 space-y-2">
                            {customServices.map((cs) => (
                                <div
                                    key={cs.id}
                                    className="border-light-600 dark:border-dark-700 bg-light-50 dark:bg-dark-800 flex items-center justify-between rounded-lg border px-4 py-2"
                                >
                                    <div>
                                        <div className="text-light-900 dark:text-dark-50 font-medium">{lang === "ar" ? cs.ar : cs.en}</div>
                                        <div className="text-light-600 dark:text-dark-400 text-sm">
                                            {cs.price} {lang === "ar" ? "ج.م" : "EGP"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeCustomService(cs.id)}
                                        className="btn-ghost text-danger-500"
                                        title={t("remove") || "Remove"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-wrap items-end gap-2">
                        <div className="min-w-[150px] flex-1">
                            <input
                                type="text"
                                value={customServiceName}
                                onChange={(e) => setCustomServiceName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCustomService();
                                    }
                                }}
                                placeholder={t("service_name_en") || "Service name (English)"}
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="min-w-[150px] flex-1">
                            <input
                                type="text"
                                value={customNameAr}
                                onChange={(e) => setCustomNameAr(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCustomService();
                                    }
                                }}
                                placeholder={t("service_name_ar") || "اسم الخدمة (بالعربية)"}
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="w-32">
                            <input
                                type="number"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addCustomService();
                                    }
                                }}
                                placeholder={t("price") || "Price"}
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={addCustomService}
                            className="btn-ghost flex items-center gap-2 px-3 py-2"
                        >
                            <Plus size={14} />
                            {t("add") || "Add"}
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("valid_until") || "Valid Until"}</label>
                        <input
                            type="date"
                            value={validUntil}
                            onChange={(e) => setValidUntil(e.target.value)}
                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("note") || "Note"}</label>
                        <textarea
                            value={quotationNote}
                            onChange={(e) => setQuotationNote(e.target.value)}
                            rows={3}
                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("discount_type") || "Discount Type"}</label>
                        <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as any)}
                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                        >
                            <option value="percentage">{t("percentage") || "Percentage"}</option>
                            <option value="fixed">{t("fixed") || "Fixed Amount"}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("discount_value") || "Discount Value"}</label>
                        <input
                            type="number"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                <div className="border-light-600 dark:border-dark-700 flex items-center justify-between border-t pt-4">
                    <div>
                        <p className="text-light-900 dark:text-dark-50 text-base">
                            {t("subtotal") || "Subtotal"}: {calculateSubtotal().toFixed(2)} {lang === "ar" ? "ج.م" : "EGP"}
                        </p>
                        <p className="text-light-900 dark:text-dark-50 text-lg font-bold">
                            {t("total") || "Total"}: {calculateTotal().toFixed(2)} {lang === "ar" ? "ج.م" : "EGP"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onBack}
                            className="btn-ghost"
                        >
                            {t("cancel") || "Cancel"}
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={isSaving}
                            className="btn-primary flex items-center gap-2"
                        >
                            {isSaving ? (
                                <Loader2
                                    size={16}
                                    className="text-light-500 animate-spin"
                                />
                            ) : (
                                <FileText size={16} />
                            )}
                            {t("create_quotation") || "Create Quotation"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomQuotation;
