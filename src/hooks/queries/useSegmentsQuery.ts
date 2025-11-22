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
        onMutate: async ({ clientId, data }) => {
            await queryClient.cancelQueries({ queryKey: segmentsKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousSegments = queryClient.getQueryData(segmentsKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            const tempId = `temp-${Date.now()}`;
            const optimisticSegment = { _id: tempId, ...data };

            queryClient.setQueryData(segmentsKeys.byClient(clientId), (old: any) => {
                if (!old) return [optimisticSegment];
                if (Array.isArray(old)) return [optimisticSegment, ...old];
                if (old.data) return { ...old, data: [optimisticSegment, ...old.data] };
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    segments: old?.segments ? [optimisticSegment, ...old.segments] : [optimisticSegment],
                }));
            }

            return { previousSegments, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousSegments) {
                queryClient.setQueryData(segmentsKeys.byClient(clientId), context.previousSegments);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: segmentsKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
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
        onMutate: async ({ clientId, segmentId, data }) => {
            await queryClient.cancelQueries({ queryKey: segmentsKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousSegments = queryClient.getQueryData(segmentsKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            queryClient.setQueryData(segmentsKeys.byClient(clientId), (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) {
                    return old.map((s: any) => (s._id === segmentId ? { ...s, ...data } : s));
                }
                if (old.data) {
                    return { ...old, data: old.data.map((s: any) => (s._id === segmentId ? { ...s, ...data } : s)) };
                }
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    segments: old?.segments?.map((s: any) => (s._id === segmentId ? { ...s, ...data } : s)),
                }));
            }

            return { previousSegments, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousSegments) {
                queryClient.setQueryData(segmentsKeys.byClient(clientId), context.previousSegments);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: segmentsKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
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
        onMutate: async ({ clientId, segmentId }) => {
            await queryClient.cancelQueries({ queryKey: segmentsKeys.byClient(clientId) });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(clientId) });

            const previousSegments = queryClient.getQueryData(segmentsKeys.byClient(clientId));
            const previousClient = queryClient.getQueryData(clientsKeys.detail(clientId));

            queryClient.setQueryData(segmentsKeys.byClient(clientId), (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) {
                    return old.filter((s: any) => s._id !== segmentId);
                }
                if (old.data) {
                    return { ...old, data: old.data.filter((s: any) => s._id !== segmentId) };
                }
                return old;
            });

            if (previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), (old: any) => ({
                    ...old,
                    segments: old?.segments?.filter((s: any) => s._id !== segmentId),
                }));
            }

            return { previousSegments, previousClient };
        },
        onError: (_err, { clientId }, context: any) => {
            if (context?.previousSegments) {
                queryClient.setQueryData(segmentsKeys.byClient(clientId), context.previousSegments);
            }
            if (context?.previousClient) {
                queryClient.setQueryData(clientsKeys.detail(clientId), context.previousClient);
            }
        },
        onSuccess: (_data, { clientId }) => {
            queryClient.invalidateQueries({ queryKey: segmentsKeys.byClient(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};
