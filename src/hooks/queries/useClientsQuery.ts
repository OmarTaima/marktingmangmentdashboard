import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client } from "@/api/interfaces/clientinterface";
import {
    getClients,
    getClientsWithFilters,
    getClientById,
    createClient,
    updateClient,
    patchClient,
    deleteClient,
    type ClientFilterParams,
} from "@/api/requests/clientService";

// Query keys
export const clientsKeys = {
    all: ["clients"] as const,
    lists: () => [...clientsKeys.all, "list"] as const,
    list: (params?: ClientFilterParams) => [...clientsKeys.lists(), params] as const,
    details: () => [...clientsKeys.all, "detail"] as const,
    detail: (id: string) => [...clientsKeys.details(), id] as const,
};

/**
 * Hook to fetch all clients (simple version)
 */
export const useClients = () => {
    return useQuery({
        queryKey: clientsKeys.lists(),
        queryFn: getClients,
        staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
        gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: false, // Don't refetch on component mount if data exists
        refetchOnReconnect: false, // Don't refetch on reconnect
        retry: 1, // Only retry once on failure
    });
};

/**
 * Hook to fetch clients with filters and pagination
 */
export const useClientsWithFilters = (filters?: ClientFilterParams) => {
    return useQuery({
        queryKey: clientsKeys.list(filters),
        queryFn: () => getClientsWithFilters(filters),
    });
};

/**
 * Hook to fetch single client by ID
 */
export const useClient = (id: string, enabled = true) => {
    return useQuery({
        queryKey: clientsKeys.detail(id),
        queryFn: () => getClientById(id),
        enabled: !!id && enabled,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
    });
};

/**
 * Hook to create a new client
 */
export const useCreateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Client>) => createClient(data),
        onMutate: async (newClient) => {
            await queryClient.cancelQueries({ queryKey: clientsKeys.lists() });
            const previous = queryClient.getQueriesData({ queryKey: clientsKeys.lists() });

            const tempId = `temp-${Date.now()}`;
            const optimisticClient: Client = {
                _id: tempId,
                ...newClient,
            } as Client;

            previous.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        return [optimisticClient, ...old];
                    }
                    if (old.data && Array.isArray(old.data)) {
                        return {
                            ...old,
                            data: [optimisticClient, ...old.data],
                            meta: old.meta ? { ...old.meta, total: (old.meta.total || 0) + 1 } : undefined,
                        };
                    }
                    return old;
                });
            });

            return { previous };
        },
        onError: (_err, _newClient, context: any) => {
            if (context?.previous) {
                context.previous.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
        },
        onSuccess: (createdClient) => {
            const queries = queryClient.getQueriesData({ queryKey: clientsKeys.lists() });
            queries.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        const idx = old.findIndex((c: Client) => c._id?.toString().startsWith("temp-"));
                        if (idx === -1) return old;
                        const newData = [...old];
                        newData[idx] = createdClient;
                        return newData;
                    }
                    if (old.data && Array.isArray(old.data)) {
                        const idx = old.data.findIndex((c: Client) => c._id?.toString().startsWith("temp-"));
                        if (idx === -1) return old;
                        const newData = [...old.data];
                        newData[idx] = createdClient;
                        return { ...old, data: newData };
                    }
                    return old;
                });
            });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to update a client
 */
export const useUpdateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Client> }) => updateClient(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: clientsKeys.lists() });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(id) });

            const previousLists = queryClient.getQueriesData({ queryKey: clientsKeys.lists() });
            const previousDetail = queryClient.getQueryData(clientsKeys.detail(id));

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        return old.map((c: Client) => (c._id === id ? { ...c, ...data } : c));
                    }
                    if (old.data && Array.isArray(old.data)) {
                        return {
                            ...old,
                            data: old.data.map((c: Client) => (c._id === id ? { ...c, ...data } : c)),
                        };
                    }
                    return old;
                });
            });

            if (previousDetail) {
                queryClient.setQueryData(clientsKeys.detail(id), (old: any) => ({ ...old, ...data }));
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
                queryClient.setQueryData(clientsKeys.detail(id), context.previousDetail);
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail((variables as any).id) });
        },
    });
};

/**
 * Hook to patch client fields
 */
export const usePatchClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => patchClient(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: clientsKeys.lists() });
            await queryClient.cancelQueries({ queryKey: clientsKeys.detail(id) });

            const previousLists = queryClient.getQueriesData({ queryKey: clientsKeys.lists() });
            const previousDetail = queryClient.getQueryData(clientsKeys.detail(id));

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        return old.map((c: Client) => (c._id === id ? { ...c, ...data } : c));
                    }
                    if (old.data && Array.isArray(old.data)) {
                        return {
                            ...old,
                            data: old.data.map((c: Client) => (c._id === id ? { ...c, ...data } : c)),
                        };
                    }
                    return old;
                });
            });

            if (previousDetail) {
                queryClient.setQueryData(clientsKeys.detail(id), (old: any) => ({ ...old, ...data }));
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
                queryClient.setQueryData(clientsKeys.detail(id), context.previousDetail);
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};

/**
 * Hook to delete a client
 */
export const useDeleteClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteClient,
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: clientsKeys.lists() });
            const previous = queryClient.getQueriesData({ queryKey: clientsKeys.lists() });

            previous.forEach(([key]) => {
                queryClient.setQueryData(key, (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) {
                        return old.filter((c: Client) => c._id !== id);
                    }
                    if (old.data && Array.isArray(old.data)) {
                        return {
                            ...old,
                            data: old.data.filter((c: Client) => c._id !== id),
                            meta: old.meta ? { ...old.meta, total: Math.max(0, (old.meta.total || 0) - 1) } : undefined,
                        };
                    }
                    return old;
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
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            queryClient.refetchQueries({ queryKey: clientsKeys.lists(), type: "all" });
        },
    });
};
