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
        socialLinks: backendData.socialLinks || { business: [], personal: [], custom: [] },
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
        // Invalidate clients list cache and any per-client cache for this id if present
        clearClientsCache();
        if (transformed?.id) clearClientCache(transformed.id);
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
};

/**
 * Get clients with advanced filtering, pagination, sorting, and search
 * GET /clients with query parameters
 */
export const getClientsWithFilters = async (filters: ClientFilterParams = {}): Promise<PaginatedClientsResponse> => {
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

// In-memory cache for clients to avoid refetching when navigating between routes.
let _clientsCache: Client[] | null = null;
// Per-client cache map
const _clientCache: Map<string, Client> = new Map();

/**
 * Get clients with in-memory caching.
 * By default returns cached value if available. Use `force=true` to bypass cache.
 */
export const getClientsCached = async (force = false): Promise<Client[]> => {
    // Return cache if present and not forced
    if (!force && _clientsCache && Array.isArray(_clientsCache) && _clientsCache.length > 0) {
        return _clientsCache;
    }

    const clients = await getClients();
    _clientsCache = clients;
    return clients;
};

/**
 * Clear the in-memory clients cache (useful after mutations)
 */
export const clearClientsCache = () => {
    _clientsCache = null;
};

/**
 * Get a single client with per-client in-memory cache.
 */
export const getClientByIdCached = async (clientId: string, force = false): Promise<Client | null> => {
    if (!force && _clientCache.has(clientId)) {
        return _clientCache.get(clientId) || null;
    }

    const client = await getClientById(clientId);
    if (client) _clientCache.set(clientId, client);
    return client;
};

/**
 * Clear cache for a specific client id
 */
export const clearClientCache = (clientId: string) => {
    _clientCache.delete(clientId);
};

/**
 * Get a single client by ID
 */
export const getClientById = async (clientId: string): Promise<Client | null> => {
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
};

/**
 * Update a client
 */
export const updateClient = async (clientId: string, clientData: Partial<Client>): Promise<Client | null> => {
    try {
        const payload = transformToBackendPayload(clientData);
        const response = await axiosInstance.put(`${CLIENTS_ENDPOINT}/${clientId}`, payload);
        const updated = transformToFrontendFormat(response.data);
        // Invalidate caches since data changed
        clearClientsCache();
        if (updated?.id) clearClientCache(updated.id);
        return updated;
    } catch (error) {
        console.error("Error updating client:", error);
        throw error;
    }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<any> => {
    try {
        const response = await axiosInstance.delete(`${CLIENTS_ENDPOINT}/${clientId}`);
        // Invalidate clients list cache and per-client cache
        clearClientsCache();
        clearClientCache(clientId);
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
    deleteClient,
    exportClientsToCSV,
};
