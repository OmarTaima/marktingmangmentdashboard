/**
 * Quotation PDF Generator Utility
 * Creates a professional PDF document for quotations
 */

import type { Quotation } from "@/api/requests/quotationsService";

interface PDFGeneratorOptions {
    quotation: Quotation;
    clientName?: string;
    companyInfo?: {
        name: string;
        logo?: string;
        address?: string;
        phone?: string;
        email?: string;
        website?: string;
        taxId?: string;
    };
    lang?: "en" | "ar";
}

/**
 * Generate HTML content for the PDF
 */
export const generateQuotationHTML = (options: PDFGeneratorOptions): string => {
    const { quotation, clientName, companyInfo, lang = "en" } = options;
    const isRTL = lang === "ar";
    const currency = lang === "ar" ? "ج.م" : "EGP";

    // Calculate discount amount
    let discountAmount = 0;
    if (quotation.discountValue > 0) {
        if (quotation.discountType === "percentage") {
            discountAmount = (quotation.subtotal * quotation.discountValue) / 100;
        } else {
            discountAmount = quotation.discountValue;
        }
    }

    const html = `
<!DOCTYPE html>
<html dir="${isRTL ? "rtl" : "ltr"}" lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation ${quotation.quotationNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: ${isRTL ? "'Cairo', 'Arial', sans-serif" : "'Inter', 'Segoe UI', Arial, sans-serif"};
            line-height: 1.6;
            color: #1a202c;
            background: #ffffff;
            padding: 40px;
            direction: ${isRTL ? "rtl" : "ltr"};
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }

        /* Header Section */
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            position: relative;
        }

        .header::after {
            content: '';
            position: absolute;
            bottom: -20px;
            ${isRTL ? "right" : "left"}: 0;
            width: 100%;
            height: 20px;
            background: white;
            border-radius: ${isRTL ? "0 20px 0 0" : "20px 0 0 0"};
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 30px;
        }

        .company-info {
            flex: 1;
        }

        .company-logo {
            max-width: 150px;
            max-height: 80px;
            margin-bottom: 15px;
        }

        .company-name {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .company-details {
            font-size: 13px;
            opacity: 0.95;
            line-height: 1.8;
        }

        .quotation-info {
            text-align: ${isRTL ? "left" : "right"};
            background: rgba(255, 255, 255, 0.15);
            padding: 20px;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }

        .quotation-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .quotation-number {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 10px;
            color: #ffd700;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .quotation-date {
            font-size: 14px;
            opacity: 0.9;
        }

        /* Client Section */
        .client-section {
            padding: 30px 40px;
            background: #f7fafc;
            border-bottom: 2px solid #e2e8f0;
        }

        .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .client-name {
            font-size: 20px;
            font-weight: 600;
            color: #2d3748;
        }

        /* Services Table */
        .services-section {
            padding: 30px 40px;
        }

        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        .services-table thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .services-table th {
            padding: 15px;
            text-align: ${isRTL ? "right" : "left"};
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .services-table th:last-child,
        .services-table td:last-child {
            text-align: ${isRTL ? "left" : "right"};
        }

        .services-table tbody tr {
            border-bottom: 1px solid #e2e8f0;
            transition: background 0.2s;
        }

        .services-table tbody tr:hover {
            background: #f7fafc;
        }

        .services-table tbody tr:last-child {
            border-bottom: 2px solid #cbd5e0;
        }

        .services-table td {
            padding: 15px;
            font-size: 14px;
            color: #4a5568;
        }

        .service-name {
            font-weight: 600;
            color: #2d3748;
        }

        .service-description {
            font-size: 12px;
            color: #718096;
            margin-top: 4px;
        }

        .service-badge {
            display: inline-block;
            padding: 3px 8px;
            background: #e6fffa;
            color: #047857;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 4px;
        }

        .price {
            font-weight: 600;
            color: #2d3748;
            white-space: nowrap;
        }

        /* Summary Section */
        .summary-section {
            padding: 30px 40px;
            background: #f7fafc;
        }

        .summary-table {
            width: 100%;
            max-width: 400px;
            margin-${isRTL ? "right" : "left"}: auto;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            font-size: 15px;
        }

        .summary-row.subtotal {
            color: #4a5568;
            border-bottom: 1px solid #cbd5e0;
        }

        .summary-row.discount {
            color: #e53e3e;
            font-weight: 600;
        }

        .summary-row.total {
            font-size: 20px;
            font-weight: 700;
            color: #2d3748;
            border-top: 3px solid #667eea;
            padding-top: 15px;
            margin-top: 10px;
        }

        .summary-label {
            font-weight: 600;
        }

        .summary-value {
            font-weight: 700;
        }

        .override-badge {
            display: inline-block;
            padding: 2px 8px;
            background: #fef3c7;
            color: #92400e;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-${isRTL ? "right" : "left"}: 8px;
        }

        /* Notes Section */
        .notes-section {
            padding: 30px 40px;
            background: #fffbeb;
            border-top: 2px solid #fbbf24;
        }

        .notes-content {
            font-size: 14px;
            color: #78350f;
            line-height: 1.8;
            white-space: pre-wrap;
        }

        /* Valid Until Section */
        .validity-section {
            padding: 20px 40px;
            background: #fef2f2;
            border-top: 2px solid #f87171;
            text-align: center;
        }

        .validity-text {
            font-size: 14px;
            color: #991b1b;
            font-weight: 600;
        }

        /* Footer */
        .footer {
            padding: 30px 40px;
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            text-align: center;
        }

        .footer-content {
            font-size: 13px;
            opacity: 0.9;
            line-height: 1.8;
        }

        .footer-divider {
            height: 1px;
            background: rgba(255, 255, 255, 0.2);
            margin: 15px 0;
        }

        .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .status-draft {
            background: #f3f4f6;
            color: #6b7280;
        }

        .status-sent {
            background: #dbeafe;
            color: #1e40af;
        }

        .status-approved {
            background: #d1fae5;
            color: #065f46;
        }

        .status-rejected {
            background: #fee2e2;
            color: #991b1b;
        }

        /* Utilities */
        .text-center {
            text-align: center;
        }

        .mb-2 {
            margin-bottom: 8px;
        }

        .mb-4 {
            margin-bottom: 16px;
        }

        /* Print Styles */
        @media print {
            body {
                padding: 0;
            }

            .container {
                border: none;
                box-shadow: none;
            }

            .services-table tbody tr:hover {
                background: transparent;
            }
        }

        /* RTL Adjustments */
        ${
            isRTL
                ? `
        .company-info {
            text-align: right;
        }

        .quotation-info {
            text-align: left;
        }
        `
                : ""
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <div class="header-content">
                <div class="company-info">
                    ${companyInfo?.logo ? `<img src="${companyInfo.logo}" alt="Company Logo" class="company-logo">` : ""}
                    <div class="company-name">${companyInfo?.name || (lang === "ar" ? "شركتك" : "Your Company")}</div>
                    <div class="company-details">
                        ${companyInfo?.address ? `${companyInfo.address}<br>` : ""}
                        ${companyInfo?.phone ? `${lang === "ar" ? "هاتف" : "Phone"}: ${companyInfo.phone}<br>` : ""}
                        ${companyInfo?.email ? `${lang === "ar" ? "بريد" : "Email"}: ${companyInfo.email}<br>` : ""}
                        ${companyInfo?.website ? `${lang === "ar" ? "موقع" : "Website"}: ${companyInfo.website}<br>` : ""}
                        ${companyInfo?.taxId ? `${lang === "ar" ? "الرقم الضريبي" : "Tax ID"}: ${companyInfo.taxId}` : ""}
                    </div>
                </div>
                <div class="quotation-info">
                    <div class="quotation-title">${lang === "ar" ? "عرض سعر" : "Quotation"}</div>
                    <div class="quotation-number">${quotation.quotationNumber}</div>
                    <div class="quotation-date">
                        <strong>${lang === "ar" ? "التاريخ" : "Date"}:</strong><br>
                        ${new Date(quotation.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                </div>
            </div>
        </div>

        <!-- Client Section -->
        ${
            clientName
                ? `
        <div class="client-section">
            <div class="section-title">${lang === "ar" ? "العميل" : "Client"}</div>
            <div class="client-name">${clientName}</div>
        </div>
        `
                : ""
        }

        <!-- Services Section -->
        <div class="services-section">
            <div class="section-title">${lang === "ar" ? "الخدمات" : "Services"}</div>
            <table class="services-table">
                <thead>
                    <tr>
                        <th style="width: 5%">#</th>
                        <th style="width: 50%">${lang === "ar" ? "الخدمة" : "Service"}</th>
                        <th style="width: 15%">${lang === "ar" ? "السعر" : "Price"}</th>
                        <th style="width: 15%">${lang === "ar" ? "الخصم" : "Discount"}</th>
                        <th style="width: 15%">${lang === "ar" ? "المجموع" : "Total"}</th>
                    </tr>
                </thead>
                <tbody>
                    ${quotation.servicesPricing
                        .map((sp, index) => {
                            const service = sp.service;
                            const price = sp.customPrice || service.price;
                            return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>
                                <div class="service-name">${lang === "ar" ? service.ar : service.en}</div>
                                ${
                                    service.packages && service.packages.length > 0
                                        ? `
                                    <div class="service-description">
                                        ${lang === "ar" ? "الباقات" : "Packages"}: ${service.packages.map((p) => (lang === "ar" ? p.nameAr : p.nameEn)).join(", ")}
                                    </div>
                                `
                                        : ""
                                }
                            </td>
                            <td class="price">${price.toFixed(2)} ${currency}</td>
                            <td class="price">-</td>
                            <td class="price">${price.toFixed(2)} ${currency}</td>
                        </tr>
                    `;
                        })
                        .join("")}
                    ${
                        quotation.customServices && quotation.customServices.length > 0
                            ? quotation.customServices
                                  .map((cs, index) => {
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

                                      return `
                        <tr>
                            <td>${quotation.servicesPricing.length + index + 1}</td>
                            <td>
                                <div class="service-name">${lang === "ar" ? cs.ar : cs.en}</div>
                                <span class="service-badge">${lang === "ar" ? "خدمة مخصصة" : "Custom"}</span>
                            </td>
                            <td class="price">${cs.price.toFixed(2)} ${currency}</td>
                            <td class="price">${discountText}</td>
                            <td class="price">${finalPrice.toFixed(2)} ${currency}</td>
                        </tr>
                    `;
                                  })
                                  .join("")
                            : ""
                    }
                </tbody>
            </table>
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
            <div class="section-title">${lang === "ar" ? "الملخص" : "Summary"}</div>
            <div class="summary-table">
                <div class="summary-row subtotal">
                    <span class="summary-label">${lang === "ar" ? "المجموع الفرعي" : "Subtotal"}:</span>
                    <span class="summary-value">${quotation.subtotal.toFixed(2)} ${currency}</span>
                </div>
                ${
                    discountAmount > 0
                        ? `
                <div class="summary-row discount">
                    <span class="summary-label">
                        ${lang === "ar" ? "الخصم" : "Discount"}
                        (${quotation.discountType === "percentage" ? `${quotation.discountValue}%` : `${quotation.discountValue} ${currency}`}):
                    </span>
                    <span class="summary-value">- ${discountAmount.toFixed(2)} ${currency}</span>
                </div>
                `
                        : ""
                }
                <div class="summary-row total">
                    <span class="summary-label">${lang === "ar" ? "الإجمالي" : "Total"}:</span>
                    <span class="summary-value">
                        ${quotation.total.toFixed(2)} ${currency}
                        ${quotation.isTotalOverridden ? `<span class="override-badge">${lang === "ar" ? "معدل" : "Overridden"}</span>` : ""}
                    </span>
                </div>
            </div>
        </div>

        <!-- Notes Section -->
        ${
            quotation.note
                ? `
        <div class="notes-section">
            <div class="section-title">${lang === "ar" ? "ملاحظات" : "Notes"}</div>
            <div class="notes-content">${quotation.note}</div>
        </div>
        `
                : ""
        }

        <!-- Valid Until Section -->
        ${
            quotation.validUntil
                ? `
        <div class="validity-section">
            <div class="validity-text">
                ${lang === "ar" ? "صالح حتى" : "Valid Until"}: 
                ${new Date(quotation.validUntil).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}
            </div>
        </div>
        `
                : ""
        }

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="mb-2">
                    <strong>${lang === "ar" ? "الحالة" : "Status"}:</strong>
                    <span class="status-badge status-${quotation.status}">
                        ${
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
                                : quotation.status
                        }
                    </span>
                </div>
                <div class="footer-divider"></div>
                <div>
                    ${lang === "ar" ? "شكراً لثقتكم بنا" : "Thank you for your business"}
                </div>
                ${
                    quotation.createdBy?.fullName
                        ? `
                <div style="margin-top: 10px; font-size: 12px; opacity: 0.7;">
                    ${lang === "ar" ? "أنشئت بواسطة" : "Created by"}: ${quotation.createdBy.fullName}
                </div>
                `
                        : ""
                }
            </div>
        </div>
    </div>
</body>
</html>
    `;

    return html;
};

/**
 * Trigger browser print dialog for the quotation
 */
export const printQuotation = (options: PDFGeneratorOptions): void => {
    const html = generateQuotationHTML(options);
    const printWindow = window.open("", "_blank");

    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();

        // Wait for content to load then trigger print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 250);
        };
    }
};

/**
 * Generate and download PDF (requires backend support or html2pdf library)
 */
export const generatePDFBlob = async (options: PDFGeneratorOptions): Promise<Blob> => {
    // This is a placeholder for client-side PDF generation
    // In production, you would:
    // 1. Use the backend PDF endpoint (preferred)
    // 2. Or use a library like html2pdf.js or jsPDF

    const html = generateQuotationHTML(options);
    return new Blob([html], { type: "text/html" });
};
