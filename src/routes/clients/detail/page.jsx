import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, TrendingUp } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";

const ClientDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);

    useEffect(() => {
        loadClient();
    }, [id]);

    const loadClient = () => {
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            const clients = JSON.parse(storedClients);
            const foundClient = clients.find((c) => c.id === id);
            if (foundClient) {
                setClient(foundClient);
            }
        }
    };

    const handleCreateCampaign = () => {
        localStorage.setItem("selectedClientId", id);
        navigate(`/campaigns/plan/${id}`);
    };

    if (!client) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-slate-600 dark:text-slate-400">Client not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/clients")}
                        className="btn-ghost"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="title">{client.business?.businessName}</h1>
                        <p className="text-slate-600 dark:text-slate-400">Client Details</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate("/onboarding")}
                        className="btn-ghost flex items-center gap-2"
                    >
                        <Edit2 size={16} />
                        Edit Client
                    </button>
                    <button
                        onClick={handleCreateCampaign}
                        className="btn-primary flex items-center gap-2"
                    >
                        <TrendingUp size={16} />
                        Plan Campaign
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column - Client Information */}
                <div className="space-y-4 lg:col-span-1">
                    {/* Client Overview */}
                    <div className="card">
                        <h3 className="card-title mb-4">Client Overview</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Business:</span>
                                <p className="font-medium text-slate-900 dark:text-slate-50">{client.business?.businessName || "N/A"}</p>
                            </div>
                            <div>
                                <span className="text-slate-500 dark:text-slate-400">Category:</span>
                                <p className="text-slate-900 dark:text-slate-50">{client.business?.category || "N/A"}</p>
                            </div>
                            {client.business?.establishedYear && (
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Established:</span>
                                    <p className="text-slate-900 dark:text-slate-50">{client.business.establishedYear}</p>
                                </div>
                            )}
                            {client.business?.description && (
                                <div>
                                    <span className="text-slate-500 dark:text-slate-400">Description:</span>
                                    <p className="text-slate-900 dark:text-slate-50">{client.business.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="card">
                        <h3 className="card-title mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            {/* Contact Person */}
                            {(client.personal?.fullName || client.personal?.email || client.personal?.phone) && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Contact Person</h4>
                                    <div className="space-y-2 text-sm">
                                        {client.personal?.fullName && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Name:</span>
                                                <p className="font-medium text-slate-900 dark:text-slate-50">{client.personal.fullName}</p>
                                            </div>
                                        )}
                                        {client.personal?.position && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Position:</span>
                                                <p className="text-slate-900 dark:text-slate-50">{client.personal.position}</p>
                                            </div>
                                        )}
                                        {client.personal?.email && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Email:</span>
                                                <p className="text-slate-900 dark:text-slate-50">{client.personal.email}</p>
                                            </div>
                                        )}
                                        {client.personal?.phone && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                                                <p className="text-slate-900 dark:text-slate-50">{client.personal.phone}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Business Contact */}
                            {(client.contact?.businessEmail || client.contact?.businessPhone || client.contact?.website) && (
                                <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Business Contact</h4>
                                    <div className="space-y-2 text-sm">
                                        {client.contact?.businessEmail && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Email:</span>
                                                <p className="text-slate-900 dark:text-slate-50">{client.contact.businessEmail}</p>
                                            </div>
                                        )}
                                        {client.contact?.businessPhone && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                                                <p className="text-slate-900 dark:text-slate-50">{client.contact.businessPhone}</p>
                                            </div>
                                        )}
                                        {client.contact?.businessWhatsApp && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">WhatsApp:</span>
                                                <p className="text-slate-900 dark:text-slate-50">{client.contact.businessWhatsApp}</p>
                                            </div>
                                        )}
                                        {client.contact?.website && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Website:</span>
                                                <a
                                                    href={client.contact.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    {client.contact.website}
                                                </a>
                                            </div>
                                        )}
                                        {client.business?.mainOfficeAddress && (
                                            <div>
                                                <span className="text-slate-500 dark:text-slate-400">Main Office:</span>
                                                <p className="text-slate-900 dark:text-slate-50">{client.business.mainOfficeAddress}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card">
                        <h3 className="card-title mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{client.segments?.length || 0}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Segments</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{client.competitors?.length || 0}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Competitors</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{client.branches?.length || 0}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Branches</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Market Analysis */}
                <div className="space-y-4 lg:col-span-2">
                    {/* SWOT Analysis */}
                    <div className="card">
                        <h3 className="card-title mb-4">SWOT Analysis</h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="mb-2 font-medium text-green-600 dark:text-green-400">💪 Strengths</h4>
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                    {client.swot?.strengths && client.swot.strengths.length > 0 ? (
                                        client.swot.strengths.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-slate-900 dark:text-slate-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-slate-500">None listed</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <h4 className="mb-2 font-medium text-red-600 dark:text-red-400">⚠️ Weaknesses</h4>
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                    {client.swot?.weaknesses && client.swot.weaknesses.length > 0 ? (
                                        client.swot.weaknesses.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-slate-900 dark:text-slate-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-slate-500">None listed</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <h4 className="mb-2 font-medium text-blue-600 dark:text-blue-400">🎯 Opportunities</h4>
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                    {client.swot?.opportunities && client.swot.opportunities.length > 0 ? (
                                        client.swot.opportunities.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-slate-900 dark:text-slate-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-slate-500">None listed</li>
                                    )}
                                </ul>
                            </div>
                            <div>
                                <h4 className="mb-2 font-medium text-orange-600 dark:text-orange-400">⚡ Threats</h4>
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                    {client.swot?.threats && client.swot.threats.length > 0 ? (
                                        client.swot.threats.map((item, idx) => (
                                            <li
                                                key={idx}
                                                className="text-slate-900 dark:text-slate-50"
                                            >
                                                {item}
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-slate-500">None listed</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Target Segments */}
                    <div className="card">
                        <h3 className="card-title mb-4">Target Segments</h3>
                        {client.segments && client.segments.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {client.segments.map((segment, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
                                    >
                                        <h4 className="font-medium text-slate-900 dark:text-slate-50">{segment.name}</h4>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{segment.description}</p>
                                        <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                                            {segment.targetAge && <span>Age: {segment.targetAge}</span>}
                                            {segment.targetGender && <span>Gender: {segment.targetGender}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No segments defined</p>
                        )}
                    </div>

                    {/* Competitors */}
                    <div className="card">
                        <h3 className="card-title mb-4">Competitors</h3>
                        {client.competitors && client.competitors.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {client.competitors.map((competitor, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
                                    >
                                        <h4 className="font-medium text-slate-900 dark:text-slate-50">{competitor.name}</h4>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{competitor.description}</p>
                                        {competitor.website && (
                                            <a
                                                href={competitor.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-1 text-xs text-blue-500 hover:underline"
                                            >
                                                {competitor.website}
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">No competitors tracked</p>
                        )}
                    </div>

                    {/* Social Media */}
                    <div className="card">
                        <h3 className="card-title mb-4">Social Media</h3>
                        <div className="space-y-2">
                            {client.socialLinks?.business &&
                                client.socialLinks.business
                                    .filter((link) => link && link.url && link.platform)
                                    .map((link, idx) => {
                                        let Icon = null;
                                        let colorClass = "text-slate-600";
                                        const platformLower = link.platform.toLowerCase();

                                        if (platformLower.includes("facebook")) {
                                            Icon = SiFacebook;
                                            colorClass = "text-blue-600";
                                        } else if (platformLower.includes("instagram")) {
                                            Icon = SiInstagram;
                                            colorClass = "text-pink-600";
                                        } else if (platformLower.includes("tiktok")) {
                                            Icon = SiTiktok;
                                            colorClass = "text-slate-900 dark:text-white";
                                        } else if (platformLower.includes("x") || platformLower.includes("twitter")) {
                                            Icon = SiX;
                                            colorClass = "text-slate-900 dark:text-white";
                                        }

                                        return (
                                            <div
                                                key={`business-${idx}`}
                                                className="flex items-center gap-2"
                                            >
                                                {Icon && <Icon className={`${colorClass} h-4 w-4`} />}
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{link.platform}:</span>
                                                <a
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 truncate text-sm text-blue-500 hover:underline"
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
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{link.platform}:</span>
                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 truncate text-sm text-blue-500 hover:underline"
                                        >
                                            {link.url}
                                        </a>
                                    </div>
                                ))}

                            {(!client.socialLinks?.business || client.socialLinks.business.filter((link) => link && link.url).length === 0) &&
                                (!client.socialLinks?.custom || client.socialLinks.custom.length === 0) && (
                                    <p className="text-sm text-slate-500">No social links provided</p>
                                )}
                        </div>
                    </div>

                    {/* Branches */}
                    {client.branches && client.branches.length > 0 && (
                        <div className="card">
                            <h3 className="card-title mb-4">Branches</h3>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {client.branches.map((branch, idx) => (
                                    <div
                                        key={idx}
                                        className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
                                    >
                                        <h4 className="font-medium text-slate-900 dark:text-slate-50">{branch.name}</h4>
                                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{branch.address}</p>
                                        {branch.phone && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">📞 {branch.phone}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDetailPage;
