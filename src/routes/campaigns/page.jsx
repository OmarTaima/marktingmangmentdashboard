import { useState, useEffect, useRef } from "react";
import { Plus, Upload, Calendar, CheckCircle, Clock, AlertCircle, Video, Image as ImageIcon, FileText, Building2, Loader2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import LocalizedArrow from "@/components/LocalizedArrow";

const CampaignsPage = () => {
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [planData, setPlanData] = useState(null);
    const [uploads, setUploads] = useState([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true
    const [isTransitioning, setIsTransitioning] = useState(false);
    const isTransitioningRef = useRef(false); // Track transitions without causing re-render
    const [newUpload, setNewUpload] = useState({
        type: "reel",
        title: "",
        description: "",
        platform: "",
        scheduledDate: "",
        status: "pending",
    });

    const { t } = useLang();

    const contentTypes = [
        { value: "reel", label: t("Reel"), plural: t("Reels"), icon: Video },
        { value: "ad", label: t("Ad"), plural: t("Ads"), icon: ImageIcon },
        { value: "post", label: t("Post"), plural: t("Posts"), icon: FileText },
        { value: "story", label: t("Story"), plural: t("Stories"), icon: ImageIcon },
        { value: "video", label: t("Video"), plural: t("Videos"), icon: Video },
    ];

    const platforms = ["Facebook", "Instagram", "TikTok", "Twitter/X", "YouTube", "LinkedIn"];

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
                loadClientAndUploads();
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
                setPlanData(null);
                setUploads([]);
                <LocalizedArrow size={20} />;
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

    const loadClientAndUploads = () => {
        // Load client
        const stodangerClients = localStorage.getItem("clients");
        if (stodangerClients) {
            const clientsList = JSON.parse(stodangerClients);
            const client = clientsList.find((c) => c.id === selectedClientId);
            setSelectedClient(client);
        }

        // Load plan
        const savedPlan = localStorage.getItem(`plan_${selectedClientId}`);
        if (savedPlan) {
            setPlanData(JSON.parse(savedPlan));
        } else {
            setPlanData(null);
        }

        // Load uploads
        const savedUploads = localStorage.getItem(`uploads_${selectedClientId}`);
        if (savedUploads) {
            setUploads(JSON.parse(savedUploads));
        } else {
            setUploads([]);
        }
    };

    const handleAddUpload = () => {
        if (!newUpload.title || !newUpload.type) {
            alert(t("please_fill_required_fields"));
            return;
        }

        const upload = {
            id: `upload_${Date.now()}`,
            ...newUpload,
            createdAt: new Date().toISOString(),
        };

        const updatedUploads = [...uploads, upload];
        setUploads(updatedUploads);
        localStorage.setItem(`uploads_${selectedClientId}`, JSON.stringify(updatedUploads));

        // Reset form
        setNewUpload({
            type: "reel",
            title: "",
            description: "",
            platform: "",
            scheduledDate: "",
            status: "pending",
        });
        setShowUploadModal(false);
        alert(t("upload_added_success"));
    };

    const updateUploadStatus = (uploadId, newStatus) => {
        const updatedUploads = uploads.map((upload) => (upload.id === uploadId ? { ...upload, status: newStatus } : upload));
        setUploads(updatedUploads);
        localStorage.setItem(`uploads_${selectedClientId}`, JSON.stringify(updatedUploads));
    };

    const deleteUpload = (uploadId) => {
        if (!confirm("Are you sure you want to delete this upload?")) return;

        const updatedUploads = uploads.filter((upload) => upload.id !== uploadId);
        setUploads(updatedUploads);
        localStorage.setItem(`uploads_${selectedClientId}`, JSON.stringify(updatedUploads));
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return (
                    <CheckCircle
                        size={18}
                        className="text-green-500"
                    />
                );
            case "in-progress":
                return (
                    <Clock
                        size={18}
                        className="text-primary-500"
                    />
                );
            case "pending":
                return (
                    <AlertCircle
                        size={18}
                        className="text-yellow-500"
                    />
                );
            default:
                return (
                    <Clock
                        size={18}
                        className="text-secondary-400"
                    />
                );
        }
    };

    const getTypeStats = () => {
        const stats = {};
        contentTypes.forEach((type) => {
            stats[type.value] = {
                total: uploads.filter((u) => u.type === type.value).length,
                completed: uploads.filter((u) => u.type === type.value && u.status === "completed").length,
            };
        });
        return stats;
    };

    const stats = getTypeStats();

    return (
        <div className="space-y-6">
            {/* Show loading on initial mount or during transitions */}
            {isLoading && !selectedClient && !selectedClientId ? (
                <div className="flex min-h-[400px] items-center justify-center">
                    <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="title">{t("campaigns_title")}</h1>
                            <p className="text-secondary-600 dark:text-secondary-400">{t("campaigns_subtitle")}</p>
                        </div>
                        {selectedClientId && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={16} />
                                {t("add_upload")}
                            </button>
                        )}
                    </div>

                    {/* Loading State */}
                    {(isLoading || isTransitioning) && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
                        </div>
                    )}

                    {/* Client Selection Cards */}
                    {!selectedClientId && !isResetting && !isLoading && !isTransitioning ? (
                        <div>
                            {clients.length > 0 ? (
                                <>
                                    <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-lg font-semibold">
                                        {t("select_a_client_to_plan")}
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {clients.map((client) => {
                                            // Load plan for this client to show info
                                            const savedPlan = localStorage.getItem(`plan_${client.id}`);
                                            const plan = savedPlan ? JSON.parse(savedPlan) : null;

                                            return (
                                                <div
                                                    key={client.id}
                                                    className="card hover:border-primary-500 transition-all"
                                                >
                                                    <h3 className="card-title text-lg">
                                                        <span className="mr-2 text-sm font-semibold">{t("business_name_label")}</span>
                                                        {client.business?.businessName || t("unnamed_client")}
                                                    </h3>
                                                    <p className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">
                                                        <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                                                        {client.business?.category || t("no_category")}
                                                    </p>
                                                    {plan ? (
                                                        <div className="text-secondary-600 dark:text-secondary-400 mt-3 space-y-1 text-xs">
                                                            <p>
                                                                💰 {t("budget_usd")}: ${plan.budget || "N/A"}
                                                            </p>
                                                            <p>
                                                                📅 {t("timeline")}: {plan.timeline || "N/A"}
                                                            </p>
                                                            <p>
                                                                🎯 {t("services_to_provide")}: {plan.services?.length || 0}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                                                            ⚠️ {t("no_plan_created_yet")}
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedClientId(client.id)}
                                                        className="btn-primary mt-4 w-full"
                                                    >
                                                        {t("track")}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="card">
                                    <div className="py-8 text-center">
                                        <Building2
                                            size={48}
                                            className="text-secondary-400 mx-auto mb-4"
                                        />
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
                                            onClick={() => setSelectedClientId("")}
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

                            {/* Plan Summary */}
                            {planData ? (
                                <div className="card bg-primary-50 dark:bg-primary-950/30">
                                    <h3 className="card-title mb-3">{t("campaign_planning")}</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("budget_usd")}</p>
                                            <p className="text-secondary-900 dark:text-secondary-50 text-lg font-bold">${planData.budget || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("timeline")}</p>
                                            <p className="text-secondary-900 dark:text-secondary-50 text-lg font-bold">
                                                {planData.timeline || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("services_to_provide")}</p>
                                            <p className="text-secondary-900 dark:text-secondary-50 text-lg font-bold">
                                                {planData.services?.length || 0} {t("services_to_provide")}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card bg-yellow-50 dark:bg-yellow-950/30">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠️ {t("no_clients_found_for_plan")}{" "}
                                        <a
                                            href="/planning"
                                            className="font-medium underline"
                                        >
                                            {t("create_a_plan_first") || t("create_a_plan_first")}
                                        </a>
                                    </p>
                                </div>
                            )}

                            {/* Content Stats */}
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                                {contentTypes.map((type) => {
                                    const TypeIcon = type.icon;
                                    return (
                                        <div
                                            key={type.value}
                                            className="card"
                                        >
                                            <div className="flex items-center gap-3">
                                                <TypeIcon
                                                    size={24}
                                                    className="text-primary-500"
                                                />
                                                <div>
                                                    <p className="text-secondary-600 dark:text-secondary-400 text-xs">{type.plural}</p>
                                                    <p className="text-secondary-900 dark:text-secondary-50 text-lg font-bold">
                                                        {stats[type.value]?.completed || 0}/{stats[type.value]?.total || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Uploads List */}
                            <div className="card">
                                <h3 className="card-title mb-4">{t("content_uploads")}</h3>
                                {uploads.length > 0 ? (
                                    <div className="space-y-3">
                                        {uploads.map((upload) => {
                                            const TypeIcon = contentTypes.find((t) => t.value === upload.type)?.icon || FileText;
                                            return (
                                                <div
                                                    key={upload.id}
                                                    className="border-secondary-200 dark:border-secondary-700 flex items-start gap-4 rounded-lg border p-4"
                                                >
                                                    <TypeIcon
                                                        size={24}
                                                        className="text-secondary-600 dark:text-secondary-400 flex-shrink-0"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">
                                                                    {upload.title}
                                                                </h4>
                                                                <p className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">
                                                                    {upload.description}
                                                                </p>
                                                                <div className="text-secondary-500 dark:text-secondary-400 mt-2 flex flex-wrap gap-3 text-xs">
                                                                    <span className="bg-secondary-100 dark:bg-secondary-800 rounded px-2 py-1">
                                                                        {contentTypes.find((t) => t.value === upload.type)?.label}
                                                                    </span>
                                                                    {upload.platform && (
                                                                        <span className="bg-primary-100 dark:bg-primary-900 rounded px-2 py-1">
                                                                            {upload.platform}
                                                                        </span>
                                                                    )}
                                                                    {upload.scheduledDate && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar size={12} />
                                                                            {new Date(upload.scheduledDate).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(upload.status)}
                                                                <select
                                                                    value={upload.status}
                                                                    onChange={(e) => updateUploadStatus(upload.id, e.target.value)}
                                                                    className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 rounded border bg-white px-2 py-1 text-xs"
                                                                >
                                                                    <option value="pending">{t("pending")}</option>
                                                                    <option value="in-progress">{t("in_progress")}</option>
                                                                    <option value="completed">{t("completed")}</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => {
                                                                        if (!confirm(t("confirm_delete_upload"))) return;
                                                                        deleteUpload(upload.id);
                                                                    }}
                                                                    className="text-danger-500 hover:text-danger-700"
                                                                    aria-label={t("confirm_delete_upload")}
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-secondary-500 py-8 text-center">{t("no_uploads_yet")}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Upload Modal */}
                    {showUploadModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <div className="dark:bg-secondary-900 w-full max-w-2xl rounded-lg bg-white p-6">
                                <h3 className="text-secondary-900 dark:text-secondary-50 mb-4 text-xl font-bold">{t("add_content_upload")}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">
                                            {t("content_type")} *
                                        </label>
                                        <select
                                            value={newUpload.type}
                                            onChange={(e) => setNewUpload({ ...newUpload, type: e.target.value })}
                                            className="border-secondary-300 text-secondary-700 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 w-full rounded-lg border bg-white px-4 py-2"
                                        >
                                            <option value="">{t("select_content_type")}</option>
                                            {contentTypes.map((type) => (
                                                <option
                                                    key={type.value}
                                                    value={type.value}
                                                >
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">
                                            {t("title_label")} *
                                        </label>
                                        <input
                                            type="text"
                                            value={newUpload.title}
                                            onChange={(e) => setNewUpload({ ...newUpload, title: e.target.value })}
                                            placeholder={t("title_label")}
                                            className="border-secondary-300 text-secondary-700 dark:text-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 w-full rounded-lg border bg-white px-4 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">
                                            {t("description_label")}
                                        </label>
                                        <textarea
                                            value={newUpload.description}
                                            onChange={(e) => setNewUpload({ ...newUpload, description: e.target.value })}
                                            placeholder={t("description_placeholder")}
                                            rows={3}
                                            className="border-secondary-300 text-secondary-700 dark:text-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 w-full rounded-lg border bg-white px-4 py-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">
                                                {t("platform_label")}
                                            </label>
                                            <select
                                                value={newUpload.platform}
                                                onChange={(e) => setNewUpload({ ...newUpload, platform: e.target.value })}
                                                className="border-secondary-300 text-secondary-700 dark:text-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 w-full rounded-lg border bg-white px-4 py-2"
                                            >
                                                <option value="">{t("select_platform")}</option>
                                                {platforms.map((platform) => (
                                                    <option
                                                        key={platform}
                                                        value={platform}
                                                    >
                                                        {platform}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">
                                                {t("scheduled_date")}
                                            </label>
                                            <input
                                                type="date"
                                                value={newUpload.scheduledDate}
                                                onChange={(e) => setNewUpload({ ...newUpload, scheduledDate: e.target.value })}
                                                className="border-secondary-300 text-secondary-700 dark:text-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 w-full rounded-lg border bg-white px-4 py-2"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className="btn-ghost"
                                    >
                                        {t("cancel")}
                                    </button>
                                    <button
                                        onClick={handleAddUpload}
                                        className="btn-primary"
                                    >
                                        {t("add_upload")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CampaignsPage;
