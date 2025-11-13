import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Edit2 } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useLang } from "@/hooks/useLang";
import type { Client } from "@/api/interfaces/clientinterface";
import validators from "@/constants/validators";
import ClientInfo from "@/routes/clients/ClientInfo";
import { getClientById, updateClient, deleteClient } from "@/api";

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
            const clientData = await getClientById(id);

            // Only update state if component is still mounted
            if (!signal?.aborted) {
                setClient(clientData);
            }
        } catch (err: any) {
            if (err?.name === "AbortError" || err?.name === "CanceledError") {
                console.log("Request cancelled");
                return;
            }
            console.error("Error loading client:", err);
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
            await updateClient(id, draft);
            setEditing(false);
            setDraft(null);

            // Reload fresh data from API
            const freshClient = await getClientById(id);
            setClient(freshClient);

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
                                Save
                            </button>
                            <button
                                onClick={cancelEditing}
                                className="btn-ghost flex items-center gap-2"
                            >
                                Cancel
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

                    {/* Segments */}
                    <div className="card transition-colors duration-300">
                        <h3 className="card-title mb-4">{t("target_segments") || "Target Segments"}</h3>
                        {(editing ? draft?.segments || [] : client.segments || []).length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(editing ? draft?.segments || [] : client.segments || []).map((segment, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-dark-50 dark:bg-dark-800/50 rounded-lg p-3 transition-colors duration-300"
                                    >
                                        {editing ? (
                                            <>
                                                <input
                                                    className={inputBaseClass}
                                                    value={segment.name || ""}
                                                    placeholder="Name"
                                                    onChange={(e) => updateDraftPath(`segments.${idx}.name`, e.target.value)}
                                                />
                                                <textarea
                                                    className={`${inputBaseClass} mt-2`}
                                                    value={segment.description || ""}
                                                    placeholder="Description"
                                                    onChange={(e) => updateDraftPath(`segments.${idx}.description`, e.target.value)}
                                                />
                                                <div className="mt-2 flex gap-2">
                                                    <input
                                                        className={inputBaseClass}
                                                        value={(segment as any).targetAge || ""}
                                                        placeholder={t("age_label") || "Age"}
                                                        onChange={(e) => updateDraftPath(`segments.${idx}.targetAge`, e.target.value)}
                                                    />
                                                    <input
                                                        className={inputBaseClass}
                                                        value={(segment as any).targetGender || ""}
                                                        placeholder={t("gender_label") || "Gender"}
                                                        onChange={(e) => updateDraftPath(`segments.${idx}.targetGender`, e.target.value)}
                                                    />
                                                    <button
                                                        className={buttonGhostClass}
                                                        onClick={() =>
                                                            setDraft((prev: Partial<Client> | null) => {
                                                                const next = JSON.parse(JSON.stringify(prev || {})) as Partial<Client> &
                                                                    Record<string, any>;
                                                                next.segments = next.segments || [];
                                                                next.segments.splice(idx, 1);
                                                                return next;
                                                            })
                                                        }
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h4 className="text-light-900 dark:text-dark-50 font-medium">{segment.name}</h4>
                                                <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{segment.description}</p>
                                                <div className="text-dark-500 dark:text-dark-400 mt-2 flex gap-4 text-xs">
                                                    {(segment as any).targetAge && <span>Age: {(segment as any).targetAge}</span>}
                                                    {(segment as any).targetGender && <span>Gender: {(segment as any).targetGender}</span>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-dark-500 text-sm">{t("no_segments_defined") || "No segments defined"}</p>
                        )}
                        {editing && (
                            <div className="mt-2">
                                <button
                                    className={buttonAddClass}
                                    onClick={() => {
                                        setDraft((prev: Partial<Client> | null) => {
                                            const next = JSON.parse(JSON.stringify(prev || {})) as Record<string, any>;
                                            next.segments = next.segments || [];
                                            next.segments.push({
                                                name: "",
                                                description: "",
                                                targetAge: "",
                                                targetGender: "",
                                            });
                                            return next;
                                        });
                                    }}
                                >
                                    {t("add_segment") || "Add segment"}
                                </button>
                            </div>
                        )}
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
                                                {(() => {
                                                    const val = competitor.website || "";
                                                    const invalid = val !== "" && !validators.isValidURL(val, { allowProtocolLess: true });
                                                    return (
                                                        <div>
                                                            <input
                                                                className={`${inputBaseClass} mt-2 ${makeInvalidClass(invalid)}`}
                                                                value={val}
                                                                placeholder={t("website_label") || "Website"}
                                                                onChange={(e) => updateDraftPath(`competitors.${idx}.website`, e.target.value)}
                                                            />
                                                            {invalid && (
                                                                <div className="mt-1 text-xs text-red-600">{t("invalid_url") || "Invalid URL"}</div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
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
                                                {competitor.website && (
                                                    <a
                                                        href={competitor.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-light-500 mt-1 text-xs break-words hover:underline"
                                                    >
                                                        {competitor.website}
                                                    </a>
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
                                                website: "",
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
                </div>
            </div>
        </div>
    );
};

export default ClientDetailPage;
