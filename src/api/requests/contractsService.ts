import api from "../axios";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

/**
 * Contracts API Service
 * Handles CRUD operations and status management for contracts
 */

export interface Contract {
    _id: string;
    contractNumber: string;
    clientId:
        | {
              _id: string;
              business?: { name?: string };
              personal?: { fullName?: string };
          }
        | string;
    quotationId?:
        | {
              _id: string;
              quotationNumber?: string;
          }
        | string;
    contractTerms?: string[];
    startDate: string;
    endDate: string;
    contractImage?: string;
    status: "draft" | "active" | "completed" | "cancelled" | "renewed";
    signedDate?: string;
    note?: string;
    createdBy?: {
        fullName?: string;
        email?: string;
    };
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ContractListResponse {
    data: Contract[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface ContractQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    // Filter parameters
    status?: "draft" | "active" | "completed" | "cancelled" | "renewed";
    clientId?: string;
    quotationId?: string;
    contractNumber?: string;
    startDateFrom?: string;
    startDateTo?: string;
    endDateFrom?: string;
    endDateTo?: string;
    signedDateFrom?: string;
    signedDateTo?: string;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    expired?: boolean;
    active?: boolean;
    upcomingRenewal?: boolean;
}

/**
 * Get all contracts with pagination and filters
 */
export const getContracts = async (params?: ContractQueryParams): Promise<ContractListResponse> => {
    return withCache(
        "/contracts",
        async () => {
            try {
                const response = await api.get("/contracts", { params });
                return response.data;
            } catch (error) {
                console.error("Error fetching contracts:", error);
                throw error;
            }
        },
        params,
    );
};

/**
 * Get a single contract by ID
 */
export const getContractById = async (id: string): Promise<Contract> => {
    return withCache(`/contracts/${id}`, async () => {
        try {
            const response = await api.get(`/contracts/${id}`);
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching contract ${id}:`, error);
            throw error;
        }
    });
};

/**
 * Create a new contract
 */
export const createContract = async (contractData: {
    clientId: string;
    quotationId?: string;
    contractTerms?: string[];
    startDate: string;
    endDate: string;
    contractImage?: string;
    status?: "draft" | "active" | "completed" | "cancelled" | "renewed";
    signedDate?: string;
    note?: string;
}): Promise<Contract> => {
    try {
        const response = await api.post("/contracts", contractData);
        // Invalidate contracts cache after creating
        invalidateCachePattern("/contracts");
        return response.data.contract;
    } catch (error) {
        console.error("Error creating contract:", error);
        throw error;
    }
};

/**
 * Update a contract
 */
export const updateContract = async (
    id: string,
    contractData: {
        clientId?: string;
        quotationId?: string;
        contractTerms?: string[];
        startDate?: string;
        endDate?: string;
        contractImage?: string;
        status?: "draft" | "active" | "completed" | "cancelled" | "renewed";
        signedDate?: string;
        note?: string;
    },
): Promise<Contract> => {
    try {
        const response = await api.put(`/contracts/${id}`, contractData);
        // Invalidate contracts cache after updating
        invalidateCachePattern("/contracts");
        return response.data.data;
    } catch (error) {
        console.error(`Error updating contract ${id}:`, error);
        throw error;
    }
};

/**
 * Delete a contract (soft delete)
 */
export const deleteContract = async (id: string): Promise<void> => {
    try {
        await api.delete(`/contracts/${id}`);
        // Invalidate contracts cache after deleting
        invalidateCachePattern("/contracts");
    } catch (error) {
        console.error(`Error deleting contract ${id}:`, error);
        throw error;
    }
};

/**
 * Sign a contract
 */
export const signContract = async (id: string, signedDate?: string): Promise<Contract> => {
    try {
        const response = await api.post(`/contracts/${id}/sign`, { signedDate });
        // Invalidate contracts cache after signing
        invalidateCachePattern("/contracts");
        return response.data.data;
    } catch (error) {
        console.error(`Error signing contract ${id}:`, error);
        throw error;
    }
};

/**
 * Activate a contract
 */
export const activateContract = async (id: string): Promise<Contract> => {
    try {
        const response = await api.post(`/contracts/${id}/activate`);
        // Invalidate contracts cache after activating
        invalidateCachePattern("/contracts");
        return response.data.data;
    } catch (error) {
        console.error(`Error activating contract ${id}:`, error);
        throw error;
    }
};

/**
 * Complete a contract
 */
export const completeContract = async (id: string): Promise<Contract> => {
    try {
        const response = await api.post(`/contracts/${id}/complete`);
        // Invalidate contracts cache after completing
        invalidateCachePattern("/contracts");
        return response.data.data;
    } catch (error) {
        console.error(`Error completing contract ${id}:`, error);
        throw error;
    }
};

/**
 * Cancel a contract
 */
export const cancelContract = async (id: string, reason?: string): Promise<Contract> => {
    try {
        const response = await api.post(`/contracts/${id}/cancel`, { reason });
        // Invalidate contracts cache after cancelling
        invalidateCachePattern("/contracts");
        return response.data.data;
    } catch (error) {
        console.error(`Error cancelling contract ${id}:`, error);
        throw error;
    }
};

/**
 * Renew a contract
 */
export const renewContract = async (id: string, newStartDate: string, newEndDate: string): Promise<Contract> => {
    try {
        const response = await api.post(`/contracts/${id}/renew`, {
            newStartDate,
            newEndDate,
        });
        // Invalidate contracts cache after renewing
        invalidateCachePattern("/contracts");
        return response.data.data;
    } catch (error) {
        console.error(`Error renewing contract ${id}:`, error);
        throw error;
    }
};
