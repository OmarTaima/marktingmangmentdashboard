import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    type ServiceQueryParams,
    type Service,
    type ServiceListResponse,
} from "@/api/requests/servicesService";

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
        onMutate: async (newService) => {
            await queryClient.cancelQueries({ queryKey: servicesKeys.lists() });
            const previous = queryClient.getQueriesData({ queryKey: servicesKeys.lists() });

            const tempId = `temp-${Date.now()}`;
            const optimisticService: Service = {
                _id: tempId,
                en: newService.en || "",
                ar: newService.ar || "",
                description: newService.description,
                price: newService.price,
            };

            previous.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ServiceListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: [optimisticService, ...old.data],
                        meta: { ...old.meta, total: (old.meta?.total || 0) + 1 },
                    };
                });
            });

            return { previous };
        },
        onError: (_err, _newService, context: any) => {
            if (context?.previous) {
                context.previous.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
        },
        onSuccess: (createdService) => {
            const queries = queryClient.getQueriesData({ queryKey: servicesKeys.lists() });
            queries.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ServiceListResponse) => {
                    if (!old) return old;
                    const idx = old.data.findIndex((s) => s._id?.toString().startsWith("temp-"));
                    if (idx === -1) return old;
                    const newData = [...old.data];
                    newData[idx] = createdService;
                    return { ...old, data: newData };
                });
            });
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
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: servicesKeys.lists() });
            await queryClient.cancelQueries({ queryKey: servicesKeys.detail(id) });

            const previousLists = queryClient.getQueriesData({ queryKey: servicesKeys.lists() });
            const previousDetail = queryClient.getQueryData(servicesKeys.detail(id));

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ServiceListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((service) => (service._id === id ? { ...service, ...data } : service)),
                    };
                });
            });

            if (previousDetail) {
                queryClient.setQueryData(servicesKeys.detail(id), (old: any) => ({ ...old, ...data }));
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
                queryClient.setQueryData(servicesKeys.detail(id), context.previousDetail);
            }
        },
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
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: servicesKeys.lists() });
            const previous = queryClient.getQueriesData({ queryKey: servicesKeys.lists() });

            previous.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: ServiceListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.filter((service) => service._id !== id),
                        meta: { ...old.meta, total: Math.max(0, (old.meta?.total || 0) - 1) },
                    };
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
            queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
        },
    });
};
