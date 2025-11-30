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

try {
    // Intentionally left blank — do not override or clear localStorage so token persistence works
} catch (err) {}

createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>,
);
