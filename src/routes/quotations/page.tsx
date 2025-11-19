import { useState } from "react";
import { Plus, FileText, Loader2, Check, Trash2, Edit2, Download, FileCheck, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import {
    useClients,
    useServices,
    useQuotations,
    useCreateQuotation,
    useUpdateQuotation,
    useDeleteQuotation,
    useConvertQuotationToContract,
} from "@/hooks/queries";
import type { Client } from "@/api/interfaces/clientinterface";
import type { Quotation, CustomService, CreateQuotationPayload } from "@/api/requests/quotationsService";
import { printQuotation } from "@/utils/quotationPdfGenerator";

const QuotationsPage = () => {
    const { t, lang } = useLang();

    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize] = useState<number>(20);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    // React Query hooks for data fetching
    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: servicesResponse, isLoading: servicesLoading } = useServices({ limit: 100 });
    const services = servicesResponse?.data || [];

    const { data: quotationsResponse, isLoading: quotationsLoading } = useQuotations(
        selectedClientId
            ? {
                  clientId: selectedClientId,
                  page: currentPage,
                  limit: pageSize,
                  status: statusFilter || undefined,
              }
            : undefined,
    );
    const quotations = quotationsResponse?.data || [];
    const totalQuotations = quotationsResponse?.meta?.total || 0;

    // React Query mutations
    const createQuotationMutation = useCreateQuotation();
    const updateQuotationMutation = useUpdateQuotation();
    const deleteQuotationMutation = useDeleteQuotation();
    const convertQuotationMutation = useConvertQuotationToContract();

    // Derived loading states
    const isLoading = clientsLoading || servicesLoading || quotationsLoading;
    const isSaving = createQuotationMutation.isPending || updateQuotationMutation.isPending;
    const isDeleting = deleteQuotationMutation.isPending ? "pending" : null;
    const isConverting = convertQuotationMutation.isPending ? "pending" : null;

    // Form state
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [customServices, setCustomServices] = useState<CustomService[]>([]);
    const [quotationNote, setQuotationNote] = useState<string>("");
    const [discountValue, setDiscountValue] = useState<string>("");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
    const [overriddenTotal, setOverriddenTotal] = useState<string>("");
    const [validUntil, setValidUntil] = useState<string>("");

    // Custom service form
    const [customName, setCustomName] = useState<string>("");
    const [customNameAr, setCustomNameAr] = useState<string>("");
    const [customPrice, setCustomPrice] = useState<string>("");
    const [customDiscount, setCustomDiscount] = useState<string>("");
    const [customDiscountType, setCustomDiscountType] = useState<"percentage" | "fixed">("percentage");

    // Contract conversion modal
    const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
    const [convertQuotationId, setConvertQuotationId] = useState<string | null>(null);
    const [contractStartDate, setContractStartDate] = useState<string>("");
    const [contractEndDate, setContractEndDate] = useState<string>("");
    const [contractTerms, setContractTerms] = useState<string>("");

    // React Query handles all data loading automatically

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setSelectedClientId(client.id || "");
        setCurrentPage(1);
        resetForm();
    };

    const handleSelectGlobal = () => {
        setSelectedClient({ business: { businessName: t("global_quotation") || "Global Quotation" } } as Client);
        setSelectedClientId("global");
        setCurrentPage(1);
        resetForm();
    };

    const resetForm = () => {
        setIsEditing(false);
        setEditingQuotationId(null);
        setSelectedServices([]);
        setCustomServices([]);
        setQuotationNote("");
        setDiscountValue("");
        setDiscountType("percentage");
        setOverriddenTotal("");
        setValidUntil("");
    };

    const toggleService = (serviceId: string) => {
        if (selectedServices.includes(serviceId)) {
            setSelectedServices(selectedServices.filter((id) => id !== serviceId));
        } else {
            setSelectedServices([...selectedServices, serviceId]);
        }
    };

    const addCustomService = () => {
        const name = customName.trim();
        const nameAr = customNameAr.trim();
        const price = parseFloat(customPrice);

        if (!name && !nameAr) return;
        if (isNaN(price) || price <= 0) return;

        const discount = customDiscount ? parseFloat(customDiscount) : undefined;
        if (discount !== undefined) {
            if (isNaN(discount)) return;
            if (customDiscountType === "percentage" && (discount < 0 || discount > 100)) return;
            if (customDiscountType === "fixed" && discount < 0) return;
        }

        const newCustomService: CustomService = {
            id: `custom_${Date.now()}`,
            en: name || nameAr,
            ar: nameAr || name,
            price,
            discount,
            discountType: customDiscountType,
        };

        setCustomServices([...customServices, newCustomService]);
        setCustomName("");
        setCustomNameAr("");
        setCustomPrice("");
        setCustomDiscount("");
        setCustomDiscountType("percentage");
    };

    const removeCustomService = (id: string) => {
        setCustomServices(customServices.filter((s) => s.id !== id));
    };

    const calculateSubtotal = () => {
        const servicesTotal = selectedServices.reduce((sum, serviceId) => {
            const service = services.find((s) => s._id === serviceId);
            return sum + (service?.price || 0);
        }, 0);

        const customServicesTotal = customServices.reduce((sum, customService) => {
            let price = customService.price;
            if (customService.discount) {
                if (customService.discountType === "percentage") {
                    price = price * (1 - customService.discount / 100);
                } else {
                    price = Math.max(0, price - customService.discount);
                }
            }
            return sum + price;
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
        if (selectedServices.length === 0 && customServices.length === 0) {
            alert(t("please_select_services") || "Please select at least one service");
            return;
        }

        try {
            // Ensure services are strings (IDs only)
            const serviceIds = selectedServices.map((s) => (typeof s === "string" ? s : (s as any)._id || s));

            const payload: CreateQuotationPayload = {
                clientId: selectedClientId === "global" ? undefined : selectedClientId,
                services: serviceIds.length > 0 ? serviceIds : undefined,
                customServices: customServices.length > 0 ? customServices : undefined,
                discountValue: parseFloat(discountValue) || 0,
                discountType,
                note: quotationNote || undefined,
                validUntil: validUntil || undefined,
            };

            console.log("Creating/Updating quotation with payload:", payload);

            if (overriddenTotal) {
                payload.overriddenTotal = parseFloat(overriddenTotal);
            }

            if (editingQuotationId) {
                await updateQuotationMutation.mutateAsync({ id: editingQuotationId, payload });
            } else {
                await createQuotationMutation.mutateAsync(payload);
            }

            resetForm();
        } catch (error: any) {
            console.error("Failed to save quotation:", error);
            alert(error.response?.data?.message || t("failed_to_save_quotation") || "Failed to save quotation");
        }
    };

    const handleEditQuotation = (quotation: Quotation) => {
        setIsEditing(true);
        setEditingQuotationId(quotation._id);

        // Ensure we only store service IDs (strings)
        const serviceIds = quotation.services.map((s) => (typeof s === "string" ? s : (s as any)._id || s));
        setSelectedServices(serviceIds);

        setCustomServices(quotation.customServices || []);
        setQuotationNote(quotation.note || "");
        setDiscountValue(quotation.discountValue?.toString() || "");
        setDiscountType(quotation.discountType);
        setOverriddenTotal(quotation.overriddenTotal?.toString() || "");
        setValidUntil(quotation.validUntil ? quotation.validUntil.split("T")[0] : "");
    };

    const handleDeleteQuotation = async (id: string) => {
        if (!confirm(t("confirm_delete_quotation") || "Are you sure you want to delete this quotation?")) {
            return;
        }

        try {
            await deleteQuotationMutation.mutateAsync(id);
        } catch (error) {
            console.error("Failed to delete quotation:", error);
            alert(t("failed_to_delete_quotation") || "Failed to delete quotation");
        }
    };

    const handlePreviewPDF = (quotation: Quotation) => {
        // Get client name
        const client = clients.find((c) => c.id === quotation.clientId);
        const clientName = client?.business?.businessName || "";

        // Call print function to open preview
        printQuotation({
            quotation,
            clientName,
            companyInfo: {
                name: "Your Company Name", // Replace with actual company info
                address: "123 Business St, City, Country",
                phone: "+20 123 456 7890",
                email: "info@yourcompany.com",
                website: "www.yourcompany.com",
            },
            lang: lang as "en" | "ar",
        });
    };

    const handleDownloadPDF = async (id: string) => {
        setIsDownloading(id);
        try {
            const quotation = quotations.find((q) => q._id === id);
            if (!quotation) {
                alert(t("quotation_not_found") || "Quotation not found");
                return;
            }

            // Get client name
            const client = clients.find((c) => c.id === quotation.clientId);
            const clientName = client?.business?.businessName || "";

            // Use browser's Print to PDF feature
            printQuotation({
                quotation,
                clientName,
                companyInfo: {
                    name: "Your Company Name",
                    address: "123 Business St, City, Country",
                    phone: "+20 123 456 7890",
                    email: "info@yourcompany.com",
                    website: "www.yourcompany.com",
                },
                lang: lang as "en" | "ar",
            });
        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert(t("failed_to_generate_pdf") || "Failed to generate PDF. Please try again.");
        } finally {
            setIsDownloading(null);
        }
    };

    const handleConvertToContract = async () => {
        if (!convertQuotationId) return;
        if (!contractStartDate || !contractEndDate) {
            alert(t("please_fill_dates") || "Please fill in start and end dates");
            return;
        }

        try {
            await convertQuotationMutation.mutateAsync({
                id: convertQuotationId,
                payload: {
                    startDate: contractStartDate,
                    endDate: contractEndDate,
                    contractTerms: contractTerms || undefined,
                },
            });

            setShowConvertModal(false);
            setConvertQuotationId(null);
            setContractStartDate("");
            setContractEndDate("");
            setContractTerms("");

            alert(t("quotation_converted_to_contract") || "Quotation successfully converted to contract!");
        } catch (error: any) {
            console.error("Failed to convert quotation:", error);
            alert(error.response?.data?.message || t("failed_to_convert_quotation") || "Failed to convert to contract");
        }
    };

    const openConvertModal = (quotationId: string) => {
        setConvertQuotationId(quotationId);
        setShowConvertModal(true);
    };

    const totalPages = Math.ceil(totalQuotations / pageSize);

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("quotations") || "Quotations"}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("create_and_manage_quotations") || "Create and manage quotations"}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSelectGlobal}
                        className="btn-primary"
                        title={t("create_global_quotation") || "Create Global Quotation"}
                    >
                        {t("custom_quotation") || "Custom Quotation"}
                    </button>
                </div>
            </div>

            {/* Client Selection */}
            {!selectedClientId && !isLoading && (
                <div>
                    {clients.length > 0 ? (
                        <>
                            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-lg font-semibold">
                                {t("select_a_client") || "Select a client"}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {clients.map((client) => (
                                    <div
                                        key={client.id}
                                        className="card flex flex-col"
                                    >
                                        <h3 className="card-title text-lg">{client.business?.businessName || t("unnamed_client")}</h3>
                                        <p className="text-light-600 mt-1 text-sm">{client.business?.category}</p>
                                        <button
                                            onClick={() => handleSelectClient(client)}
                                            className="btn-primary mt-4 w-full"
                                        >
                                            {t("create_quotation") || "Create Quotation"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="card">
                            <div className="py-8 text-center">
                                <p className="text-light-600">{t("no_clients_found") || "No clients found"}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quotation Management */}
            {selectedClient && (
                <>
                    {/* Client Header */}
                    <div className="card bg-dark-50 dark:bg-dark-800/50">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setSelectedClientId("");
                                    setSelectedClient(null);
                                }}
                                className="btn-ghost"
                            >
                                <LocalizedArrow size={20} />
                            </button>
                            <div>
                                <h2 className="text-light-900 dark:text-dark-50 text-xl font-bold">{selectedClient.business?.businessName}</h2>
                                <p className="text-light-600 dark:text-dark-50 text-sm">{selectedClient.business?.category}</p>
                            </div>
                        </div>
                    </div>

                    {/* Create/Edit Quotation Form */}
                    {(isEditing || quotations.length === 0) && (
                        <div className="card">
                            <h3 className="card-title mb-4">
                                {editingQuotationId ? t("edit_quotation") || "Edit Quotation" : t("create_new_quotation") || "Create New Quotation"}
                            </h3>

                            {/* Services Selection */}
                            <div className="mb-6">
                                <h4 className="text-light-900 dark:text-dark-50 mb-3 font-semibold">{t("select_services") || "Select Services"}</h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {services.map((service) => {
                                        const isSelected = selectedServices.includes(service._id);
                                        return (
                                            <div
                                                key={service._id}
                                                onClick={() => toggleService(service._id)}
                                                className={`cursor-pointer rounded-lg border px-4 py-3 transition-all ${
                                                    isSelected
                                                        ? "border-light-500 bg-light-500 dark:bg-secdark-700 dark:text-dark-50 text-white"
                                                        : "border-light-600 text-light-900 hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isSelected && (
                                                        <Check
                                                            size={16}
                                                            className="flex-shrink-0"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="font-medium">{lang === "ar" ? service.ar : service.en}</div>
                                                        {service.description && <div className="mt-1 text-xs opacity-75">{service.description}</div>}
                                                        <div className="mt-1 text-sm">
                                                            {service.price} {lang === "ar" ? "ج.م" : "EGP"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
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
                                                        {customService.discount &&
                                                            ` - ${customService.discount}${customService.discountType === "percentage" ? "%" : " EGP"} ${t("discount") || "discount"}`}
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
                                            value={customName}
                                            onChange={(e) => setCustomName(e.target.value)}
                                            placeholder={t("service_name_en") || "Service name (English)"}
                                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="min-w-[150px] flex-1">
                                        <input
                                            type="text"
                                            value={customNameAr}
                                            onChange={(e) => setCustomNameAr(e.target.value)}
                                            placeholder={t("service_name_ar") || "اسم الخدمة (بالعربية)"}
                                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <input
                                            type="number"
                                            value={customPrice}
                                            onChange={(e) => setCustomPrice(e.target.value)}
                                            placeholder={t("price") || "Price"}
                                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div className="w-28">
                                        <select
                                            value={customDiscountType}
                                            onChange={(e) => setCustomDiscountType(e.target.value as "percentage" | "fixed")}
                                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-2 py-2 text-sm"
                                        >
                                            <option value="percentage">{t("percentage") || "%"}</option>
                                            <option value="fixed">{t("fixed") || "Fixed"}</option>
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <input
                                            type="number"
                                            value={customDiscount}
                                            onChange={(e) => setCustomDiscount(e.target.value)}
                                            placeholder={t("discount") || "Discount"}
                                            className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-2 py-2 text-sm"
                                        />
                                    </div>
                                    <button
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
                                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("note") || "Note"}</label>
                                    <textarea
                                        value={quotationNote}
                                        onChange={(e) => setQuotationNote(e.target.value)}
                                        placeholder={t("quotation_note_placeholder") || "Add any additional notes..."}
                                        rows={3}
                                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("valid_until") || "Valid Until"}</label>
                                    <input
                                        type="date"
                                        value={validUntil}
                                        onChange={(e) => setValidUntil(e.target.value)}
                                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Discount and Total Override */}
                            <div className="mb-6 grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                                        {t("discount_type") || "Discount Type"}
                                    </label>
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
                                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                                        {t("discount_value") || "Discount Value"}
                                    </label>
                                    <input
                                        type="number"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        placeholder={discountType === "percentage" ? "0-100" : t("amount") || "Amount"}
                                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                                        {t("override_total") || "Override Total"} ({t("optional") || "optional"})
                                    </label>
                                    <input
                                        type="number"
                                        value={overriddenTotal}
                                        onChange={(e) => setOverriddenTotal(e.target.value)}
                                        placeholder={t("manual_total") || "Manual total"}
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
                                            {discountType === "percentage"
                                                ? `${discountValue}%`
                                                : `${discountValue} ${lang === "ar" ? "ج.م" : "EGP"}`}
                                        </p>
                                    )}
                                    <p className="text-light-900 dark:text-dark-50 text-lg font-bold">
                                        {t("total") || "Total"}: {overriddenTotal || calculateTotal().toFixed(2)} {lang === "ar" ? "ج.م" : "EGP"}
                                        {overriddenTotal && (
                                            <span className="text-light-600 dark:text-dark-400 ml-2 text-sm">
                                                ({t("overridden") || "overridden"})
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {editingQuotationId && (
                                        <button
                                            onClick={resetForm}
                                            className="btn-ghost"
                                        >
                                            {t("cancel") || "Cancel"}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCreateOrUpdateQuotation}
                                        disabled={isSaving || (selectedServices.length === 0 && customServices.length === 0)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {isSaving ? (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <FileText size={16} />
                                        )}
                                        {editingQuotationId
                                            ? t("update_quotation") || "Update Quotation"
                                            : t("create_quotation") || "Create Quotation"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quotations List */}
                    {!isEditing && quotations.length > 0 && (
                        <div className="card">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="card-title">{t("existing_quotations") || "Existing Quotations"}</h3>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-primary"
                                >
                                    <Plus
                                        size={16}
                                        className="mr-2"
                                    />
                                    {t("create_new") || "Create New"}
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="mb-4 flex items-center gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 rounded-lg border bg-transparent px-3 py-2 text-sm"
                                >
                                    <option value="">{t("all_statuses") || "All Statuses"}</option>
                                    <option value="draft">{t("draft") || "Draft"}</option>
                                    <option value="sent">{t("sent") || "Sent"}</option>
                                    <option value="approved">{t("approved") || "Approved"}</option>
                                    <option value="rejected">{t("rejected") || "Rejected"}</option>
                                    <option value="expired">{t("expired") || "Expired"}</option>
                                </select>
                            </div>

                            <div className="space-y-3">
                                {quotations.map((quotation) => (
                                    <div
                                        key={quotation._id}
                                        className="border-light-600 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50 rounded-lg border p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center gap-3">
                                                    <h4 className="text-light-900 dark:text-dark-50 font-semibold">{quotation.quotationNumber}</h4>
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs ${
                                                            quotation.status === "approved"
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                : quotation.status === "rejected"
                                                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                                  : quotation.status === "sent"
                                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                                        }`}
                                                    >
                                                        {t(quotation.status) || quotation.status}
                                                    </span>
                                                </div>
                                                <p className="text-light-600 dark:text-dark-400 mb-1 text-sm">
                                                    {new Date(quotation.createdAt).toLocaleString()}
                                                </p>
                                                {quotation.note && (
                                                    <p className="text-light-600 dark:text-dark-400 mb-2 text-sm italic">{quotation.note}</p>
                                                )}
                                                <p className="text-light-900 dark:text-dark-50 font-bold">
                                                    {quotation.total} {lang === "ar" ? "ج.م" : "EGP"}
                                                    {quotation.isTotalOverridden && (
                                                        <span className="text-light-600 dark:text-dark-400 ml-2 text-xs">
                                                            ({t("overridden") || "overridden"})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditQuotation(quotation)}
                                                    className="btn-ghost"
                                                    title={t("edit") || "Edit"}
                                                    disabled={quotation.status === "approved"}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handlePreviewPDF(quotation)}
                                                    className="btn-ghost text-blue-600"
                                                    title={t("preview_pdf") || "Preview PDF"}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadPDF(quotation._id)}
                                                    className="btn-ghost"
                                                    title={t("download_pdf") || "Download PDF"}
                                                    disabled={isDownloading === quotation._id}
                                                >
                                                    {isDownloading === quotation._id ? (
                                                        <Loader2
                                                            size={16}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Download size={16} />
                                                    )}
                                                </button>
                                                {quotation.status !== "approved" && (
                                                    <button
                                                        onClick={() => openConvertModal(quotation._id)}
                                                        className="btn-ghost text-green-600"
                                                        title={t("convert_to_contract") || "Convert to Contract"}
                                                    >
                                                        <FileCheck size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteQuotation(quotation._id)}
                                                    className="btn-ghost text-danger-500"
                                                    title={t("delete") || "Delete"}
                                                    disabled={isDeleting === quotation._id}
                                                >
                                                    {isDeleting === quotation._id ? (
                                                        <Loader2
                                                            size={16}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="border-light-600 dark:border-dark-700 mt-6 flex items-center justify-between border-t pt-4">
                                    <div className="text-light-600 dark:text-dark-400 text-sm">
                                        {t("showing") || "Showing"} {(currentPage - 1) * pageSize + 1} -{" "}
                                        {Math.min(currentPage * pageSize, totalQuotations)} {t("of") || "of"} {totalQuotations}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="btn-ghost"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <span className="text-light-900 dark:text-dark-50">
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="btn-ghost"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!isEditing && quotations.length === 0 && !isLoading && (
                        <div className="card">
                            <div className="py-8 text-center">
                                <p className="text-light-600 dark:text-dark-400 mb-4">{t("no_quotations_yet") || "No quotations yet"}</p>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-primary"
                                >
                                    <Plus
                                        size={16}
                                        className="mr-2"
                                    />
                                    {t("create_first_quotation") || "Create First Quotation"}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Convert to Contract Modal */}
            {showConvertModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="dark:bg-dark-800 mx-4 w-full max-w-md rounded-lg bg-white p-6">
                        <h3 className="text-light-900 dark:text-dark-50 mb-4 text-lg font-bold">
                            {t("convert_to_contract") || "Convert to Contract"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("start_date") || "Start Date"} *</label>
                                <input
                                    type="date"
                                    value={contractStartDate}
                                    onChange={(e) => setContractStartDate(e.target.value)}
                                    className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("end_date") || "End Date"} *</label>
                                <input
                                    type="date"
                                    value={contractEndDate}
                                    onChange={(e) => setContractEndDate(e.target.value)}
                                    className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                                    {t("contract_terms") || "Contract Terms"} ({t("optional") || "optional"})
                                </label>
                                <textarea
                                    value={contractTerms}
                                    onChange={(e) => setContractTerms(e.target.value)}
                                    placeholder={t("contract_terms_placeholder") || "Enter contract terms..."}
                                    rows={3}
                                    className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowConvertModal(false);
                                    setConvertQuotationId(null);
                                    setContractStartDate("");
                                    setContractEndDate("");
                                    setContractTerms("");
                                }}
                                className="btn-ghost"
                                disabled={isConverting !== null}
                            >
                                {t("cancel") || "Cancel"}
                            </button>
                            <button
                                onClick={handleConvertToContract}
                                className="btn-primary flex items-center gap-2"
                                disabled={isConverting !== null || !contractStartDate || !contractEndDate}
                            >
                                {isConverting ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <FileCheck size={16} />
                                )}
                                {t("convert") || "Convert"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2
                        className="animate-spin"
                        size={32}
                    />
                </div>
            )}
        </div>
    );
};

export default QuotationsPage;
