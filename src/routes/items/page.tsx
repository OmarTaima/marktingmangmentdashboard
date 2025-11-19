import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Loader2, Search } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from "@/hooks/queries";
import type { Item } from "@/api/requests/itemsService";

const ItemsPage = () => {
    const { t } = useLang();
    const [inputName, setInputName] = useState<string>("");
    const [inputDescription, setInputDescription] = useState<string>("");
    const [editingId, setEditingId] = useState<string>("");
    const [editingName, setEditingName] = useState<string>("");
    const [editingDescription, setEditingDescription] = useState<string>("");
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

    const handleAdd = async () => {
        const name = (inputName || "").trim();
        const desc = (inputDescription || "").trim();

        if (!name) {
            setError(t("item_name_required") || "Item name is required");
            return;
        }

        try {
            setError("");
            await createItemMutation.mutateAsync({
                name,
                description: desc || undefined,
            });
            setInputName("");
            setInputDescription("");
        } catch (e: any) {
            console.error("Error creating item:", e);
            setError(e.response?.data?.message || "Failed to create item");
        }
    };

    const startEdit = (item: Item) => {
        setEditingId(item._id);
        setEditingName(item.name || "");
        setEditingDescription(item.description || "");
    };

    const saveEdit = async (id: string) => {
        const name = (editingName || "").trim();
        const desc = (editingDescription || "").trim();

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
                    description: desc || undefined,
                },
            });
            setEditingId("");
            setEditingName("");
            setEditingDescription("");
        } catch (e: any) {
            console.error("Error updating item:", e);
            setError(e.response?.data?.message || "Failed to update item");
        }
    };

    const cancelEdit = () => {
        setEditingId("");
        setEditingName("");
        setEditingDescription("");
    };

    const remove = async (item: Item) => {
        if (!confirm(t("confirm_delete_item") || "Delete this item?")) return;

        try {
            setError("");
            await deleteItemMutation.mutateAsync(item._id);
        } catch (e: any) {
            console.error("Error deleting item:", e);
            setError(e.response?.data?.message || "Failed to delete item");
        }
    };

    const filteredItems = items;

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("Items")}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("manage_items_sub") || "Manage available items shown throughout the app."}</p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            <div className="card">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="card-title">{t("manage_items") || "Manage Items"}</h2>
                    <div className="relative">
                        <Search className="text-light-600 dark:text-dark-400 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder={t("search_items") || "Search items..."}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-64 rounded-lg border bg-white py-2 pr-3 pl-10 text-sm transition-colors focus:outline-none"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="text-light-500 dark:text-dark-400 h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid gap-3">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <div
                                        key={item._id}
                                        className="border-light-600 text-light-900 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-50 flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                                    >
                                        <div className="flex w-full items-center gap-3">
                                            {editingId === item._id ? (
                                                <div className="flex w-full gap-2">
                                                    <input
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                        placeholder={t("item_name") || "Item Name"}
                                                    />
                                                    <input
                                                        value={editingDescription}
                                                        onChange={(e) => setEditingDescription(e.target.value)}
                                                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/2 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none"
                                                        placeholder={t("item_description") || "Description"}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex w-full">
                                                    <div className="flex w-full items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-light-900 dark:text-dark-50 text-sm font-semibold">
                                                                {item.name}
                                                            </span>
                                                            {item.description && (
                                                                <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                                    {item.description}
                                                                </span>
                                                            )}
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
                                                    <button
                                                        onClick={() => startEdit(item)}
                                                        className="btn-ghost flex items-center gap-2"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => remove(item)}
                                                        className="btn-ghost text-danger-500 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-light-600">{t("no_items_defined") || "No items defined yet."}</p>
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
                        value={inputName}
                        onChange={(e) => setInputName(e.target.value)}
                        placeholder={t("item_name") || "Item Name"}
                        disabled={isSaving}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 flex-1 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none disabled:opacity-50"
                    />
                    <input
                        value={inputDescription}
                        onChange={(e) => setInputDescription(e.target.value)}
                        placeholder={t("item_description") || "Description"}
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
                                className="animate-spin"
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

export default ItemsPage;
