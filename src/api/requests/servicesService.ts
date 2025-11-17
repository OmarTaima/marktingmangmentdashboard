import api from "../axios";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

/**
 * Services API Service
 * Handles CRUD operations for service categories
 */

export interface Package {
    _id: string;
    nameEn: string;
    nameAr: string;
    price: number;
    items: {
        _id: string;
        name: string;
        description?: string;
        type: string;
    }[];
}

export interface Service {
    _id: string;
    en: string;
    ar: string;
    description?: string;
    price?: number;
    packages?: Package[];
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ServiceListResponse {
    data: Service[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ServiceQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
}

/**
 * Get all services with pagination and filters
 */
export const getServices = async (params?: ServiceQueryParams): Promise<ServiceListResponse> => {
    return withCache(
        "/services",
        async () => {
            try {
                const response = await api.get("/services", { params });
                return response.data;
            } catch (error) {
                console.error("Error fetching services:", error);
                throw error;
            }
        },
        params
    );
};

/**
 * Get a single service by ID
 */
export const getServiceById = async (id: string): Promise<Service> => {
    return withCache(
        `/services/${id}`,
        async () => {
            try {
                const response = await api.get(`/services/${id}`);
                return response.data.data;
            } catch (error) {
                console.error(`Error fetching service ${id}:`, error);
                throw error;
            }
        }
    );
};

/**
 * Create a new service
 */
export const createService = async (serviceData: {
    en: string;
    ar: string;
    description?: string;
    price?: number;
    packages?: string[];
}): Promise<Service> => {
    try {
        const response = await api.post("/services", serviceData);
        // Invalidate services cache after creating
        invalidateCachePattern("/services");
        return response.data.data;
    } catch (error) {
        console.error("Error creating service:", error);
        throw error;
    }
};

/**
 * Update a service
 */
export const updateService = async (
    id: string,
    serviceData: {
        en?: string;
        ar?: string;
        description?: string;
        price?: number;
        packages?: string[];
    },
): Promise<Service> => {
    try {
        const response = await api.put(`/services/${id}`, serviceData);
        // Invalidate services cache after updating
        invalidateCachePattern("/services");
        return response.data.data;
    } catch (error) {
        console.error(`Error updating service ${id}:`, error);
        throw error;
    }
};

/**
 * Delete a service (soft delete)
 */
export const deleteService = async (id: string): Promise<void> => {
    try {
        await api.delete(`/services/${id}`);
        // Invalidate services cache after deleting
        invalidateCachePattern("/services");
    } catch (error) {
        console.error(`Error deleting service ${id}:`, error);
        throw error;
    }
};

// Cache clearing utility
export const clearServicesCache = () => {
    invalidateCachePattern("/services");
    console.debug("Services cache cleared");
};
