import { useState } from "react";
import type { ComponentType } from "react";
import { Loader2, FileCheck, Plus, Download, Trash2, Sparkles, UsersRound, Layers3, FileText } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useClients, useContracts, useDeleteContract } from "@/hooks/queries";
import { showAlert, showConfirm, showToast } from "@/utils/swal";
import { generateContractPDF } from "@/utils/contractPdfGenerator";
import { getContractById } from "@/api/requests/contractsService";
import type { Client } from "@/api/interfaces/clientinterface";
import type { Contract } from "@/api/requests/contractsService";
import CreateContract from "./CreateContract";
import PreviewContract from "./PreviewContract";
import CustomContractRaw from "./CustomContract";

// Some modules may export a function typed to return void which TypeScript rejects as a JSX component;
// cast the import to a ComponentType with the expected props to satisfy JSX usage.
// Ensure the actual CustomContract implementation returns valid JSX — this cast only fixes the type error.
const CustomContract = CustomContractRaw as unknown as ComponentType<{
    onBack?: () => void;
    onSuccess?: () => void;
    editContract?: Contract | null;
}>;

type View = "list" | "create" | "preview" | "custom";

const ContractsPage = () => {
    const { t, lang } = useLang();
    const tr = (key: string, fallback: string) => {
        const value = t(key);
        return value && value !== key ? value : fallback;
    };

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
        const totalContracts = allContracts.length;

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
    const clientsWithContracts = Object.keys(contractsCountByClientId).length;

    const deleteContractMutation = useDeleteContract();

    const handleDeleteContract = async (id: string) => {
        const confirmed = await showConfirm(
            t("confirm_delete_contract") || "Are you sure you want to delete this contract?",
            t("yes") || "Yes",
            t("no") || "No",
        );
        if (!confirmed) return;

        try {
            await deleteContractMutation.mutateAsync(id);
            showToast(t("contract_deleted") || "Contract deleted successfully", "success");
        } catch (error: any) {
            showAlert(error?.response?.data?.message || t("failed_to_delete_contract") || "Failed to delete contract", "error");
        }
    };

    const handleDownloadContract = async (id: string, clientNameForPdf?: string) => {
        try {
            const contractData = await getContractById(id);

            // Determine client name for the PDF
            let displayName = clientNameForPdf;
            if (!displayName) {
                // Try to get from contract data
                if (typeof contractData.clientId === "object" && contractData.clientId) {
                    const client = contractData.clientId as any;
                    displayName = client.business?.businessName || client.personal?.fullName || "Client";
                } else if ((contractData as any).clientName || (contractData as any).clientNameAr) {
                    displayName = lang === "ar" ? (contractData as any).clientNameAr : (contractData as any).clientName;
                } else {
                    displayName = "Client";
                }
            }

            // Ask user to choose language for PDF (default Arabic)
            const languageChoice = await showConfirm(
                t("choose_pdf_language") || "Download contract in Arabic or English?",
                t("arabic") || "Arabic",
                t("english") || "English",
            );

            const pdfLang = languageChoice ? "ar" : "en";

            // Generate PDF using the contract data
            await generateContractPDF({
                contract: contractData,
                clientName: displayName || "Client",
                lang: pdfLang,
                t: t as (key: string) => string,
            });

            showToast(t("contract_downloaded") || "Contract downloaded successfully", "success");
        } catch (error: any) {
            console.error("Error downloading contract:", error);
            showAlert(error?.response?.data?.message || t("failed_to_download_contract") || "Failed to download contract", "error");
        }
    };

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
                editContract={editingContract}
            />
        );
    }

    // Show loading state until everything is loaded
    if (clientsLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="text-light-500 mx-auto mb-4 h-12 w-12 animate-spin" />
                </div>
            </div>
        );
    }

    // Main list view
    return (
        <div className="space-y-8 pb-10">
            <div className="relative overflow-hidden rounded-[2rem] border border-light-200 bg-white p-6 shadow-sm dark:border-dark-800 dark:bg-dark-900 sm:p-8">
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-light-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secdark-700/10 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-light-200 bg-light-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-light-600 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-300">
                            <Sparkles size={13} />
                            Contract Center
                        </div>
                        <h1 className="title text-2xl sm:text-3xl">{tr("contracts", "Contracts")}</h1>
                        <p className="text-light-600 dark:text-dark-400 text-sm sm:text-base">
                            {tr("manage_client_contracts", "Manage contracts for your clients")}
                        </p>
                    </div>

                    <button
                        onClick={handleCreateCustomContract}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        {tr("custom_contract", "Custom Contract")}
                    </button>
                </div>

                <div className="relative z-10 mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-light-200 bg-white/70 p-4 dark:border-dark-700 dark:bg-dark-900/70">
                        <div className="flex items-center justify-between">
                            <p className="text-light-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider">Clients</p>
                            <UsersRound size={16} className="text-light-500" />
                        </div>
                        <p className="text-light-900 dark:text-dark-50 mt-3 text-2xl font-black tracking-tight">{clients.length}</p>
                    </div>
                    <div className="rounded-2xl border border-light-200 bg-white/70 p-4 dark:border-dark-700 dark:bg-dark-900/70">
                        <div className="flex items-center justify-between">
                            <p className="text-light-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider">Total Contracts</p>
                            <FileText size={16} className="text-secdark-700 dark:text-secdark-400" />
                        </div>
                        <p className="text-light-900 dark:text-dark-50 mt-3 text-2xl font-black tracking-tight">{totalContracts}</p>
                    </div>
                    <div className="rounded-2xl border border-light-200 bg-white/70 p-4 dark:border-dark-700 dark:bg-dark-900/70">
                        <div className="flex items-center justify-between">
                            <p className="text-light-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider">Active Clients</p>
                            <UsersRound size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-light-900 dark:text-dark-50 mt-3 text-2xl font-black tracking-tight">{clientsWithContracts}</p>
                    </div>
                    <div className="rounded-2xl border border-light-200 bg-white/70 p-4 dark:border-dark-700 dark:bg-dark-900/70">
                        <div className="flex items-center justify-between">
                            <p className="text-light-500 dark:text-dark-400 text-xs font-bold uppercase tracking-wider">Custom Contracts</p>
                            <Layers3 size={16} className="text-orange-500" />
                        </div>
                        <p className="text-light-900 dark:text-dark-50 mt-3 text-2xl font-black tracking-tight">{customContracts.length}</p>
                    </div>
                </div>
            </div>

            {/* Client Cards Grid */}
            {clientsLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="text-light-500 h-8 w-8 animate-spin" />
                </div>
            ) : clients.length === 0 ? (
                <div className="card">
                    <div className="py-8 text-center">
                        <p className="text-light-600 dark:text-dark-400">{tr("no_clients_found", "No clients found")}</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                    {clients.map((client) => {
                        const clientId = (client as any).id || (client as any)._id || "";
                        const clientName = client.business?.businessName || client.personal?.fullName || tr("unnamed_client", "Unnamed");
                        const contractCount = contractsCountByClientId[String(clientId)] || 0;

                        return (
                            <div
                                key={clientId}
                                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-light-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-dark-800 dark:bg-dark-900"
                            >
                                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-light-500/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70" />
                                <div className="relative z-10">
                                    <h3 className="text-light-900 dark:text-dark-50 text-xl font-black tracking-tight">{clientName}</h3>
                                    <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{client.business?.category || "-"}</p>
                                </div>

                                <div className="border-light-100 dark:border-dark-800 relative z-10 mt-4 grid grid-cols-2 gap-2 border-t pt-4">
                                    <div className="rounded-xl border border-light-200 bg-white/70 px-3 py-2 text-center dark:border-dark-700 dark:bg-dark-800/70">
                                        <p className="text-light-500 dark:text-dark-400 text-[10px] font-black uppercase tracking-wider">Contracts</p>
                                        <p className="text-light-900 dark:text-dark-50 mt-1 text-lg font-black">{contractCount}</p>
                                    </div>
                                    <div className="rounded-xl border border-light-200 bg-white/70 px-3 py-2 text-center dark:border-dark-700 dark:bg-dark-800/70">
                                        <p className="text-light-500 dark:text-dark-400 text-[10px] font-black uppercase tracking-wider">Status</p>
                                        <p className="text-light-900 dark:text-dark-50 mt-1 text-sm font-semibold">
                                            {contractCount > 0 ? "Has Contracts" : "New"}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-light-100 dark:border-dark-800 relative z-10 mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row">
                                    <button
                                        onClick={() => handleCreateContract(client)}
                                        className="btn-primary flex-1"
                                    >
                                        {tr("create_contract", "Create Contract")}
                                    </button>
                                    <button
                                        onClick={() => handleShowContracts(client)}
                                        className="btn-secondary flex-1"
                                    >
                                        {tr("show_contracts", "Show Contracts")}
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
                    <h3 className="text-light-500 dark:text-dark-50 text-lg font-semibold">{tr("custom_contracts", "Custom Contracts")}</h3>
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

                            const nameEn = contract.clientName || contract.customClientName || "";
                            const nameAr = contract.clientNameAr || contract.customClientNameAr || "";
                            const clientName =
                                lang === "ar" ? nameAr || nameEn || t("unnamed") || "Unnamed" : nameEn || nameAr || t("unnamed") || "Unnamed";

                            return (
                                <div
                                    key={contract._id}
                                    className="rounded-2xl border border-light-200 bg-white/80 p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-dark-700 dark:bg-dark-800/60"
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

                                        <div className="flex items-center gap-2 rounded-xl border border-light-200 bg-white/70 p-1 dark:border-dark-700 dark:bg-dark-900/70">
                                            <button
                                                onClick={() => handleDownloadContract(contract._id, clientName)}
                                                className="btn-ghost size-9 !p-0"
                                                title={tr("download_contract", "Download")}
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingContract(contract);
                                                    // Custom contracts should route to custom view
                                                    setSelectedClient(null);
                                                    setCurrentView("custom");
                                                }}
                                                className="btn-ghost size-9 !p-0"
                                                title={tr("edit", "Edit")}
                                            >
                                                <FileCheck size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteContract(contract._id)}
                                                className="btn-ghost size-9 !p-0 text-danger-500"
                                                title={tr("delete", "Delete")}
                                            >
                                                <Trash2 size={16} />
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
