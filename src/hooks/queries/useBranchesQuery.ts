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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to create multiple branches at once
 */
export const useCreateBranches = () => {
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any[] }) => createBranches(clientId, data),
    });
};

/**
 * Hook to update a branch
 */
export const useUpdateBranch = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, branchId, data }: { clientId: string; branchId: string; data: any }) => updateBranch(clientId, branchId, data),
        onSuccess: () => {
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
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};
