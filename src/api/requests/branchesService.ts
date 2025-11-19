import axiosInstance from "../axios";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

export interface Branch {
    _id?: string;
    clientId?: string;
    name: string;
    address?: string;
    phone?: string;
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

const transformBranchToBackendPayload = (branchData: any): any => {
    const payload: any = {};
    if (!branchData) return payload;

    if (branchData.name && typeof branchData.name === "string" && branchData.name.trim()) {
        payload.name = branchData.name.trim();
    } else {
        if (!branchData._id) {
            payload.name = branchData.name || "";
        }
    }

    if (branchData.address && typeof branchData.address === "string" && branchData.address.trim()) {
        payload.address = branchData.address.trim();
    }

    if (branchData.phone && typeof branchData.phone === "string" && branchData.phone.trim()) {
        payload.phone = branchData.phone.trim();
    }

    return payload;
};

const transformBranchToFrontend = (backendData: any): Branch | null => {
    if (!backendData) return null;
    return {
        _id: backendData._id,
        clientId: backendData.clientId,
        name: backendData.name,
        address: backendData.address,
        phone: backendData.phone,
        deleted: backendData.deleted || false,
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
    };
};

export const getBranchesByClientId = async (clientId: string): Promise<Branch[]> => {
    return withCache(`/clients/${clientId}/branches`, async () => {
        try {
            const res = await axiosInstance.get(`/clients/${clientId}/branches`);
            let data: any[] = [];
            if (Array.isArray(res.data)) data = res.data;
            else if (Array.isArray(res.data.data)) data = res.data.data;
            else if (Array.isArray(res.data.branches)) data = res.data.branches;

            return data.map(transformBranchToFrontend).filter(Boolean) as Branch[];
        } catch (err) {
            throw err;
        }
    });
};

export const createBranch = async (clientId: string, branchData: any): Promise<Branch | null> => {
    try {
        const payload = transformBranchToBackendPayload(branchData);
        const res = await axiosInstance.post(`/clients/${clientId}/branches`, payload);
        const branch = res.data.data || res.data.branch || res.data;

        // Invalidate branches and client cache after creating
        invalidateCachePattern(`/clients/${clientId}/branches`);
        invalidateCachePattern(`/clients/${clientId}`);

        return transformBranchToFrontend(branch);
    } catch (err) {
        throw err;
    }
};

export const createBranches = async (clientId: string, branchesData: any[]): Promise<Branch[]> => {
    try {
        // Send all branch requests in parallel (simultaneous, not sequential)
        const promises = branchesData.map(async (branchData) => {
            const payload = transformBranchToBackendPayload(branchData);
            const res = await axiosInstance.post(`/clients/${clientId}/branches`, payload);
            const branch = res.data.data || res.data.branch || res.data;
            return transformBranchToFrontend(branch);
        });

        const branches = await Promise.all(promises);

        // Invalidate branches and client cache after creating all
        invalidateCachePattern(`/clients/${clientId}/branches`);
        invalidateCachePattern(`/clients/${clientId}`);

        return branches.filter(Boolean) as Branch[];
    } catch (err) {
        throw err;
    }
};

export const updateBranch = async (clientId: string, branchId: string, branchData: any): Promise<Branch | null> => {
    try {
        const payload = transformBranchToBackendPayload(branchData);
        const res = await axiosInstance.put(`/clients/${clientId}/branches/${branchId}`, payload);
        const branch = res.data.data || res.data.branch || res.data;

        // Invalidate branches and client cache after updating
        invalidateCachePattern(`/clients/${clientId}/branches`);
        invalidateCachePattern(`/clients/${clientId}`);

        return transformBranchToFrontend(branch);
    } catch (err) {
        throw err;
    }
};

export const deleteBranch = async (clientId: string, branchId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/clients/${clientId}/branches/${branchId}`);
        // Invalidate branches and client cache after deleting
        invalidateCachePattern(`/clients/${clientId}/branches`);
        invalidateCachePattern(`/clients/${clientId}`);
    } catch (err) {
        throw err;
    }
};

export default {
    getBranchesByClientId,
    createBranch,
    createBranches,
    updateBranch,
    deleteBranch,
};
