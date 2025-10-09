import { useState, useEffect, useRef } from "react";
import { Save, Edit2, FileText, Check, ArrowLeft, Loader2 } from "lucide-react";

const PlanningPage = () => {
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState("");
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

    useEffect(() => {
        if (selectedClient && planData.objective && planData.strategy) {
            generateFinalStrategy();
        }
    }, [selectedClient, planData]);

    const loadClients = () => {
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            const clientsList = JSON.parse(storedClients);
            setClients(clientsList);
        }
    };

    const loadClientAndPlan = () => {
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            const clientsList = JSON.parse(storedClients);
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

    const generateFinalStrategy = () => {
        if (!selectedClient) return;

        const client = selectedClient;
        const plan = planData;

        const strategy = `
MARKETING STRATEGY DOCUMENT
═══════════════════════════════════════════

CLIENT INFORMATION
─────────────────
Business Name: ${client.business?.businessName || "N/A"}
Category: ${client.business?.category || "N/A"}
Contact Person: ${client.personal?.fullName || "N/A"}
Email: ${client.contact?.businessEmail || client.personal?.email || "N/A"}
Phone: ${client.contact?.businessPhone || client.personal?.phone || "N/A"}

CAMPAIGN OBJECTIVE
─────────────────
${plan.objective || "No objective defined yet"}

TARGET SEGMENTS
─────────────────
${
    client.segments && client.segments.length > 0
        ? client.segments
              .map(
                  (seg, i) =>
                      `${i + 1}. ${seg.name}${seg.targetAge ? ` (Age: ${seg.targetAge})` : ""}${seg.targetGender ? ` (Gender: ${seg.targetGender})` : ""}\n   ${seg.description || ""}`,
              )
              .join("\n")
        : "No target segments defined"
}

SWOT ANALYSIS
─────────────────
Strengths:
${client.swot?.strengths && client.swot.strengths.length > 0 ? client.swot.strengths.map((s, i) => `  ${i + 1}. ${s}`).join("\n") : "  • Not defined"}

Weaknesses:
${
    client.swot?.weaknesses && client.swot.weaknesses.length > 0
        ? client.swot.weaknesses.map((w, i) => `  ${i + 1}. ${w}`).join("\n")
        : "  • Not defined"
}

Opportunities:
${
    client.swot?.opportunities && client.swot.opportunities.length > 0
        ? client.swot.opportunities.map((o, i) => `  ${i + 1}. ${o}`).join("\n")
        : "  • Not defined"
}

Threats:
${client.swot?.threats && client.swot.threats.length > 0 ? client.swot.threats.map((t, i) => `  ${i + 1}. ${t}`).join("\n") : "  • Not defined"}

COMPETITIVE LANDSCAPE
─────────────────
${
    client.competitors && client.competitors.length > 0
        ? client.competitors
              .map((comp, i) => `${i + 1}. ${comp.name}\n   ${comp.description || ""}\n   ${comp.website ? `Website: ${comp.website}` : ""}`)
              .join("\n\n")
        : "No competitors tracked"
}

STRATEGIC APPROACH
─────────────────
${plan.strategy || "No strategy defined yet"}

SERVICES TO BE PROVIDED
─────────────────
${plan.services && plan.services.length > 0 ? plan.services.map((s, i) => `  ${i + 1}. ${s}`).join("\n") : "  • No services selected"}

BUDGET & TIMELINE
─────────────────
Budget: ${plan.budget ? `$${plan.budget} USD` : "Not specified"}
Timeline: ${plan.timeline || "Not specified"}

SOCIAL MEDIA PRESENCE
─────────────────
${
    client.socialLinks?.business && client.socialLinks.business.length > 0
        ? client.socialLinks.business.map((link) => `${link.platform}: ${link.url}`).join("\n")
        : "No social media links provided"
}

KEY PERFORMANCE INDICATORS
─────────────────
• Engagement Rate
• Reach & Impressions
• Follower Growth
• Conversion Rate
• Content Performance
• ROI Tracking

DELIVERABLES & MILESTONES
─────────────────
Based on the selected services and timeline, deliverables will be tracked through the Campaigns section.

═══════════════════════════════════════════
Document Generated: ${new Date().toLocaleDateString()}
        `.trim();

        setFinalStrategy(strategy);
    };

    const handleSavePlan = () => {
        if (!selectedClientId) {
            alert("Please select a client first");
            return;
        }

        // Save plan
        localStorage.setItem(`plan_${selectedClientId}`, JSON.stringify(planData));
        setIsEditing(false);
        alert("✅ Plan saved successfully!");
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
        <div className="space-y-6">
            {/* Show loading on initial mount or during transitions */}
            {isLoading && !selectedClient && !selectedClientId ? (
                <div className="flex min-h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="title">Campaign Planning</h1>
                            <p className="text-slate-600 dark:text-slate-400">Create strategic plans for your clients</p>
                        </div>
                        {selectedClientId && (
                            <div className="flex gap-2">
                                {!isEditing && finalStrategy && (
                                    <button
                                        onClick={handleDownload}
                                        className="btn-ghost flex items-center gap-2"
                                    >
                                        <FileText size={16} />
                                        Download Strategy
                                    </button>
                                )}
                                {isEditing ? (
                                    <button
                                        onClick={handleSavePlan}
                                        className="btn-primary flex items-center gap-2"
                                        disabled={!selectedClientId}
                                    >
                                        <Save size={16} />
                                        Save Plan
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Edit2 size={16} />
                                        Edit Plan
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {(isLoading || isTransitioning) && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    )}

                    {/* Client Selection Cards */}
                    {!selectedClientId && !isResetting && !isLoading && !isTransitioning ? (
                        <div>
                            {clients.length > 0 ? (
                                <>
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">Select a Client to Plan</h2>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {clients.map((client) => (
                                            <div
                                                key={client.id}
                                                className="card transition-all hover:border-blue-500"
                                            >
                                                <h3 className="card-title text-lg">{client.business?.businessName || "Unnamed Client"}</h3>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                    {client.business?.category || "No Category"}
                                                </p>
                                                <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                                                    <p>Contact: {client.personal?.fullName || "N/A"}</p>
                                                    <p>Email: {client.contact?.businessEmail || client.personal?.email || "N/A"}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedClientId(client.id)}
                                                    className="btn-primary mt-4 w-full"
                                                >
                                                    Plan
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="card">
                                    <div className="py-8 text-center">
                                        <p className="mb-4 text-slate-600 dark:text-slate-400">No clients found</p>
                                        <a
                                            href="/onboarding"
                                            className="btn-primary"
                                        >
                                            Add Your First Client
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {selectedClient && !isLoading && !isTransitioning && (
                        <>
                            {/* Client Info Header */}
                            <div className="card bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedClientId("")}
                                            className="btn-ghost"
                                        >
                                            <ArrowLeft size={20} />
                                        </button>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                                {selectedClient.business?.businessName}
                                            </h2>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedClient.business?.category}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Planning Form */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {/* Objective */}
                                <div className="card lg:col-span-2">
                                    <h3 className="card-title mb-4">Campaign Objective</h3>
                                    <textarea
                                        value={planData.objective}
                                        onChange={(e) => setPlanData({ ...planData, objective: e.target.value })}
                                        placeholder="What are the main goals for this campaign? (e.g., Increase brand awareness, drive sales, grow social following)"
                                        rows={4}
                                        disabled={!isEditing}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:disabled:bg-slate-900"
                                    />
                                </div>

                                {/* Strategy */}
                                <div className="card lg:col-span-2">
                                    <h3 className="card-title mb-4">Strategic Approach</h3>
                                    <textarea
                                        value={planData.strategy}
                                        onChange={(e) => setPlanData({ ...planData, strategy: e.target.value })}
                                        placeholder="Describe the overall strategy to achieve the objectives (target channels, content themes, engagement tactics, etc.)"
                                        rows={6}
                                        disabled={!isEditing}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:disabled:bg-slate-900"
                                    />
                                </div>

                                {/* Services */}
                                <div className="card lg:col-span-2">
                                    <h3 className="card-title mb-4">Services to Provide</h3>
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                                        {availableServices.map((service) => (
                                            <button
                                                key={service}
                                                onClick={() => toggleService(service)}
                                                disabled={!isEditing}
                                                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                                                    planData.services.includes(service)
                                                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300"
                                                        : "dark:hover:bg-slate-750 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                } ${!isEditing ? "cursor-not-allowed opacity-60" : ""}`}
                                            >
                                                {planData.services.includes(service) && (
                                                    <Check
                                                        size={16}
                                                        className="flex-shrink-0"
                                                    />
                                                )}
                                                <span className="truncate">{service}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Budget */}
                                <div className="card">
                                    <h3 className="card-title mb-4">Budget (USD)</h3>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-600 dark:text-slate-400">$</span>
                                        <input
                                            type="number"
                                            value={planData.budget}
                                            onChange={(e) => setPlanData({ ...planData, budget: e.target.value })}
                                            placeholder="5000"
                                            disabled={!isEditing}
                                            className="w-full rounded-lg border border-slate-300 bg-white py-3 pr-4 pl-8 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:disabled:bg-slate-900"
                                        />
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="card">
                                    <h3 className="card-title mb-4">Timeline</h3>
                                    <input
                                        type="text"
                                        value={planData.timeline}
                                        onChange={(e) => setPlanData({ ...planData, timeline: e.target.value })}
                                        placeholder="e.g., 3 months, Q1 2025, Jan-Mar"
                                        disabled={!isEditing}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:disabled:bg-slate-900"
                                    />
                                </div>
                            </div>

                            {/* Final Strategy Output */}
                            {finalStrategy && (
                                <div className="card">
                                    <h3 className="card-title mb-4">Final Strategy Document</h3>
                                    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                                        <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-900 dark:text-slate-50">
                                            {finalStrategy}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default PlanningPage;
