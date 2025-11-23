import { useState } from "react";
import { Plus, FileText, Loader2, Trash2, Edit2, Download, FileCheck, ChevronLeft, ChevronRight, Eye } from "lucide-react";
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
import type { Quotation, CustomService, CreateQuotationPayload, QuotationQueryParams } from "@/api/requests/quotationsService";
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

    const quotationsParams: QuotationQueryParams = {
        page: currentPage,
        limit: pageSize,
        status: statusFilter || undefined,
        ...(selectedClientId && selectedClientId !== "global" ? { clientId: selectedClientId } : {}),
    };

    const { data: quotationsResponse, isLoading: quotationsLoading } = useQuotations(quotationsParams);
    const quotations = quotationsResponse?.data || [];
    const totalQuotations = quotationsResponse?.meta?.total || 0;

    // Also fetch all quotations (no filters) to detect whether a client already has quotations
    const { data: allQuotationsResponse } = useQuotations({ page: 1, limit: 1000 });
    const allQuotations: any[] = Array.isArray(allQuotationsResponse)
        ? allQuotationsResponse
        : allQuotationsResponse?.data && Array.isArray(allQuotationsResponse.data)
          ? allQuotationsResponse.data
          : [];

    // Ensure we only display quotations for the selected client when a client is selected.
    const displayedQuotations =
        selectedClientId && selectedClientId !== "global"
            ? quotations.filter((q: any) => {
                  if (!q) return false;
                  let qClientId: any = null;
                  if (typeof q.clientId === "string") qClientId = q.clientId;
                  else if (q.clientId && typeof q.clientId === "object") qClientId = q.clientId._id || q.clientId.id || q.clientId;
                  else if (typeof q.client === "string") qClientId = q.client;
                  else if (q.client && typeof q.client === "object") qClientId = q.client._id || q.client.id || q.client;

                  return String(qClientId) === String(selectedClientId) || String(qClientId) === String(selectedClient?._id || selectedClientId);
              })
            : quotations;

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
    const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
    const [customServices, setCustomServices] = useState<CustomService[]>([]);
    const [customQuotationName, setCustomQuotationName] = useState<string>("");
    const [quotationNote, setQuotationNote] = useState<string>("");
    const [discountValue, setDiscountValue] = useState<string>("");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
    const [overriddenTotal, setOverriddenTotal] = useState<string>("");
    const [validUntil, setValidUntil] = useState<string>("");

    // Custom service form
    const [customName, setCustomName] = useState<string>("");
    const [customNameAr, setCustomNameAr] = useState<string>("");
    const [customPrice, setCustomPrice] = useState<string>("");

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
        setIsEditing(true);
        resetForm();
    };

    const handleSelectGlobal = () => {
        setSelectedClient({ business: { businessName: t("global_quotation") || "Global Quotation" } } as Client);
        setSelectedClientId("global");
        setCurrentPage(1);
        setIsEditing(true);
        resetForm();
    };

    // Start creating a new quotation from the existing list
    const startCreateNew = () => {
        // Debug: log current selection state
        try {
            // eslint-disable-next-line no-console
            console.log("Start create new quotation", {
                selectedClientId,
                selectedClient,
                isEditing,
                displayedQuotationsLength: displayedQuotations?.length,
            });
        } catch (e) {
            // ignore
        }
        setIsEditing(true);
        // clear any previous editing id so a fresh form shows
        setEditingQuotationId(null);
    };

    const resetForm = () => {
        setEditingQuotationId(null);
        setSelectedPackages([]);
        setCustomServices([]);
        setCustomQuotationName("");
        setQuotationNote("");
        setDiscountValue("");
        setDiscountType("percentage");
        setOverriddenTotal("");
        setValidUntil("");
    };

    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

    const toggleExpandService = (serviceId: string) => {
        setExpandedServiceId((prev) => (prev === serviceId ? null : serviceId));
    };

    const togglePackage = (packageId: string) => {
        if (selectedPackages.includes(packageId)) {
            setSelectedPackages(selectedPackages.filter((id) => id !== packageId));
        } else {
            setSelectedPackages([...selectedPackages, packageId]);
        }
    };

    const addCustomService = () => {
        const name = customName.trim();
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
        setCustomName("");
        setCustomNameAr("");
        setCustomPrice("");
    };

    const removeCustomService = (id: string) => {
        setCustomServices(customServices.filter((s) => s.id !== id));
    };

    const calculateSubtotal = () => {
        // Sum prices of selected packages (packages belong to services)
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
        if (selectedPackages.length === 0 && customServices.length === 0) {
            alert(t("please_select_services") || "Please select at least one service");
            return;
        }

        try {
            // Ensure packages are strings (IDs only)
            const packageIds = selectedPackages.map((s) => (typeof s === "string" ? s : (s as any)._id || s));

            const payload: CreateQuotationPayload = {
                packages: packageIds.length > 0 ? packageIds : undefined,
                customServices: customServices.length > 0 ? customServices : undefined,
                customName: customQuotationName || undefined,
                discountValue: parseFloat(discountValue) || 0,
                discountType,
                note: quotationNote || undefined,
                validUntil: validUntil || undefined,
            };

            // Only include clientId if it's not "global"
            if (selectedClientId && selectedClientId !== "global") {
                payload.clientId = selectedClientId;
            }

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

        // Prefer `packages` on the quotation; fall back to `services` for older data
        const packageIds =
            quotation.packages && Array.isArray(quotation.packages)
                ? quotation.packages.map((p) => (typeof p === "string" ? p : (p as any)._id || p))
                : quotation.services && Array.isArray(quotation.services)
                  ? quotation.services.map((s) => (typeof s === "string" ? s : (s as any)._id || s))
                  : [];

        setSelectedPackages(packageIds);

        setCustomServices(quotation.customServices || []);
        setCustomQuotationName(quotation.customName || "");
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

            // Dynamic import of jsPDF for better code splitting
            const jsPDF = (await import("jspdf")).default;
            const autoTable = (await import("jspdf-autotable")).default;

            // Create PDF
            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            }) as any;

            const currency = lang === "ar" ? "ج.م" : "EGP";
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Colors
            const primaryColor: [number, number, number] = [102, 126, 234];
            const darkGray: [number, number, number] = [74, 85, 104];
            const lightGray: [number, number, number] = [237, 242, 247];

            // Header with gradient effect
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, pageWidth, 60, "F");

            // Company info
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("Your Company Name", 20, 25);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("123 Business St, City, Country", 20, 32);
            doc.text("+20 123 456 7890 | info@yourcompany.com", 20, 38);

            // Quotation number
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(lang === "ar" ? "عرض سعر" : "QUOTATION", pageWidth - 20, 25, { align: "right" });
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(quotation.quotationNumber, pageWidth - 20, 32, { align: "right" });

            // Date
            const dateStr = new Date(quotation.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
            doc.text((lang === "ar" ? "التاريخ: " : "Date: ") + dateStr, pageWidth - 20, 38, { align: "right" });

            // Client info
            let yPos = 75;
            if (clientName) {
                doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text(lang === "ar" ? "العميل:" : "Client:", 20, yPos);
                doc.setFont("helvetica", "normal");
                doc.text(clientName, 20, yPos + 6);
                yPos += 20;
            }

            // Prepare table data
            const tableData: any[] = [];
            let itemNumber = 1;

            // Get all packages from services
            const allPackages = services.flatMap((s: any) =>
                (s.packages || []).map((p: any) => ({ ...p, serviceName: lang === "ar" ? s.ar : s.en })),
            );

            // Add packages from quotation
            if (quotation.packages && quotation.packages.length > 0) {
                quotation.packages.forEach((pkgId: any) => {
                    const pkgIdStr = typeof pkgId === "string" ? pkgId : pkgId._id || pkgId.id;
                    const pkg = allPackages.find((p: any) => p._id === pkgIdStr);
                    if (pkg) {
                        const packageName = (lang === "ar" ? pkg.nameAr : pkg.nameEn) || "Package";
                        const serviceName = pkg.serviceName || "Service";
                        const packagePrice = pkg.price || 0;

                        tableData.push([
                            itemNumber++,
                            `${packageName}\n(${serviceName})`,
                            `${packagePrice.toFixed(2)} ${currency}`,
                            "-",
                            `${packagePrice.toFixed(2)} ${currency}`,
                        ]);
                    }
                });
            }

            // Add services from servicesPricing (backward compatibility)
            if (quotation.servicesPricing && quotation.servicesPricing.length > 0) {
                quotation.servicesPricing.forEach((sp: any) => {
                    const service = sp.service;
                    if (!service) return; // Skip if service is undefined

                    const serviceName = (lang === "ar" ? service.ar : service.en) || "Service";
                    const price = sp.customPrice || service.price || 0;
                    tableData.push([itemNumber++, serviceName, `${price.toFixed(2)} ${currency}`, "-", `${price.toFixed(2)} ${currency}`]);
                });
            }

            // Add custom services
            if (quotation.customServices && quotation.customServices.length > 0) {
                quotation.customServices.forEach((cs: any) => {
                    let finalPrice = cs.price;
                    let discountText = "-";

                    if (cs.discount && cs.discount > 0) {
                        if (cs.discountType === "percentage") {
                            const discountAmt = (cs.price * cs.discount) / 100;
                            finalPrice = cs.price - discountAmt;
                            discountText = `${cs.discount}% (${discountAmt.toFixed(2)} ${currency})`;
                        } else {
                            finalPrice = cs.price - cs.discount;
                            discountText = `${cs.discount.toFixed(2)} ${currency}`;
                        }
                    }

                    tableData.push([
                        itemNumber++,
                        `${lang === "ar" ? cs.ar : cs.en}\n${lang === "ar" ? "(خدمة مخصصة)" : "(Custom)"}`,
                        `${cs.price.toFixed(2)} ${currency}`,
                        discountText,
                        `${finalPrice.toFixed(2)} ${currency}`,
                    ]);
                });
            }

            // Ensure we have at least one item
            if (tableData.length === 0) {
                tableData.push([1, lang === "ar" ? "لا توجد خدمات" : "No services", `0.00 ${currency}`, "-", `0.00 ${currency}`]);
            }

            // Create table
            autoTable(doc, {
                startY: yPos,
                head: [
                    [
                        "#",
                        lang === "ar" ? "الخدمة" : "Service",
                        lang === "ar" ? "السعر" : "Price",
                        lang === "ar" ? "الخصم" : "Discount",
                        lang === "ar" ? "المجموع" : "Total",
                    ],
                ],
                body: tableData,
                theme: "striped",
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontSize: 11,
                    fontStyle: "bold",
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 5,
                },
                columnStyles: {
                    0: { cellWidth: 15, halign: "center" },
                    1: { cellWidth: "auto" },
                    2: { cellWidth: 35, halign: "right" },
                    3: { cellWidth: 35, halign: "right" },
                    4: { cellWidth: 35, halign: "right" },
                },
            });

            // Summary section
            const finalY = doc.lastAutoTable.finalY + 10;
            const summaryX = pageWidth - 80;

            doc.setFontSize(10);
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

            // Subtotal
            doc.text(lang === "ar" ? "المجموع الفرعي:" : "Subtotal:", summaryX, finalY);
            doc.text(`${quotation.subtotal.toFixed(2)} ${currency}`, pageWidth - 20, finalY, { align: "right" });

            // Discount
            if (quotation.discountValue > 0) {
                let discountAmount = 0;
                if (quotation.discountType === "percentage") {
                    discountAmount = (quotation.subtotal * quotation.discountValue) / 100;
                } else {
                    discountAmount = quotation.discountValue;
                }

                doc.text(
                    `${lang === "ar" ? "الخصم" : "Discount"} (${quotation.discountType === "percentage" ? quotation.discountValue + "%" : currency}):`,
                    summaryX,
                    finalY + 7,
                );
                doc.text(`-${discountAmount.toFixed(2)} ${currency}`, pageWidth - 20, finalY + 7, { align: "right" });
            }

            // Total
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            const totalY = quotation.discountValue > 0 ? finalY + 14 : finalY + 7;
            doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.rect(summaryX - 5, totalY - 5, 75, 10, "F");
            doc.text(lang === "ar" ? "الإجمالي:" : "Total:", summaryX, totalY + 2);
            doc.text(`${quotation.total.toFixed(2)} ${currency}`, pageWidth - 20, totalY + 2, { align: "right" });

            // Notes
            if (quotation.note) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(lang === "ar" ? "ملاحظات:" : "Notes:", 20, totalY + 15);
                doc.setFont("helvetica", "normal");
                const splitNote = doc.splitTextToSize(quotation.note, pageWidth - 40);
                doc.text(splitNote, 20, totalY + 21);
            }

            // Footer
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            const footerText = lang === "ar" ? "شكراً لثقتكم بنا" : "Thank you for your business";
            doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: "center" });

            // Status
            const statusText =
                lang === "ar"
                    ? quotation.status === "draft"
                        ? "مسودة"
                        : quotation.status === "sent"
                          ? "مرسل"
                          : quotation.status === "approved"
                            ? "موافق عليه"
                            : quotation.status === "rejected"
                              ? "مرفوض"
                              : quotation.status
                    : quotation.status.toUpperCase();
            doc.text(`${lang === "ar" ? "الحالة" : "Status"}: ${statusText}`, pageWidth / 2, pageHeight - 15, { align: "center" });

            // Save PDF
            doc.save(`quotation-${quotation.quotationNumber}.pdf`);
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

    // Debug render state
    try {
        // eslint-disable-next-line no-console
        console.log("QuotationsPage render", { selectedClientId, selectedClient, isEditing, displayedQuotationsLength: displayedQuotations?.length });
    } catch (e) {
        // ignore
    }

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
                                            {(() => {
                                                try {
                                                    const key = `quotations_${client.id}`;
                                                    const hasLocal = typeof window !== "undefined" && !!localStorage.getItem(key);

                                                    const hasServer = allQuotations.some((q: any) => {
                                                        if (!q) return false;
                                                        let qClientId: any = null;
                                                        if (typeof q.clientId === "string") qClientId = q.clientId;
                                                        else if (q.clientId && typeof q.clientId === "object")
                                                            qClientId = q.clientId._id || q.clientId.id || q.clientId;
                                                        else if (typeof q.client === "string") qClientId = q.client;
                                                        else if (q.client && typeof q.client === "object")
                                                            qClientId = q.client._id || q.client.id || q.client;

                                                        return String(qClientId) === String(client.id) || String(qClientId) === String(client._id);
                                                    });

                                                    return hasLocal || hasServer
                                                        ? t("show_quotation") || "Show Quotation"
                                                        : t("create_quotation") || "Create Quotation";
                                                } catch (e) {
                                                    return t("create_quotation") || "Create Quotation";
                                                }
                                            })()}
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
                            {displayedQuotations.length > 0 && (
                                <div className="ml-auto">
                                    <button
                                        onClick={() => {
                                            // Keep the client selected and switch to the quotations list view
                                            setIsEditing(false);
                                            setCurrentPage(1);
                                        }}
                                        className="btn-ghost"
                                    >
                                        {t("quotations") || "Quotations"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Create/Edit Quotation Form */}
                    {(isEditing || displayedQuotations.length === 0) && (
                        <div className="card">
                            <h3 className="card-title mb-4">
                                {editingQuotationId ? t("edit_quotation") || "Edit Quotation" : t("create_new_quotation") || "Create New Quotation"}
                            </h3>

                            {/* Services & Packages Selection */}
                            <div className="mb-6">
                                <h4 className="text-light-900 dark:text-dark-50 mb-3 font-semibold">{t("select_services") || "Select Services"}</h4>
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
                                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                                        {t("custom_name") || "Custom Quotation Name"} ({t("optional") || "optional"})
                                    </label>
                                    <input
                                        type="text"
                                        value={customQuotationName}
                                        onChange={(e) => setCustomQuotationName(e.target.value)}
                                        placeholder={t("custom_quotation_name_placeholder") || "Enter custom name for this quotation..."}
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
                                        disabled={isSaving || (selectedPackages.length === 0 && customServices.length === 0)}
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
                                        {editingQuotationId
                                            ? t("update_quotation") || "Update Quotation"
                                            : t("create_quotation") || "Create Quotation"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quotations List */}
                    {!isEditing && displayedQuotations.length > 0 && (
                        <div className="card">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="card-title">{t("existing_quotations") || "Existing Quotations"}</h3>
                                <button
                                    onClick={startCreateNew}
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
                                {displayedQuotations.map((quotation) => (
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
                                                            className="text-light-500 animate-spin"
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
                                                            className="text-light-500 animate-spin"
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
                                        className="text-light-500 animate-spin"
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
                        className="text-light-500 animate-spin"
                        size={32}
                    />
                </div>
            )}
        </div>
    );
};

export default QuotationsPage;
