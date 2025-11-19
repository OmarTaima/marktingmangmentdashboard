import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getContracts,
    getContractById,
    createContract,
    updateContract,
    deleteContract,
    signContract,
    activateContract,
    completeContract,
    cancelContract,
    renewContract,
    type ContractQueryParams,
} from "@/api/requests/contractsService";

// Query keys
export const contractsKeys = {
    all: ["contracts"] as const,
    lists: () => [...contractsKeys.all, "list"] as const,
    list: (params?: ContractQueryParams) => [...contractsKeys.lists(), params] as const,
    details: () => [...contractsKeys.all, "detail"] as const,
    detail: (id: string) => [...contractsKeys.details(), id] as const,
};

/**
 * Hook to fetch contracts list
 */
export const useContracts = (params?: ContractQueryParams) => {
    return useQuery({
        queryKey: contractsKeys.list(params),
        queryFn: () => getContracts(params),
    });
};

/**
 * Hook to fetch single contract
 */
export const useContract = (id: string, enabled = true) => {
    return useQuery({
        queryKey: contractsKeys.detail(id),
        queryFn: () => getContractById(id),
        enabled: !!id && enabled,
    });
};

/**
 * Hook to create contract
 */
export const useCreateContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
        },
    });
};

/**
 * Hook to update contract
 */
export const useUpdateContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateContract>[1] }) => updateContract(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: contractsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
        },
    });
};

/**
 * Hook to delete contract
 */
export const useDeleteContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteContract,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
        },
    });
};

/**
 * Hook to sign contract
 */
export const useSignContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, signedDate }: { id: string; signedDate?: string }) => signContract(id, signedDate),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: contractsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
        },
    });
};

/**
 * Hook to activate contract
 */
export const useActivateContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: activateContract,
        onSuccess: (data) => {
            if (data._id) {
                queryClient.invalidateQueries({ queryKey: contractsKeys.detail(data._id) });
            }
            queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
        },
    });
};

/**
 * Hook to complete contract
 */
export const useCompleteContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: completeContract,
        onSuccess: (data) => {
            if (data._id) {
                queryClient.invalidateQueries({ queryKey: contractsKeys.detail(data._id) });
            }
            queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
        },
    });
};

/**
 * Hook to cancel contract
 */
export const useCancelContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelContract(id, reason),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: contractsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
        },
    });
};

/**
 * Hook to renew contract
 */
export const useRenewContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, newStartDate, newEndDate }: { id: string; newStartDate: string; newEndDate: string }) =>
            renewContract(id, newStartDate, newEndDate),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: contractsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
        },
    });
};
