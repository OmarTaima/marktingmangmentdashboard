import { useEffect, useState, useMemo } from "react";
import { Plus, Check, Loader2, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { showConfirm, showAlert } from "@/utils/swal";
import { getItems, type Item } from "@/api/requests/itemsService";
import type { Package } from "@/api/requests/packagesService";
import { usePackages, useDeletePackage, useUpdatePackage, useCreatePackage } from "@/hooks/queries/usePackagesQuery";
import { useQueryClient } from "@tanstack/react-query";
import { packagesKeys } from "@/hooks/queries/usePackagesQuery";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/queries";
// removed duplicate/invalid imports

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
    const [displayTypes, setDisplayTypes] = useState<Record<string, "number" | "string" | "availability">>({});
    const [stringValues, setStringValues] = useState<Record<string, string>>({});
    const [availabilities, setAvailabilities] = useState<Record<string, boolean>>({});
    const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
    const [activeChooserFor, setActiveChooserFor] = useState<string | null>(null);
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
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const { data: servicesResponse } = useServices({ limit: 1000 });
    const services = servicesResponse?.data || [];
    const deleteMutation = useDeletePackage();
    const updatePackageMutation = useUpdatePackage();
    const createPackageMutation = useCreatePackage();
    const queryClient = useQueryClient();
    const [existingCollapsed, setExistingCollapsed] = useState<boolean>(true);
    const [editPackageId, setEditPackageId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    // Packages preview is static now (no expand/collapse)

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

    // itemsMap removed from this file (used in packages page)

    const packageMatchesService = (pkg: Package, serviceId: string) => {
        const anyPkg: any = pkg as any;
        if (!serviceId) return false;
        if (anyPkg.service) {
            if (typeof anyPkg.service === "string") return anyPkg.service === serviceId;
            if (anyPkg.service._id) return anyPkg.service._id === serviceId;
            if (anyPkg.service.id) return anyPkg.service.id === serviceId;
        }
        if (anyPkg.serviceId) return anyPkg.serviceId === serviceId;
        return false;
    };

    const servicesWithCounts = useMemo(() => {
        const map: { service: any; count: number }[] = [];
        services.forEach((s) => {
            const byPackages = packagesList.filter((p) => packageMatchesService(p, s._id)).length;
            const byServiceList = (s.packages && s.packages.length) || 0;
            const count = byPackages > 0 ? byPackages : byServiceList;
            if (count > 0) map.push({ service: s, count });
        });
        return map;
    }, [services, packagesList]);

    const filteredPackages = useMemo(() => {
        if (!selectedServiceId) return packagesList;
        return packagesList.filter((p) => packageMatchesService(p, selectedServiceId));
    }, [packagesList, selectedServiceId]);

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
                const payload = {
                    nameEn: en,
                    nameAr: ar,
                    price: Number(p),
                    description: description.trim() || undefined,
                    descriptionAr: descriptionAr.trim() || undefined,
                    items: selectedItemIds.map((itemId) => {
                        const type =
                            displayTypes[itemId] ||
                            (typeof itemQuantities[itemId] !== "undefined"
                                ? "number"
                                : typeof stringValues[itemId] !== "undefined"
                                  ? "string"
                                  : "availability");
                        let quantity: any = itemQuantities[itemId];
                        if (type === "string") quantity = stringValues[itemId] ?? "";
                        if (type === "availability") quantity = !!availabilities[itemId];
                        const note = itemNotes[itemId]?.trim() ?? "";
                        return { item: itemId, quantity, note };
                    }),
                };
                // Log payload so you can inspect request body in dev tools if needed
                // (remove or guard this in production as desired)
                // eslint-disable-next-line no-console
                console.debug("updatePackage payload:", payload);
                await updatePackageMutation.mutateAsync({ id: editPackageId, data: payload });
                setEditPackageId(null);
            } else {
                const payload = {
                    nameEn: en,
                    nameAr: ar,
                    price: Number(p),
                    description: description.trim() || undefined,
                    descriptionAr: descriptionAr.trim() || undefined,
                    items: selectedItemIds.map((itemId) => {
                        const type =
                            displayTypes[itemId] ||
                            (typeof itemQuantities[itemId] !== "undefined"
                                ? "number"
                                : typeof stringValues[itemId] !== "undefined"
                                  ? "string"
                                  : "availability");
                        let quantity: any = itemQuantities[itemId];
                        if (type === "string") quantity = stringValues[itemId] ?? "";
                        if (type === "availability") quantity = !!availabilities[itemId];
                        const note = itemNotes[itemId]?.trim() ?? "";
                        return { item: itemId, quantity, note };
                    }),
                };
                // eslint-disable-next-line no-console
                console.debug("createPackage payload:", payload);
                await createPackageMutation.mutateAsync(payload as any);
            }

            try {
                queryClient.invalidateQueries({ queryKey: packagesKeys.lists() });
            } catch (e) {
                // ignore
            }

            try {
                if (editPackageId) {
                    await showAlert(t("package_updated_success") || "Package updated successfully", "success");
                } else {
                    await showAlert(t("package_created_success") || "Package created successfully", "success");
                }
            } catch (e) {}

            navigate("/packages");
        } catch (err: any) {
            setError(err.response?.data?.message || (editPackageId ? "Failed to update package" : "Failed to create package"));
        } finally {
            setIsSubmitting(false);
        }
    };

    // toggleItemSelection removed (not used)

    const incrementQuantity = (itemId: string) => {
        setDisplayTypes((d) => ({ ...d, [itemId]: d[itemId] || "number" }));
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
        setDisplayTypes((d) => ({ ...d, [itemId]: d[itemId] || "number" }));
        setItemQuantities((q) => ({ ...q, [itemId]: next }));
        if (!selectedItemIds.includes(itemId)) {
            setSelectedItemIds((prev) => [...prev, itemId]);
        }
    };

    // Chooser state removed - using inline actions now

    const removeSelection = (itemId: string) => {
        setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
        setItemQuantities((q) => {
            const copy = { ...q };
            delete copy[itemId];
            return copy;
        });
        setDisplayTypes((d) => {
            const copy = { ...d };
            delete copy[itemId];
            return copy;
        });
        setStringValues((s) => {
            const copy = { ...s };
            delete copy[itemId];
            return copy;
        });
        setAvailabilities((a) => {
            const copy = { ...a };
            delete copy[itemId];
            return copy;
        });
        setItemNotes((n) => {
            const copy = { ...n };
            delete copy[itemId];
            return copy;
        });
        setActiveChooserFor(null);
    };

    const startEditPackage = (pkg: Package) => {
        setEditPackageId(pkg._id);
        setNameEn(pkg.nameEn || "");
        setNameAr(pkg.nameAr || "");
        setDescription(pkg.description || "");
        setDescriptionAr(pkg.descriptionAr || "");
        setPrice(pkg.price?.toString() || "");

        const ids: string[] = [];
        const quantities: Record<string, number> = {};
        const dTypes: Record<string, "number" | "string" | "availability"> = {};
        const sValues: Record<string, string> = {};
        const aValues: Record<string, boolean> = {};
        const notes: Record<string, string> = {};
        (pkg.items || []).forEach((it: any) => {
            const itemObj = it.item || it;
            const id = typeof itemObj === "string" ? itemObj : itemObj?._id || itemObj?.id;
            if (id) {
                ids.push(id);
                const q = it.quantity;
                if (typeof q === "number") {
                    quantities[id] = q || 1;
                    dTypes[id] = "number";
                } else if (typeof q === "string") {
                    sValues[id] = q;
                    dTypes[id] = "string";
                } else if (typeof q === "boolean") {
                    aValues[id] = q;
                    dTypes[id] = "availability";
                } else {
                    quantities[id] = 1;
                    dTypes[id] = "number";
                }
                // load note if present on the package item; handle both `it.note` and populated `it.item.note`
                const noteFromItem = it && typeof it.note === "string" ? it.note : undefined;
                const noteFromPopulated = it && it.item && typeof it.item.note === "string" ? it.item.note : undefined;
                const noteVal = noteFromItem ?? noteFromPopulated ?? "";
                notes[id] = noteVal;
            }
        });
        setSelectedItemIds(ids);
        setItemQuantities(quantities);
        setDisplayTypes(dTypes);
        setStringValues(sValues);
        setAvailabilities(aValues);
        setItemNotes(notes);
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
        <div className="space-y-2 px-2 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("create_package") || "Create Package"}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("create_package_subtitle") || "Create a new package with selected items"}</p>
                </div>
            </div>
            <div className="card space-y-2">
                <div className="flex items-center justify-between">
                    <h2 className="card-title">{t("existing_packages") || "Existing Packages"}</h2>
                    <button
                        type="button"
                        onClick={() => setExistingCollapsed((s) => !s)}
                        aria-expanded={!existingCollapsed}
                        className="btn-ghost text-sm"
                    >
                        {existingCollapsed ? t("show") || "Show" : t("hide") || "Hide"}
                    </button>
                </div>

                {existingCollapsed ? (
                    <div className="text-light-600 dark:text-dark-400 px-4 py-3 text-sm">
                        {packagesLoading ? (
                            <div className="flex items-center justify-center py-2">
                                <Loader2 className="text-light-500 dark:text-light-500 h-5 w-5 animate-spin" />
                            </div>
                        ) : (
                            <div>{t("existing_packages_collapsed_text") || `${packagesList.length} packages`}</div>
                        )}
                    </div>
                ) : packagesLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="text-light-500 dark:text-light-500 h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Service tabs (All + services that have packages) */}
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedServiceId(null)}
                                aria-pressed={selectedServiceId === null}
                                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                    selectedServiceId === null
                                        ? "bg-light-700 dark:bg-dark-700 dark:text-dark-50 text-white"
                                        : "bg-light-100 text-light-900 dark:bg-dark-800 dark:text-dark-200"
                                }`}
                            >
                                {t("all") || "All"}
                            </button>

                            {servicesWithCounts.map(({ service, count }) => (
                                <button
                                    key={service._id}
                                    type="button"
                                    onClick={() => setSelectedServiceId(service._id)}
                                    aria-pressed={selectedServiceId === service._id}
                                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                                        selectedServiceId === service._id
                                            ? "bg-light-700 dark:bg-dark-700 dark:text-dark-50 text-white"
                                            : "bg-light-100 text-light-900 dark:bg-dark-800 dark:text-dark-200"
                                    }`}
                                >
                                    {service.en || service.name || service.title}
                                    <span className="dark:bg-dark-700 ml-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-xs">{count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredPackages.map((pkg, pkgIndex) => {
                                const pkgId = pkg._id || (pkg as any).id || `pkg-${pkgIndex}`;
                                return (
                                    <div
                                        key={pkgId}
                                        className="border-light-200 dark:bg-dark-800 dark:border-dark-700 flex flex-col justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-sm transition-colors"
                                    >
                                        <div className="flex min-w-0 items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <div className="text-light-900 dark:text-dark-50 truncate text-base font-medium">
                                                    {pkg.nameEn || pkg.nameAr}
                                                </div>
                                                {pkg.description && (
                                                    <div className="text-light-600 dark:text-dark-400 mt-1 text-xs">{pkg.description}</div>
                                                )}
                                            </div>
                                            <div className="text-light-900 dark:text-dark-50 text-sm font-semibold">
                                                {pkg.price ? `${pkg.price} EGP` : "-"}
                                            </div>
                                        </div>

                                        {pkg.items && pkg.items.length > 0 && (
                                            <div className="mt-1">
                                                <div className="text-light-600 dark:text-dark-400 mb-2 text-xs">Items ({pkg.items.length})</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {pkg.items.map((pkgItem, idx) => {
                                                        const inner = (pkgItem as any).item || (pkgItem as any);
                                                        const id = (inner && (inner._id || inner.id)) || `${pkgId}-${idx}`;
                                                        const name = inner?.name || inner?.nameEn || inner?.nameAr || "(item)";
                                                        const quantity = (pkgItem as any).quantity;
                                                        return (
                                                            <div
                                                                key={id}
                                                                className="bg-light-100 dark:bg-dark-700 inline-flex items-center rounded-full px-3 py-1 text-xs"
                                                            >
                                                                <span className="text-light-900 dark:text-dark-50 mr-2 font-medium">{name}</span>
                                                                {typeof quantity !== "undefined" && (
                                                                    <span className="text-light-900 dark:text-dark-50 bg-light-100 dark:bg-dark-700 ml-1 inline-block rounded px-2 py-0.5 text-[11px]">
                                                                        {typeof quantity === "number"
                                                                            ? `x${quantity}`
                                                                            : quantity === true
                                                                              ? "✓"
                                                                              : quantity}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3 flex items-center justify-end gap-2">
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
                                );
                            })}

                            {filteredPackages.length === 0 && (
                                <p className="text-light-600 dark:text-dark-400 text-sm">{t("no_packages") || "No packages found."}</p>
                            )}
                        </div>
                    </>
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

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => {
                                        setActiveChooserFor((cur) => (cur === item._id ? null : item._id));
                                    }}
                                    className={`relative flex cursor-pointer flex-col items-start justify-between gap-2 overflow-hidden rounded-lg border px-4 py-3 text-sm transition-all duration-200 ${
                                        isSelected
                                            ? "border-light-500 dark:bg-dark-900 dark:text-dark-50 text-light-900 bg-white/5"
                                            : "border-light-600 text-light-900 hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 bg-white"
                                    } ${activeChooserFor === item._id ? "ring-light-200/50 dark:ring-secdark-600 shadow-sm ring-1 ring-offset-1" : ""}`}
                                >
                                    <div className="flex w-full min-w-0 items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <span className="truncate text-sm font-medium">{item.name}</span>
                                            {item.description && (
                                                <div className="text-light-600 dark:text-dark-400 mt-1 truncate text-xs">{item.description}</div>
                                            )}
                                        </div>

                                        <div className="ml-3 flex items-center gap-2">
                                            {/* show a compact field summarizing or carrying current display value */}
                                            {selectedItemIds.includes(item._id)
                                                ? (() => {
                                                      const type = displayTypes[item._id] || "number";
                                                      if (type === "number") {
                                                          return (
                                                              <div className="flex items-center gap-2">
                                                                  <button
                                                                      type="button"
                                                                      onClick={(e) => {
                                                                          e.stopPropagation();
                                                                          decrementQuantity(item._id);
                                                                      }}
                                                                      className="dark:bg-dark-800 dark:border-dark-700 dark:text-dark-50 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-sm"
                                                                  >
                                                                      -
                                                                  </button>
                                                                  <input
                                                                      type="number"
                                                                      value={itemQuantities[item._id] || 1}
                                                                      onClick={(e) => e.stopPropagation()}
                                                                      onChange={(e) => {
                                                                          e.stopPropagation();
                                                                          setQuantity(item._id, Number(e.target.value));
                                                                      }}
                                                                      className="dark:bg-dark-800 dark:border-dark-700 text-light-900 dark:text-dark-50 w-12 rounded-md border bg-white px-1 py-0.5 text-center text-sm"
                                                                  />
                                                                  <button
                                                                      type="button"
                                                                      onClick={(e) => {
                                                                          e.stopPropagation();
                                                                          incrementQuantity(item._id);
                                                                      }}
                                                                      className="dark:bg-dark-800 dark:border-dark-700 dark:text-dark-50 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-sm"
                                                                  >
                                                                      +
                                                                  </button>
                                                              </div>
                                                          );
                                                      }
                                                      if (type === "string") {
                                                          return (
                                                              <input
                                                                  type="text"
                                                                  value={stringValues[item._id] || ""}
                                                                  onClick={(e) => e.stopPropagation()}
                                                                  onChange={(e) => {
                                                                      e.stopPropagation();
                                                                      setStringValues((s) => ({ ...s, [item._id]: e.target.value }));
                                                                  }}
                                                                  className="dark:bg-dark-800 text-light-900 dark:text-dark-50 w-40 rounded-md border bg-white px-2 py-1 text-sm"
                                                              />
                                                          );
                                                      }
                                                      return (
                                                          <div className="flex items-center gap-3">
                                                              <button
                                                                  type="button"
                                                                  onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      setAvailabilities((a) => ({ ...a, [item._id]: !a[item._id] }));
                                                                      if (!selectedItemIds.includes(item._id))
                                                                          setSelectedItemIds((prev) => [...prev, item._id]);
                                                                  }}
                                                                  aria-pressed={!!availabilities[item._id]}
                                                                  className={`relative h-6 w-11 rounded-full transition-colors duration-150 ${availabilities[item._id] ? "bg-green-500" : "dark:bg-dark-700 bg-gray-300"}`}
                                                              >
                                                                  <span
                                                                      className={`absolute top-0 left-0 h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-150 ${availabilities[item._id] ? "translate-x-5" : "translate-x-0"}`}
                                                                  ></span>
                                                              </button>
                                                              <span className="text-light-900 dark:text-dark-50 text-sm">
                                                                  {availabilities[item._id] ? t("true") || "True" : t("false") || "False"}
                                                              </span>
                                                          </div>
                                                      );
                                                  })()
                                                : null}
                                        </div>
                                    </div>

                                    {/* Small inline action buttons when item is clicked */}
                                    {activeChooserFor === item._id && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {[
                                                { key: "number", label: "#", title: t("as_number") || "Number" },
                                                { key: "string", label: "Aa", title: t("as_text") || "Text" },
                                                { key: "availability", label: "✓", title: t("as_availability") || "Availability" },
                                            ].map((opt) => {
                                                const key = opt.key as "number" | "string" | "availability";
                                                const selected = displayTypes[item._id] === key;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        title={opt.title}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDisplayTypes((d) => ({ ...d, [item._id]: key }));
                                                            if (key === "number") setItemQuantities((q) => ({ ...q, [item._id]: q[item._id] || 1 }));
                                                            if (key === "string") setStringValues((s) => ({ ...s, [item._id]: s[item._id] || "" }));
                                                            if (key === "availability")
                                                                setAvailabilities((a) => ({ ...a, [item._id]: a[item._id] ?? true }));
                                                            setSelectedItemIds((prev) => (prev.includes(item._id) ? prev : [...prev, item._id]));
                                                            setActiveChooserFor(null);
                                                        }}
                                                        className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                                                            selected
                                                                ? "bg-primary-500 text-white"
                                                                : "bg-light-200 text-light-700 hover:bg-light-300 dark:bg-dark-700 dark:text-dark-300 dark:hover:bg-dark-600"
                                                        }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeSelection(item._id);
                                                }}
                                                className="ml-1 flex h-7 items-center justify-center rounded bg-red-500/10 px-2 text-xs font-medium text-red-600 hover:bg-red-500/20 dark:text-red-400"
                                            >
                                                {t("cancel") || "Cancel"}
                                            </button>
                                        </div>
                                    )}

                                    {/* Note input for selected item */}
                                    {selectedItemIds.includes(item._id) && (
                                        <div className="mt-2 w-full">
                                            <input
                                                type="text"
                                                value={itemNotes[item._id] || ""}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    setItemNotes((n) => ({ ...n, [item._id]: e.target.value }));
                                                }}
                                                placeholder={t("item_note_placeholder") || "Note..."}
                                                className="dark:bg-dark-800 text-light-900 dark:text-dark-50 w-full rounded-md border bg-white px-2 py-1 text-xs"
                                            />
                                        </div>
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
