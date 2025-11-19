import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getServices, getServiceById, createService, updateService, deleteService, type ServiceQueryParams } from "@/api/requests/servicesService";

// Query keys for better cache management
export const servicesKeys = {
    all: ["services"] as const,
    lists: () => [...servicesKeys.all, "list"] as const,
    list: (params?: ServiceQueryParams) => [...servicesKeys.lists(), params] as const,
    details: () => [...servicesKeys.all, "detail"] as const,
    detail: (id: string) => [...servicesKeys.details(), id] as const,
};

/**
 * Hook to fetch services list with pagination and filters
 */
export const useServices = (params?: ServiceQueryParams) => {
    return useQuery({
        queryKey: servicesKeys.list(params),
        queryFn: () => getServices(params),
    });
};

/**
 * Hook to fetch single service by ID
 */
export const useService = (id: string, enabled = true) => {
    return useQuery({
        queryKey: servicesKeys.detail(id),
        queryFn: () => getServiceById(id),
        enabled: !!id && enabled,
    });
};

/**
 * Hook to create a new service
 */
export const useCreateService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
        },
    });
};

/**
 * Hook to update a service
 */
export const useUpdateService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateService>[1] }) => updateService(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: servicesKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
        },
    });
};

/**
 * Hook to delete a service
 */
export const useDeleteService = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
        },
    });
};
