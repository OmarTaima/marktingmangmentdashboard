import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Users, Mail, Phone, MapPin, Edit2, Target } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useQueryClient } from "@tanstack/react-query";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import validators from "@/constants/validators";
import type { Client, Segment } from "@/api/interfaces/clientinterface";
import {
    useClient,
    useUpdateClient,
    useDeleteClient,
    useCreateSegment,
    useUpdateSegment,
    useDeleteSegment,
    useCreateCompetitor,
    useUpdateCompetitor,
    useDeleteCompetitor,
    useCreateBranch,
    useUpdateBranch,
    useDeleteBranch,
    clientsKeys,
} from "@/hooks/queries";

interface ClientInfoProps {
    client?: Client | null;
    compact?: boolean;
    editing?: boolean;
    draft?: Partial<Client> | null;
    setDraft?: React.Dispatch<React.SetStateAction<Partial<Client> | null>> | null;
    fullPage?: boolean;
}

const ClientInfo: React.FC<ClientInfoProps> = ({
    client: propClient,
    compact = false,
    editing: propEditing = false,
    draft: propDraft = null,
    setDraft: propSetDraft = null,
    fullPage = false,
}) => {
    const { t } = useLang();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    // Full page state management
    const {
        data: fetchedClient,
        isLoading: loading,
        error: queryError,
    } = fullPage ? useClient(id || "") : { data: null, isLoading: false, error: null };
    const error = queryError?.message || null;

    // React Query mutations (only for full page)
    const updateClientMutation = fullPage ? useUpdateClient() : null;
    const deleteClientMutation = fullPage ? useDeleteClient() : null;
    const createSegmentMutation = fullPage ? useCreateSegment() : null;
    const updateSegmentMutation = fullPage ? useUpdateSegment() : null;
    const deleteSegmentMutation = fullPage ? useDeleteSegment() : null;
    const createCompetitorMutation = fullPage ? useCreateCompetitor() : null;
    const updateCompetitorMutation = fullPage ? useUpdateCompetitor() : null;
    const deleteCompetitorMutation = fullPage ? useDeleteCompetitor() : null;
    const createBranchMutation = fullPage ? useCreateBranch() : null;
    const updateBranchMutation = fullPage ? useUpdateBranch() : null;
    const deleteBranchMutation = fullPage ? useDeleteBranch() : null;

    const [localEditing, setLocalEditing] = useState<boolean>(propEditing);
    const [localDraft, setLocalDraft] = useState<Partial<Client> | null>(propDraft);
    const [expandedCompetitorId, setExpandedCompetitorId] = useState<string | null>(null);

    // Use local state for fullPage mode, props for nested mode
    const editing = fullPage ? localEditing : propEditing;
    const draft = fullPage ? localDraft : propDraft;
    const setEditing = fullPage ? setLocalEditing : () => {};
    const setDraft = fullPage ? setLocalDraft : propSetDraft || (() => {});

    // Use fetched client if full page, otherwise use prop client
    const client = fullPage ? fetchedClient : propClient;

    // Removed localStorage-dependent state since localStorage is disabled
    const clientObjectives: any[] = [];
    const draftDate: Date | null = null;

    useEffect(() => {
        if (fullPage && searchParams.get("edit") === "true" && client) {
            setEditing(true);
            setDraft(JSON.parse(JSON.stringify(client)) as Partial<Client>);
        }
    }, [fullPage, searchParams, client]);

    // Use segments from client object or fetch separately if needed
    if (!client && !draft) {
        if (fullPage && loading) {
            return (
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="text-center">
                        <div className="border-light-300 border-t-light-600 dark:border-dark-700 dark:border-t-dark-400 mx-auto h-12 w-12 animate-spin rounded-full border-4"></div>
                        <p className="text-dark-500 mt-4">{t("loading") || "Loading..."}</p>
                    </div>
                </div>
            );
        }
        if (fullPage && error) {
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
        return null;
    }

    const data: Partial<Client> = editing && draft ? draft || {} : client || {};

    const updateDraft = (path: string, value: any): void => {
        const setDraftFn = fullPage ? setDraft : propSetDraft;
        if (!editing || !setDraftFn || !draft) return;
        setDraftFn((prev: Partial<Client> | null) => {
            const next = JSON.parse(JSON.stringify(prev || {})) as Partial<Client> & Record<string, any>;
            const parts = path.split(".");
            let cur: Record<string, any> = next as Record<string, any>;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!cur[parts[i]]) cur[parts[i]] = {};
                cur = cur[parts[i]];
            }
            cur[parts[parts.length - 1]] = value;
            return next;
        });
    };

    const ensureDraftArray = (path: string) => {
        const setDraftFn = fullPage ? setDraft : propSetDraft;
        if (!draft || !setDraftFn) return;
        setDraftFn((prev: Partial<Client> | null) => {
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

    const startEditing = () => {
        setDraft(client ? (JSON.parse(JSON.stringify(client)) as Partial<Client>) : null);
        setEditing(true);
    };

    const cancelEditing = () => {
        setDraft(null);
        setEditing(false);
    };

    // Helper function to deep compare two objects
    const hasChanges = (obj1: any, obj2: any): boolean => {
        const json1 = JSON.stringify(obj1);
        const json2 = JSON.stringify(obj2);
        return json1 !== json2;
    };

    const saveEditing = async () => {
        if (!draft || !id || !fullPage) return;

        try {
            console.debug("[saveEditing] RAW DRAFT before processing:", JSON.stringify(draft));

            const draftCopy = JSON.parse(JSON.stringify(draft)) as Record<string, any>;
            const draftSegments = draftCopy.segments || [];
            const draftCompetitors = draftCopy.competitors || [];
            const draftBranches = draftCopy.branches || [];

            delete draftCopy.segments;
            delete draftCopy.competitors;
            delete draftCopy.branches;

            const sanitizedForClient = draftCopy;

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

                const mainPlatforms = ["Facebook", "Instagram", "TikTok", "X (Twitter)"];

                sanitizedForClient.socialLinks = flat
                    .map((l: any) => {
                        if (!l) return null;
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
                        if (!url && !isMainPlatform) return null;
                        return { platform, url };
                    })
                    .filter(Boolean);
            }

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

            console.debug("[saveEditing] sanitized client payload:", JSON.stringify(sanitizedForClient));

            await updateClientMutation!.mutateAsync({ id, data: sanitizedForClient });

            const originalSegments = client?.segments || [];
            const segmentOperations = [];

            for (const segment of draftSegments) {
                const sanitized = JSON.parse(JSON.stringify(segment));
                if (sanitized._interestsText !== undefined) delete sanitized._interestsText;

                if (sanitized._id) {
                    // Only update if the segment has actually changed
                    const originalSegment = originalSegments.find((s: Segment) => s._id === sanitized._id);
                    if (originalSegment) {
                        const originalSanitized = JSON.parse(JSON.stringify(originalSegment));
                        if (originalSanitized._interestsText !== undefined) delete originalSanitized._interestsText;

                        if (hasChanges(originalSanitized, sanitized)) {
                            segmentOperations.push(
                                updateSegmentMutation!
                                    .mutateAsync({ clientId: id, segmentId: sanitized._id, data: sanitized }, { onSuccess: () => {} })
                                    .catch((err) => console.error("Error updating segment:", err)),
                            );
                        }
                    }
                } else {
                    segmentOperations.push(
                        createSegmentMutation!
                            .mutateAsync({ clientId: id, data: sanitized }, { onSuccess: () => {} })
                            .catch((err) => console.error("Error creating segment:", err)),
                    );
                }
            }

            for (const originalSegment of originalSegments) {
                const stillExists = draftSegments.find((s: Segment) => s._id === originalSegment._id);
                if (!stillExists && originalSegment._id) {
                    segmentOperations.push(
                        deleteSegmentMutation!
                            .mutateAsync({ clientId: id, segmentId: originalSegment._id }, { onSuccess: () => {} })
                            .catch((err) => console.error("Error deleting segment:", err)),
                    );
                }
            }

            if (segmentOperations.length > 0) {
                await Promise.all(segmentOperations);
            }

            const originalCompetitors = client?.competitors || [];
            const competitorOperations = [];

            for (const competitor of draftCompetitors) {
                const sanitized = JSON.parse(JSON.stringify(competitor));

                if (sanitized._id) {
                    // Only update if the competitor has actually changed
                    const originalCompetitor = originalCompetitors.find((c: any) => c._id === sanitized._id);
                    if (originalCompetitor && hasChanges(originalCompetitor, sanitized)) {
                        competitorOperations.push(
                            updateCompetitorMutation!
                                .mutateAsync({ clientId: id, competitorId: sanitized._id, data: sanitized }, { onSuccess: () => {} })
                                .catch((err) => console.error("Error updating competitor:", err)),
                        );
                    }
                } else {
                    competitorOperations.push(
                        createCompetitorMutation!
                            .mutateAsync({ clientId: id, data: sanitized }, { onSuccess: () => {} })
                            .catch((err) => console.error("Error creating competitor:", err)),
                    );
                }
            }

            for (const originalCompetitor of originalCompetitors) {
                const stillExists = draftCompetitors.find((c: any) => c._id === originalCompetitor._id);
                if (!stillExists && originalCompetitor._id) {
                    competitorOperations.push(
                        deleteCompetitorMutation!
                            .mutateAsync({ clientId: id, competitorId: originalCompetitor._id }, { onSuccess: () => {} })
                            .catch((err) => console.error("Error deleting competitor:", err)),
                    );
                }
            }

            if (competitorOperations.length > 0) {
                await Promise.all(competitorOperations);
            }

            const originalBranches = client?.branches || [];
            const branchOperations = [];

            for (const branch of draftBranches) {
                const sanitized = JSON.parse(JSON.stringify(branch));

                if (sanitized._id) {
                    // Only update if the branch has actually changed
                    const originalBranch = originalBranches.find((b: any) => b._id === sanitized._id);
                    if (originalBranch && hasChanges(originalBranch, sanitized)) {
                        branchOperations.push(
                            updateBranchMutation!
                                .mutateAsync({ clientId: id, branchId: sanitized._id, data: sanitized }, { onSuccess: () => {} })
                                .catch((err) => console.error("Error updating branch:", err)),
                        );
                    }
                } else {
                    branchOperations.push(
                        createBranchMutation!
                            .mutateAsync({ clientId: id, data: sanitized }, { onSuccess: () => {} })
                            .catch((err) => console.error("Error creating branch:", err)),
                    );
                }
            }

            for (const originalBranch of originalBranches) {
                const stillExists = draftBranches.find((b: any) => b._id === originalBranch._id);
                if (!stillExists && originalBranch._id) {
                    branchOperations.push(
                        deleteBranchMutation!
                            .mutateAsync({ clientId: id, branchId: originalBranch._id }, { onSuccess: () => {} })
                            .catch((err) => console.error("Error deleting branch:", err)),
                    );
                }
            }

            if (branchOperations.length > 0) {
                await Promise.all(branchOperations);
            }

            await queryClient.refetchQueries({
                queryKey: clientsKeys.detail(id),
                exact: true,
            });

            setEditing(false);
            setDraft(null);

            alert("Client updated successfully!");
        } catch (err: any) {
            console.error("Error updating client:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to update client";
            alert(`Error: ${errorMessage}. Please try again.`);
        }
    };

    const handleDeleteClient = async () => {
        if (!fullPage || !id) return;
        if (!window.confirm(t("confirm_delete_client") || "Are you sure you want to delete this client?")) {
            return;
        }

        try {
            await deleteClientMutation!.mutateAsync(id);
            alert("Client deleted successfully!");
            navigate("/clients");
        } catch (err: any) {
            console.error("Error deleting client:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to delete client";
            alert(`Error: ${errorMessage}. Please try again.`);
        }
    };

    const inputBaseClass =
        "w-full rounded-lg border border-light-300 bg-light-50 px-3 py-2 text-sm text-light-900 placeholder-light-400 focus:border-light-500 focus:ring-light-200 dark:border-dark-800 dark:bg-dark-800 dark:text-dark-50";

    const buttonGhostClass =
        "rounded-lg border border-light-200 bg-light-100 px-2.5 py-1 text-xs text-light-500 hover:bg-light-200 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-50 dark:hover:bg-dark-800";

    const buttonAddClass =
        "rounded-lg border border-light-200 bg-light-100 px-3 py-1 text-xs font-medium text-light-500 hover:bg-light-200 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-50 dark:hover:bg-dark-800";

    // small helpers to display validation state for a given value
    const makeInvalidClass = (invalid: boolean): string => (invalid ? " border-red-500 ring-1 ring-red-200 dark:ring-red-900/30" : "");

    // Full page layout
    if (fullPage && client) {
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
                            fullPage={false}
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
                                            color: "text-blue-600",
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
                                                                    onChange={(e) => updateDraft(`swot.${key}.${idx}`, e.target.value)}
                                                                />
                                                            ) : (
                                                                <div className="text-light-900 dark:text-dark-50">{item}</div>
                                                            )}
                                                            {editing && (
                                                                <button
                                                                    className={buttonGhostClass}
                                                                    onClick={() => {
                                                                        setDraft((prev: Partial<Client> | null) => {
                                                                            const next = JSON.parse(JSON.stringify(prev || {})) as Record<
                                                                                string,
                                                                                any
                                                                            >;
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
                                            className="bg-light-50 dark:bg-dark-800/50 rounded-lg p-3 transition-colors duration-300"
                                        >
                                            {editing ? (
                                                <>
                                                    <input
                                                        className={inputBaseClass}
                                                        value={competitor.name || ""}
                                                        placeholder={t("name_label") || "Name"}
                                                        onChange={(e) => updateDraft(`competitors.${idx}.name`, e.target.value)}
                                                    />

                                                    <textarea
                                                        className={`${inputBaseClass} mt-2`}
                                                        value={competitor.description || ""}
                                                        placeholder={t("description") || "Description"}
                                                        onChange={(e) => updateDraft(`competitors.${idx}.description`, e.target.value)}
                                                    />

                                                    <div className="mt-2 grid grid-cols-1 gap-2">
                                                        <input
                                                            className={inputBaseClass}
                                                            value={(competitor.website as any) || ""}
                                                            placeholder={t("website_label") || "Website"}
                                                            onChange={(e) => updateDraft(`competitors.${idx}.website`, e.target.value)}
                                                        />
                                                        <input
                                                            className={inputBaseClass}
                                                            value={((competitor as any).facebook as any) || ""}
                                                            placeholder={t("facebook") || "Facebook"}
                                                            onChange={(e) => updateDraft(`competitors.${idx}.facebook`, e.target.value)}
                                                        />
                                                        <input
                                                            className={inputBaseClass}
                                                            value={((competitor as any).instagram as any) || ""}
                                                            placeholder={t("instagram") || "Instagram"}
                                                            onChange={(e) => updateDraft(`competitors.${idx}.instagram`, e.target.value)}
                                                        />
                                                        <input
                                                            className={inputBaseClass}
                                                            value={((competitor as any).twitter as any) || ""}
                                                            placeholder={t("twitter") || "Twitter/X"}
                                                            onChange={(e) => updateDraft(`competitors.${idx}.twitter`, e.target.value)}
                                                        />
                                                        <input
                                                            className={inputBaseClass}
                                                            value={((competitor as any).tiktok as any) || ""}
                                                            placeholder={t("tiktok") || "TikTok"}
                                                            onChange={(e) => updateDraft(`competitors.${idx}.tiktok`, e.target.value)}
                                                        />
                                                    </div>

                                                    {/* SWOT editing */}
                                                    <div className="mt-3 space-y-2">
                                                        {(["swot_strengths", "swot_weaknesses", "swot_opportunities", "swot_threats"] as const).map(
                                                            (field) => (
                                                                <div
                                                                    key={field}
                                                                    className="space-y-1"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <strong className="text-dark-500 dark:text-dark-400 text-sm">
                                                                            {field
                                                                                .replace(/swot_/, "")
                                                                                .replace(/_/g, " ")
                                                                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                                                                        </strong>
                                                                        <button
                                                                            type="button"
                                                                            className={buttonAddClass}
                                                                            onClick={() => {
                                                                                setDraft((prev: Partial<Client> | null) => {
                                                                                    const next = JSON.parse(JSON.stringify(prev || {})) as Record<
                                                                                        string,
                                                                                        any
                                                                                    >;
                                                                                    next.competitors = next.competitors || [];
                                                                                    next.competitors[idx] = next.competitors[idx] || {};
                                                                                    next.competitors[idx][field] = next.competitors[idx][field] || [];
                                                                                    next.competitors[idx][field].push("");
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                        >
                                                                            {t("add") || "Add"}
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        {((competitor as any)[field] || []).map((val: any, i: number) => (
                                                                            <div
                                                                                key={i}
                                                                                className="flex items-center gap-2"
                                                                            >
                                                                                <input
                                                                                    className={inputBaseClass}
                                                                                    value={val || ""}
                                                                                    onChange={(e) =>
                                                                                        updateDraft(
                                                                                            `competitors.${idx}.${field}.${i}`,
                                                                                            e.target.value,
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className="text-danger-500"
                                                                                    onClick={() => {
                                                                                        setDraft((prev: Partial<Client> | null) => {
                                                                                            const next = JSON.parse(
                                                                                                JSON.stringify(prev || {}),
                                                                                            ) as Record<string, any>;
                                                                                            next.competitors = next.competitors || [];
                                                                                            next.competitors[idx] = next.competitors[idx] || {};
                                                                                            next.competitors[idx][field] =
                                                                                                next.competitors[idx][field] || [];
                                                                                            next.competitors[idx][field].splice(i, 1);
                                                                                            return next;
                                                                                        });
                                                                                    }}
                                                                                >
                                                                                    {t("remove") || "Remove"}
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
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
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => {
                                                            const cid = competitor._id || `idx-${idx}`;
                                                            setExpandedCompetitorId((prev) => (prev === cid ? null : cid));
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                const cid = competitor._id || `idx-${idx}`;
                                                                setExpandedCompetitorId((prev) => (prev === cid ? null : cid));
                                                            }
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <h4 className="text-light-900 dark:text-dark-50 font-medium">{competitor.name}</h4>
                                                        <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{competitor.description}</p>
                                                    </div>

                                                    {/* Social Links (icons) */}
                                                    {competitor.socialLinks && competitor.socialLinks.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {competitor.socialLinks.map((link: any, linkIdx: number) => {
                                                                const platformLower = (link.platform || "").toLowerCase();
                                                                let Icon = null;
                                                                let colorClass = "text-light-600";
                                                                if (platformLower === "facebook") {
                                                                    Icon = SiFacebook;
                                                                    colorClass = "text-blue-600";
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

                                                    {/* Website */}
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

                                                    {/* Expanded details: SWOT + timestamps */}
                                                    {expandedCompetitorId === (competitor._id || `idx-${idx}`) && (
                                                        <div className="mt-3 border-t pt-3 text-sm">
                                                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                                <div>
                                                                    <h5 className="text-light-900 dark:text-dark-50 font-medium">SWOT</h5>
                                                                    <div className="mt-2 space-y-2">
                                                                        <div>
                                                                            <strong className="text-dark-500 dark:text-dark-400 text-xs">
                                                                                Strengths:
                                                                            </strong>
                                                                            <div className="text-light-600 dark:text-dark-300">
                                                                                {(competitor.swot_strengths || []).join(", ") || "N/A"}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <strong className="text-dark-500 dark:text-dark-400 text-xs">
                                                                                Weaknesses:
                                                                            </strong>
                                                                            <div className="text-light-600 dark:text-dark-300">
                                                                                {(competitor.swot_weaknesses || []).join(", ") || "N/A"}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <strong className="text-dark-500 dark:text-dark-400 text-xs">
                                                                                Opportunities:
                                                                            </strong>
                                                                            <div className="text-light-600 dark:text-dark-300">
                                                                                {(competitor.swot_opportunities || []).join(", ") || "N/A"}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <strong className="text-dark-500 dark:text-dark-400 text-xs">
                                                                                Threats:
                                                                            </strong>
                                                                            <div className="text-light-600 dark:text-dark-300">
                                                                                {(competitor.swot_threats || []).join(", ") || "N/A"}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-light-900 dark:text-dark-50 font-medium">Details</h5>
                                                                    <div className="text-light-600 dark:text-dark-300 mt-2 space-y-2 text-xs">
                                                                        <div>
                                                                            <strong className="text-dark-500 dark:text-dark-400">
                                                                                Social links:
                                                                            </strong>
                                                                            <div className="mt-1 space-y-1">
                                                                                {(() => {
                                                                                    const combined = [
                                                                                        ...(competitor.socialLinks || []),
                                                                                        ...(competitor.website
                                                                                            ? [{ platform: "website", url: competitor.website }]
                                                                                            : []),
                                                                                        ...((competitor as any).facebook
                                                                                            ? [
                                                                                                  {
                                                                                                      platform: "facebook",
                                                                                                      url: (competitor as any).facebook,
                                                                                                  },
                                                                                              ]
                                                                                            : []),
                                                                                        ...((competitor as any).instagram
                                                                                            ? [
                                                                                                  {
                                                                                                      platform: "instagram",
                                                                                                      url: (competitor as any).instagram,
                                                                                                  },
                                                                                              ]
                                                                                            : []),
                                                                                        ...((competitor as any).twitter
                                                                                            ? [
                                                                                                  {
                                                                                                      platform: "twitter",
                                                                                                      url: (competitor as any).twitter,
                                                                                                  },
                                                                                              ]
                                                                                            : []),
                                                                                        ...((competitor as any).tiktok
                                                                                            ? [
                                                                                                  {
                                                                                                      platform: "tiktok",
                                                                                                      url: (competitor as any).tiktok,
                                                                                                  },
                                                                                              ]
                                                                                            : []),
                                                                                    ];
                                                                                    if (!combined || combined.length === 0) {
                                                                                        return (
                                                                                            <div className="text-light-600 dark:text-dark-300">
                                                                                                N/A
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return combined.map((l: any, i: number) => (
                                                                                        <div
                                                                                            key={i}
                                                                                            className="text-sm"
                                                                                        >
                                                                                            {l.url ? (
                                                                                                <a
                                                                                                    href={l.url}
                                                                                                    target="_blank"
                                                                                                    rel="noopener noreferrer"
                                                                                                    className="text-primary-600 dark:text-primary-400 hover:underline"
                                                                                                >
                                                                                                    {`${(l.platform || "website").toString().charAt(0).toUpperCase() + (l.platform || "website").toString().slice(1)}: ${l.url}`}
                                                                                                </a>
                                                                                            ) : (
                                                                                                <span className="text-light-600 dark:text-dark-300">
                                                                                                    {l.platform}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    ));
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
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
                                        colorClass = "text-blue-600";
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
                                                        onChange={(e) => updateDraft(`socialLinks.business.${idx}.platform`, e.target.value)}
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
                                                                    onChange={(e) => updateDraft(`socialLinks.business.${idx}.url`, e.target.value)}
                                                                />
                                                                {invalid && (
                                                                    <div className="mt-1 text-xs text-red-600">
                                                                        {t("invalid_url") || "Invalid URL"}
                                                                    </div>
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
                                                        className="text-blue-600 hover:underline dark:text-blue-400"
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
                                                        onChange={(e) => updateDraft(`segments.${idx}.name`, e.target.value)}
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
                                                        onChange={(e) => updateDraft(`segments.${idx}.description`, e.target.value)}
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
                                                            onChange={(e) => updateDraft(`segments.${idx}.ageRange`, e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-light-700 dark:text-dark-300 mb-1 block text-sm font-medium">
                                                            {t("gender") || "Gender"}
                                                        </label>
                                                        <select
                                                            className={inputBaseClass}
                                                            value={segment.gender || "all"}
                                                            onChange={(e) => updateDraft(`segments.${idx}.gender`, e.target.value)}
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
                                                            onChange={(e) => updateDraft(`segments.${idx}.incomeLevel`, e.target.value)}
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
                                                                (segment as any)._interestsText !== undefined
                                                                    ? (segment as any)._interestsText
                                                                    : Array.isArray(segment.interests)
                                                                      ? segment.interests.join("\n")
                                                                      : segment.interests || ""
                                                            }
                                                            placeholder={
                                                                t("interests_placeholder") || "Enter interests (one per line or comma-separated)"
                                                            }
                                                            onChange={(e) => updateDraft(`segments.${idx}._interestsText`, e.target.value)}
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
                                                                updateDraft(`segments.${idx}.interests`, interestsArray);
                                                                updateDraft(`segments.${idx}._interestsText`, undefined);
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
    }

    if (compact) {
        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-light-900 dark:text-dark-50 text-xl font-semibold">
                        <span className="mr-2 text-sm font-semibold">{t("business_name_label")}</span>
                        {data.business?.businessName || t("unnamed_business")}
                    </h3>
                    <p className="text-light-600 dark:text-dark-400 text-sm">
                        <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                        {data.business?.category || t("no_category")}
                    </p>
                </div>

                <div className="border-dark-200 dark:border-dark-700 space-y-2 border-t pt-3 text-sm">
                    {data.personal?.fullName && (
                        <div className="text-light-600 dark:text-dark-400 flex items-center gap-2">
                            <Users size={14} />
                            <span>{data.personal?.fullName}</span>
                        </div>
                    )}
                    {data.contact?.businessEmail && (
                        <div className="text-light-600 dark:text-dark-400 flex items-center gap-2">
                            <Mail size={14} />
                            <span className="truncate">{data.contact?.businessEmail}</span>
                        </div>
                    )}
                    {data.contact?.businessPhone && (
                        <div className="text-light-600 dark:text-dark-400 flex items-center gap-2">
                            <Phone size={14} />
                            <span>{data.contact?.businessPhone}</span>
                        </div>
                    )}
                    {data.branches && data.branches.length > 0 && (
                        <div className="text-light-600 dark:text-dark-400 flex items-center gap-2">
                            <MapPin size={14} />
                            <span>
                                {data.branches?.length} {data.branches?.length === 1 ? t("branches_singular") : t("branches_plural")}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="card transition-colors duration-300">
                <h3 className="card-title mb-4">{t("client_overview")}</h3>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                        <span className="text-dark-500 dark:text-dark-400">{t("business_name_label")}</span>
                        {editing ? (
                            <input
                                className={`${inputBaseClass} font-medium`}
                                value={data.business?.businessName || ""}
                                onChange={(e) => updateDraft("business.businessName", e.target.value)}
                            />
                        ) : (
                            <p className="text-light-900 dark:text-dark-50 font-medium break-words">{data.business?.businessName || "N/A"}</p>
                        )}
                    </div>
                    <div>
                        <span className="text-dark-500 dark:text-dark-400">{t("business_category_label")}</span>
                        {editing ? (
                            <input
                                className={inputBaseClass}
                                value={data.business?.category || ""}
                                onChange={(e) => updateDraft("business.category", e.target.value)}
                            />
                        ) : (
                            <p className="text-light-900 dark:text-dark-50">{data.business?.category || "N/A"}</p>
                        )}
                    </div>
                    <div>
                        <span className="text-dark-500 dark:text-dark-400">{t("established_label")}</span>
                        {editing ? (
                            <input
                                className={inputBaseClass}
                                value={data.business?.establishedYear || ""}
                                onChange={(e) => updateDraft("business.establishedYear", e.target.value)}
                            />
                        ) : (
                            <p className="text-light-900 dark:text-dark-50">{data.business?.establishedYear || "N/A"}</p>
                        )}
                    </div>
                    <div>
                        <span className="text-dark-500 dark:text-dark-400">{t("main_office_label")}</span>
                        {editing ? (
                            <input
                                className={inputBaseClass}
                                value={data.business?.mainOfficeAddress || ""}
                                onChange={(e) => updateDraft("business.mainOfficeAddress", e.target.value)}
                            />
                        ) : (
                            <p className="text-light-900 dark:text-dark-50 break-words">{data.business?.mainOfficeAddress || "N/A"}</p>
                        )}
                    </div>
                    <div className="sm:col-span-2">
                        <span className="text-dark-500 dark:text-dark-400">{t("description")}</span>
                        {editing ? (
                            <textarea
                                className={`${inputBaseClass} min-h-[80px]`}
                                value={data.business?.description || ""}
                                onChange={(e) => updateDraft("business.description", e.target.value)}
                            />
                        ) : (
                            <p className="text-light-900 dark:text-dark-50 break-words">{data.business?.description || "N/A"}</p>
                        )}
                    </div>
                    <div>
                        <span className="text-dark-500 dark:text-dark-400">{t("status")}</span>
                        {editing ? (
                            <select
                                className={inputBaseClass}
                                value={data.status || "active"}
                                onChange={(e) => updateDraft("status", e.target.value)}
                            >
                                <option value="active">{t("status_active") || "Active"}</option>
                                <option value="inactive">{t("status_inactive") || "Inactive"}</option>
                                <option value="pending">{t("status_pending") || "Pending"}</option>
                            </select>
                        ) : (
                            <p className="text-light-900 dark:text-dark-50">{data.status || "N/A"}</p>
                        )}
                    </div>
                    {(data.createdAt || data.updatedAt) && (
                        <>
                            {data.createdAt && (
                                <div>
                                    <span className="text-dark-500 dark:text-dark-400">{t("created_at") || "Created"}</span>
                                    <p className="text-light-900 dark:text-dark-50">{new Date(data.createdAt).toLocaleDateString()}</p>
                                </div>
                            )}
                            {data.updatedAt && (
                                <div>
                                    <span className="text-dark-500 dark:text-dark-400">{t("updated_at") || "Last Updated"}</span>
                                    <p className="text-light-900 dark:text-dark-50">{new Date(data.updatedAt).toLocaleDateString()}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="card transition-colors duration-300">
                <h3 className="card-title mb-4">{t("contact_information")}</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="text-dark-700 dark:text-dark-50 text-sm font-semibold">{t("contact_person")}</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                            <div>
                                <span className="text-dark-500 dark:text-dark-400">{t("name_label")}</span>
                                {editing ? (
                                    <input
                                        className={`${inputBaseClass} font-medium`}
                                        value={data.personal?.fullName || ""}
                                        onChange={(e) => updateDraft("personal.fullName", e.target.value)}
                                    />
                                ) : (
                                    <p className="text-light-900 dark:text-dark-50 font-medium break-words">{data.personal?.fullName || "N/A"}</p>
                                )}
                            </div>
                            <div>
                                <span className="text-dark-500 dark:text-dark-400">{t("position_label")}</span>
                                {editing ? (
                                    <input
                                        className={inputBaseClass}
                                        value={data.personal?.position || ""}
                                        onChange={(e) => updateDraft("personal.position", e.target.value)}
                                    />
                                ) : (
                                    <p className="text-light-900 dark:text-dark-50">{data.personal?.position || "N/A"}</p>
                                )}
                            </div>
                            <div>
                                <span className="text-dark-500 dark:text-dark-400">{t("email_label")}</span>
                                {editing ? (
                                    (() => {
                                        const val = data.personal?.email || "";
                                        const invalid = val !== "" && !validators.isValidEmail(val);
                                        return (
                                            <div>
                                                <input
                                                    className={`${inputBaseClass} ${makeInvalidClass(invalid)}`}
                                                    value={val}
                                                    onChange={(e) => updateDraft("personal.email", e.target.value)}
                                                />
                                                {invalid && <div className="mt-1 text-xs text-red-600">{t("invalid_email") || "Invalid email"}</div>}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <p className="text-light-900 dark:text-dark-50 break-words">{data.personal?.email || "N/A"}</p>
                                )}
                            </div>
                            <div>
                                <span className="text-dark-500 dark:text-dark-400">{t("phone_label")}</span>
                                {editing ? (
                                    (() => {
                                        const val = data.personal?.phone || "";
                                        const invalid = val !== "" && !validators.isValidEgyptianMobile(val);
                                        return (
                                            <div>
                                                <input
                                                    className={`${inputBaseClass} ${makeInvalidClass(invalid)}`}
                                                    value={val}
                                                    onChange={(e) => updateDraft("personal.phone", e.target.value)}
                                                />
                                                {invalid && <div className="mt-1 text-xs text-red-600">{t("invalid_phone") || "Invalid phone"}</div>}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <p className="text-light-900 dark:text-dark-50">{data.personal?.phone || "N/A"}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-dark-200 dark:border-dark-700 space-y-2 border-t pt-3">
                        <h4 className="text-dark-700 dark:text-dark-50 text-sm font-semibold">{t("business_contact")}</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                            <div>
                                <span className="text-dark-500 dark:text-dark-400">{t("email_label")}</span>
                                {editing ? (
                                    (() => {
                                        const val = data.contact?.businessEmail || "";
                                        const invalid = val !== "" && !validators.isValidEmail(val);
                                        return (
                                            <div>
                                                <input
                                                    className={`${inputBaseClass} ${makeInvalidClass(invalid)}`}
                                                    value={val}
                                                    onChange={(e) => updateDraft("contact.businessEmail", e.target.value)}
                                                />
                                                {invalid && <div className="mt-1 text-xs text-red-600">{t("invalid_email") || "Invalid email"}</div>}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <p className="text-light-900 dark:text-dark-50 break-words">{data.contact?.businessEmail || "N/A"}</p>
                                )}
                            </div>
                            <div>
                                <span className="text-dark-500 dark:text-dark-400">{t("phone_label")}</span>
                                {editing ? (
                                    (() => {
                                        const val = data.contact?.businessPhone || "";
                                        const invalid = val !== "" && !validators.isValidEgyptianMobile(val);
                                        return (
                                            <div>
                                                <input
                                                    className={`${inputBaseClass} ${makeInvalidClass(invalid)}`}
                                                    value={val}
                                                    onChange={(e) => updateDraft("contact.businessPhone", e.target.value)}
                                                />
                                                {invalid && <div className="mt-1 text-xs text-red-600">{t("invalid_phone") || "Invalid phone"}</div>}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <p className="text-light-900 dark:text-dark-50">{data.contact?.businessPhone || "N/A"}</p>
                                )}
                            </div>
                            <div>
                                <span className="text-dark-500 dark:text-dark-400">{t("whatsapp_label")}</span>
                                {editing ? (
                                    (() => {
                                        const val = data.contact?.businessWhatsApp || "";
                                        const invalid = val !== "" && !validators.isValidEgyptianMobile(val);
                                        return (
                                            <div>
                                                <input
                                                    className={`${inputBaseClass} ${makeInvalidClass(invalid)}`}
                                                    value={val}
                                                    onChange={(e) => updateDraft("contact.businessWhatsApp", e.target.value)}
                                                />
                                                {invalid && <div className="mt-1 text-xs text-red-600">{t("invalid_phone") || "Invalid phone"}</div>}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <p className="text-light-900 dark:text-dark-50 break-words">{data.contact?.businessWhatsApp || "N/A"}</p>
                                )}
                            </div>
                            <div>
                                <span className="text-dark-500 dark:text-dark-400">{t("website_label")}</span>
                                {editing ? (
                                    (() => {
                                        const val = data.contact?.website || "";
                                        const invalid = val !== "" && !validators.isValidURL(val, { allowProtocolLess: true });
                                        return (
                                            <div>
                                                <input
                                                    className={`${inputBaseClass} text-primary-500 max-w-full break-words ${makeInvalidClass(invalid)}`}
                                                    value={val}
                                                    onChange={(e) => updateDraft("contact.website", e.target.value)}
                                                />
                                                {invalid && <div className="mt-1 text-xs text-red-600">{t("invalid_url") || "Invalid URL"}</div>}
                                            </div>
                                        );
                                    })()
                                ) : data.contact?.website ? (
                                    <a
                                        href={data.contact.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-dark-300 max-w-full break-words hover:underline"
                                    >
                                        {data.contact.website}
                                    </a>
                                ) : (
                                    <p className="text-light-900 dark:text-dark-50">N/A</p>
                                )}
                            </div>
                            {/* Branches overview + editing */}
                            {(editing || (data.branches && data.branches.length > 0)) && (
                                <div className="sm:col-span-2">
                                    <span className="text-dark-500 dark:text-dark-400">{t("branches")}</span>
                                    {editing ? (
                                        <div className="mt-2 space-y-3">
                                            {(data.branches || []).map((branch: any, idx: number) => (
                                                <div
                                                    key={branch._id || idx}
                                                    className="space-y-2"
                                                >
                                                    <input
                                                        className={inputBaseClass}
                                                        value={branch.name || ""}
                                                        placeholder={t("branch_name")}
                                                        onChange={(e) => updateDraft(`branches.${idx}.name`, e.target.value)}
                                                    />
                                                    <input
                                                        className={inputBaseClass}
                                                        value={branch.city || ""}
                                                        placeholder={t("city")}
                                                        onChange={(e) => updateDraft(`branches.${idx}.city`, e.target.value)}
                                                    />
                                                    <input
                                                        className={inputBaseClass}
                                                        value={branch.address || ""}
                                                        placeholder={t("branch_address")}
                                                        onChange={(e) => updateDraft(`branches.${idx}.address`, e.target.value)}
                                                    />
                                                    <input
                                                        className={inputBaseClass}
                                                        value={branch.phone || ""}
                                                        placeholder={t("phone_number")}
                                                        onChange={(e) => updateDraft(`branches.${idx}.phone`, e.target.value)}
                                                    />
                                                    <button
                                                        className="text-danger-500 hover:text-danger-600"
                                                        onClick={() => {
                                                            if (!editing || !setDraft) return;
                                                            setDraft((prev) => {
                                                                const next = JSON.parse(JSON.stringify(prev || {})) as any;
                                                                next.branches = next.branches || [];
                                                                next.branches.splice(idx, 1);
                                                                return next;
                                                            });
                                                        }}
                                                    >
                                                        {t("remove")}
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                className="btn-ghost"
                                                onClick={() => {
                                                    if (!editing || !setDraft) return;
                                                    setDraft((prev) => {
                                                        const next = JSON.parse(JSON.stringify(prev || {})) as any;
                                                        next.branches = next.branches || [];
                                                        next.branches.push({ name: "", city: "", address: "", phone: "" });
                                                        return next;
                                                    });
                                                }}
                                            >
                                                {t("add_branch")}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 space-y-2">
                                            {(data.branches || []).map((b: any, i: number) => (
                                                <div
                                                    key={b._id || i}
                                                    className="text-sm"
                                                >
                                                    <strong className="text-light-600 dark:text-dark-500">{b.name}</strong>
                                                    {b.city && <div className="text-light-600 dark:text-dark-200">{b.city}</div>}
                                                    {b.address && <div className="text-light-600 dark:text-dark-200">{b.address}</div>}
                                                    {b.phone && <div className="text-light-600 dark:text-dark-200">{b.phone}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Objectives overview (per-client) */}
            <div className="card transition-colors duration-300">
                <div className="flex items-start justify-between">
                    <h3 className="card-title mb-4">{t("objectives_overview") || t("campaign_objective") || "Objectives"}</h3>
                    {draftDate ? (
                        <div className="text-light-600 dark:text-dark-400 ml-4 text-right text-sm">
                            {t("created_on") || "Created:"} {(draftDate as Date).toLocaleString()}
                        </div>
                    ) : null}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {clientObjectives && clientObjectives.length > 0 ? (
                        clientObjectives.map((obj) => (
                            <div
                                key={obj.id}
                                className="border-light-600 dark:border-dark-700 dark:bg-dark-800 rounded-lg border bg-white p-3"
                            >
                                <div className="text-light-900 dark:text-dark-50 mb-2 text-sm">
                                    <strong className="text-light-600 dark:text-dark-400 mr-1 text-xs">EN:</strong>
                                    {obj.en || obj.ar}
                                </div>
                                <div className="text-light-900 dark:text-dark-50 text-sm">
                                    <strong className="text-light-600 dark:text-dark-400 mr-1 text-xs">AR:</strong>
                                    {obj.ar || obj.en}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-light-600 dark:text-dark-400 col-span-full text-sm">
                            {t("no_objectives") || "No objectives added yet."}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientInfo;
