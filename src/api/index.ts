/**
 * API Services Index
 * Central export point for all API services
 */

export * from "./requests/clientService";
export { default as clientService } from "./requests/clientService";
export * from "./requests/segmentService";
export { default as segmentService } from "./requests/segmentService";
export * from "./requests/competitorsService";
export { default as competitorsService } from "./requests/competitorsService";
export * from "./requests/branchesService";
export { default as branchesService } from "./requests/branchesService";
export * from "./requests/servicesService";
export * from "./requests/itemsService";
export * from "./requests/packagesService";
export * from "./requests/contractsService";
export * from "./requests/quotationsService";
export { default as axiosInstance } from "./axios";

// Export cache utilities for manual cache management
export { apiCache, withCache, invalidateCache, invalidateCachePattern, clearAllCache } from "../utils/apiCache";
