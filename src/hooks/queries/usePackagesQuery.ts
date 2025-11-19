import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPackages, getPackageById, createPackage, updatePackage, deletePackage, type PackageQueryParams } from "@/api/requests/packagesService";

// Query keys
export const packagesKeys = {
    all: ["packages"] as const,
    lists: () => [...packagesKeys.all, "list"] as const,
    list: (params?: PackageQueryParams) => [...packagesKeys.lists(), params] as const,
    details: () => [...packagesKeys.all, "detail"] as const,
    detail: (id: string) => [...packagesKeys.details(), id] as const,
};

/**
 * Hook to fetch packages list
 */
export const usePackages = (params?: PackageQueryParams) => {
    return useQuery({
        queryKey: packagesKeys.list(params),
        queryFn: () => getPackages(params),
    });
};

/**
 * Hook to fetch single package
 */
export const usePackage = (id: string, enabled = true) => {
    return useQuery({
        queryKey: packagesKeys.detail(id),
        queryFn: () => getPackageById(id),
        enabled: !!id && enabled,
    });
};

/**
 * Hook to create package
 */
export const useCreatePackage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPackage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: packagesKeys.lists() });
        },
    });
};

/**
 * Hook to update package
 */
export const useUpdatePackage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePackage>[1] }) => updatePackage(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: packagesKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: packagesKeys.lists() });
        },
    });
};

/**
 * Hook to delete package
 */
export const useDeletePackage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deletePackage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: packagesKeys.lists() });
        },
    });
};
