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
    type Contract,
    type ContractListResponse,
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
        onMutate: async (newContract) => {
            await queryClient.cancelQueries({ queryKey: contractsKeys.lists() });
            const previous = queryClient.getQueriesData({ queryKey: contractsKeys.lists() });

            const tempId = `temp-${Date.now()}`;
            const optimisticContract: Contract = {
                _id: tempId,
                contractNumber: "PENDING",
                status: "draft",
                deleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...newContract,
            } as Contract;

            previous.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ContractListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: [optimisticContract, ...old.data],
                        meta: { ...old.meta, total: (old.meta?.total || 0) + 1 },
                    };
                });
            });

            return { previous };
        },
        onError: (_err, _newContract, context: any) => {
            if (context?.previous) {
                context.previous.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
        },
        onSuccess: (createdContract) => {
            const queries = queryClient.getQueriesData({ queryKey: contractsKeys.lists() });
            queries.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ContractListResponse) => {
                    if (!old) return old;
                    const idx = old.data.findIndex((c) => c._id?.toString().startsWith("temp-"));
                    if (idx === -1) return old;
                    const newData = [...old.data];
                    newData[idx] = createdContract;
                    return { ...old, data: newData };
                });
            });
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
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: contractsKeys.lists() });
            await queryClient.cancelQueries({ queryKey: contractsKeys.detail(id) });

            const previousLists = queryClient.getQueriesData({ queryKey: contractsKeys.lists() });
            const previousDetail = queryClient.getQueryData(contractsKeys.detail(id));

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ContractListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((c) => (c._id === id ? { ...c, ...data } : c)),
                    };
                });
            });

            if (previousDetail) {
                queryClient.setQueryData(contractsKeys.detail(id), (old: any) => ({ ...old, ...data }));
            }

            return { previousLists, previousDetail };
        },
        onError: (_err, { id }, context: any) => {
            if (context?.previousLists) {
                context.previousLists.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
            if (context?.previousDetail) {
                queryClient.setQueryData(contractsKeys.detail(id), context.previousDetail);
            }
        },
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
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: contractsKeys.lists() });
            const previous = queryClient.getQueriesData({ queryKey: contractsKeys.lists() });

            previous.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ContractListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.filter((c) => c._id !== id),
                        meta: { ...old.meta, total: Math.max(0, (old.meta?.total || 0) - 1) },
                    };
                });
            });

            return { previous };
        },
        onError: (_err, _id, context: any) => {
            if (context?.previous) {
                context.previous.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
        },
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
        onMutate: async ({ id, signedDate }) => {
            await queryClient.cancelQueries({ queryKey: contractsKeys.lists() });
            await queryClient.cancelQueries({ queryKey: contractsKeys.detail(id) });

            const previousLists = queryClient.getQueriesData({ queryKey: contractsKeys.lists() });
            const previousDetail = queryClient.getQueryData(contractsKeys.detail(id));

            const updates = { signedDate: signedDate || new Date().toISOString() };

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ContractListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((c) => (c._id === id ? { ...c, ...updates } : c)),
                    };
                });
            });

            if (previousDetail) {
                queryClient.setQueryData(contractsKeys.detail(id), (old: any) => ({ ...old, ...updates }));
            }

            return { previousLists, previousDetail };
        },
        onError: (_err, { id }, context: any) => {
            if (context?.previousLists) {
                context.previousLists.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
            if (context?.previousDetail) {
                queryClient.setQueryData(contractsKeys.detail(id), context.previousDetail);
            }
        },
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
