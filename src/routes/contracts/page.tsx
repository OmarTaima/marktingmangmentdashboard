import { useState } from "react";
import { Loader2, FileCheck, Plus } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useClients, useContracts } from "@/hooks/queries";
import type { Client } from "@/api/interfaces/clientinterface";
import type { Contract } from "@/api/requests/contractsService";
import CreateContract from "./CreateContract";
import PreviewContract from "./PreviewContract";
import CustomContract from "./CustomContract";

type View = "list" | "create" | "preview" | "custom";

const ContractsPage = () => {
    const { t, lang } = useLang();

    const [currentView, setCurrentView] = useState<View>("list");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [quotationId, setQuotationId] = useState<string | null>(null);

    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: allContractsResponse } = useContracts({ page: 1, limit: 1000 });

    const allContracts: any[] = Array.isArray(allContractsResponse)
        ? allContractsResponse
        : allContractsResponse?.data && Array.isArray(allContractsResponse.data)
          ? allContractsResponse.data
          : [];

    const handleCreateContract = (client: Client) => {
        setSelectedClient(client);
        setEditingContract(null);
        setQuotationId(null);
        setCurrentView("create");
    };

    const handleShowContracts = (client: Client) => {
        setSelectedClient(client);
        setCurrentView("preview");
    };

    const handleCreateCustomContract = () => {
        setSelectedClient(null);
        setEditingContract(null);
        setQuotationId(null);
        setCurrentView("custom");
    };

    const handleBack = () => {
        setCurrentView("list");
        setSelectedClient(null);
        setEditingContract(null);
        setQuotationId(null);
    };

    const handleEditContract = (contract: Contract) => {
        setEditingContract(contract);
        setCurrentView("create");
    };

    // Build a map of contract counts per client id
    const contractsCountByClientId: Record<string, number> = (() => {
        const counts: Record<string, number> = {};
        allContracts.forEach((c: any) => {
            if (!c) return;
            const cid = c.clientId?._id || c.clientId?.id || c.clientId;
            if (!cid) return;
            const key = String(cid);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    })();

    // Custom contracts (those without real clientId)
    const customContracts: any[] = allContracts.filter((c: any) => {
        if (!c) return false;
        const cid = c.clientId?._id || c.clientId?.id || c.clientId;
        return !cid || cid === "custom";
    });

    // Render based on current view
    if (currentView === "create") {
        const clientName = selectedClient?.business?.businessName || selectedClient?.personal?.fullName || t("unnamed_client") || "Unnamed";
        const clientId = (selectedClient as any)?.id || (selectedClient as any)?._id || "";

        return (
            <CreateContract
                clientId={clientId}
                clientName={clientName}
                onBack={handleBack}
                onSuccess={() => {
                    handleBack();
                }}
                editContract={editingContract}
                quotationId={quotationId || undefined}
            />
        );
    }

    if (currentView === "preview" && selectedClient) {
        const clientName = selectedClient.business?.businessName || selectedClient.personal?.fullName || t("unnamed_client") || "Unnamed";
        const clientId = (selectedClient as any).id || (selectedClient as any)._id || "";

        return (
            <PreviewContract
                clientId={clientId}
                clientName={clientName}
                onBack={handleBack}
                onCreateNew={() => handleCreateContract(selectedClient)}
                onEdit={handleEditContract}
            />
        );
    }

    if (currentView === "custom") {
        return (
            <CustomContract
                onBack={handleBack}
                onSuccess={handleBack}
            />
        );
    }

    // Show loading state until everything is loaded
    if (clientsLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="text-primary-500 mx-auto mb-4 h-12 w-12 animate-spin" />
                    <p className="text-light-600 dark:text-dark-400">{t("loading") || "Loading..."}</p>
                </div>
            </div>
        );
    }

    // Main list view
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="page-title">{t("contracts") || "Contracts"}</h1>
                    <p className="text-light-600 dark:text-dark-400 mt-1">{t("manage_client_contracts") || "Manage contracts for your clients"}</p>
                </div>
                <button
                    onClick={handleCreateCustomContract}
                    className="btn-primary"
                >
                    <Plus className="h-5 w-5" />
                    {t("custom_contract") || "Custom Contract"}
                </button>
            </div>

            {/* Client Cards Grid */}
            {clientsLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
                </div>
            ) : clients.length === 0 ? (
                <div className="card">
                    <div className="py-8 text-center">
                        <p className="text-light-600 dark:text-dark-400">{t("no_clients_found") || "No clients found"}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {clients.map((client) => {
                        const clientId = (client as any).id || (client as any)._id || "";
                        const clientName = client.business?.businessName || client.personal?.fullName || t("unnamed_client") || "Unnamed";
                        const contractCount = contractsCountByClientId[String(clientId)] || 0;

                        return (
                            <div
                                key={clientId}
                                className="card flex flex-col"
                            >
                                <h3 className="card-title text-lg">{clientName}</h3>
                                <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{client.business?.category || ""}</p>
                                <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                                    {contractCount} {t("contracts") || "contracts"}
                                </p>
                                <div className="mt-4 flex flex-col gap-2">
                                    <button
                                        onClick={() => handleCreateContract(client)}
                                        className="btn-primary w-full"
                                    >
                                        {t("create_contract") || "Create Contract"}
                                    </button>
                                    <button
                                        onClick={() => handleShowContracts(client)}
                                        className="btn-ghost w-full"
                                    >
                                        {t("show_contracts") || "Show Contracts"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Custom Contracts Table */}
            {customContracts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-light-500 dark:text-dark-50 text-lg font-semibold">{t("custom_contracts") || "Custom Contracts"}</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {customContracts.map((contract: any) => {
                            const statusColors: Record<string, string> = {
                                draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
                                active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
                                completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
                                cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                                renewed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
                            };

                            const formatDate = (dateString?: string | null) => {
                                if (!dateString) return "-";
                                return new Date(dateString).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
                            };

                            const clientName = contract.customClientName || t("unnamed") || "Unnamed";

                            return (
                                <div
                                    key={contract._id}
                                    className="border-light-600 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50 rounded-lg border p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center gap-3">
                                                <h4 className="text-light-900 dark:text-dark-50 font-semibold">{clientName}</h4>
                                                <span className="text-light-600 dark:text-dark-400 text-sm">{contract.contractNumber || "-"}</span>
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[contract.status] || statusColors.draft}`}
                                                >
                                                    {t(contract.status) || contract.status}
                                                </span>
                                            </div>
                                            <p className="text-light-600 dark:text-dark-400 mb-1 text-sm">
                                                {t("start_date") || "Start"}: {formatDate(contract.startDate)} | {t("end_date") || "End"}:{" "}
                                                {formatDate(contract.endDate)}
                                            </p>
                                            {contract.note && (
                                                <p className="text-light-600 dark:text-dark-400 mb-2 text-sm italic">{contract.note}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingContract(contract);
                                                    setSelectedClient({
                                                        business: { businessName: clientName },
                                                    } as Client);
                                                    setCurrentView("create");
                                                }}
                                                className="btn-ghost"
                                                title={t("edit") || "Edit"}
                                            >
                                                <FileCheck size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractsPage;
