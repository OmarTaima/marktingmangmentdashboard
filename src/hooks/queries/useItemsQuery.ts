import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItems, getItemById, createItem, updateItem, deleteItem, type ItemQueryParams } from "@/api/requests/itemsService";

// Query keys
export const itemsKeys = {
    all: ["items"] as const,
    lists: () => [...itemsKeys.all, "list"] as const,
    list: (params?: ItemQueryParams) => [...itemsKeys.lists(), params] as const,
    details: () => [...itemsKeys.all, "detail"] as const,
    detail: (id: string) => [...itemsKeys.details(), id] as const,
};

/**
 * Hook to fetch items list
 */
export const useItems = (params?: ItemQueryParams) => {
    return useQuery({
        queryKey: itemsKeys.list(params),
        queryFn: () => getItems(params),
    });
};

/**
 * Hook to fetch single item
 */
export const useItem = (id: string, enabled = true) => {
    return useQuery({
        queryKey: itemsKeys.detail(id),
        queryFn: () => getItemById(id),
        enabled: !!id && enabled,
    });
};

/**
 * Hook to create item
 */
export const useCreateItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: itemsKeys.lists() });
        },
    });
};

/**
 * Hook to update item
 */
export const useUpdateItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateItem>[1] }) => updateItem(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: itemsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: itemsKeys.lists() });
        },
    });
};

/**
 * Hook to delete item
 */
export const useDeleteItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: itemsKeys.lists() });
        },
    });
};
