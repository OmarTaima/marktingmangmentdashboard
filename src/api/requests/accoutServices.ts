import axiosInstance from "../axios";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

export interface Account {
    _id?: string;
    clientId?: string;
    client?: string;
    platformName?: string;
    userName?: string;
    password?: string;
    twoFactorMethod?: "mail" | "phone" | "non";
    mail?: string;
    phoneOwnerName?: string;
    phoneNumber?: string;
    note?: string;
    mailPassword?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TwoFactor {
    method?: "email" | "mobile";
    username?: string;
    mobile?: string;
    password?: string;
    holderName?: string;
}

export interface CreateAccountPayload {
    platform?: string;
    username?: string;
    password?: string;
    twoFactor?: TwoFactor;
    note?: string;
}

const transformAccountToBackendPayload = (accountData: any): CreateAccountPayload => {
    const payload: CreateAccountPayload = {};

    if (!accountData) return payload;

    if (accountData.platformName && typeof accountData.platformName === "string" && accountData.platformName.trim()) {
        payload.platform = accountData.platformName.trim();
    }

    if (accountData.userName && typeof accountData.userName === "string" && accountData.userName.trim()) {
        payload.username = accountData.userName.trim();
    }

    if (accountData.password && typeof accountData.password === "string" && accountData.password.trim()) {
        payload.password = accountData.password.trim();
    }

    if (accountData.twoFactorMethod && accountData.twoFactorMethod !== "non") {
        const twoFactor: TwoFactor = {};
        
        if (accountData.twoFactorMethod === "mail") {
            twoFactor.method = "email";
            if (accountData.mail && typeof accountData.mail === "string" && accountData.mail.trim()) {
                twoFactor.username = accountData.mail.trim();
            }
            if (accountData.mailPassword && typeof accountData.mailPassword === "string" && accountData.mailPassword.trim()) {
                twoFactor.password = accountData.mailPassword.trim();
            }
        } else if (accountData.twoFactorMethod === "phone") {
            twoFactor.method = "mobile";
            if (accountData.phoneNumber && typeof accountData.phoneNumber === "string" && accountData.phoneNumber.trim()) {
                // Backend schema expects `mobile` for phone numbers
                twoFactor.mobile = accountData.phoneNumber.trim();
            }
            if (accountData.phoneOwnerName && typeof accountData.phoneOwnerName === "string" && accountData.phoneOwnerName.trim()) {
                twoFactor.holderName = accountData.phoneOwnerName.trim();
            }
        }
        
        if (Object.keys(twoFactor).length > 0) {
            payload.twoFactor = twoFactor;
        }
    }

    if (accountData.note && typeof accountData.note === "string" && accountData.note.trim()) {
        payload.note = accountData.note.trim();
    }

    return payload;
};

const transformAccountToFrontend = (backendData: any): Account | null => {
    if (!backendData) return null;
    
    const two = backendData.twoFactor || backendData.twoFactorMethod || undefined;
    let twoFactorMethod: "mail" | "phone" | "non" = "non";
    let mail: string | undefined;
    let mailPassword: string | undefined;
    let phoneOwnerName: string | undefined;
    let phoneNumber: string | undefined;

    if (two && typeof two === "object") {
        if (two.method === "email") {
            twoFactorMethod = "mail";
            mail = two.username || undefined;
            mailPassword = two.password || undefined;
        } else if (two.method === "mobile") {
            twoFactorMethod = "phone";
            phoneOwnerName = two.holderName || undefined;
            // Backend may return the phone under `mobile` or `username` depending on API version
            phoneNumber = two.mobile || two.username || undefined;
        }
    }

    return {
        _id: backendData._id || backendData.id,
        clientId: backendData.clientId || backendData.client?._id || backendData.client?.id,
        client: backendData.client,
        platformName: backendData.platform || backendData.platformName || "",
        userName: backendData.username || "",
        password: backendData.password || "",
        twoFactorMethod,
        mail,
        mailPassword,
        phoneOwnerName,
        phoneNumber,
        note: backendData.note || "",
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
    };
};

export const getAccountsByClientId = async (clientId: string): Promise<Account[]> => {
    return withCache(`/clients/${clientId}/accounts`, async () => {
        try {
            const res = await axiosInstance.get(`/clients/${clientId}/accounts?PageCount=all`);
            let data: any[] = [];
            if (Array.isArray(res.data)) data = res.data;
            else if (Array.isArray(res.data.data)) data = res.data.data;
            else if (Array.isArray(res.data.accounts)) data = res.data.accounts;

            return data.map(transformAccountToFrontend).filter(Boolean) as Account[];
        } catch (err) {
            throw err;
        }
    });
};

export const createAccount = async (clientId: string, accountData: any): Promise<Account | null> => {
    try {
        const payload = transformAccountToBackendPayload(accountData);
        const res = await axiosInstance.post(`/clients/${clientId}/accounts`, payload);
        const account = res.data.data || res.data.account || res.data;

        // Invalidate accounts cache after creating
        invalidateCachePattern(`/clients/${clientId}/accounts`);
        invalidateCachePattern(`/clients/${clientId}`);

        return transformAccountToFrontend(account);
    } catch (err) {
        throw err;
    }
};

export const createMultipleAccounts = async (clientId: string, accountsData: any[]): Promise<Account[]> => {
    try {
        // Transform all accounts to backend payload format
        const payloads = accountsData.map((accountData) => ({
            ...transformAccountToBackendPayload(accountData),
            clientId,
        }));

        // Send bulk request to create all accounts at once
        const res = await axiosInstance.post(`/clients/${clientId}/accounts/bulk`, payloads);

        // Handle different response structures
        let accountsArray = [];
        if (Array.isArray(res.data)) {
            accountsArray = res.data;
        } else if (Array.isArray(res.data.accounts)) {
            accountsArray = res.data.accounts;
        } else if (res.data.data && Array.isArray(res.data.data)) {
            accountsArray = res.data.data;
        }

        const accounts = accountsArray.map(transformAccountToFrontend).filter(Boolean) as Account[];

        // Invalidate accounts cache after creating all
        invalidateCachePattern(`/clients/${clientId}/accounts`);
        invalidateCachePattern(`/clients/${clientId}`);

        return accounts;
    } catch (err) {
        throw err;
    }
};

export const updateAccount = async (clientId: string, accountId: string, accountData: any): Promise<Account | null> => {
    try {
        const payload = transformAccountToBackendPayload(accountData);
        const res = await axiosInstance.put(`/clients/${clientId}/accounts/${accountId}`, payload);
        const account = res.data.data || res.data.account || res.data;

        // Invalidate accounts cache after updating
        invalidateCachePattern(`/clients/${clientId}/accounts`);
        invalidateCachePattern(`/clients/${clientId}`);

        return transformAccountToFrontend(account);
    } catch (err) {
        throw err;
    }
};

export const deleteAccount = async (clientId: string, accountId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/clients/${clientId}/accounts/${accountId}`);
        // Invalidate accounts cache after deleting
        invalidateCachePattern(`/clients/${clientId}/accounts`);
        invalidateCachePattern(`/clients/${clientId}`);
    } catch (err) {
        throw err;
    }
};

export default {
    getAccountsByClientId,
    createAccount,
    createMultipleAccounts,
    updateAccount,
    deleteAccount,
};