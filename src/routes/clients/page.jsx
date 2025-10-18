import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Building2, Target, TrendingUp } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import ClientInfo from "./ClientInfo";

const ClientsPage = () => {
    const navigate = useNavigate();
    const { t } = useLang();
    const [clients, setClients] = useState([]);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = () => {
        const stodangerClients = localStorage.getItem("clients");
        if (stodangerClients) {
            setClients(JSON.parse(stodangerClients));
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

    const handleToPlanning = (clientId) => {
        localStorage.setItem("selectedClientId", clientId);
        navigate(`/planning`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("clients_title")}</h1>
                    <p className="text-secondary-600 dark:text-secondary-400">{t("manage_your_client_database")}</p>
                </div>
                <button
                    onClick={handleAddNewClient}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={16} />
                    {t("add_new_client")}
                </button>
            </div>

            {clients.length === 0 ? (
                <div className="border-secondary-300 dark:border-secondary-700 flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed">
                    <Building2
                        size={64}
                        className="text-secondary-400"
                    />
                    <p className="text-secondary-600 dark:text-secondary-400 text-lg font-medium">{t("no_clients_yet")}</p>
                    <p className="text-secondary-500 dark:text-secondary-400 text-sm">{t("get_started_add_first")}</p>
                    <button
                        onClick={handleAddNewClient}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} />
                        {t("add_your_first_client")}
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
                                <ClientInfo
                                    client={client}
                                    compact
                                />

                                {/* Stats */}
                                <div className="border-secondary-200 dark:border-secondary-700 grid grid-cols-3 gap-2 border-t pt-3">
                                    <div className="text-center">
                                        <p className="text-primary-600 dark:text-primary-400 text-lg font-bold">{client.segments?.length || 0}</p>
                                        <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("segments_label")}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{client.competitors?.length || 0}</p>
                                        <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("competitors_label")}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                            {(client.swot?.strengths?.length || 0) +
                                                (client.swot?.weaknesses?.length || 0) +
                                                (client.swot?.opportunities?.length || 0) +
                                                (client.swot?.threats?.length || 0)}
                                        </p>
                                        <p className="text-secondary-600 dark:text-secondary-400 text-xs">{t("swot_items")}</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="border-secondary-200 dark:border-secondary-700 flex gap-2 border-t pt-3">
                                    <button
                                        onClick={() => handleViewClient(client.id)}
                                        className="btn-ghost flex-1 text-sm"
                                    >
                                        <Target size={14} />
                                        {t("view_details")}
                                    </button>
                                    <button
                                        onClick={() => handleToPlanning(client.id)}
                                        className="btn-primary flex-1 text-sm"
                                    >
                                        <TrendingUp size={14} />
                                        {t("plan_campaign")}
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
