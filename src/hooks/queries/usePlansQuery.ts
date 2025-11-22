import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createCampaign,
    getAllCampaigns,
    getCampaignsByClientId,
    updateCampaign,
    deleteCampaign,
    type CreateCampaignPayload,
    type UpdateCampaignPayload,
    type Campaign,
} from "@/api/requests/planService";

// Query keys
export const campaignsKeys = {
    all: ["campaigns"] as const,
    lists: () => [...campaignsKeys.all, "list"] as const,
    list: () => [...campaignsKeys.lists()] as const,
    byClient: (clientId: string) => [...campaignsKeys.all, "client", clientId] as const,
};

/**
 * Hook to fetch all campaigns
 */
export const useAllCampaigns = () => {
    return useQuery({
        queryKey: campaignsKeys.list(),
        queryFn: getAllCampaigns,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    });
};

/**
 * Hook to fetch campaigns by client ID
 */
export const useCampaignsByClient = (clientId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: campaignsKeys.byClient(clientId),
        queryFn: () => getCampaignsByClientId(clientId),
        enabled: !!clientId && enabled, // Only run if clientId exists
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

/**
 * Hook to create a new campaign
 */
export const useCreateCampaign = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateCampaignPayload) => createCampaign(payload),
        onMutate: async (newCampaign) => {
            await queryClient.cancelQueries({ queryKey: campaignsKeys.lists() });
            await queryClient.cancelQueries({ queryKey: campaignsKeys.byClient(newCampaign.clientId) });

            const previousLists = queryClient.getQueriesData({ queryKey: campaignsKeys.lists() });
            const previousByClient = queryClient.getQueryData(campaignsKeys.byClient(newCampaign.clientId));

            const tempId = `temp-${Date.now()}`;
            const optimisticCampaign: Campaign = {
                _id: tempId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...newCampaign,
            };

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return [optimisticCampaign];
                    if (Array.isArray(old)) return [optimisticCampaign, ...old];
                    if (old.data) return { ...old, data: [optimisticCampaign, ...old.data] };
                    return old;
                });
            });

            queryClient.setQueryData(campaignsKeys.byClient(newCampaign.clientId), (old: any) => {
                if (!old) return [optimisticCampaign];
                if (Array.isArray(old)) return [optimisticCampaign, ...old];
                if (old.data) return { ...old, data: [optimisticCampaign, ...old.data] };
                return old;
            });

            return { previousLists, previousByClient };
        },
        onError: (_err, newCampaign, context: any) => {
            if (context?.previousLists) {
                context.previousLists.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
            if (context?.previousByClient) {
                queryClient.setQueryData(campaignsKeys.byClient(newCampaign.clientId), context.previousByClient);
            }
        },
        onSuccess: (data) => {
            const queries = queryClient.getQueriesData({ queryKey: campaignsKeys.lists() });
            queries.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        const idx = old.findIndex((c: Campaign) => c._id?.toString().startsWith("temp-"));
                        if (idx === -1) return old;
                        const newData = [...old];
                        newData[idx] = data;
                        return newData;
                    }
                    if (old.data) {
                        const idx = old.data.findIndex((c: Campaign) => c._id?.toString().startsWith("temp-"));
                        if (idx === -1) return old;
                        const newData = [...old.data];
                        newData[idx] = data;
                        return { ...old, data: newData };
                    }
                    return old;
                });
            });
            queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: campaignsKeys.byClient(data.clientId) });
        },
    });
};

/**
 * Hook to update a campaign
 */
export const useUpdateCampaign = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ campaignId, payload }: { campaignId: string; payload: UpdateCampaignPayload }) => updateCampaign(campaignId, payload),
        onMutate: async ({ campaignId, payload }) => {
            await queryClient.cancelQueries({ queryKey: campaignsKeys.lists() });

            const previousLists = queryClient.getQueriesData({ queryKey: campaignsKeys.lists() });
            const previousByClient = payload.clientId ? queryClient.getQueryData(campaignsKeys.byClient(payload.clientId)) : undefined;

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        return old.map((c: Campaign) => (c._id === campaignId ? { ...c, ...payload } : c));
                    }
                    if (old.data) {
                        return { ...old, data: old.data.map((c: Campaign) => (c._id === campaignId ? { ...c, ...payload } : c)) };
                    }
                    return old;
                });
            });

            if (payload.clientId && previousByClient) {
                queryClient.setQueryData(campaignsKeys.byClient(payload.clientId), (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        return old.map((c: Campaign) => (c._id === campaignId ? { ...c, ...payload } : c));
                    }
                    if (old.data) {
                        return { ...old, data: old.data.map((c: Campaign) => (c._id === campaignId ? { ...c, ...payload } : c)) };
                    }
                    return old;
                });
            }

            return { previousLists, previousByClient };
        },
        onError: (_err, { payload }, context: any) => {
            if (context?.previousLists) {
                context.previousLists.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
            if (payload.clientId && context?.previousByClient) {
                queryClient.setQueryData(campaignsKeys.byClient(payload.clientId), context.previousByClient);
            }
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: campaignsKeys.byClient(data.clientId) });
        },
    });
};

/**
 * Hook to delete a campaign
 */
export const useDeleteCampaign = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ campaignId }: { campaignId: string; clientId: string }) => deleteCampaign(campaignId),
        onMutate: async ({ campaignId, clientId }) => {
            await queryClient.cancelQueries({ queryKey: campaignsKeys.lists() });
            await queryClient.cancelQueries({ queryKey: campaignsKeys.byClient(clientId) });

            const previousLists = queryClient.getQueriesData({ queryKey: campaignsKeys.lists() });
            const previousByClient = queryClient.getQueryData(campaignsKeys.byClient(clientId));

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        return old.filter((c: Campaign) => c._id !== campaignId);
                    }
                    if (old.data) {
                        return { ...old, data: old.data.filter((c: Campaign) => c._id !== campaignId) };
                    }
                    return old;
                });
            });

            queryClient.setQueryData(campaignsKeys.byClient(clientId), (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) {
                    return old.filter((c: Campaign) => c._id !== campaignId);
                }
                if (old.data) {
                    return { ...old, data: old.data.filter((c: Campaign) => c._id !== campaignId) };
                }
                return old;
            });

            return { previousLists, previousByClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousLists) {
                context.previousLists.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
            if (context?.previousByClient) {
                queryClient.setQueryData(campaignsKeys.byClient(clientId), context.previousByClient);
            }
        },
        onSuccess: (_, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: campaignsKeys.byClient(clientId) });
        },
    });
};
