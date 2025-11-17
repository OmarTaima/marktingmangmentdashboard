import axiosInstance from "../axios";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

/**
 * Competitor API Service
 * Handles all competitor-related API calls
 */

export interface Competitor {
    _id?: string;
    clientId?: string;
    name: string;
    description?: string;
    swot_strengths?: string[];
    swot_weaknesses?: string[];
    swot_opportunities?: string[];
    swot_threats?: string[];
    socialLinks?: Array<{
        platform: string;
        url: string;
        _id?: string;
    }>;
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Transform frontend competitor data to backend payload format
 */
const transformCompetitorToBackendPayload = (competitorData: any): any => {
    const payload: any = {};

    // Required field - name
    if (!competitorData.name || !competitorData.name.trim()) {
        throw new Error("Competitor name is required");
    }
    payload.name = competitorData.name.trim();

    // Optional fields - only include if they have values
    if (competitorData.description && competitorData.description.trim()) {
        payload.description = competitorData.description.trim();
    }

    // SWOT arrays - accept multiple frontend shapes:
    // - nested `swot` object with arrays
    // - flat `swot_strengths`, `swot_weaknesses`, etc.
    const takeArray = (arr: any) => (Array.isArray(arr) ? arr.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean) : []);

    if (competitorData.swot && typeof competitorData.swot === "object") {
        const s = takeArray(competitorData.swot.strengths);
        const w = takeArray(competitorData.swot.weaknesses);
        const o = takeArray(competitorData.swot.opportunities);
        const t = takeArray(competitorData.swot.threats);

        if (s.length) payload.swot_strengths = s;
        if (w.length) payload.swot_weaknesses = w;
        if (o.length) payload.swot_opportunities = o;
        if (t.length) payload.swot_threats = t;
    } else {
        const s = takeArray(competitorData.swot_strengths || competitorData.swotStrengths);
        const w = takeArray(competitorData.swot_weaknesses || competitorData.swotWeaknesses);
        const o = takeArray(competitorData.swot_opportunities || competitorData.swotOpportunities);
        const t = takeArray(competitorData.swot_threats || competitorData.swotThreats);

        if (s.length) payload.swot_strengths = s;
        if (w.length) payload.swot_weaknesses = w;
        if (o.length) payload.swot_opportunities = o;
        if (t.length) payload.swot_threats = t;
    }

    // Social links - accept either
    // - an array in `socialLinks` (each with platform/url and optional _id)
    // - flat fields like website/facebook/instagram/twitter/tiktok
    const socialLinks: Array<{ platform: string; url: string; _id?: string }> = [];

    if (Array.isArray(competitorData.socialLinks)) {
        for (const link of competitorData.socialLinks) {
            if (!link) continue;
            const url = (link.url || link.value || "").toString().trim();
            const platform = (link.platform || link.name || "").toString().trim().toLowerCase();
            if (url) socialLinks.push({ platform: platform || "website", url });
        }
    }

    const pushFlat = (plat: string, val: any) => {
        if (val && typeof val === "string" && val.trim()) {
            const exists = socialLinks.find((s) => s.platform === plat);
            if (!exists) socialLinks.push({ platform: plat, url: val.trim() });
        }
    };

    pushFlat("website", competitorData.website);
    pushFlat("facebook", competitorData.facebook);
    pushFlat("instagram", competitorData.instagram);
    pushFlat("twitter", competitorData.twitter);
    pushFlat("tiktok", competitorData.tiktok);

    if (socialLinks.length > 0) payload.socialLinks = socialLinks;

    return payload;
};

/**
 * Transform backend competitor data to frontend format
 */
const transformCompetitorToFrontendFormat = (backendData: any): Competitor | null => {
    if (!backendData) return null;

    return {
        _id: backendData._id,
        clientId: backendData.clientId,
        name: backendData.name,
        description: backendData.description,
        swot_strengths: backendData.swot_strengths || [],
        swot_weaknesses: backendData.swot_weaknesses || [],
        swot_opportunities: backendData.swot_opportunities || [],
        swot_threats: backendData.swot_threats || [],
        socialLinks: backendData.socialLinks || [],
        deleted: backendData.deleted || false,
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
    };
};

/**
 * Get all competitors for a specific client
 * GET /clients/:clientId/competitors
 */
export const getCompetitorsByClientId = async (clientId: string): Promise<Competitor[]> => {
    return withCache(
        `/clients/${clientId}/competitors`,
        async () => {
            try {
                const response = await axiosInstance.get(`/clients/${clientId}/competitors`);

                // Handle different response structures
                let competitorsData = [];
                if (Array.isArray(response.data)) {
                    competitorsData = response.data;
                } else if (Array.isArray(response.data.competitors)) {
                    competitorsData = response.data.competitors;
                } else if (response.data.data && Array.isArray(response.data.data)) {
                    competitorsData = response.data.data;
                } else if (response.data.data && Array.isArray(response.data.data.competitors)) {
                    competitorsData = response.data.data.competitors;
                }

                const transformed = competitorsData.map(transformCompetitorToFrontendFormat).filter(Boolean);
                return transformed as Competitor[];
            } catch (error) {
                throw error;
            }
        }
    );
};

/**
 * Create a new competitor for a client
 * POST /clients/:clientId/competitors
 */
export const createCompetitor = async (clientId: string, competitorData: any): Promise<Competitor | null> => {
    try {
        const payload = transformCompetitorToBackendPayload(competitorData);

        const response = await axiosInstance.post(`/clients/${clientId}/competitors`, payload);

        const competitor = response.data.competitor || response.data;
        const transformed = transformCompetitorToFrontendFormat(competitor);

        // Invalidate competitors and client cache after creating
        invalidateCachePattern(`/clients/${clientId}/competitors`);
        invalidateCachePattern(`/clients/${clientId}`);

        return transformed;
    } catch (error) {
        throw error;
    }
};

/**
 * Update an existing competitor
 * PUT /clients/:clientId/competitors/:competitorId
 */
export const updateCompetitor = async (clientId: string, competitorId: string, competitorData: any): Promise<Competitor | null> => {
    try {
        const payload = transformCompetitorToBackendPayload(competitorData);

        const response = await axiosInstance.put(`/clients/${clientId}/competitors/${competitorId}`, payload);

        const competitor = response.data.competitor || response.data;
        const transformed = transformCompetitorToFrontendFormat(competitor);

        // Invalidate competitors and client cache after updating
        invalidateCachePattern(`/clients/${clientId}/competitors`);
        invalidateCachePattern(`/clients/${clientId}`);

        return transformed;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a competitor (soft delete)
 * DELETE /clients/:clientId/competitors/:competitorId
 */
export const deleteCompetitor = async (clientId: string, competitorId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/clients/${clientId}/competitors/${competitorId}`);
        // Invalidate competitors and client cache after deleting
        invalidateCachePattern(`/clients/${clientId}/competitors`);
        invalidateCachePattern(`/clients/${clientId}`);
    } catch (error) {
        throw error;
    }
};

// Export all functions as default object for easier importing
export default {
    getCompetitorsByClientId,
    createCompetitor,
    updateCompetitor,
    deleteCompetitor,
};
