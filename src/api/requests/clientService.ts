import axiosInstance from "../axios";
import type { Client } from "../interfaces/clientinterface";

/**
 * Client API Service
 * Handles all client-related API calls
 */

const CLIENTS_ENDPOINT = "/clients";

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

    // Remove empty string values to send cleaner data
    Object.keys(payload).forEach((key) => {
        if (typeof payload[key] === "object" && payload[key] !== null) {
            Object.keys(payload[key]).forEach((subKey) => {
                if (payload[key][subKey] === "") {
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
    console.log("🔄 [Transform] Input backend data:", backendData);

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

    console.log("✅ [Transform] Output:", transformed);
    return transformed;
};

/**
 * Create a new client
 */
export const createClient = async (clientData: Partial<Client>): Promise<Client | null> => {
    try {
        const payload = transformToBackendPayload(clientData);
        const response = await axiosInstance.post(CLIENTS_ENDPOINT, payload);
        return transformToFrontendFormat(response.data);
    } catch (error) {
        console.error("Error creating client:", error);
        throw error;
    }
};

/**
 * Get all clients
 */
export const getClients = async (): Promise<Client[]> => {
    try {
        console.log("📡 [API] GET", CLIENTS_ENDPOINT);
        const response = await axiosInstance.get(CLIENTS_ENDPOINT);
        console.log("📥 [API] Response:", response.data);

        // Handle nested data structure - backend might return {data: [...]} or [...]
        let data;
        if (Array.isArray(response.data)) {
            data = response.data;
        } else if (Array.isArray(response.data.data)) {
            data = response.data.data;
        } else {
            data = [];
        }
        console.log("📋 [API] Data array:", data);

        const transformed = data.map(transformToFrontendFormat).filter(Boolean);
        console.log("✅ [API] Transformed clients:", transformed);
        return transformed;
    } catch (error) {
        console.error("❌ [API] Error fetching clients:", error);
        throw error;
    }
};

/**
 * Get a single client by ID
 */
export const getClientById = async (clientId: string): Promise<Client | null> => {
    try {
        console.log("📡 [API] GET", `${CLIENTS_ENDPOINT}/${clientId}`);
        const response = await axiosInstance.get(`${CLIENTS_ENDPOINT}/${clientId}`);
        console.log("📥 [API] Response:", response.data);
        console.log("📥 [API] Response keys:", Object.keys(response.data || {}));

        // Handle nested data structure - backend returns {data: {actual client data}}
        const clientData = response.data.data || response.data;
        console.log("📋 [API] Extracted client data:", clientData);

        const transformed = transformToFrontendFormat(clientData);
        console.log("✅ [API] Transformed client:", transformed);
        return transformed;
    } catch (error) {
        console.error("❌ [API] Error fetching client:", error);
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
        return transformToFrontendFormat(response.data);
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
    getClientById,
    updateClient,
    deleteClient,
};
