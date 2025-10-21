import { useState, useEffect, useRef } from "react";
import { Save, Edit2, FileText, Check, Loader2 } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";

const PlanningPage = () => {
    const { t } = useLang();
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState(null);
    const [planData, setPlanData] = useState({
        objective: "",
        strategy: "",
        services: [],
        budget: "",
        timeline: "",
    });
    const [isEditing, setIsEditing] = useState(true);
    const [finalStrategy, setFinalStrategy] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [isTransitioning, setIsTransitioning] = useState(false);
    const isTransitioningRef = useRef(false); // Track transitions without causing re-render
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [overlayFadeIn, setOverlayFadeIn] = useState(false);
    const [planErrors, setPlanErrors] = useState({});

    // Available services options
    const availableServices = [
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

                // Load existing plan for this client
                const savedPlan = localStorage.getItem(`plan_${selectedClientId}`);
                if (savedPlan) {
                    const parsedPlan = JSON.parse(savedPlan);
                    setPlanData(parsedPlan);
                    setIsEditing(false);
                } else {
                    // Reset to empty plan
                    setPlanData({
                        objective: "",
                        strategy: "",
                        services: [],
                        budget: "",
                        timeline: "",
                    });
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

        // Save plan
        localStorage.setItem(`plan_${selectedClientId}`, JSON.stringify(planData));
        setIsEditing(false);
        setPlanErrors({});
        alert(t("plan_saved_success"));
    };

    const toggleService = (service) => {
        if (planData.services.includes(service)) {
            setPlanData({
                ...planData,
                services: planData.services.filter((s) => s !== service),
            });
        } else {
            setPlanData({
                ...planData,
                services: [...planData.services, service],
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
                        <p className="text-secondary-600 dark:text-secondary-400">{t("campaign_planning_subtitle")}</p>
                    </div>
                    {selectedClientId && (
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
                    )}
                </div>

                {/* Loading state handled by overlay loader; inline loaders removed */}
                {/* Client Selection Cards */}
                {!selectedClientId && !isResetting && !isLoading && !isTransitioning ? (
                    <div>
                        {clients.length > 0 ? (
                            <>
                                <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-lg font-semibold">
                                    {t("select_a_client_to_plan")}
                                </h2>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {clients.map((client) => (
                                        <div
                                            key={client.id}
                                            className="card hover:border-primary-500 transition-colors duration-300"
                                        >
                                            <h3 className="card-title text-lg">
                                                <span className="mr-2 text-sm font-semibold">{t("business_name_label")}</span>
                                                {client.business?.businessName || t("unnamed_client")}
                                            </h3>
                                            <p className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">
                                                <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                                                {client.business?.category || t("no_category")}
                                            </p>
                                            <div className="text-secondary-600 dark:text-secondary-400 mt-3 text-sm">
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
                                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">{t("no_clients_found")}</p>
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
                        <div className="card bg-secondary-50 dark:bg-secondary-800/50">
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
                                        <h2 className="text-secondary-900 dark:text-secondary-50 text-xl font-bold">
                                            <span className="mr-2 text-sm font-semibold">{t("business_name_label")}</span>
                                            {selectedClient.business?.businessName}
                                        </h2>
                                        <p className="text-secondary-600 dark:text-secondary-400 text-sm">
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
                                    className={`text-secondary-900 disabled:bg-secondary-100 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 dark:disabled:bg-secondary-900 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-3 transition-colors focus:outline-none ${planErrors.objective ? "border-danger-500" : "border-secondary-300"}`}
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
                                    className={`text-secondary-900 disabled:bg-secondary-100 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 dark:disabled:bg-secondary-900 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-3 transition-colors focus:outline-none ${planErrors.strategy ? "border-danger-500" : "border-secondary-300"}`}
                                />
                                {planErrors.strategy && <p className="text-danger-500 mt-1 text-sm">{planErrors.strategy}</p>}
                            </div>

                            {/* Services */}
                            <div className="card transition-colors duration-300 lg:col-span-2">
                                <h3 className="card-title mb-4">{t("services_to_provide")}</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {availableServices.map((service) => (
                                        <button
                                            key={service}
                                            onClick={() => toggleService(service)}
                                            disabled={!isEditing}
                                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                                                planData.services.includes(service)
                                                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-950 dark:text-primary-300"
                                                    : "dark:hover:bg-secondary-750 border-secondary-300 text-secondary-700 hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 bg-white"
                                            } ${!isEditing ? "cursor-not-allowed opacity-60" : ""}`}
                                        >
                                            {planData.services.includes(service) && (
                                                <Check
                                                    size={16}
                                                    className="flex-shrink-0"
                                                />
                                            )}
                                            <span className="truncate break-words">{t(service)}</span>
                                        </button>
                                    ))}
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
                                        className={`text-secondary-900 disabled:bg-secondary-100 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 dark:disabled:bg-secondary-900 focus:border-primary-500 w-full rounded-lg border bg-white py-3 pr-4 pl-8 transition-colors focus:outline-none ${planErrors.budget ? "border-danger-500" : "border-secondary-300"}`}
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
                                    className="border-secondary-300 text-secondary-900 disabled:bg-secondary-100 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 dark:disabled:bg-secondary-900 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-3 transition-colors focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Final Strategy Output */}
                        {finalStrategy && (
                            <div className="card">
                                <h3 className="card-title mb-4">{t("final_strategy_document")}</h3>
                                <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
                                    <pre className="text-secondary-900 dark:text-secondary-50 font-mono text-xs leading-relaxed whitespace-pre-wrap">
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
                    <Loader2 className="text-primary-500 relative h-12 w-12 animate-spin" />
                </div>
            )}
        </div>
    );
};

export default PlanningPage;
