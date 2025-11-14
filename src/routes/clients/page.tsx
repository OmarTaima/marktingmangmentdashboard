import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, Target, TrendingUp, Search, Download, RefreshCw } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import ClientInfo from "./ClientInfo";
import { getClientsCached, getClientsWithFilters, exportClientsToCSV } from "@/api";
import type { Client } from "@/api/interfaces/clientinterface";
import type { ClientFilterParams } from "@/api/requests/clientService";

const ClientsPage = () => {
    const navigate = useNavigate();
    const { t } = useLang();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [exporting, setExporting] = useState<boolean>(false);

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
            // Use cached loader so clients aren't refetched when navigating back
            const data = await getClientsCached();

            // Only update state if component is still mounted
            if (!signal?.aborted) {
                setClients(data as Client[]);
            }
        } catch (err) {
            const e = err as any;
            if (e?.name === "AbortError" || e?.name === "CanceledError") {
                return;
            }
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

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadClients();
    };

    const handleExportCSV = async () => {
        try {
            setExporting(true);
            const filters: ClientFilterParams = {};
            if (searchTerm) filters.search = searchTerm;
            if (statusFilter !== "all") filters.status = statusFilter as any;

            const blob = await exportClientsToCSV(filters);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `clients-export-${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
            alert("Failed to export clients. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    const handleRefresh = () => {
        loadClients();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="title">{t("clients_title")}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("manage_your_client_database")}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCSV}
                        disabled={exporting || clients.length === 0}
                        className="btn-ghost flex items-center gap-2"
                        title={t("export_csv") || "Export to CSV"}
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">{exporting ? t("exporting") || "Exporting..." : t("export") || "Export"}</span>
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="btn-ghost flex items-center gap-2"
                        title={t("refresh") || "Refresh"}
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={handleAddNewClient}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        <span className="hidden sm:inline">{t("add_new_client")}</span>
                    </button>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="card">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                    <div className="relative flex-1">
                        <Search className="text-light-400 dark:text-dark-500 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t("search_clients") || "Search clients..."}
                            className="border-light-300 bg-light-50 text-light-900 placeholder-light-400 focus:border-light-500 focus:ring-light-200 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:placeholder-dark-500 dark:focus:border-dark-600 dark:focus:ring-dark-700 w-full rounded-lg border py-2 pr-4 pl-10 text-sm focus:ring-2"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border-light-300 bg-light-50 text-light-900 focus:border-light-500 focus:ring-light-200 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:focus:border-dark-600 dark:focus:ring-dark-700 rounded-lg border px-4 py-2 text-sm focus:ring-2"
                    >
                        <option value="all">{t("all_statuses") || "All Statuses"}</option>
                        <option value="active">{t("active") || "Active"}</option>
                        <option value="inactive">{t("inactive") || "Inactive"}</option>
                        <option value="pending">{t("pending") || "Pending"}</option>
                    </select>
                    <button
                        type="submit"
                        className="btn-primary whitespace-nowrap"
                    >
                        {t("apply_filters") || "Apply Filters"}
                    </button>
                </form>
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
