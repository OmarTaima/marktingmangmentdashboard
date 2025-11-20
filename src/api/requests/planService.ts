import axiosInstance from "../axios";

/**
 * Plan/Campaign API Service
 * Handles all campaign-related API calls
 */

const CAMPAIGNS_ENDPOINT = "/campaigns";

/**
 * Campaign/Plan data structure
 */
export interface CampaignObjective {
    name: string;
    description: string;
}

export interface CampaignStrategy {
    budget: number;
    timeline: string;
    description: string;
}

export interface Campaign {
    _id?: string;
    clientId: string;
    description: string;
    objectives: CampaignObjective[];
    strategy: CampaignStrategy;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCampaignPayload {
    clientId: string;
    description: string;
    objectives: CampaignObjective[];
    strategy: CampaignStrategy;
}

export interface UpdateCampaignPayload {
    clientId?: string;
    description?: string;
    objectives?: CampaignObjective[];
    strategy?: CampaignStrategy;
}

/**
 * Create a new campaign
 * POST /campaigns
 */
export const createCampaign = async (payload: CreateCampaignPayload): Promise<Campaign> => {
    const response = await axiosInstance.post(CAMPAIGNS_ENDPOINT, payload);
    return response.data;
};

/**
 * Get all campaigns
 * GET /campaigns
 */
export const getAllCampaigns = async (): Promise<Campaign[]> => {
    const response = await axiosInstance.get(CAMPAIGNS_ENDPOINT);
    return response.data;
};

/**
 * Get campaigns by client ID
 * GET /campaigns?clientId=:clientId
 */
export const getCampaignsByClientId = async (clientId: string): Promise<Campaign[]> => {
    const response = await axiosInstance.get(CAMPAIGNS_ENDPOINT, {
        params: { clientId },
    });
    return response.data;
};

/**
 * Update a campaign
 * PUT /campaigns/:campaignId
 */
export const updateCampaign = async (campaignId: string, payload: UpdateCampaignPayload): Promise<Campaign> => {
    const response = await axiosInstance.put(`${CAMPAIGNS_ENDPOINT}/${campaignId}`, payload);
    return response.data;
};

/**
 * Delete a campaign
 * DELETE /campaigns/:campaignId
 */
export const deleteCampaign = async (campaignId: string): Promise<void> => {
    await axiosInstance.delete(`${CAMPAIGNS_ENDPOINT}/${campaignId}`);
};

export default {
    createCampaign,
    getAllCampaigns,
    getCampaignsByClientId,
    updateCampaign,
    deleteCampaign,
};
