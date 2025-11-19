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
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
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
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
        },
    });
};
