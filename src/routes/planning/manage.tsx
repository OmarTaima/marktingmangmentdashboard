import { useMemo, useState } from "react";
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
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
                <div className="absolute -top-20 -right-10 h-52 w-52 rounded-full bg-light-400/20 blur-3xl dark:bg-light-500/10" />
                <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-secdark-700/15 blur-3xl dark:bg-secdark-700/20" />
                <div className="relative flex items-start justify-start gap-4">
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
                        className="btn-ghost rounded-xl"
                    >
                        <LocalizedArrow size={20} />
                    </button>
                    {isViewOnly && (
                        <button
                            onClick={() => setIsViewOnly(false)}
                            className="btn-primary ml-2 rounded-xl"
                            aria-label="Edit campaign"
                        >
                            Edit
                        </button>
                    )}
                    <div>
                        <span className="inline-flex items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                            Campaign Studio
                        </span>
                        <h2 className="text-light-900 dark:text-dark-50 mt-3 text-xl font-bold sm:text-2xl">{clientName || "Campaign"}</h2>
                        <p className="text-light-600 dark:text-dark-300 text-sm">Create or edit a campaign</p>
                    </div>
                </div>
            </section>

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
