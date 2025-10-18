import React from "react";
import { Users, Mail, Phone, MapPin } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const ClientInfo = ({ client, compact = false }) => {
    const { t } = useLang();
    if (!client) return null;

    if (compact) {
        return (
            <div className="space-y-4">
                <div>
                    <h3 className="text-secondary-900 dark:text-secondary-50 text-xl font-semibold">
                        <span className="mr-2 text-sm font-semibold">{t("business_name_label")}</span>
                        {client.business?.businessName || t("unnamed_business")}
                    </h3>
                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                        <span className="mr-2 text-xs font-medium">{t("business_category_label")}</span>
                        {client.business?.category || t("no_category")}
                    </p>
                </div>

                <div className="border-secondary-200 dark:border-secondary-700 space-y-2 border-t pt-3 text-sm">
                    {client.personal?.fullName && (
                        <div className="text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                            <Users size={14} />
                            <span>{client.personal.fullName}</span>
                        </div>
                    )}
                    {client.contact?.businessEmail && (
                        <div className="text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                            <Mail size={14} />
                            <span className="truncate">{client.contact.businessEmail}</span>
                        </div>
                    )}
                    {client.contact?.businessPhone && (
                        <div className="text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
                            <Phone size={14} />
                            <span>{client.contact.businessPhone}</span>
                        </div>
                    )}
                    {client.branches && client.branches.length > 0 && (
                        <div className="text-secondary-600 dark:text-secondary-400 flex items-center gap-2">
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
        <>
            <div className="card">
                <h3 className="card-title mb-4">{t("client_overview")}</h3>
                <div className="space-y-3 text-sm">
                    <div>
                        <span className="text-secondary-500 dark:text-secondary-400">{t("business_name_label")}</span>
                        <p className="text-secondary-900 dark:text-secondary-50 font-medium">{client.business?.businessName || "N/A"}</p>
                    </div>
                    <div>
                        <span className="text-secondary-500 dark:text-secondary-400">{t("business_category_label")}</span>
                        <p className="text-secondary-900 dark:text-secondary-50">{client.business?.category || "N/A"}</p>
                    </div>
                    {client.business?.establishedYear && (
                        <div>
                            <span className="text-secondary-500 dark:text-secondary-400">{t("established_label")}</span>
                            <p className="text-secondary-900 dark:text-secondary-50">{client.business.establishedYear}</p>
                        </div>
                    )}
                    {client.business?.description && (
                        <div>
                            <span className="text-secondary-500 dark:text-secondary-400">{t("description")}</span>
                            <p className="text-secondary-900 dark:text-secondary-50">{client.business.description}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <h3 className="card-title mb-4">{t("contact_information")}</h3>
                <div className="space-y-4">
                    {(client.personal?.fullName || client.personal?.email || client.personal?.phone) && (
                        <div className="space-y-2">
                            <h4 className="text-secondary-700 dark:text-secondary-300 text-sm font-semibold">{t("contact_person")}</h4>
                            <div className="space-y-2 text-sm">
                                {client.personal?.fullName && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("name_label")}</span>
                                        <p className="text-secondary-900 dark:text-secondary-50 font-medium">{client.personal.fullName}</p>
                                    </div>
                                )}
                                {client.personal?.position && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("position_label")}</span>
                                        <p className="text-secondary-900 dark:text-secondary-50">{client.personal.position}</p>
                                    </div>
                                )}
                                {client.personal?.email && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("email_label")}</span>
                                        <p className="text-secondary-900 dark:text-secondary-50">{client.personal.email}</p>
                                    </div>
                                )}
                                {client.personal?.phone && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("phone_label")}</span>
                                        <p className="text-secondary-900 dark:text-secondary-50">{client.personal.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(client.contact?.businessEmail || client.contact?.businessPhone || client.contact?.website) && (
                        <div className="border-secondary-200 dark:border-secondary-700 space-y-2 border-t pt-3">
                            <h4 className="text-secondary-700 dark:text-secondary-300 text-sm font-semibold">{t("business_contact")}</h4>
                            <div className="space-y-2 text-sm">
                                {client.contact?.businessEmail && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("email_label")}</span>
                                        <p className="text-secondary-900 dark:text-secondary-50">{client.contact.businessEmail}</p>
                                    </div>
                                )}
                                {client.contact?.businessPhone && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("phone_label")}</span>
                                        <p className="text-secondary-900 dark:text-secondary-50">{client.contact.businessPhone}</p>
                                    </div>
                                )}
                                {client.contact?.businessWhatsApp && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("whatsapp_label")}</span>
                                        <p className="text-secondary-900 dark:text-secondary-50">{client.contact.businessWhatsApp}</p>
                                    </div>
                                )}
                                {client.contact?.website && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("website_label")}</span>
                                        <a
                                            href={client.contact.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-500 hover:underline"
                                        >
                                            {client.contact.website}
                                        </a>
                                    </div>
                                )}
                                {client.business?.mainOfficeAddress && (
                                    <div>
                                        <span className="text-secondary-500 dark:text-secondary-400">{t("main_office_label")}</span>
                                        <p className="text-secondary-900 dark:text-secondary-50">{client.business.mainOfficeAddress}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ClientInfo;
