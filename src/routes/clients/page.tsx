import { useMemo, useState } from "react";
import { showAlert } from "@/utils/swal";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, Target, TrendingUp, Search, Download, RefreshCw, Sparkles, Layers3, UsersRound } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import ClientInfo from "./ClientInfo";
import { exportClientsToCSV } from "@/api";
import { useClients } from "@/hooks/queries";
import type { ClientFilterParams } from "@/api/requests/clientService";
import { useQueries } from "@tanstack/react-query";
import { getSegmentsByClientId } from "@/api/requests/segmentService";
import { getCompetitorsByClientId } from "@/api/requests/competitorsService";

const ClientsPage = () => {
    const navigate = useNavigate();
    const { t } = useLang();

    const normalizeId = (value: any): string => {
        if (!value) return "";
        if (typeof value === "string") return value;
        if (typeof value === "object") return String(value._id || value.id || "");
        return String(value);
    };

    // Use React Query for clients data
    const { data: clients = [], isLoading: loading, error, refetch } = useClients();

    const clientIds = useMemo(
        () => clients.map((client: any) => normalizeId(client?.id || client?._id)).filter(Boolean),
        [clients],
    );

    // Fetch segments and competitors per client directly on this page,
    // then map each result to a count for the client cards.
    const segmentsQueries = useQueries({
        queries: clientIds.map((clientId) => ({
            queryKey: ["client-page-segments", clientId],
            queryFn: () => getSegmentsByClientId(clientId),
            enabled: !!clientId,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
        })),
    });

    const competitorsQueries = useQueries({
        queries: clientIds.map((clientId) => ({
            queryKey: ["client-page-competitors", clientId],
            queryFn: () => getCompetitorsByClientId(clientId),
            enabled: !!clientId,
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
        })),
    });

    const segmentsCountByClient = useMemo(() => {
        const counts: Record<string, number> = {};
        clientIds.forEach((clientId, idx) => {
            const data = segmentsQueries[idx]?.data;
            counts[clientId] = Array.isArray(data) ? data.length : 0;
        });
        return counts;
    }, [clientIds, segmentsQueries]);

    const competitorsCountByClient = useMemo(() => {
        const counts: Record<string, number> = {};
        clientIds.forEach((clientId, idx) => {
            const data = competitorsQueries[idx]?.data;
            counts[clientId] = Array.isArray(data) ? data.length : 0;
        });
        return counts;
    }, [clientIds, competitorsQueries]);

  

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [exporting, setExporting] = useState<boolean>(false);

    const filteredClients = useMemo(() => {
        return clients.filter((client: any) => {
            const q = searchTerm.trim().toLowerCase();
            const name = (client?.business?.businessName || client?.personal?.fullName || "").toLowerCase();
            const category = (client?.business?.category || "").toLowerCase();

            const matchesSearch = !q || name.includes(q) || category.includes(q);
            return matchesSearch;
        });
    }, [clients, searchTerm]);

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
        // No need to refetch - React Query will handle this with proper query keys
        // Just prevent default form submission
    };

    const handleExportCSV = async () => {
        try {
            setExporting(true);
            const filters: ClientFilterParams = {};
            if (searchTerm) filters.search = searchTerm;

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
            showAlert("Failed to export clients. Please try again.", "error");
        } finally {
            setExporting(false);
        }
    };

    const handleRefresh = () => {
        refetch();
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="relative overflow-hidden rounded-[2rem] border border-light-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900 sm:p-8">
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-light-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secdark-700/10 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-light-200 bg-light-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-light-600 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-300">
                            <Sparkles size={13} />
                            Client Intelligence
                        </div>
                        <h1 className="title text-2xl sm:text-3xl">{t("clients_title")}</h1>
                        <p className="text-light-600 dark:text-dark-400 text-sm sm:text-base">{t("manage_your_client_database")}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleExportCSV}
                            disabled={exporting || clients.length === 0}
                            className="btn-secondary flex items-center gap-2"
                            title={t("export_csv") || "Export to CSV"}
                        >
                            <Download size={16} />
                            <span>{exporting ? t("exporting") || "Exporting..." : t("export") || "Export"}</span>
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
                            <span>{t("add_new_client")}</span>
                        </button>
                    </div>
                </div>

             
            </div>

            <div className="card rounded-[1.5rem]">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-3 lg:flex-row lg:items-center"
                >
                    <div className="relative flex-1">
                        <Search className="text-light-400 dark:text-dark-500 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t("search_clients") || "Search clients..."}
                            className="input w-full pl-10"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn-primary min-w-[170px]"
                    >
                        {t("apply_filters") || "Apply Filters"}
                    </button>
                </form>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="border-light-600 dark:border-dark-700 flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed text-center">
                    <div className="border-light-500 border-t-light-500 dark:border-light-500 dark:border-t-light-500 h-12 w-12 animate-spin rounded-full border-4"></div>
                    <p className="text-light-600 dark:text-dark-400">{t("loading_clients") || "Loading clients..."}</p>
                </div>
            ) : error ? (
                /* Error State */
                <div className="border-light-600 dark:border-dark-700 flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed text-center">
                    <p className="text-red-600 dark:text-red-400">{error.message || "Failed to load clients"}</p>
                    <button
                        onClick={() => refetch()}
                        className="btn-primary"
                    >
                        {t("retry") || "Retry"}
                    </button>
                </div>
            ) : filteredClients.length === 0 ? (
                /* No clients placeholder */
                <div className="border-light-200 dark:border-dark-700 flex min-h-[360px] flex-col items-center justify-center space-y-4 rounded-[1.5rem] border-2 border-dashed bg-white/50 text-center dark:bg-dark-900/40">
                    <Building2
                        size={64}
                        className="text-dark-400"
                    />
                    <p className="text-light-600 dark:text-dark-400 text-lg font-medium">
                        {clients.length === 0 ? t("no_clients_yet") : (t("no_clients_found") || "No clients found")}
                    </p>
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
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4">
                    {filteredClients.map((client, idx) => {
                        const clientId = String((client as any)?.id || (client as any)?._id || "");
                        return (
                        <div
                            key={client.id || idx}
                            className="group relative flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-[1.75rem] border border-light-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-dark-800 dark:bg-dark-900"
                        >
                            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-light-500/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70" />

                            {/* Top content */}
                            <div className="relative z-10 space-y-4">
                                <div className="flex justify-end">
                                    <Sparkles size={14} className="text-light-400 dark:text-dark-500" />
                                </div>

                                <ClientInfo
                                    client={client}
                                    compact
                                />

                                {/* Stats Section */}
                                <div className="border-light-100 dark:border-dark-800 grid grid-cols-3 gap-2 border-t pt-4 mb-3">
                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-secdark-700 dark:text-secdark-100 text-base font-black sm:text-lg">
                                            {segmentsCountByClient[clientId] || 0}
                                        </p>
                                        <p className="text-light-600 dark:text-dark-400 text-center text-[11px] whitespace-nowrap sm:text-xs">
                                            {t("segments_label")}
                                        </p>
                                    </div>

                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-base font-black text-orange-600 sm:text-lg dark:text-orange-400">
                                            {competitorsCountByClient[clientId] || 0}
                                        </p>
                                        <p className="text-light-600 dark:text-dark-400 text-center text-[11px] whitespace-nowrap sm:text-xs">
                                            {t("competitors_label")}
                                        </p>
                                    </div>
                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-base font-black text-green-600 sm:text-lg dark:text-green-400">
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
                            <div className="border-light-100 dark:border-dark-800 relative z-10 mt-auto flex min-w-0 flex-col gap-2 border-t pt-4 sm:flex-row">
                                <button
                                    onClick={() => handleViewClient(clientId)}
                                    className="btn-secondary flex min-w-0 flex-1 items-center justify-center gap-2 text-sm"
                                >
                                    <Target size={14} />
                                    {t("view_details")}
                                </button>

                                <button
                                    onClick={() => handleToPlanning(clientId)}
                                    className="btn-primary flex min-w-0 flex-1 items-center justify-center gap-2 text-sm"
                                >
                                    <TrendingUp size={14} />
                                    {t("plan_campaign")}
                                </button>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ClientsPage;
