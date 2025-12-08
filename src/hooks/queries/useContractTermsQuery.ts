import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractTermsService, GetContractTermsParams, CreateContractTermDTO, UpdateContractTermDTO } from "@/api/requests/termsService";

const TERMS_QUERY_KEY = "contract-terms";

export const useContractTerms = (params?: GetContractTermsParams) => {
    return useQuery({
        queryKey: [TERMS_QUERY_KEY, params],
        queryFn: () => contractTermsService.getAll(params),
    });
};

export const useCreateContractTerm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateContractTermDTO) => contractTermsService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TERMS_QUERY_KEY] });
        },
    });
};

export const useUpdateContractTerm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateContractTermDTO }) => contractTermsService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TERMS_QUERY_KEY] });
        },
    });
};

export const useDeleteContractTerm = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => contractTermsService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [TERMS_QUERY_KEY] });
        },
    });
};
