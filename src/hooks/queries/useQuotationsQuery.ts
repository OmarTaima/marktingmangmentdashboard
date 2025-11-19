import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getQuotations,
    getQuotationById,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    convertQuotationToContract,
    type QuotationQueryParams,
    type CreateQuotationPayload,
    type UpdateQuotationPayload,
    type ConvertToContractPayload,
} from "@/api/requests/quotationsService";

// Query keys
export const quotationsKeys = {
    all: ["quotations"] as const,
    lists: () => [...quotationsKeys.all, "list"] as const,
    list: (params?: QuotationQueryParams) => [...quotationsKeys.lists(), params] as const,
    details: () => [...quotationsKeys.all, "detail"] as const,
    detail: (id: string) => [...quotationsKeys.details(), id] as const,
};

/**
 * Hook to fetch quotations list
 */
export const useQuotations = (params?: QuotationQueryParams) => {
    return useQuery({
        queryKey: quotationsKeys.list(params),
        queryFn: () => getQuotations(params),
    });
};

/**
 * Hook to fetch single quotation
 */
export const useQuotation = (id: string, enabled = true) => {
    return useQuery({
        queryKey: quotationsKeys.detail(id),
        queryFn: () => getQuotationById(id),
        enabled: !!id && enabled,
    });
};

/**
 * Hook to create quotation
 */
export const useCreateQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateQuotationPayload) => createQuotation(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quotationsKeys.lists() });
        },
    });
};

/**
 * Hook to update quotation
 */
export const useUpdateQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateQuotationPayload }) => updateQuotation(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: quotationsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: quotationsKeys.lists() });
        },
    });
};

/**
 * Hook to delete quotation
 */
export const useDeleteQuotation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteQuotation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: quotationsKeys.lists() });
        },
    });
};

/**
 * Hook to convert quotation to contract
 */
export const useConvertQuotationToContract = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: ConvertToContractPayload }) => convertQuotationToContract(id, payload),
        onSuccess: (_, variables) => {
            // Invalidate quotations and contracts
            queryClient.invalidateQueries({ queryKey: quotationsKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: quotationsKeys.lists() });
            queryClient.invalidateQueries({ queryKey: ["contracts"] });
        },
    });
};
