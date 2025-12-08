import axiosInstance from "../axios";

export interface ContractTerm {
    _id: string;
    key: string;
    keyAr: string;
    value?: string;
    valueAr?: string;
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateContractTermDTO {
    key: string;
    keyAr: string;
    value?: string;
    valueAr?: string;
}

export interface UpdateContractTermDTO {
    key?: string;
    keyAr?: string;
    value?: string;
    valueAr?: string;
}

export interface ContractTermsResponse {
    data: ContractTerm[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface GetContractTermsParams {
    page?: number;
    limit?: number;
    search?: string;
}

export const contractTermsService = {
    getAll: async (params?: GetContractTermsParams): Promise<ContractTermsResponse> => {
        const response = await axiosInstance.get("/contract-terms", { params });
        return response.data;
    },

    create: async (data: CreateContractTermDTO): Promise<ContractTerm> => {
        // Backend bulk endpoint expects an array payload (not wrapped in an object)
        const response = await axiosInstance.post("/contract-terms/bulk", [data]);
        return response.data;
    },

    update: async (id: string, data: UpdateContractTermDTO): Promise<ContractTerm> => {
        const response = await axiosInstance.put(`/contract-terms/${id}`, data);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await axiosInstance.delete(`/contract-terms/${id}`);
    },
};
