import axiosInstance from "../axios";
import type { Segment } from "../interfaces/clientinterface";

/**
 * Segment API Service
 * Handles all segment-related API calls for market segments
 */

/**
 * Transform frontend segment data to backend payload format
 */
const transformSegmentToBackendPayload = (segmentData: any): any => {
    const payload: any = {};

    // Required field - name
    if (!segmentData.name || !segmentData.name.trim()) {
        throw new Error("Segment name is required");
    }
    payload.name = segmentData.name.trim();

    // Optional fields - only include if they have values
    if (segmentData.description && segmentData.description.trim()) {
        payload.description = segmentData.description.trim();
    }

    if (segmentData.ageRange && segmentData.ageRange.trim()) {
        payload.ageRange = segmentData.ageRange.trim();
    }

    // Gender - include if it's not the default "all" or if explicitly set
    const gender = segmentData.gender || "all";
    if (gender && gender !== "all") {
        payload.gender = gender;
    } else {
        payload.gender = "all";
    }

    // Handle interests - only include if array has items
    if (segmentData.interests) {
        let interestsArray: string[] = [];

        if (typeof segmentData.interests === "string" && segmentData.interests.trim()) {
            interestsArray = segmentData.interests
                .split(",")
                .map((i: string) => i.trim())
                .filter((i: string) => i.length > 0);
        } else if (Array.isArray(segmentData.interests) && segmentData.interests.length > 0) {
            interestsArray = segmentData.interests.filter((i: string) => i && i.trim());
        }

        if (interestsArray.length > 0) {
            payload.interests = interestsArray;
        }
    }

    // Income level - only include if set
    if (segmentData.incomeLevel) {
        payload.incomeLevel = segmentData.incomeLevel;
    }

    return payload;
};

/**
 * Transform backend segment data to frontend format
 */
const transformSegmentToFrontendFormat = (backendData: any): Segment | null => {
    if (!backendData) return null;

    return {
        _id: backendData._id,
        clientId: backendData.clientId,
        name: backendData.name,
        description: backendData.description,
        ageRange: backendData.ageRange,
        gender: backendData.gender || "all",
        interests: backendData.interests || [],
        incomeLevel: backendData.incomeLevel,
        deleted: backendData.deleted || false,
        createdAt: backendData.createdAt,
        updatedAt: backendData.updatedAt,
    };
};

/**
 * Get all segments for a specific client
 * GET /clients/:clientId/segments
 */
export const getSegmentsByClientId = async (clientId: string): Promise<Segment[]> => {
    try {
        const response = await axiosInstance.get(`/clients/${clientId}/segments`);

        // Handle different response structures
        let segmentsData = [];
        if (Array.isArray(response.data)) {
            segmentsData = response.data;
        } else if (Array.isArray(response.data.segments)) {
            segmentsData = response.data.segments;
        } else if (response.data.data && Array.isArray(response.data.data)) {
            segmentsData = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data.segments)) {
            segmentsData = response.data.data.segments;
        }

        const transformed = segmentsData.map(transformSegmentToFrontendFormat).filter(Boolean);
        return transformed;
    } catch (error) {
        throw error;
    }
};

/**
 * Create a new segment for a client
 * POST /clients/:clientId/segments
 */
export const createSegment = async (clientId: string, segmentData: any): Promise<Segment | null> => {
    try {
        const payload = transformSegmentToBackendPayload(segmentData);

        const response = await axiosInstance.post(`/clients/${clientId}/segments`, payload);

        const segment = response.data.segment || response.data;
        const transformed = transformSegmentToFrontendFormat(segment);
        // Invalidate per-client cache so client detail will reload fresh data
        try {
            // Use dynamic import to avoid circular import issues at module load time
            const { clearClientCache } = await import("./clientService");
            clearClientCache(clientId);
        } catch (err) {
            // ignore cache invalidation errors
        }
        return transformed;
    } catch (error) {
        throw error;
    }
};

/**
 * Update an existing segment
 * PUT /clients/:clientId/segments/:segmentId
 */
export const updateSegment = async (clientId: string, segmentId: string, segmentData: any): Promise<Segment | null> => {
    try {
        const payload = transformSegmentToBackendPayload(segmentData);

        const response = await axiosInstance.put(`/clients/${clientId}/segments/${segmentId}`, payload);

        const segment = response.data.segment || response.data;
        const transformed = transformSegmentToFrontendFormat(segment);
        try {
            const { clearClientCache } = await import("./clientService");
            clearClientCache(clientId);
        } catch (err) {}
        return transformed;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a segment (soft delete)
 * DELETE /clients/:clientId/segments/:segmentId
 */
export const deleteSegment = async (clientId: string, segmentId: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/clients/${clientId}/segments/${segmentId}`);
        try {
            const { clearClientCache } = await import("./clientService");
            clearClientCache(clientId);
        } catch (err) {}
    } catch (error) {
        throw error;
    }
};

// Export all functions as default object for easier importing
export default {
    getSegmentsByClientId,
    createSegment,
    updateSegment,
    deleteSegment,
};
