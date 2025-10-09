import { useState, useEffect, useRef } from "react";
import {
    Plus,
    Upload,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    Video,
    Image as ImageIcon,
    FileText,
    ArrowLeft,
    Building2,
    Loader2,
} from "lucide-react";

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

    const contentTypes = [
        { value: "reel", label: "Reel", icon: Video },
        { value: "ad", label: "Ad", icon: ImageIcon },
        { value: "post", label: "Post", icon: FileText },
        { value: "story", label: "Story", icon: ImageIcon },
        { value: "video", label: "Video", icon: Video },
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
                setIsResetting(false);
                setIsLoading(false);
                setIsTransitioning(false);
                isTransitioningRef.current = false;
            }, 300);
        }
    }, [selectedClientId]);

    const loadClients = () => {
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            const clientsList = JSON.parse(storedClients);
            setClients(clientsList);
        }
    };

    const loadClientAndUploads = () => {
        // Load client
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            const clientsList = JSON.parse(storedClients);
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
            alert("Please fill in required fields");
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
        alert("✅ Upload added successfully!");
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
                        className="text-blue-500"
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
                        className="text-slate-400"
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
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="title">Campaign Content Tracking</h1>
                            <p className="text-slate-600 dark:text-slate-400">Upload and track content deliverables</p>
                        </div>
                        {selectedClientId && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Upload
                            </button>
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
                                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
                                        Select a Client Campaign to Track
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {clients.map((client) => {
                                            // Load plan for this client to show info
                                            const savedPlan = localStorage.getItem(`plan_${client.id}`);
                                            const plan = savedPlan ? JSON.parse(savedPlan) : null;

                                            return (
                                                <div
                                                    key={client.id}
                                                    className="card transition-all hover:border-blue-500"
                                                >
                                                    <h3 className="card-title text-lg">{client.business?.businessName || "Unnamed Client"}</h3>
                                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                        {client.business?.category || "No Category"}
                                                    </p>
                                                    {plan ? (
                                                        <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                                                            <p>💰 Budget: ${plan.budget || "N/A"}</p>
                                                            <p>📅 Timeline: {plan.timeline || "N/A"}</p>
                                                            <p>🎯 Services: {plan.services?.length || 0}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                                                            ⚠️ No plan created yet
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => setSelectedClientId(client.id)}
                                                        className="btn-primary mt-4 w-full"
                                                    >
                                                        Track
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
                                            className="mx-auto mb-4 text-slate-400"
                                        />
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
                                            <p className="text-sm text-slate-600 dark:text-slate-400">Campaign Content Tracking</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Plan Summary */}
                            {planData ? (
                                <div className="card bg-blue-50 dark:bg-blue-950/30">
                                    <h3 className="card-title mb-3">Active Plan</h3>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Budget</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">${planData.budget || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Timeline</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">{planData.timeline || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">Services</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                                                {planData.services?.length || 0} services
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="card bg-yellow-50 dark:bg-yellow-950/30">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠️ No plan found for this client.{" "}
                                        <a
                                            href="/planning"
                                            className="font-medium underline"
                                        >
                                            Create a plan first
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
                                                    className="text-blue-500"
                                                />
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">{type.label}s</p>
                                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
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
                                <h3 className="card-title mb-4">Content Uploads</h3>
                                {uploads.length > 0 ? (
                                    <div className="space-y-3">
                                        {uploads.map((upload) => {
                                            const TypeIcon = contentTypes.find((t) => t.value === upload.type)?.icon || FileText;
                                            return (
                                                <div
                                                    key={upload.id}
                                                    className="flex items-start gap-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700"
                                                >
                                                    <TypeIcon
                                                        size={24}
                                                        className="flex-shrink-0 text-slate-600 dark:text-slate-400"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className="font-medium text-slate-900 dark:text-slate-50">{upload.title}</h4>
                                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                                    {upload.description}
                                                                </p>
                                                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                                    <span className="rounded bg-slate-100 px-2 py-1 dark:bg-slate-800">
                                                                        {contentTypes.find((t) => t.value === upload.type)?.label}
                                                                    </span>
                                                                    {upload.platform && (
                                                                        <span className="rounded bg-blue-100 px-2 py-1 dark:bg-blue-900">
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
                                                                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="in-progress">In Progress</option>
                                                                    <option value="completed">Completed</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => deleteUpload(upload.id)}
                                                                    className="text-red-500 hover:text-red-700"
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
                                    <p className="py-8 text-center text-slate-500">No uploads yet. Click "Add Upload" to start tracking content.</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Upload Modal */}
                    {showUploadModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                            <div className="w-full max-w-2xl rounded-lg bg-white p-6 dark:bg-slate-900">
                                <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-50">Add Content Upload</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Content Type *</label>
                                        <select
                                            value={newUpload.type}
                                            onChange={(e) => setNewUpload({ ...newUpload, type: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
                                        >
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
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
                                        <input
                                            type="text"
                                            value={newUpload.title}
                                            onChange={(e) => setNewUpload({ ...newUpload, title: e.target.value })}
                                            placeholder="e.g., Product Launch Reel"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                        <textarea
                                            value={newUpload.description}
                                            onChange={(e) => setNewUpload({ ...newUpload, description: e.target.value })}
                                            placeholder="Brief description of the content"
                                            rows={3}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Platform</label>
                                            <select
                                                value={newUpload.platform}
                                                onChange={(e) => setNewUpload({ ...newUpload, platform: e.target.value })}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
                                            >
                                                <option value="">Select platform</option>
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
                                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Scheduled Date
                                            </label>
                                            <input
                                                type="date"
                                                value={newUpload.scheduledDate}
                                                onChange={(e) => setNewUpload({ ...newUpload, scheduledDate: e.target.value })}
                                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end gap-2">
                                    <button
                                        onClick={() => setShowUploadModal(false)}
                                        className="btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddUpload}
                                        className="btn-primary"
                                    >
                                        Add Upload
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
