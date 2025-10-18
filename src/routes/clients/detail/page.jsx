import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2 } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useLang } from "@/hooks/useLang";
import ClientInfo from "@/routes/clients/ClientInfo";

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLang();
    const [client, setClient] = useState(null);

    useEffect(() => {
        loadClient();
    }, [id]);

    const loadClient = () => {
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            const clients = JSON.parse(storedClients);
            const foundClient = clients.find((c) => c.id === id);
            if (foundClient) setClient(foundClient);
        }
    };

    if (!client) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-secondary-500 text-center">{t("loading") || "Loading..."}</div>
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
                        <ArrowLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("back") || "Back"}</span>
                    </button>
                    <h1 className="text-secondary-900 dark:text-secondary-50 text-xl font-semibold">
                        {client.business?.businessName || client.personal?.fullName || t("unnamed_business")}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="btn-sm btn"
                        aria-label="Edit"
                        onClick={() => navigate(`/onboarding?id=${id}`)}
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
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
                    />
                </div>

                <div className="space-y-4 lg:col-span-2">
                    {/* SWOT */}
                    <div className="card">
                        <h3 className="card-title mb-4">{t("swot") || "SWOT Analysis"}</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="mb-2 font-medium text-green-600 dark:text-green-400">💪 {t("strengths") || "Strengths"}</h4>
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                    {client.swot?.strengths && client.swot.strengths.length > 0 ? (
                                        client.swot.strengths.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-secondary-900 dark:text-secondary-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-secondary-500">{t("none_listed") || "None listed"}</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h4 className="mb-2 font-medium text-red-600 dark:text-red-400">⚠️ {t("weaknesses") || "Weaknesses"}</h4>
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                    {client.swot?.weaknesses && client.swot.weaknesses.length > 0 ? (
                                        client.swot.weaknesses.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-secondary-900 dark:text-secondary-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-secondary-500">{t("none_listed") || "None listed"}</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-primary-600 dark:text-primary-400 mb-2 font-medium">
                                    🎯 {t("opportunities") || "Opportunities"}
                                </h4>
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                    {client.swot?.opportunities && client.swot.opportunities.length > 0 ? (
                                        client.swot.opportunities.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-secondary-900 dark:text-secondary-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-secondary-500">{t("none_listed") || "None listed"}</li>
                                    )}
                                </ul>
                            </div>

                            <div>
                                <h4 className="mb-2 font-medium text-orange-600 dark:text-orange-400">⚡ {t("threats") || "Threats"}</h4>
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                    {client.swot?.threats && client.swot.threats.length > 0 ? (
                                        client.swot.threats.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-secondary-900 dark:text-secondary-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-secondary-500">{t("none_listed") || "None listed"}</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Segments */}
                    <div className="card">
                        <h3 className="card-title mb-4">{t("target_segments") || "Target Segments"}</h3>
                        {client.segments && client.segments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {client.segments.map((segment, idx) => (
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
                            <p className="text-secondary-500 text-sm">{t("no_segments_defined") || "No segments defined"}</p>
                        )}
                    </div>

                    {/* Competitors */}
                    <div className="card">
                        <h3 className="card-title mb-4">{t("competitors") || "Competitors"}</h3>
                        {client.competitors && client.competitors.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {client.competitors.map((competitor, idx) => (
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
                            <p className="text-secondary-500 text-sm">{t("no_competitors_tracked") || "No competitors tracked"}</p>
                        )}
                    </div>

                    {/* Social Media */}
                    <div className="card">
                        <h3 className="card-title mb-4">{t("social_media") || "Social Media"}</h3>
                        <div className="space-y-2">
                            {client.socialLinks?.business &&
                                client.socialLinks.business
                                    .filter((link) => link && link.url && link.platform)
                                    .map((link, idx) => {
                                        let Icon = null;
                                        let colorClass = "text-secondary-600";
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
                                                    className="text-primary-500 flex-1 truncate text-sm hover:underline"
                                                >
                                                    {link.url}
                                                </a>
                                            </div>
                                        );
                                    })}

                            {client.socialLinks?.custom &&
                                client.socialLinks.custom.length > 0 &&
                                client.socialLinks.custom.map((link, idx) => (
                                    <div
                                        key={`custom-${idx}`}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="text-secondary-700 dark:text-secondary-300 text-sm font-medium">{link.platform}:</span>
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary-500 flex-1 truncate text-sm hover:underline"
                                        >
                                            {link.url}
                                        </a>
                                    </div>
                                ))}

                            {(!client.socialLinks?.business || client.socialLinks.business.filter((link) => link && link.url).length === 0) &&
                                (!client.socialLinks?.custom || client.socialLinks.custom.length === 0) && (
                                    <p className="text-secondary-500 text-sm">{t("no_social_links_provided") || "No social links provided"}</p>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailPage;
