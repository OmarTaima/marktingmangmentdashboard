import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Edit2 } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useLang } from "@/hooks/useLang";
import validators from "@/constants/validators";
import ClientInfo from "@/routes/clients/ClientInfo";

const inputBaseClass =
    "w-full rounded-lg border border-light-300 bg-light-50 px-3 py-2 text-sm text-light-900 placeholder-light-400 focus:border-light-500 focus:ring-light-200 dark:border-dark-800 dark:bg-dark-800 dark:text-dark-50";

const buttonGhostClass =
    "rounded-lg border border-light-200 bg-light-100 px-2.5 py-1 text-xs text-light-500 hover:bg-light-200 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-50 dark:hover:bg-dark-800";

const buttonAddClass =
    "rounded-lg border border-light-200 bg-light-100 px-3 py-1 text-xs font-medium text-light-500 hover:bg-light-200 dark:border-dark-700 dark:bg-dark-900/40 dark:text-dark-50 dark:hover:bg-dark-800";

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useLang();
    const [client, setClient] = useState(null);
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(null);

    const makeInvalidClass = (invalid) => (invalid ? " border-red-500 ring-1 ring-red-200 dark:ring-red-900/30" : "");

    useEffect(() => {
        loadClient();
    }, [id]);

    useEffect(() => {
        if (searchParams.get("edit") === "true") {
            if (client) {
                setEditing(true);
                setDraft(JSON.parse(JSON.stringify(client)));
            }
        }
    }, [searchParams, client]);

    const loadClient = () => {
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            const clients = JSON.parse(storedClients);
            const foundClient = clients.find((c) => c.id === id);
            if (foundClient) setClient(foundClient);
        }
    };

    const startEditing = () => {
        setDraft(JSON.parse(JSON.stringify(client)));
        setEditing(true);
    };

    const updateDraftPath = (path, value) => {
        if (!draft) return;
        setDraft((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            const parts = path.split(".");
            let cur = next;
            for (let i = 0; i < parts.length - 1; i++) {
                const key = parts[i];
                if (!cur[key]) cur[key] = {};
                cur = cur[key];
            }
            cur[parts[parts.length - 1]] = value;
            return next;
        });
    };
    const ensureDraftArray = (path) => {
        if (!draft) return;
        setDraft((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            const parts = path.split(".");
            let cur = next;
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

    const saveEditing = () => {
        if (!draft) return;
        const storedClients = localStorage.getItem("clients");
        let clients = [];
        if (storedClients) clients = JSON.parse(storedClients);
        const idx = clients.findIndex((c) => c.id === id);
        if (idx !== -1) {
            clients[idx] = draft;
        } else {
            clients.push(draft);
        }
        localStorage.setItem("clients", JSON.stringify(clients));
        setClient(draft);
        setEditing(false);
        setDraft(null);
    };

    if (!client) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-dark-500 text-center">{t("loading") || "Loading..."}</div>
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
                        <button
                            onClick={startEditing}
                            className="btn-primary flex items-center gap-2"
                            aria-label="Edit"
                        >
                            <Edit2 className="h-4 w-4" />
                            <span className="hidden sm:inline">{t("edit")}</span>
                        </button>
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
                            localStorage.setItem("selectedClientId", id);
                            navigate("/planning");
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
                                const items = (editing ? draft.swot && draft.swot[key] : client.swot && client.swot[key]) || [];
                                return (
                                    <div key={key}>
                                        <h4 className={`mb-2 font-medium ${titleMap[key].color}`}>
                                            {key === "strengths" ? "💪 " : key === "weaknesses" ? "⚠️ " : key === "opportunities" ? "🎯 " : "⚡ "}
                                            {titleMap[key].label}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            {items.length > 0 ? (
                                                items.map((item, idx) => (
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
                                                                    setDraft((prev) => {
                                                                        const next = JSON.parse(JSON.stringify(prev));
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
                                                        setDraft((prev) => {
                                                            const next = JSON.parse(JSON.stringify(prev));
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
                        {(editing ? draft.segments || [] : client.segments || []).length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(editing ? draft.segments || [] : client.segments || []).map((segment, idx) => (
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
                                                        value={segment.targetAge || ""}
                                                        placeholder={t("age_label") || "Age"}
                                                        onChange={(e) => updateDraftPath(`segments.${idx}.targetAge`, e.target.value)}
                                                    />
                                                    <input
                                                        className={inputBaseClass}
                                                        value={segment.targetGender || ""}
                                                        placeholder={t("gender_label") || "Gender"}
                                                        onChange={(e) => updateDraftPath(`segments.${idx}.targetGender`, e.target.value)}
                                                    />
                                                    <button
                                                        className={buttonGhostClass}
                                                        onClick={() =>
                                                            setDraft((prev) => {
                                                                const next = JSON.parse(JSON.stringify(prev));
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
                                                    {segment.targetAge && <span>Age: {segment.targetAge}</span>}
                                                    {segment.targetGender && <span>Gender: {segment.targetGender}</span>}
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
                                        setDraft((prev) => {
                                            const next = JSON.parse(JSON.stringify(prev || {}));
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
                        {(editing ? draft.competitors || [] : client.competitors || []).length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {(editing ? draft.competitors || [] : client.competitors || []).map((competitor, idx) => (
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
                                                            setDraft((prev) => {
                                                                const next = JSON.parse(JSON.stringify(prev));
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
                                        setDraft((prev) => {
                                            const next = JSON.parse(JSON.stringify(prev || {}));
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
                            {(editing ? draft.socialLinks?.business || [] : client.socialLinks?.business || []).map((link, idx) => {
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
                                                        setDraft((prev) => {
                                                            const next = JSON.parse(JSON.stringify(prev));
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
                                        setDraft((prev) => {
                                            const next = JSON.parse(JSON.stringify(prev || {}));
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
