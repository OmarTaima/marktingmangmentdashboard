import React, { useState, useEffect } from "react";
import { Loader2, Trash2, Edit2, Download, FileCheck, ChevronLeft, ChevronRight, Eye, Plus } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { showAlert, showConfirm } from "@/utils/swal";
import { useClients, useServices, useQuotations, useDeleteQuotation, useConvertQuotationToContract, useItems } from "@/hooks/queries";
import type { Quotation, QuotationQueryParams } from "@/api/requests/quotationsService";

interface PreviewQuotationProps {
    clientId?: string;
    clientName: string;
    onBack: () => void;
    onCreateNew: () => void;
    onEdit: (quotation: Quotation) => void;
    autoPreviewQuotationId?: string;
    autoDownloadQuotationId?: string;
}

const PreviewQuotation = ({
    clientId,
    clientName,
    onBack,
    onCreateNew,
    onEdit,
    autoPreviewQuotationId,
    autoDownloadQuotationId,
}: PreviewQuotationProps) => {
    const { t, lang } = useLang();

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize] = useState<number>(20);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const [autoPreviewDone, setAutoPreviewDone] = useState<boolean>(false);
    const [autoDownloadDone, setAutoDownloadDone] = useState<boolean>(false);

    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: servicesResponse, isLoading: servicesLoading } = useServices({ limit: 100 });
    const services = servicesResponse?.data || [];
    const { data: itemsResponse, isLoading: itemsLoading } = useItems({ limit: 1000 });
    const items = itemsResponse?.data || [];

    // For custom quotations (no real clientId) we may get a stub id like `custom-...`.
    // Avoid sending such stub ids to the API — the backend doesn't accept them and returns 500.
    const isCustomStubId = typeof clientId === "string" && clientId.startsWith("custom-");

    // Determine whether we actually need to fetch quotations:
    // - fetch when we have a real clientId (not a custom stub and not 'global')
    // - or when we have a clientName to filter by
    const shouldFetchQuotations = Boolean((clientId && !isCustomStubId && clientId !== "global") || clientName);

    // Build query params and keep a reasonable page size (avoid limit=1000)
    const quotationsParams: QuotationQueryParams = {
        page: currentPage,
        limit: pageSize,
        status: statusFilter || undefined,
        ...(clientId && !isCustomStubId && clientId !== "global" ? { clientId } : {}),
    };

    const {
        data: quotationsResponse,
        isLoading: quotationsLoading,
        refetch: refetchQuotations,
    } = useQuotations(quotationsParams, { enabled: shouldFetchQuotations });
    const quotations = quotationsResponse?.data || [];
    const totalQuotations = quotationsResponse?.meta?.total || 0;

    // Ensure we refetch when the clientId or clientName changes (e.g. after creating a quotation)
    // This guarantees the preview list is fresh and includes newly created quotations.
    React.useEffect(() => {
        // only refetch when we actually enabled the query
        if (!shouldFetchQuotations) return;

        // best-effort refetch; ignore returned promise
        try {
            refetchQuotations();
        } catch (e) {
            // swallow errors here; UI will show empty state if needed
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId, clientName, shouldFetchQuotations]);

    // Helper function to resolve client name from various quotation structures
    const resolveClientName = (quotation: any) => {
        try {
            if (quotation.client && typeof quotation.client === "object") {
                return quotation.client.business?.businessName || quotation.client.personal?.fullName || "";
            }

            if (quotation.clientId && typeof quotation.clientId === "object") {
                const cid = quotation.clientId._id || quotation.clientId.id || quotation.clientId;
                const client = clients.find((c) => String(c.id) === String(cid) || String(c._id) === String(cid));
                if (client) return client.business?.businessName || client.personal?.fullName || "";
            }

            if (quotation.clientId && typeof quotation.clientId === "string") {
                const client = clients.find((c) => String(c.id) === String(quotation.clientId) || String(c._id) === String(quotation.clientId));
                if (client) return client.business?.businessName || client.personal?.fullName || "";
            }

            if (quotation.clientName) return quotation.clientName;
            if (quotation.customName) return quotation.customName;

            return "";
        } catch (e) {
            return "";
        }
    };

    // Filter quotations for the selected client.
    // If we have a real `clientId` (not a custom stub and not 'global') filter by id.
    // If we have a custom stub id or no clientId but a `clientName`, filter by resolved client name.
    const displayedQuotations =
        clientId && !isCustomStubId && clientId !== "global"
            ? quotations.filter((q: any) => {
                  if (!q) return false;
                  let qClientId: any = null;
                  if (typeof q.clientId === "string") qClientId = q.clientId;
                  else if (q.clientId && typeof q.clientId === "object") qClientId = q.clientId._1d || q.clientId._id || q.clientId.id || q.clientId;
                  else if (typeof q.client === "string") qClientId = q.client;
                  else if (q.client && typeof q.client === "object") qClientId = q.client._id || q.client.id || q.client;

                  return String(qClientId) === String(clientId);
              })
            : clientName
              ? quotations.filter((q: any) => {
                    if (!q) return false;
                    try {
                        const resolved = (resolveClientName(q) || "").toString().trim().toLowerCase();
                        const target = clientName.toString().trim().toLowerCase();
                        return resolved === target;
                    } catch (e) {
                        return false;
                    }
                })
              : quotations;

    // DEBUG: log quotations response and displayed counts to help trace missing quotation issue
    useEffect(() => {
        // Only log when we actually attempted to fetch
        if (!shouldFetchQuotations) return;

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotationsResponse, quotations.length, displayedQuotations.length, totalQuotations, shouldFetchQuotations]);

    const deleteQuotationMutation = useDeleteQuotation();
    const convertQuotationMutation = useConvertQuotationToContract();

    const isDeleting = deleteQuotationMutation.isPending ? "pending" : null;
    const isConverting = convertQuotationMutation.isPending ? "pending" : null;

    // Contract conversion modal
    const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
    const [convertQuotationId, setConvertQuotationId] = useState<string | null>(null);
    const [contractStartDate, setContractStartDate] = useState<string>("");
    const [contractEndDate, setContractEndDate] = useState<string>("");
    const [contractTerms, setContractTerms] = useState<string>("");

    const handleDeleteQuotation = async (id: string) => {
        const confirmed = await showConfirm(
            t("confirm_delete_quotation") || "Are you sure you want to delete this quotation?",
            t("yes") || "Yes",
            t("no") || "No",
        );
        if (!confirmed) {
            return;
        }

        try {
            await deleteQuotationMutation.mutateAsync(id);
        } catch (error) {
            showAlert(t("failed_to_delete_quotation") || "Failed to delete quotation", "error");
        }
    };

    const handlePreviewPDF = async (quotation: Quotation) => {
        // Wait for necessary data to be available to avoid undefined lookups
        const waitForLoaded = async (timeout = 10000) => {
            const start = Date.now();
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (!clientsLoading && !servicesLoading && !itemsLoading && !quotationsLoading) return true;
                if (Date.now() - start > timeout) return false;
                // small delay
                // eslint-disable-next-line no-await-in-loop
                await new Promise((r) => setTimeout(r, 100));
            }
        };

        const loaded = await waitForLoaded(10000);
        if (!loaded) {
            showAlert(t("data_still_loading") || "Data is still loading. Please try again in a moment.", "warning");
            return;
        }
        try {
            const client = clients.find((c) => c.id === quotation.clientId);
            const clientName = client?.business?.businessName || "";

            const jsPDF = (await import("jspdf")).default;
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            }) as any;

            const currency = lang === "ar" ? "ج.م" : "EGP";
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const primaryColor: [number, number, number] = [102, 126, 234];
            const darkGray: [number, number, number] = [74, 85, 104];
            const lightGray: [number, number, number] = [237, 242, 247];

            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, pageWidth, 60, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("Your Company Name", 20, 25);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("123 Business St, City, Country", 20, 32);
            doc.text("+20 123 456 7890 | info@yourcompany.com", 20, 38);

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(lang === "ar" ? "عرض سعر" : "QUOTATION", pageWidth - 20, 25, { align: "right" });
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(quotation.quotationNumber, pageWidth - 20, 32, { align: "right" });

            const dateStr = new Date(quotation.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
            doc.text((lang === "ar" ? "التاريخ: " : "Date: ") + dateStr, pageWidth - 20, 38, { align: "right" });

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

            const tableData: any[] = [];
            let itemNumber = 1;

            const allPackages = services.flatMap((s: any) =>
                (s.packages || []).map((p: any) => ({ ...p, serviceName: lang === "ar" ? s.ar : s.en })),
            );

            if (quotation.packages && quotation.packages.length > 0) {
                quotation.packages.forEach((pkgId: any) => {
                    const pkgIdStr = typeof pkgId === "string" ? pkgId : pkgId._id || pkgId.id;
                    const pkg = allPackages.find((p: any) => p._id === pkgIdStr || p.id === pkgIdStr);
                    if (pkg) {
                        const packageName = (lang === "ar" ? pkg.nameAr : pkg.nameEn) || pkg.name || "Package";
                        const serviceName = pkg.serviceName || "Service";
                        const packagePrice = pkg.price || 0;

                        tableData.push([
                            itemNumber++,
                            `${packageName}\n(${serviceName})`,
                            `${packagePrice.toFixed(2)} ${currency}`,
                            "-",
                            `${packagePrice.toFixed(2)} ${currency}`,
                        ]);

                        if (pkg.items && pkg.items.length > 0) {
                            pkg.items.forEach((it: any) => {
                                const inner = (it && (it.item || it)) || {};
                                let name = inner?.name || inner?.nameEn || inner?.nameAr;
                                const quantity = typeof it?.quantity !== "undefined" ? it.quantity : inner?.quantity;

                                if (!name || name === "(item)") {
                                    const itemId = typeof inner === "string" ? inner : inner?._id || inner?.id;
                                    if (itemId) {
                                        const foundItem = items.find((i: any) => String(i._id) === String(itemId) || String(i.id) === String(itemId));
                                        if (foundItem) {
                                            name = foundItem.name || (foundItem as any).nameEn || (foundItem as any).nameAr;
                                        }
                                    }
                                }

                                const qtyText = typeof quantity !== "undefined" ? ` x${quantity}` : "";
                                const itemText = `• ${name || "(item)"}${qtyText}`;

                                tableData.push(["", itemText, "", "", ""]);
                            });
                        }
                    }
                });
            }

            if (quotation.servicesPricing && quotation.servicesPricing.length > 0) {
                quotation.servicesPricing.forEach((sp: any) => {
                    const service = sp.service;
                    if (!service) return;

                    const serviceName = (lang === "ar" ? service.ar : service.en) || "Service";
                    const price = sp.customPrice || service.price || 0;
                    tableData.push([itemNumber++, serviceName, `${price.toFixed(2)} ${currency}`, "-", `${price.toFixed(2)} ${currency}`]);
                });
            }

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

            if (tableData.length === 0) {
                tableData.push([1, lang === "ar" ? "لا توجد خدمات" : "No services", `0.00 ${currency}`, "-", `0.00 ${currency}`]);
            }

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

            const finalY = doc.lastAutoTable.finalY + 10;
            const summaryX = pageWidth - 80;

            doc.setFontSize(10);
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

            doc.text(lang === "ar" ? "المجموع الفرعي:" : "Subtotal:", summaryX, finalY);
            doc.text(`${quotation.subtotal.toFixed(2)} ${currency}`, pageWidth - 20, finalY, { align: "right" });

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

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            const totalY = quotation.discountValue > 0 ? finalY + 14 : finalY + 7;
            doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.rect(summaryX - 5, totalY - 5, 75, 10, "F");
            doc.text(lang === "ar" ? "الإجمالي:" : "Total:", summaryX, totalY + 2);
            doc.text(`${quotation.total.toFixed(2)} ${currency}`, pageWidth - 20, totalY + 2, { align: "right" });

            if (quotation.note) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(lang === "ar" ? "ملاحظات:" : "Notes:", 20, totalY + 15);
                doc.setFont("helvetica", "normal");
                const splitNote = doc.splitTextToSize(quotation.note, pageWidth - 40);
                doc.text(splitNote, 20, totalY + 21);
            }

            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            const footerText = lang === "ar" ? "شكراً لثقتكم بنا" : "Thank you for your business";
            doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: "center" });

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

            // Open in new window instead of downloading
            const pdfBlob = doc.output("blob");
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, "_blank");
        } catch (error: any) {
            showAlert(`${t("failed_to_generate_preview") || "Failed to generate preview"}: ${error?.message || "Please try again."}`, "error");
        }
    };

    const handleDownloadPDF = async (id: string) => {
        setIsDownloading(id);
        try {
            const quotation = quotations.find((q) => q._id === id);
            if (!quotation) {
                showAlert(t("quotation_not_found") || "Quotation not found", "warning");
                return;
            }

            const client = clients.find((c) => c.id === quotation.clientId);
            const clientName = client?.business?.businessName || "";

            const jsPDF = (await import("jspdf")).default;
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            }) as any;

            const currency = lang === "ar" ? "ج.م" : "EGP";
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            const primaryColor: [number, number, number] = [102, 126, 234];
            const darkGray: [number, number, number] = [74, 85, 104];
            const lightGray: [number, number, number] = [237, 242, 247];

            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, pageWidth, 60, "F");

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("Your Company Name", 20, 25);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("123 Business St, City, Country", 20, 32);
            doc.text("+20 123 456 7890 | info@yourcompany.com", 20, 38);

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(lang === "ar" ? "عرض سعر" : "QUOTATION", pageWidth - 20, 25, { align: "right" });
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(quotation.quotationNumber, pageWidth - 20, 32, { align: "right" });

            const dateStr = new Date(quotation.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
            doc.text((lang === "ar" ? "التاريخ: " : "Date: ") + dateStr, pageWidth - 20, 38, { align: "right" });

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

            const tableData: any[] = [];
            let itemNumber = 1;

            const allPackages = services.flatMap((s: any) =>
                (s.packages || []).map((p: any) => ({ ...p, serviceName: lang === "ar" ? s.ar : s.en })),
            );

            if (quotation.packages && quotation.packages.length > 0) {
                quotation.packages.forEach((pkgId: any) => {
                    const pkgIdStr = typeof pkgId === "string" ? pkgId : pkgId._id || pkgId.id;
                    const pkg = allPackages.find((p: any) => p._id === pkgIdStr || p.id === pkgIdStr);
                    if (pkg) {
                        const packageName = (lang === "ar" ? pkg.nameAr : pkg.nameEn) || pkg.name || "Package";
                        const serviceName = pkg.serviceName || "Service";
                        const packagePrice = pkg.price || 0;

                        tableData.push([
                            itemNumber++,
                            `${packageName}\n(${serviceName})`,
                            `${packagePrice.toFixed(2)} ${currency}`,
                            "-",
                            `${packagePrice.toFixed(2)} ${currency}`,
                        ]);

                        // If package has items, add them as descriptive rows beneath the package
                        if (pkg.items && pkg.items.length > 0) {
                            pkg.items.forEach((it: any) => {
                                const inner = (it && (it.item || it)) || {};
                                let name = inner?.name || inner?.nameEn || inner?.nameAr;
                                const quantity = typeof it?.quantity !== "undefined" ? it.quantity : inner?.quantity;

                                // If item is just an ID (string or object with only _id), resolve from items list
                                if (!name || name === "(item)") {
                                    const itemId = typeof inner === "string" ? inner : inner?._id || inner?.id;
                                    if (itemId) {
                                        const foundItem = items.find((i: any) => String(i._id) === String(itemId) || String(i.id) === String(itemId));
                                        if (foundItem) {
                                            name = foundItem.name || (foundItem as any).nameEn || (foundItem as any).nameAr;
                                        }
                                    }
                                }

                                const qtyText = typeof quantity !== "undefined" ? ` x${quantity}` : "";
                                const itemText = `• ${name || "(item)"}${qtyText}`;

                                tableData.push(["", itemText, "", "", ""]);
                            });
                        }
                    }
                });
            }

            if (quotation.servicesPricing && quotation.servicesPricing.length > 0) {
                quotation.servicesPricing.forEach((sp: any) => {
                    const service = sp.service;
                    if (!service) return;

                    const serviceName = (lang === "ar" ? service.ar : service.en) || "Service";
                    const price = sp.customPrice || service.price || 0;
                    tableData.push([itemNumber++, serviceName, `${price.toFixed(2)} ${currency}`, "-", `${price.toFixed(2)} ${currency}`]);
                });
            }

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

            if (tableData.length === 0) {
                tableData.push([1, lang === "ar" ? "لا توجد خدمات" : "No services", `0.00 ${currency}`, "-", `0.00 ${currency}`]);
            }

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

            const finalY = doc.lastAutoTable.finalY + 10;
            const summaryX = pageWidth - 80;

            doc.setFontSize(10);
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

            doc.text(lang === "ar" ? "المجموع الفرعي:" : "Subtotal:", summaryX, finalY);
            doc.text(`${quotation.subtotal.toFixed(2)} ${currency}`, pageWidth - 20, finalY, { align: "right" });

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

            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            const totalY = quotation.discountValue > 0 ? finalY + 14 : finalY + 7;
            doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
            doc.rect(summaryX - 5, totalY - 5, 75, 10, "F");
            doc.text(lang === "ar" ? "الإجمالي:" : "Total:", summaryX, totalY + 2);
            doc.text(`${quotation.total.toFixed(2)} ${currency}`, pageWidth - 20, totalY + 2, { align: "right" });

            if (quotation.note) {
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(lang === "ar" ? "ملاحظات:" : "Notes:", 20, totalY + 15);
                doc.setFont("helvetica", "normal");
                const splitNote = doc.splitTextToSize(quotation.note, pageWidth - 40);
                doc.text(splitNote, 20, totalY + 21);
            }

            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            const footerText = lang === "ar" ? "شكراً لثقتكم بنا" : "Thank you for your business";
            doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: "center" });

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

            doc.save(`quotation-${quotation.quotationNumber}.pdf`);
        } catch (error) {
            showAlert(t("failed_to_generate_pdf") || "Failed to generate PDF. Please try again.", "error");
        } finally {
            setIsDownloading(null);
        }
    };

    // Auto preview / download when requested by parent
    useEffect(() => {
        // Only act when data is loaded
        if (!autoPreviewQuotationId && !autoDownloadQuotationId) return;
        if (clientsLoading || servicesLoading || itemsLoading || quotationsLoading) return;

        if (autoPreviewQuotationId && !autoPreviewDone) {
            const q = quotations.find(
                (x: any) => String(x._id) === String(autoPreviewQuotationId) || String(x.id) === String(autoPreviewQuotationId),
            );
            if (q) {
                (async () => {
                    try {
                        await handlePreviewPDF(q as Quotation);
                    } catch (e) {
                        // ignore
                    }
                    setAutoPreviewDone(true);
                })();
            } else {
                setAutoPreviewDone(true);
            }
        }

        if (autoDownloadQuotationId && !autoDownloadDone) {
            (async () => {
                try {
                    await handleDownloadPDF(autoDownloadQuotationId);
                } catch (e) {
                    // ignore
                }
                setAutoDownloadDone(true);
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        autoPreviewQuotationId,
        autoDownloadQuotationId,
        clientsLoading,
        servicesLoading,
        itemsLoading,
        quotationsLoading,
        quotations,
        autoPreviewDone,
        autoDownloadDone,
    ]);

    // Reset done flags when requested ids change
    useEffect(() => {
        setAutoPreviewDone(false);
    }, [autoPreviewQuotationId]);

    useEffect(() => {
        setAutoDownloadDone(false);
    }, [autoDownloadQuotationId]);

    const handleConvertToContract = async () => {
        if (!convertQuotationId) return;
        if (!contractStartDate || !contractEndDate) {
            showAlert(t("please_fill_dates") || "Please fill in start and end dates", "warning");
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

            showAlert(t("quotation_converted_to_contract") || "Quotation successfully converted to contract!", "success");
        } catch (error: any) {
            showAlert(error.response?.data?.message || t("failed_to_convert_quotation") || "Failed to convert to contract", "error");
        }
    };

    const openConvertModal = (quotationId: string) => {
        setConvertQuotationId(quotationId);
        setShowConvertModal(true);
    };

    const totalPages = Math.ceil(totalQuotations / pageSize);

    // If core data is still loading, show a spinner and don't render quotations yet
    if (clientsLoading || servicesLoading || itemsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2
                    className="text-light-500 animate-spin"
                    size={32}
                />
            </div>
        );
    }

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
                    <div className="flex-1">
                        <h2 className="text-light-900 dark:text-dark-50 text-xl font-bold">{clientName}</h2>
                        <p className="text-light-600 dark:text-dark-50 text-sm">{t("quotations") || "Quotations"}</p>
                    </div>
                    <button
                        onClick={onCreateNew}
                        className="btn-primary"
                    >
                        <Plus
                            size={16}
                            className="mr-2"
                        />
                        {t("create_new") || "Create New"}
                    </button>
                </div>
            </div>

            {/* Empty State */}
            {!quotationsLoading && displayedQuotations.length === 0 && (
                <div className="card">
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-light-600 dark:text-dark-400 mb-4 max-w-lg text-center text-lg">
                            {t("no_quotations_for_client") || "There are no quotations for this client"}
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={onCreateNew}
                                className="btn-primary px-6"
                            >
                                {t("create_quotation") || "Create Quotation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quotations List */}
            {displayedQuotations.length > 0 && (
                <div className="card">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="card-title">{t("existing_quotations") || "Existing Quotations"}</h3>
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
                                            <h4 className="text-light-900 dark:text-dark-50 font-semibold">
                                                {resolveClientName(quotation) || quotation.quotationNumber}
                                            </h4>
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
                                        {quotation.note && <p className="text-light-600 dark:text-dark-400 mb-2 text-sm italic">{quotation.note}</p>}
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
                                            onClick={() => onEdit(quotation)}
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
                                {t("showing") || "Showing"} {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalQuotations)}{" "}
                                {t("of") || "of"} {totalQuotations}
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
            {quotationsLoading && (
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

export default PreviewQuotation;
