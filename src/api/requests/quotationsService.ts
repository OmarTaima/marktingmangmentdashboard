import api from "../axios";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

/**
 * Quotations API Service
 * Handles all quotation-related API calls
 */

// ==================== INTERFACES ====================

export interface QuotationItem {
    _id: string;
    name: string;
    description?: string;
    type: string;
}

export interface QuotationPackage {
    _id: string;
    nameEn: string;
    nameAr: string;
    items: QuotationItem[];
}

export interface QuotationService {
    _id: string;
    en: string;
    ar: string;
    price: number;
    packages?: QuotationPackage[];
}

export interface ServicePricing {
    service: QuotationService;
    customPrice?: number;
}

export interface CustomService {
    id: string;
    en: string;
    ar: string;
    price: number;
}

export interface Quotation {
    _id: string;
    quotationNumber: string;
    clientId?: string;
    services?: string[]; // kept for backward compatibility
    packages?: string[]; // preferred: list of selected package IDs
    servicesPricing: ServicePricing[];
    customServices: CustomService[];
    customName?: string;
    clientName?: string;
    subtotal: number;
    discountValue: number;
    discountType: "percentage" | "fixed";
    total: number;
    overriddenTotal?: number;
    isTotalOverridden: boolean;
    note?: string;
    validUntil?: string;
    status: "draft" | "sent" | "approved" | "rejected" | "expired";
    createdBy: {
        _id?: string;
        fullName: string;
    };
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface QuotationListResponse {
    data: Quotation[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface QuotationQueryParams {
    page?: number;
    limit?: number;
    clientId?: string;
    status?: string;
}

export interface CreateQuotationPayload {
    clientId?: string;
    // Use `packages` to submit package ids for the quotation. `services` is kept
    // as an optional deprecated field for backward compatibility if needed.
    packages?: string[];
    services?: string[];
    customServices?: CustomService[];
    customName?: string;
    clientName?: string;
    overriddenTotal?: number;
    discountValue?: number;
    discountType?: "percentage" | "fixed";
    note?: string;
    validUntil?: string;
}

export interface UpdateQuotationPayload extends Partial<CreateQuotationPayload> {}

export interface ConvertToContractPayload {
    startDate: string;
    endDate: string;
    contractTerms?: string;
}

// ==================== API FUNCTIONS ====================

/**
 * Get paginated list of quotations
 */
export const getQuotations = async (params?: QuotationQueryParams, signal?: AbortSignal): Promise<QuotationListResponse> => {
    return withCache(
        "/quotations",
        async () => {
            // Prefer to ask the backend to populate `packages` (current model) which
            // avoids servers that still try to populate the removed `services` path.
            try {
                const response = await api.get("/quotations", { params: { ...params, populate: "packages" }, signal });
                return response.data;
            } catch (err: any) {
                const msg = err?.response?.data?.message || err?.message || "";
                if (typeof msg === "string" && msg.toLowerCase().includes("populate")) {
                    // Retry without populate param as a fallback so the UI can still render data
                    const fallback = await api.get("/quotations", { params, signal });
                    return fallback.data;
                }
                throw err;
            }
        },
        params,
    );
};

/**
 * Create a new quotation
 */
export const createQuotation = async (payload: CreateQuotationPayload): Promise<{ data: Quotation }> => {
    const response = await api.post("/quotations", payload);
    // Invalidate quotations cache after creating
    invalidateCachePattern("/quotations");
    return response.data;
};

/**
 * Get a single quotation by ID
 */
export const getQuotationById = async (id: string): Promise<{ data: Quotation }> => {
    return withCache(`/quotations/${id}`, async () => {
        // Try to explicitly request `packages` population (current model), which
        // should avoid the backend attempting to populate the old `services` path.
        try {
            const response = await api.get(`/quotations/${id}`, { params: { populate: "packages" } });
            return response.data;
        } catch (err: any) {
            // If server complains about populate/path, retry without params as a fallback.
            const msg = err?.response?.data?.message || err?.message || "";
            if (typeof msg === "string" && msg.toLowerCase().includes("populate")) {
                const fallback = await api.get(`/quotations/${id}`);
                return fallback.data;
            }
            throw err;
        }
    });
};

/**
 * Update an existing quotation
 */
export const updateQuotation = async (id: string, payload: UpdateQuotationPayload): Promise<{ data: Quotation }> => {
    const response = await api.put(`/quotations/${id}`, payload);
    // Invalidate quotations cache after updating
    invalidateCachePattern("/quotations");
    return response.data;
};

/**
 * Delete (soft delete) a quotation
 */
export const deleteQuotation = async (id: string): Promise<void> => {
    await api.delete(`/quotations/${id}`);
    // Invalidate quotations cache after deleting
    invalidateCachePattern("/quotations");
};

/**
 * Download quotation as PDF
 */
export const downloadQuotationPDF = async (id: string): Promise<Blob> => {
    try {
        const response = await api.get(`/quotations/${id}/pdf`, {
            responseType: "blob",
        });

        // Check if we actually got a blob
        if (!response.data || !(response.data instanceof Blob)) {
            throw new Error("Invalid response: Expected PDF blob");
        }

        // Check if the blob has content
        if (response.data.size === 0) {
            throw new Error("Empty PDF received from server");
        }

        return response.data;
    } catch (error: any) {
        // More detailed error logging
        if (error.response) {
            console.error("PDF download failed with status:", error.response.status);
            console.error("Error data:", error.response.data);

            if (error.response.status === 404) {
                throw new Error("PDF endpoint not found. The backend may not support PDF generation yet.");
            } else if (error.response.status === 500) {
                throw new Error("Server error while generating PDF");
            }
        } else if (error.request) {
            console.error("No response received from server");
            throw new Error("Network error: Unable to reach the server");
        }

        throw error;
    }
};

/**
 * Convert quotation to contract
 */
export const convertQuotationToContract = async (id: string, payload: ConvertToContractPayload): Promise<{ data: any }> => {
    const response = await api.post(`/quotations/${id}/convert-to-contract`, payload);
    return response.data;
};

/**
 * Helper function to trigger PDF download in browser
 */
export const triggerPDFDownload = async (id: string, filename?: string): Promise<void> => {
    try {
        const blob = await downloadQuotationPDF(id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename || `quotation-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to download PDF:", error);
        throw error;
    }
};
