import React, { useEffect, useState } from "react";
import { Users, Mail, Phone, MapPin } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import validators from "@/constants/validators";
import type { Client } from "@/api/interfaces/clientinterface";

interface ClientInfoProps {
    client?: Client | null;
    compact?: boolean;
    editing?: boolean;
    draft?: Partial<Client> | null;
    setDraft?: React.Dispatch<React.SetStateAction<Partial<Client> | null>> | null;
}

const ClientInfo: React.FC<ClientInfoProps> = ({ client, compact = false, editing = false, draft = null, setDraft = null }) => {
    const { t } = useLang();
    const [, setClientPlans] = useState<any[]>([]);
    const [clientObjectives, setClientObjectives] = useState<any[]>([]);
    const [draftDate, setDraftDate] = useState<Date | null>(null);

    useEffect(() => {
        if (!client || !client.id) {
            setClientPlans([]);
            setClientObjectives([]);
            return;
        }
        try {
            // Prefer transient draft saved by the planning/strategy page so ClientInfo shows live edits
            const draftKey = `plan_draft_${client.id}`;
            const draftRaw = localStorage.getItem(draftKey);
            if (draftRaw) {
                try {
                    const parsedDraft = JSON.parse(draftRaw) || {};
                    setClientPlans(parsedDraft ? [parsedDraft] : []);
                    setClientObjectives(parsedDraft.objectives || []);
                    // compute draft date if id uses plan_{ts}
                    if (parsedDraft && parsedDraft.id && parsedDraft.id.includes("plan_")) {
                        const parts = (parsedDraft.id || "").split("_");
                        const ts = Number(parts[1]) || 0;
                        if (ts) setDraftDate(new Date(ts));
                    }
                    return;
                } catch (e) {
                    // fall back to saved plans
                }
            }

            const saved = localStorage.getItem(`plans_${client.id}`);
            if (saved) {
                const parsed = JSON.parse(saved) || [];
                setClientPlans(parsed);
                const first = parsed[0];
                setClientObjectives((first && first.objectives) || []);
                if (first && first.id && first.id.includes("plan_")) {
                    const parts = (first.id || "").split("_");
                    const ts = Number(parts[1]) || 0;
                    if (ts) setDraftDate(new Date(ts));
                }
            } else {
                setClientPlans([]);
                setClientObjectives([]);
            }
        } catch (e) {
            setClientPlans([]);
            setClientObjectives([]);
        }
    }, [client && client.id]);

    // Use segments from client object or fetch separately if needed
    if (!client && !draft) return null;
    const data: Partial<Client> = editing && draft ? draft || {} : client || {};

    const updateDraft = (path: string, value: any): void => {
        if (!editing || !setDraft || !draft) return;
        setDraft((prev: Partial<Client> | null) => {
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

    const inputBaseClass =
        "w-full rounded-lg border border-light-300 bg-light-50 px-3 py-2 text-sm text-light-900 placeholder-light-400 focus:border-light-500 focus:ring-light-200 dark:border-dark-800 dark:bg-dark-800 dark:text-dark-50";

    // small helpers to display validation state for a given value
    const makeInvalidClass = (invalid: boolean): string => (invalid ? " border-red-500 ring-1 ring-red-200 dark:ring-red-900/30" : "");

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
                    {(editing || data.business?.establishedYear) && (
                        <div>
                            <span className="text-dark-500 dark:text-dark-400">{t("established_label")}</span>
                            {editing ? (
                                <input
                                    className={inputBaseClass}
                                    value={data.business?.establishedYear || ""}
                                    onChange={(e) => updateDraft("business.establishedYear", e.target.value)}
                                />
                            ) : (
                                <p className="text-light-900 dark:text-dark-50">{data.business?.establishedYear ?? "N/A"}</p>
                            )}
                        </div>
                    )}
                    {(editing || data.business?.description) && (
                        <div className="sm:col-span-2">
                            <span className="text-dark-500 dark:text-dark-400">{t("description")}</span>
                            {editing ? (
                                <textarea
                                    className={`${inputBaseClass} min-h-[80px]`}
                                    value={data.business?.description || ""}
                                    onChange={(e) => updateDraft("business.description", e.target.value)}
                                />
                            ) : (
                                <p className="text-light-900 dark:text-dark-50 break-words">{data.business?.description ?? "N/A"}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="card transition-colors duration-300">
                <h3 className="card-title mb-4">{t("contact_information")}</h3>
                <div className="space-y-4">
                    {(editing || data.personal?.fullName || data.personal?.email || data.personal?.phone) && (
                        <div className="space-y-2">
                            <h4 className="text-dark-700 dark:text-dark-50 text-sm font-semibold">{t("contact_person")}</h4>
                            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                {data.personal?.fullName && (
                                    <div>
                                        <span className="text-dark-500 dark:text-dark-400">{t("name_label")}</span>
                                        {editing ? (
                                            <input
                                                className={`${inputBaseClass} font-medium`}
                                                value={data.personal?.fullName || ""}
                                                onChange={(e) => updateDraft("personal.fullName", e.target.value)}
                                            />
                                        ) : (
                                            <span className="text-light-900 dark:text-dark-50 font-medium break-words">{data.personal.fullName}</span>
                                        )}
                                    </div>
                                )}
                                {data.personal?.position && (
                                    <div>
                                        <span className="text-dark-500 dark:text-dark-400">{t("position_label")}</span>
                                        {editing ? (
                                            <input
                                                className={inputBaseClass}
                                                value={data.personal?.position || ""}
                                                onChange={(e) => updateDraft("personal.position", e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-light-900 dark:text-dark-50">{data.personal.position}</p>
                                        )}
                                    </div>
                                )}
                                {data.personal?.email && (
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
                                                        {invalid && (
                                                            <div className="mt-1 text-xs text-red-600">{t("invalid_email") || "Invalid email"}</div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <p className="text-light-900 dark:text-dark-50 break-words">{data.personal.email}</p>
                                        )}
                                    </div>
                                )}
                                {data.personal?.phone && (
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
                                                        {invalid && (
                                                            <div className="mt-1 text-xs text-red-600">{t("invalid_phone") || "Invalid phone"}</div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <p className="text-light-900 dark:text-dark-50">{data.personal.phone}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(editing || data.contact?.businessEmail || data.contact?.businessPhone || data.contact?.website) && (
                        <div className="border-dark-200 dark:border-dark-700 space-y-2 border-t pt-3">
                            <h4 className="text-dark-700 dark:text-dark-50 text-sm font-semibold">{t("business_contact")}</h4>
                            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                {data.contact?.businessEmail && (
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
                                                        {invalid && (
                                                            <div className="mt-1 text-xs text-red-600">{t("invalid_email") || "Invalid email"}</div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <p className="text-light-900 dark:text-dark-50 break-words">{data.contact.businessEmail}</p>
                                        )}
                                    </div>
                                )}
                                {data.contact?.businessPhone && (
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
                                                        {invalid && (
                                                            <div className="mt-1 text-xs text-red-600">{t("invalid_phone") || "Invalid phone"}</div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <p className="text-light-900 dark:text-dark-50">{data.contact.businessPhone}</p>
                                        )}
                                    </div>
                                )}
                                {data.contact?.businessWhatsApp && (
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
                                                        {invalid && (
                                                            <div className="mt-1 text-xs text-red-600">{t("invalid_phone") || "Invalid phone"}</div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <p className="text-light-900 dark:text-dark-50 break-words">{data.contact.businessWhatsApp}</p>
                                        )}
                                    </div>
                                )}
                                {data.contact?.website && (
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
                                                        {invalid && (
                                                            <div className="mt-1 text-xs text-red-600">{t("invalid_url") || "Invalid URL"}</div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <a
                                                href={data.contact.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-dark-300 max-w-full break-words hover:underline"
                                            >
                                                {data.contact.website}
                                            </a>
                                        )}
                                    </div>
                                )}
                                {data.business?.mainOfficeAddress && (
                                    <div className="sm:col-span-2">
                                        <span className="text-dark-500 dark:text-dark-400">{t("main_office_label")}</span>
                                        {editing ? (
                                            <textarea
                                                className={`${inputBaseClass} min-h-[80px]`}
                                                value={data.business?.mainOfficeAddress || ""}
                                                onChange={(e) => updateDraft("business.mainOfficeAddress", e.target.value)}
                                            />
                                        ) : (
                                            <p className="text-light-900 dark:text-dark-50 break-words">{data.business.mainOfficeAddress}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Objectives overview (per-client) */}
            <div className="card transition-colors duration-300">
                <div className="flex items-start justify-between">
                    <h3 className="card-title mb-4">{t("objectives_overview") || t("campaign_objective") || "Objectives"}</h3>
                    {draftDate ? (
                        <div className="text-light-600 dark:text-dark-400 ml-4 text-right text-sm">
                            {t("created_on") || "Created:"} {draftDate.toLocaleString()}
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
