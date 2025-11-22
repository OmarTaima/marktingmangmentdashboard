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
        onMutate: async ({ clientId, data }) => {
            await queryClient.cancelQueries({ queryKey: competitorsKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousCompetitors = queryClient.getQueryData(competitorsKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            const tempId = `temp-${Date.now()}`;
            const optimisticCompetitor = { _id: tempId, ...data };

            queryClient.setQueryData(competitorsKeys.byClient(clientId), (old: any) => {
                if (!old) return [optimisticCompetitor];
                if (Array.isArray(old)) return [optimisticCompetitor, ...old];
                if (old.data) return { ...old, data: [optimisticCompetitor, ...old.data] };
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    competitors: old?.competitors ? [optimisticCompetitor, ...old.competitors] : [optimisticCompetitor],
                }));
            }

            return { previousCompetitors, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousCompetitors) {
                queryClient.setQueryData(competitorsKeys.byClient(clientId), context.previousCompetitors);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: competitorsKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
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
        onMutate: async ({ clientId, competitorId, data }) => {
            await queryClient.cancelQueries({ queryKey: competitorsKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousCompetitors = queryClient.getQueryData(competitorsKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            queryClient.setQueryData(competitorsKeys.byClient(clientId), (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) {
                    return old.map((c: any) => (c._id === competitorId ? { ...c, ...data } : c));
                }
                if (old.data) {
                    return { ...old, data: old.data.map((c: any) => (c._id === competitorId ? { ...c, ...data } : c)) };
                }
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    competitors: old?.competitors?.map((c: any) => (c._id === competitorId ? { ...c, ...data } : c)),
                }));
            }

            return { previousCompetitors, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousCompetitors) {
                queryClient.setQueryData(competitorsKeys.byClient(clientId), context.previousCompetitors);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: competitorsKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
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
        onMutate: async ({ clientId, competitorId }) => {
            await queryClient.cancelQueries({ queryKey: competitorsKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousCompetitors = queryClient.getQueryData(competitorsKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            queryClient.setQueryData(competitorsKeys.byClient(clientId), (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) {
                    return old.filter((c: any) => c._id !== competitorId);
                }
                if (old.data) {
                    return { ...old, data: old.data.filter((c: any) => c._id !== competitorId) };
                }
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    competitors: old?.competitors?.filter((c: any) => c._id !== competitorId),
                }));
            }

            return { previousCompetitors, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousCompetitors) {
                queryClient.setQueryData(competitorsKeys.byClient(clientId), context.previousCompetitors);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: competitorsKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};
