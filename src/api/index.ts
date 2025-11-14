/**
 * API Services Index
 * Central export point for all API services
 */

export * from "./requests/clientService";
export { default as clientService } from "./requests/clientService";
export * from "./requests/segmentService";
export { default as segmentService } from "./requests/segmentService";
export { default as axiosInstance } from "./axios";
