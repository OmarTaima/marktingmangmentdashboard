import { useState, KeyboardEvent } from "react";
import { Plus, Edit2, Trash2, Check, X, Loader2, Search } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { showConfirm } from "@/utils/swal";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from "@/hooks/queries";
import type { Item } from "@/api/requests/itemsService";

const ItemsPage = () => {
    const { t, lang } = useLang();
    const tr = (key: string, fallback: string) => {
        const value = t(key);
        return !value || value === key ? fallback : value;
    };
    const [inputName, setInputName] = useState<string>("");
    const [inputDescription, setInputDescription] = useState<string>("");
    const [inputNameAr, setInputNameAr] = useState<string>("");
    const [inputDescriptionAr, setInputDescriptionAr] = useState<string>("");
    const [editingId, setEditingId] = useState<string>("");
    const [editingName, setEditingName] = useState<string>("");
    const [editingDescription, setEditingDescription] = useState<string>("");
    const [editingNameAr, setEditingNameAr] = useState<string>("");
    const [editingDescriptionAr, setEditingDescriptionAr] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [error, setError] = useState<string>("");

    // React Query hooks
    const { data: itemsResponse, isLoading } = useItems({
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
    });
    const items = itemsResponse?.data || [];
    const totalPages = itemsResponse?.meta.totalPages || 1;

    const createItemMutation = useCreateItem();
    const updateItemMutation = useUpdateItem();
    const deleteItemMutation = useDeleteItem();

    const isSaving = createItemMutation.isPending || updateItemMutation.isPending;

    const handleAdd = () => {
        const name = (inputName || "").trim();
        const desc = (inputDescription || "").trim();
        const nameAr = (inputNameAr || "").trim();
        const descAr = (inputDescriptionAr || "").trim();

        if (!name) {
            setError(t("item_name_required") || "Item name is required");
            return;
        }

        setError("");

        const payload = {
            name,
            ar: nameAr || undefined,
            description: desc || undefined,
            descriptionAr: descAr || undefined,
        };

        // Use mutate (not mutateAsync) so we don't await the server and the
        // optimistic update in the hook can show the item immediately.
        createItemMutation.mutate(payload, {
            onError: (e: any) => {
                setError(e?.response?.data?.message || "Failed to create item");
            },
        });

        // Clear inputs immediately so the form feels responsive.
        setInputName("");
        setInputNameAr("");
        setInputDescription("");
        setInputDescriptionAr("");
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

    const startEdit = (item: Item) => {
        setEditingId(item._id);
        setEditingName(item.name || "");
        setEditingNameAr((item as any).ar || "");
        setEditingDescription(item.description || "");
        setEditingDescriptionAr((item as any).descriptionAr || "");
    };

    const saveEdit = async (id: string) => {
        const name = (editingName || "").trim();
        const desc = (editingDescription || "").trim();
        const nameAr = (editingNameAr || "").trim();
        const descAr = (editingDescriptionAr || "").trim();

        if (!name) {
            setError(t("item_name_required") || "Item name is required");
            return;
        }

        try {
            setError("");
            await updateItemMutation.mutateAsync({
                id,
                data: {
                    name,
                    ar: nameAr || undefined,
                    description: desc || undefined,
                    descriptionAr: descAr || undefined,
                },
            });
            setEditingId("");
            setEditingName("");
            setEditingNameAr("");
            setEditingDescription("");
            setEditingDescriptionAr("");
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to update item");
        }
    };

    const cancelEdit = () => {
        setEditingId("");
        setEditingName("");
        setEditingNameAr("");
        setEditingDescription("");
        setEditingDescriptionAr("");
    };

    const remove = async (item: Item) => {
        const confirmed = await showConfirm(t("confirm_delete_item") || "Delete this item?", t("yes") || "Yes", t("no") || "No");
        if (!confirmed) return;

        try {
            setError("");
            await deleteItemMutation.mutateAsync(item._id);
        } catch (e: any) {
            setError(e.response?.data?.message || "Failed to delete item");
        }
    };

    const filteredItems = items;

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
                <div className="absolute -top-20 -right-10 h-52 w-52 rounded-full bg-light-400/20 blur-3xl dark:bg-light-500/10" />
                <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-secdark-700/15 blur-3xl dark:bg-secdark-700/20" />
                <div className="relative flex flex-col gap-2">
                    <span className="inline-flex w-fit items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                        Inventory Studio
                    </span>
                    <h1 className="title text-2xl sm:text-3xl">{tr("Items", "Items")}</h1>
                    <p className="text-light-600 dark:text-dark-300 text-sm sm:text-base">
                        {tr("manage_items_sub", "Manage available items shown throughout the app.")}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("total_items", "Total Items")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{items.length}</p>
                </div>
               
        
            </section>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            <div className="rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-light-900 dark:text-dark-50 text-lg font-semibold">{tr("manage_items", "Manage Items")}</h2>
                    <div className="relative">
                        <Search className="text-light-600 dark:text-dark-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={tr("search_items", "Search items...")}
                            className="input w-64 rounded-xl pr-3 pl-10"
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
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => {
                                    return (
                                        <div
                                            key={item._id}
                                            className="group flex items-center justify-between gap-3 rounded-2xl border border-light-200/80 bg-white px-4 py-3 text-light-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-dark-700/80 dark:bg-dark-800 dark:text-dark-50"
                                        >
                                            <div className="flex w-full items-center gap-3">
                                                {editingId === item._id ? (
                                                    <div className="flex w-full gap-2">
                                                        <input
                                                            value={editingName}
                                                            onChange={(e) => setEditingName(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="input flex-1"
                                                            placeholder={tr("item_name", "Item Name")}
                                                        />
                                                        <input
                                                            value={editingNameAr}
                                                            onChange={(e) => setEditingNameAr(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="input flex-1"
                                                            placeholder={tr("item_name_ar", "اسم العنصر (بالعربية)")}
                                                        />
                                                        <input
                                                            value={editingDescription}
                                                            onChange={(e) => setEditingDescription(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="input flex-1"
                                                            placeholder={tr("item_description", "Description")}
                                                        />
                                                        <input
                                                            value={editingDescriptionAr}
                                                            onChange={(e) => setEditingDescriptionAr(e.target.value)}
                                                            onKeyDown={handleEditKeyDown}
                                                            className="input flex-1"
                                                            placeholder={tr("item_description_ar", "وصف (بالعربية)")}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex w-full">
                                                        <div className="flex w-full items-center justify-between">
                                                            <div className="flex flex-col">
                                                                {(() => {
                                                                    const displayName = lang === "ar" ? item.ar || item.name : item.name || item.ar;
                                                                    const displayDesc =
                                                                        lang === "ar"
                                                                            ? item.descriptionAr || item.description
                                                                            : item.description || item.descriptionAr;
                                                                    return (
                                                                        <>
                                                                            <span className="text-light-900 dark:text-dark-50 text-sm font-semibold">
                                                                                {displayName}
                                                                            </span>
                                                                            {displayDesc && (
                                                                                <span className="text-light-600 dark:text-dark-300 mt-1 text-xs">
                                                                                    {displayDesc}
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
                                                {editingId === item._id ? (
                                                    <>
                                                        <button
                                                            onClick={() => saveEdit(item._id)}
                                                            disabled={isSaving}
                                                            className="btn-ghost flex items-center gap-2 rounded-xl"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="btn-ghost flex items-center gap-2 rounded-xl"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <>
                                                            <button
                                                                onClick={() => startEdit(item)}
                                                                className="btn-ghost flex items-center gap-2 rounded-xl"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => remove(item)}
                                                                className="btn-ghost text-danger-500 flex items-center gap-2 rounded-xl"
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
                                <p className="text-light-600 dark:text-dark-300">{tr("no_items_defined", "No items defined yet.")}</p>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="btn-ghost rounded-xl px-3 py-1 disabled:opacity-50"
                                >
                                    {tr("previous", "Previous")}
                                </button>
                                <span className="text-light-600 dark:text-dark-400 text-sm">
                                    {tr("page", "Page")} {currentPage} {tr("of", "of")} {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="btn-ghost rounded-xl px-3 py-1 disabled:opacity-50"
                                >
                                    {tr("next", "Next")}
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div className="mt-5 grid gap-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                    <input
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={tr("item_name", "Item Name")}
                        disabled={isSaving}
                        className="input flex-1 disabled:opacity-50"
                    />
                    <input
                        value={inputNameAr}
                        onChange={(e) => setInputNameAr(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={tr("item_name_ar", "اسم العنصر (بالعربية)")}
                        disabled={isSaving}
                        className="input flex-1 disabled:opacity-50"
                    />
                    <input
                        value={inputDescription}
                        onChange={(e) => setInputDescription(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={tr("item_description", "Description")}
                        disabled={isSaving}
                        className="input flex-1 disabled:opacity-50"
                    />
                    <input
                        value={inputDescriptionAr}
                        onChange={(e) => setInputDescriptionAr(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        placeholder={tr("item_description_ar", "وصف (بالعربية)")}
                        disabled={isSaving}
                        className="input flex-1 disabled:opacity-50"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={isSaving}
                        className="btn-primary h-[42px] min-w-[120px] justify-center rounded-xl disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Loader2
                                size={14}
                                className="text-light-500 animate-spin"
                            />
                        ) : (
                            <Plus size={14} />
                        )}
                        {tr("add", "Add")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemsPage;
