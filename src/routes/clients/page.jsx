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
        const storedClients = localStorage.getItem("clients");
        if (storedClients) {
            setClients(JSON.parse(storedClients));
        }
    };

    const handleAddNewClient = () => {
        navigate("/onboarding");
    };

    const handleViewClient = (clientId) => {
        localStorage.setItem("selectedClientId", clientId);
        navigate(`/clients/${clientId}`);
    };

    const handleToPlanning = (clientId) => {
        localStorage.setItem("selectedClientId", clientId);
        navigate(`/planning`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="title">{t("clients_title")}</h1>
                    <p className="text-secondary-600 dark:text-secondary-400">{t("manage_your_client_database")}</p>
                </div>
                <button
                    onClick={handleAddNewClient}
                    className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
                >
                    <Plus size={16} />
                    {t("add_new_client")}
                </button>
            </div>

            {/* No clients placeholder */}
            {clients.length === 0 ? (
                <div className="border-secondary-300 dark:border-secondary-700 flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed text-center">
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
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {clients.map((client) => (
                        <div
                            key={client.id}
                            className="card flex h-full min-w-0 flex-col justify-between transition-colors duration-300 hover:shadow-lg"
                        >
                            {/* Top content */}
                            <div className="space-y-4">
                                <ClientInfo
                                    client={client}
                                    compact
                                />

                                {/* Stats Section */}
                                <div className="border-secondary-200 dark:border-secondary-700 flex flex-wrap justify-center gap-3 border-t pt-3">
                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-primary-600 dark:text-primary-400 text-base font-bold sm:text-lg">
                                            {client.segments?.length || 0}
                                        </p>
                                        <p className="text-secondary-600 dark:text-secondary-400 text-center text-[11px] whitespace-nowrap sm:text-xs">
                                            {t("segments_label")}
                                        </p>
                                    </div>

                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-base font-bold text-orange-600 sm:text-lg dark:text-orange-400">
                                            {client.competitors?.length || 0}
                                        </p>
                                        <p className="text-secondary-600 dark:text-secondary-400 text-center text-[11px] whitespace-nowrap sm:text-xs">
                                            {t("competitors_label")}
                                        </p>
                                    </div>

                                    <div className="flex min-w-[80px] flex-col items-center justify-center px-2">
                                        <p className="text-base font-bold text-green-600 sm:text-lg dark:text-green-400">
                                            {(client.swot?.strengths?.length || 0) +
                                                (client.swot?.weaknesses?.length || 0) +
                                                (client.swot?.opportunities?.length || 0) +
                                                (client.swot?.threats?.length || 0)}
                                        </p>
                                        <p className="text-secondary-600 dark:text-secondary-400 text-center text-[11px] whitespace-nowrap sm:text-xs">
                                            {t("swot_items")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons (Always stay inside) */}
                            <div className="border-secondary-200 dark:border-secondary-700 mt-auto flex min-w-0 flex-col gap-2 border-t pt-3 sm:flex-row">
                                <button
                                    onClick={() => handleViewClient(client.id)}
                                    className="btn-ghost flex min-w-0 flex-1 items-center justify-center gap-2 text-sm"
                                >
                                    <Target size={14} />
                                    {t("view_details")}
                                </button>

                                <button
                                    onClick={() => handleToPlanning(client.id)}
                                    className="btn-primary flex min-w-0 flex-1 items-center justify-center gap-2 text-sm"
                                >
                                    <TrendingUp size={14} />
                                    {t("plan_campaign")}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientsPage;
