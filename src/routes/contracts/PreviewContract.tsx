import { useState, useEffect } from "react";
import {
    Loader2,
    Trash2,
    Edit2,
    FileCheck,
    ChevronLeft,
    ChevronRight,
    Plus,
    FileSignature,
    CheckCircle,
    XCircle,
    RefreshCw,
    Download,
} from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { showAlert, showConfirm, showToast } from "@/utils/swal";
import { useContracts, useDeleteContract, useSignContract, useCompleteContract, useCancelContract, useRenewContract } from "@/hooks/queries";
import { getContractById } from "@/api/requests/contractsService";
import type { ContractQueryParams } from "@/api/requests/contractsService";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

interface PreviewContractProps {
    clientId?: string;
    clientName: string;
    onBack: () => void;
    onCreateNew: () => void;
    onEdit: (contract: any) => void;
}

const PreviewContract = ({ clientId, clientName, onBack, onCreateNew, onEdit }: PreviewContractProps) => {
    const { t, lang } = useLang();

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize] = useState<number>(20);
    const [statusFilter, setStatusFilter] = useState<string>("");

    // Build query params
    const contractsParams: ContractQueryParams = {
        page: currentPage,
        limit: pageSize,
        status: (statusFilter as any) || undefined,
        ...(clientId ? { clientId } : {}),
    };

    const { data: contractsResponse, isLoading: contractsLoading, refetch: refetchContracts } = useContracts(contractsParams);

    const contracts = contractsResponse?.data || [];
    const totalContracts = contractsResponse?.meta?.total || 0;
    const totalPages = contractsResponse?.meta?.totalPages || 1;

    // Refetch when clientId changes
    useEffect(() => {
        refetchContracts();
    }, [clientId, refetchContracts]);

    const deleteContractMutation = useDeleteContract();
    const signContractMutation = useSignContract();
    const completeContractMutation = useCompleteContract();
    const cancelContractMutation = useCancelContract();
    const renewContractMutation = useRenewContract();

    // Modals state
    const [showRenewModal, setShowRenewModal] = useState<boolean>(false);
    const [renewContractId, setRenewContractId] = useState<string | null>(null);
    const [newStartDate, setNewStartDate] = useState<Dayjs | null>(null);
    const [newEndDate, setNewEndDate] = useState<Dayjs | null>(null);

    const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
    const [cancelContractId, setCancelContractId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState<string>("");

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

    const handleDownloadContract = async (id: string) => {
        try {
            // Try to fetch full contract data to get downloadable URL
            const contract = await getContractById(id);
            const url = (contract as any)?.contractImage;
            if (url) {
                window.open(url, "_blank");
            } else {
                showAlert(t("no_download_available") || "No downloadable file available", "warning");
            }
        } catch (error: any) {
            showAlert(error?.response?.data?.message || t("failed_to_load_contract") || "Failed to load contract", "error");
        }
    };

    const handleSignContract = async (id: string) => {
        const confirmed = await showConfirm(
            t("confirm_sign_contract") || "Are you sure you want to sign and activate this contract?",
            t("yes") || "Yes",
            t("no") || "No",
        );
        if (!confirmed) return;

        try {
            await signContractMutation.mutateAsync({ id });
            showToast(t("contract_signed") || "Contract signed and activated successfully", "success");
        } catch (error: any) {
            showAlert(error?.response?.data?.message || t("failed_to_sign_contract") || "Failed to sign contract", "error");
        }
    };

    const handleCompleteContract = async (id: string) => {
        const confirmed = await showConfirm(t("confirm_complete_contract") || "Mark this contract as completed?", t("yes") || "Yes", t("no") || "No");
        if (!confirmed) return;

        try {
            await completeContractMutation.mutateAsync(id);
            showToast(t("contract_completed") || "Contract marked as completed", "success");
        } catch (error: any) {
            showAlert(error?.response?.data?.message || t("failed_to_complete_contract") || "Failed to complete contract", "error");
        }
    };

    const handleCancelContract = async () => {
        if (!cancelContractId) return;

        try {
            await cancelContractMutation.mutateAsync({ id: cancelContractId, reason: cancelReason });
            showToast(t("contract_cancelled") || "Contract cancelled successfully", "success");
            setShowCancelModal(false);
            setCancelContractId(null);
            setCancelReason("");
        } catch (error: any) {
            showAlert(error?.response?.data?.message || t("failed_to_cancel_contract") || "Failed to cancel contract", "error");
        }
    };

    const handleRenewContract = async () => {
        if (!renewContractId || !newStartDate || !newEndDate) {
            showAlert(t("dates_required") || "Both start and end dates are required", "warning");
            return;
        }

        if (newEndDate.isBefore(newStartDate)) {
            showAlert(t("end_date_after_start") || "End date must be after start date", "warning");
            return;
        }

        try {
            await renewContractMutation.mutateAsync({
                id: renewContractId,
                newStartDate: newStartDate.toISOString(),
                newEndDate: newEndDate.toISOString(),
            });
            showToast(t("contract_renewed") || "Contract renewed successfully", "success");
            setShowRenewModal(false);
            setRenewContractId(null);
            setNewStartDate(null);
            setNewEndDate(null);
        } catch (error: any) {
            showAlert(error?.response?.data?.message || t("failed_to_renew_contract") || "Failed to renew contract", "error");
        }
    };

    const openRenewModal = (id: string) => {
        setRenewContractId(id);
        setNewStartDate(dayjs());
        setNewEndDate(null);
        setShowRenewModal(true);
    };

    const openCancelModal = (id: string) => {
        setCancelContractId(id);
        setCancelReason("");
        setShowCancelModal(true);
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
            active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
            renewed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        };

        return (
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status] || statusColors.draft}`}>{t(status) || status}</span>
        );
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
    };

    // Show loading state initially while contracts are being fetched
    if (contractsLoading && contracts.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="text-light-500 mx-auto mb-4 h-12 w-12 animate-spin" />
                    <p className="text-light-600 dark:text-dark-400">{t("loading_contracts") || "Loading contracts..."}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="btn-ghost"
                    >
                        <LocalizedArrow className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="page-title">{t("contracts") || "Contracts"}</h1>
                        <p className="text-light-600 dark:text-dark-400 mt-1">
                            {clientName} - {totalContracts} {t("contracts") || "contracts"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onCreateNew}
                    className="btn-primary"
                >
                    <Plus className="h-5 w-5" />
                    {t("create_new") || "Create New"}
                </button>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="flex gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="input"
                    >
                        <option value="">{t("all_statuses") || "All Statuses"}</option>
                        <option value="draft">{t("draft") || "Draft"}</option>
                        <option value="active">{t("active") || "Active"}</option>
                        <option value="completed">{t("completed") || "Completed"}</option>
                        <option value="cancelled">{t("cancelled") || "Cancelled"}</option>
                        <option value="renewed">{t("renewed") || "Renewed"}</option>
                    </select>
                </div>
            </div>

            {/* Contracts Table */}
            <div className="card">
                {contractsLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-light-500" />
                    </div>
                ) : contracts.length === 0 ? (
                    <div className="py-12 text-center">
                        <FileCheck className="text-light-400 dark:text-dark-600 mx-auto mb-4 h-16 w-16" />
                        <p className="text-light-600 dark:text-dark-400">{t("no_contracts_found") || "No contracts found"}</p>
                        <button
                            onClick={onCreateNew}
                            className="btn-primary mt-4"
                        >
                            {t("create_first_contract") || "Create your first contract"}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {contracts.map((contract: any) => (
                                <div
                                    key={contract._id}
                                    className="border-light-600 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50 rounded-lg border p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="mb-2 flex items-center gap-3">
                                                <h4 className="text-light-900 dark:text-dark-50 font-semibold">{contract.contractNumber}</h4>
                                                {getStatusBadge(contract.status)}
                                            </div>
                                            <div className="text-light-600 dark:text-dark-400 mb-2 space-y-1 text-sm">
                                                <p>
                                                    {t("start_date") || "Start"}: {formatDate(contract.startDate)} → {t("end_date") || "End"}:{" "}
                                                    {formatDate(contract.endDate)}
                                                </p>
                                                {contract.signedDate && (
                                                    <p>
                                                        {t("signed_date") || "Signed"}: {formatDate(contract.signedDate)}
                                                    </p>
                                                )}
                                                {contract.note && <p className="italic">{contract.note}</p>}
                                            </div>

                                            {/* Display Contract Terms */}
                                            {contract.terms && contract.terms.length > 0 && (
                                                <div className="bg-light-100 dark:bg-dark-800 mt-3 rounded p-3">
                                                    <h5 className="text-light-700 dark:text-dark-300 mb-2 text-sm font-medium">
                                                        {t("contract_terms") || "Contract Terms"}
                                                    </h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {contract.terms.map((termItem: any, idx: number) => {
                                                            let keyText = "";

                                                            if (termItem.isCustom) {
                                                                keyText = lang === "ar" ? termItem.customKeyAr : termItem.customKey;
                                                            } else {
                                                                const term = termItem.term;
                                                                if (term && typeof term === "object") {
                                                                    keyText = lang === "ar" ? term.keyAr : term.key;
                                                                }
                                                            }

                                                            return (
                                                                <span
                                                                    key={idx}
                                                                    className="bg-light-100 dark:bg-dark-700 text-light-700 dark:text-dark-200 inline-flex items-center rounded-full px-3 py-1 text-xs"
                                                                >
                                                                    {keyText || "..."}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(contract.status === "active" || contract.status === "renewed") && (
                                                <>
                                                    <button
                                                        onClick={() => handleCompleteContract(contract._id)}
                                                        className="btn-ghost text-primary-500"
                                                        title={t("complete_contract") || "Complete"}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}

                                            <button
                                                onClick={() => handleDownloadContract(contract._id)}
                                                className="btn-ghost"
                                                title={t("download_contract") || "Download"}
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => onEdit(contract)}
                                                className="btn-ghost"
                                                title={t("edit") || "Edit"}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteContract(contract._id)}
                                                className="btn-ghost text-danger-500"
                                                title={t("delete") || "Delete"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-gray-50 px-6 py-4 dark:bg-gray-700">
                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {t("page") || "Page"} {currentPage} {t("of") || "of"} {totalPages}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="rounded-lg border border-gray-300 p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-600"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Renew Modal */}
            {showRenewModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                    <div className="card w-full max-w-md">
                        <h3 className="card-title mb-4">{t("renew_contract") || "Renew Contract"}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="label">{t("new_start_date") || "New Start Date"}</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        value={newStartDate}
                                        onChange={(newValue) => setNewStartDate(newValue)}
                                        slotProps={{ textField: { fullWidth: true, size: "small" } }}
                                    />
                                </LocalizationProvider>
                            </div>
                            <div>
                                <label className="label">{t("new_end_date") || "New End Date"}</label>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        value={newEndDate}
                                        onChange={(newValue) => setNewEndDate(newValue)}
                                        minDate={newStartDate || undefined}
                                        slotProps={{ textField: { fullWidth: true, size: "small" } }}
                                    />
                                </LocalizationProvider>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleRenewContract}
                                disabled={renewContractMutation.isPending}
                                className="btn-primary flex-1"
                            >
                                {renewContractMutation.isPending ? <Loader2 className="mx-auto h-5 w-5 animate-spin text-light-500" /> : t("renew") || "Renew"}
                            </button>
                            <button
                                onClick={() => setShowRenewModal(false)}
                                disabled={renewContractMutation.isPending}
                                className="btn-ghost"
                            >
                                {t("cancel") || "Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
                    <div className="card w-full max-w-md">
                        <h3 className="card-title mb-4">{t("cancel_contract") || "Cancel Contract"}</h3>
                        <div>
                            <label className="label">
                                {t("reason") || "Reason"} ({t("optional") || "optional"})
                            </label>
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                                className="input resize-none"
                                placeholder={t("enter_cancellation_reason") || "Enter reason for cancellation..."}
                            />
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleCancelContract}
                                disabled={cancelContractMutation.isPending}
                                className="btn-primary bg-danger-500 hover:bg-danger-600 flex-1"
                            >
                                {cancelContractMutation.isPending ? (
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-light-500" />
                                ) : (
                                    t("cancel_contract") || "Cancel Contract"
                                )}
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={cancelContractMutation.isPending}
                                className="btn-ghost"
                            >
                                {t("close") || "Close"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreviewContract;
