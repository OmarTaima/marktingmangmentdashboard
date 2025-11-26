import api from "../axios";
import { Item } from "./itemsService";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

/**
 * Packages API Service
 * Handles CRUD operations for packages
 */

export interface Package {
    _id: string;
    nameEn: string;
    nameAr: string;
    price: number;
    description?: string;
    descriptionAr?: string;
    items?: Item[];
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface PackageListResponse {
    data: Package[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface PackageQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
}

/**
 * Get all packages with pagination and filters
 */
export const getPackages = async (params?: PackageQueryParams): Promise<PackageListResponse> => {
    return withCache(
        "/packages",
        async () => {
            try {
                const response = await api.get("/packages", { params });
                return response.data;
            } catch (error) {
                throw error;
            }
        },
        params,
    );
};

/**
 * Get a single package by ID
 */
export const getPackageById = async (id: string): Promise<Package> => {
    return withCache(`/packages/${id}`, async () => {
        try {
            const response = await api.get(`/packages/${id}`);
            return response.data.data;
        } catch (error) {
            throw error;
        }
    });
};

/**
 * Create a new package
 */
export const createPackage = async (packageData: {
    nameEn: string;
    nameAr: string;
    price: number;
    description?: string;
    descriptionAr?: string;
    items?: { item: string; quantity: number }[];
}): Promise<Package> => {
    try {
        const response = await api.post("/packages", packageData);
        // Invalidate packages cache after creating
        invalidateCachePattern("/packages");
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Update a package
 */
export const updatePackage = async (
    id: string,
    packageData: {
        nameEn?: string;
        nameAr?: string;
        price?: number;
        description?: string;
        descriptionAr?: string;
        items?: { item: string; quantity: number }[];
    },
): Promise<Package> => {
    try {
        const response = await api.put(`/packages/${id}`, packageData);
        // Invalidate packages cache after updating
        invalidateCachePattern("/packages");
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a package (soft delete)
 */
export const deletePackage = async (id: string): Promise<void> => {
    try {
        await api.delete(`/packages/${id}`);
        // Invalidate packages cache after deleting
        invalidateCachePattern("/packages");
    } catch (error) {
        throw error;
    }
};

// Cache clearing utility
export const clearPackagesCache = () => {
    invalidateCachePattern("/packages");
};
