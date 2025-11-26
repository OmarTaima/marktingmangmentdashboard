import api from "../axios";

/**
 * Services API Service
 * Handles CRUD operations for service categories
 */

export interface ServicePackage {
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
    packages?: ServicePackage[];
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
    const response = await api.get("/services", { params });
    return response.data;
};

/**
 * Get a single service by ID
 */
export const getServiceById = async (id: string): Promise<Service> => {
    const response = await api.get(`/services/${id}`);
    return response.data.data;
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
    const response = await api.post("/services", serviceData);
    return response.data.data;
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
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data.data;
};

/**
 * Delete a service (soft delete)
 */
export const deleteService = async (id: string): Promise<void> => {
    await api.delete(`/services/${id}`);
};
