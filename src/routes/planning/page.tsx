import React, { useState, useEffect, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { useClients } from "@/hooks/queries/useClientsQuery";
import { useCampaignsByClient } from "@/hooks/queries/usePlansQuery";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import PlanningForm from "./form"; // <-- imported form

const PlanningPage: React.FC = () => {
    const { t } = useLang();
    const [selectedClientId, setSelectedClientId] = useState<string>(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { isLoading: campaignsLoading } = useCampaignsByClient(selectedClientId, !!selectedClientId);
    const fetching = useIsFetching();
    const mutating = useIsMutating();
    const globalLoading = (fetching || mutating) > 0;
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
    const [entryLoading, setEntryLoading] = useState<boolean>(true);
    const isTransitioningRef = useRef<boolean>(false);

    // Helper to select a client and persist selection
    const handleSelectClient = (clientId: string) => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        setIsTransitioning(true);
        try {
            localStorage.setItem("selectedClientId", String(clientId));
        } catch (e) {}
        setSelectedClientId(String(clientId));
        setTimeout(() => {
            isTransitioningRef.current = false;
            setIsTransitioning(false);
        }, 300);
    };

    useEffect(() => {
        const preselected = localStorage.getItem("selectedClientId");
        if (preselected) setSelectedClientId(preselected);
    }, []);

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
    const handleDeselectClient = () => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        setIsTransitioning(true);
        try {
            localStorage.removeItem("selectedClientId");
        } catch (e) {}
        setSelectedClientId("");
        setSelectedClient(null);
        setTimeout(() => {
            isTransitioningRef.current = false;
            setIsTransitioning(false);
        }, 300);
    };

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
                                        <button
                                            onClick={() => {
                                                handleSelectClient(client.id || client._id || "");
                                            }}
                                            className="btn-primary mt-4 flex w-full items-center gap-2"
                                        >
                                            <Plus size={14} /> {t("plan_button")}
                                        </button>
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

            {/* Selected Client & Planning Form */}
            {selectedClient && !isTransitioning && !globalLoading && !entryLoading && (
                <>
                    <div className="card bg-dark-50 dark:bg-dark-800/50 p-4">
                        <div className="flex items-center justify-start gap-4">
                            <button
                                onClick={handleDeselectClient}
                                className="btn-ghost"
                            >
                                <LocalizedArrow size={20} />
                            </button>
                            <div>
                                <h2 className="card-title">{selectedClient.business?.businessName}</h2>
                                <p className="text-light-600 dark:text-dark-400 text-sm">{selectedClient.business?.category}</p>
                            </div>
                        </div>
                    </div>

                    {/* Insert the extracted PlanningForm */}
                    <PlanningForm selectedClientId={selectedClientId} />
                </>
            )}
        </div>
    );
};

export default PlanningPage;
