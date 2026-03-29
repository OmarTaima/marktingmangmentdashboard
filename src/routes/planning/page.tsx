import { useState, useEffect } from "react";
import { Plus, Loader2, Eye } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useClients } from "@/hooks/queries/useClientsQuery";
import { useCampaignsByClient, useAllCampaigns } from "@/hooks/queries/usePlansQuery";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";

const PlanningPage: React.FC = () => {
    const { t } = useLang();
    const tr = (key: string, fallback: string) => {
        const value = t(key);
        return !value || value === key ? fallback : value;
    };
    const [selectedClientId, setSelectedClientId] = useState<string>(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: _campaigns = [], isLoading: campaignsLoading } = useCampaignsByClient(selectedClientId, !!selectedClientId);
    const { data: allCampaigns = [] } = useAllCampaigns();
    const fetching = useIsFetching();
    const mutating = useIsMutating();
    const globalLoading = (fetching || mutating) > 0;
    const [isTransitioning] = useState<boolean>(false);
    const [entryLoading, setEntryLoading] = useState<boolean>(true);
    const navigate = useNavigate();
    const location = useLocation();
    const navState: any = (location && (location as any).state) || {};

    // If navigated here with a clientId in state (e.g. from preview/edit), use it
    useEffect(() => {
        if (navState?.clientId) {
            try {
                localStorage.setItem("selectedClientId", String(navState.clientId));
            } catch (e) {}
            setSelectedClientId(String(navState.clientId));
        }
    }, [navState?.clientId]);

    // Helper to select a client and persist selection
    // selection handler intentionally removed (not used in this view)

    useEffect(() => {
        const preselected = localStorage.getItem("selectedClientId");
        if (preselected) setSelectedClientId(preselected);
    }, []);
    // If navigated with editCampaignId in state, scroll to form after the selected client is ready
    useEffect(() => {
        const editId = navState?.editCampaignId;
        if (!editId) return;
        // wait a tick for the UI and client selection to settle
        const t = setTimeout(() => {
            const el = document.getElementById("planning-form");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
        return () => clearTimeout(t);
    }, [navState?.editCampaignId, selectedClientId]);

    // Keep an entry loader until initial required data is fetched.
    useEffect(() => {
        // If clients finished loading and (no client selected OR campaigns finished), and no global fetches/mutations
        const clientsReady = !clientsLoading;
        const campaignsReady = !selectedClientId || !campaignsLoading;
        const noGlobalOps = (fetching || mutating) === 0;

        if (clientsReady && campaignsReady && noGlobalOps) {
            setEntryLoading(false);
        }
    }, [clientsLoading, campaignsLoading, fetching, mutating, selectedClientId]);

    // Load selected client from clients list
    useEffect(() => {
        if (!selectedClient && selectedClientId && clients.length > 0) {
            const client = clients.find((c: any) => String(c.id) === String(selectedClientId) || String(c._id) === String(selectedClientId));
            if (client) setSelectedClient(client);
        }
    }, [clients, selectedClientId, selectedClient]);

    // Handle deselect client
    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
                <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-light-400/20 blur-3xl dark:bg-light-500/10" />
                <div className="absolute -bottom-24 -left-14 h-56 w-56 rounded-full bg-secdark-700/20 blur-3xl dark:bg-secdark-700/20" />
                <div className="relative flex flex-col gap-2">
                    <span className="inline-flex w-fit items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                        Strategy Planning
                    </span>
                    <h1 className="title text-2xl sm:text-3xl">{tr("campaign_planning", "Campaign Planning")}</h1>
                    <p className="text-light-600 dark:text-dark-300 text-sm sm:text-base">
                        {tr("campaign_planning_subtitle", "Create and manage campaign strategies for your clients.")}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("clients", "Clients")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{clients.length}</p>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("campaigns", "Campaigns")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">
                        {(Array.isArray(allCampaigns) ? allCampaigns : (allCampaigns as any)?.data || (allCampaigns as any)?.campaigns || []).length}
                    </p>
                </div>
             
            </section>

            {/* Entry Loader (match quotations position & color) - placed below title */}
            {entryLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2
                        className="text-light-500 animate-spin"
                        size={32}
                    />
                </div>
            )}

            {/* Client Selection */}
            {!selectedClientId && !isTransitioning && !clientsLoading && !globalLoading ? (
                <div>
                    {clients.length > 0 && (
                        <>
                            <h2 className="text-light-700 dark:text-dark-300 mb-4 text-lg font-semibold">{tr("select_a_client_to_plan", "Select a client to plan")}</h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {clients.map((client: any) => {
                                    const cid = client.id || client._id || "";
                                    const campaignList = Array.isArray(allCampaigns) ? allCampaigns : (allCampaigns as any)?.data || (allCampaigns as any)?.campaigns || [];
                                    const clientCampaignsCount = campaignList?.filter((c: any) => {
                                        const cIdStr = String(c.clientId?._id || c.clientId || "");
                                        return cIdStr === String(cid);
                                    })?.length || 0;
                                    return (
                                    <div
                                        key={cid}
                                        className="rounded-3xl border border-light-200/80 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-dark-700/80 dark:bg-dark-900/70"
                                    >
                                        <h3 className="text-light-900 dark:text-dark-50 text-lg font-semibold">
                                            {client.business?.businessName || tr("unnamed_client", "Unnamed")}
                                        </h3>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-light-600 dark:text-dark-400 text-sm">
                                                {client.business?.category || tr("no_category", "No category")}
                                            </p>
                                            <span className="text-xs bg-light-200 dark:bg-dark-600 text-light-700 dark:text-dark-300 px-2 py-1 rounded-full whitespace-nowrap">
                                                {clientCampaignsCount} {tr("campaigns", "Campaigns")}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    navigate("/strategies/manage", {
                                                        state: {
                                                            clientId: cid,
                                                            referrer: {
                                                                pathname: location.pathname || "/strategies",
                                                                state: (location && (location as any).state) || null,
                                                            },
                                                        },
                                                    });
                                                }}
                                                className="btn-primary flex flex-1 items-center gap-2 rounded-xl"
                                            >
                                                <Plus size={14} /> {tr("plan_button", "Plan")}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate("/strategies/preview", {
                                                        state: {
                                                            clientId: cid,
                                                            referrer: {
                                                                pathname: location.pathname || "/strategies",
                                                                state: (location && (location as any).state) || null,
                                                            },
                                                        },
                                                    });
                                                }}
                                                className="btn-ghost flex items-center gap-2 rounded-xl"
                                                title={tr("preview_strategy", "Preview Strategy")}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </>
                    )}
                </div>
            ) : null}

            {/* Loading: show while any relevant queries or global fetches/mutations are active */}
            {!entryLoading && (clientsLoading || (selectedClientId && (campaignsLoading || isTransitioning)) || globalLoading) && (
                <div className="flex items-center justify-center py-12">
                    <Loader2
                        className="text-light-500 animate-spin"
                        size={32}
                    />
                </div>
            )}

            {/* Selected client info is intentionally not showing the inline form.
                Use the "Plan" button on a client card to open the form at /strategies/manage. */}
        </div>
    );
};

export default PlanningPage;
