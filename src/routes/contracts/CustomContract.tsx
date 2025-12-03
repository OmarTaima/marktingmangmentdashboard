import { useState, useEffect } from "react";
import { Loader2, FileCheck } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { showAlert, showToast } from "@/utils/swal";
import { useCreateContract } from "@/hooks/queries";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

interface CustomContractProps {
    onBack: () => void;
    onSuccess?: () => void;
}

const CustomContract = ({ onBack, onSuccess }: CustomContractProps) => {
    const { t, lang } = useLang();

    const createContractMutation = useCreateContract();
    const isSaving = createContractMutation.isPending;

    // Form state
    const [clientName, setClientName] = useState<string>("");
    const [contractTermsInput, setContractTermsInput] = useState<string>("");
    const [contractTermsList, setContractTermsList] = useState<string[]>([]);
    const [contractBody, setContractBody] = useState<string>("");
    const [startDate, setStartDate] = useState<Dayjs | null>(null);
    const [endDate, setEndDate] = useState<Dayjs | null>(null);
    const [signedDate, setSignedDate] = useState<Dayjs | null>(null);
    const [contractNote, setContractNote] = useState<string>("");
    const [status, setStatus] = useState<"draft" | "active" | "completed" | "cancelled" | "renewed">("draft");

    // Auto-generate contract body when client name or dates change
    useEffect(() => {
        if (clientName.trim()) {
            const generatedBody = generateContractBody();
            setContractBody(generatedBody);
        }
    }, [clientName, startDate, endDate]);

    const generateContractBody = (): string => {
        const currency = lang === "ar" ? "ج.م" : "EGP";
        const today = dayjs().format("DD/MM/YYYY");
        
        let contract = "══════════════════════════════════════════════════════════════\n";
        contract += "                    SERVICE CONTRACT AGREEMENT\n";
        contract += "══════════════════════════════════════════════════════════════\n\n";
        
        contract += `Contract Number: [AUTO-GENERATED]\n`;
        contract += `Date: ${today}\n\n`;
        
        contract += "PARTIES:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += `Client Name: ${clientName.trim() || "[To be filled]"}
`;
        contract += `Service Provider: [Your Company Name]\n\n`;
        
        contract += "SCOPE OF SERVICES:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += "[Please define the services to be provided]\n\n";
        
        contract += "FINANCIAL TERMS:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += `Total Amount: [To be defined] ${currency}\n`;
        contract += "Payment Terms: [To be defined]\n";
        contract += "Payment Schedule: [To be defined]\n\n";
        
        contract += "CONTRACT DURATION:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += `Start Date: ${startDate ? startDate.format("DD/MM/YYYY") : "[To be filled]"}\n`;
        contract += `End Date: ${endDate ? endDate.format("DD/MM/YYYY") : "[To be filled]"}\n\n`;
        
        contract += "TERMS AND CONDITIONS:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += "1. The service provider agrees to deliver the services outlined above.\n";
        contract += "2. The client agrees to provide necessary cooperation and resources.\n";
        contract += "3. All deliverables remain the property of the service provider until full payment.\n";
        contract += "4. Either party may terminate this contract with [X] days written notice.\n";
        contract += "5. Any modifications to this contract must be agreed upon in writing.\n\n";
        
        contract += "SIGNATURES:\n";
        contract += "──────────────────────────────────────────────────────────────\n\n";
        contract += "Service Provider:\n";
        contract += "Name: _______________________\n";
        contract += "Signature: __________________\n";
        contract += "Date: _______________________\n\n";
        contract += "Client:\n";
        contract += "Name: _______________________\n";
        contract += "Signature: __________________\n";
        contract += "Date: _______________________\n\n";
        contract += "══════════════════════════════════════════════════════════════\n";
        
        return contract;
    };

    const addContractTerm = () => {
        const term = contractTermsInput.trim();
        if (!term) return;

        if (contractTermsList.includes(term)) {
            showAlert(t("term_already_exists") || "This term already exists", "warning");
            return;
        }

        setContractTermsList([...contractTermsList, term]);
        setContractTermsInput("");
    };

    const removeTerm = (index: number) => {
        setContractTermsList(contractTermsList.filter((_, i) => i !== index));
    };

    const handleCreate = async () => {
        if (!clientName.trim()) {
            showAlert(t("client_name_required") || "Client name is required", "warning");
            return;
        }

        if (!startDate || !endDate) {
            showAlert(t("dates_required") || "Start and end dates are required", "warning");
            return;
        }

        if (endDate.isBefore(startDate)) {
            showAlert(t("end_date_after_start") || "End date must be after start date", "warning");
            return;
        }

        // For custom contracts without a real client, we need to create a placeholder
        // Note: This depends on your backend implementation
        // You may need to adjust this based on how your backend handles custom contracts
        const contractData = {
            clientId: "custom", // Placeholder - adjust based on backend
            customClientName: clientName.trim(), // Custom field to store client name
            contractTerms: contractTermsList.length > 0 ? contractTermsList : undefined,
            body: contractBody.trim() || undefined,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            signedDate: signedDate ? signedDate.toISOString() : undefined,
            status,
            note: contractNote.trim() || undefined,
        };

        try {
            await createContractMutation.mutateAsync(contractData as any);
            showToast(t("contract_created") || "Contract created successfully", "success");
            if (onSuccess) {
                onSuccess();
            }
            onBack();
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || t("failed_to_save_contract") || "Failed to save contract";
            showAlert(errorMsg, "error");
        }
    };

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
                        <h1 className="page-title">{t("create_custom_contract") || "Create Custom Contract"}</h1>
                        <p className="text-light-600 dark:text-dark-400 mt-1">{t("for_client_without_account") || "For client without account"}</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="card">
                <div className="space-y-6">
                    {/* Client Name */}
                    <div>
                        <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">{t("client_name") || "Client Name"} *</label>
                        <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="border-light-300 dark:border-dark-600 bg-light-50 dark:bg-dark-800 text-light-900 dark:text-dark-50 w-full rounded-lg border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            placeholder={t("enter_client_name") || "Enter client name..."}
                        />
                    </div>

                    {/* Dates Section */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                            <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">{t("start_date") || "Start Date"} *</label>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={startDate}
                                    onChange={(newValue) => setStartDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </div>

                        <div>
                            <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">{t("end_date") || "End Date"} *</label>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={endDate}
                                    onChange={(newValue) => setEndDate(newValue)}
                                    minDate={startDate || undefined}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </div>

                        <div>
                            <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">{t("signed_date") || "Signed Date"}</label>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={signedDate}
                                    onChange={(newValue) => setSignedDate(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">{t("status") || "Status"}</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="border-light-300 dark:border-dark-600 bg-light-50 dark:bg-dark-800 text-light-900 dark:text-dark-50 w-full rounded-lg border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        >
                            <option value="draft">{t("draft") || "Draft"}</option>
                            <option value="active">{t("active") || "Active"}</option>
                            <option value="completed">{t("completed") || "Completed"}</option>
                            <option value="cancelled">{t("cancelled") || "Cancelled"}</option>
                            <option value="renewed">{t("renewed") || "Renewed"}</option>
                        </select>
                    </div>

                    {/* Contract Body */}
                    <div>
                        <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">{t("contract_body") || "Contract Body"}</label>
                        <textarea
                            value={contractBody}
                            onChange={(e) => setContractBody(e.target.value)}
                            rows={12}
                            className="border-light-300 dark:border-dark-600 bg-light-50 dark:bg-dark-800 text-light-900 dark:text-dark-50 w-full resize-none rounded-lg border px-4 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            placeholder={t("enter_contract_body") || "Enter the full contract text..."}
                        />
                    </div>

                    {/* Contract Terms */}
                    <div>
                        <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">{t("contract_terms") || "Contract Terms"}</label>
                        <div className="mb-3 flex gap-2">
                            <input
                                type="text"
                                value={contractTermsInput}
                                onChange={(e) => setContractTermsInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addContractTerm()}
                                className="border-light-300 dark:border-dark-600 bg-light-50 dark:bg-dark-800 text-light-900 dark:text-dark-50 flex-1 rounded-lg border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                placeholder={t("add_contract_term") || "Add a contract term..."}
                            />
                            <button
                                onClick={addContractTerm}
                                className="btn-primary"
                            >
                                {t("add") || "Add"}
                            </button>
                        </div>

                        {contractTermsList.length > 0 && (
                            <div className="space-y-2">
                                {contractTermsList.map((term, index) => (
                                    <div
                                        key={index}
                                        className="border-light-600 dark:border-dark-700 bg-light-50 dark:bg-dark-700 flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <span className="text-light-900 dark:text-dark-50">{term}</span>
                                        <button
                                            onClick={() => removeTerm(index)}
                                            className="text-danger-500 hover:text-danger-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">{t("notes") || "Notes"}</label>
                        <textarea
                            value={contractNote}
                            onChange={(e) => setContractNote(e.target.value)}
                            rows={3}
                            className="border-light-300 dark:border-dark-600 bg-light-50 dark:bg-dark-800 text-light-900 dark:text-dark-50 w-full resize-none rounded-lg border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            placeholder={t("add_notes") || "Add any additional notes..."}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={handleCreate}
                            disabled={isSaving}
                            className="btn-primary flex-1"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {t("saving") || "Saving..."}
                                </>
                            ) : (
                                <>
                                    <FileCheck className="h-5 w-5" />
                                    {t("create_contract") || "Create Contract"}
                                </>
                            )}
                        </button>
                        <button
                            onClick={onBack}
                            disabled={isSaving}
                            className="btn-ghost"
                        >
                            {t("cancel") || "Cancel"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomContract;
