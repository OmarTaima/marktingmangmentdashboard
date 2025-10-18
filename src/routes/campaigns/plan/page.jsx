import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Edit2, Plus, Trash2, X } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useLang } from "@/hooks/useLang";

const PlanPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [clientData, setClientData] = useState(null);
    const [plan, setPlan] = useState({
        objective: "",
        strategy: "",
        selectedServices: [],
        budget: "",
        timeline: "",
        kpis: [],
    });
    const [isEditing, setIsEditing] = useState(true);

    const { t } = useLang();

    // Modal states
    const [showSegmentsModal, setShowSegmentsModal] = useState(false);
    const [showCompetitorsModal, setShowCompetitorsModal] = useState(false);
    const [showSocialLinksModal, setShowSocialLinksModal] = useState(false);
    const [showSwotModal, setShowSwotModal] = useState(false);
    const [showBranchesModal, setShowBranchesModal] = useState(false);

    // Editing states for modals
    const [editingSegments, setEditingSegments] = useState([]);
    const [editingCompetitors, setEditingCompetitors] = useState([]);
    const [editingSocialLinks, setEditingSocialLinks] = useState([]);
    const [editingCustomLinks, setEditingCustomLinks] = useState([]);
    const [editingSwot, setEditingSwot] = useState({
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
    });
    const [editingBranches, setEditingBranches] = useState([]);

    // Debug state
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        // Load client data from clients array using ID
        const stodangerClients = localStorage.getItem("clients");
        const selectedClientId = localStorage.getItem("selectedClientId") || id;

        console.log("Loading client with ID:", selectedClientId);

        if (stodangerClients) {
            const clients = JSON.parse(stodangerClients);
            const client = clients.find((c) => c.id === selectedClientId);

            if (client) {
                console.log("Found client:", client);
                console.log("SWOT data:", client.swot);
                console.log("Competitors data:", client.competitors);
                setClientData(client);
            } else {
                console.error("Client not found with ID:", selectedClientId);
            }
        }

        // Load existing plan if any
        const stodangerPlan = localStorage.getItem(`campaign_plan_${selectedClientId}`);
        if (stodangerPlan) {
            setPlan(JSON.parse(stodangerPlan));
            setIsEditing(false);
        }
    }, [id]);

    const handleSavePlan = () => {
        localStorage.setItem(`campaign_plan_${id}`, JSON.stringify(plan));
        setIsEditing(false);
        alert("Campaign plan saved successfully!");
    };

    // Save client data changes
    const saveClientData = (updatedData) => {
        console.log("Saving client data:", updatedData);

        // Load clients array
        const stodangerClients = localStorage.getItem("clients");
        if (stodangerClients) {
            const clients = JSON.parse(stodangerClients);
            const clientIndex = clients.findIndex((c) => c.id === updatedData.id);

            if (clientIndex !== -1) {
                // Update the client in the array
                clients[clientIndex] = updatedData;
                localStorage.setItem("clients", JSON.stringify(clients));
                setClientData(updatedData);
                console.log("Client data saved to localStorage");
            }
        }
    };

    // Segments Modal Handlers
    const openSegmentsModal = () => {
        setEditingSegments(clientData.segments || []);
        setShowSegmentsModal(true);
    };

    const saveSegments = () => {
        console.log("Saving segments:", editingSegments);
        const updatedData = { ...clientData, segments: editingSegments };
        saveClientData(updatedData);
        setShowSegmentsModal(false);
        alert("✅ Target segments updated successfully!");
    };

    // Competitors Modal Handlers
    const openCompetitorsModal = () => {
        console.log("Opening competitors modal with data:", clientData.competitors);
        setEditingCompetitors(clientData.competitors || []);
        setShowCompetitorsModal(true);
    };

    const saveCompetitors = () => {
        console.log("Saving competitors:", editingCompetitors);
        const updatedData = { ...clientData, competitors: editingCompetitors };
        saveClientData(updatedData);
        setShowCompetitorsModal(false);
        alert("✅ Competitors updated successfully!");
    };

    // Social Links Modal Handlers
    const openSocialLinksModal = () => {
        setEditingSocialLinks(clientData.socialLinks?.business || []);
        setEditingCustomLinks(clientData.socialLinks?.custom || []);
        setShowSocialLinksModal(true);
    };

    const saveSocialLinks = () => {
        console.log("Saving social links:", editingSocialLinks, editingCustomLinks);
        const updatedData = {
            ...clientData,
            socialLinks: { business: editingSocialLinks, custom: editingCustomLinks },
        };
        saveClientData(updatedData);
        setShowSocialLinksModal(false);
        alert("✅ Social media links updated successfully!");
    };

    // SWOT Modal Handlers
    const openSwotModal = () => {
        console.log("Opening SWOT modal with data:", clientData.swot);
        setEditingSwot(
            clientData.swot || {
                strengths: [],
                weaknesses: [],
                opportunities: [],
                threats: [],
            },
        );
        setShowSwotModal(true);
    };

    const saveSwot = () => {
        console.log("Saving SWOT:", editingSwot);
        const updatedData = { ...clientData, swot: editingSwot };
        saveClientData(updatedData);
        setShowSwotModal(false);
        alert("✅ SWOT analysis updated successfully!");
    };

    // Branches Modal Handlers
    const openBranchesModal = () => {
        setEditingBranches(clientData.branches || []);
        setShowBranchesModal(true);
    };

    const saveBranches = () => {
        console.log("Saving branches:", editingBranches);
        const updatedData = { ...clientData, branches: editingBranches };
        saveClientData(updatedData);
        setShowBranchesModal(false);
        alert("✅ Branches updated successfully!");
    };

    const services = [
        { id: "social-media", name: "Social Media Management", description: "Daily posts, engagement, analytics" },
        { id: "content", name: "Content Creation", description: "Professional photos, videos, graphics" },
        { id: "ads", name: "Paid Advertising", description: "Facebook, Instagram, Google Ads" },
        { id: "seo", name: "SEO Optimization", description: "Website optimization, keyword research" },
        { id: "email", name: "Email Marketing", description: "Newsletter campaigns, automation" },
        { id: "influencer", name: "Influencer Marketing", description: "Partnerships and collaborations" },
    ];

    const toggleService = (serviceId) => {
        setPlan({
            ...plan,
            selectedServices: plan.selectedServices.includes(serviceId)
                ? plan.selectedServices.filter((id) => id !== serviceId)
                : [...plan.selectedServices, serviceId],
        });
    };

    if (!clientData) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
                <p className="text-secondary-600 dark:text-secondary-400 text-lg">{t("no_clients_found")}</p>
                <p className="text-secondary-500 dark:text-secondary-400 text-sm">
                    {t("please_complete_onboarding") || "Please complete the onboarding process first."}
                </p>
                <button
                    onClick={() => navigate("/onboarding")}
                    className="btn-primary"
                >
                    {t("add_your_first_client")}
                </button>
            </div>
        );
    }

    // Debug panel to show data counts
    console.log("=== CLIENT DATA STRUCTURE ===");
    console.log("Competitors:", clientData.competitors);
    console.log("Competitors count:", clientData.competitors?.length || 0);
    console.log("SWOT:", clientData.swot);
    console.log("SWOT strengths count:", clientData.swot?.strengths?.length || 0);
    console.log("SWOT weaknesses count:", clientData.swot?.weaknesses?.length || 0);
    console.log("SWOT opportunities count:", clientData.swot?.opportunities?.length || 0);
    console.log("SWOT threats count:", clientData.swot?.threats?.length || 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/clients")}
                        className="btn-ghost"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="title">{clientData.business?.businessName}</h1>
                        <p className="text-secondary-600 dark:text-secondary-400">{t("campaign_planning")}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate(`/clients/${clientData.id}`)}
                        className="btn-ghost text-sm"
                    >
                        {t("view_client_details") || "View Client Details"}
                    </button>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="btn-ghost text-xs"
                    >
                        {showDebug ? t("hide") : t("show")} {t("debug_information")}
                    </button>
                    {isEditing ? (
                        <button
                            onClick={handleSavePlan}
                            className="btn-primary flex items-center gap-2"
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

            {/* Debug Panel */}
            {showDebug && (
                <div className="card bg-yellow-50 dark:bg-yellow-900/20">
                    <h3 className="mb-3 font-bold text-yellow-900 dark:text-yellow-200">🔍 {t("debug_information") || "Debug Information"}</h3>
                    <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <strong>Competitors:</strong> {clientData.competitors?.length || 0} items
                            </div>
                            <div>
                                <strong>Segments:</strong> {clientData.segments?.length || 0} items
                            </div>
                            <div>
                                <strong>Branches:</strong> {clientData.branches?.length || 0} items
                            </div>
                            <div>
                                <strong>SWOT Strengths:</strong> {clientData.swot?.strengths?.length || 0} items
                            </div>
                            <div>
                                <strong>SWOT Weaknesses:</strong> {clientData.swot?.weaknesses?.length || 0} items
                            </div>
                            <div>
                                <strong>SWOT Opportunities:</strong> {clientData.swot?.opportunities?.length || 0} items
                            </div>
                            <div>
                                <strong>SWOT Threats:</strong> {clientData.swot?.threats?.length || 0} items
                            </div>
                            <div>
                                <strong>Social Links (Business):</strong> {clientData.socialLinks?.business?.length || 0} items
                            </div>
                        </div>
                        <details className="mt-3">
                            <summary className="cursor-pointer font-semibold text-yellow-900 dark:text-yellow-200">
                                View Raw Data (Click to expand)
                            </summary>
                            <pre className="bg-secondary-900 mt-2 max-h-96 overflow-auto rounded p-3 text-xs text-green-400">
                                {JSON.stringify(clientData, null, 2)}
                            </pre>
                        </details>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left Sidebar - Client Information */}
                <div className="space-y-4 lg:col-span-4">
                    {/* Client Overview */}
                    <div className="card">
                        <h3 className="card-title mb-4">{t("client_overview") || "Client Overview"}</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-secondary-500 dark:text-secondary-400">Business:</span>
                                <p className="text-secondary-900 dark:text-secondary-50 font-medium">{clientData.business?.businessName || "N/A"}</p>
                            </div>
                            <div>
                                <span className="text-secondary-500 dark:text-secondary-400">Category:</span>
                                <p className="text-secondary-900 dark:text-secondary-50">{clientData.business?.category || "N/A"}</p>
                            </div>
                            {clientData.business?.establishedYear && (
                                <div>
                                    <span className="text-secondary-500 dark:text-secondary-400">Established:</span>
                                    <p className="text-secondary-900 dark:text-secondary-50">{clientData.business.establishedYear}</p>
                                </div>
                            )}
                            {clientData.business?.description && (
                                <div>
                                    <span className="text-secondary-500 dark:text-secondary-400">Description:</span>
                                    <p className="text-secondary-900 dark:text-secondary-50">{clientData.business.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="card">
                        <h3 className="card-title mb-4">{t("contact_info")}</h3>
                        <div className="space-y-4">
                            {/* Contact Person */}
                            {(clientData.personal?.fullName || clientData.personal?.email || clientData.personal?.phone) && (
                                <div className="space-y-2">
                                    <h4 className="text-secondary-700 dark:text-secondary-300 text-sm font-semibold">
                                        {t("contact_person") || "Contact Person"}
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        {clientData.personal?.fullName && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">Name:</span>
                                                <p className="text-secondary-900 dark:text-secondary-50 font-medium">
                                                    {clientData.personal.fullName}
                                                </p>
                                            </div>
                                        )}
                                        {clientData.personal?.position && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">Position:</span>
                                                <p className="text-secondary-900 dark:text-secondary-50">{clientData.personal.position}</p>
                                            </div>
                                        )}
                                        {clientData.personal?.email && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">Email:</span>
                                                <p className="text-secondary-900 dark:text-secondary-50">{clientData.personal.email}</p>
                                            </div>
                                        )}
                                        {clientData.personal?.phone && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">Phone:</span>
                                                <p className="text-secondary-900 dark:text-secondary-50">{clientData.personal.phone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Business Contact */}
                            {(clientData.contact?.businessEmail || clientData.contact?.businessPhone || clientData.contact?.website) && (
                                <div className="border-secondary-200 dark:border-secondary-700 space-y-2 border-t pt-3">
                                    <h4 className="text-secondary-700 dark:text-secondary-300 text-sm font-semibold">
                                        {t("business_contact") || "Business Contact"}
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        {clientData.contact?.businessEmail && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">Email:</span>
                                                <p className="text-secondary-900 dark:text-secondary-50">{clientData.contact.businessEmail}</p>
                                            </div>
                                        )}
                                        {clientData.contact?.businessPhone && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">Phone:</span>
                                                <p className="text-secondary-900 dark:text-secondary-50">{clientData.contact.businessPhone}</p>
                                            </div>
                                        )}
                                        {clientData.contact?.businessWhatsApp && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">WhatsApp:</span>
                                                <p className="text-secondary-900 dark:text-secondary-50">{clientData.contact.businessWhatsApp}</p>
                                            </div>
                                        )}
                                        {clientData.contact?.website && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">Website:</span>
                                                <a
                                                    href={clientData.contact.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-500 hover:underline"
                                                >
                                                    {clientData.contact.website}
                                                </a>
                                            </div>
                                        )}
                                        {clientData.business?.mainOfficeAddress && (
                                            <div>
                                                <span className="text-secondary-500 dark:text-secondary-400">Main Office:</span>
                                                <p className="text-secondary-900 dark:text-secondary-50">{clientData.business.mainOfficeAddress}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card">
                        <h3 className="card-title mb-4">{t("quick_stats")}</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-primary-600 dark:text-primary-400 text-2xl font-bold">{clientData.segments?.length || 0}</p>
                                <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("segments_label")}</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{clientData.competitors?.length || 0}</p>
                                <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("competitors_label")}</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{clientData.branches?.length || 0}</p>
                                <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("branches")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Campaign Details & Analysis */}
                <div className="space-y-4 lg:col-span-8">
                    {/* Market Intelligence Section */}
                    <div className="mb-2">
                        <h2 className="text-secondary-900 dark:text-secondary-50 text-xl font-bold">{t("market_intelligence")}</h2>
                        <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t("market_intelligence_subtitle")}</p>
                    </div>

                    {/* SWOT Analysis */}
                    <div className="card">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="card-title">SWOT Analysis</h3>
                            <button
                                onClick={openSwotModal}
                                className="btn-ghost !px-3 !py-1 text-sm"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-medium text-green-600 dark:text-green-400">💪 Strengths:</span>
                                <ul className="mt-1 ml-4 list-disc space-y-1">
                                    {clientData.swot?.strengths && clientData.swot.strengths.length > 0 ? (
                                        clientData.swot.strengths.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-secondary-900 dark:text-secondary-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-secondary-500">{t("none_listed")}</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <span className="text-danger-600 dark:text-danger-400 font-medium">⚠️ Weaknesses:</span>
                                <ul className="mt-1 ml-4 list-disc space-y-1">
                                    {clientData.swot?.weaknesses && clientData.swot.weaknesses.length > 0 ? (
                                        clientData.swot.weaknesses.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-secondary-900 dark:text-secondary-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-secondary-500">None listed</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <span className="text-primary-600 dark:text-primary-400 font-medium">🎯 Opportunities:</span>
                                <ul className="mt-1 ml-4 list-disc space-y-1">
                                    {clientData.swot?.opportunities && clientData.swot.opportunities.length > 0 ? (
                                        clientData.swot.opportunities.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-secondary-900 dark:text-secondary-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-secondary-500">None listed</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <span className="font-medium text-orange-600 dark:text-orange-400">⚡ Threats:</span>
                                <ul className="mt-1 ml-4 list-disc space-y-1">
                                    {clientData.swot?.threats && clientData.swot.threats.length > 0 ? (
                                        clientData.swot.threats.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-secondary-900 dark:text-secondary-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-secondary-500">None listed</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="card-title">Target Segments</h3>
                            <button
                                onClick={openSegmentsModal}
                                className="btn-ghost !px-3 !py-1 text-sm"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                        {clientData.segments && clientData.segments.length > 0 ? (
                            <div className="space-y-3">
                                {clientData.segments.map((segment, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-3"
                                    >
                                        <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{segment.name}</h4>
                                        <p className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">{segment.description}</p>
                                        <div className="text-secondary-500 dark:text-secondary-400 mt-2 flex gap-4 text-xs">
                                            {segment.targetAge && <span>Age: {segment.targetAge}</span>}
                                            {segment.targetGender && <span>Gender: {segment.targetGender}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-secondary-500 text-sm">No segments defined</p>
                        )}
                    </div>

                    <div className="card">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="card-title">{t("competitors")}</h3>
                            <button
                                onClick={openCompetitorsModal}
                                className="btn-ghost !px-3 !py-1 text-sm"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                        {clientData.competitors && clientData.competitors.length > 0 ? (
                            <div className="space-y-3">
                                {clientData.competitors.map((competitor, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-3"
                                    >
                                        <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{competitor.name}</h4>
                                        <p className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">{competitor.description}</p>
                                        {competitor.website && (
                                            <a
                                                href={competitor.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary-500 mt-1 text-xs hover:underline"
                                            >
                                                {competitor.website}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-secondary-500 text-sm">{t("no_competitors_tracked")}</p>
                        )}
                    </div>

                    <div className="card">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="card-title">Social Media</h3>
                            <button
                                onClick={openSocialLinksModal}
                                className="btn-ghost !px-3 !py-1 text-sm"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {/* Main Platforms */}
                            {clientData.socialLinks?.business &&
                                clientData.socialLinks.business
                                    .filter((link) => link && link.url && link.platform)
                                    .map((link, idx) => {
                                        let Icon = null;
                                        let colorClass = "text-secondary-600";

                                        // Assign icons and colors based on platform
                                        const platformLower = link.platform.toLowerCase();
                                        if (platformLower.includes("facebook")) {
                                            Icon = SiFacebook;
                                            colorClass = "text-primary-600";
                                        } else if (platformLower.includes("instagram")) {
                                            Icon = SiInstagram;
                                            colorClass = "text-pink-600";
                                        } else if (platformLower.includes("tiktok")) {
                                            Icon = SiTiktok;
                                            colorClass = "text-secondary-900 dark:text-white";
                                        } else if (platformLower.includes("x") || platformLower.includes("twitter")) {
                                            Icon = SiX;
                                            colorClass = "text-secondary-900 dark:text-white";
                                        }

                                        return (
                                            <div
                                                key={`business-${idx}`}
                                                className="flex items-center gap-2"
                                            >
                                                {Icon && <Icon className={`${colorClass} h-4 w-4`} />}
                                                <span className="text-secondary-700 dark:text-secondary-300 text-sm font-medium">
                                                    {link.platform}:
                                                </span>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary-500 max-w-xs flex-1 truncate text-sm hover:underline"
                                                >
                                                    {link.url}
                                                </a>
                                            </div>
                                        );
                                    })}

                            {/* Custom Platforms */}
                            {clientData.socialLinks?.custom &&
                                clientData.socialLinks.custom.length > 0 &&
                                clientData.socialLinks.custom.map((link, idx) => (
                                    <div
                                        key={`custom-${idx}`}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-secondary-700 dark:text-secondary-300 text-sm font-medium">{link.platform}:</span>
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-500 max-w-xs flex-1 truncate text-sm hover:underline"
                                        >
                                            {link.url}
                                        </a>
                                    </div>
                                ))}

                            {(!clientData.socialLinks?.business || clientData.socialLinks.business.filter((link) => link && link.url).length === 0) &&
                                (!clientData.socialLinks?.custom || clientData.socialLinks.custom.length === 0) && (
                                    <p className="text-secondary-500 text-sm">No social links provided</p>
                                )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="card-title">Branches</h3>
                            <button
                                onClick={openBranchesModal}
                                className="btn-ghost !px-3 !py-1 text-sm"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                        {clientData.branches && clientData.branches.length > 0 ? (
                            <div className="space-y-3">
                                {clientData.branches.map((branch, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-3"
                                    >
                                        <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{branch.name}</h4>
                                        <p className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">{branch.address}</p>
                                        {branch.phone && <p className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">📞 {branch.phone}</p>}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-secondary-500 text-sm">No branches added</p>
                        )}
                    </div>

                    {/* Campaign Planning Section */}
                    <div className="mt-8 mb-2">
                        <h2 className="text-secondary-900 dark:text-secondary-50 text-xl font-bold">Campaign Planning</h2>
                        <p className="text-secondary-600 dark:text-secondary-400 text-sm">Define objectives, strategy, and deliverables</p>
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-4">Campaign Objective</h3>
                        <textarea
                            value={plan.objective}
                            onChange={(e) => setPlan({ ...plan, objective: e.target.value })}
                            disabled={!isEditing}
                            rows={3}
                            placeholder="Define the main objective of this campaign..."
                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50"
                        />
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-4">Strategy</h3>
                        <textarea
                            value={plan.strategy}
                            onChange={(e) => setPlan({ ...plan, strategy: e.target.value })}
                            disabled={!isEditing}
                            rows={5}
                            placeholder="Describe the overall strategy based on client data, SWOT analysis, and target segments..."
                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50"
                        />
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-4">Services</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    type="button"
                                    onClick={() => isEditing && toggleService(service.id)}
                                    disabled={!isEditing}
                                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                                        plan.selectedServices.includes(service.id)
                                            ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                                            : "border-secondary-300 dark:border-secondary-700 hover:border-primary-300"
                                    } disabled:opacity-50`}
                                >
                                    <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{service.name}</h4>
                                    <p className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">{service.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="card">
                            <h3 className="card-title mb-4">Budget (USD)</h3>
                            <input
                                type="number"
                                value={plan.budget}
                                onChange={(e) => setPlan({ ...plan, budget: e.target.value })}
                                disabled={!isEditing}
                                placeholder="e.g., 5000"
                                className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50"
                            />
                        </div>
                        <div className="card">
                            <h3 className="card-title mb-4">Timeline</h3>
                            <input
                                type="text"
                                value={plan.timeline}
                                onChange={(e) => setPlan({ ...plan, timeline: e.target.value })}
                                disabled={!isEditing}
                                placeholder="e.g., 3 months"
                                className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Segments Modal */}
            {showSegmentsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowSegmentsModal(false)}
                >
                    <div
                        className="dark:bg-secondary-900 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-secondary-900 dark:text-secondary-50 text-2xl font-semibold">Edit Target Segments</h2>
                            <button
                                onClick={() => setShowSegmentsModal(false)}
                                className="btn-ghost !px-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Add New Segment Form */}
                            <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
                                <h3 className="text-secondary-900 dark:text-secondary-50 mb-3 text-lg font-medium">Add New Segment</h3>
                                <div className="space-y-3">
                                    <div>
                                        <input
                                            type="text"
                                            id="newSegmentName"
                                            placeholder="Segment Name"
                                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            id="newSegmentDesc"
                                            placeholder="Description"
                                            rows={2}
                                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            id="newSegmentAge"
                                            placeholder="Age Range (e.g., 18-35)"
                                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        />
                                        <select
                                            id="newSegmentGender"
                                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        >
                                            <option value="">Gender - All</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const name = document.getElementById("newSegmentName").value;
                                            const description = document.getElementById("newSegmentDesc").value;
                                            const targetAge = document.getElementById("newSegmentAge").value.replace(/[^0-9-]/g, "");
                                            const targetGender = document.getElementById("newSegmentGender").value;

                                            if (name && description) {
                                                setEditingSegments([...editingSegments, { name, description, targetAge, targetGender }]);
                                                document.getElementById("newSegmentName").value = "";
                                                document.getElementById("newSegmentDesc").value = "";
                                                document.getElementById("newSegmentAge").value = "";
                                                document.getElementById("newSegmentGender").value = "";
                                            }
                                        }}
                                        className="btn-ghost flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add Segment
                                    </button>
                                </div>
                            </div>

                            {/* Existing Segments */}
                            <div className="space-y-2">
                                <h3 className="text-secondary-900 dark:text-secondary-50 text-lg font-medium">Current Segments</h3>
                                {editingSegments.length > 0 ? (
                                    editingSegments.map((segment, idx) => (
                                        <div
                                            key={idx}
                                            className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 flex items-start justify-between rounded-lg border bg-white p-3"
                                        >
                                            <div>
                                                <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{segment.name}</h4>
                                                <p className="text-secondary-600 dark:text-secondary-400 text-sm">{segment.description}</p>
                                                <div className="text-secondary-500 dark:text-secondary-400 mt-1 flex gap-4 text-xs">
                                                    {segment.targetAge && <span>Age: {segment.targetAge}</span>}
                                                    {segment.targetGender && <span>Gender: {segment.targetGender}</span>}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setEditingSegments(editingSegments.filter((_, i) => i !== idx))}
                                                className="text-danger-500 hover:text-danger-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-secondary-500 text-sm">No segments added yet</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSegmentsModal(false)}
                                className="btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSegments}
                                className="btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Competitors Modal */}
            {showCompetitorsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowCompetitorsModal(false)}
                >
                    <div
                        className="dark:bg-secondary-900 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-secondary-900 dark:text-secondary-50 text-2xl font-semibold">{t("edit_competitors")}</h2>
                            <button
                                onClick={() => setShowCompetitorsModal(false)}
                                className="btn-ghost !px-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Add New Competitor Form */}
                            <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
                                <h3 className="text-secondary-900 dark:text-secondary-50 mb-3 text-lg font-medium">Add New Competitor</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        id="newCompetitorName"
                                        placeholder="Competitor Name"
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                    />
                                    <textarea
                                        id="newCompetitorDesc"
                                        placeholder="Description"
                                        rows={2}
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                    />
                                    <input
                                        type="url"
                                        id="newCompetitorWebsite"
                                        placeholder="Website URL"
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const name = document.getElementById("newCompetitorName").value;
                                            const description = document.getElementById("newCompetitorDesc").value;
                                            const website = document.getElementById("newCompetitorWebsite").value;

                                            if (name && description) {
                                                setEditingCompetitors([...editingCompetitors, { name, description, website }]);
                                                document.getElementById("newCompetitorName").value = "";
                                                document.getElementById("newCompetitorDesc").value = "";
                                                document.getElementById("newCompetitorWebsite").value = "";
                                            }
                                        }}
                                        className="btn-ghost flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add Competitor
                                    </button>
                                </div>
                            </div>

                            {/* Existing Competitors */}
                            <div className="space-y-2">
                                <h3 className="text-secondary-900 dark:text-secondary-50 text-lg font-medium">{t("current_competitors")}</h3>
                                {editingCompetitors.length > 0 ? (
                                    editingCompetitors.map((competitor, idx) => (
                                        <div
                                            key={idx}
                                            className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 flex items-start justify-between rounded-lg border bg-white p-3"
                                        >
                                            <div>
                                                <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{competitor.name}</h4>
                                                <p className="text-secondary-600 dark:text-secondary-400 text-sm">{competitor.description}</p>
                                                {competitor.website && (
                                                    <a
                                                        href={competitor.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-500 text-xs hover:underline"
                                                    >
                                                        {competitor.website}
                                                    </a>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setEditingCompetitors(editingCompetitors.filter((_, i) => i !== idx))}
                                                className="text-danger-500 hover:text-danger-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-secondary-500 text-sm">{t("no_competitors_added_yet")}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowCompetitorsModal(false)}
                                className="btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveCompetitors}
                                className="btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Social Links Modal */}
            {showSocialLinksModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowSocialLinksModal(false)}
                >
                    <div
                        className="dark:bg-secondary-900 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-secondary-900 dark:text-secondary-50 text-2xl font-semibold">Edit Social Media Links</h2>
                            <button
                                onClick={() => setShowSocialLinksModal(false)}
                                className="btn-ghost !px-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Main Platforms */}
                            <div>
                                <h3 className="text-secondary-900 dark:text-secondary-50 mb-3 text-lg font-medium">Main Marketing Platforms</h3>
                                <div className="space-y-3">
                                    {[
                                        { name: "Facebook", icon: SiFacebook, color: "text-primary-600" },
                                        { name: "Instagram", icon: SiInstagram, color: "text-pink-600" },
                                        { name: "TikTok", icon: SiTiktok, color: "text-secondary-900 dark:text-white" },
                                        { name: "X (Twitter)", icon: SiX, color: "text-secondary-900 dark:text-white" },
                                    ].map((platform, index) => {
                                        const Icon = platform.icon;
                                        const currentLink = editingSocialLinks[index] || { platform: platform.name, url: "" };

                                        return (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3"
                                            >
                                                <div className="flex w-40 items-center gap-2">
                                                    <Icon className={`${platform.color} h-5 w-5`} />
                                                    <label className="text-secondary-700 dark:text-secondary-300 text-sm font-medium">
                                                        {platform.name}
                                                    </label>
                                                </div>
                                                <input
                                                    type="url"
                                                    value={currentLink.url}
                                                    onChange={(e) => {
                                                        const updated = [...editingSocialLinks];
                                                        updated[index] = { platform: platform.name, url: e.target.value };
                                                        setEditingSocialLinks(updated);
                                                    }}
                                                    placeholder={`https://${platform.name.toLowerCase().replace(/\s+/g, "")}.com/yourpage`}
                                                    dir={dirFor(`https://${platform.name.toLowerCase().replace(/\s+/g, "")}.com/yourpage`)}
                                                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 flex-1 rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Platforms */}
                            <div>
                                <h3 className="text-secondary-900 dark:text-secondary-50 mb-3 text-lg font-medium">Other Platforms (Optional)</h3>
                                <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
                                    <div className="mb-3 grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            id="newCustomPlatform"
                                            placeholder="Platform Name (e.g., LinkedIn, YouTube)"
                                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        />
                                        <input
                                            type="url"
                                            id="newCustomUrl"
                                            placeholder="https://..."
                                            dir={dirFor("https://...")}
                                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const platform = document.getElementById("newCustomPlatform").value;
                                            const url = document.getElementById("newCustomUrl").value;

                                            if (platform && url) {
                                                setEditingCustomLinks([...editingCustomLinks, { platform, url }]);
                                                document.getElementById("newCustomPlatform").value = "";
                                                document.getElementById("newCustomUrl").value = "";
                                            }
                                        }}
                                        className="btn-ghost flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add Platform
                                    </button>
                                </div>

                                {/* Custom Links List */}
                                {editingCustomLinks.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {editingCustomLinks.map((link, idx) => (
                                            <div
                                                key={idx}
                                                className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 flex items-center justify-between rounded-lg border bg-white p-3"
                                            >
                                                <div className="flex-1">
                                                    <span className="text-secondary-900 dark:text-secondary-50 font-medium">{link.platform}</span>
                                                    <p className="text-secondary-600 dark:text-secondary-400 truncate text-sm">{link.url}</p>
                                                </div>
                                                <button
                                                    onClick={() => setEditingCustomLinks(editingCustomLinks.filter((_, i) => i !== idx))}
                                                    className="text-danger-500 hover:text-danger-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSocialLinksModal(false)}
                                className="btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSocialLinks}
                                className="btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SWOT Modal */}
            {showSwotModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowSwotModal(false)}
                >
                    <div
                        className="dark:bg-secondary-900 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-secondary-900 dark:text-secondary-50 text-2xl font-semibold">Edit SWOT Analysis</h2>
                            <button
                                onClick={() => setShowSwotModal(false)}
                                className="btn-ghost !px-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Strengths */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-green-600 dark:text-green-400">💪 Strengths</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="newStrength"
                                        placeholder="Add strength..."
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 flex-1 rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                const value = e.target.value.trim();
                                                if (value) {
                                                    setEditingSwot((prev) => ({
                                                        ...prev,
                                                        strengths: [...prev.strengths, value],
                                                    }));
                                                    e.target.value = "";
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById("newStrength");
                                            const value = input.value.trim();
                                            if (value) {
                                                setEditingSwot((prev) => ({
                                                    ...prev,
                                                    strengths: [...prev.strengths, value],
                                                }));
                                                input.value = "";
                                            }
                                        }}
                                        className="btn-ghost !px-3"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {editingSwot.strengths.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-between rounded px-3 py-2"
                                        >
                                            <span className="text-secondary-900 dark:text-secondary-50 text-sm">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingSwot((prev) => ({
                                                        ...prev,
                                                        strengths: prev.strengths.filter((_, i) => i !== idx),
                                                    }))
                                                }
                                                className="text-danger-500 hover:text-danger-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div className="space-y-2">
                                <h3 className="text-danger-600 dark:text-danger-400 text-lg font-medium">⚠️ Weaknesses</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="newWeakness"
                                        placeholder="Add weakness..."
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 flex-1 rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                const value = e.target.value.trim();
                                                if (value) {
                                                    setEditingSwot((prev) => ({
                                                        ...prev,
                                                        weaknesses: [...prev.weaknesses, value],
                                                    }));
                                                    e.target.value = "";
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById("newWeakness");
                                            const value = input.value.trim();
                                            if (value) {
                                                setEditingSwot((prev) => ({
                                                    ...prev,
                                                    weaknesses: [...prev.weaknesses, value],
                                                }));
                                                input.value = "";
                                            }
                                        }}
                                        className="btn-ghost !px-3"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {editingSwot.weaknesses.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-between rounded px-3 py-2"
                                        >
                                            <span className="text-secondary-900 dark:text-secondary-50 text-sm">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingSwot((prev) => ({
                                                        ...prev,
                                                        weaknesses: prev.weaknesses.filter((_, i) => i !== idx),
                                                    }))
                                                }
                                                className="text-danger-500 hover:text-danger-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Opportunities */}
                            <div className="space-y-2">
                                <h3 className="text-primary-600 dark:text-primary-400 text-lg font-medium">🎯 Opportunities</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="newOpportunity"
                                        placeholder="Add opportunity..."
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 flex-1 rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                const value = e.target.value.trim();
                                                if (value) {
                                                    setEditingSwot((prev) => ({
                                                        ...prev,
                                                        opportunities: [...prev.opportunities, value],
                                                    }));
                                                    e.target.value = "";
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById("newOpportunity");
                                            const value = input.value.trim();
                                            if (value) {
                                                setEditingSwot((prev) => ({
                                                    ...prev,
                                                    opportunities: [...prev.opportunities, value],
                                                }));
                                                input.value = "";
                                            }
                                        }}
                                        className="btn-ghost !px-3"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {editingSwot.opportunities.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-between rounded px-3 py-2"
                                        >
                                            <span className="text-secondary-900 dark:text-secondary-50 text-sm">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingSwot((prev) => ({
                                                        ...prev,
                                                        opportunities: prev.opportunities.filter((_, i) => i !== idx),
                                                    }))
                                                }
                                                className="text-danger-500 hover:text-danger-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Threats */}
                            <div className="space-y-2">
                                <h3 className="text-lg font-medium text-orange-600 dark:text-orange-400">⚡ Threats</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="newThreat"
                                        placeholder="Add threat..."
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 flex-1 rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                const value = e.target.value.trim();
                                                if (value) {
                                                    setEditingSwot((prev) => ({
                                                        ...prev,
                                                        threats: [...prev.threats, value],
                                                    }));
                                                    e.target.value = "";
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById("newThreat");
                                            const value = input.value.trim();
                                            if (value) {
                                                setEditingSwot((prev) => ({
                                                    ...prev,
                                                    threats: [...prev.threats, value],
                                                }));
                                                input.value = "";
                                            }
                                        }}
                                        className="btn-ghost !px-3"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {editingSwot.threats.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-between rounded px-3 py-2"
                                        >
                                            <span className="text-secondary-900 dark:text-secondary-50 text-sm">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditingSwot((prev) => ({
                                                        ...prev,
                                                        threats: prev.threats.filter((_, i) => i !== idx),
                                                    }))
                                                }
                                                className="text-danger-500 hover:text-danger-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSwotModal(false)}
                                className="btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSwot}
                                className="btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Branches Modal */}
            {showBranchesModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={() => setShowBranchesModal(false)}
                >
                    <div
                        className="dark:bg-secondary-900 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-secondary-900 dark:text-secondary-50 text-2xl font-semibold">Edit Branches</h2>
                            <button
                                onClick={() => setShowBranchesModal(false)}
                                className="btn-ghost !px-2"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Add New Branch Form */}
                            <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-lg p-4">
                                <h3 className="text-secondary-900 dark:text-secondary-50 mb-3 text-lg font-medium">Add New Branch</h3>
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        id="newBranchName"
                                        placeholder="Branch Name"
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                    />
                                    <textarea
                                        id="newBranchAddress"
                                        placeholder="Address"
                                        rows={2}
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                    />
                                    <input
                                        type="tel"
                                        id="newBranchPhone"
                                        placeholder="Phone (optional)"
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => {
                                            const name = document.getElementById("newBranchName").value;
                                            const address = document.getElementById("newBranchAddress").value;
                                            const phone = document.getElementById("newBranchPhone").value;

                                            if (name && address) {
                                                setEditingBranches([...editingBranches, { name, address, phone }]);
                                                document.getElementById("newBranchName").value = "";
                                                document.getElementById("newBranchAddress").value = "";
                                                document.getElementById("newBranchPhone").value = "";
                                            }
                                        }}
                                        className="btn-ghost flex items-center gap-2"
                                    >
                                        <Plus size={16} />
                                        Add Branch
                                    </button>
                                </div>
                            </div>

                            {/* Existing Branches */}
                            <div className="space-y-2">
                                <h3 className="text-secondary-900 dark:text-secondary-50 text-lg font-medium">Current Branches</h3>
                                {editingBranches.length > 0 ? (
                                    editingBranches.map((branch, idx) => (
                                        <div
                                            key={idx}
                                            className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 flex items-start justify-between rounded-lg border bg-white p-3"
                                        >
                                            <div>
                                                <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{branch.name}</h4>
                                                <p className="text-secondary-600 dark:text-secondary-400 text-sm">{branch.address}</p>
                                                {branch.phone && (
                                                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">📞 {branch.phone}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setEditingBranches(editingBranches.filter((_, i) => i !== idx))}
                                                className="text-danger-500 hover:text-danger-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-secondary-500 text-sm">No branches added yet</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowBranchesModal(false)}
                                className="btn-ghost"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveBranches}
                                className="btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanPage;
