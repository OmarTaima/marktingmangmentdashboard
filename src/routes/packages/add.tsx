import { useEffect, useState, KeyboardEvent, useRef } from "react";
import { Plus, Check, Loader2, Minus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { showConfirm, showAlert } from "@/utils/swal";
import { getItems, type Item } from "@/api/requests/itemsService";
import type { Package } from "@/api/requests/packagesService";
import { usePackages, useDeletePackage, useUpdatePackage, useCreatePackage } from "@/hooks/queries/usePackagesQuery";
import { useQueryClient } from "@tanstack/react-query";
import { packagesKeys } from "@/hooks/queries/usePackagesQuery";
import { useNavigate } from "react-router-dom";

const AddPackagePage = () => {
    const { t } = useLang();
    const navigate = useNavigate();

    const [nameEn, setNameEn] = useState<string>("");
    const [nameAr, setNameAr] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [descriptionAr, setDescriptionAr] = useState<string>("");
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

    // Fetch existing packages
    const { data: packagesData, isLoading: packagesLoading } = usePackages({ page: 1, limit: 100 });
    const packagesList: Package[] = packagesData?.data || [];
    const deleteMutation = useDeletePackage();
    const updatePackageMutation = useUpdatePackage();
    const createPackageMutation = useCreatePackage();
    const queryClient = useQueryClient();
    const [editPackageId, setEditPackageId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

    // Prevent package tiles from toggling when Enter-driven submit is happening
    const ignorePackageToggleRef = useRef(false);

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
            if (editPackageId) {
                await updatePackageMutation.mutateAsync({
                    id: editPackageId,
                    data: {
                        nameEn: en,
                        nameAr: ar,
                        price: Number(p),
                        description: description.trim() || undefined,
                        descriptionAr: descriptionAr.trim() || undefined,
                        items: selectedItemIds.map((itemId) => ({ item: itemId, quantity: itemQuantities[itemId] || 1 })),
                    },
                });
                // reset edit state
                setEditPackageId(null);
            } else {
                await createPackageMutation.mutateAsync({
                    nameEn: en,
                    nameAr: ar,
                    price: Number(p),
                    description: description.trim() || undefined,
                    descriptionAr: descriptionAr.trim() || undefined,
                    items: selectedItemIds.map((itemId) => ({ item: itemId, quantity: itemQuantities[itemId] || 1 })),
                });
            }

            // ensure packages list is refetched so other pages show fresh data
            try {
                queryClient.invalidateQueries({ queryKey: packagesKeys.lists() });
            } catch (e) {
                // ignore
            }

            // show success alert, then navigate back to packages list
            try {
                if (editPackageId) {
                    await showAlert(t("package_updated_success") || "Package updated successfully", "success");
                } else {
                    await showAlert(t("package_created_success") || "Package created successfully", "success");
                }
            } catch (e) {
                // ignore swal errors and proceed
            }

            navigate("/packages");
        } catch (err: any) {
            setError(err.response?.data?.message || (editPackageId ? "Failed to update package" : "Failed to create package"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePackageKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            // signal that package tiles should ignore clicks for a short moment
            ignorePackageToggleRef.current = true;
            try {
                handleSubmit();
            } finally {
                // reset after a tick so any click events are ignored
                setTimeout(() => {
                    ignorePackageToggleRef.current = false;
                }, 50);
            }
        }
    };

    const startEditPackage = (pkg: Package) => {
        setEditPackageId(pkg._id);
        setNameEn(pkg.nameEn || "");
        setNameAr(pkg.nameAr || "");
        setDescription(pkg.description || "");
        setDescriptionAr(pkg.descriptionAr || "");
        setPrice(pkg.price?.toString() || "");

        // normalize items: pkg.items may contain { item: { _id } , quantity }
        const ids: string[] = [];
        const quantities: Record<string, number> = {};
        (pkg.items || []).forEach((it: any) => {
            const itemObj = it.item || it;
            const id = typeof itemObj === "string" ? itemObj : itemObj?._id || itemObj?.id;
            if (id) {
                ids.push(id);
                quantities[id] = it.quantity || 1;
            }
        });
        setSelectedItemIds(ids);
        setItemQuantities(quantities);
        // scroll to form
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="text-light-500 dark:text-light-500 h-8 w-8 animate-spin" />
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
            <div className="card space-y-4">
                <h2 className="card-title">{t("existing_packages") || "Existing Packages"}</h2>

                {packagesLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="text-light-500 dark:text-light-500 h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {packagesList.map((pkg) => (
                            <div
                                key={pkg._id}
                                className="dark:bg-dark-800 dark:border-dark-700 flex flex-col justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-sm transition-colors hover:shadow-sm"
                            >
                                <div className="min-w-0">
                                    <div className="text-light-900 dark:text-dark-50 truncate text-base font-medium">{pkg.nameEn || pkg.nameAr}</div>
                                    <div className="text-light-600 dark:text-dark-400 mt-1 text-xs">{pkg.description || ""}</div>
                                </div>
                                {pkg.items && pkg.items.length > 0 && (
                                    <ul className="mt-3 space-y-2">
                                        {pkg.items.map((pkgItem, idx) => {
                                            const inner = (pkgItem as any).item || (pkgItem as any);
                                            const id = (inner && (inner._id || inner.id)) || `${pkg._id}-${idx}`;
                                            const name = inner?.name || inner?.nameEn || inner?.nameAr || "(item)";
                                            const descriptionInner = inner?.description || inner?.desc || null;
                                            const quantity = (pkgItem as any).quantity;

                                            return (
                                                <li
                                                    key={id}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Check
                                                        size={14}
                                                        className="text-green-500"
                                                    />
                                                    <div className="text-sm">
                                                        <div className="text-light-900 dark:text-dark-50 font-medium">{name}</div>
                                                        {descriptionInner && (
                                                            <div className="text-light-600 dark:text-dark-400 text-xs">{descriptionInner}</div>
                                                        )}
                                                    </div>
                                                    {typeof quantity !== "undefined" && (
                                                        <span className="bg-light-100 dark:bg-dark-700 ml-auto inline-block rounded-md px-2 py-0.5 text-xs">
                                                            x{quantity}
                                                        </span>
                                                    )}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="text-light-900 dark:text-dark-50 text-sm font-semibold">{pkg.price ? `${pkg.price}` : "-"}</div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditPackage(pkg);
                                            }}
                                            className="bg-light-50 hover:bg-light-100 dark:bg-dark-700 dark:text-dark-50 inline-flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-xs font-medium"
                                        >
                                            <Check size={14} />
                                            <span>{t("edit") || "Edit"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                const ok = await showConfirm(
                                                    t("confirm_delete") || "Are you sure you want to delete this package?",
                                                    t("yes") || "Yes",
                                                    t("no") || "No",
                                                );
                                                if (!ok) return;
                                                setDeletingId(pkg._id);
                                                deleteMutation.mutate(pkg._id, {
                                                    onError: () => {
                                                        setError(t("delete_failed") || "Failed to delete package");
                                                        setDeletingId(null);
                                                    },
                                                    onSuccess: () => {
                                                        setDeletingId(null);
                                                    },
                                                });
                                            }}
                                            className="text-danger-600 hover:bg-danger-50 dark:hover:bg-dark-700 inline-flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-xs font-medium"
                                        >
                                            {deletingId === pkg._id ? (
                                                <Loader2
                                                    size={14}
                                                    className="text-light-500 animate-spin"
                                                />
                                            ) : (
                                                <Trash2
                                                    size={14}
                                                    className="text-danger-600"
                                                />
                                            )}
                                            <span className="text-danger-600">{t("delete") || "Delete"}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {packagesList.length === 0 && (
                            <p className="text-light-600 dark:text-dark-400 text-sm">{t("no_packages") || "No packages found."}</p>
                        )}
                    </div>
                )}
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

                <div className="grid gap-4 lg:grid-cols-2">
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
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                            {t("package_description_ar") || "Description (Arabic)"}
                        </label>
                        <textarea
                            value={descriptionAr}
                            onChange={(e) => setDescriptionAr(e.target.value)}
                            placeholder={t("package_description_ar_placeholder") || "أدخل وصف الباقة (بالعربية)..."}
                            rows={3}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder-light-500 dark:placeholder-dark-400 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                    </div>
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
                                    onClick={() => {
                                        if (ignorePackageToggleRef.current) return;
                                        toggleItemSelection(item._id);
                                    }}
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
                        onClick={() => {
                            if (editPackageId) {
                                // cancel edit: clear form fields
                                setEditPackageId(null);
                                setNameEn("");
                                setNameAr("");
                                setDescription("");
                                setDescriptionAr("");
                                setPrice("");
                                setSelectedItemIds([]);
                                setItemQuantities({});
                                setError("");
                                setNameError("");
                                setPriceError("");
                                return;
                            }
                            navigate("/packages");
                        }}
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
                                    className="text-light-500 animate-spin"
                                />
                                {editPackageId ? t("updating") || "Updating..." : t("creating") || "Creating..."}
                            </>
                        ) : (
                            <>
                                {editPackageId ? <Check size={16} /> : <Plus size={16} />}
                                {editPackageId ? t("update_package") || "Update Package" : t("create_package") || "Create Package"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPackagePage;
