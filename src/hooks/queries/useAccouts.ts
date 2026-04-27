// hooks/queries/useAccounts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getAccountsByClientId,
    createAccount,
    createMultipleAccounts,
    updateAccount,
    deleteAccount,
    type Account,
} from "@/api/requests/accoutServices";
import Swal from "sweetalert2";

// Query keys for cache management
export const accountsKeys = {
    all: ['accounts'] as const,
    lists: () => [...accountsKeys.all, 'list'] as const,
    // clientId is optional; use 'all' to represent the aggregated list
    list: (clientId?: string) => [...accountsKeys.lists(), clientId || 'all'] as const,
    details: () => [...accountsKeys.all, 'detail'] as const,
    detail: (id: string) => [...accountsKeys.details(), id] as const,
};

// Hook to fetch accounts by client ID (you need to pass a clientId)
export function useAccountsByClient(clientId: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: accountsKeys.list(clientId),
        queryFn: async () => {
            if (!clientId) return [];
            return await getAccountsByClientId(clientId);
        },
        enabled: !!clientId && (options?.enabled ?? true),
    });
}

// Hook to fetch all accounts across multiple clients
export function useAllAccounts(clientIds: string[]) {
    return useQuery({
        queryKey: accountsKeys.list('all'),
        queryFn: async () => {
            if (!clientIds.length) return [];

            const promises = clientIds.map(async (clientId) => {
                try {
                    const accounts = await getAccountsByClientId(clientId);
                    // Ensure each account includes a clientId (backend may omit it)
                    return accounts.map((a: any) => ({ ...(a || {}), clientId: a?.clientId || clientId }));
                } catch (error) {
                    console.error(`Error fetching accounts for client ${clientId}:`, error);
                    return [];
                }
            });

            const results = await Promise.all(promises);
            return results.flat();
        },
        enabled: clientIds.length > 0,
    });
}

// Hook to create a single account
export function useCreateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, accountData }: { clientId: string; accountData: Partial<Account> }) =>
            createAccount(clientId, accountData),
        onMutate: async ({ clientId, accountData }) => {
            await queryClient.cancelQueries({ queryKey: accountsKeys.list(clientId) });
            await queryClient.cancelQueries({ queryKey: accountsKeys.list('all') });

            const previousClientList = queryClient.getQueryData(accountsKeys.list(clientId));
            const previousAllList = queryClient.getQueryData(accountsKeys.list('all'));

            const tempId = `temp-${Date.now()}`;
            const optimisticAccount: any = {
                _id: tempId,
                clientId,
                platformName: accountData.platformName || (accountData as any).platform || '',
                userName: accountData.userName || (accountData as any).username || '',
                password: accountData.password || '',
                twoFactorMethod: accountData.twoFactorMethod || (accountData as any).twoFactorMethod || 'non',
                mail: (accountData as any).mail || undefined,
                mailPassword: (accountData as any).mailPassword || undefined,
                phoneOwnerName: (accountData as any).phoneOwnerName || undefined,
                phoneNumber: (accountData as any).phoneNumber || undefined,
                note: accountData.note || '',
                createdAt: new Date().toISOString(),
            };

            queryClient.setQueryData(accountsKeys.list(clientId), (old: any) => {
                if (!old) return [optimisticAccount];
                if (Array.isArray(old)) return [optimisticAccount, ...old];
                if (old.data) return { ...old, data: [optimisticAccount, ...old.data] };
                return old;
            });

            queryClient.setQueryData(accountsKeys.list('all'), (old: any) => {
                if (!old) return [optimisticAccount];
                if (Array.isArray(old)) return [optimisticAccount, ...old];
                if (old.data) return { ...old, data: [optimisticAccount, ...old.data] };
                return old;
            });

            return { previousClientList, previousAllList, tempId };
        },
        onError: (err: any, variables, context: any) => {
            if (context?.previousClientList) {
                queryClient.setQueryData(accountsKeys.list(variables.clientId), context.previousClientList);
            }
            if (context?.previousAllList) {
                queryClient.setQueryData(accountsKeys.list('all'), context.previousAllList);
            }
            Swal.fire({ title: 'Error', text: err?.message || 'Failed to create account', icon: 'error' });
        },
        onSuccess: (data, variables, context: any) => {
            const created = data as Account | null;

            // Replace optimistic entry with server response
            if (created) {
                queryClient.setQueryData(accountsKeys.list(variables.clientId), (old: any) => {
                    if (!old) return [created];
                    if (Array.isArray(old)) return old.map((a: any) => (a._id === context?.tempId ? created : a));
                    if (old.data) return { ...old, data: old.data.map((a: any) => (a._id === context?.tempId ? created : a)) };
                    return old;
                });

                queryClient.setQueryData(accountsKeys.list('all'), (old: any) => {
                    if (!old) return [created];
                    if (Array.isArray(old)) return old.map((a: any) => (a._id === context?.tempId ? created : a));
                    if (old.data) return { ...old, data: old.data.map((a: any) => (a._id === context?.tempId ? created : a)) };
                    return old;
                });
            }

            queryClient.invalidateQueries({ queryKey: ['clients', variables.clientId] });

            Swal.fire({
                title: 'Success',
                text: 'Account created successfully',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            });
        },
    });
}

// Hook to create multiple accounts (bulk)
export function useCreateMultipleAccounts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, accountsData }: { clientId: string; accountsData: Partial<Account>[] }) =>
            createMultipleAccounts(clientId, accountsData),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: accountsKeys.list(variables.clientId) });
            queryClient.invalidateQueries({ queryKey: ['clients', variables.clientId] });
            
            Swal.fire({
                title: "Success",
                text: `${variables.accountsData.length} account(s) created successfully`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false,
            });
        },
        onError: (error: any) => {
            Swal.fire({
                title: "Error",
                text: error.message || "Failed to create accounts",
                icon: "error",
            });
        },
    });
}

