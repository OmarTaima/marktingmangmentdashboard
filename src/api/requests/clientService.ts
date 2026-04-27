import axiosInstance from "../axios";
import type { Client } from "../interfaces/clientinterface";

/**
 * Client API Service
 * Handles all client-related API calls
 */

const CLIENTS_ENDPOINT = "/clients";

/**
 * Client filter parameters for advanced querying
 */
export interface ClientFilterParams {
    // Pagination
    page?: number;
    limit?: number;

    // Search & Sort
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";

    // Status filter
    status?: "active" | "inactive" | "pending";

    // Personal filters
    personalFullName?: string;
    personalEmail?: string;
    personalPhone?: string;
    personalPosition?: string;

    // Business filters
    businessName?: string;
    businessCategory?: string;
    businessDescription?: string;
    businessAddress?: string;
    establishedYear?: number;
    establishedAfter?: number;
    establishedBefore?: number;

    // Contact filters
    businessPhone?: string;
    businessWhatsApp?: string;
    businessEmail?: string;
    website?: string;

    // Date filters
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
}

/**
 * Paginated response from API
 */
export interface PaginatedClientsResponse {
    data: Client[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Transform frontend data to backend payload format
 */
const transformToBackendPayload = (formData: Partial<Client>): any => {
    const payload: any = {
        personal: {
            fullName: formData.personal?.fullName || "",
            email: formData.personal?.email || "",
            phone: formData.personal?.phone || "",
            position: formData.personal?.position || "",
        },
        business: {
            name: formData.business?.businessName || formData.business?.name || "",
            category: formData.business?.category || "",
            description: formData.business?.description || "",
            mainOfficeAddress: formData.business?.mainOfficeAddress || "",
            establishedYear: formData.business?.establishedYear || new Date().getFullYear(),
        },
        contact: {
            businessPhone: formData.contact?.businessPhone || "",
            businessWhatsApp: formData.contact?.businessWhatsApp || "",
            businessEmail: formData.contact?.businessEmail || "",
            website: formData.contact?.website || "",
        },
        status: formData.status || "active",
    };

    // Include optional data that the backend supports: swot and socialLinks
    if (formData.swot && typeof formData.swot === "object") {
        payload.swot = {
            strengths: Array.isArray(formData.swot.strengths) ? formData.swot.strengths : [],
            weaknesses: Array.isArray(formData.swot.weaknesses) ? formData.swot.weaknesses : [],
            opportunities: Array.isArray(formData.swot.opportunities) ? formData.swot.opportunities : [],
            threats: Array.isArray(formData.swot.threats) ? formData.swot.threats : [],
        };
    }

    if (formData.socialLinks) {
        // Backend validation expects `socialLinks` to be an array of objects with a `platform` field.
        // Accept either frontend grouped object or an array and convert to a flat, normalized array.

        // Main platforms that should always be sent (even with empty URL)
        const mainPlatforms = ["Facebook", "Instagram", "TikTok", "X (Twitter)"];

        const normalizeEntry = (entry: any) => {
            if (!entry) return null;
            if (typeof entry === "string") {
                const url = entry.trim();
                if (!url) return null;
                return { platform: "Website", url };
            }
            if (typeof entry === "object") {
                // Extract platform - prioritize entry.platform, fallback to entry.name
                let platform = "";
                if (entry.platform && typeof entry.platform === "string" && entry.platform.trim()) {
                    platform = entry.platform.trim();
                } else if (entry.name && typeof entry.name === "string" && entry.name.trim()) {
                    platform = entry.name.trim();
                } else {
                    platform = "Website";
                }

                const url = (entry.url || entry.link || "").trim();
                const isMainPlatform = mainPlatforms.includes(platform);
                // Keep entry if it's a main platform OR if it has a URL
                if (!url && !isMainPlatform) return null;
                return { platform, url };
            }
            return null;
        };

        let flat: any[] = [];
        if (Array.isArray(formData.socialLinks)) {
            flat = formData.socialLinks;
        } else if (typeof formData.socialLinks === "object") {
            const business = Array.isArray(formData.socialLinks.business) ? formData.socialLinks.business : [];
            const personal = Array.isArray(formData.socialLinks.personal) ? formData.socialLinks.personal : [];
            const custom = Array.isArray(formData.socialLinks.custom) ? formData.socialLinks.custom : [];
            flat = [...business, ...personal, ...custom];
        }

        payload.socialLinks = flat.map(normalizeEntry).filter(Boolean);
    }

    // NOTE: Segments are NOT included in client payload
    // They must be created separately via POST /clients/:clientId/segments

    // List of required fields that should never be deleted (even if empty)
    const requiredFields = {
        business: ["name", "category"],
    };

    // Remove empty string values to send cleaner data, but keep required fields
    Object.keys(payload).forEach((key) => {
        if (typeof payload[key] === "object" && payload[key] !== null && !Array.isArray(payload[key])) {
            Object.keys(payload[key]).forEach((subKey) => {
                const isRequired = requiredFields[key as keyof typeof requiredFields]?.includes(subKey);
                if (payload[key][subKey] === "" && !isRequired) {
                    delete payload[key][subKey];
                }
            });
        }
    });

    return payload;
};

/**
 * Transform backend data to frontend format
 */
const transformToFrontendFormat = (backendData: any): Client | null => {
    if (!backendData) {
        return null;
    }

    const normalizeSocialLinks = (raw: any): any => {
        // Expected frontend shape: { business: [], personal: [], custom: [] }
        if (!raw) return { business: [], personal: [], custom: [] };
        // If backend already returns object with groups, ensure defaults
        if (typeof raw === "object" && !Array.isArray(raw)) {
            return {
                business: Array.isArray(raw.business) ? raw.business : [],
                personal: Array.isArray(raw.personal) ? raw.personal : [],
                custom: Array.isArray(raw.custom) ? raw.custom : [],
            };
        }

        // If backend returns a flat array of links, put them under `business` by default
        if (Array.isArray(raw)) {
            return { business: raw, personal: [], custom: [] };
        }

        return { business: [], personal: [], custom: [] };
    };

    const transformed = {
        id: backendData._id,
        _id: backendData._id,
        personal: backendData.personal || {},
        business: {
            ...(backendData.business || {}),
            businessName: backendData.business?.name || backendData.business?.businessName,
            name: backendData.business?.name || backendData.business?.businessName,
            category: backendData.business?.category || "",
            description: backendData.business?.description || "",
            mainOfficeAddress: backendData.business?.mainOfficeAddress || "",
            establishedYear: backendData.business?.establishedYear || new Date().getFullYear(),
        },
        contact: backendData.contact || {},
        status: backendData.status || "active",
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
        // Include all additional fields from backend response
        branches: backendData.branches || [],
        socialLinks: normalizeSocialLinks(backendData.socialLinks),
        accounts: backendData.accounts || [],
        swot: backendData.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        segments: backendData.segments || [],
        competitors: backendData.competitors || [],
    };

    return transformed;
};

/**
 * Create a new client
 */
export const createClient = async (clientData: Partial<Client>): Promise<Client | null> => {
    try {
        const payload = transformToBackendPayload(clientData);

        const response = await axiosInstance.post(CLIENTS_ENDPOINT, payload);

        // Handle nested data structure - backend returns {data: {actual client data}}
        const clientResponseData = response.data.data || response.data;

        const transformed = transformToFrontendFormat(clientResponseData);
        return transformed;
    } catch (error) {
        throw error;
    }
};

/**
 * Create an account for a specific client
 * POST /clients/:clientId/accounts
 */
export const createClientAccount = async (clientId: string, accountData: Record<string, any>): Promise<any> => {
    try {
        const response = await axiosInstance.post(`${CLIENTS_ENDPOINT}/${clientId}/accounts`, accountData);
        return response.data.data || response.data;
    } catch (error) {
        throw error;
    }
};

// In your clientService.ts
export const deleteClientAccount = async (clientId: string, accountId: string): Promise<any> => {
    try {
        const response = await axiosInstance.delete(
    `${CLIENTS_ENDPOINT}/${clientId}/accounts/${accountId}`
);
        return response.data.data || response.data;
    } catch (error) {
        console.error('❌ Delete account error:', error);
        throw error;
    }
};

export const updateClientAccount = async (clientId: string, accountId: string, accountData: Record<string, any>): Promise<any> => {
    try {
        const response = await axiosInstance.put(
            `${CLIENTS_ENDPOINT}/${clientId}/accounts/${accountId}`,
            accountData
        );
        return response.data.data || response.data;
    } catch (error) {
        console.error('❌ Update account error:', error);
        throw error;
    }
};

export const getClientAccounts = async (clientId: string): Promise<any[]> => {
    try {
        const response = await axiosInstance.get(`${CLIENTS_ENDPOINT}/${clientId}/accounts`);
        return response.data.data || response.data || [];
    } catch (error) {
        console.error('❌ Get accounts error:', error);
        throw error;
    }
};
/**
 * Build query string from filter parameters
 */
const buildQueryString = (filters: ClientFilterParams): string => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.append(key, String(value));
        }
    });

    return params.toString();
};

