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
        staleTime: 10 * 60 * 1000, // Consider data fresh for 10 minutes
        gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: false, // Don't refetch on mount if data exists
        refetchOnReconnect: false, // Don't refetch on reconnect
    });
};

/**
 * Hook to create a new client
 */
export const useCreateClient = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<Client>) => createClient(data),
        onSuccess: () => {
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
        onSuccess: (_, variables) => {
            // Ensure clients list is refreshed whenever a client is updated
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            // Also invalidate the detail for the updated client
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
        onSuccess: () => {
            // Invalidate cached clients list and immediately refetch it even if the
            // clients list query is not currently active (e.g. we're on the detail page).
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            // Refetch inactive queries as well so the list is up-to-date when user
            // navigates back without needing a manual page refresh.
            queryClient.refetchQueries({ queryKey: clientsKeys.lists(), active: false });
        },
    });
};
