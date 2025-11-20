import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSegmentsByClientId, createSegment, createSegments, updateSegment, deleteSegment } from "@/api/requests/segmentService";
import { clientsKeys } from "@/hooks/queries/useClientsQuery";

// Query keys
export const segmentsKeys = {
    all: ["segments"] as const,
    byClient: (clientId: string) => [...segmentsKeys.all, clientId] as const,
};

/**
 * Hook to fetch segments for a client
 */
export const useSegments = (clientId: string, enabled = true) => {
    return useQuery({
        queryKey: segmentsKeys.byClient(clientId),
        queryFn: () => getSegmentsByClientId(clientId),
        enabled: !!clientId && enabled,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });
};

/**
 * Hook to create a segment
 */
export const useCreateSegment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any }) => createSegment(clientId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to create multiple segments at once
 */
export const useCreateSegments = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any[] }) => createSegments(clientId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: segmentsKeys.byClient(variables.clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(variables.clientId) });
        },
    });
};

/**
 * Hook to update a segment
 */
export const useUpdateSegment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, segmentId, data }: { clientId: string; segmentId: string; data: any }) => updateSegment(clientId, segmentId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to delete a segment
 */
export const useDeleteSegment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, segmentId }: { clientId: string; segmentId: string }) => deleteSegment(clientId, segmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};
