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
    type Quotation,
    type QuotationListResponse,
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
        queryFn: ({ signal }) => getQuotations(params, signal),
        staleTime: 5 * 60 * 1000, // 5 minutes
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
        onMutate: async (newQuotation) => {
            await queryClient.cancelQueries({ queryKey: quotationsKeys.lists() });
            const previous = queryClient.getQueriesData({ queryKey: quotationsKeys.lists() });

            const tempId = `temp-${Date.now()}`;
            const optimisticQuotation: Quotation = {
                _id: tempId,
                quotationNumber: "PENDING",
                status: "draft",
                deleted: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...newQuotation,
            } as Quotation;

            previous.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: QuotationListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: [optimisticQuotation, ...old.data],
                        meta: { ...old.meta, total: (old.meta?.total || 0) + 1 },
                    };
                });
            });

            return { previous };
        },
        onError: (_err, _newQuotation, context: any) => {
            if (context?.previous) {
                context.previous.forEach(([key, data]: [any, any]) => {
                    queryClient.setQueryData(key, data);
                });
            }
        },
        onSuccess: (createdQuotation: any) => {
            const queries = queryClient.getQueriesData({ queryKey: quotationsKeys.lists() });
            const actualQuotation = createdQuotation.data || createdQuotation;
            queries.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: QuotationListResponse) => {
                    if (!old) return old;
                    const idx = old.data.findIndex((q) => q._id?.toString().startsWith("temp-"));
                    if (idx === -1) return old;
                    const newData = [...old.data];
                    newData[idx] = actualQuotation;
                    return { ...old, data: newData };
                });
            });
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
        onMutate: async ({ id, payload }) => {
            await queryClient.cancelQueries({ queryKey: quotationsKeys.lists() });
            await queryClient.cancelQueries({ queryKey: quotationsKeys.detail(id) });

            const previousLists = queryClient.getQueriesData({ queryKey: quotationsKeys.lists() });
            const previousDetail = queryClient.getQueryData(quotationsKeys.detail(id));

            previousLists.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: QuotationListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((q) => (q._id === id ? { ...q, ...payload } : q)),
                    };
                });
            });

            if (previousDetail) {
                queryClient.setQueryData(quotationsKeys.detail(id), (old: any) => ({ ...old, ...payload }));
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
                queryClient.setQueryData(quotationsKeys.detail(id), context.previousDetail);
            }
        },
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
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: quotationsKeys.lists() });
            const previous = queryClient.getQueriesData({ queryKey: quotationsKeys.lists() });

            previous.forEach(([key]) => {
                queryClient.setQueryData(key, (old?: QuotationListResponse) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.filter((q) => q._id !== id),
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
