import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
} from "@/api/requests/clientService";
import Swal from "sweetalert2";

// Query keys for clients cache
export const clientsKeys = {
    all: ['clients'] as const,
    lists: () => [...clientsKeys.all, 'list'] as const,
    list: (id?: string) => [...clientsKeys.lists(), id || 'all'] as const,
    details: () => [...clientsKeys.all, 'detail'] as const,
    detail: (id: string) => [...clientsKeys.details(), id] as const,
};

// Hook to fetch all clients
export function useClients(options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: clientsKeys.lists(),
        queryFn: async () => {
            return await getClients();
        },
        enabled: options?.enabled ?? true,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

// Hook to fetch single client by id
export function useClientById(clientId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: clientsKeys.detail(clientId),
        queryFn: async () => {
            if (!clientId) return null;
            return await getClientById(clientId);
        },
        enabled: !!clientId && (options?.enabled ?? true),
    });
}

// Backwards-compatible alias: some files import `useClient`
export const useClient = useClientById;

// Create client
export function useCreateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => createClient(data),
        onSuccess: (_, _variables) => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            Swal.fire({ title: 'Success', text: 'Client created', icon: 'success', timer: 1500, showConfirmButton: false });
        },
        onError: (err: any) => {
            Swal.fire({ title: 'Error', text: err.message || 'Failed to create client', icon: 'error' });
        }
    });
}

// Update client
export function useUpdateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientId, data }: { clientId: string; data: any }) => updateClient(clientId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(variables.clientId) });
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            Swal.fire({ title: 'Success', text: 'Client updated', icon: 'success', timer: 1500, showConfirmButton: false });
        },
        onError: (err: any) => {
            Swal.fire({ title: 'Error', text: err.message || 'Failed to update client', icon: 'error' });
        }
    });
}

// Delete client
export function useDeleteClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (clientId: string) => deleteClient(clientId),
        onSuccess: (_, clientId) => {
            queryClient.invalidateQueries({ queryKey: clientsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: clientsKeys.detail(clientId as unknown as string) });
            Swal.fire({ title: 'Deleted', text: 'Client deleted', icon: 'success', timer: 1500, showConfirmButton: false });
        },
        onError: (err: any) => {
            Swal.fire({ title: 'Error', text: err.message || 'Failed to delete client', icon: 'error' });
        }
    });
}

export default {
    useClients,
    useClientById,
    useClient,
    useCreateClient,
    useUpdateClient,
    useDeleteClient,
    clientsKeys,
};