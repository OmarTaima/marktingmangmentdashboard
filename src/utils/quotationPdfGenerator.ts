// utils/quotationPdfGenerator.ts

interface QuotationPDFOptions {
    quotation: any;
    clientName: string;
    lang: "ar" | "en";
    t: (key: string) => string;
    items?: any[];
}

export const generateQuotationPDF = async ({ quotation, clientName, lang, items = [] }: QuotationPDFOptions) => {
    try {
        const isRTL = lang === "ar";
        const dateStr = quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "";
        const validUntilStr = quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "";

        // Helper function to safely escape HTML
        const escapeHtml = (text: string) => {
            if (!text) return "";
            return text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        };

        // Helper function to get localized name
        const getLocalizedName = (obj: any) => {
            if (!obj) return "";
            if (lang === "ar") {
                return obj.nameAr || obj.ar || obj.name || obj.nameEn || obj.en || "";
            }
            return obj.nameEn || obj.en || obj.name || obj.nameAr || obj.ar || "";
        };

        // Helper function to find item by ID
        const findItemById = (itemId: string) => {
            return items.find((i: any) => String(i._id) === String(itemId) || String(i.id) === String(itemId));
        };

        // Helper function to get item name from various formats
        const getItemName = (item: any) => {
            // If item has a name directly
            if (item.name) return getLocalizedName(item) || item.name;
            
            // If item has an item object
            if (item.item) {
                if (typeof item.item === 'object') {
                    return getLocalizedName(item.item) || item.item.name || "(item)";
                }
                if (typeof item.item === 'string') {
                    const found = findItemById(item.item);
                    if (found) return getLocalizedName(found) || found.name || "(item)";
                    return `Item ${item.item.slice(-6)}`;
                }
            }
            
            return "(item)";
        };

        // Helper function to format quantity display
        const formatQuantity = (quantity: any) => {
            if (quantity === undefined || quantity === null) return "";
            if (typeof quantity === 'boolean') {
                return quantity ? " ✓" : "";
            }
            if (typeof quantity === 'number') {
                return ` ×${quantity}`;
            }
            if (typeof quantity === 'string') {
                // Check if it's a percentage
                if (quantity.includes('%')) {
                    return ` (${quantity})`;
                }
                // Check if it's a number string
                const num = parseFloat(quantity);
                if (!isNaN(num)) {
                    return ` ×${num}`;
                }
                return ` (${quantity})`;
            }
            return "";
        };

        const currency = lang === "ar" ? "ج.م" : "EGP";

        // Build services HTML
        let servicesHTML = "";
        let itemNumber = 1;

        // Process packages
        if (quotation.packages && quotation.packages.length > 0) {
            for (const pkg of quotation.packages) {
                if (pkg.deleted === true) continue;
                
                const packageName = getLocalizedName(pkg) || pkg.name || "Package";
                const packagePrice = pkg.price || 0;
                
                servicesHTML += `
                    <tr style="background-color: #f0fdf4;">
                        <td style="text-align: center; padding: 12px; font-weight: 700;">${itemNumber++}</td>
                        <td style="padding: 12px;">
                            <strong style="color: #166534;">📦 ${escapeHtml(packageName)}</strong>
                            <div style="font-size: 9pt; color: #166534; margin-top: 4px;">${packagePrice.toFixed(2)} ${currency}</div>
                        </td>
                        <td style="text-align: right; padding: 12px;">${packagePrice.toFixed(2)} ${currency}</td>
                        <td style="text-align: center; padding: 12px;">-</td>
                        <td style="text-align: right; padding: 12px;"><strong>${packagePrice.toFixed(2)} ${currency}</strong></td>
                    </tr>
                `;
                
                // Process package items - just show as indented list without prices
                if (pkg.items && pkg.items.length > 0) {
                    for (const it of pkg.items) {
                        const itemName = getItemName(it);
                        const quantityText = formatQuantity(it.quantity);
                        const itemNote = it.note || "";
                        
                        // Clean up any weird characters
                        const cleanNote = itemNote ? itemNote.replace(/[���]/g, '') : '';
                        
                        servicesHTML += `
                            <tr style="background-color: #fafafa;">
                                <td style="padding: 8px; text-align: center;"></td>
                                <td style="padding-left: 30px; padding: 8px; color: #4a5568;">
                                    <span style="color: #9ca3af;">↳</span> ${escapeHtml(itemName)}${quantityText}
                                    ${cleanNote ? `<div style="font-size: 9pt; color: #f59e0b; margin-top: 4px; margin-left: 16px;">📝 ${escapeHtml(cleanNote)}</div>` : ''}
                                </td>
                                <td style="padding: 8px;"></td>
                                <td style="padding: 8px;"></td>
                                <td style="padding: 8px;"></td>
                            </tr>
                        `;
                    }
                }
            }
        }

        // Process services pricing
        if (quotation.servicesPricing && quotation.servicesPricing.length > 0) {
            for (const sp of quotation.servicesPricing) {
                const service = sp.service;
                if (!service) continue;
                
                let serviceName = "";
                let price = sp.customPrice || 0;
                
                if (typeof service === 'object' && service !== null) {
                    serviceName = getLocalizedName(service) || "Service";
                    if (!price) price = service.price || 0;
                } else if (typeof service === 'string') {
                    serviceName = `Service ${service.slice(-6)}`;
                }
                
                servicesHTML += `
                    <tr>
                        <td style="text-align: center; padding: 12px;">${itemNumber++}</td>
                        <td style="padding: 12px;">
                            ${escapeHtml(serviceName)}
                            <div style="font-size: 9pt; color: #666; margin-top: 4px;">${lang === "ar" ? "خدمة فردية" : "Individual Service"}</div>
                        </td>
                        <td style="text-align: right; padding: 12px;">${price.toFixed(2)} ${currency}</td>
                        <td style="text-align: center; padding: 12px;">-</td>
                        <td style="text-align: right; padding: 12px;"><strong>${price.toFixed(2)} ${currency}</strong></td>
                    </tr>
                `;
            }
        }

        // Process custom services
        if (quotation.customServices && quotation.customServices.length > 0) {
            for (const cs of quotation.customServices) {
                let finalPrice = cs.price;
                let discountText = "-";
                const serviceName = lang === "ar" ? cs.ar : cs.en;
                
                if (cs.discount && cs.discount > 0) {
                    if (cs.discountType === "percentage") {
                        const discountAmt = (cs.price * cs.discount) / 100;
                        finalPrice = cs.price - discountAmt;
                        discountText = `${cs.discount}%`;
                    } else {
                        finalPrice = cs.price - cs.discount;
                        discountText = `${cs.discount} ${currency}`;
                    }
                }

                servicesHTML += `
                    <tr>
                        <td style="text-align: center; padding: 12px;">${itemNumber++}</td>
                        <td style="padding: 12px;">
                            ${escapeHtml(serviceName)}
                            <div style="font-size: 9pt; color: #666; margin-top: 4px;">${lang === "ar" ? "خدمة مخصصة" : "Custom Service"}</div>
                        </td>
                        <td style="text-align: right; padding: 12px;">${cs.price.toFixed(2)} ${currency}</td>
                        <td style="text-align: center; padding: 12px;">${discountText}</td>
                        <td style="text-align: right; padding: 12px;"><strong>${finalPrice.toFixed(2)} ${currency}</strong></td>
                    </tr>
                `;
            }
        }

        // Empty state
        if (servicesHTML === "") {
            servicesHTML = `
                <tr>
                    <td style="text-align: center; padding: 12px;" colspan="5">${lang === "ar" ? "لا توجد خدمات" : "No services"}</td>
                </tr>
            `;
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (quotation.discountValue > 0) {
            if (quotation.discountType === "percentage") {
                discountAmount = (quotation.subtotal * quotation.discountValue) / 100;
            } else {
                discountAmount = quotation.discountValue;
            }
        }

        // Get status text
        let statusText = (quotation.status || "").toUpperCase();
        if (lang === "ar") {
            const statusMap: Record<string, string> = {
                draft: "مسودة",
                sent: "مرسل",
                approved: "موافق عليه",
                rejected: "مرفوض",
                expired: "منتهي",
            };
            statusText = statusMap[quotation.status] || quotation.status;
        }

        // Clean up any weird characters in notes
        const cleanMainNote = quotation.note ? quotation.note.replace(/[���]/g, '') : '';

        const htmlContent = `<!DOCTYPE html>
<html dir="${isRTL ? "rtl" : "ltr"}" lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation - ${quotation.quotationNumber || ""}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            direction: ${isRTL ? "rtl" : "ltr"};
        }

        @page {
            size: A4;
            margin: 20mm;
        }

        .page {
            background: white;
            padding: 0;
            margin: 0;
        }

        .header {
            background: #dc2626;
            color: white;
            padding: 30px 40px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 20px;
        }

        .company-info {
            flex: 1;
        }

        .company-name {
            font-size: 28pt;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .company-subtitle {
            font-size: 11pt;
            margin-bottom: 10px;
            opacity: 0.95;
        }

        .company-contact {
            font-size: 9pt;
            opacity: 0.9;
            line-height: 1.4;
        }

        .quotation-info {
            text-align: ${isRTL ? "left" : "right"};
        }

        .quotation-title-main {
            font-size: 20pt;
            font-weight: 700;
            text-align: center;
            margin: 30px 0;
            color: #333;
        }

        .party-box {
            background: #f5f5f5;
            border: 1px solid #c8c8c8;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }

        .party-label {
            font-size: 12pt;
            font-weight: 700;
            margin-bottom: 10px;
            color: #333;
        }

        .party-details {
            font-size: 10pt;
            line-height: 1.8;
            color: #4a5568;
        }

        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }

        .services-table th {
            background: #dc2626;
            color: white;
            padding: 12px;
            font-weight: 600;
            font-size: 11pt;
            border: 1px solid #b91c1c;
        }

        .services-table td {
            padding: 10px;
            border: 1px solid #e2e8f0;
            font-size: 10pt;
            vertical-align: top;
        }

        .services-table tr:nth-child(even) {
            background-color: #f7fafc;
        }

        .summary-section {
            margin: 25px 0;
            padding: 20px;
            background: #f7fafc;
            border-radius: 8px;
            text-align: right;
        }

        .summary-row {
            margin: 8px 0;
            font-size: 11pt;
        }

        .total-row {
            font-size: 14pt;
            font-weight: 700;
            color: #dc2626;
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #cbd5e0;
        }

        .notes-section {
            margin: 25px 0;
            padding: 20px;
            background: #fff5f0;
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
        }

        .notes-title {
            font-size: 12pt;
            font-weight: 700;
            margin-bottom: 10px;
            color: #f59e0b;
        }

        .notes-content {
            font-size: 10pt;
            line-height: 1.7;
            color: #4a5568;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .validity-section {
            margin: 15px 0;
            padding: 10px 20px;
            background: #fef3c7;
            border-radius: 8px;
            text-align: center;
        }

        .divider {
            border: 0;
            border-top: 1px solid #c8c8c8;
            margin: 25px 0;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 9pt;
            font-weight: 600;
            margin-top: 10px;
        }

        .status-draft { background: #e2e8f0; color: #4a5568; }
        .status-sent { background: #bfdbfe; color: #1e40af; }
        .status-approved { background: #dcfce7; color: #166534; }
        .status-rejected { background: #fee2e2; color: #991b1b; }
        .status-expired { background: #fed7aa; color: #92400e; }

        .signature-section {
            margin-top: 40px;
            page-break-inside: avoid;
        }

        .signature-row {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }

        .signature-box {
            text-align: center;
            flex: 1;
            padding: 0 30px;
        }

        .signature-label {
            font-weight: 700;
            margin-bottom: 30px;
            font-size: 11pt;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 200px;
            margin: 0 auto;
        }

        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 9pt;
            color: #999;
        }

        @media print {
            body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            
            .header {
                background: #dc2626 !important;
                color: white !important;
            }

            .services-table th {
                background: #dc2626 !important;
                color: white !important;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="company-info">
                <div class="company-name">${lang === "ar" ? "صابر جروب" : "SABER GROUP"}</div>
                <div class="company-subtitle">${lang === "ar" ? "وكالة تسويق" : "MARKETING AGENCY"}</div>
                <div class="company-contact">
                    <div>${lang === "ar" ? "٨ شارع الحمزاوي, النادي طنطا الغربيه" : "8 Elhamzawy St, Elnady, Tanta-Elghabria"}</div>
                    <div>01553596428</div>
                    <div>info@sabergroup-eg.com</div>
                </div>
            </div>
            <div class="quotation-info">
                <div style="font-size: 16pt; font-weight: 700; margin-bottom: 5px;">${lang === "ar" ? "عرض سعر" : "QUOTATION"}</div>
                <div style="font-size: 11pt;">${quotation.quotationNumber || ""}</div>
                <div style="font-size: 9pt; margin-top: 5px;">${lang === "ar" ? "التاريخ:" : "Date:"} ${dateStr}</div>
                <div class="status-badge status-${quotation.status || 'draft'}">${statusText}</div>
            </div>
        </div>

        <div class="quotation-title-main">
            ${lang === "ar" ? "عرض سعر لخدمات إدارة منصات التواصل الاجتماعي" : "Social Media Management Services Quotation"}
        </div>

        <div class="party-box">
            <div class="party-label">${lang === "ar" ? "العميل" : "Client"}</div>
            <div class="party-details">${escapeHtml(clientName) || (lang === "ar" ? "غير محدد" : "Not specified")}</div>
        </div>

        <table class="services-table">
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 55%;">${lang === "ar" ? "الخدمة / الباقة" : "Service / Package"}</th>
                    <th style="width: 13%;">${lang === "ar" ? "السعر" : "Price"}</th>
                    <th style="width: 12%;">${lang === "ar" ? "الخصم" : "Discount"}</th>
                    <th style="width: 15%;">${lang === "ar" ? "الإجمالي" : "Total"}</th>
                </tr>
            </thead>
            <tbody>
                ${servicesHTML}
            </tbody>
        </table>

        <div class="summary-section">
            <div class="summary-row">
                <strong>${lang === "ar" ? "المجموع الفرعي:" : "Subtotal:"}</strong> ${(quotation.subtotal || 0).toFixed(2)} ${currency}
            </div>
            ${quotation.discountValue > 0 ? `
            <div class="summary-row">
                <strong>${lang === "ar" ? "الخصم:" : "Discount:"}</strong> 
                ${quotation.discountType === "percentage" ? `${quotation.discountValue}%` : `${quotation.discountValue.toFixed(2)} ${currency}`}
                (-${discountAmount.toFixed(2)} ${currency})
            </div>
            ` : ''}
            <div class="total-row">
                <strong>${lang === "ar" ? "الإجمالي:" : "Total:"}</strong> ${(quotation.total || 0).toFixed(2)} ${currency}
            </div>
        </div>

        ${validUntilStr ? `
        <div class="validity-section">
            <strong>${lang === "ar" ? "صالح حتى:" : "Valid Until:"}</strong> ${validUntilStr}
        </div>
        ` : ''}

        ${cleanMainNote ? `
        <div class="notes-section">
            <div class="notes-title">${lang === "ar" ? "ملاحظات:" : "Notes:"}</div>
            <div class="notes-content">${escapeHtml(cleanMainNote).replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        <hr class="divider">

        <div class="signature-section no-break">
            <div class="signature-row">
                <div class="signature-box">
                    <div class="signature-label">${lang === "ar" ? "توقيع الطرف الأول" : "First Party Signature"}</div>
                    <div class="signature-line"></div>
                </div>
                <div class="signature-box">
                    <div class="signature-label">${lang === "ar" ? "توقيع الطرف الثاني" : "Second Party Signature"}</div>
                    <div class="signature-line"></div>
                </div>
            </div>
        </div>

        <div class="footer">
            ${lang === "ar" ? "شكراً لثقتكم بنا" : "Thank you for your business"}
        </div>
    </div>
</body>
</html>`;

        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            throw new Error("Pop-up blocked. Please allow pop-ups for this site.");
        }

        printWindow.document.write(htmlContent);
        printWindow.document.close();

        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                setTimeout(() => {
                    printWindow.close();
                }, 500);
            }, 250);
        };

        return true;
    } catch (error) {
        console.error("Error generating quotation PDF:", error);
        throw error;
    }
};