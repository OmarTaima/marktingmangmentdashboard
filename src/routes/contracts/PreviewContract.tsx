import { useState, useEffect } from "react";
import { Loader2, Trash2, Edit2, FileCheck, ChevronLeft, ChevronRight, Plus, FileSignature, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { showAlert, showConfirm, showToast } from "@/utils/swal";
import { useContracts, useDeleteContract, useSignContract, useCompleteContract, useCancelContract, useRenewContract } from "@/hooks/queries";
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
                    <Loader2 className="text-primary-500 mx-auto mb-4 h-12 w-12 animate-spin" />
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
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                            {t("contract_number") || "Contract #"}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                            {t("status") || "Status"}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                            {t("start_date") || "Start Date"}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                            {t("end_date") || "End Date"}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                            {t("signed_date") || "Signed"}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                            {t("actions") || "Actions"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {contracts.map((contract: any) => (
                                        <tr
                                            key={contract._id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{contract.contractNumber}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(contract.status)}</td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                {formatDate(contract.startDate)}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                {formatDate(contract.endDate)}
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                {formatDate(contract.signedDate)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-2">
                                                    {contract.status === "draft" && (
                                                        <button
                                                            onClick={() => handleSignContract(contract._id)}
                                                            className="btn-ghost text-success-500"
                                                            title={t("sign_contract") || "Sign Contract"}
                                                        >
                                                            <FileSignature className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {(contract.status === "active" || contract.status === "renewed") && (
                                                        <>
                                                            <button
                                                                onClick={() => handleCompleteContract(contract._id)}
                                                                className="btn-ghost text-primary-500"
                                                                title={t("complete_contract") || "Complete"}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openRenewModal(contract._id)}
                                                                className="rounded-lg p-2 text-purple-600 transition-colors hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20"
                                                                title={t("renew_contract") || "Renew"}
                                                            >
                                                                <RefreshCw className="h-5 w-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {contract.status !== "cancelled" && contract.status !== "completed" && (
                                                        <button
                                                            onClick={() => openCancelModal(contract._id)}
                                                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                                            title={t("cancel_contract") || "Cancel"}
                                                        >
                                                            <XCircle className="h-5 w-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => onEdit(contract)}
                                                        className="rounded-lg p-2 text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/20"
                                                        title={t("edit") || "Edit"}
                                                    >
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteContract(contract._id)}
                                                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                                                        title={t("delete") || "Delete"}
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                {renewContractMutation.isPending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : t("renew") || "Renew"}
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
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
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
