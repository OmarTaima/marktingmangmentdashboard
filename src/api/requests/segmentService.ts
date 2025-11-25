import axiosInstance from "../axios";
import type { Segment } from "../interfaces/clientinterface";
import { withCache, invalidateCachePattern } from "../../utils/apiCache";

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

    // ageRange: accept array or single string
    if (segmentData.ageRange) {
        if (Array.isArray(segmentData.ageRange)) {
            const arr = segmentData.ageRange.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
            if (arr.length > 0) payload.ageRange = arr;
        } else if (typeof segmentData.ageRange === "string" && segmentData.ageRange.trim()) {
            payload.ageRange = [segmentData.ageRange.trim()];
        }
    }

    // Gender: accept array or single value. Backend expects array (default ['all']).
    if (segmentData.gender) {
        if (Array.isArray(segmentData.gender)) {
            const g = segmentData.gender.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
            if (g.length > 0) payload.gender = g;
        } else if (typeof segmentData.gender === "string" && segmentData.gender.trim()) {
            payload.gender = [segmentData.gender.trim()];
        }
    } else {
        payload.gender = ["all"];
    }

    // interests removed — we no longer send `interests` from the frontend

    // area and governorate - accept arrays or comma-separated strings
    if (segmentData.area) {
        if (Array.isArray(segmentData.area)) {
            const arr = segmentData.area.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
            if (arr.length > 0) payload.area = arr;
        } else if (typeof segmentData.area === "string" && segmentData.area.trim()) {
            payload.area = segmentData.area
                .split(/[,;\n]+/)
                .map((s: string) => s.trim())
                .filter(Boolean);
        }
    }

    if (segmentData.governorate) {
        if (Array.isArray(segmentData.governorate)) {
            const arr = segmentData.governorate.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
            if (arr.length > 0) payload.governorate = arr;
        } else if (typeof segmentData.governorate === "string" && segmentData.governorate.trim()) {
            payload.governorate = segmentData.governorate
                .split(/[,;\n]+/)
                .map((s: string) => s.trim())
                .filter(Boolean);
        }
    }

    // note
    if (segmentData.note && typeof segmentData.note === "string" && segmentData.note.trim()) {
        payload.note = segmentData.note.trim();
    }

    // productName: optional string
    if (segmentData.productName && typeof segmentData.productName === "string" && segmentData.productName.trim()) {
        payload.productName = segmentData.productName.trim();
    }

    // incomeLevel removed — do not include it in payloads

    return payload;
};

/**
 * Transform backend segment data to frontend format
 */
const transformSegmentToFrontendFormat = (backendData: any): any => {
    if (!backendData) return null;

    return {
        _id: backendData._id,
        clientId: backendData.clientId,
        name: backendData.name,
        description: backendData.description,
        ageRange: backendData.ageRange,
        gender: backendData.gender || "all",
        area: backendData.area || [],
        governorate: backendData.governorate || [],
        productName: backendData.productName,
        note: backendData.note,
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
    return withCache(`/clients/${clientId}/segments`, async () => {
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
    });
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
        // Invalidate segments and client cache after creating
        invalidateCachePattern(`/clients/${clientId}/segments`);
        invalidateCachePattern(`/clients/${clientId}`);
        return transformed;
    } catch (error) {
        throw error;
    }
};

export const createSegments = async (clientId: string, segmentsData: any[]): Promise<Segment[]> => {
    try {
        // Transform all segments to backend payload format
        const payloads = segmentsData.map((segmentData) => transformSegmentToBackendPayload(segmentData));

        // Send bulk request to create all segments at once
        const response = await axiosInstance.post(`/clients/${clientId}/segments/bulk`, payloads);

        // Handle different response structures
        let segmentsArray = [];
        if (Array.isArray(response.data)) {
            segmentsArray = response.data;
        } else if (Array.isArray(response.data.segments)) {
            segmentsArray = response.data.segments;
        } else if (response.data.data && Array.isArray(response.data.data)) {
            segmentsArray = response.data.data;
        }

        const segments = segmentsArray.map(transformSegmentToFrontendFormat).filter(Boolean) as Segment[];

        // Invalidate segments and client cache after creating all
        invalidateCachePattern(`/clients/${clientId}/segments`);
        invalidateCachePattern(`/clients/${clientId}`);

        return segments;
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
        // Invalidate segments and client cache after updating
        invalidateCachePattern(`/clients/${clientId}/segments`);
        invalidateCachePattern(`/clients/${clientId}`);
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
        // Invalidate segments and client cache after deleting
        invalidateCachePattern(`/clients/${clientId}/segments`);
        invalidateCachePattern(`/clients/${clientId}`);
    } catch (error) {
        throw error;
    }
};

// Export all functions as default object for easier importing
export default {
    getSegmentsByClientId,
    createSegment,
    createSegments,
    updateSegment,
    deleteSegment,
};
