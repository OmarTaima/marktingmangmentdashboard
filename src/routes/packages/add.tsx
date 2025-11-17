import { useEffect, useState } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
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
                return prev.filter((id) => id !== itemId);
            }
            return [...prev, itemId];
        });
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
                            return (
                                <div
                                    key={item._id}
                                    onClick={() => toggleItemSelection(item._id)}
                                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${
                                        isSelected
                                            ? "border-light-500 bg-light-500 dark:bg-secdark-700 dark:text-dark-50 text-white"
                                            : "border-light-600 text-light-900 hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 bg-white"
                                    }`}
                                >
                                    <span className="truncate">{item.name}</span>
                                    {isSelected && (
                                        <Check
                                            size={16}
                                            className="flex-shrink-0"
                                        />
                                    )}
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