// Hook to update an account
export function useUpdateAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, accountId, accountData }: { clientId: string; accountId: string; accountData: Partial<Account> }) =>
            updateAccount(clientId, accountId, accountData),
        onMutate: async ({ clientId, accountId, accountData }) => {
            await queryClient.cancelQueries({ queryKey: accountsKeys.list(clientId) });
            await queryClient.cancelQueries({ queryKey: accountsKeys.list('all') });
            await queryClient.cancelQueries({ queryKey: accountsKeys.detail(accountId) });

            const previousClientList = queryClient.getQueryData(accountsKeys.list(clientId));
            const previousAllList = queryClient.getQueryData(accountsKeys.list('all'));
            const previousDetail = queryClient.getQueryData(accountsKeys.detail(accountId));

            const applyUpdate = (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) return old.map((a: any) => (a._id === accountId ? { ...a, ...accountData } : a));
                if (old.data && Array.isArray(old.data)) return { ...old, data: old.data.map((a: any) => (a._id === accountId ? { ...a, ...accountData } : a)) };
                return old;
            };

            queryClient.setQueryData(accountsKeys.list(clientId), (old: any) => applyUpdate(old));
            queryClient.setQueryData(accountsKeys.list('all'), (old: any) => applyUpdate(old));
            queryClient.setQueryData(accountsKeys.detail(accountId), (old: any) => (old ? { ...old, ...accountData } : old));

            return { previousClientList, previousAllList, previousDetail };
        },
        onError: (_err: any, variables, context: any) => {
            if (context?.previousClientList) {
                queryClient.setQueryData(accountsKeys.list(variables.clientId), context.previousClientList);
            }
            if (context?.previousAllList) {
                queryClient.setQueryData(accountsKeys.list('all'), context.previousAllList);
            }
            if (context?.previousDetail) {
                queryClient.setQueryData(accountsKeys.detail(variables.accountId), context.previousDetail);
            }
            Swal.fire({
                title: "Error",
                text: _err?.message || "Failed to update account",
                icon: "error",
            });
        },
        onSuccess: (data, variables) => {
            // Replace optimistic data with server response (if any) and invalidate to ensure consistency
            if (data) {
                const updated = data as Account | null;
                queryClient.setQueryData(accountsKeys.detail(variables.accountId), updated);

                const applyReplace = (old: any) => {
                    if (!old) return old;
                    if (Array.isArray(old)) return old.map((a: any) => (a._id === variables.accountId ? updated || { ...a, ...variables.accountData } : a));
                    if (old.data && Array.isArray(old.data)) return { ...old, data: old.data.map((a: any) => (a._id === variables.accountId ? updated || { ...a, ...variables.accountData } : a)) };
                    return old;
                };

                queryClient.setQueryData(accountsKeys.list(variables.clientId), (old: any) => applyReplace(old));
                queryClient.setQueryData(accountsKeys.list('all'), (old: any) => applyReplace(old));
            }

            queryClient.invalidateQueries({ queryKey: ['clients', variables.clientId] });

            Swal.fire({
                title: "Success",
                text: "Account updated successfully",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
        },
    });
}

// Hook to delete an account
export function useDeleteAccount() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ clientId, accountId }: { clientId: string; accountId: string }) =>
            deleteAccount(clientId, accountId),
        onMutate: async ({ clientId, accountId }) => {
            await queryClient.cancelQueries({ queryKey: accountsKeys.list(clientId) });
            await queryClient.cancelQueries({ queryKey: accountsKeys.list('all') });
            await queryClient.cancelQueries({ queryKey: accountsKeys.detail(accountId) });

            const previousClientList = queryClient.getQueryData(accountsKeys.list(clientId));
            const previousAllList = queryClient.getQueryData(accountsKeys.list('all'));
            const previousDetail = queryClient.getQueryData(accountsKeys.detail(accountId));

            const applyRemove = (old: any) => {
                if (!old) return old;
                if (Array.isArray(old)) return old.filter((a: any) => a._id !== accountId);
                if (old.data && Array.isArray(old.data)) return { ...old, data: old.data.filter((a: any) => a._id !== accountId) };
                return old;
            };

            queryClient.setQueryData(accountsKeys.list(clientId), (old: any) => applyRemove(old));
            queryClient.setQueryData(accountsKeys.list('all'), (old: any) => applyRemove(old));
            queryClient.setQueryData(accountsKeys.detail(accountId), () => undefined);

            return { previousClientList, previousAllList, previousDetail };
        },
        onError: (_err: any, variables, context: any) => {
            if (context?.previousClientList) {
                queryClient.setQueryData(accountsKeys.list(variables.clientId), context.previousClientList);
            }
            if (context?.previousAllList) {
                queryClient.setQueryData(accountsKeys.list('all'), context.previousAllList);
            }
            if (context?.previousDetail) {
                queryClient.setQueryData(accountsKeys.detail(variables.accountId), context.previousDetail);
            }
            Swal.fire({ title: "Error", text: _err?.message || "Failed to delete account", icon: "error" });
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clients', variables.clientId] });
            queryClient.invalidateQueries({ queryKey: accountsKeys.list(variables.clientId) });
            queryClient.invalidateQueries({ queryKey: accountsKeys.list('all') });

            Swal.fire({
                title: "Deleted",
                text: "Account deleted successfully",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });
        },
    });
}

// Combined hook for all accounts operations
export default {
    useAccountsByClient,
    useCreateAccount,
    useCreateMultipleAccounts,
    useUpdateAccount,
    useDeleteAccount,
    accountsKeys,
};