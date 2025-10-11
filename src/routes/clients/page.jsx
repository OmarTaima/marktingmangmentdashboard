import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, Mail, Phone, Users, Target, TrendingUp, MapPin } from "lucide-react";

const ClientsPage = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = () => {
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            setClients(JSON.parse(storedClients));
        }
    };

    const handleAddNewClient = () => {
        navigate("/onboarding");
    };

    const handleViewClient = (clientId) => {
        // Store selected client ID for campaign planning
        localStorage.setItem("selectedClientId", clientId);
        navigate(`/clients/${clientId}`);
    };

    const handleCreateCampaign = (clientId) => {
        localStorage.setItem("selectedClientId", clientId);
        navigate(`/campaigns/plan/${clientId}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">Clients</h1>
                    <p className="text-slate-600 dark:text-slate-400">Manage your client database</p>
                </div>
                <button
                    onClick={handleAddNewClient}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add New Client
                </button>
            </div>

            {clients.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <Building2
                        size={64}
                        className="text-slate-400"
                    />
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No clients yet</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Get started by adding your first client</p>
                    <button
                        onClick={handleAddNewClient}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Your First Client
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {clients.map((client) => (
                        <div
                            key={client.id}
                            className="card cursor-pointer transition-shadow hover:shadow-lg"
                        >
                            <div className="space-y-4">
                                {/* Header */}
                                <div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                                        {client.business?.businessName || "Unnamed Business"}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{client.business?.category || "No category"}</p>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
                                    {client.personal?.fullName && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Users size={14} />
                                            <span>{client.personal.fullName}</span>
                                        </div>
                                    )}
                                    {client.contact?.businessEmail && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Mail size={14} />
                                            <span className="truncate">{client.contact.businessEmail}</span>
                                        </div>
                                    )}
                                    {client.contact?.businessPhone && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <Phone size={14} />
                                            <span>{client.contact.businessPhone}</span>
                                        </div>
                                    )}
                                    {client.branches && client.branches.length > 0 && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <MapPin size={14} />
                                            <span>
                                                {client.branches.length} {client.branches.length === 1 ? "branch" : "branches"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{client.segments?.length || 0}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Segments</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{client.competitors?.length || 0}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Competitors</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            {(client.swot?.strengths?.length || 0) +
                                                (client.swot?.weaknesses?.length || 0) +
                                                (client.swot?.opportunities?.length || 0) +
                                                (client.swot?.threats?.length || 0)}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">SWOT Items</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                                    <button
                                        onClick={() => handleViewClient(client.id)}
                                        className="btn-ghost flex-1 text-sm"
                                    >
                                        <Target size={14} />
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => handleCreateCampaign(client.id)}
                                        className="btn-primary flex-1 text-sm"
                                    >
                                        <TrendingUp size={14} />
                                        Plan Campaign
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientsPage;
