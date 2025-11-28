import { useState } from "react";
import { Loader2, Eye, Edit2, Trash2, Download } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useClients, useQuotations, useServices, useItems, useDeleteQuotation } from "@/hooks/queries";
import { showConfirm, showAlert } from "@/utils/swal";
import type { Client } from "@/api/interfaces/clientinterface";
import type { Quotation } from "@/api/requests/quotationsService";
import CreateQuotation from "./CreateQuotation";
import CustomQuotation from "./CustomQuotation";
import PreviewQuotation from "./PreviewQuotation";

type View = "list" | "create" | "preview" | "custom";

const QuotationsPage = () => {
    const { t, lang } = useLang();

    const [currentView, setCurrentView] = useState<View>("list");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
    const [customCreateName, setCustomCreateName] = useState<string | null>(null);
    const [autoPreviewQuotationId, setAutoPreviewQuotationId] = useState<string | null>(null);
    const [autoDownloadQuotationId, setAutoDownloadQuotationId] = useState<string | null>(null);

    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: allQuotationsResponse } = useQuotations({ page: 1, limit: 1000 });

    const allQuotations: any[] = Array.isArray(allQuotationsResponse)
        ? allQuotationsResponse
        : allQuotationsResponse?.data && Array.isArray(allQuotationsResponse.data)
          ? allQuotationsResponse.data
          : [];

    const handleCreateQuotation = (client: Client) => {
        setSelectedClient(client);
        setEditingQuotation(null);
        setAutoPreviewQuotationId(null);
        setAutoDownloadQuotationId(null);
        setCurrentView("create");
    };

    const handleShowQuotations = (client: Client) => {
        setSelectedClient(client);
        setAutoPreviewQuotationId(null);
        setAutoDownloadQuotationId(null);
        setCurrentView("preview");
    };

    const handleCreateCustomQuotation = () => {
        setSelectedClient({ business: { businessName: t("custom_quotation") || "Custom Quotation" } } as Client);
        setEditingQuotation(null);
        setAutoPreviewQuotationId(null);
        setAutoDownloadQuotationId(null);
        setCurrentView("create");
    };

    const handleBack = () => {
        setCurrentView("list");
        setSelectedClient(null);
        setEditingQuotation(null);
        setAutoPreviewQuotationId(null);
        setAutoDownloadQuotationId(null);
    };

    const handleEditQuotation = (quotation: Quotation) => {
        setEditingQuotation(quotation);
        setAutoPreviewQuotationId(null);
        setAutoDownloadQuotationId(null);
        setCurrentView("create");
    };

    // Group custom quotations (those without clientId) by their clientName/customName
    const customQuotationsByName: { name: string; quotations: any[] }[] = (() => {
        const map = new Map<string, { name: string; quotations: any[] }>();
        allQuotations.forEach((q: any) => {
            if (!q) return;
            const hasClientId = q.clientId || q.client;
            if (hasClientId) return; // skip quotations attached to real clients

            const rawName = (q.clientName || q.customName || q.customClientName || "") as string;
            const displayName = rawName.trim() || t("unnamed_custom_quotation") || "Unnamed";
            const key = displayName.trim().toLowerCase();

            if (!map.has(key)) map.set(key, { name: displayName, quotations: [] });
            map.get(key)!.quotations.push(q);
        });

        return Array.from(map.values());
    })();

    // Build a map of quotation counts per client id (for quotations that reference a client)
    const quotationsCountByClientId: Record<string, number> = (() => {
        const counts: Record<string, number> = {};
        allQuotations.forEach((q: any) => {
            if (!q) return;
            // Determine client id from different shapes
            const cid = q.clientId || (q.client && (q.client._id || q.client.id));
            if (!cid) return;
            const key = String(cid);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    })();

    // Combine clients and custom groups into a single list and sort by name so they show together
    type CombinedItem =
        | { type: "client"; id: string; name: string; client: Client; quotationCount: number }
        | { type: "custom"; id: string; name: string; quotations: any[] };

    const combinedItems: CombinedItem[] = [];

    // add clients
    clients.forEach((client) => {
        const id = (client as any).id || (client as any)._id || "";
        const name = client.business?.businessName || client.personal?.fullName || t("unnamed_client") || "Unnamed";
        const count = quotationsCountByClientId[String(id)] || 0;
        combinedItems.push({ type: "client", id: String(id), name, client, quotationCount: count });
    });

    // add custom groups
    customQuotationsByName.forEach((g) => {
        combinedItems.push({ type: "custom", id: `custom-${g.name}`, name: g.name, quotations: g.quotations });
    });

    // Sort alphabetically by name so clients and custom groups appear interleaved
    combinedItems.sort((a, b) => a.name.localeCompare(b.name));

    // Individual custom quotations (those without clientId/client object)
    const customQuotations: any[] = allQuotations.filter((q: any) => {
        if (!q) return false;
        const hasClientId = q.clientId || q.client;
        return !hasClientId;
    });

    const deleteQuotationMutation = useDeleteQuotation();

    const handleDeleteQuotation = async (id: string) => {
        const confirmed = await showConfirm("Are you sure you want to delete this quotation?", "Yes", "No");
        if (!confirmed) return;

        try {
            await deleteQuotationMutation.mutateAsync(id);
        } catch (error: any) {
            showAlert(error?.response?.data?.message || "Failed to delete quotation", "error");
        }
    };

    // Services and items needed to generate PDFs client-side
    const { data: servicesResponse, isLoading: servicesLoading } = useServices({ limit: 100 });
    const services = servicesResponse?.data || [];
    const { data: itemsResponse, isLoading: itemsLoading } = useItems({ limit: 1000 });
    const items = itemsResponse?.data || [];

    // Generate PDF for a quotation (mode = 'preview' opens in new tab, 'download' saves file)
    const generatePdfForQuotation = async (quotation: any, mode: "preview" | "download") => {
        // Wait for necessary data
        const waitForLoaded = async (timeout = 10000) => {
            const start = Date.now();
            // eslint-disable-next-line no-constant-condition
            while (true) {
                if (!servicesLoading && !itemsLoading) return true;
                if (Date.now() - start > timeout) return false;
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
            const jsPDF = (await import("jspdf")).default;
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as any;
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
            doc.text(quotation.quotationNumber || "", pageWidth - 20, 32, { align: "right" });

            const dateStr = quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "";
            doc.text((lang === "ar" ? "التاريخ: " : "Date: ") + dateStr, pageWidth - 20, 38, { align: "right" });

            let yPos = 75;
            const clientNameText = quotation.clientName || "";
            if (clientNameText) {
                doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
                doc.setFontSize(11);
                doc.setFont("helvetica", "bold");
                doc.text(lang === "ar" ? "العميل:" : "Client:", 20, yPos);
                doc.setFont("helvetica", "normal");
                doc.text(clientNameText, 20, yPos + 6);
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
                headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 11, fontStyle: "bold" },
                styles: { fontSize: 10, cellPadding: 5 },
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
            doc.text(`${quotation.subtotal?.toFixed(2) ?? 0} ${currency}`, pageWidth - 20, finalY, { align: "right" });

            if (quotation.discountValue > 0) {
                let discountAmount = 0;
                if (quotation.discountType === "percentage") discountAmount = (quotation.subtotal * quotation.discountValue) / 100;
                else discountAmount = quotation.discountValue;

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
            doc.text(`${quotation.total?.toFixed(2) ?? 0} ${currency}`, pageWidth - 20, totalY + 2, { align: "right" });

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

            const statusText = (lang === "ar" ? (quotation.status === "draft" ? "مسودة" : quotation.status) : quotation.status || "")
                .toString()
                .toUpperCase();
            doc.text(`${lang === "ar" ? "الحالة" : "Status"}: ${statusText}`, pageWidth / 2, pageHeight - 15, { align: "center" });

            if (mode === "preview") {
                const pdfBlob = doc.output("blob");
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, "_blank");
            } else {
                doc.save(`quotation-${quotation.quotationNumber || quotation._id}.pdf`);
            }
        } catch (error: any) {
            showAlert((t("failed_to_generate_pdf") as string) || "Failed to generate PDF. Please try again.", "error");
        }
    };

    // Render Create View
    if (currentView === "create" && selectedClient) {
        const clientId = (selectedClient as any).id || (selectedClient as any)._id || undefined;
        const clientName = selectedClient.business?.businessName || selectedClient.personal?.fullName || t("custom_quotation") || "Custom Quotation";

        return (
            <div className="px-4 sm:px-6">
                <CreateQuotation
                    clientId={clientId}
                    clientName={clientName}
                    onBack={handleBack}
                    onSuccess={(newClientId?: string, newClientName?: string) => {
                        // If API returned clientId, find corresponding client and open preview for it
                        if (newClientId) {
                            const found = clients.find(
                                (c: any) => String(c.id) === String(newClientId) || String((c as any)._id) === String(newClientId),
                            );
                            if (found) return handleShowQuotations(found);

                            // If client not in list (e.g. recently created elsewhere), create a minimal stub and open preview
                            const stub = { id: newClientId, business: { businessName: newClientName || "" } } as Client;
                            return handleShowQuotations(stub);
                        }

                        // If we have a client name (custom quotation), return to list view
                        if (!newClientId && newClientName) {
                            setCurrentView("list");
                            setSelectedClient(null);
                            setEditingQuotation(null);
                            return;
                        }

                        // fallback: re-open preview for the currently selected client (if any)
                        if (selectedClient) return handleShowQuotations(selectedClient);

                        // last resort: go back to list
                        setCurrentView("list");
                    }}
                    editQuotation={editingQuotation || undefined}
                />
            </div>
        );
    }

    // Render Custom Create View (for grouped custom quotation names)
    if (currentView === "custom" && customCreateName) {
        return (
            <div className="px-4 sm:px-6">
                <CustomQuotation
                    clientName={customCreateName}
                    onBack={handleBack}
                    onSuccess={(newClientId?: string, newClientName?: string) => {
                        if (newClientId) {
                            const found = clients.find(
                                (c: any) => String(c.id) === String(newClientId) || String((c as any)._id) === String(newClientId),
                            );
                            if (found) return handleShowQuotations(found);

                            const stub = { id: newClientId, business: { businessName: newClientName || "" } } as Client;
                            return handleShowQuotations(stub);
                        }

                        if (!newClientId && newClientName) {
                            setCurrentView("list");
                            setSelectedClient(null);
                            setEditingQuotation(null);
                            return;
                        }

                        if (selectedClient) return handleShowQuotations(selectedClient);
                        setCurrentView("list");
                    }}
                />
            </div>
        );
    }

    // Render Preview View
    if (currentView === "preview" && selectedClient) {
        const clientId = (selectedClient as any).id || (selectedClient as any)._id || undefined;
        const clientName = selectedClient.business?.businessName || selectedClient.personal?.fullName || "";

        return (
            <div className="px-4 sm:px-6">
                <PreviewQuotation
                    clientId={clientId}
                    clientName={clientName}
                    onBack={handleBack}
                    onCreateNew={() => setCurrentView("create")}
                    onEdit={handleEditQuotation}
                    autoPreviewQuotationId={autoPreviewQuotationId ?? undefined}
                    autoDownloadQuotationId={autoDownloadQuotationId ?? undefined}
                />
            </div>
        );
    }

    // Render List View (Client Selection)
    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("quotations") || "Quotations"}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("create_and_manage_quotations") || "Create and manage quotations"}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCreateCustomQuotation}
                        className="btn-primary"
                        title={t("create_global_quotation") || "Create Custom Quotation"}
                    >
                        {t("custom_quotation") || "Custom Quotation"}
                    </button>
                </div>
            </div>

            {/* Client Selection */}
            {clientsLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2
                        className="text-light-500 animate-spin"
                        size={32}
                    />
                </div>
            ) : (
                <>
                    {/* Combined grid of clients and custom quotation groups (sorted by name) */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {combinedItems.map((item) => {
                            if (item.type === "client") {
                                const client = item.client;
                                return (
                                    <div
                                        key={`client-${item.id}`}
                                        className="card flex flex-col"
                                    >
                                        <h3 className="card-title text-lg">{item.name}</h3>
                                        <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{client.business?.category || ""}</p>
                                        <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                                            {item.quotationCount} {t("quotations") || "quotations"}
                                        </p>
                                        <div className="mt-4 flex flex-col gap-2">
                                            <button
                                                onClick={() => handleCreateQuotation(client)}
                                                className="btn-primary w-full"
                                            >
                                                {t("create_quotation") || "Create Quotation"}
                                            </button>
                                            <button
                                                onClick={() => handleShowQuotations(client)}
                                                className="btn-ghost w-full"
                                            >
                                                {t("show_quotations") || "Show Quotations"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            // skip rendering grouped custom-quotation cards here
                            return null;
                        })}
                    </div>

                    {combinedItems.length === 0 && (
                        <div className="card">
                            <div className="py-8 text-center">
                                <p className="text-light-600 dark:text-dark-400">{t("no_clients_found") || "No clients found"}</p>
                            </div>
                        </div>
                    )}

                    {/* Bottom table: show individual custom quotations only */}
                    {customQuotations.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-light-500 dark:text-dark-50 text-lg font-semibold">
                                {t("custom_quotations") || "Custom Quotations"}
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {customQuotations.map((q) => (
                                    <div
                                        key={q._id}
                                        className="border-light-600 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50 rounded-lg border p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="mb-2 flex items-center gap-3">
                                                    <h4 className="text-light-900 dark:text-dark-50 font-semibold">
                                                        {q.clientName ||
                                                            q.customName ||
                                                            q.customClientName ||
                                                            t("unnamed_custom_quotation") ||
                                                            "Unnamed"}
                                                    </h4>
                                                    <span className="text-light-600 dark:text-dark-400 text-sm">{q.quotationNumber || "-"}</span>
                                                </div>
                                                <p className="text-light-600 dark:text-dark-400 mb-1 text-sm">
                                                    {q.createdAt ? new Date(q.createdAt).toLocaleString() : "-"}
                                                </p>
                                                {q.note && <p className="text-light-600 dark:text-dark-400 mb-2 text-sm italic">{q.note}</p>}
                                                <p className="text-light-900 dark:text-dark-50 font-bold">
                                                    {q.total ?? "-"} {lang === "ar" ? "ج.م" : "EGP"}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => generatePdfForQuotation(q, "preview")}
                                                    className="btn-ghost"
                                                    title={t("preview_pdf") || "Preview PDF"}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => generatePdfForQuotation(q, "download")}
                                                    className="btn-ghost"
                                                    title={t("download_pdf") || "Download PDF"}
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingQuotation(q);
                                                        setSelectedClient({
                                                            business: { businessName: q.clientName || q.customName || q.customClientName || "" },
                                                        } as Client);
                                                        setCurrentView("create");
                                                    }}
                                                    className="btn-ghost"
                                                    title={t("edit") || "Edit"}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuotation(q._id)}
                                                    className="btn-ghost text-danger-500"
                                                    title={t("delete") || "Delete"}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default QuotationsPage;
