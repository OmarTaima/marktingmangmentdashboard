import React, { useState, useEffect } from "react";
import { Plus, Loader2, Eye } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useClients } from "@/hooks/queries/useClientsQuery";
import { useCampaignsByClient } from "@/hooks/queries/usePlansQuery";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";

const PlanningPage: React.FC = () => {
    const { t } = useLang();
    const [selectedClientId, setSelectedClientId] = useState<string>(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: _campaigns = [], isLoading: campaignsLoading } = useCampaignsByClient(selectedClientId, !!selectedClientId);
    const fetching = useIsFetching();
    const mutating = useIsMutating();
    const globalLoading = (fetching || mutating) > 0;
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
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
            const client = clients.find((c) => String(c.id) === String(selectedClientId) || String(c._id) === String(selectedClientId));
            if (client) setSelectedClient(client);
        }
    }, [clients, selectedClientId, selectedClient]);

    // Handle deselect client
    return (
        <div className="space-y-6 px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("campaign_planning")}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("campaign_planning_subtitle")}</p>
                </div>
            </div>

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
                            <h2 className="text-light-600 dark:text-dark-400 mb-4 text-lg font-semibold">{t("select_a_client_to_plan")}</h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {clients.map((client) => (
                                    <div
                                        key={client.id || client._id}
                                        className="card hover:border-light-500 p-4 transition-colors duration-300"
                                    >
                                        <h3 className="card-title text-lg">{client.business?.businessName || t("unnamed_client")}</h3>
                                        <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                                            {client.business?.category || t("no_category")}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const cid = client.id || client._id || "";
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
                                                className="btn-primary flex flex-1 items-center gap-2"
                                            >
                                                <Plus size={14} /> {t("plan_button")}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const cid = client.id || client._id || "";
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
                                                className="btn-ghost flex items-center gap-2"
                                                title={t("preview_strategy") || "Preview Strategy"}
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
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
