import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBranchesByClientId, createBranch, createBranches, updateBranch, deleteBranch } from "@/api/requests/branchesService";
import { clientsKeys } from "@/hooks/queries/useClientsQuery";

// Query keys
export const branchesKeys = {
    all: ["branches"] as const,
    byClient: (clientId: string) => [...branchesKeys.all, clientId] as const,
};

/**
 * Hook to fetch branches for a client
 */
export const useBranches = (clientId: string, enabled = true) => {
    return useQuery({
        queryKey: branchesKeys.byClient(clientId),
        queryFn: () => getBranchesByClientId(clientId),
        enabled: !!clientId && enabled,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });
};

/**
 * Hook to create a branch
 */
export const useCreateBranch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any }) => createBranch(clientId, data),
        onMutate: async ({ clientId, data }) => {
            await queryClient.cancelQueries({ queryKey: branchesKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousBranches = queryClient.getQueryData(branchesKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            const tempId = `temp-${Date.now()}`;
            const optimisticBranch = { _id: tempId, ...data };

            queryClient.setQueryData(branchesKeys.byClient(clientId), (old: any) => {
                if (!old) return [optimisticBranch];
                if (Array.isArray(old)) return [optimisticBranch, ...old];
                if (old.data) return { ...old, data: [optimisticBranch, ...old.data] };
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    branches: old?.branches ? [optimisticBranch, ...old.branches] : [optimisticBranch],
                }));
            }

            return { previousBranches, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousBranches) {
                queryClient.setQueryData(branchesKeys.byClient(clientId), context.previousBranches);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: branchesKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to create multiple branches at once
 */
export const useCreateBranches = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any[] }) => createBranches(clientId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: branchesKeys.byClient(variables.clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(variables.clientId) });
        },
    });
};

/**
 * Hook to update a branch
 */
export const useUpdateBranch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, branchId, data }: { clientId: string; branchId: string; data: any }) => updateBranch(clientId, branchId, data),
        onMutate: async ({ clientId, branchId, data }) => {
            await queryClient.cancelQueries({ queryKey: branchesKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousBranches = queryClient.getQueryData(branchesKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            queryClient.setQueryData(branchesKeys.byClient(clientId), (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) {
                    return old.map((b: any) => (b._id === branchId ? { ...b, ...data } : b));
                }
                if (old.data) {
                    return { ...old, data: old.data.map((b: any) => (b._id === branchId ? { ...b, ...data } : b)) };
                }
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    branches: old?.branches?.map((b: any) => (b._id === branchId ? { ...b, ...data } : b)),
                }));
            }

            return { previousBranches, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousBranches) {
                queryClient.setQueryData(branchesKeys.byClient(clientId), context.previousBranches);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: branchesKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to delete a branch
 */
export const useDeleteBranch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, branchId }: { clientId: string; branchId: string }) => deleteBranch(clientId, branchId),
        onMutate: async ({ clientId, branchId }) => {
            await queryClient.cancelQueries({ queryKey: branchesKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousBranches = queryClient.getQueryData(branchesKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            queryClient.setQueryData(branchesKeys.byClient(clientId), (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) {
                    return old.filter((b: any) => b._id !== branchId);
                }
                if (old.data) {
                    return { ...old, data: old.data.filter((b: any) => b._id !== branchId) };
                }
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    branches: old?.branches?.filter((b: any) => b._id !== branchId),
                }));
            }

            return { previousBranches, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousBranches) {
                queryClient.setQueryData(branchesKeys.byClient(clientId), context.previousBranches);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: branchesKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};
