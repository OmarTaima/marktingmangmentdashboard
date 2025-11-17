import api from "../axios";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

/**
 * Items API Service
 * Handles CRUD operations for items
 */

export interface Item {
    _id: string;
    name: string;
    description?: string;
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ItemListResponse {
    data: Item[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface ItemQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

/**
 * Get all items with pagination and filters
 */
export const getItems = async (params?: ItemQueryParams): Promise<ItemListResponse> => {
    return withCache(
        "/items",
        async () => {
            try {
                const response = await api.get("/items", { params });
                return response.data;
            } catch (error) {
                console.error("Error fetching items:", error);
                throw error;
            }
        },
        params
    );
};

/**
 * Get a single item by ID
 */
export const getItemById = async (id: string): Promise<Item> => {
    return withCache(
        `/items/${id}`,
        async () => {
            try {
                const response = await api.get(`/items/${id}`);
                return response.data.data;
            } catch (error) {
                console.error(`Error fetching item ${id}:`, error);
                throw error;
            }
        }
    );
};

/**
 * Create a new item
 */
export const createItem = async (itemData: { name: string; description?: string }): Promise<Item> => {
    try {
        const response = await api.post("/items", itemData);
        // Invalidate items cache after creating
        invalidateCachePattern("/items");
        return response.data.data;
    } catch (error) {
        console.error("Error creating item:", error);
        throw error;
    }
};

/**
 * Update an item
 */
export const updateItem = async (
    id: string,
    itemData: {
        name?: string;
        description?: string;
    },
): Promise<Item> => {
    try {
        const response = await api.put(`/items/${id}`, itemData);
        // Invalidate items cache after updating
        invalidateCachePattern("/items");
        return response.data.data;
    } catch (error) {
        console.error(`Error updating item ${id}:`, error);
        throw error;
    }
};

/**
 * Delete an item (soft delete)
 */
export const deleteItem = async (id: string): Promise<void> => {
    try {
        await api.delete(`/items/${id}`);
        // Invalidate items cache after deleting
        invalidateCachePattern("/items");
    } catch (error) {
        console.error(`Error deleting item ${id}:`, error);
        throw error;
    }
};

// Cache clearing utility
export const clearItemsCache = () => {
    invalidateCachePattern("/items");
    console.debug("Items cache cleared");
};
