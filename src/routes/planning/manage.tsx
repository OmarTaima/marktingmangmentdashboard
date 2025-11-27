import React, { useMemo, useState } from "react";
import PlanningForm from "./form";
import { useLocation, useNavigate } from "react-router-dom";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useClients } from "@/hooks/queries/useClientsQuery";

const ManageCampaignPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state: any = (location && (location as any).state) || {};
    const clientId = state.clientId as string | undefined;
    const editCampaignId = state.editCampaignId as string | undefined;
    const initialViewOnly = state.viewOnly as boolean | undefined;
    const referrer = state.referrer as any | undefined;

    const [isViewOnly, setIsViewOnly] = useState<boolean>(initialViewOnly ?? false);

    const { data: clients = [] } = useClients();

    const clientName = useMemo(() => {
        if (!clientId) return "";
        const c = clients.find((x: any) => String(x.id) === String(clientId) || String(x._id) === String(clientId));
        if (!c) return `Client ${String(clientId).slice(0, 8)}`;
        return c.business?.businessName || c.personal?.fullName || `Client ${String(clientId).slice(0, 8)}`;
    }, [clientId, clients]);

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="card bg-dark-50 dark:bg-dark-800/50 p-4">
                <div className="flex items-center justify-start gap-4">
                    <button
                        onClick={() => {
                            try {
                                // Support both { pathname, state } and legacy string referrer values
                                if (referrer) {
                                    if (typeof referrer === "string") {
                                        navigate(referrer);
                                        return;
                                    }
                                    if (referrer.pathname) {
                                        navigate(referrer.pathname, { state: referrer.state });
                                        return;
                                    }
                                }
                            } catch (e) {
                                // ignore and fallback to history back
                            }

                            navigate(-1);
                        }}
                        className="btn-ghost"
                    >
                        <LocalizedArrow size={20} />
                    </button>
                    {isViewOnly && (
                        <button
                            onClick={() => setIsViewOnly(false)}
                            className="btn-primary ml-2"
                            aria-label="Edit campaign"
                        >
                            Edit
                        </button>
                    )}
                    <div>
                        <h2 className="card-title">{clientName || "Campaign"}</h2>
                        <p className="text-light-600 dark:text-dark-400 text-sm">Create or edit a campaign</p>
                    </div>
                </div>
            </div>

            <div id="planning-form">
                <PlanningForm
                    key={String(isViewOnly)}
                    selectedClientId={clientId}
                    editCampaignId={editCampaignId}
                    viewOnly={isViewOnly}
                />
            </div>
        </div>
    );
};

export default ManageCampaignPage;
