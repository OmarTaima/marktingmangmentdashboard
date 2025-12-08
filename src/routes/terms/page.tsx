import { useState, KeyboardEvent } from "react";
import { Plus, Edit2, Trash2, Check, X, Loader2, Search } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { showConfirm } from "@/utils/swal";
import { useContractTerms, useCreateContractTerm, useUpdateContractTerm, useDeleteContractTerm } from "@/hooks/queries/useContractTermsQuery";
import type { ContractTerm } from "@/api/requests/termsService";

const termsPage = () => {
    const { t, lang } = useLang();
    const [inputKey, setInputKey] = useState<string>("");
    const [inputValue, setInputValue] = useState<string>("");
    const [inputKeyAr, setInputKeyAr] = useState<string>("");
    const [inputValueAr, setInputValueAr] = useState<string>("");
    const [editingId, setEditingId] = useState<string>("");
    const [editingKey, setEditingKey] = useState<string>("");
    const [editingValue, setEditingValue] = useState<string>("");
    const [editingKeyAr, setEditingKeyAr] = useState<string>("");
    const [editingValueAr, setEditingValueAr] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [error, setError] = useState<string>("");

    // React Query hooks
    const { data: termsResponse, isLoading } = useContractTerms({
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
    });
    const terms = termsResponse?.data || [];
    const totalPages = termsResponse?.meta.totalPages || 1;

    const createTermMutation = useCreateContractTerm();
    const updateTermMutation = useUpdateContractTerm();
    const deleteTermMutation = useDeleteContractTerm();

    const isSaving = createTermMutation.isPending || updateTermMutation.isPending;

    const handleAdd = () => {
        const key = (inputKey || "").trim();
        const value = (inputValue || "").trim();
        const keyAr = (inputKeyAr || "").trim();
        const valueAr = (inputValueAr || "").trim();

        if (!key || !keyAr) {
            setError(t("term_key_required") || "Term key (both languages) is required");
            return;
        }

        setError("");

        const payload = {
            key,
            keyAr,
            value: value || undefined,
            valueAr: valueAr || undefined,
        };

        // Use mutate (not mutateAsync) so we don't await the server and the
        // optimistic update in the hook can show the term immediately.
        createTermMutation.mutate(payload, {
            onError: (e: any) => {
                setError(e?.response?.data?.message || "Failed to create term");
            },
        });

        // Clear inputs immediately so the form feels responsive.
        setInputKey("");
        setInputKeyAr("");
        setInputValue("");
        setInputValueAr("");
    };

    const handleCreateKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
        }
    };

    const handleEditKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (editingId) saveEdit(editingId);
        }
    };

    const startEdit = (term: ContractTerm) => {
        setEditingId(term._id);
        setEditingKey(term.key || "");
        setEditingKeyAr(term.keyAr || "");
        setEditingValue(term.value || "");
        setEditingValueAr(term.valueAr || "");
    };

    const saveEdit = async (id: string) => {
        const key = (editingKey || "").trim();
        const value = (editingValue || "").trim();
        const keyAr = (editingKeyAr || "").trim();
        const valueAr = (editingValueAr || "").trim();

        if (!key || !keyAr) {
            setError(t("term_key_required") || "Term key (both languages) is required");
            return;
        }

        try {
            setError("");
            await updateTermMutation.mutateAsync({
                id,
                data: {
                    key,
                    keyAr,
                    value: value || undefined,
                    valueAr: valueAr || undefined,
                },
            });
            setEditingId("");
            setEditingKey("");
            setEditingKeyAr("");
            setEditingValue("");
            setEditingValueAr("");
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to update term");
        }
    };

    const cancelEdit = () => {
        setEditingId("");
        setEditingKey("");
        setEditingKeyAr("");
        setEditingValue("");
        setEditingValueAr("");
    };

    const remove = async (term: ContractTerm) => {
        const confirmed = await showConfirm(t("confirm_delete_term") || "Delete this term?", t("yes") || "Yes", t("no") || "No");
        if (!confirmed) return;

        try {
            setError("");
            await deleteTermMutation.mutateAsync(term._id);
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to delete term");
        }
    };

    const filteredTerms = terms;

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("Contract Terms") || "Contract Terms"}</h1>
                    <p className="text-light-600 dark:text-dark-400">
                        {t("manage_terms_sub") || "Manage contract terms and conditions for your agreements."}
                    </p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            <div className="card">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="card-title">{t("manage_terms") || "Manage Terms"}</h2>
                    <div className="relative">
                        <Search className="text-light-600 dark:text-dark-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t("search_terms") || "Search terms..."}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-64 rounded-lg border bg-white py-2 pr-3 pl-10 text-sm transition-colors focus:outline-none"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="text-light-500 dark:text-light-500 h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3">
                            {filteredTerms.length > 0 ? (
                                filteredTerms.map((term) => {
                                    return (
                                        <div
                                            key={term._id}
                                            className="border-light-600 text-light-900 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-50 flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                                        >
                                            <div className="flex w-full items-center gap-3">
                                                {editingId === term._id ? (
                                                    <div className="flex w-full gap-2">
                                                        <input
                                                            value={editingKey}
                                                            onChange={(e) => setEditingKey(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                            placeholder={t("term_key") || "Term Key"}
                                                        />
                                                        <input
                                                            value={editingKeyAr}
                                                            onChange={(e) => setEditingKeyAr(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                            placeholder={t("term_key_ar") || "المفتاح (بالعربية)"}
                                                        />
                                                        <input
                                                            value={editingValue}
                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none"
                                                            placeholder={t("term_value") || "Value"}
                                                        />
                                                        <input
                                                            value={editingValueAr}
                                                            onChange={(e) => setEditingValueAr(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none"
                                                            placeholder={t("term_value_ar") || "القيمة (بالعربية)"}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex w-full">
                                                        <div className="flex w-full items-center justify-between">
                                                            <div className="flex flex-col">
                                                                {(() => {
                                                                    const displayKey =
                                                                        lang === "ar" ? term.keyAr || term.key : term.key || term.keyAr;
                                                                    const displayValue =
                                                                        lang === "ar" ? term.valueAr || term.value : term.value || term.valueAr;
                                                                    return (
                                                                        <>
                                                                            <span className="text-light-900 dark:text-dark-50 text-sm font-semibold">
                                                                                {displayKey}
                                                                            </span>
                                                                            {displayValue && (
                                                                                <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                                                    {displayValue}
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {editingId === term._id ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveEdit(term._id)}
                                                            disabled={isSaving}
                                                            className="btn-ghost flex items-center gap-2"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="btn-ghost flex items-center gap-2"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <>
                                                            <button
                                                                onClick={() => startEdit(term)}
                                                                className="btn-ghost flex items-center gap-2"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => remove(term)}
                                                                className="btn-ghost text-danger-500 flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-light-600">{t("no_terms_defined") || "No terms defined yet."}</p>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="btn-ghost px-3 py-1 disabled:opacity-50"
                                >
                                    {t("previous") || "Previous"}
                                </button>
                                <span className="text-light-600 dark:text-dark-400 text-sm">
                                    {t("page")} {currentPage} {t("of")} {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="btn-ghost px-3 py-1 disabled:opacity-50"
                                >
                                    {t("next") || "Next"}
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div className="mt-4 flex gap-2">
                    <input
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={t("term_key") || "Term Key (e.g., Payment)"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <input
                        value={inputKeyAr}
                        onChange={(e) => setInputKeyAr(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={t("term_key_ar") || "المفتاح (مثال: الدفع)"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={t("term_value") || "Value (e.g., 50% advance)"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <input
                        value={inputValueAr}
                        onChange={(e) => setInputValueAr(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={t("term_value_ar") || "القيمة (مثال: 50% مقدم)"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={isSaving}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2
                                size={14}
                                className="text-light-500 animate-spin"
                            />
                        ) : (
                            <Plus size={14} />
                        )}
                        {t("add")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default termsPage;
