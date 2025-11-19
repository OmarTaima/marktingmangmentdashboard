import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBranchesByClientId, createBranch, updateBranch, deleteBranch } from "@/api/requests/branchesService";
import { clientsKeys } from "./useClientsQuery";

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
    });
};

/**
 * Hook to create a branch
 */
export const useCreateBranch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any }) => createBranch(clientId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: branchesKeys.byClient(variables.clientId) });
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
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: branchesKeys.byClient(variables.clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(variables.clientId) });
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
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: branchesKeys.byClient(variables.clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(variables.clientId) });
        },
    });
};
