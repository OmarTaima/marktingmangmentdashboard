import { useState, useEffect, useRef } from "react";
import { Save, Edit2, FileText, Check, Loader2, Plus, Trash2, Calendar } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";

const PlanningPage = () => {
    const { t, lang } = useLang();
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    type PlanData = {
        objective: string;
        strategy: string;
        services: string[];
        servicesPricing: Record<string, string>;
        budget: string;
        timeline: string;
        [key: string]: any;
    };

    const [planData, setPlanData] = useState<PlanData>({
        objective: "",
        strategy: "",
        services: [],
        servicesPricing: {},
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
    const [overlayVisible, setOverlayVisible] = useState<boolean>(false);
    const [overlayFadeIn, setOverlayFadeIn] = useState<boolean>(false);
    const [planErrors, setPlanErrors] = useState<Record<string, any>>({});

    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [customServiceInput, setCustomServiceInput] = useState<string>("");
    const [customServiceInputAr, setCustomServiceInputAr] = useState<string>("");
    const [customServicePrice, setCustomServicePrice] = useState<string>("");
    const [customServiceDiscount, setCustomServiceDiscount] = useState<string>("");
    const [customServiceDiscountType, setCustomServiceDiscountType] = useState<string>("percentage");
    const [customServiceQuantity, setCustomServiceQuantity] = useState<string>("");
    const [clientCustomServices, setClientCustomServices] = useState<any[]>([]); // per-client custom services

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

    // Load master services list from localStorage (services_master).
    useEffect(() => {
        try {
            const stored = localStorage.getItem("services_master");
            if (stored) {
                const parsed = JSON.parse(stored) || [];
                setAvailableServices(parsed);
            } else {
                // no master list saved yet — start with empty list
                setAvailableServices([]);
            }
        } catch (e) {
            // ignore and keep defaults
            setAvailableServices([]);
        }
    }, []);

    const handleAddCustomService = () => {
        const en = (customServiceInput || "").trim();
        const ar = (customServiceInputAr || "").trim();
        if (!en && !ar) return;
        // Avoid duplicates by English label (case-insensitive) across global and client-local services
        const combinedForDup = (availableServices || []).concat(clientCustomServices || []);
        if (
            combinedForDup.some((s) => {
                const svcEn = typeof s === "string" ? s : s.en || "";
                return svcEn.toLowerCase() === en.toLowerCase();
            })
        ) {
            setCustomServiceInput("");
            setCustomServiceInputAr("");
            return;
        }
        // Use the inline price input value instead of prompt/alert
        const price = (customServicePrice || "").toString().trim();
        if (!price) {
            // silently ignore invalid input (no alert as requested)
            return;
        }
        if (isNaN(Number(price))) {
            return;
        }

        // validate discount if provided
        const disc = (customServiceDiscount || "").toString().trim();
        if (disc) {
            if (isNaN(Number(disc))) return;
            const dnum = Number(disc);
            if (customServiceDiscountType === "percentage" && (dnum < 0 || dnum > 100)) return;
            if (customServiceDiscountType === "fixed" && dnum < 0) return;
        }

        // Get quantity - allow empty quantity (user may leave it unspecified)
        const qtyRaw = (customServiceQuantity || "").toString().trim();
        let quantity = "";
        if (qtyRaw !== "") {
            const qnum = Number(qtyRaw);
            if (!isNaN(qnum)) {
                // enforce minimum of 1 when a number is provided
                quantity = String(Math.max(1, Math.floor(qnum)));
            } else {
                // non-numeric -> leave empty
                quantity = "";
            }
        }

        if (!selectedClientId) return; // ensure we have a client to attach to

        const newItem = {
            id: `svc_${Date.now()}`,
            en: en || ar,
            ar: ar || en,
            price,
            quantity: String(quantity),
            discount: disc || "",
            discountType: customServiceDiscountType || "percentage",
        };
        // Save this custom service only for the current client
        const updated = [...(clientCustomServices || []), newItem];
        setClientCustomServices(updated);
        try {
            localStorage.setItem(`services_custom_${selectedClientId}`, JSON.stringify(updated));
        } catch (e) {}

        // Also add it to the current plan (selected) so it's immediately selected for this client
        const identifier = newItem.en || newItem.id;
        setPlanData((prev) => ({
            ...prev,
            services: [...(prev.services || []), identifier],
            servicesPricing: { ...(prev.servicesPricing || {}), [identifier]: price },
        }));

        setCustomServiceInput("");
        setCustomServiceInputAr("");
        setCustomServicePrice("");
        setCustomServiceDiscount("");
        setCustomServiceDiscountType("percentage");
        setCustomServiceQuantity("");
    };

    const removeClientCustomService = (serviceId: string) => {
        if (!selectedClientId) return;
        if (!confirm(t("confirm_delete_service") || "Delete this custom service?")) return;
        try {
            const remaining = (clientCustomServices || []).filter((s) => s.id !== serviceId);
            setClientCustomServices(remaining);
            localStorage.setItem(`services_custom_${selectedClientId}`, JSON.stringify(remaining));
            // remove from current plan if selected
            setPlanData((prev) => {
                const services = (prev.services || []).filter(
                    (x) => x !== serviceId && x !== (prev.servicesPricing && prev.servicesPricing[serviceId] ? serviceId : null),
                );
                const pricing = { ...(prev.servicesPricing || {}) };
                if (Object.prototype.hasOwnProperty.call(pricing, serviceId)) delete pricing[serviceId];
                return { ...prev, services, servicesPricing: pricing };
            });
        } catch (e) {
            // ignore
        }
    };

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
        // Load clients on mount
        loadClients();
        // If a client was selected from another page (e.g. Clients->Plan), preselect it
        const preselected = localStorage.getItem("selectedClientId");
        if (preselected) {
            setSelectedClientId(preselected);
            // optional: keep it in storage so other flows can reuse it; if you prefer to clear it uncomment next line
            // localStorage.removeItem("selectedClientId");
        }
        // Small delay before showing content to prevent flash
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // load per-client custom services when selectedClientId changes
    useEffect(() => {
        if (!selectedClientId) {
            setClientCustomServices([]);
            return;
        }
        try {
            const stored = localStorage.getItem(`services_custom_${selectedClientId}`);
            if (stored) {
                setClientCustomServices(JSON.parse(stored) || []);
            } else {
                setClientCustomServices([]);
            }
        } catch (e) {
            setClientCustomServices([]);
        }
    }, [selectedClientId]);

    // helper to compute final price for a service in the plan after applying any service-level discount
    const finalPriceFor = (identifier: string) => {
        const combined = (availableServices || []).concat(clientCustomServices || []);
        const found = combined.find((s) => {
            if (!s) return false;
            if (typeof s === "string") return s === identifier;
            return s.id === identifier || s.en === identifier || s.ar === identifier;
        });
        const base = Number((planData.servicesPricing && planData.servicesPricing[identifier]) || (found ? found.price || 0 : 0)) || 0;
        let svcDiscountAmount = 0;
        let svcDiscountType = "";
        if (found && found.discount) {
            const d = Number(found.discount || 0);
            svcDiscountType = found.discountType || "percentage";
            if (!isNaN(d) && d !== 0) {
                if (svcDiscountType === "percentage") svcDiscountAmount = (base * d) / 100;
                else svcDiscountAmount = d;
            }
        }
        return Math.max(0, base - svcDiscountAmount);
    };

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
                loadClientAndPlan();
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

    const loadClients = () => {
        const stodangerClients = localStorage.getItem("clients");
        if (stodangerClients) {
            const clientsList = JSON.parse(stodangerClients);
            setClients(clientsList);
        }
    };

    const loadClientAndPlan = () => {
        const stodangerClients = localStorage.getItem("clients");
        if (stodangerClients) {
            const clientsList = JSON.parse(stodangerClients);
            const client = clientsList.find((c: any) => c.id === selectedClientId);

            if (client) {
                setSelectedClient(client);

                // Load existing plans for this client (support multiple plans)
                const savedPlans = localStorage.getItem(`plans_${selectedClientId}`);
                if (savedPlans) {
                    try {
                        const parsed = JSON.parse(savedPlans) || [];
                        setPlans(parsed);
                        if (parsed.length > 0) {
                            // pick first plan by default
                            setSelectedPlanId(parsed[0].id);
                            setPlanData(parsed[0]);
                            // Load objectives and strategies from the plan
                            setObjectives(parsed[0].objectives || []);
                            setStrategies(parsed[0].strategies || []);
                            setIsEditing(false);
                        } else {
                            // no plans, reset to empty
                            setPlans([]);
                            setSelectedPlanId("");
                            setPlanData({ objective: "", strategy: "", services: [], servicesPricing: {}, budget: "", timeline: "" });
                            setObjectives([]);
                            setStrategies([]);
                            setIsEditing(true);
                        }
                    } catch (e) {
                        setPlans([]);
                        setSelectedPlanId("");
                        setPlanData({ objective: "", strategy: "", services: [], servicesPricing: {}, budget: "", timeline: "" });
                        setObjectives([]);
                        setStrategies([]);
                        setIsEditing(true);
                    }
                } else {
                    setPlans([]);
                    setSelectedPlanId("");
                    setPlanData({ objective: "", strategy: "", services: [], servicesPricing: {}, budget: "", timeline: "" });
                    setObjectives([]);
                    setStrategies([]);
                    setIsEditing(true);
                }
            }
        }
    };

    const handleSavePlan = () => {
        console.log("handleSavePlan called", { selectedClientId, planData, objectives, strategies });

        if (!selectedClientId) {
            alert(t("please_select_client_first"));
            console.warn("handleSavePlan: no selectedClientId");
            return;
        }

        // Prepare a local copy of planData that merges list-based objectives/strategies
        const toSave = { ...planData };
        if (!toSave.objective || !toSave.objective.trim()) {
            if (objectives && objectives.length > 0) {
                // join English values (fallback to Arabic) into a single summary string for legacy fields
                toSave.objective = objectives
                    .map((o) => o.en || o.ar || "")
                    .filter(Boolean)
                    .join(" | ");
            }
        }
        if (!toSave.strategy || !toSave.strategy.trim()) {
            if (strategies && strategies.length > 0) {
                toSave.strategy = strategies
                    .map((s) => s.en || s.ar || "")
                    .filter(Boolean)
                    .join(" | ");
            }
        }

        // No required fields: allow saving even if objective/strategy/budget are empty
        // Clear any previous errors
        setPlanErrors({});

        // Save plan to plans_{clientId}
        const savedPlans = localStorage.getItem(`plans_${selectedClientId}`);
        let parsed = [];
        try {
            parsed = savedPlans ? JSON.parse(savedPlans) : [];
        } catch (e) {
            parsed = [];
        }

        if (selectedPlanId) {
            // update existing plan
            const idx = parsed.findIndex((p: any) => p.id === selectedPlanId);
            if (idx !== -1) {
                parsed[idx] = { ...parsed[idx], ...toSave, objectives, strategies, id: selectedPlanId };
            } else {
                parsed.push({ ...toSave, objectives, strategies, id: selectedPlanId });
            }
        } else {
            // create new plan
            const newId = `plan_${Date.now()}`;
            parsed.push({ ...toSave, objectives, strategies, id: newId });
            setSelectedPlanId(newId);
        }

        try {
            localStorage.setItem(`plans_${selectedClientId}`, JSON.stringify(parsed));
        } catch (e) {
            console.error("Failed to save plan:", e);
            alert(t("save_failed") || "Failed to save plan.");
            return;
        }

        setPlans(parsed);
        // update in-memory planData to the merged version we saved
        setPlanData(toSave);
        setIsEditing(false);
        setPlanErrors({});
        // clear any transient draft saved while editing
        try {
            localStorage.removeItem(`plan_draft_${selectedClientId}`);
        } catch (e) {}
        alert(t("plan_saved_success"));
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

    const handleDeletePlan = (planId: string) => {
        if (!confirm(t("confirm_delete_plan") || "Delete this plan?")) return;
        const updated = plans.filter((p: any) => p.id !== planId);
        try {
            localStorage.setItem(`plans_${selectedClientId}`, JSON.stringify(updated));
        } catch (e) {}
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
    };

    const toggleService = (service: string) => {
        if (planData.services.includes(service)) {
            // simply unselect the service (remove from the plan) and remove its price from the plan pricing map
            const newServices = planData.services.filter((s) => s !== service);
            const newPricing = { ...(planData.servicesPricing || {}) };
            if (Object.prototype.hasOwnProperty.call(newPricing, service)) delete newPricing[service];

            setPlanData({
                ...planData,
                services: newServices,
                servicesPricing: newPricing,
            });
        } else {
            // add service and initialize its price from master list if available
            let defaultPrice = "";
            try {
                const combined = (availableServices || []).concat(clientCustomServices || []);
                const found = combined.find((s: any) => {
                    if (!s) return false;
                    if (typeof s === "string") return s === service;
                    return s.en === service || s.ar === service || s.id === service;
                });
                if (found && typeof found === "object") defaultPrice = found.price || "";
            } catch (e) {}

            setPlanData({
                ...planData,
                services: [...planData.services, service],
                servicesPricing: { ...(planData.servicesPricing || {}), [service]: defaultPrice },
            });
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

                {/* Loading state handled by overlay loader; inline loaders removed */}
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
                                                    setOverlayVisible(true);
                                                    setTimeout(() => setOverlayFadeIn(true), 10);
                                                    setTimeout(() => {
                                                        try {
                                                            localStorage.setItem("selectedClientId", String(client.id));
                                                        } catch (e) {}
                                                        setSelectedClientId(String(client.id));
                                                    }, 120);
                                                    setTimeout(() => setOverlayFadeIn(false), 380);
                                                    setTimeout(() => {
                                                        setOverlayVisible(false);
                                                        isTransitioningRef.current = false;
                                                    }, 480);
                                                }}
                                                className="btn-primary mt-4 w-full"
                                            >
                                                {t("plan_button")}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="card">
                                <div className="py-8 text-center">
                                    <p className="text-light-600 dark:text-dark-400 mb-4">{t("no_clients_found")}</p>
                                    <a
                                        href="/onboarding"
                                        className="btn-primary"
                                    >
                                        {t("add_your_first_client")}
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}

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
                                            setOverlayVisible(true);
                                            setTimeout(() => setOverlayFadeIn(true), 10);
                                            setTimeout(() => {
                                                try {
                                                    localStorage.removeItem("selectedClientId");
                                                } catch (e) {}
                                                setSelectedClientId("");
                                            }, 120);
                                            setTimeout(() => setOverlayFadeIn(false), 380);
                                            setTimeout(() => {
                                                setOverlayVisible(false);
                                                isTransitioningRef.current = false;
                                            }, 480);
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
                                                placeholder={t("objective_ar") || "الهدف (بالعربية)"}
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
                                                placeholder={t("strategy_ar") || "الاستراتيجية (بالعربية)"}
                                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={editingStrategyIndex === -1 ? handleAddStrategy : () => saveEditStrategy(editingStrategyIndex)}
                                            className="btn-ghost mt-2 flex items-center gap-2 px-3 py-2"
                                            disabled={!strategyInputEn.trim() && !strategyInputAr.trim()}
                                        >
                                            <Plus size={14} />
                                            {editingStrategyIndex === -1 ? t("add") || "Add" : t("save") || "Save"}
                                        </button>
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

                            {/* Services */}
                            <div className="card transition-colors duration-300 lg:col-span-2">
                                <h3 className="card-title mb-4">{t("services_to_provide")}</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {(availableServices || []).concat(clientCustomServices || []).map((service) => {
                                        const identifier = typeof service === "string" ? service : service.en || "";
                                        const label =
                                            typeof service === "string"
                                                ? t(service)
                                                : lang === "ar"
                                                  ? service.ar || service.en
                                                  : service.en || service.ar;
                                        const price = typeof service === "string" ? "" : service.price || "";
                                        const isSelected = planData.services.includes(identifier);
                                        const isCustom =
                                            typeof service !== "string" &&
                                            service.id &&
                                            (clientCustomServices || []).some((cs) => cs.id === service.id);
                                        return (
                                            <div
                                                key={identifier}
                                                className="flex flex-col items-stretch"
                                            >
                                                <div
                                                    role="button"
                                                    tabIndex={isEditing ? 0 : -1}
                                                    onClick={() => isEditing && toggleService(identifier)}
                                                    onKeyDown={(e) => {
                                                        if (!isEditing) return;
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            toggleService(identifier);
                                                        }
                                                    }}
                                                    aria-disabled={!isEditing}
                                                    className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                                                        isSelected
                                                            ? "border-light-500 bg-light-500 dark:border-secdark-600 dark:bg-secdark-600 dark:text-dark-50 text-white"
                                                            : "border-light-600 text-light-900 hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 bg-white"
                                                    } ${!isEditing ? "cursor-not-allowed opacity-60" : ""}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isSelected && (
                                                            <Check
                                                                size={16}
                                                                className="flex-shrink-0"
                                                            />
                                                        )}
                                                        <div className="flex-1">
                                                            <span className="truncate break-words">{label}</span>
                                                            {typeof service !== "string" && service.quantity ? (
                                                                <div className="text-light-600 dark:text-dark-400 text-xs">{`${t("quantity") || "Qty"}: ${service.quantity}`}</div>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {!isSelected && price ? (
                                                            <div className="text-light-600 dark:text-dark-600 text-sm">{`${finalPriceFor(identifier)} ${lang === "ar" ? "ج.م" : "EGP"}`}</div>
                                                        ) : null}

                                                        {isSelected ? (
                                                            <div className="text-light-600 dark:text-dark-600 text-sm">
                                                                {finalPriceFor(identifier)
                                                                    ? `${finalPriceFor(identifier)} ${lang === "ar" ? "ج.م" : "EGP"}`
                                                                    : null}
                                                            </div>
                                                        ) : null}

                                                        {/* render delete button inside the card for client-custom services */}
                                                        {isCustom && isEditing ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeClientCustomService(service.id);
                                                                }}
                                                                aria-label={t("delete_custom_service") || "Delete custom service"}
                                                                title={t("delete_custom_service") || "Delete custom service"}
                                                                className="text-danger-500 ml-2 flex-shrink-0 rounded-none border-0 bg-transparent p-0 hover:bg-transparent"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Add custom service input — two-row layout: names on top, qty/price/discount/add on bottom */}
                                <div className="mt-3">
                                    <div className="grid gap-2">
                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                            <input
                                                type="text"
                                                value={customServiceInput}
                                                onChange={(e) => setCustomServiceInput(e.target.value)}
                                                placeholder={t("add_custom_service_placeholder") || "Add custom service..."}
                                                disabled={!isEditing}
                                                className="border-light-600 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={customServiceInputAr}
                                                onChange={(e) => setCustomServiceInputAr(e.target.value)}
                                                placeholder={t("custom_service_ar") || "خدمة مخصصة..."}
                                                disabled={!isEditing}
                                                className="border-light-600 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
                                            />
                                            <input
                                                type="number"
                                                value={customServiceQuantity}
                                                onChange={(e) => setCustomServiceQuantity(e.target.value)}
                                                placeholder={t("quantity") || "Quantity"}
                                                disabled={!isEditing}
                                                className="border-light-600 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={customServicePrice}
                                                    onChange={(e) => setCustomServicePrice(e.target.value)}
                                                    placeholder={t("service_price") || "Price"}
                                                    disabled={!isEditing}
                                                    className="border-light-600 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
                                                />
                                                <div className="text-light-600 dark:text-dark-600 text-sm whitespace-nowrap">
                                                    {lang === "ar" ? "ج.م" : "EGP"}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={customServiceDiscountType}
                                                    onChange={(e) => setCustomServiceDiscountType(e.target.value)}
                                                    disabled={!isEditing}
                                                    className="border-light-600 focus:border-light-500 dark:border-dark-700 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 w-full appearance-none rounded-lg border bg-transparent px-2 py-2 text-sm focus:outline-none md:w-32"
                                                    style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                                                >
                                                    <option
                                                        value="percentage"
                                                        className="text-light-900 dark:text-dark-50 dark:bg-dark-800 bg-white"
                                                    >
                                                        {t("percentage") || "%"}
                                                    </option>
                                                    <option
                                                        value="fixed"
                                                        className="text-light-900 dark:text-dark-50 dark:bg-dark-800 bg-white"
                                                    >
                                                        {t("fixed") || "Fixed"}
                                                    </option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={customServiceDiscount}
                                                    onChange={(e) => setCustomServiceDiscount(e.target.value)}
                                                    placeholder={t("discount_optional") || "Discount"}
                                                    disabled={!isEditing}
                                                    className="border-light-600 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 w-full rounded-lg border bg-white px-2 py-2 text-sm focus:outline-none md:w-24"
                                                />
                                            </div>

                                            <div className="flex items-center justify-end">
                                                <button
                                                    type="button"
                                                    onClick={handleAddCustomService}
                                                    disabled={
                                                        !isEditing ||
                                                        (!customServiceInput.trim() && !customServiceInputAr.trim()) ||
                                                        !customServicePrice.toString().trim() ||
                                                        isNaN(Number(customServicePrice))
                                                    }
                                                    className="btn-ghost flex items-center justify-center gap-2 px-3 py-2"
                                                >
                                                    <Plus size={14} />
                                                    {t("add")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

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

            {overlayVisible && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${overlayFadeIn ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
                >
                    <div className="absolute inset-0 bg-black/40" />
                    <Loader2 className="text-light-500 relative h-12 w-12 animate-spin" />
                </div>
            )}
        </div>
    );
};

export default PlanningPage;
