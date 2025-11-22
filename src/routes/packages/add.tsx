import { useEffect, useState } from "react";
import { Plus, Check, Loader2, Minus } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { getItems, type Item } from "@/api/requests/itemsService";
import { createPackage } from "@/api/requests/packagesService";
import { useNavigate } from "react-router-dom";

const AddPackagePage = () => {
    const { t } = useLang();
    const navigate = useNavigate();

    const [nameEn, setNameEn] = useState<string>("");
    const [nameAr, setNameAr] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [availableItems, setAvailableItems] = useState<Item[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [nameError, setNameError] = useState<string>("");
    const [priceError, setPriceError] = useState<string>("");

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setIsLoading(true);
        setError("");
        try {
            const response = await getItems({ page: 1, limit: 100 });
            setAvailableItems(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to load items");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleItemSelection = (itemId: string) => {
        setSelectedItemIds((prev) => {
            if (prev.includes(itemId)) {
                setItemQuantities((q) => {
                    const copy = { ...q };
                    delete copy[itemId];
                    return copy;
                });
                return prev.filter((id) => id !== itemId);
            }
            setItemQuantities((q) => ({ ...q, [itemId]: q[itemId] || 1 }));
            return [...prev, itemId];
        });
    };

    const incrementQuantity = (itemId: string) => {
        setItemQuantities((q) => ({ ...q, [itemId]: (q[itemId] || 0) + 1 }));
        if (!selectedItemIds.includes(itemId)) {
            setSelectedItemIds((prev) => [...prev, itemId]);
        }
    };

    const decrementQuantity = (itemId: string) => {
        setItemQuantities((q) => {
            const current = q[itemId] || 0;
            const next = Math.max(1, current - 1);
            return { ...q, [itemId]: next };
        });
        if (!selectedItemIds.includes(itemId)) {
            setSelectedItemIds((prev) => [...prev, itemId]);
        }
    };

    const setQuantity = (itemId: string, value: number) => {
        const next = Math.max(1, Math.floor(Number(value) || 1));
        setItemQuantities((q) => ({ ...q, [itemId]: next }));
        if (!selectedItemIds.includes(itemId)) {
            setSelectedItemIds((prev) => [...prev, itemId]);
        }
    };

    const handleSubmit = async () => {
        // Validation
        const en = nameEn.trim();
        const ar = nameAr.trim();
        const p = price.trim();

        if (!en || !ar) {
            setNameError(t("package_name_required") || "Package name in both languages is required");
            return;
        }

        // Validate language
        const nameHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(en);
        const nameHasLatinInAr = /[A-Za-z]/.test(ar);
        if (nameHasArabic) {
            setNameError(t("english_only") || "Please enter English text only in English field.");
            return;
        }
        if (nameHasLatinInAr) {
            setNameError(t("arabic_only") || "Please enter Arabic text only in Arabic field.");
            return;
        }
        setNameError("");

        if (!p || isNaN(Number(p)) || Number(p) <= 0) {
            setPriceError(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        setPriceError("");

        if (selectedItemIds.length === 0) {
            setError(t("select_items") || "Please select at least one item for the package");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await createPackage({
                nameEn: en,
                nameAr: ar,
                price: Number(p),
                description: description.trim() || undefined,
                items: selectedItemIds,
                quantities: itemQuantities,
            });

            // Navigate back to packages page
            navigate("/packages");
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create package");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="text-light-500 dark:text-dark-400 h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("create_package") || "Create Package"}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("create_package_subtitle") || "Create a new package with selected items"}</p>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                    {error}
                </div>
            )}

            <div className="card space-y-4">
                <h2 className="card-title">{t("package_details") || "Package Details"}</h2>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                            {t("package_name_en") || "Package Name (English)"}
                        </label>
                        <input
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            placeholder={t("package_name_en") || "Package name (English)"}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                            {t("package_name_ar") || "Package Name (Arabic)"}
                        </label>
                        <input
                            value={nameAr}
                            onChange={(e) => setNameAr(e.target.value)}
                            placeholder={t("package_name_ar") || "اسم الباقة (بالعربية)"}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                    </div>
                </div>
                {nameError && <p className="text-danger-500 mt-1 text-xs">{nameError}</p>}

                <div>
                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("package_price") || "Price"}</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={t("package_price") || "Price"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    {priceError && <p className="text-danger-500 mt-1 text-xs">{priceError}</p>}
                </div>

                <div>
                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                        {t("package_description") || "Description (Optional)"}
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("package_description_placeholder") || "Enter package description..."}
                        rows={3}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder-light-500 dark:placeholder-dark-400 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{t("select_items") || "Select Items"}</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {availableItems.map((item) => {
                            const isSelected = selectedItemIds.includes(item._id);
                            const qty = itemQuantities[item._id] || 1;
                            return (
                                <div
                                    key={item._id}
                                    onClick={() => toggleItemSelection(item._id)}
                                    className={`flex cursor-pointer flex-col items-start justify-between gap-2 rounded-lg border px-4 py-3 text-sm transition-all sm:flex-row sm:items-center ${
                                        isSelected
                                            ? "border-light-500 bg-light-500 dark:bg-secdark-700 dark:text-dark-50 text-white"
                                            : "border-light-600 text-light-900 hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 bg-white"
                                    }`}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="truncate">{item.name}</span>
                                    </div>

                                    <div
                                        className="mt-2 flex items-center gap-2 sm:mt-0"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => decrementQuantity(item._id)}
                                                aria-label={t("decrease_quantity") || "Decrease quantity"}
                                                className="hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:hover:bg-dark-700 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-xs"
                                            >
                                                <Minus size={12} />
                                            </button>

                                            <input
                                                type="number"
                                                min={1}
                                                value={qty}
                                                onChange={(e) => setQuantity(item._id, Number(e.target.value))}
                                                aria-label={t("item_quantity") || "Item quantity"}
                                                className="dark:bg-dark-800 dark:border-dark-700 w-12 rounded-md border bg-white px-1.5 py-0.5 text-center text-sm sm:w-12"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => incrementQuantity(item._id)}
                                                aria-label={t("increase_quantity") || "Increase quantity"}
                                                className="hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:hover:bg-dark-700 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-xs"
                                            >
                                                <Plus size={12} />
                                            </button>

                                            <div className="ml-2 flex items-center gap-2">
                                                {isSelected && (
                                                    <span className="bg-light-700 dark:bg-dark-600 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white">
                                                        <Check size={12} />
                                                        <span>{qty}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {availableItems.length === 0 && (
                        <p className="text-light-600 dark:text-dark-400 text-sm">
                            {t("no_items_available") || "No items available. Please create items first."}
                        </p>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/packages")}
                        className="btn-ghost"
                    >
                        {t("cancel") || "Cancel"}
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-primary flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                                {t("creating") || "Creating..."}
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                {t("create_package") || "Create Package"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPackagePage;
