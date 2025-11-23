import { useState, useEffect, useRef } from "react";
import { Save, Edit2, FileText, Plus, Trash2, Calendar, Loader2 } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { useClients } from "@/hooks/queries/useClientsQuery";
import { useCampaignsByClient, useCreateCampaign, useUpdateCampaign, useDeleteCampaign, useAllCampaigns } from "@/hooks/queries/usePlansQuery";
import type { CampaignObjective } from "@/api/requests/planService";

const PlanningPage = () => {
    const { t, lang } = useLang();
    const [selectedClientId, setSelectedClientId] = useState<string>(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    // React Query hooks for clients and campaigns
    const { data: clients = [] } = useClients();
    const { data: campaignsByClient } = useCampaignsByClient(selectedClientId, !!selectedClientId);
    const { data: allCampaigns } = useAllCampaigns();
    const createCampaignMutation = useCreateCampaign();
    const updateCampaignMutation = useUpdateCampaign();
    const deleteCampaignMutation = useDeleteCampaign();

    type PlanData = {
        objective: string;
        strategy: string;
        budget: string;
        timeline: string;
        [key: string]: any;
    };

    const [planData, setPlanData] = useState<PlanData>({
        objective: "",
        strategy: "",
        budget: "",
        timeline: "",
    });
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>("");
    const [isEditing, setIsEditing] = useState<boolean>(true);
    const [finalStrategy, setFinalStrategy] = useState<string>("");
    const [isResetting, setIsResetting] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true
    const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
    const isTransitioningRef = useRef<boolean>(false); // Track transitions without causing re-render

    const [planErrors, setPlanErrors] = useState<Record<string, any>>({});

    // Campaign Objectives and Strategic Approaches as bilingual lists
    type Bilingual = { id: string; en?: string; ar?: string };
    const [objectives, setObjectives] = useState<Bilingual[]>([]);
    const [objectiveInputEn, setObjectiveInputEn] = useState<string>("");
    const [objectiveInputAr, setObjectiveInputAr] = useState<string>("");
    const [editingObjectiveIndex, setEditingObjectiveIndex] = useState<number>(-1);

    const [strategies, setStrategies] = useState<Bilingual[]>([]);
    const [strategyInputEn, setStrategyInputEn] = useState<string>("");
    const [strategyInputAr, setStrategyInputAr] = useState<string>("");
    const [editingStrategyIndex, setEditingStrategyIndex] = useState<number>(-1);
    const [showExistingStrategies, setShowExistingStrategies] = useState<boolean>(false);

    // Objectives handlers
    const handleAddObjective = () => {
        const en = (objectiveInputEn || "").trim();
        const ar = (objectiveInputAr || "").trim();

        const newObjective = { id: `obj_${Date.now()}`, en: en || ar, ar: ar || en };
        setObjectives([...objectives, newObjective]);
        setObjectiveInputEn("");
        setObjectiveInputAr("");
    };

    const startEditObjective = (idx: number) => {
        setEditingObjectiveIndex(idx);
        const obj = objectives[idx];
        setObjectiveInputEn(obj.en || "");
        setObjectiveInputAr(obj.ar || "");
    };

    const saveEditObjective = (idx: number) => {
        const en = (objectiveInputEn || "").trim();
        const ar = (objectiveInputAr || "").trim();
        // allow saving even when fields are empty (no required inputs)

        const updated = objectives.slice();
        updated[idx] = { ...updated[idx], en: en || ar, ar: ar || en };
        setObjectives(updated);
        setEditingObjectiveIndex(-1);
        setObjectiveInputEn("");
        setObjectiveInputAr("");
    };

    const removeObjective = (idx: number) => {
        setObjectives(objectives.filter((_, i) => i !== idx));
    };

    // Strategies handlers
    const handleAddStrategy = () => {
        const en = (strategyInputEn || "").trim();
        const ar = (strategyInputAr || "").trim();
        // allow adding even when fields are empty (no required inputs)

        const newStrategy = { id: `strat_${Date.now()}`, en: en || ar, ar: ar || en };
        const next = [...strategies, newStrategy];
        setStrategies(next);
        setStrategyInputEn("");
        setStrategyInputAr("");

        // Immediately persist transient draft so other components see the change right away
        try {
            if (selectedClientId) {
                const draft = { ...planData, objectives: objectives || [], strategies: next || [], id: selectedPlanId || null };
                localStorage.setItem(`plan_draft_${selectedClientId}`, JSON.stringify(draft));
            }
        } catch (e) {}
    };

    const startEditStrategy = (idx: number) => {
        setEditingStrategyIndex(idx);
        const strat = strategies[idx];
        setStrategyInputEn(strat.en || "");
        setStrategyInputAr(strat.ar || "");
    };

    const saveEditStrategy = (idx: number) => {
        const en = (strategyInputEn || "").trim();
        const ar = (strategyInputAr || "").trim();
        // allow saving even when fields are empty (no required inputs)

        const updated = strategies.slice();
        updated[idx] = { ...updated[idx], en: en || ar, ar: ar || en };
        setStrategies(updated);
        setEditingStrategyIndex(-1);
        setStrategyInputEn("");
        setStrategyInputAr("");
        try {
            if (selectedClientId) {
                const draft = { ...planData, objectives: objectives || [], strategies: updated || [], id: selectedPlanId || null };
                localStorage.setItem(`plan_draft_${selectedClientId}`, JSON.stringify(draft));
            }
        } catch (e) {}
    };

    const removeStrategy = (idx: number) => {
        const updated = strategies.filter((_, i) => i !== idx);
        setStrategies(updated);
        try {
            if (selectedClientId) {
                const draft = { ...planData, objectives: objectives || [], strategies: updated || [], id: selectedPlanId || null };
                localStorage.setItem(`plan_draft_${selectedClientId}`, JSON.stringify(draft));
            }
        } catch (e) {}
    };

    useEffect(() => {
        // If a client was selected from another page (e.g. Clients->Plan), preselect it
        const preselected = localStorage.getItem("selectedClientId");
        if (preselected) {
            setSelectedClientId(preselected);
        }
        // Small delay before showing content to prevent flash
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // Load campaigns from API when they become available
    useEffect(() => {
        console.log("Campaign data effect triggered:", {
            hasCampaigns: campaignsByClient !== undefined,
            campaignCount: campaignsByClient?.length,
            campaignsByClient: campaignsByClient,
            selectedClientId,
            clientsCount: clients.length,
        });

        if (campaignsByClient !== undefined && selectedClientId && clients.length > 0) {
            const client = clients.find((c: any) => c.id === selectedClientId || c._id === selectedClientId);

            if (client) {
                setSelectedClient(client);

                // Handle API response structure - extract data array
                let campaignsArray: any[] = [];
                if (Array.isArray(campaignsByClient)) {
                    campaignsArray = campaignsByClient;
                } else if (campaignsByClient && typeof campaignsByClient === "object") {
                    // API returns {data: [...], meta: {...}}
                    campaignsArray = (campaignsByClient as any).data || [];
                }

                // Transform API campaigns to local plan format
                if (campaignsArray.length > 0) {
                    const transformedPlans = campaignsArray.map((campaign: any) => {
                        const plan = {
                            id: `campaign_${campaign._id}`,
                            objective: campaign.description || "",
                            strategy: campaign.strategy?.description || "",
                            budget: (campaign.strategy?.budget || 0).toString(),
                            timeline: campaign.strategy?.timeline || "",
                            objectives: (campaign.objectives || []).map((obj: any) => ({
                                id: `obj_${Date.now()}_${Math.random()}`,
                                en: obj.name || "",
                                ar: obj.description || "",
                            })),
                            strategies: (campaign.strategy?.description || "")
                                .split(" | ")
                                .filter(Boolean)
                                .map((s: string, idx: number) => ({
                                    id: `strat_${Date.now()}_${idx}`,
                                    en: s,
                                    ar: s,
                                })),
                        };
                        return plan;
                    });

                    setPlans(transformedPlans);
                    // Select first plan by default
                    const firstPlan = transformedPlans[0];

                    setSelectedPlanId(firstPlan.id);
                    setPlanData(firstPlan);
                    setObjectives(firstPlan.objectives || []);
                    setStrategies(firstPlan.strategies || []);
                    setIsEditing(false);
                } else {
                    // No campaigns found, start with empty plan
                    setPlans([]);
                    setSelectedPlanId("");
                    setPlanData({ objective: "", strategy: "", budget: "", timeline: "" });
                    setObjectives([]);
                    setStrategies([]);
                    setIsEditing(true);
                }
            } else {
            }
        }
    }, [campaignsByClient, selectedClientId, clients]);

    useEffect(() => {
        if (selectedClientId) {
            // Immediately hide previous content
            isTransitioningRef.current = true;
            setIsTransitioning(true);
            setIsLoading(true);
            setIsResetting(false);
            // Immediately clear client to prevent flash
            setSelectedClient(null);
            // Small delay for loading animation
            setTimeout(() => {
                setIsLoading(false);
                setIsTransitioning(false);
                isTransitioningRef.current = false;
            }, 300);
        } else if (selectedClient) {
            // Only reset if we had a client selected before
            // Immediately hide content and clear client
            isTransitioningRef.current = true;
            setSelectedClient(null);
            setIsTransitioning(true);
            setIsLoading(true);
            setIsResetting(true);
            // Reset all states when going back
            setTimeout(() => {
                setPlanData({
                    objective: "",
                    strategy: "",
                    services: [],
                    servicesPricing: {},
                    budget: "",
                    timeline: "",
                });
                setFinalStrategy("");
                setIsEditing(true);
                setIsResetting(false);
                setIsLoading(false);
                setIsTransitioning(false);
                isTransitioningRef.current = false;
            }, 300);
        }
    }, [selectedClientId]);

    const handleSavePlan = async () => {
        if (!selectedClientId) {
            alert(t("please_select_client_first"));
            console.warn("handleSavePlan: no selectedClientId");
            return;
        }

        // Prepare campaign payload
        const campaignObjectives: CampaignObjective[] = objectives.map((obj) => ({
            name: obj.en || obj.ar || "",
            description: obj.ar || obj.en || "",
        }));

        const strategyDescription = strategies
            .map((s) => s.en || s.ar || "")
            .filter(Boolean)
            .join(" | ");

        const payload = {
            clientId: selectedClientId,
            description: planData.objective || "Campaign Plan",
            objectives: campaignObjectives,
            strategy: {
                budget: Number(planData.budget) || 0,
                timeline: planData.timeline || "",
                description: strategyDescription || planData.strategy || "",
            },
        };

        setPlanErrors({});

        try {
            if (selectedPlanId && selectedPlanId.startsWith("campaign_")) {
                // Extract campaign ID from selectedPlanId
                const campaignId = selectedPlanId.replace("campaign_", "");
                // Update existing campaign
                await updateCampaignMutation.mutateAsync({
                    campaignId,
                    payload: {
                        clientId: selectedClientId,
                        description: payload.description,
                        objectives: payload.objectives,
                        strategy: payload.strategy,
                    },
                });
            } else {
                // Create new campaign
                const newCampaign = await createCampaignMutation.mutateAsync(payload);
                setSelectedPlanId(`campaign_${newCampaign._id}`);
            }

            setIsEditing(false);
            setPlanErrors({});
            // clear any transient draft saved while editing
            try {
                localStorage.removeItem(`plan_draft_${selectedClientId}`);
            } catch (e) {}
            alert(t("plan_saved_success") || "Plan saved successfully!");
        } catch (error) {
            console.error("Failed to save campaign:", error);
            alert(t("save_failed") || "Failed to save plan.");
        }
    };

    const handleCreateNewPlan = () => {
        const newPlan = {
            id: `plan_${Date.now()}`,
            objective: "",
            strategy: "",
            services: [],
            servicesPricing: {},
            budget: "",
            timeline: "",
            objectives: [],
            strategies: [],
        };
        const updated = [...plans, newPlan];
        try {
            localStorage.setItem(`plans_${selectedClientId}`, JSON.stringify(updated));
        } catch (e) {}
        setPlans(updated);
        setSelectedPlanId(newPlan.id);
        setPlanData(newPlan);
        setObjectives([]);
        setStrategies([]);
        setIsEditing(true);
        // create an empty draft for the new plan so other components can show live state
        try {
            localStorage.setItem(`plan_draft_${selectedClientId}`, JSON.stringify({ ...newPlan, objectives: [], strategies: [], id: newPlan.id }));
        } catch (e) {}
    };

    // Persist transient draft so ClientInfo (and other components) can read live edits
    useEffect(() => {
        if (!selectedClientId) return;
        // only persist when editing (live changes)
        if (!isEditing) return;
        try {
            const draft = { ...planData, objectives: objectives || [], strategies: strategies || [], id: selectedPlanId || null };
            localStorage.setItem(`plan_draft_${selectedClientId}`, JSON.stringify(draft));
        } catch (e) {
            // ignore storage errors
        }
    }, [objectives, strategies, planData, selectedClientId, isEditing]);

    const handleSelectPlan = (planId: string) => {
        const plan = plans.find((p: any) => p.id === planId);
        if (plan) {
            setSelectedPlanId(planId);
            // ensure servicesPricing exists on loaded plan
            setPlanData({ ...plan, servicesPricing: plan.servicesPricing || {} });
            setObjectives(plan.objectives || []);
            setStrategies(plan.strategies || []);
            setIsEditing(false);
        }
    };

    // Helper: return plans sorted newest-first (by timestamp in id)
    const getSortedPlansDesc = () =>
        plans.slice().sort((a, b) => {
            const ta = Number((a.id || "").split("_")[1]) || 0;
            const tb = Number((b.id || "").split("_")[1]) || 0;
            return tb - ta;
        });

    const handleDeletePlan = async (planId: string) => {
        if (!confirm(t("confirm_delete_plan") || "Delete this plan?")) return;

        try {
            if (planId.startsWith("campaign_") && selectedClientId) {
                // Extract campaign ID from planId
                const campaignId = planId.replace("campaign_", "");
                // Delete from API
                await deleteCampaignMutation.mutateAsync({ campaignId, clientId: selectedClientId });
            } // Update local state
            const updated = plans.filter((p: any) => p.id !== planId);
            setPlans(updated);

            if (selectedPlanId === planId) {
                if (updated.length > 0) {
                    setSelectedPlanId(updated[updated.length - 1].id);
                    setPlanData(updated[updated.length - 1]);
                    setIsEditing(false);
                } else {
                    setSelectedPlanId("");
                    setPlanData({ objective: "", strategy: "", services: [], servicesPricing: {}, budget: "", timeline: "" });
                    setObjectives([]);
                    setStrategies([]);
                    setIsEditing(true);
                }
            }
        } catch (error) {
            console.error("Failed to delete campaign:", error);
            alert(t("delete_failed") || "Failed to delete plan.");
        }
    };

    const handleDownload = () => {
        if (!finalStrategy) return;

        const element = document.createElement("a");
        const file = new Blob([finalStrategy], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `strategy_${selectedClient?.business?.businessName || "client"}_${new Date().toISOString().split("T")[0]}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="title">{t("campaign_planning")}</h1>
                        <p className="text-light-600 dark:text-dark-400">{t("campaign_planning_subtitle")}</p>
                    </div>
                    {selectedClientId && (
                        <div className="flex items-center gap-2">
                            {/* Plan selector + create/delete */}
                            <div className="flex items-center gap-2">
                                {plans.length > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            {getSortedPlansDesc().map((p) => {
                                                // derive timestamp from id format plan_{ts}
                                                const parts = (p.id || "").split("_");
                                                const ts = Number(parts[1]) || 0;
                                                const dateLabel = ts ? new Date(ts).toLocaleDateString() : t("untitled_plan");
                                                const title = (p.objective && p.objective.trim()) || t("untitled_plan");
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => handleSelectPlan(p.id)}
                                                        title={title}
                                                        aria-label={title}
                                                        className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none ${
                                                            selectedPlanId === p.id
                                                                ? "bg-light-500 text-white"
                                                                : "bg-light-100 text-dark-800 dark:bg-dark-700 dark:text-dark-50"
                                                        }`}
                                                    >
                                                        <Calendar size={14} />
                                                        <span className="whitespace-nowrap">{dateLabel}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={handleCreateNewPlan}
                                    className="btn-ghost flex items-center gap-2 px-3 py-2"
                                >
                                    <Plus size={14} />
                                    {t("new_plan")}
                                </button>
                                {plans.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeletePlan(selectedPlanId)}
                                        className="btn-ghost text-danger-500 px-3 py-2"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {!isEditing && finalStrategy && (
                                    <button
                                        onClick={handleDownload}
                                        className="btn-ghost flex items-center gap-2"
                                    >
                                        <FileText size={16} />
                                        {t("download_strategy")}
                                    </button>
                                )}
                                {isEditing ? (
                                    <button
                                        onClick={handleSavePlan}
                                        className="btn-primary flex items-center gap-2"
                                        disabled={!selectedClientId}
                                    >
                                        <Save size={16} />
                                        {t("save_plan")}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Edit2 size={16} />
                                        {t("edit_plan")}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading loader for client list */}
                {!selectedClientId && isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="text-light-500 dark:text-light-500 mx-auto h-12 w-12 animate-spin" />
                            <p className="text-light-600 dark:text-dark-400 mt-3">{t("loading_clients") || t("loading") || "Loading clients..."}</p>
                        </div>
                    </div>
                )}

                {/* Client Selection Cards */}
                {!selectedClientId && !isResetting && !isLoading && !isTransitioning ? (
                    <div>
                        {clients.length > 0 ? (
                            <>
                                <h2 className="text-light-900 dark:text-dark-50 mb-4 text-lg font-semibold">{t("select_a_client_to_plan")}</h2>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {clients.map((client) => (
                                        <div
                                            key={client.id}
                                            className="card hover:border-light-500 transition-colors duration-300"
                                        >
                                            <h3 className="card-title text-lg">
                                                <span className="mr-2 text-sm font-semibold">{t("business_name_label")}</span>
                                                {client.business?.businessName || t("unnamed_client")}
                                            </h3>
                                            <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                                                <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                                                {client.business?.category || t("no_category")}
                                            </p>
                                            <div className="text-light-600 dark:text-dark-400 mt-3 text-sm">
                                                <p>
                                                    {t("contact_label")} {client.personal?.fullName || "N/A"}
                                                </p>
                                                <p>
                                                    {t("email_label")} {client.contact?.businessEmail || client.personal?.email || "N/A"}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (isTransitioningRef.current) return;
                                                    isTransitioningRef.current = true;
                                                    try {
                                                        localStorage.setItem("selectedClientId", String(client.id));
                                                    } catch (e) {}
                                                    setSelectedClientId(String(client.id));
                                                    setTimeout(() => {
                                                        isTransitioningRef.current = false;
                                                    }, 300);
                                                }}
                                                className="btn-primary mt-4 w-full"
                                            >
                                                {(() => {
                                                    // If we have local plans saved for this client, show 'Show Strategy' instead of 'Create Strategy'
                                                    try {
                                                        const key = `plans_${client.id}`;
                                                        const hasLocalPlans = typeof window !== "undefined" && !!localStorage.getItem(key);

                                                        // `allCampaigns` may be an array or an object like { data: [] } depending on API.
                                                        const campaignsArray: any[] = Array.isArray(allCampaigns)
                                                            ? allCampaigns
                                                            : allCampaigns && Array.isArray((allCampaigns as any).data)
                                                              ? (allCampaigns as any).data
                                                              : [];

                                                        const hasServerPlans = campaignsArray.some((c: any) => {
                                                            if (!c) return false;
                                                            let campaignClientId: any = null;
                                                            if (typeof c.clientId === "string") campaignClientId = c.clientId;
                                                            else if (c.clientId && typeof c.clientId === "object")
                                                                campaignClientId = c.clientId._id || c.clientId.id || c.clientId;
                                                            else if (typeof c.client === "string") campaignClientId = c.client;
                                                            else if (c.client && typeof c.client === "object")
                                                                campaignClientId = c.client._id || c.client.id || c.client;

                                                            try {
                                                                return (
                                                                    String(campaignClientId) === String(client.id) ||
                                                                    String(campaignClientId) === String(client._id) ||
                                                                    String(campaignClientId) === String(client._id || client.id)
                                                                );
                                                            } catch (err) {
                                                                return false;
                                                            }
                                                        });

                                                        return hasLocalPlans || hasServerPlans
                                                            ? t("show_strategy") || "Show Strategy"
                                                            : t("plan_button");
                                                    } catch (e) {
                                                        return t("plan_button");
                                                    }
                                                })()}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : null}
                    </div>
                ) : null}

                {/* Loading loader for planning form */}
                {selectedClientId && (isLoading || isTransitioning) && (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="text-light-500 dark:text-light-500 mx-auto h-12 w-12 animate-spin" />
                            <p className="text-light-600 dark:text-dark-400 mt-3">{t("loading_client") || t("loading") || "Loading client..."}</p>
                        </div>
                    </div>
                )}

                {selectedClient && !isLoading && !isTransitioning && (
                    <>
                        {/* Client Info Header */}
                        <div className="card bg-dark-50 dark:bg-dark-800/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => {
                                            if (isTransitioningRef.current) return;
                                            isTransitioningRef.current = true;
                                            try {
                                                localStorage.removeItem("selectedClientId");
                                            } catch (e) {}
                                            setSelectedClientId("");
                                            setTimeout(() => {
                                                isTransitioningRef.current = false;
                                            }, 300);
                                        }}
                                        className="btn-ghost"
                                    >
                                        <LocalizedArrow size={20} />
                                    </button>
                                    <div>
                                        <h2 className="text-light-900 dark:text-dark-50 text-xl font-bold">
                                            <span className="mr-2 text-sm font-semibold">{t("business_name_label")}</span>
                                            {selectedClient.business?.businessName}
                                        </h2>
                                        <p className="text-light-600 dark:text-dark-400 text-sm">
                                            <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                                            {selectedClient.business?.category}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Planning Form */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Campaign Objectives */}
                            <div className="card transition-colors duration-300 lg:col-span-2">
                                <h3 className="card-title mb-4">{t("campaign_objective")}</h3>

                                {isEditing && (
                                    <div className="mb-4">
                                        <div className="grid gap-3 lg:grid-cols-2">
                                            <input
                                                value={objectiveInputEn}
                                                onChange={(e) => setObjectiveInputEn(e.target.value)}
                                                placeholder={t("objective_en") || "Objective (English)"}
                                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                            />
                                            <input
                                                value={objectiveInputAr}
                                                onChange={(e) => setObjectiveInputAr(e.target.value)}
                                                placeholder={t("objective_description") || "Description"}
                                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={
                                                editingObjectiveIndex === -1 ? handleAddObjective : () => saveEditObjective(editingObjectiveIndex)
                                            }
                                            className="btn-ghost mt-2 flex items-center gap-2 px-3 py-2"
                                            disabled={!objectiveInputEn.trim() && !objectiveInputAr.trim()}
                                        >
                                            <Plus size={14} />
                                            {editingObjectiveIndex === -1 ? t("add") || "Add" : t("save") || "Save"}
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {objectives.map((obj, idx) => (
                                        <div
                                            key={obj.id}
                                            className="border-light-600 dark:border-dark-700 dark:bg-dark-800 flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3"
                                        >
                                            <div className="flex-1">
                                                <div className="text-light-900 dark:text-dark-50 text-sm">
                                                    {lang === "ar" ? obj.ar || obj.en : obj.en || obj.ar}
                                                </div>
                                            </div>
                                            {isEditing && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditObjective(idx)}
                                                        className="text-light-600 hover:text-light-900 dark:text-dark-400 dark:hover:text-dark-50"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeObjective(idx)}
                                                        className="text-danger-500 hover:text-danger-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {objectives.length === 0 && !isEditing && (
                                        <p className="text-light-600 dark:text-dark-400 text-sm">
                                            {t("no_objectives") || "No objectives added yet."}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Strategic Approaches */}
                            <div className="card transition-colors duration-300 lg:col-span-2">
                                <h3 className="card-title mb-4">{t("strategic_approach")}</h3>

                                {isEditing && (
                                    <div className="mb-4">
                                        <div className="grid gap-3 lg:grid-cols-2">
                                            <input
                                                value={strategyInputEn}
                                                onChange={(e) => setStrategyInputEn(e.target.value)}
                                                placeholder={t("strategy_en") || "Strategy (English)"}
                                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                            />
                                            <input
                                                value={strategyInputAr}
                                                onChange={(e) => setStrategyInputAr(e.target.value)}
                                                placeholder={t("strategy_description") || "Description"}
                                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                            />
                                        </div>
                                        {/* If the client already has strategies available from API, show a toggle instead of the simple Add button */}
                                        {plans &&
                                        plans.length > 0 &&
                                        plans.some((p: any) => Array.isArray(p.strategies) && p.strategies.length > 0) &&
                                        strategies.length === 0 ? (
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowExistingStrategies((s) => !s)}
                                                    className="btn-ghost flex items-center gap-2 px-3 py-2"
                                                >
                                                    <Plus size={14} />
                                                    {showExistingStrategies
                                                        ? t("hide_strategies") || "Hide Strategies"
                                                        : t("show_strategies") || "Show Strategies"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        editingStrategyIndex === -1 ? handleAddStrategy : () => saveEditStrategy(editingStrategyIndex)
                                                    }
                                                    className="btn-ghost flex items-center gap-2 px-3 py-2"
                                                    disabled={!strategyInputEn.trim() && !strategyInputAr.trim()}
                                                >
                                                    <Plus size={14} />
                                                    {editingStrategyIndex === -1 ? t("add") || "Add" : t("save") || "Save"}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={
                                                    editingStrategyIndex === -1 ? handleAddStrategy : () => saveEditStrategy(editingStrategyIndex)
                                                }
                                                className="btn-ghost mt-2 flex items-center gap-2 px-3 py-2"
                                                disabled={!strategyInputEn.trim() && !strategyInputAr.trim()}
                                            >
                                                <Plus size={14} />
                                                {editingStrategyIndex === -1 ? t("add") || "Add" : t("save") || "Save"}
                                            </button>
                                        )}

                                        {/* Render existing strategies list when toggled */}
                                        {showExistingStrategies && (
                                            <div className="bg-light-50 dark:bg-dark-900 mt-3 space-y-2 rounded p-3">
                                                <p className="text-light-900 dark:text-dark-50 text-sm font-medium">
                                                    {t("existing_strategies") || "Existing strategies"}
                                                </p>
                                                {plans
                                                    .flatMap((p: any) => p.strategies || [])
                                                    .filter(Boolean)
                                                    .map((s: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className="text-light-900 dark:text-dark-50 text-sm"
                                                        >
                                                            {lang === "ar" ? s.ar || s.en : s.en || s.ar}
                                                        </div>
                                                    ))}
                                                <div className="mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const existing = plans.flatMap((p: any) => p.strategies || []);
                                                            // normalize to Bilingual shape
                                                            const normalized = existing.map((ex: any, i: number) => ({
                                                                id: `imported_${i}_${Date.now()}`,
                                                                en: ex.en || ex,
                                                                ar: ex.ar || ex,
                                                            }));
                                                            setStrategies(normalized);
                                                            setShowExistingStrategies(false);
                                                        }}
                                                        className="btn-ghost flex items-center gap-2 px-3 py-2"
                                                    >
                                                        {t("use_these") || "Use these"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {strategies.map((strat, idx) => (
                                        <div
                                            key={strat.id}
                                            className="border-light-600 dark:border-dark-700 dark:bg-dark-800 flex items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3"
                                        >
                                            <div className="flex-1">
                                                <div className="text-light-900 dark:text-dark-50 text-sm">
                                                    {lang === "ar" ? strat.ar || strat.en : strat.en || strat.ar}
                                                </div>
                                            </div>
                                            {isEditing && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditStrategy(idx)}
                                                        className="text-light-600 hover:text-light-900 dark:text-dark-400 dark:hover:text-dark-50"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeStrategy(idx)}
                                                        className="text-danger-500 hover:text-danger-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {strategies.length === 0 && !isEditing && (
                                        <p className="text-light-600 dark:text-dark-400 text-sm">
                                            {t("no_strategies") || "No strategies added yet."}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* objectives grid moved to ClientInfo for per-client overview */}

                            {/* Budget */}
                            <div className="card transition-colors duration-300">
                                <h3 className="card-title mb-4">{t("budget_usd")}</h3>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={planData.budget}
                                        onChange={(e) => setPlanData({ ...planData, budget: e.target.value })}
                                        placeholder="5000"
                                        disabled={!isEditing}
                                        className={`text-light-900 disabled:bg-light-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:disabled:bg-dark-800 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-full rounded-lg border bg-white py-3 pr-4 pl-8 transition-colors focus:outline-none ${planErrors.budget ? "border-danger-500" : "border-light-600"}`}
                                    />
                                    {planErrors.budget && <p className="text-danger-500 mt-1 text-sm">{planErrors.budget}</p>}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="card transition-colors duration-300">
                                <h3 className="card-title mb-4">{t("timeline")}</h3>
                                <input
                                    type="text"
                                    value={planData.timeline}
                                    onChange={(e) => setPlanData({ ...planData, timeline: e.target.value })}
                                    placeholder="e.g., 3 months, Q1 2025, Jan-Mar"
                                    disabled={!isEditing}
                                    className="border-light-600 text-light-900 disabled:bg-light-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:disabled:bg-dark-800 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-3 transition-colors focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Final Strategy Output */}
                        {finalStrategy && (
                            <div className="card">
                                <h3 className="card-title mb-4">{t("final_strategy_document")}</h3>
                                <div className="bg-dark-50 dark:bg-dark-800/50 rounded-lg p-4">
                                    <pre className="text-light-900 dark:text-dark-50 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                                        {finalStrategy}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </>
        </div>
    );
};

export default PlanningPage;
