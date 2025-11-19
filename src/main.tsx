import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import App from "./App";

// Create a QueryClient instance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
            gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch if data exists
            refetchOnReconnect: false, // Don't refetch on reconnect
            retry: 1,
            retryDelay: 1000,
            networkMode: "online", // Skip offline checks
        },
        mutations: {
            retry: 0, // Don't retry mutations
            networkMode: "online",
        },
    },
});

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error("Root element not found");
}

// Optionally disable localStorage across the app so the client only uses the API.
// This clears existing localStorage and overrides storage methods to no-op.
// If you want to revert, remove or comment out this block.
try {
    if (typeof window !== "undefined" && window.localStorage) {
        // Clear any existing keys
        window.localStorage.clear();

        // Replace Storage prototype methods with no-ops to prevent further reads/writes
        // getItem returns null so callers behave as 'no value'
        // removeItem / setItem / clear become no-ops
        // Note: modifying Storage.prototype affects both localStorage and sessionStorage
        // and is reversible by reloading without this code.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Storage.prototype.getItem = function () {
            return null;
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Storage.prototype.setItem = function () {
            return undefined;
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Storage.prototype.removeItem = function () {
            return undefined;
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        Storage.prototype.clear = function () {
            return undefined;
        };
    }
} catch (err) {
    // If overriding storage fails, just warn and continue — app will continue using localStorage
    // which may not be desired; remove this block to re-enable storage behavior.
    // eslint-disable-next-line no-console
    console.warn("Could not disable localStorage:", err);
}

createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>,
);
