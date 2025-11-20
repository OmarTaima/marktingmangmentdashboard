import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createCampaign,
    getAllCampaigns,
    getCampaignsByClientId,
    updateCampaign,
    deleteCampaign,
    type CreateCampaignPayload,
    type UpdateCampaignPayload,
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
        onSuccess: (data) => {
            // Invalidate and refetch campaigns list
            queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
            // Invalidate campaigns for this specific client
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
        onSuccess: (data) => {
            // Invalidate and refetch campaigns
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
        onSuccess: (_, { clientId }) => {
            // Invalidate and refetch campaigns
            queryClient.invalidateQueries({ queryKey: campaignsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: campaignsKeys.byClient(clientId) });
        },
    });
};
