import axiosInstance from "../axios";
import type { Client } from "../interfaces/clientinterface";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

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
        // Also include flattened swot_* arrays for backends that expect them
        if (Array.isArray(payload.swot.strengths) && payload.swot.strengths.length) payload.swot_strengths = payload.swot.strengths;
        if (Array.isArray(payload.swot.weaknesses) && payload.swot.weaknesses.length) payload.swot_weaknesses = payload.swot.weaknesses;
        if (Array.isArray(payload.swot.opportunities) && payload.swot.opportunities.length) payload.swot_opportunities = payload.swot.opportunities;
        if (Array.isArray(payload.swot.threats) && payload.swot.threats.length) payload.swot_threats = payload.swot.threats;
    }

    if (formData.socialLinks) {
        // Backend validation expects `socialLinks` to be an array of objects with a `platform` field.
        // Accept either frontend grouped object or an array and convert to a flat, normalized array.

        // Main platforms that should always be sent (even with empty URL)
        const mainPlatforms = ["Facebook", "Instagram", "TikTok", "X (Twitter)"];

        console.debug("[transformToBackendPayload] RAW socialLinks:", JSON.stringify(formData.socialLinks));

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
                console.debug("[normalizeEntry]", { entry, extractedPlatform: platform, url, isMainPlatform });
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
        console.debug("[transformToBackendPayload] FINAL payload.socialLinks:", JSON.stringify(payload.socialLinks));
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
        console.warn("⚠️ [Transform] Backend data is null/undefined");
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
            businessName: backendData.business?.name,
            name: backendData.business?.name,
        },
        contact: backendData.contact || {},
        status: backendData.status || "active",
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
        // Include all additional fields from backend response
        branches: backendData.branches || [],
        socialLinks: normalizeSocialLinks(backendData.socialLinks),
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
        // Debug: log payload being sent when creating a client
        // eslint-disable-next-line no-console
        console.debug("[clientService] createClient payload:", JSON.stringify(payload));
        const response = await axiosInstance.post(CLIENTS_ENDPOINT, payload);

        // Handle nested data structure - backend returns {data: {actual client data}}
        const clientResponseData = response.data.data || response.data;

        const transformed = transformToFrontendFormat(clientResponseData);
        // Invalidate clients cache after creating
        invalidateCachePattern("/clients");
        return transformed;
    } catch (error) {
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
    return withCache("/clients", async () => {
        try {
            const response = await axiosInstance.get(CLIENTS_ENDPOINT);

            // Handle nested data structure - backend might return {data: [...]} or [...]
            let data;
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (Array.isArray(response.data.data)) {
                data = response.data.data;
            } else {
                data = [];
            }

            const transformed = data.map(transformToFrontendFormat).filter(Boolean);
            return transformed;
        } catch (error) {
            throw error;
        }
    });
};

/**
 * Get clients with advanced filtering, pagination, sorting, and search
 * GET /clients with query parameters
 */
export const getClientsWithFilters = async (filters: ClientFilterParams = {}): Promise<PaginatedClientsResponse> => {
    return withCache(
        "/clients",
        async () => {
            try {
                const queryString = buildQueryString(filters);
                const url = queryString ? `${CLIENTS_ENDPOINT}?${queryString}` : CLIENTS_ENDPOINT;

                const response = await axiosInstance.get(url);

                // Handle paginated response format
                const data = response.data.data || response.data;
                const meta = response.data.meta || {
                    total: Array.isArray(data) ? data.length : 0,
                    page: filters.page || 1,
                    limit: filters.limit || 20,
                    totalPages: 1,
                };

                const clients = Array.isArray(data) ? data.map(transformToFrontendFormat).filter((c): c is Client => c !== null) : [];

                return {
                    data: clients,
                    meta,
                };
            } catch (error) {
                throw error;
            }
        },
        filters,
    );
};

/**
 * Export clients to CSV
 * GET /clients/export with optional filters
 */
export const exportClientsToCSV = async (filters: ClientFilterParams = {}): Promise<Blob> => {
    try {
        const queryString = buildQueryString(filters);
        const url = queryString ? `${CLIENTS_ENDPOINT}/export?${queryString}` : `${CLIENTS_ENDPOINT}/export`;

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
 * Clear the clients cache (useful after mutations)
 */
export const clearClientsCache = () => {
    invalidateCachePattern("/clients");
};

/**
 * Clear cache for a specific client id
 */
export const clearClientCache = (clientId: string) => {
    invalidateCachePattern(`/clients/${clientId}`);
};

/**
 * Get a single client by ID
 */
export const getClientById = async (clientId: string): Promise<Client | null> => {
    return withCache(`/clients/${clientId}`, async () => {
        try {
            const response = await axiosInstance.get(`${CLIENTS_ENDPOINT}/${clientId}`);

            // Handle nested data structure - backend can return:
            // {client: {...}}, {data: {...}}, or {...}
            const clientData = response.data.client || response.data.data || response.data;

            const transformed = transformToFrontendFormat(clientData);
            return transformed;
        } catch (error) {
            throw error;
        }
    });
};

/**
 * Update a client
 */
export const updateClient = async (clientId: string, clientData: Partial<Client>): Promise<Client | null> => {
    try {
        const payload = transformToBackendPayload(clientData);
        // Debug: log payload being sent when updating a client
        // eslint-disable-next-line no-console
        console.debug("[clientService] updateClient payload:", JSON.stringify(payload));
        const response = await axiosInstance.put(`${CLIENTS_ENDPOINT}/${clientId}`, payload);
        const updated = transformToFrontendFormat(response.data);
        // Invalidate clients cache after updating
        invalidateCachePattern("/clients");
        return updated;
    } catch (error) {
        console.error("Error updating client:", error);
        throw error;
    }
};

/**
 * Patch specific client fields (partial update)
 * PATCH /clients/:clientId
 */
export const patchClient = async (clientId: string, partialData: Record<string, any>): Promise<Client | null> => {
    try {
        // eslint-disable-next-line no-console
        console.debug("[clientService] patchClient payload:", JSON.stringify(partialData));
        const response = await axiosInstance.patch(`${CLIENTS_ENDPOINT}/${clientId}`, partialData);
        const updated = transformToFrontendFormat(response.data);
        // Invalidate clients cache after patching
        invalidateCachePattern("/clients");
        return updated;
    } catch (error) {
        console.error("Error patching client:", error);
        throw error;
    }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<any> => {
    try {
        const response = await axiosInstance.delete(`${CLIENTS_ENDPOINT}/${clientId}`);
        // Invalidate clients cache after deleting
        invalidateCachePattern("/clients");
        return response.data;
    } catch (error) {
        console.error("Error deleting client:", error);
        throw error;
    }
};

// Export all functions as default object for easier importing
export default {
    createClient,
    getClients,
    getClientsWithFilters,
    getClientById,
    updateClient,
    patchClient,
    deleteClient,
    exportClientsToCSV,
};
