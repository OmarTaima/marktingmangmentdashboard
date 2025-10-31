import { useState, useEffect, useRef } from "react";
import { Save, Edit2, FileText, Check, Loader2, Plus, Trash2, Calendar } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";

const PlanningPage = () => {
    const { t, lang } = useLang();
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState(null);
    const [planData, setPlanData] = useState({
        objective: "",
        strategy: "",
        services: [],
        servicesPricing: {},
        budget: "",
        timeline: "",
    });
    const [plans, setPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [isEditing, setIsEditing] = useState(true);
    const [finalStrategy, setFinalStrategy] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [isTransitioning, setIsTransitioning] = useState(false);
    const isTransitioningRef = useRef(false); // Track transitions without causing re-render
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [overlayFadeIn, setOverlayFadeIn] = useState(false);
    const [planErrors, setPlanErrors] = useState({});

    // Services master list (persisted). Initialize with defaults if missing.
    const INITIAL_SERVICES = [
        "Social Media Management",
        "Content Creation",
        "Paid Advertising",
        "SEO Optimization",
        "Email Marketing",
        "Influencer Marketing",
        "Video Production",
        "Photography",
        "Graphic Design",
        "Analytics & Reporting",
        "Community Management",
        "Brand Strategy",
    ];

    const [availableServices, setAvailableServices] = useState(INITIAL_SERVICES);
    const [customServiceInput, setCustomServiceInput] = useState("");
    const [customServicePrice, setCustomServicePrice] = useState("");
    const [clientCustomServices, setClientCustomServices] = useState([]); // per-client custom services

    // Load master services list from localStorage (services_master). If missing, seed with INITIAL_SERVICES
    useEffect(() => {
        try {
            const stored = localStorage.getItem("services_master");
            if (stored) {
                const parsed = JSON.parse(stored) || [];
                setAvailableServices(parsed);
            } else {
                localStorage.setItem("services_master", JSON.stringify(INITIAL_SERVICES));
                setAvailableServices(INITIAL_SERVICES);
            }
        } catch (e) {
            // ignore and keep defaults
            setAvailableServices(INITIAL_SERVICES);
        }
    }, []);

    const handleAddCustomService = () => {
        const val = (customServiceInput || "").trim();
        if (!val) return;
        // Avoid duplicates by English label (case-insensitive) across global and client-local services
        const combinedForDup = (availableServices || []).concat(clientCustomServices || []);
        if (
            combinedForDup.some((s) => {
                const en = typeof s === "string" ? s : s.en || "";
                return en.toLowerCase() === val.toLowerCase();
            })
        ) {
            setCustomServiceInput("");
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

        if (!selectedClientId) return; // ensure we have a client to attach to

        const newItem = { id: `svc_${Date.now()}`, en: val, ar: "", price };
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
        setCustomServicePrice("");
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
            const client = clientsList.find((c) => c.id === selectedClientId);

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
                            setIsEditing(false);
                        } else {
                            // no plans, reset to empty
                            setPlans([]);
                            setSelectedPlanId("");
                            setPlanData({ objective: "", strategy: "", services: [], budget: "", timeline: "" });
                            setIsEditing(true);
                        }
                    } catch (e) {
                        setPlans([]);
                        setSelectedPlanId("");
                        setPlanData({ objective: "", strategy: "", services: [], servicesPricing: {}, budget: "", timeline: "" });
                        setIsEditing(true);
                    }
                } else {
                    setPlans([]);
                    setSelectedPlanId("");
                    setPlanData({ objective: "", strategy: "", services: [], servicesPricing: {}, budget: "", timeline: "" });
                    setIsEditing(true);
                }
            }
        }
    };

    const handleSavePlan = () => {
        if (!selectedClientId) {
            alert(t("please_select_client_first"));
            return;
        }

        // Validate required fields
        const errors = {};
        if (!planData.objective?.trim()) errors.objective = t("please_fill_required_fields");
        if (!planData.strategy?.trim()) errors.strategy = t("please_fill_required_fields");
        if (planData.budget && Number(planData.budget) <= 0) errors.budget = t("invalid_budget");

        if (Object.keys(errors).length > 0) {
            setPlanErrors(errors);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

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
            const idx = parsed.findIndex((p) => p.id === selectedPlanId);
            if (idx !== -1) {
                parsed[idx] = { ...parsed[idx], ...planData, id: selectedPlanId };
            } else {
                parsed.push({ ...planData, id: selectedPlanId });
            }
        } else {
            // create new plan
            const newId = `plan_${Date.now()}`;
            parsed.push({ ...planData, id: newId });
            setSelectedPlanId(newId);
        }

        localStorage.setItem(`plans_${selectedClientId}`, JSON.stringify(parsed));
        setPlans(parsed);
        setIsEditing(false);
        setPlanErrors({});
        alert(t("plan_saved_success"));
    };

    const handleCreateNewPlan = () => {
        const newPlan = { id: `plan_${Date.now()}`, objective: "", strategy: "", services: [], servicesPricing: {}, budget: "", timeline: "" };
        const updated = [...plans, newPlan];
        try {
            localStorage.setItem(`plans_${selectedClientId}`, JSON.stringify(updated));
        } catch (e) {}
        setPlans(updated);
        setSelectedPlanId(newPlan.id);
        setPlanData(newPlan);
        setIsEditing(true);
    };

    const handleSelectPlan = (planId) => {
        const plan = plans.find((p) => p.id === planId);
        if (plan) {
            setSelectedPlanId(planId);
            // ensure servicesPricing exists on loaded plan
            setPlanData({ ...plan, servicesPricing: plan.servicesPricing || {} });
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

    const handleDeletePlan = (planId) => {
        if (!confirm(t("confirm_delete_plan") || "Delete this plan?")) return;
        const updated = plans.filter((p) => p.id !== planId);
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
                setIsEditing(true);
            }
        }
    };

    const toggleService = (service) => {
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
                const found = combined.find((s) => {
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

    const updateServicePrice = (service, value) => {
        setPlanData((prev) => ({ ...prev, servicesPricing: { ...(prev.servicesPricing || {}), [service]: value } }));
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
                        <p className="text-primary-light-600 dark:text-dark-400">{t("campaign_planning_subtitle")}</p>
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
                                                                : "bg-primary-light-100 text-dark-800 dark:bg-dark-700 dark:text-primary-dark-600"
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
                                            <p className="text-primary-light-600 dark:text-dark-400 mt-1 text-sm">
                                                <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                                                {client.business?.category || t("no_category")}
                                            </p>
                                            <div className="text-primary-light-600 dark:text-dark-400 mt-3 text-sm">
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
                                    <p className="text-primary-light-600 dark:text-dark-400 mb-4">{t("no_clients_found")}</p>
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
                                        <p className="text-primary-light-600 dark:text-dark-400 text-sm">
                                            <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                                            {selectedClient.business?.category}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Planning Form */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Objective */}
                            <div className="card transition-colors duration-300 lg:col-span-2">
                                <h3 className="card-title mb-4">{t("campaign_objective")}</h3>
                                <textarea
                                    value={planData.objective}
                                    onChange={(e) => setPlanData({ ...planData, objective: e.target.value })}
                                    placeholder={t("objective_placeholder")}
                                    rows={4}
                                    disabled={!isEditing}
                                    className={`text-light-900 disabled:bg-primary-light-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:disabled:bg-light-900 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-3 transition-colors focus:outline-none ${planErrors.objective ? "border-danger-500" : "border-primary-light-600"}`}
                                />
                                {planErrors.objective && <p className="text-danger-500 mt-1 text-sm">{planErrors.objective}</p>}
                            </div>

                            {/* Strategy */}
                            <div className="card transition-colors duration-300 lg:col-span-2">
                                <h3 className="card-title mb-4">{t("strategic_approach")}</h3>
                                <textarea
                                    value={planData.strategy}
                                    onChange={(e) => setPlanData({ ...planData, strategy: e.target.value })}
                                    placeholder={t("strategy_placeholder")}
                                    rows={6}
                                    disabled={!isEditing}
                                    className={`text-light-900 disabled:bg-primary-light-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:disabled:bg-light-900 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-3 transition-colors focus:outline-none ${planErrors.strategy ? "border-danger-500" : "border-primary-light-600"}`}
                                />
                                {planErrors.strategy && <p className="text-danger-500 mt-1 text-sm">{planErrors.strategy}</p>}
                            </div>

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
                                        return (
                                            <div
                                                key={identifier}
                                                className="flex flex-col items-stretch"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => toggleService(identifier)}
                                                    disabled={!isEditing}
                                                    className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                                                        isSelected
                                                            ? "border-light-500 bg-light-50 text-light-300 dark:border-primary-dark-400 dark:bg-dark-950 dark:text-dark-300"
                                                            : "dark:hover:bg-secondary-750 border-primary-light-600 text-dark-700 hover:bg-dark-50 dark:border-dark-700 dark:bg-dark-800 dark:text-primary-dark-600 bg-white"
                                                    } ${!isEditing ? "cursor-not-allowed opacity-60" : ""}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isSelected && (
                                                            <Check
                                                                size={16}
                                                                className="flex-shrink-0"
                                                            />
                                                        )}
                                                        <span className="truncate break-words">{label}</span>
                                                    </div>
                                                    {/* show static price when not selected, otherwise show inline input */}
                                                    <div className="flex items-center gap-2">
                                                        {!isSelected && price ? (
                                                            <div className="text-primary-light-600 text-sm">{`${price} ${lang === "ar" ? "ج.م" : "EGP"}`}</div>
                                                        ) : null}

                                                        {isSelected ? (
                                                            <div className="text-primary-light-600 text-sm">
                                                                {(planData.servicesPricing && planData.servicesPricing[identifier]) || price
                                                                    ? `${(planData.servicesPricing && planData.servicesPricing[identifier]) || price} ${lang === "ar" ? "ج.م" : "EGP"}`
                                                                    : null}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Add custom service input */}
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={customServiceInput}
                                        onChange={(e) => setCustomServiceInput(e.target.value)}
                                        placeholder={t("add_custom_service_placeholder") || "Add custom service..."}
                                        disabled={!isEditing}
                                        className="border-primary-light-600 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={customServicePrice}
                                            onChange={(e) => setCustomServicePrice(e.target.value)}
                                            placeholder={t("service_price") || "Price"}
                                            disabled={!isEditing}
                                            className="border-primary-light-600 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 w-24 rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
                                        />
                                        <div className="text-primary-light-600 text-sm">{lang === "ar" ? "ج.م" : "EGP"}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddCustomService}
                                        disabled={
                                            !isEditing ||
                                            !customServiceInput.trim() ||
                                            !customServicePrice.toString().trim() ||
                                            isNaN(Number(customServicePrice))
                                        }
                                        className="btn-ghost flex items-center gap-2 px-3 py-2"
                                    >
                                        <Plus size={14} />
                                        {t("add")}
                                    </button>
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
                                        className={`text-light-900 disabled:bg-primary-light-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:disabled:bg-light-900 focus:border-light-500 w-full rounded-lg border bg-white py-3 pr-4 pl-8 transition-colors focus:outline-none ${planErrors.budget ? "border-danger-500" : "border-primary-light-600"}`}
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
                                    className="border-primary-light-600 text-light-900 disabled:bg-primary-light-100 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 dark:disabled:bg-light-900 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-3 transition-colors focus:outline-none"
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