/**
 * Get all clients (simple version without filters)
 */
export const getClients = async (): Promise<Client[]> => {
    try {
        // Request all clients with populated relationships in a single efficient request
        const response = await axiosInstance.get(CLIENTS_ENDPOINT, {
            params: { PageCount: "all" },
        });

        // Handle multiple response shapes: [...], { data: [...] }, { clients: [...] }, or { data: { clients: [...] } }
        const responseData = response.data;
        let data;
        if (Array.isArray(responseData)) {
            data = responseData;
        } else if (Array.isArray(responseData?.clients)) {
            data = responseData.clients;
        } else if (Array.isArray(responseData?.data)) {
            data = responseData.data;
        } else if (Array.isArray(responseData?.data?.clients)) {
            data = responseData.data.clients;
        } else {
            data = [];
        }

        const transformed = data.map(transformToFrontendFormat).filter(Boolean);
        return transformed;
    } catch (error) {
        throw error;
    }
};

/**
 * Get clients with advanced filtering, pagination, sorting, and search
 * GET /clients with query parameters
 */
export const getClientsWithFilters = async (filters: ClientFilterParams = {}): Promise<PaginatedClientsResponse> => {
    try {
        const queryString = buildQueryString(filters);
        const url = queryString
            ? `${CLIENTS_ENDPOINT}?${queryString}&PageCount=all`
            : `${CLIENTS_ENDPOINT}?PageCount=all`;

        const response = await axiosInstance.get(url);

        // Handle paginated response formats: { data: [...] }, { clients: [...] }, { data: { clients: [...] } }
        const responseData = response.data;
        const rawClients = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.clients)
              ? responseData.clients
              : Array.isArray(responseData?.data)
                ? responseData.data
                : Array.isArray(responseData?.data?.clients)
                  ? responseData.data.clients
                  : [];

        const meta = responseData?.meta || {
            total: Number(responseData?.totalCount) || rawClients.length,
            page: Number(responseData?.page) || filters.page || 1,
            limit: Number(responseData?.limit) || filters.limit || 20,
            totalPages: Number(responseData?.pageCount) || 1,
        };

        const clients = rawClients.map(transformToFrontendFormat).filter((c: Client | null): c is Client => c !== null);

        return {
            data: clients,
            meta,
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Export clients to CSV
 * GET /clients/export with optional filters
 */
export const exportClientsToCSV = async (filters: ClientFilterParams = {}): Promise<Blob> => {
    try {
        const queryString = buildQueryString(filters);
        const url = queryString ? `${CLIENTS_ENDPOINT}/export?${queryString}&PageCount=all` : `${CLIENTS_ENDPOINT}/export?PageCount=all`;

        const response = await axiosInstance.get(url, {
            responseType: "blob",
        });

        return response.data;
    } catch (error) {
        throw error;
    }
};

// Cache clearing utilities using centralized cache system
/**
 * Get clients with caching (now uses centralized cache)
 * The withCache wrapper in getClients() handles caching automatically
 */
export const getClientsCached = async (): Promise<Client[]> => {
    return getClients();
};

/**
 * Get a single client with caching (now uses centralized cache)
 * The withCache wrapper in getClientById() handles caching automatically
 */
export const getClientByIdCached = async (clientId: string): Promise<Client | null> => {
    return getClientById(clientId);
};

/**
 * Get a single client by ID
 */
export const getClientById = async (clientId: string): Promise<Client | null> => {
    try {
        // Try to specify which fields to populate to avoid nested population errors.
        // If the server has stale populate settings (e.g. trying to populate quotations.services)
        // it may reject the request. In that case we retry the request without `populate` as a
        // graceful fallback so the client page can still load.
        try {
            const response = await axiosInstance.get(`${CLIENTS_ENDPOINT}/${clientId}`, {
                params: {
                    PageCount: "all",
                },
            });

            const clientData = response.data.client || response.data.data || response.data;
            const transformed = transformToFrontendFormat(clientData);
            return transformed;
        } catch (err: any) {
            // If the error is about strictPopulate or invalid populate path, retry without params.
            const msg = err?.response?.data?.message || err?.message || "";
            if (typeof msg === "string" && msg.includes("populate")) {
                // Retry without populate param to avoid server-side nested population
                const fallbackResp = await axiosInstance.get(`${CLIENTS_ENDPOINT}/${clientId}`, { params: { PageCount: "all" } });
                const clientData = fallbackResp.data.client || fallbackResp.data.data || fallbackResp.data;
                const transformed = transformToFrontendFormat(clientData);
                return transformed;
            }
            throw err;
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Update a client
 */
export const updateClient = async (clientId: string, clientData: Partial<Client>): Promise<Client | null> => {
    try {
        const payload = transformToBackendPayload(clientData);

        const response = await axiosInstance.put(`${CLIENTS_ENDPOINT}/${clientId}`, payload);
        const updated = transformToFrontendFormat(response.data);
        return updated;
    } catch (error) {
        throw error;
    }
};

/**
 * Patch specific client fields (partial update)
 * PATCH /clients/:clientId
 */
export const patchClient = async (clientId: string, partialData: Record<string, any>): Promise<Client | null> => {
    try {
        const response = await axiosInstance.patch(`${CLIENTS_ENDPOINT}/${clientId}`, partialData);
        const updated = transformToFrontendFormat(response.data);
        return updated;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<any> => {
    try {
        const response = await axiosInstance.delete(`${CLIENTS_ENDPOINT}/${clientId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Export all functions as default object for easier importing
export default {
    createClient,
    createClientAccount,
    getClients,
    getClientsWithFilters,
    getClientById,
    updateClient,
    patchClient,
    deleteClient,
    exportClientsToCSV,
};
