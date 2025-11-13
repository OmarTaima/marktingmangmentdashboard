import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, Target, TrendingUp } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import ClientInfo from "./ClientInfo";
import { getClients } from "@/api";
import type { Client } from "@/api/interfaces/clientinterface";

const ClientsPage = () => {
    const navigate = useNavigate();
    const { t } = useLang();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const abortController = new AbortController();

        loadClients(abortController.signal);

        // Cleanup function to abort request on unmount
        return () => {
            abortController.abort();
        };
    }, []);

    const loadClients = async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getClients();

            // Only update state if component is still mounted
            if (!signal?.aborted) {
                setClients(data as Client[]);
            }
        } catch (err) {
            const e = err as any;
            if (e?.name === "AbortError" || e?.name === "CanceledError") {
                console.log("Request cancelled");
                return;
            }
            console.error("Error loading clients:", e);
            if (!signal?.aborted) {
                setError("Failed to load clients. Please try again.");
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const handleAddNewClient = () => {
        navigate("/onboarding");
    };

    const handleViewClient = (clientId?: string) => {
        if (!clientId) return;
        navigate(`/clients/${clientId}`);
    };

    const handleToPlanning = (_clientId?: string) => {
        navigate(`/strategies`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="title">{t("clients_title")}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("manage_your_client_database")}</p>
                </div>
                <button
                    onClick={handleAddNewClient}
                    className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
                >
                    <Plus size={16} />
                    {t("add_new_client")}
                </button>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="border-light-600 dark:border-dark-700 flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed text-center">
                    <div className="border-light-300 border-t-light-600 dark:border-dark-700 dark:border-t-dark-400 h-12 w-12 animate-spin rounded-full border-4"></div>
                    <p className="text-light-600 dark:text-dark-400">{t("loading_clients") || "Loading clients..."}</p>
                </div>
            ) : error ? (
                /* Error State */
                <div className="border-light-600 dark:border-dark-700 flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={() => loadClients()}
                        className="btn-primary"
                    >
                        {t("retry") || "Retry"}
                    </button>
                </div>
            ) : clients.length === 0 ? (
                /* No clients placeholder */
                <div className="border-light-600 dark:border-dark-700 flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed text-center">
                    <Building2
                        size={64}
                        className="text-dark-400"
                    />
                    <p className="text-light-600 dark:text-dark-400 text-lg font-medium">{t("no_clients_yet")}</p>
                    <p className="text-dark-500 dark:text-dark-400 text-sm">{t("get_started_add_first")}</p>
                    <button
                        onClick={handleAddNewClient}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        {t("add_your_first_client")}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {clients.map((client, idx) => (
                        <div
                            key={client.id || idx}
                            className="card flex h-full min-w-0 flex-col justify-between transition-colors duration-300 hover:shadow-lg"
                        >
                            {/* Top content */}
                            <div className="space-y-4">
                                <ClientInfo
                                    client={client}
                                    compact
                                />

                                {/* Stats Section */}
                                <div className="border-dark-200 dark:border-dark-700 flex flex-wrap justify-center gap-3 border-t pt-3">
                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-secdark-700 dark:text-secdark-100 text-base font-bold sm:text-lg">
                                            {client.segments?.length || 0}
                                        </p>
                                        <p className="text-light-600 dark:text-dark-400 text-center text-[11px] whitespace-nowrap sm:text-xs">
                                            {t("segments_label")}
                                        </p>
                                    </div>

                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-base font-bold text-orange-600 sm:text-lg dark:text-orange-400">
                                            {client.competitors?.length || 0}
                                        </p>
                                        <p className="text-light-600 dark:text-dark-400 text-center text-[11px] whitespace-nowrap sm:text-xs">
                                            {t("competitors_label")}
                                        </p>
                                    </div>

                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-base font-bold text-green-600 sm:text-lg dark:text-green-400">
                                            {(client.swot?.strengths?.length || 0) +
                                                (client.swot?.weaknesses?.length || 0) +
                                                (client.swot?.opportunities?.length || 0) +
                                                (client.swot?.threats?.length || 0)}
                                        </p>
                                        <p className="text-light-600 dark:text-dark-400 text-center text-[11px] whitespace-nowrap sm:text-xs">
                                            {t("swot_items")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons (Always stay inside) */}
                            <div className="border-dark-200 dark:border-dark-700 mt-auto flex min-w-0 flex-col gap-2 border-t pt-3 sm:flex-row">
                                <button
                                    onClick={() => handleViewClient(client.id)}
                                    className="btn-ghost flex min-w-0 flex-1 items-center justify-center gap-2 text-sm"
                                >
                                    <Target size={14} />
                                    {t("view_details")}
                                </button>

                                <button
                                    onClick={() => handleToPlanning(client.id)}
                                    className="btn-primary flex min-w-0 flex-1 items-center justify-center gap-2 text-sm"
                                >
                                    <TrendingUp size={14} />
                                    {t("plan_campaign")}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientsPage;
