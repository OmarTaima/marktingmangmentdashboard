import { useState, useEffect } from "react";
import { Loader2, FileCheck } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";
import { showAlert, showToast } from "@/utils/swal";
import { useCreateContract, useUpdateContract, useQuotations, useItems } from "@/hooks/queries";
import { getQuotationById } from "@/api/requests/quotationsService";
import type { Contract } from "@/api/requests/contractsService";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

interface CreateContractProps {
    clientId?: string;
    clientName: string;
    onBack: () => void;
    onSuccess?: (contractId?: string) => void;
    editContract?: Contract | null;
    quotationId?: string; // If converting from quotation
}

const CreateContract = ({ clientId, clientName, onBack, onSuccess, editContract, quotationId }: CreateContractProps) => {
    const { t, lang } = useLang();

    const createContractMutation = useCreateContract();
    const updateContractMutation = useUpdateContract();

    // Fetch quotations for this client
    const { data: quotationsResponse, isLoading: quotationsLoading } = useQuotations({ page: 1, limit: 100, clientId });
    const clientQuotations = quotationsResponse?.data || [];

    // Fetch items for detailed info
    const { data: itemsResponse, isLoading: itemsLoading } = useItems({ limit: 1000 });
    const items = itemsResponse?.data || [];

    const isSaving = createContractMutation.isPending || updateContractMutation.isPending;
    const isLoading = quotationsLoading || itemsLoading;

    // Form state
    const [contractTermsInput, setContractTermsInput] = useState<string>("");
    const [contractTermsList, setContractTermsList] = useState<string[]>(editContract?.contractTerms || []);
    const [contractBody, setContractBody] = useState<string>(editContract?.body || "");
    const [startDate, setStartDate] = useState<Dayjs | null>(editContract?.startDate ? dayjs(editContract.startDate) : null);
    const [endDate, setEndDate] = useState<Dayjs | null>(editContract?.endDate ? dayjs(editContract.endDate) : null);
    const [signedDate, setSignedDate] = useState<Dayjs | null>(editContract?.signedDate ? dayjs(editContract.signedDate) : null);
    const [contractNote, setContractNote] = useState<string>(editContract?.note || "");
    const [status, setStatus] = useState<"draft" | "active" | "completed" | "cancelled" | "renewed">(editContract?.status || "draft");
    const [selectedQuotationId, setSelectedQuotationId] = useState<string>(
        quotationId || (typeof editContract?.quotationId === "string" ? editContract.quotationId : editContract?.quotationId?._id || ""),
    );

    // Load quotation data if quotationId is provided, or generate default template
    useEffect(() => {
        if (quotationId && !editContract) {
            loadQuotationData(quotationId);
        } else if (!editContract && !contractBody) {
            // Generate default contract body template
            const defaultBody = generateDefaultContractBody();
            setContractBody(defaultBody);
        }
    }, [quotationId]);

    // Update contract body when dates change
    useEffect(() => {
        if (!selectedQuotationId && !editContract && (startDate || endDate)) {
            const defaultBody = generateDefaultContractBody();
            setContractBody(defaultBody);
        }
    }, [startDate, endDate]);

    const loadQuotationData = async (qId: string) => {
        try {
            const response = await getQuotationById(qId);
            const quotation = response.data;

            // Pre-fill contract body with quotation details
            const quotationSummary = generateQuotationSummary(quotation);
            setContractBody(quotationSummary);

            // Pre-fill dates
            if (quotation.validUntil) {
                setStartDate(dayjs());
                setEndDate(dayjs(quotation.validUntil));
            }
        } catch (error: any) {
            console.error("Failed to load quotation:", error);
        }
    };

    const generateDefaultContractBody = (): string => {
        const currency = lang === "ar" ? "ج.م" : "EGP";
        const today = dayjs().format("DD/MM/YYYY");
        
        let contract = "══════════════════════════════════════════════════════════════\n";
        contract += "                    SERVICE CONTRACT AGREEMENT\n";
        contract += "══════════════════════════════════════════════════════════════\n\n";
        
        contract += `Contract Number: [AUTO-GENERATED]\n`;
        contract += `Date: ${today}\n\n`;
        
        contract += "PARTIES:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += `Client Name: ${clientName}\n`;
        contract += `Service Provider: [Your Company Name]\n\n`;
        
        contract += "SCOPE OF SERVICES:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += "[Please define the services and deliverables to be provided under this contract]\n\n";
        
        contract += "FINANCIAL TERMS:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += `Total Contract Value: [Amount] ${currency}\n`;
        contract += "Payment Terms: [Define payment schedule]\n";
        contract += "Payment Method: [Specify payment method]\n\n";
        
        contract += "CONTRACT DURATION:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += `Start Date: ${startDate ? startDate.format("DD/MM/YYYY") : "[To be specified]"}\n`;
        contract += `End Date: ${endDate ? endDate.format("DD/MM/YYYY") : "[To be specified]"}\n`;
        const durationText = startDate && endDate ? `Duration: ${endDate.diff(startDate, 'month')} months` : "Duration: [To be calculated]";
        contract += `${durationText}\n\n`;
        
        contract += "TERMS AND CONDITIONS:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += "1. Service Delivery: The service provider agrees to deliver all services as outlined in the scope of work.\n";
        contract += "2. Client Obligations: The client agrees to provide timely feedback, necessary resources, and access as required.\n";
        contract += "3. Payment Terms: Payment shall be made according to the schedule specified in the financial terms section.\n";
        contract += "4. Intellectual Property: All deliverables remain the property of the service provider until full payment is received.\n";
        contract += "5. Confidentiality: Both parties agree to maintain confidentiality of all proprietary information.\n";
        contract += "6. Termination: Either party may terminate this contract with 30 days written notice.\n";
        contract += "7. Liability: The service provider's liability is limited to the total contract value.\n";
        contract += "8. Modifications: Any changes to this contract must be agreed upon in writing by both parties.\n\n";
        
        contract += "DELIVERABLES:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += "[List all expected deliverables with timelines]\n\n";
        
        contract += "SIGNATURES:\n";
        contract += "──────────────────────────────────────────────────────────────\n\n";
        contract += "Service Provider:\n";
        contract += "Name: _______________________\n";
        contract += "Signature: __________________\n";
        contract += `Date: ${today}\n\n`;
        contract += "Client:\n";
        contract += `Name: ${clientName}\n`;
        contract += "Signature: __________________\n";
        contract += `Date: ${today}\n\n`;
        contract += "══════════════════════════════════════════════════════════════\n";
        
        return contract;
    };

    const generateQuotationSummary = (quotation: any): string => {
        const currency = lang === "ar" ? "ج.م" : "EGP";
        const today = dayjs().format("DD/MM/YYYY");
        
        let contract = "══════════════════════════════════════════════════════════════\n";
        contract += "                    SERVICE CONTRACT AGREEMENT\n";
        contract += "══════════════════════════════════════════════════════════════\n\n";
        
        contract += `Contract Number: ${quotation.quotationNumber || "[AUTO-GENERATED]"}\n`;
        contract += `Date: ${today}\n\n`;
        
        contract += "PARTIES:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += `Client Name: ${quotation.clientName || clientName}\n`;
        contract += `Service Provider: [Your Company Name]\n\n`;
        
        contract += "SCOPE OF SERVICES:\n";
        contract += "──────────────────────────────────────────────────────────────\n\n";

        if (quotation.packages && quotation.packages.length > 0) {
            contract += "Services Included:\n\n";
            quotation.packages.forEach((pkg: any, pkgIndex: number) => {
                const pkgObj = typeof pkg === "object" ? pkg : {};
                const pkgName = pkgObj.nameEn || pkgObj.name || pkgObj.ar || `Package ${pkgIndex + 1}`;
                const pkgPrice = pkgObj.price || 0;
                
                contract += `${pkgIndex + 1}. ${pkgName} - ${pkgPrice.toFixed(2)} ${currency}\n`;
                
                // Add package items if available
                if (pkgObj.items && Array.isArray(pkgObj.items) && pkgObj.items.length > 0) {
                    pkgObj.items.forEach((it: any) => {
                        const itemObj = (it && (it.item || it)) || {};
                        let itemName = itemObj?.name || itemObj?.nameEn || itemObj?.nameAr || "Item";
                        const quantity = typeof it?.quantity !== "undefined" ? it.quantity : itemObj?.quantity;
                        
                        // Try to find item details from items list
                        if ((!itemName || itemName === "(item)") && items.length > 0) {
                            const itemId = typeof itemObj === "string" ? itemObj : itemObj?._id || itemObj?.id;
                            if (itemId) {
                                const foundItem = items.find((i: any) => String(i._id) === String(itemId) || String(i.id) === String(itemId));
                                if (foundItem) {
                                    itemName = (foundItem as any).name || (foundItem as any).nameEn || (foundItem as any).nameAr || itemName;
                                }
                            }
                        }
                        
                        const qtyText = typeof quantity !== "undefined" ? ` (Qty: ${quantity})` : "";
                        contract += `   • ${itemName}${qtyText}\n`;
                    });
                }
                contract += "\n";
            });
        }

        if (quotation.servicesPricing && quotation.servicesPricing.length > 0) {
            if (!quotation.packages || quotation.packages.length === 0) {
                contract += "Services Included:\n\n";
            }
            quotation.servicesPricing.forEach((sp: any, idx: number) => {
                const service = sp.service;
                if (!service) return;
                const serviceName = (lang === "ar" ? service.ar : service.en) || "Service";
                const price = sp.customPrice || service.price || 0;
                contract += `${idx + 1}. ${serviceName} - ${price.toFixed(2)} ${currency}\n`;
            });
            contract += "\n";
        }

        if (quotation.customServices && quotation.customServices.length > 0) {
            contract += "Custom Services:\n\n";
            quotation.customServices.forEach((cs: any, idx: number) => {
                const serviceName = lang === "ar" ? cs.ar : cs.en;
                let finalPrice = cs.price;
                let priceDetail = "";
                
                if (cs.discount && cs.discount > 0) {
                    if (cs.discountType === "percentage") {
                        const discountAmt = (cs.price * cs.discount) / 100;
                        finalPrice = cs.price - discountAmt;
                        priceDetail = ` (Original: ${cs.price.toFixed(2)} ${currency}, Discount: ${cs.discount}%)`;
                    } else {
                        finalPrice = cs.price - cs.discount;
                        priceDetail = ` (Discount: ${cs.discount.toFixed(2)} ${currency})`;
                    }
                }
                
                contract += `${idx + 1}. ${serviceName} - ${finalPrice.toFixed(2)} ${currency}${priceDetail}\n`;
            });
            contract += "\n";
        }

        contract += "FINANCIAL TERMS:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        
        const subtotal = quotation.subtotal || quotation.total || 0;
        contract += `Subtotal: ${subtotal.toFixed(2)} ${currency}\n`;
        
        if (quotation.discount && quotation.discount > 0) {
            const discountType = quotation.discountType === "percentage" ? "%" : currency;
            contract += `Discount: ${quotation.discount} ${discountType}\n`;
        }
        
        contract += `TOTAL AMOUNT: ${(quotation.total || 0).toFixed(2)} ${currency}\n\n`;
        
        contract += "Payment Terms: [To be defined]\n";
        contract += "Payment Schedule: [To be defined]\n\n";
        
        contract += "CONTRACT DURATION:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += `Start Date: [To be filled]\n`;
        contract += `End Date: [To be filled]\n`;
        if (quotation.validUntil) {
            contract += `Valid Until: ${dayjs(quotation.validUntil).format("DD/MM/YYYY")}\n`;
        }
        contract += "\n";
        
        contract += "TERMS AND CONDITIONS:\n";
        contract += "──────────────────────────────────────────────────────────────\n";
        contract += "1. The service provider agrees to deliver the services outlined above.\n";
        contract += "2. The client agrees to provide necessary cooperation and resources.\n";
        contract += "3. All deliverables remain the property of the service provider until full payment.\n";
        contract += "4. Either party may terminate this contract with [X] days written notice.\n";
        contract += "5. Any modifications to this contract must be agreed upon in writing.\n\n";
        
        if (quotation.note) {
            contract += "ADDITIONAL NOTES:\n";
            contract += "──────────────────────────────────────────────────────────────\n";
            contract += `${quotation.note}\n\n`;
        }
        
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

    const handleSave = async () => {
        if (!clientId) {
            showAlert(t("client_required") || "Client is required", "warning");
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

        const contractData = {
            clientId,
            quotationId: selectedQuotationId || undefined,
            contractTerms: contractTermsList.length > 0 ? contractTermsList : undefined,
            body: contractBody.trim() || undefined,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            signedDate: signedDate ? signedDate.toISOString() : undefined,
            status,
            note: contractNote.trim() || undefined,
        };

        try {
            if (editContract) {
                await updateContractMutation.mutateAsync({
                    id: editContract._id,
                    data: contractData,
                });
                showToast(t("contract_updated") || "Contract updated successfully", "success");
            } else {
                const result = await createContractMutation.mutateAsync(contractData);
                showToast(t("contract_created") || "Contract created successfully", "success");
                if (onSuccess) {
                    onSuccess(result._id);
                }
            }
            onBack();
        } catch (error: any) {
            const errorMsg = error?.response?.data?.message || error?.message || t("failed_to_save_contract") || "Failed to save contract";
            showAlert(errorMsg, "error");
        }
    };

    // Show loading state while data is being fetched
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="text-primary-500 mx-auto mb-4 h-12 w-12 animate-spin" />
                    <p className="text-light-600 dark:text-dark-400">{t("loading_contract_data") || "Loading contract data..."}</p>
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
                        <h1 className="page-title">
                            {editContract ? t("edit_contract") || "Edit Contract" : t("create_contract") || "Create Contract"}
                        </h1>
                        <p className="text-light-600 dark:text-dark-400 mt-1">
                            {t("for_client") || "For"}: {clientName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="card">
                <div className="space-y-6">
                    {/* Quotation Selector */}
                    {clientQuotations.length > 0 && !editContract && (
                        <div>
                            <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">
                                {t("select_quotation") || "Select Quotation (Optional)"}
                            </label>
                            <select
                                value={selectedQuotationId}
                                onChange={(e) => {
                                    const qId = e.target.value;
                                    setSelectedQuotationId(qId);
                                    if (qId) {
                                        loadQuotationData(qId);
                                    } else {
                                        const defaultBody = generateDefaultContractBody();
                                        setContractBody(defaultBody);
                                    }
                                }}
                                className="border-light-300 dark:border-dark-600 bg-light-50 dark:bg-dark-800 text-light-900 dark:text-dark-50 w-full rounded-lg border px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            >
                                <option value="">{t("none") || "None - Create New"}</option>
                                {clientQuotations.map((q: any) => (
                                    <option key={q._id} value={q._id}>
                                        {q.quotationNumber || `Quotation ${q._id.slice(-6)}`} - {(q.total || 0).toFixed(2)} {lang === "ar" ? "ج.م" : "EGP"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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
                            <label className="text-light-700 dark:text-dark-300 mb-2 block text-sm font-medium">
                                {t("signed_date") || "Signed Date"}
                            </label>
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
                            onClick={handleSave}
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
                                    {editContract ? t("update_contract") || "Update Contract" : t("create_contract") || "Create Contract"}
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

export default CreateContract;
