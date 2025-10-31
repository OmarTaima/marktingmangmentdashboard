import React from "react";
import { Users, Mail, Phone, MapPin } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import validators from "@/constants/validators";
import { useMemo } from "react";

const ClientInfo = ({ client, compact = false, editing = false, draft = null, setDraft = null }) => {
    const { t } = useLang();
    if (!client && !draft) return null;
    const data = editing && draft ? draft : client;

    const updateDraft = (path, value) => {
        if (!editing || !setDraft || !draft) return;
        setDraft((prev) => {
            const next = JSON.parse(JSON.stringify(prev));
            const parts = path.split(".");
            let cur = next;
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
    const makeInvalidClass = (invalid) => (invalid ? " border-red-500 ring-1 ring-red-200 dark:ring-red-900/30" : "");

    if (compact) {
        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-light-900 dark:text-dark-50 text-xl font-semibold">
                        <span className="mr-2 text-sm font-semibold">{t("business_name_label")}</span>
                        {client.business?.businessName || t("unnamed_business")}
                    </h3>
                    <p className="text-light-600 dark:text-dark-400 text-sm">
                        <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                        {client.business?.category || t("no_category")}
                    </p>
                </div>

                <div className="border-dark-200 dark:border-dark-700 space-y-2 border-t pt-3 text-sm">
                    {client.personal?.fullName && (
                        <div className="text-light-600 dark:text-dark-400 flex items-center gap-2">
                            <Users size={14} />
                            <span>{client.personal.fullName}</span>
                        </div>
                    )}
                    {client.contact?.businessEmail && (
                        <div className="text-light-600 dark:text-dark-400 flex items-center gap-2">
                            <Mail size={14} />
                            <span className="truncate">{client.contact.businessEmail}</span>
                        </div>
                    )}
                    {client.contact?.businessPhone && (
                        <div className="text-light-600 dark:text-dark-400 flex items-center gap-2">
                            <Phone size={14} />
                            <span>{client.contact.businessPhone}</span>
                        </div>
                    )}
                    {client.branches && client.branches.length > 0 && (
                        <div className="text-light-600 dark:text-dark-400 flex items-center gap-2">
                            <MapPin size={14} />
                            <span>
                                {client.branches.length} {client.branches.length === 1 ? t("branches_singular") : t("branches_plural")}
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
                    {(editing || client.business?.establishedYear) && (
                        <div>
                            <span className="text-dark-500 dark:text-dark-400">{t("established_label")}</span>
                            {editing ? (
                                <input
                                    className={inputBaseClass}
                                    value={data.business?.establishedYear || ""}
                                    onChange={(e) => updateDraft("business.establishedYear", e.target.value)}
                                />
                            ) : (
                                <p className="text-light-900 dark:text-dark-50">{data.business.establishedYear}</p>
                            )}
                        </div>
                    )}
                    {(editing || client.business?.description) && (
                        <div className="sm:col-span-2">
                            <span className="text-dark-500 dark:text-dark-400">{t("description")}</span>
                            {editing ? (
                                <textarea
                                    className={`${inputBaseClass} min-h-[80px]`}
                                    value={data.business?.description || ""}
                                    onChange={(e) => updateDraft("business.description", e.target.value)}
                                />
                            ) : (
                                <p className="text-light-900 dark:text-dark-50 break-words">{data.business.description}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="card transition-colors duration-300">
                <h3 className="card-title mb-4">{t("contact_information")}</h3>
                <div className="space-y-4">
                    {(editing || client.personal?.fullName || client.personal?.email || client.personal?.phone) && (
                        <div className="space-y-2">
                            <h4 className="text-dark-700 dark:text-dark-50 text-sm font-semibold">{t("contact_person")}</h4>
                            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                {client.personal?.fullName && (
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
                                {client.personal?.position && (
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
                                {client.personal?.email && (
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
                                {client.personal?.phone && (
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

                    {(editing || client.contact?.businessEmail || client.contact?.businessPhone || client.contact?.website) && (
                        <div className="border-dark-200 dark:border-dark-700 space-y-2 border-t pt-3">
                            <h4 className="text-dark-700 dark:text-dark-50 text-sm font-semibold">{t("business_contact")}</h4>
                            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                {client.contact?.businessEmail && (
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
                                {client.contact?.businessPhone && (
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
                                {client.contact?.businessWhatsApp && (
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
                                {client.contact?.website && (
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
                                                className="text-primary-500 max-w-full break-words hover:underline"
                                            >
                                                {data.contact.website}
                                            </a>
                                        )}
                                    </div>
                                )}
                                {client.business?.mainOfficeAddress && (
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
        </div>
    );
};

export default ClientInfo;
