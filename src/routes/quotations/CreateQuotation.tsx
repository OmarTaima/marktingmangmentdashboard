import { useState, useEffect } from "react";
import { Plus, FileText, Loader2, Trash2, Check, X } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { showAlert, showToast } from "@/utils/swal";
import { useServices, useCreateQuotation, useUpdateQuotation, useItems } from "@/hooks/queries";
import { getQuotationById } from "@/api/requests/quotationsService";
import type { CustomService, CreateQuotationPayload } from "@/api/requests/quotationsService";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

interface CreateQuotationProps {
    clientId?: string;
    clientName: string;
    onBack: () => void;
    // onSuccess receives optional clientId (returned by API) to let parent navigate correctly
    onSuccess?: (clientId?: string, clientName?: string) => void;
    editQuotation?: any; // Optional quotation to edit
}

const CreateQuotation = ({ clientId, clientName, onBack, onSuccess, editQuotation }: CreateQuotationProps) => {
    const { t, lang } = useLang();

    const { data: servicesResponse, isLoading: servicesLoading } = useServices({ limit: 100 });
    const services = servicesResponse?.data || [];
    const { data: itemsResponse } = useItems({ limit: 1000 });
    const items = itemsResponse?.data || [];

    const createQuotationMutation = useCreateQuotation();
    const updateQuotationMutation = useUpdateQuotation();

    const isSaving = createQuotationMutation.isPending || updateQuotationMutation.isPending;

    // Form state
    const [selectedPackages, setSelectedPackages] = useState<string[]>(
        editQuotation?.packages?.map((p: any) => (typeof p === "string" ? p : p._id)) ||
            editQuotation?.services?.map((s: any) => (typeof s === "string" ? s : s._id)) ||
            [],
    );
    const [customServices, setCustomServices] = useState<CustomService[]>(editQuotation?.customServices || []);
    const [quotationNote, setQuotationNote] = useState<string>(editQuotation?.note || "");
    const [discountValue, setDiscountValue] = useState<string>(editQuotation?.discountValue?.toString() || "");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">(editQuotation?.discountType || "percentage");
    const [overriddenTotal] = useState<string>(editQuotation?.overriddenTotal?.toString() || "");
    const [validUntil, setValidUntil] = useState<string>(editQuotation?.validUntil ? editQuotation.validUntil.split("T")[0] : "");

    // Custom service form
    const [customServiceName, setCustomServiceName] = useState<string>("");
    const [customNameAr, setCustomNameAr] = useState<string>("");
    const [customPrice, setCustomPrice] = useState<string>("");

    // For clientName input (for custom quotations)
    const [enteredClientName, setEnteredClientName] = useState<string>(editQuotation?.clientName || "");

    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

    const toggleExpandService = (serviceId: string) => {
        setExpandedServiceId((prev) => (prev === serviceId ? null : serviceId));
    };

    // For tabbed services (like CustomQuotation) we show a single service's packages at a time
    const servicesWithPackages = services.filter((s: any) => s.packages && s.packages.length > 0);

    useEffect(() => {
        if (!expandedServiceId && servicesWithPackages.length > 0) {
            setExpandedServiceId(servicesWithPackages[0]._id);
        }
    }, [servicesWithPackages]);

    const togglePackage = (packageId: string) => {
        if (selectedPackages.includes(packageId)) {
            setSelectedPackages(selectedPackages.filter((id) => id !== packageId));
        } else {
            setSelectedPackages([...selectedPackages, packageId]);
        }
    };

    const addCustomService = () => {
        const name = customServiceName.trim();
        const nameAr = customNameAr.trim();
        const price = parseFloat(customPrice);

        if (!name && !nameAr) return;
        if (isNaN(price) || price <= 0) return;

        const newCustomService: CustomService = {
            id: `custom_${Date.now()}`,
            en: name || nameAr,
            ar: nameAr || name,
            price,
        };

        setCustomServices([...customServices, newCustomService]);
        setCustomServiceName("");
        setCustomNameAr("");
        setCustomPrice("");
    };

    const removeCustomService = (id: string) => {
        setCustomServices(customServices.filter((s) => s.id !== id));
    };

    const calculateSubtotal = () => {
        const allPackages = services.flatMap((s: any) => s.packages || []);
        const servicesTotal = selectedPackages.reduce((sum, pkgId) => {
            const pkg = allPackages.find((p: any) => p._id === pkgId);
            return sum + (pkg?.price || 0);
        }, 0);

        const customServicesTotal = customServices.reduce((sum, customService) => {
            return sum + customService.price;
        }, 0);

        return servicesTotal + customServicesTotal;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const discount = parseFloat(discountValue) || 0;

        let discountAmount = 0;
        if (discountType === "percentage") {
            discountAmount = (subtotal * discount) / 100;
        } else {
            discountAmount = Math.min(discount, subtotal);
        }

        return subtotal - discountAmount;
    };

    const handleCreateOrUpdateQuotation = async () => {
        // Require selecting at least one package before creating a quotation
        if (selectedPackages.length === 0) {
            showAlert(t("please_select_package") || "Please select at least one package", "warning");
            return;
        }

        // For custom quotations (no clientId), require clientName
        if (!clientId && !enteredClientName.trim()) {
            showAlert(t("please_enter_client_name") || "Please enter client name", "warning");
            return;
        }

        try {
            const packageIds = selectedPackages.map((s) => (typeof s === "string" ? s : (s as any)._id || s));

            const payload: CreateQuotationPayload = {
                packages: packageIds.length > 0 ? packageIds : undefined,
                customServices: customServices.length > 0 ? customServices : undefined,
                clientName: clientId ? undefined : enteredClientName || undefined,
                discountValue: parseFloat(discountValue) || 0,
                discountType,
                note: quotationNote || undefined,
                validUntil: validUntil || undefined,
            };

            // Include clientId only if provided (not custom quotation)
            if (clientId && clientId !== "global") {
                payload.clientId = clientId;
            }

            if (overriddenTotal) {
                payload.overriddenTotal = parseFloat(overriddenTotal);
            }

            // capture result from API so we can obtain the created/updated quotation (and its clientId)
            let result: any = null;
            if (editQuotation?._id) {
                result = await updateQuotationMutation.mutateAsync({ id: editQuotation._id, payload });
                showToast(t("quotation_updated_successfully") || "Quotation updated successfully!", "success");
            } else {
                result = await createQuotationMutation.mutateAsync(payload);
                showToast(t("quotation_created_successfully") || "Quotation created successfully!", "success");
            }

            // API returns { data: Quotation } in many endpoints; normalize to the actual quotation
            const createdOrUpdated = result?.data ?? result;

            // DEBUG: log the created/updated payload so we can trace clientId/_id
            // (temporary - will remove once issue is diagnosed)

            // Helper to normalize client id whether API returned string or full client object
            const extractClientId = (maybe: any): string | undefined => {
                if (!maybe) return undefined;
                if (typeof maybe === "string") return maybe;
                if (typeof maybe === "object") return maybe._id ?? maybe.id ?? undefined;
                return undefined;
            };

            // Prefer clientId from API result, fallback to passed clientId
            let resultingClientId = extractClientId(createdOrUpdated?.clientId) ?? extractClientId(clientId);

            const navClientName = createdOrUpdated?.clientName ?? clientName ?? enteredClientName;

            // If we still don't have a clientId but the API returned a quotation id, try fetching the full quotation
            if (!resultingClientId && createdOrUpdated?._id) {
                try {
                    const full = await getQuotationById(createdOrUpdated._id);
                    const fullData = full?.data ?? full;
                    resultingClientId = extractClientId(fullData?.clientId) ?? resultingClientId;
                } catch (e) {
                    // ignore — we'll fallback to navClientName or stub behavior
                }
            }

            if (onSuccess) {
                onSuccess(resultingClientId, navClientName);
            } else {
                onBack();
            }
        } catch (error: any) {
            showAlert(error.response?.data?.message || t("failed_to_save_quotation") || "Failed to save quotation", "error");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
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
                            {editQuotation ? t("edit_quotation") || "Edit Quotation" : t("create_quotation") || "Create Quotation"}
                        </h2>
                        <p className="text-light-600 dark:text-dark-50 text-sm">{clientName}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                {/* Client Name Input (for custom quotations) */}
                {!clientId && (
                    <div className="mb-6">
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm font-semibold">
                            {t("client_name") || "Client Name"} *
                        </label>
                        <input
                            type="text"
                            value={enteredClientName}
                            onChange={(e) => setEnteredClientName(e.target.value)}
                            placeholder={t("enter_client_name") || "Enter client name..."}
                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                        />
                    </div>
                )}

                {/* Services & Packages Selection */}
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
                        <div>
                            {servicesWithPackages.length > 0 ? (
                                <>
                                    <div className="mb-4 flex gap-2 overflow-auto">
                                        {servicesWithPackages.map((service) => {
                                            const selectedCount = (service.packages ?? []).filter((pkg: any) =>
                                                selectedPackages.includes(pkg._id),
                                            ).length;
                                            const isActive = expandedServiceId === service._id;
                                            return (
                                                <button
                                                    key={service._id}
                                                    onClick={() => setExpandedServiceId(service._id)}
                                                    className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-shadow ${
                                                        isActive
                                                            ? "bg-light-500 dark:bg-secdark-700 text-white"
                                                            : "text-light-900 dark:bg-dark-800 dark:text-dark-50 border bg-white"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span>{lang === "ar" ? service.ar : service.en}</span>
                                                        <span className="bg-light-600 rounded-full px-2 py-0.5 text-xs text-white">
                                                            {service.packages?.length ?? 0}
                                                        </span>
                                                        {selectedCount > 0 && <span className="ml-1 text-xs">{selectedCount} selected</span>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {expandedServiceId &&
                                        (() => {
                                            const selectedService = servicesWithPackages.find((s: any) => s._id === expandedServiceId);
                                            if (!selectedService) return null;
                                            return (
                                                <div className="dark:bg-dark-900 border-light-600 dark:border-dark-700 border-t bg-white px-0 py-3">
                                                    <div className="grid grid-cols-1 gap-2 px-4 sm:grid-cols-2 lg:grid-cols-3">
                                                        {(selectedService.packages || []).map((pkg: any) => {
                                                            const isSelected = selectedPackages.includes(pkg._id);
                                                            const pkgItems: Array<{ label: string; quantity?: number | string | boolean }> = (
                                                                pkg.items || []
                                                            ).map((it: any) => {
                                                                const inner = (it && (it.item || it)) || {};
                                                                let name = inner?.name || inner?.nameEn || inner?.nameAr || "(item)";
                                                                const quantity = typeof it?.quantity !== "undefined" ? it.quantity : inner?.quantity;

                                                                if ((!name || name === "(item)") && inner) {
                                                                    const itemId = typeof inner === "string" ? inner : inner?._id || inner?.id;
                                                                    if (itemId) {
                                                                        const found = items.find(
                                                                            (i: any) =>
                                                                                String(i._id) === String(itemId) || String(i.id) === String(itemId),
                                                                        );
                                                                        if (found) name = found.name || found.ar || name;
                                                                    }
                                                                }

                                                                return { label: name || "(item)", quantity };
                                                            });

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
                                                                            {pkgItems.length > 0 && (
                                                                                <div className="mt-2">
                                                                                    <div
                                                                                        className={`flex flex-wrap gap-2 ${isSelected ? "text-white/90" : "text-light-600 dark:text-dark-400"}`}
                                                                                    >
                                                                                        {pkgItems.map((itObj, idx) => {
                                                                                            const quantity = itObj.quantity;
                                                                                            return (
                                                                                                <div
                                                                                                    key={idx}
                                                                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                                                                                                        isSelected
                                                                                                            ? "bg-white/10 text-white"
                                                                                                            : "bg-light-50 text-light-900 dark:bg-dark-700 dark:text-dark-50"
                                                                                                    }`}
                                                                                                >
                                                                                                    <span className="truncate">{itObj.label}</span>
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
                                                                                                                        className="text-red-600"
                                                                                                                    />
                                                                                                                )}
                                                                                                            </span>
                                                                                                        ) : typeof quantity === "number" ? (
                                                                                                            <span className="bg-light-100 dark:bg-dark-700 text-light-900 dark:text-dark-50 ml-2 inline-block rounded-md px-2 py-0.5 text-xs">
                                                                                                                x{quantity}
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <span className="bg-light-100 dark:bg-dark-700 text-light-900 dark:text-dark-50 ml-2 inline-block rounded-md px-2 py-0.5 text-xs">
                                                                                                                {String(quantity)}
                                                                                                            </span>
                                                                                                        ))}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
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
                                            );
                                        })()}
                                </>
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
                                                            <div className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                                                                {service.description}
                                                            </div>
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
                                                                const pkgItems: Array<{ label: string; quantity?: number | string | boolean }> = (
                                                                    pkg.items || []
                                                                ).map((it: any) => {
                                                                    const inner = (it && (it.item || it)) || {};
                                                                    let name = inner?.name || inner?.nameEn || inner?.nameAr || "(item)";
                                                                    const quantity =
                                                                        typeof it?.quantity !== "undefined" ? it.quantity : inner?.quantity;

                                                                    if ((!name || name === "(item)") && inner) {
                                                                        const itemId = typeof inner === "string" ? inner : inner?._id || inner?.id;
                                                                        if (itemId) {
                                                                            const found = items.find(
                                                                                (i: any) =>
                                                                                    String(i._id) === String(itemId) ||
                                                                                    String(i.id) === String(itemId),
                                                                            );
                                                                            if (found) name = found.name || found.ar || name;
                                                                        }
                                                                    }

                                                                    return { label: name || "(item)", quantity };
                                                                });

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
                                                                                {pkgItems.length > 0 && (
                                                                                    <div
                                                                                        className={`mt-2 text-xs ${isSelected ? "text-white opacity-90" : "text-light-600 dark:text-dark-400"}`}
                                                                                    >
                                                                                        <div
                                                                                            className={`flex flex-wrap gap-2 ${isSelected ? "text-white/90" : "text-light-600 dark:text-dark-400"}`}
                                                                                        >
                                                                                            {pkgItems.map((itObj, idx) => {
                                                                                                const quantity = itObj.quantity;
                                                                                                return (
                                                                                                    <div
                                                                                                        key={idx}
                                                                                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                                                                                                            isSelected
                                                                                                                ? "bg-white/10 text-white"
                                                                                                                : "bg-light-50 text-light-900 dark:bg-dark-700 dark:text-dark-50"
                                                                                                        }`}
                                                                                                    >
                                                                                                        <span className="truncate">
                                                                                                            {itObj.label}
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
                                                                                                                            className="text-red-600"
                                                                                                                        />
                                                                                                                    )}
                                                                                                                </span>
                                                                                                            ) : typeof quantity === "number" ? (
                                                                                                                <span className="bg-light-100 dark:bg-dark-700 text-light-900 dark:text-dark-50 ml-2 inline-block rounded-md px-2 py-0.5 text-xs">
                                                                                                                    x{quantity}
                                                                                                                </span>
                                                                                                            ) : (
                                                                                                                <span className="bg-light-100 dark:bg-dark-700 text-light-900 dark:text-dark-50 ml-2 inline-block rounded-md px-2 py-0.5 text-xs">
                                                                                                                    {String(quantity)}
                                                                                                                </span>
                                                                                                            ))}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
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
                    )}
                </div>

                {/* Custom Services */}
                <div className="mb-6">
                    <h4 className="text-light-900 dark:text-dark-50 mb-3 font-semibold">{t("custom_services") || "Custom Services"}</h4>

                    {customServices.length > 0 && (
                        <div className="mb-3 space-y-2">
                            {customServices.map((customService) => (
                                <div
                                    key={customService.id}
                                    className="border-light-600 dark:border-dark-700 bg-light-50 dark:bg-dark-800 flex items-center justify-between rounded-lg border px-4 py-2"
                                >
                                    <div>
                                        <div className="text-light-900 dark:text-dark-50 font-medium">
                                            {lang === "ar" ? customService.ar : customService.en}
                                        </div>
                                        <div className="text-light-600 dark:text-dark-400 text-sm">
                                            {customService.price} {lang === "ar" ? "ج.م" : "EGP"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeCustomService(customService.id)}
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

                {/* Quotation Details */}
                <div className="mb-6 grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("valid_until") || "Valid Until"}</label>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                value={validUntil ? dayjs(validUntil) : null}
                                onChange={(newVal: Dayjs | null) => setValidUntil(newVal ? newVal.format("YYYY-MM-DD") : "")}
                                slotProps={{
                                    textField: {
                                        size: "small",
                                        className:
                                            "border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-white dark:bg-dark-800 px-3 py-2 text-sm",
                                        sx: {
                                            // explicit colors using project CSS variables
                                            color: "var(--color-light-900)",
                                            ".dark &": {
                                                color: "var(--color-dark-50)",
                                            },
                                            "& .MuiInputBase-input": {
                                                padding: "8px 12px",
                                                fontSize: "0.875rem",
                                                color: "var(--color-light-900)",
                                                ".dark &": {
                                                    color: "var(--color-dark-50)",
                                                },
                                            },
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "0.5rem",
                                                "& .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "var(--color-light-600)",
                                                },
                                                ".dark & .MuiOutlinedInput-notchedOutline": {
                                                    borderColor: "var(--color-dark-700)",
                                                },
                                            },
                                            "& .MuiInputBase-input::placeholder": {
                                                color: "var(--color-light-900)",
                                                opacity: 0.6,
                                            },
                                            ".dark & .MuiInputBase-input::placeholder": {
                                                color: "var(--color-dark-50)",
                                                opacity: 0.6,
                                            },
                                            // calendar icon / svg
                                            "& .MuiSvgIcon-root": {
                                                color: "var(--color-light-900)",
                                            },
                                            ".dark & .MuiSvgIcon-root": {
                                                color: "var(--color-dark-50)",
                                            },
                                            "& .MuiInputAdornment-root svg": {
                                                color: "var(--color-light-900)",
                                            },
                                            ".dark & .MuiInputAdornment-root svg": {
                                                color: "var(--color-dark-50)",
                                            },
                                        },
                                    },
                                }}
                            />
                        </LocalizationProvider>
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("note") || "Note"}</label>
                        <textarea
                            value={quotationNote}
                            onChange={(e) => setQuotationNote(e.target.value)}
                            placeholder={t("quotation_note_placeholder") || "Add any additional notes..."}
                            rows={3}
                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                {/* Discount and Total Override */}
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("discount_type") || "Discount Type"}</label>
                        <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
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
                            placeholder={discountType === "percentage" ? "0-100" : t("amount") || "Amount"}
                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                {/* Summary and Actions */}
                <div className="border-light-600 dark:border-dark-700 flex items-center justify-between border-t pt-4">
                    <div>
                        <p className="text-light-900 dark:text-dark-50 text-base">
                            {t("subtotal") || "Subtotal"}: {calculateSubtotal().toFixed(2)} {lang === "ar" ? "ج.م" : "EGP"}
                        </p>
                        {discountValue && parseFloat(discountValue) > 0 && (
                            <p className="text-light-600 dark:text-dark-400 text-sm">
                                {t("discount") || "Discount"}:{" "}
                                {discountType === "percentage" ? `${discountValue}%` : `${discountValue} ${lang === "ar" ? "ج.م" : "EGP"}`}
                            </p>
                        )}
                        <p className="text-light-900 dark:text-dark-50 text-lg font-bold">
                            {t("total") || "Total"}: {overriddenTotal || calculateTotal().toFixed(2)} {lang === "ar" ? "ج.م" : "EGP"}
                            {overriddenTotal && (
                                <span className="text-light-600 dark:text-dark-400 ml-2 text-sm">({t("overridden") || "overridden"})</span>
                            )}
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
                            onClick={handleCreateOrUpdateQuotation}
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
                            {editQuotation ? t("update_quotation") || "Update Quotation" : t("create_quotation") || "Create Quotation"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateQuotation;
