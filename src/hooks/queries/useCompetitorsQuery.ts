import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompetitorsByClientId, createCompetitor, createCompetitors, updateCompetitor, deleteCompetitor } from "@/api/requests/competitorsService";
import { clientsKeys } from "@/hooks/queries/useClientsQuery";

// Query keys
export const competitorsKeys = {
    all: ["competitors"] as const,
    byClient: (clientId: string) => [...competitorsKeys.all, clientId] as const,
};

/**
 * Hook to fetch competitors for a client
 */
export const useCompetitors = (clientId: string, enabled = true) => {
    return useQuery({
        queryKey: competitorsKeys.byClient(clientId),
        queryFn: () => getCompetitorsByClientId(clientId),
        enabled: !!clientId && enabled,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });
};

/**
 * Hook to create a competitor
 */
export const useCreateCompetitor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any }) => createCompetitor(clientId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to create multiple competitors at once
 */
export const useCreateCompetitors = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any[] }) => createCompetitors(clientId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: competitorsKeys.byClient(variables.clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(variables.clientId) });
        },
    });
};

/**
 * Hook to update a competitor
 */
export const useUpdateCompetitor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, competitorId, data }: { clientId: string; competitorId: string; data: any }) =>
            updateCompetitor(clientId, competitorId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to delete a competitor
 */
export const useDeleteCompetitor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, competitorId }: { clientId: string; competitorId: string }) => deleteCompetitor(clientId, competitorId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};
