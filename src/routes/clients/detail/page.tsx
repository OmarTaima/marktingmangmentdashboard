import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Edit2, Target } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useLang } from "@/hooks/useLang";
import type { Client, Segment } from "@/api/interfaces/clientinterface";
import validators from "@/constants/validators";
import ClientInfo from "@/routes/clients/ClientInfo";
import {
    getClientById,
    updateClient,
    deleteClient,
    createSegment,
    updateSegment,
    deleteSegment,
    createCompetitor,
    updateCompetitor,
    deleteCompetitor,
    createBranch,
    updateBranch,
    deleteBranch,
} from "@/api";

const inputBaseClass =
    "w-full rounded-lg border border-light-300 bg-light-50 px-3 py-2 text-sm text-light-900 placeholder-light-400 focus:border-light-500 focus:ring-light-200 dark:border-dark-800 dark:bg-dark-800 dark:text-dark-50";

const buttonGhostClass =
    "rounded-lg border border-light-200 bg-light-100 px-2.5 py-1 text-xs text-light-500 hover:bg-light-200 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-50 dark:hover:bg-dark-800";

const buttonAddClass =
    "rounded-lg border border-light-200 bg-light-100 px-3 py-1 text-xs font-medium text-light-500 hover:bg-light-200 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-50 dark:hover:bg-dark-800";

const ClientDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useLang();
    const [client, setClient] = useState<Client | null>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<Partial<Client> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const makeInvalidClass = (invalid: boolean) => (invalid ? " border-red-500 ring-1 ring-red-200 dark:ring-red-900/30" : "");

    useEffect(() => {
        const abortController = new AbortController();

        loadClient(abortController.signal);

        // Cleanup function to abort request on unmount
        return () => {
            abortController.abort();
        };
    }, [id]);

    useEffect(() => {
        if (searchParams.get("edit") === "true") {
            if (client) {
                setEditing(true);
                setDraft(JSON.parse(JSON.stringify(client)) as Partial<Client>);
            }
        }
    }, [searchParams, client]);

    const loadClient = async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            if (!id) {
                setError("No client id");
                return;
            }
            // Use cached getter to avoid refetching if data is already loaded
            const { getClientByIdCached } = await import("@/api/requests/clientService");
            const clientData = await getClientByIdCached(id);

            // Only update state if component is still mounted
            if (!signal?.aborted) {
                setClient(clientData);
            }
        } catch (err: any) {
            if (err?.name === "AbortError" || err?.name === "CanceledError") {
                return;
            }
            if (!signal?.aborted) {
                setError("Failed to load client data. Please try again.");
            }
        } finally {
            if (!signal?.aborted) {
                setLoading(false);
            }
        }
    };

    const startEditing = () => {
        setDraft(client ? (JSON.parse(JSON.stringify(client)) as Partial<Client>) : null);
        setEditing(true);
    };

    const updateDraftPath = (path: string, value: any) => {
        if (!draft) return;
        setDraft((prev: Partial<Client> | null) => {
            const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
            const parts = path.split(".");
            let cur: Record<string, any> = next as Record<string, any>;
            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i];
                if (!cur[key]) cur[key] = {};
                cur = cur[key];
            }
            cur[parts[parts.length - 1]] = value;
            return next;
        });
    };
    const ensureDraftArray = (path: string) => {
        if (!draft) return;
        setDraft((prev: Partial<Client> | null) => {
            const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
            const parts = path.split(".");
            let cur: Record<string, any> = next as Record<string, any>;
            for (let i = 0; i < parts.length; i++) {
                const key = parts[i];
                if (i === parts.length - 1) {
                    if (!cur[key]) cur[key] = [];
                } else {
                    if (!cur[key]) cur[key] = {};
                    cur = cur[key];
                }
            }
            return next;
        });
    };

    const cancelEditing = () => {
        setDraft(null);
        setEditing(false);
    };

    const saveEditing = async () => {
        if (!draft || !id) return;

        try {
            // Debug: log the raw draft to see what's actually captured from UI edits
            // eslint-disable-next-line no-console
            console.debug("[saveEditing] RAW DRAFT before processing:", JSON.stringify(draft));

            // Deep clone draft to capture all nested changes (SWOT, socialLinks, etc.)
            const draftCopy = JSON.parse(JSON.stringify(draft)) as Record<string, any>;

            // Extract segments, competitors and branches from draft before updating client
            const draftSegments = draftCopy.segments || [];
            const draftCompetitors = draftCopy.competitors || [];
            const draftBranches = draftCopy.branches || [];

            delete draftCopy.segments;
            delete draftCopy.competitors;
            delete draftCopy.branches;

            // Sanitize and ensure socialLinks and swot are included in client payload
            const sanitizedForClient = draftCopy;

            // Normalize socialLinks: flatten grouped object or normalize array entries,
            // and remove any backend-disallowed fields like `_id`.
            if (sanitizedForClient.socialLinks) {
                const flat: any[] = [];
                if (Array.isArray(sanitizedForClient.socialLinks)) {
                    flat.push(...sanitizedForClient.socialLinks);
                } else if (typeof sanitizedForClient.socialLinks === "object") {
                    const business = Array.isArray(sanitizedForClient.socialLinks.business) ? sanitizedForClient.socialLinks.business : [];
                    const personal = Array.isArray(sanitizedForClient.socialLinks.personal) ? sanitizedForClient.socialLinks.personal : [];
                    const custom = Array.isArray(sanitizedForClient.socialLinks.custom) ? sanitizedForClient.socialLinks.custom : [];
                    flat.push(...business, ...personal, ...custom);
                }

                // Main platforms that should always be sent (even with empty URL)
                const mainPlatforms = ["Facebook", "Instagram", "TikTok", "X (Twitter)"];

                sanitizedForClient.socialLinks = flat
                    .map((l: any) => {
                        if (!l) return null;

                        // Extract platform - prioritize l.platform, fallback to l.name
                        let platform = "";
                        if (l.platform && typeof l.platform === "string" && l.platform.trim()) {
                            platform = l.platform.trim();
                        } else if (l.name && typeof l.name === "string" && l.name.trim()) {
                            platform = l.name.trim();
                        } else {
                            platform = "Website";
                        }

                        const url = (l.url || l.link || "").toString().trim();
                        const isMainPlatform = mainPlatforms.includes(platform);
                        // Keep entry if it's a main platform OR if it has a URL
                        if (!url && !isMainPlatform) return null;
                        return { platform, url };
                    })
                    .filter(Boolean);
            }

            // Ensure SWOT object is well-formed
            if (sanitizedForClient.swot && typeof sanitizedForClient.swot === "object") {
                sanitizedForClient.swot = {
                    strengths: Array.isArray(sanitizedForClient.swot.strengths)
                        ? sanitizedForClient.swot.strengths.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean)
                        : [],
                    weaknesses: Array.isArray(sanitizedForClient.swot.weaknesses)
                        ? sanitizedForClient.swot.weaknesses.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean)
                        : [],
                    opportunities: Array.isArray(sanitizedForClient.swot.opportunities)
                        ? sanitizedForClient.swot.opportunities.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean)
                        : [],
                    threats: Array.isArray(sanitizedForClient.swot.threats)
                        ? sanitizedForClient.swot.threats.map((s: any) => (typeof s === "string" ? s.trim() : s)).filter(Boolean)
                        : [],
                };
            }

            // Debug: show payload being sent to updateClient (remove or comment out after verification)
            // eslint-disable-next-line no-console
            console.debug("[saveEditing] sanitized client payload:", JSON.stringify(sanitizedForClient));

            // Update client data (without segments, competitors, branches) — now includes socialLinks and swot
            await updateClient(id, sanitizedForClient);

            // Make a second PUT with full payload to ensure socialLinks and swot persist
            // (backend may ignore nested arrays on first PUT)
            if (sanitizedForClient.socialLinks || sanitizedForClient.swot) {
                const { default: axiosInstance } = await import("@/api/axios");
                const explicitPayload: Record<string, any> = {
                    ...sanitizedForClient,
                };
                if (sanitizedForClient.swot) {
                    explicitPayload.swot_strengths = sanitizedForClient.swot.strengths || [];
                    explicitPayload.swot_weaknesses = sanitizedForClient.swot.weaknesses || [];
                    explicitPayload.swot_opportunities = sanitizedForClient.swot.opportunities || [];
                    explicitPayload.swot_threats = sanitizedForClient.swot.threats || [];
                }
                // eslint-disable-next-line no-console
                console.debug("[saveEditing] explicit socialLinks/swot PUT:", JSON.stringify(explicitPayload));
                await axiosInstance.put(`/clients/${id}`, explicitPayload);
            }

            // === Segments handling ===
            const originalSegments = client?.segments || [];

            for (const segment of draftSegments) {
                try {
                    const sanitized = JSON.parse(JSON.stringify(segment));
                    if (sanitized._interestsText !== undefined) delete sanitized._interestsText;

                    if (sanitized._id) {
                        await updateSegment(id, sanitized._id, sanitized);
                    } else {
                        await createSegment(id, sanitized);
                    }
                } catch (segmentError: any) {
                    // Continue with other segments even if one fails
                }
            }

            for (const originalSegment of originalSegments) {
                const stillExists = draftSegments.find((s: Segment) => s._id === originalSegment._id);
                if (!stillExists && originalSegment._id) {
                    try {
                        await deleteSegment(id, originalSegment._id);
                    } catch (deleteError: any) {
                        console.error("❌ Error deleting segment:", originalSegment.name, deleteError?.response?.data || deleteError);
                    }
                }
            }

            // === Competitors handling ===
            const originalCompetitors = client?.competitors || [];

            for (const competitor of draftCompetitors) {
                try {
                    const sanitized = JSON.parse(JSON.stringify(competitor));
                    // No special temporary fields expected, but keep payload minimal
                    // If it's an existing competitor, update; otherwise create
                    if (sanitized._id) {
                        await updateCompetitor(id, sanitized._id, sanitized);
                    } else {
                        await createCompetitor(id, sanitized);
                    }
                } catch (compError: any) {
                    // Continue with other competitors even if one fails
                    console.error("Error saving competitor:", compError?.response?.data || compError);
                }
            }

            for (const originalCompetitor of originalCompetitors) {
                const stillExists = draftCompetitors.find((c: any) => c._id === originalCompetitor._id);
                if (!stillExists && originalCompetitor._id) {
                    try {
                        await deleteCompetitor(id, originalCompetitor._id);
                    } catch (deleteErr: any) {
                        console.error("❌ Error deleting competitor:", originalCompetitor.name, deleteErr?.response?.data || deleteErr);
                    }
                }
            }

            // === Branches handling ===
            const originalBranches = client?.branches || [];

            for (const branch of draftBranches) {
                try {
                    const sanitized = JSON.parse(JSON.stringify(branch));
                    if (sanitized._id) {
                        await updateBranch(id, sanitized._id, sanitized);
                    } else {
                        await createBranch(id, sanitized);
                    }
                } catch (brErr: any) {
                    console.error("Error saving branch:", brErr?.response?.data || brErr);
                }
            }

            for (const originalBranch of originalBranches) {
                const stillExists = draftBranches.find((b: any) => b._id === originalBranch._id);
                if (!stillExists && originalBranch._id) {
                    try {
                        await deleteBranch(id, originalBranch._id);
                    } catch (deleteErr: any) {
                        console.error("❌ Error deleting branch:", originalBranch.name, deleteErr?.response?.data || deleteErr);
                    }
                }
            }

            setEditing(false);
            setDraft(null);

            // Reload fresh data from API (force bypass cache)
            try {
                // Directly fetch fresh client bypassing any cache implementation
                const freshClient = await getClientById(id as string);
                setClient(freshClient);
            } catch (err) {
                // fallback to cached getter if direct call fails for some reason
                try {
                    const { getClientByIdCached } = await import("@/api/requests/clientService");
                    const freshClient = await getClientByIdCached(id as string);
                    setClient(freshClient);
                } catch (err2) {
                    console.error("Failed to reload client after update:", err2 || err);
                }
            }

            alert("Client updated successfully!");
        } catch (err: any) {
            console.error("Error updating client:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to update client";
            alert(`Error: ${errorMessage}. Please try again.`);
        }
    };

    const handleDeleteClient = async () => {
        if (!window.confirm(t("confirm_delete_client") || "Are you sure you want to delete this client?")) {
            return;
        }

        try {
            if (!id) return;
            await deleteClient(id);
            alert("Client deleted successfully!");
            navigate("/clients");
        } catch (err: any) {
            console.error("Error deleting client:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to delete client";
            alert(`Error: ${errorMessage}. Please try again.`);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="border-light-300 border-t-light-600 dark:border-dark-700 dark:border-t-dark-400 mx-auto h-12 w-12 animate-spin rounded-full border-4"></div>
                    <p className="text-dark-500 mt-4">{t("loading") || "Loading..."}</p>
                </div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="space-y-4 text-center">
                    <p className="text-red-600 dark:text-red-400">{error || "Client not found"}</p>
                    <button
                        onClick={() => navigate("/clients")}
                        className="btn-primary"
                    >
                        {t("back_to_clients") || "Back to Clients"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn-ghost btn-sm btn flex items-center gap-2"
                        aria-label="Back"
                    >
                        <LocalizedArrow className="h-4 w-4" />
                    </button>
                    <h1 className="text-light-900 dark:text-dark-50 text-xl font-semibold">
                        {client.business?.businessName || client.personal?.fullName || t("unnamed_business")}
                    </h1>
                </div>

                <div className="flex min-w-0 items-center gap-2">
                    {!editing ? (
                        <>
                            <button
                                onClick={startEditing}
                                className="btn-primary flex items-center gap-2"
                                aria-label="Edit"
                            >
                                <Edit2 className="h-4 w-4" />
                                <span className="hidden sm:inline">{t("edit")}</span>
                            </button>
                            <button
                                onClick={handleDeleteClient}
                                className="btn-ghost flex items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                aria-label="Delete"
                            >
                                <span className="hidden sm:inline">{t("delete") || "Delete"}</span>
                            </button>
                        </>
                    ) : (
                        <div className="flex min-w-0 gap-2">
                            <button
                                onClick={saveEditing}
                                className="btn-primary flex items-center gap-2"
                            >
                                {t("save") || "Save"}
                            </button>
                            <button
                                onClick={cancelEditing}
                                className="btn-ghost flex items-center gap-2"
                            >
                                {t("cancel") || "Cancel"}
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            navigate("/strategies");
                        }}
                        className="btn-primary btn-sm flex items-center gap-2"
                    >
                        {t("plan_campaign")}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <ClientInfo
                        client={client}
                        compact={false}
                        editing={editing}
                        draft={draft}
                        setDraft={setDraft}
                    />
                </div>

                <div className="space-y-4 lg:col-span-2">
                    {/* SWOT */}
                    <div className="card transition-colors duration-300">
                        <h3 className="card-title mb-4">{t("swot") || "SWOT Analysis"}</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {["strengths", "weaknesses", "opportunities", "threats"].map((key) => {
                                const titleMap = {
                                    strengths: {
                                        label: t("strengths") || "Strengths",
                                        color: "text-green-600",
                                    },
                                    weaknesses: {
                                        label: t("weaknesses") || "Weaknesses",
                                        color: "text-red-600",
                                    },
                                    opportunities: {
                                        label: t("opportunities") || "Opportunities",
                                        color: "text-secdark-700",
                                    },
                                    threats: {
                                        label: t("threats") || "Threats",
                                        color: "text-orange-600",
                                    },
                                };
                                const k = key as keyof Client["swot"];
                                const items: any[] = (editing ? (draft?.swot as any)?.[k] : (client?.swot as any)?.[k]) || [];
                                return (
                                    <div key={key}>
                                        <h4 className={`mb-2 font-medium ${titleMap[key as keyof typeof titleMap].color}`}>
                                            {key === "strengths" ? "💪 " : key === "weaknesses" ? "⚠️ " : key === "opportunities" ? "🎯 " : "⚡ "}
                                            {titleMap[key as keyof typeof titleMap].label}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            {items.length > 0 ? (
                                                items.map((item: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center gap-2"
                                                    >
                                                        {editing ? (
                                                            <input
                                                                className={inputBaseClass}
                                                                value={item}
                                                                onChange={(e) => updateDraftPath(`swot.${key}.${idx}`, e.target.value)}
                                                            />
                                                        ) : (
                                                            <div className="text-light-900 dark:text-dark-50">{item}</div>
                                                        )}
                                                        {editing && (
                                                            <button
                                                                className={buttonGhostClass}
                                                                onClick={() => {
                                                                    setDraft((prev: Partial<Client> | null) => {
                                                                        const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
                                                                        next.swot = next.swot || {};
                                                                        next.swot[key] = next.swot[key] || [];
                                                                        next.swot[key].splice(idx, 1);
                                                                        return next;
                                                                    });
                                                                }}
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-dark-500">{t("none_listed") || "None listed"}</div>
                                            )}
                                            {editing && (
                                                <button
                                                    className={buttonAddClass}
                                                    onClick={() => {
                                                        ensureDraftArray("swot." + key);
                                                        setDraft((prev: Partial<Client> | null) => {
                                                            const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
                                                            next.swot = next.swot || {};
                                                            next.swot[key] = next.swot[key] || [];
                                                            next.swot[key].push("");
                                                            return next;
                                                        });
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Competitors */}
                    <div className="card transition-colors duration-300">
                        <h3 className="card-title mb-4">{t("competitors") || "Competitors"}</h3>
                        {(editing ? draft?.competitors || [] : client.competitors || []).length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(editing ? draft?.competitors || [] : client.competitors || []).map((competitor, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-dark-50 dark:bg-dark-800/50 rounded-lg p-3 transition-colors duration-300"
                                    >
                                        {editing ? (
                                            <>
                                                <input
                                                    className={inputBaseClass}
                                                    value={competitor.name || ""}
                                                    placeholder={t("name_label") || "Name"}
                                                    onChange={(e) => updateDraftPath(`competitors.${idx}.name`, e.target.value)}
                                                />
                                                <textarea
                                                    className={`${inputBaseClass} mt-2`}
                                                    value={competitor.description || ""}
                                                    placeholder={t("description") || "Description"}
                                                    onChange={(e) => updateDraftPath(`competitors.${idx}.description`, e.target.value)}
                                                />
                                                {/* Social Links in editing mode */}
                                                <div className="mt-2 space-y-2">
                                                    <label className="text-light-600 dark:text-dark-400 text-xs">
                                                        {t("social_media") || "Social Media"}
                                                    </label>
                                                    {["website", "facebook", "instagram", "twitter", "tiktok"].map((platform) => {
                                                        // Find the link for this platform in socialLinks array
                                                        const linkObj = competitor.socialLinks?.find((l: any) => l.platform === platform);
                                                        const val = linkObj?.url || "";
                                                        const invalid = val !== "" && !validators.isValidURL(val, { allowProtocolLess: true });

                                                        return (
                                                            <div key={platform}>
                                                                <input
                                                                    className={`${inputBaseClass} ${makeInvalidClass(invalid)}`}
                                                                    value={val}
                                                                    placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                                                                    onChange={(e) => {
                                                                        const newUrl = e.target.value;
                                                                        setDraft((prev: Partial<Client> | null) => {
                                                                            const next = JSON.parse(JSON.stringify(prev || {})) as Record<
                                                                                string,
                                                                                any
                                                                            >;
                                                                            if (!next.competitors) next.competitors = [];
                                                                            if (!next.competitors[idx]) next.competitors[idx] = {};
                                                                            if (!next.competitors[idx].socialLinks)
                                                                                next.competitors[idx].socialLinks = [];

                                                                            // Find existing link or create new one
                                                                            const existingLinkIdx = next.competitors[idx].socialLinks.findIndex(
                                                                                (l: any) => l.platform === platform,
                                                                            );

                                                                            if (newUrl.trim()) {
                                                                                if (existingLinkIdx >= 0) {
                                                                                    next.competitors[idx].socialLinks[existingLinkIdx].url = newUrl;
                                                                                } else {
                                                                                    next.competitors[idx].socialLinks.push({ platform, url: newUrl });
                                                                                }
                                                                            } else {
                                                                                // Remove if empty
                                                                                if (existingLinkIdx >= 0) {
                                                                                    next.competitors[idx].socialLinks.splice(existingLinkIdx, 1);
                                                                                }
                                                                            }

                                                                            return next;
                                                                        });
                                                                    }}
                                                                />
                                                                {invalid && (
                                                                    <div className="mt-1 text-xs text-red-600">
                                                                        {t("invalid_url") || "Invalid URL"}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* SWOT Analysis in editing mode */}
                                                <div className="mt-3 space-y-2">
                                                    <label className="text-light-600 dark:text-dark-400 text-xs">
                                                        {t("swot_analysis") || "SWOT Analysis"}
                                                    </label>

                                                    {/* Strengths */}
                                                    <div>
                                                        <label className="text-xs text-green-600 dark:text-green-400">
                                                            {t("strengths") || "Strengths"}
                                                        </label>
                                                        <textarea
                                                            className={`${inputBaseClass} text-xs`}
                                                            rows={2}
                                                            value={(competitor.swot_strengths || []).join("\n")}
                                                            placeholder={t("one_per_line") || "One per line"}
                                                            onChange={(e) => {
                                                                const values = e.target.value.split("\n").filter((v) => v.trim());
                                                                updateDraftPath(`competitors.${idx}.swot_strengths`, values);
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Weaknesses */}
                                                    <div>
                                                        <label className="text-xs text-red-600 dark:text-red-400">
                                                            {t("weaknesses") || "Weaknesses"}
                                                        </label>
                                                        <textarea
                                                            className={`${inputBaseClass} text-xs`}
                                                            rows={2}
                                                            value={(competitor.swot_weaknesses || []).join("\n")}
                                                            placeholder={t("one_per_line") || "One per line"}
                                                            onChange={(e) => {
                                                                const values = e.target.value.split("\n").filter((v) => v.trim());
                                                                updateDraftPath(`competitors.${idx}.swot_weaknesses`, values);
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Opportunities */}
                                                    <div>
                                                        <label className="text-xs text-blue-600 dark:text-blue-400">
                                                            {t("opportunities") || "Opportunities"}
                                                        </label>
                                                        <textarea
                                                            className={`${inputBaseClass} text-xs`}
                                                            rows={2}
                                                            value={(competitor.swot_opportunities || []).join("\n")}
                                                            placeholder={t("one_per_line") || "One per line"}
                                                            onChange={(e) => {
                                                                const values = e.target.value.split("\n").filter((v) => v.trim());
                                                                updateDraftPath(`competitors.${idx}.swot_opportunities`, values);
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Threats */}
                                                    <div>
                                                        <label className="text-xs text-orange-600 dark:text-orange-400">
                                                            {t("threats") || "Threats"}
                                                        </label>
                                                        <textarea
                                                            className={`${inputBaseClass} text-xs`}
                                                            rows={2}
                                                            value={(competitor.swot_threats || []).join("\n")}
                                                            placeholder={t("one_per_line") || "One per line"}
                                                            onChange={(e) => {
                                                                const values = e.target.value.split("\n").filter((v) => v.trim());
                                                                updateDraftPath(`competitors.${idx}.swot_threats`, values);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-2">
                                                    <button
                                                        className={buttonGhostClass}
                                                        onClick={() =>
                                                            setDraft((prev: Partial<Client> | null) => {
                                                                const next = JSON.parse(JSON.stringify(prev || {})) as Partial<Client> &
                                                                    Record<string, any>;
                                                                next.competitors = next.competitors || [];
                                                                next.competitors.splice(idx, 1);
                                                                return next;
                                                            })
                                                        }
                                                    >
                                                        {t("remove") || "Remove"}
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h4 className="text-light-900 dark:text-dark-50 font-medium">{competitor.name}</h4>
                                                <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{competitor.description}</p>

                                                {/* Social Links */}
                                                {competitor.socialLinks && competitor.socialLinks.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {competitor.socialLinks.map((link: any, linkIdx: number) => {
                                                            const platformLower = (link.platform || "").toLowerCase();
                                                            let Icon = null;
                                                            let colorClass = "text-light-600";
                                                            if (platformLower === "facebook") {
                                                                Icon = SiFacebook;
                                                                colorClass = "text-secdark-700";
                                                            } else if (platformLower === "instagram") {
                                                                Icon = SiInstagram;
                                                                colorClass = "text-pink-600";
                                                            } else if (platformLower === "tiktok") {
                                                                Icon = SiTiktok;
                                                                colorClass = "text-dark-900 dark:text-dark-50";
                                                            } else if (platformLower === "twitter" || platformLower === "x") {
                                                                Icon = SiX;
                                                                colorClass = "text-dark-900 dark:text-dark-50";
                                                            }
                                                            return (
                                                                <a
                                                                    key={linkIdx}
                                                                    href={link.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`${colorClass} transition-opacity hover:opacity-70`}
                                                                    title={`${link.platform}: ${link.url}`}
                                                                >
                                                                    {Icon ? <Icon size={18} /> : <span className="text-xs">{link.platform}</span>}
                                                                </a>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* Website (if not in socialLinks) */}
                                                {competitor.website && (
                                                    <a
                                                        href={competitor.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-light-500 mt-2 block text-xs break-words hover:underline"
                                                    >
                                                        {competitor.website}
                                                    </a>
                                                )}

                                                {/* SWOT Analysis */}
                                                {((competitor.swot_strengths && competitor.swot_strengths.length > 0) ||
                                                    (competitor.swot_weaknesses && competitor.swot_weaknesses.length > 0) ||
                                                    (competitor.swot_opportunities && competitor.swot_opportunities.length > 0) ||
                                                    (competitor.swot_threats && competitor.swot_threats.length > 0)) && (
                                                    <div className="mt-3 space-y-2 text-xs">
                                                        {competitor.swot_strengths && competitor.swot_strengths.length > 0 && (
                                                            <div>
                                                                <strong className="text-green-600 dark:text-green-400">
                                                                    {t("strengths") || "Strengths"}:
                                                                </strong>
                                                                <ul className="text-light-700 dark:text-dark-300 mt-1 ml-2 list-inside list-disc">
                                                                    {competitor.swot_strengths.map((s: string, i: number) => (
                                                                        <li key={i}>{s}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {competitor.swot_weaknesses && competitor.swot_weaknesses.length > 0 && (
                                                            <div>
                                                                <strong className="text-red-600 dark:text-red-400">
                                                                    {t("weaknesses") || "Weaknesses"}:
                                                                </strong>
                                                                <ul className="text-light-700 dark:text-dark-300 mt-1 ml-2 list-inside list-disc">
                                                                    {competitor.swot_weaknesses.map((w: string, i: number) => (
                                                                        <li key={i}>{w}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {competitor.swot_opportunities && competitor.swot_opportunities.length > 0 && (
                                                            <div>
                                                                <strong className="text-blue-600 dark:text-blue-400">
                                                                    {t("opportunities") || "Opportunities"}:
                                                                </strong>
                                                                <ul className="text-light-700 dark:text-dark-300 mt-1 ml-2 list-inside list-disc">
                                                                    {competitor.swot_opportunities.map((o: string, i: number) => (
                                                                        <li key={i}>{o}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {competitor.swot_threats && competitor.swot_threats.length > 0 && (
                                                            <div>
                                                                <strong className="text-orange-600 dark:text-orange-400">
                                                                    {t("threats") || "Threats"}:
                                                                </strong>
                                                                <ul className="text-light-700 dark:text-dark-300 mt-1 ml-2 list-inside list-disc">
                                                                    {competitor.swot_threats.map((t: string, i: number) => (
                                                                        <li key={i}>{t}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-dark-500 text-sm">{t("no_competitors_tracked") || "No competitors tracked"}</p>
                        )}
                        {editing && (
                            <div className="mt-2">
                                <button
                                    className={buttonAddClass}
                                    onClick={() => {
                                        setDraft((prev: Partial<Client> | null) => {
                                            const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
                                            next.competitors = next.competitors || [];
                                            next.competitors.push({
                                                name: "",
                                                description: "",
                                                socialLinks: [],
                                                swot_strengths: [],
                                                swot_weaknesses: [],
                                                swot_opportunities: [],
                                                swot_threats: [],
                                            });
                                            return next;
                                        });
                                    }}
                                >
                                    {t("add_competitor") || "Add competitor"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Social Media */}
                    <div className="card transition-colors duration-300">
                        <h3 className="card-title mb-4">{t("social_media") || "Social Media"}</h3>
                        <div className="space-y-2">
                            {(editing ? draft?.socialLinks?.business || [] : client.socialLinks?.business || []).map((link, idx) => {
                                const platformLower = (link.platform || "").toLowerCase();
                                let Icon = null;
                                let colorClass = "text-light-600";
                                if (platformLower.includes("facebook")) {
                                    Icon = SiFacebook;
                                    colorClass = "text-secdark-700";
                                } else if (platformLower.includes("instagram")) {
                                    Icon = SiInstagram;
                                    colorClass = "text-pink-600";
                                } else if (platformLower.includes("tiktok")) {
                                    Icon = SiTiktok;
                                    colorClass = "text-light-900 dark:text-white";
                                } else if (platformLower.includes("x") || platformLower.includes("twitter")) {
                                    Icon = SiX;
                                    colorClass = "text-light-900 dark:text-white";
                                }

                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2"
                                    >
                                        {editing ? (
                                            <>
                                                <input
                                                    className={inputBaseClass}
                                                    value={link.platform || ""}
                                                    placeholder={t("platform_label") || "Platform"}
                                                    onChange={(e) => updateDraftPath(`socialLinks.business.${idx}.platform`, e.target.value)}
                                                />
                                                {(() => {
                                                    const val = link.url || "";
                                                    const invalid = val !== "" && !validators.isValidURL(val, { allowProtocolLess: true });
                                                    return (
                                                        <div className="flex-1">
                                                            <input
                                                                className={`${inputBaseClass} ${makeInvalidClass(invalid)}`}
                                                                value={val}
                                                                placeholder={t("url_label") || "URL"}
                                                                onChange={(e) => updateDraftPath(`socialLinks.business.${idx}.url`, e.target.value)}
                                                            />
                                                            {invalid && (
                                                                <div className="mt-1 text-xs text-red-600">{t("invalid_url") || "Invalid URL"}</div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                <button
                                                    className={buttonGhostClass}
                                                    onClick={() => {
                                                        setDraft((prev: Partial<Client> | null) => {
                                                            const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
                                                            next.socialLinks = next.socialLinks || {};
                                                            next.socialLinks.business = next.socialLinks.business || [];
                                                            next.socialLinks.business.splice(idx, 1);
                                                            return next;
                                                        });
                                                    }}
                                                >
                                                    {t("remove") || "Remove"}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {Icon && <Icon className={`${colorClass} h-5 w-5`} />}
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-secdark-700 hover:underline"
                                                >
                                                    {link.platform}
                                                </a>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                            {editing && (
                                <button
                                    className={buttonAddClass}
                                    onClick={() => {
                                        setDraft((prev: Partial<Client> | null) => {
                                            const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
                                            if (!next.socialLinks) next.socialLinks = {};
                                            if (!next.socialLinks.business) next.socialLinks.business = [];
                                            next.socialLinks.business.push({
                                                platform: "",
                                                url: "",
                                            });
                                            return next;
                                        });
                                    }}
                                >
                                    {t("add_link") || "Add link"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Market Segments */}
                    <div className="card transition-colors duration-300">
                        <h3 className="card-title mb-4 flex items-center gap-2">
                            <Target size={18} />
                            {t("target_segments") || "Market Segments"}
                        </h3>
                        <div className="space-y-3">
                            {(editing ? draft?.segments || [] : client.segments || []).map((segment, idx) => (
                                <div
                                    key={segment._id || idx}
                                    className="border-light-300 dark:border-dark-700 dark:bg-dark-800/50 rounded-lg border bg-white p-4"
                                >
                                    {editing ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-light-700 dark:text-dark-300 mb-1 block text-sm font-medium">
                                                    {t("segment_name") || "Segment Name"} *
                                                </label>
                                                <input
                                                    className={inputBaseClass}
                                                    value={segment.name || ""}
                                                    placeholder={t("segment_name_placeholder") || "e.g., Young Professionals"}
                                                    onChange={(e) => updateDraftPath(`segments.${idx}.name`, e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-light-700 dark:text-dark-300 mb-1 block text-sm font-medium">
                                                    {t("description") || "Description"}
                                                </label>
                                                <textarea
                                                    className={`${inputBaseClass} min-h-[60px]`}
                                                    value={segment.description || ""}
                                                    placeholder={t("segment_description_placeholder") || "Describe this market segment..."}
                                                    onChange={(e) => updateDraftPath(`segments.${idx}.description`, e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div>
                                                    <label className="text-light-700 dark:text-dark-300 mb-1 block text-sm font-medium">
                                                        {t("age_range") || "Age Range"}
                                                    </label>
                                                    <input
                                                        className={inputBaseClass}
                                                        value={segment.ageRange || ""}
                                                        placeholder={t("age_range_placeholder") || "e.g., 25-35"}
                                                        onChange={(e) => updateDraftPath(`segments.${idx}.ageRange`, e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-light-700 dark:text-dark-300 mb-1 block text-sm font-medium">
                                                        {t("gender") || "Gender"}
                                                    </label>
                                                    <select
                                                        className={inputBaseClass}
                                                        value={segment.gender || "all"}
                                                        onChange={(e) => updateDraftPath(`segments.${idx}.gender`, e.target.value)}
                                                    >
                                                        <option value="all">{t("all_genders") || "All"}</option>
                                                        <option value="male">{t("male") || "Male"}</option>
                                                        <option value="female">{t("female") || "Female"}</option>
                                                        <option value="other">{t("other") || "Other"}</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-light-700 dark:text-dark-300 mb-1 block text-sm font-medium">
                                                        {t("income_level") || "Income Level"}
                                                    </label>
                                                    <select
                                                        className={inputBaseClass}
                                                        value={segment.incomeLevel || ""}
                                                        onChange={(e) => updateDraftPath(`segments.${idx}.incomeLevel`, e.target.value)}
                                                    >
                                                        <option value="">{t("select") || "Select..."}</option>
                                                        <option value="low">{t("low") || "Low"}</option>
                                                        <option value="middle">{t("middle") || "Middle"}</option>
                                                        <option value="high">{t("high") || "High"}</option>
                                                        <option value="varied">{t("varied") || "Varied"}</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-light-700 dark:text-dark-300 mb-1 block text-sm font-medium">
                                                        {t("interests") || "Interests"}
                                                    </label>
                                                    <textarea
                                                        className={`${inputBaseClass} min-h-[60px]`}
                                                        value={
                                                            // Prefer temporary raw text while editing to preserve spaces
                                                            (segment as any)._interestsText !== undefined
                                                                ? (segment as any)._interestsText
                                                                : Array.isArray(segment.interests)
                                                                  ? segment.interests.join("\n")
                                                                  : segment.interests || ""
                                                        }
                                                        placeholder={
                                                            t("interests_placeholder") || "Enter interests (one per line or comma-separated)"
                                                        }
                                                        onChange={(e) => updateDraftPath(`segments.${idx}._interestsText`, e.target.value)}
                                                        onBlur={() => {
                                                            const raw =
                                                                (segment as any)._interestsText !== undefined
                                                                    ? (segment as any)._interestsText
                                                                    : Array.isArray(segment.interests)
                                                                      ? segment.interests.join("\n")
                                                                      : segment.interests || "";
                                                            const interestsArray = raw
                                                                .split(/[,;\n]+/)
                                                                .map((i: string) => i.trim())
                                                                .filter((i: string) => i.length > 0);
                                                            updateDraftPath(`segments.${idx}.interests`, interestsArray);
                                                            // remove temporary field
                                                            updateDraftPath(`segments.${idx}._interestsText`, undefined);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                className={`${buttonGhostClass} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20`}
                                                onClick={() => {
                                                    setDraft((prev: Partial<Client> | null) => {
                                                        const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
                                                        next.segments = next.segments || [];
                                                        next.segments.splice(idx, 1);
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {t("remove_segment") || "Remove Segment"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <h4 className="text-light-900 dark:text-dark-50 mb-2 font-semibold">{segment.name}</h4>
                                            {segment.description && (
                                                <p className="text-light-600 dark:text-dark-400 mb-3 text-sm">{segment.description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-2">
                                                {segment.ageRange && (
                                                    <span className="bg-light-100 dark:bg-dark-700 text-light-700 dark:text-dark-300 rounded px-2 py-1 text-xs">
                                                        Age: {segment.ageRange}
                                                    </span>
                                                )}
                                                {segment.gender && segment.gender !== "all" && (
                                                    <span className="bg-light-100 dark:bg-dark-700 text-light-700 dark:text-dark-300 rounded px-2 py-1 text-xs">
                                                        {segment.gender.charAt(0).toUpperCase() + segment.gender.slice(1)}
                                                    </span>
                                                )}
                                                {segment.incomeLevel && (
                                                    <span className="bg-light-100 dark:bg-dark-700 text-light-700 dark:text-dark-300 rounded px-2 py-1 text-xs">
                                                        {segment.incomeLevel.charAt(0).toUpperCase() + segment.incomeLevel.slice(1)} Income
                                                    </span>
                                                )}
                                                {segment.interests && segment.interests.length > 0 && (
                                                    <>
                                                        {segment.interests.map((interest, iIdx) => (
                                                            <span
                                                                key={iIdx}
                                                                className="bg-light-100 text-light-700 dark:bg-dark-900/30 dark:text-dark-300 rounded px-2 py-1 text-xs"
                                                            >
                                                                {interest}
                                                            </span>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(editing ? draft?.segments || [] : client.segments || []).length === 0 && !editing && (
                                <div className="text-light-600 dark:text-dark-400 text-sm">
                                    {t("no_segments") || "No market segments defined yet."}
                                </div>
                            )}
                            {editing && (
                                <button
                                    className={buttonAddClass}
                                    onClick={() => {
                                        setDraft((prev: Partial<Client> | null) => {
                                            const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
                                            next.segments = next.segments || [];
                                            next.segments.push({
                                                name: "",
                                                description: "",
                                                ageRange: "",
                                                gender: "all",
                                                interests: [],
                                                incomeLevel: "",
                                            });
                                            return next;
                                        });
                                    }}
                                >
                                    {t("add_segment") || "Add Segment"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailPage;
