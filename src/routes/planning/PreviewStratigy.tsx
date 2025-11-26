import { useState, useEffect } from "react";
import { Loader2, Trash2, Edit2, Eye, Plus } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { showAlert, showConfirm } from "@/utils/swal";
import { useClients } from "@/hooks/queries/useClientsQuery";
import { useCampaignsByClient, useDeleteCampaign } from "@/hooks/queries/usePlansQuery";
import type { Campaign } from "@/api/requests/planService";
import { useNavigate, useLocation } from "react-router-dom";

interface PreviewCampaignsProps {
    clientId?: string;
    clientName?: string;
    onBack?: () => void;
    onCreateNew?: () => void;
    onEdit?: (campaign: Campaign) => void;
}

const PreviewCampaigns = ({ clientId: propClientId, clientName: propClientName, onBack, onCreateNew, onEdit }: PreviewCampaignsProps) => {
    const { t } = useLang();
    const navigate = useNavigate();
    const location = useLocation();

    const state: any = (location && (location as any).state) || {};
    const clientId = (propClientId as string) || state.clientId || "";
    const campaignIdFromState = state.campaignId as string | undefined;
    const clientName = propClientName || state.clientName || "";

    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns } = useCampaignsByClient(clientId || "", !!clientId);

    useEffect(() => {
        if (!clientId) return;
        try {
            refetchCampaigns();
        } catch (e) {
            // ignore
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clientId]);

    const deleteCampaignMutation = useDeleteCampaign();

    const isDeleting = (deleteCampaignMutation as any).isPending ? "pending" : null;

    const resolveClientName = (campaign: any) => {
        try {
            if (campaign.client && typeof campaign.client === "object") {
                return campaign.client.business?.businessName || campaign.client.personal?.fullName || "";
            }
            if (campaign.clientId && typeof campaign.clientId === "string") {
                const client = clients.find((c) => String(c.id) === String(campaign.clientId) || String(c._id) === String(campaign.clientId));
                if (client) return client.business?.businessName || client.personal?.fullName || "";
            }
            return campaign.clientName || "";
        } catch (e) {
            return "";
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        const confirmed = await showConfirm(
            t("confirm_delete_campaign") || "Are you sure you want to delete this campaign?",
            t("yes") || "Yes",
            t("no") || "No",
        );
        if (!confirmed) return;

        try {
            await deleteCampaignMutation.mutateAsync({ campaignId: id, clientId: clientId || "" } as any);
            showAlert(t("campaign_deleted") || "Campaign deleted", "success");
        } catch (error) {
            showAlert(t("failed_to_delete_campaign") || "Failed to delete campaign", "error");
        }
    };

    // Preview modal state
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

    const openPreview = (campaign: Campaign) => {
        // Open the form for this campaign (edit mode)
        navigate("/strategies/manage", {
            state: {
                clientId: clientId,
                editCampaignId: campaign._id,
                referrer: { pathname: location.pathname || "/strategies/preview", state: (location && (location as any).state) || null },
            },
        });
    };

    const closePreview = () => {
        setSelectedCampaign(null);
        setShowPreviewModal(false);
    };
    // support both plain array responses and { data: Campaign[] } shapes
    const displayedCampaigns: Campaign[] = Array.isArray(campaigns) ? campaigns : campaigns && (campaigns as any).data ? (campaigns as any).data : [];

    // If a campaignId was passed via location.state, auto-open that campaign when loaded
    useEffect(() => {
        if (!campaignIdFromState) return;
        if (!displayedCampaigns || displayedCampaigns.length === 0) return;
        const found = displayedCampaigns.find((c) => String(c._id) === String(campaignIdFromState));
        if (found) openPreview(found);
    }, [campaignIdFromState, displayedCampaigns]);

    if (clientsLoading || campaignsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2
                    className="text-light-500 animate-spin"
                    size={32}
                />
            </div>
        );
    }

    // Default handlers when component is rendered by route (no callbacks passed)
    const handleBack =
        onBack ||
        (() => {
            try {
                localStorage.removeItem("selectedClientId");
            } catch (e) {
                // ignore
            }
            // always go back to the strategies list (client selection)
            navigate("/strategies");
        });
    const handleCreateNew =
        onCreateNew ||
        (() => {
            // navigate to the dedicated manage page that renders the form
            navigate("/strategies/manage", { state: { clientId, referrer: location.pathname || "/strategies" } });
        });

    const handleEdit =
        onEdit ||
        ((c: Campaign) => {
            // Navigate to the manage page with edit id so the form opens for editing
            navigate("/strategies/manage", {
                state: { clientId: clientId, editCampaignId: c._id, referrer: location.pathname || "/strategies/preview" },
            });
        });

    return (
        <div className="space-y-6">
            <div className="card bg-dark-50 dark:bg-dark-800/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            try {
                                // debug: ensure click fires
                                handleBack && handleBack();
                            } catch (err) {}
                        }}
                        className="btn-ghost"
                    >
                        <LocalizedArrow size={20} />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-light-900 dark:text-dark-50 text-xl font-bold">{clientName}</h2>
                        <p className="text-light-600 dark:text-dark-50 text-sm">{t("campaigns") || "Campaigns"}</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="btn-primary"
                    >
                        <Plus
                            size={16}
                            className="mr-2"
                        />
                        {t("create_new") || "Create New"}
                    </button>
                </div>
            </div>

            {!displayedCampaigns.length && (
                <div className="card">
                    <div className="flex flex-col items-center justify-center py-12">
                        <p className="text-light-600 dark:text-dark-400 mb-4 max-w-lg text-center text-lg">
                            {t("no_campaigns_for_client") || "There are no campaigns for this client"}
                        </p>
                        <div className="mt-4">
                            <button
                                onClick={handleCreateNew}
                                className="btn-primary px-6"
                            >
                                {t("create_campaign") || "Create Campaign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && selectedCampaign && (
                <div className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
                    <div className="dark:bg-dark-800 w-full max-w-2xl rounded bg-white p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-light-900 dark:text-dark-50 text-lg font-bold">
                                    {selectedCampaign.description ||
                                        selectedCampaign.strategy?.description ||
                                        t("campaign_preview") ||
                                        "Campaign Preview"}
                                </h3>
                                <p className="text-light-600 dark:text-dark-400 text-sm">{resolveClientName(selectedCampaign)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn-ghost"
                                    onClick={() => {
                                        closePreview();
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 space-y-3">
                            {selectedCampaign.objectives && selectedCampaign.objectives.length > 0 && (
                                <div>
                                    <div className="text-light-600 dark:text-dark-400 mb-2 text-sm">{t("objectives") || "Objectives"}</div>
                                    <ul className="list-disc pl-5 text-sm">
                                        {selectedCampaign.objectives.map((o: any, i: number) => (
                                            <li
                                                key={i}
                                                className="mb-1"
                                            >
                                                {o.name} {o.description ? <span className="text-light-600 text-xs"> - {o.description}</span> : null}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedCampaign.strategy?.timeline && selectedCampaign.strategy.timeline.length > 0 && (
                                <div>
                                    <div className="text-light-600 dark:text-dark-400 mb-2 text-sm">{t("timeline") || "Timeline"}</div>
                                    <div className="space-y-2 text-sm">
                                        {selectedCampaign.strategy.timeline.map((t: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="rounded border p-2"
                                            >
                                                <div className="text-light-600 text-xs">
                                                    {t.timelineStart ? new Date(t.timelineStart).toLocaleDateString() : ""} —{" "}
                                                    {t.timelineEnd ? new Date(t.timelineEnd).toLocaleDateString() : ""}
                                                </div>
                                                {t.objectiveEn && <div className="mt-1">{t.objectiveEn}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {displayedCampaigns.length > 0 && (
                <div className="card">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="card-title">{t("existing_campaigns") || "Existing Campaigns"}</h3>
                    </div>

                    <div className="space-y-3">
                        {displayedCampaigns.map((campaign) => (
                            <div
                                key={campaign._id}
                                className="border-light-600 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50 rounded-lg border p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="mb-2 flex items-center gap-3">
                                            <h4 className="text-light-900 dark:text-dark-50 font-semibold">
                                                {campaign.description || campaign.strategy?.description || campaign._id}
                                            </h4>
                                            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                                {new Date(campaign.createdAt || "").toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-light-600 dark:text-dark-400 mb-1 text-sm">
                                            {(campaign.objectives || []).length} {t("objectives") || "objectives"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(campaign)}
                                            className="btn-ghost"
                                            title={t("edit") || "Edit"}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => openPreview(campaign)}
                                            className="btn-ghost text-blue-600"
                                            title={t("preview") || "Preview"}
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCampaign(campaign._id || "")}
                                            className="btn-ghost text-danger-500"
                                            title={t("delete") || "Delete"}
                                            disabled={isDeleting === campaign._id}
                                        >
                                            {isDeleting === campaign._id ? (
                                                <Loader2
                                                    size={16}
                                                    className="text-light-500 animate-spin"
                                                />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit uses navigation to /strategies with location.state.editCampaignId */}
        </div>
    );
};

export default PreviewCampaigns;
