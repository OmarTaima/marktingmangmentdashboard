import { useEffect, useState, useMemo } from "react";
import { Plus, Check, Loader2, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { showConfirm, showAlert } from "@/utils/swal";
import { getItems, createItem, type Item } from "@/api/requests/itemsService";
import type { Package } from "@/api/requests/packagesService";
import { usePackages, useDeletePackage, useUpdatePackage, useCreatePackage } from "@/hooks/queries/usePackagesQuery";
import { useQueryClient } from "@tanstack/react-query";
import { packagesKeys } from "@/hooks/queries/usePackagesQuery";
import { useNavigate } from "react-router-dom";
import { useServices } from "@/hooks/queries";
// removed duplicate/invalid imports

const AddPackagePage = () => {
    const { t } = useLang();
    const tr = (key: string, fallback: string) => {
        const value = t(key);
        return !value || value === key ? fallback : value;
    };
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
    const [newItemName, setNewItemName] = useState<string>("");
    const [newItemNameAr, setNewItemNameAr] = useState<string>("");
    const [newItemDescription, setNewItemDescription] = useState<string>("");
    const [newItemDescriptionAr, setNewItemDescriptionAr] = useState<string>("");
    const [isCreatingItem, setIsCreatingItem] = useState<boolean>(false);

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

    const handleCreateItemInline = async () => {
        const en = newItemName.trim();
        const ar = newItemNameAr.trim();

        if (!en || !ar) {
            setError(t("item_name_required") || "Item name in both languages is required");
            return;
        }

        // Keep language input consistent with rest of the page validation style
        const enHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(en);
        const arHasLatin = /[A-Za-z]/.test(ar);
        if (enHasArabic) {
            setError(t("english_only") || "Please enter English text only in English field.");
            return;
        }
        if (arHasLatin) {
            setError(t("arabic_only") || "Please enter Arabic text only in Arabic field.");
            return;
        }

        setIsCreatingItem(true);
        setError("");
        try {
            const created = await createItem({
                name: en,
                ar,
                description: newItemDescription.trim() || undefined,
                descriptionAr: newItemDescriptionAr.trim() || undefined,
            });

            // Put the new item instantly in the local chooser list and pre-select it for the package
            setAvailableItems((prev) => {
                const exists = prev.some((i) => i._id === created._id);
                if (exists) return prev;
                return [created, ...prev];
            });
            setSelectedItemIds((prev) => (prev.includes(created._id) ? prev : [...prev, created._id]));
            setDisplayTypes((d) => ({ ...d, [created._id]: d[created._id] || "number" }));
            setItemQuantities((q) => ({ ...q, [created._id]: q[created._id] || 1 }));

            setNewItemName("");
            setNewItemNameAr("");
            setNewItemDescription("");
            setNewItemDescriptionAr("");

            // Refresh from API to keep local state consistent with backend list ordering/meta
            await loadItems();
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to create item");
        } finally {
            setIsCreatingItem(false);
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
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
                <div className="absolute -top-20 -right-12 h-56 w-56 rounded-full bg-light-400/20 blur-3xl dark:bg-light-500/10" />
                <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-secdark-700/20 blur-3xl dark:bg-secdark-700/20" />
                <div className="relative flex flex-col gap-2">
                    <span className="inline-flex w-fit items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                        Package Builder
                    </span>
                    <h1 className="title text-2xl sm:text-3xl">{tr("create_package", "Create Package")}</h1>
                    <p className="text-light-600 dark:text-dark-300 text-sm sm:text-base">
                        {tr("create_package_subtitle", "Create a new package with selected items")}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("total_packages", "Total Packages")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{packagesList.length}</p>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("available_items", "Available Items")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{availableItems.length}</p>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <p className="text-light-600 dark:text-dark-300 text-xs uppercase tracking-[0.08em]">{tr("selected_items", "Selected Items")}</p>
                    <p className="text-light-900 dark:text-dark-50 mt-2 text-2xl font-semibold">{selectedItemIds.length}</p>
                </div>
            </section>

            <div className="space-y-2 rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-light-900 dark:text-dark-50 text-lg font-semibold">{tr("existing_packages", "Existing Packages")}</h2>
                    <button
                        type="button"
                        onClick={() => setExistingCollapsed((s) => !s)}
                        aria-expanded={!existingCollapsed}
                        className="btn-ghost rounded-xl text-sm"
                    >
                        {existingCollapsed ? tr("show", "Show") : tr("hide", "Hide")}
                    </button>
                </div>

                {existingCollapsed ? (
                    <div className="text-light-600 dark:text-dark-400 px-4 py-3 text-sm">
                        {packagesLoading ? (
                            <div className="flex items-center justify-center py-2">
                                <Loader2 className="text-light-500 dark:text-light-500 h-5 w-5 animate-spin" />
                            </div>
                        ) : (
                            <div>{tr("existing_packages_collapsed_text", `${packagesList.length} packages`)}</div>
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
                                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                    selectedServiceId === null
                                        ? "border-light-700 bg-light-700 text-white dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                                        : "border-light-300 bg-white text-light-900 hover:border-light-400 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-200"
                                }`}
                            >
                                {tr("all", "All")}
                            </button>

                            {servicesWithCounts.map(({ service, count }) => (
                                <button
                                    key={service._id}
                                    type="button"
                                    onClick={() => setSelectedServiceId(service._id)}
                                    aria-pressed={selectedServiceId === service._id}
                                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                                        selectedServiceId === service._id
                                            ? "border-light-700 bg-light-700 text-white dark:border-dark-600 dark:bg-dark-700 dark:text-dark-50"
                                            : "border-light-300 bg-white text-light-900 hover:border-light-400 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-200"
                                    }`}
                                >
                                    {service.en || service.name || service.title}
                                    <span className="ml-2 inline-block rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">{count}</span>
                                </button>
                            ))}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredPackages.map((pkg, pkgIndex) => {
                                const pkgId = pkg._id || (pkg as any).id || `pkg-${pkgIndex}`;
                                return (
                                    <div
                                        key={pkgId}
                                        className="flex flex-col justify-between gap-3 rounded-2xl border border-light-200/80 bg-white px-4 py-3 text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-dark-700/80 dark:bg-dark-800"
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
                                                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-2 py-1 text-xs font-medium"
                                            >
                                                <Check size={14} />
                                                <span>{tr("edit", "Edit")}</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const ok = await showConfirm(
                                                        tr("confirm_delete", "Are you sure you want to delete this package?"),
                                                        tr("yes", "Yes"),
                                                        tr("no", "No"),
                                                    );
                                                    if (!ok) return;
                                                    setDeletingId(pkg._id);
                                                    deleteMutation.mutate(pkg._id, {
                                                        onError: () => {
                                                            setError(tr("delete_failed", "Failed to delete package"));
                                                            setDeletingId(null);
                                                        },
                                                        onSuccess: () => {
                                                            setDeletingId(null);
                                                        },
                                                    });
                                                }}
                                                className="text-danger-600 hover:bg-danger-50 dark:hover:bg-dark-700 inline-flex items-center gap-2 rounded-xl border border-transparent px-2 py-1 text-xs font-medium"
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
                                                <span className="text-danger-600">{tr("delete", "Delete")}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredPackages.length === 0 && (
                                <p className="text-light-600 dark:text-dark-400 text-sm">{tr("no_packages", "No packages found.")}</p>
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

            <div className="space-y-4 rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-6">
                <h2 className="text-light-900 dark:text-dark-50 text-lg font-semibold">{tr("package_details", "Package Details")}</h2>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                            {tr("package_name_en", "Package Name (English)")}
                        </label>
                        <input
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            placeholder={tr("package_name_en", "Package name (English)")}
                            className="input w-full"
                        />
                    </div>
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                            {tr("package_name_ar", "Package Name (Arabic)")}
                        </label>
                        <input
                            value={nameAr}
                            onChange={(e) => setNameAr(e.target.value)}
                            placeholder={tr("package_name_ar", "اسم الباقة (بالعربية)")}
                            className="input w-full"
                        />
                    </div>
                </div>
                {nameError && <p className="text-danger-500 mt-1 text-xs">{nameError}</p>}

                <div>
                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{tr("package_price", "Price")}</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={tr("package_price", "Price")}
                        className="input w-full"
                    />
                    {priceError && <p className="text-danger-500 mt-1 text-xs">{priceError}</p>}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                            {tr("package_description", "Description (Optional)")}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={tr("package_description_placeholder", "Enter package description...")}
                            rows={3}
                            className="input w-full rounded-xl"
                        />
                    </div>

                    <div>
                        <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                            {tr("package_description_ar", "Description (Arabic)")}
                        </label>
                        <textarea
                            value={descriptionAr}
                            onChange={(e) => setDescriptionAr(e.target.value)}
                            placeholder={tr("package_description_ar_placeholder", "أدخل وصف الباقة (بالعربية)...")}
                            rows={3}
                            className="input w-full rounded-xl"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">{tr("select_items", "Select Items")}</label>

                    <div className="border-light-200 dark:border-dark-700 mb-3 rounded-2xl border bg-white/50 p-3 dark:bg-dark-900/30">
                        <div className="text-light-900 dark:text-dark-50 mb-2 text-sm font-medium">
                            {tr("add_item_here", "Add Item Here")}
                        </div>
                        <div className="grid gap-2 md:grid-cols-2">
                            <input
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder={tr("item_name_en", "Item name (English)")}
                                className="input w-full"
                            />
                            <input
                                value={newItemNameAr}
                                onChange={(e) => setNewItemNameAr(e.target.value)}
                                placeholder={tr("item_name_ar", "اسم العنصر (بالعربية)")}
                                className="input w-full"
                            />
                            <input
                                value={newItemDescription}
                                onChange={(e) => setNewItemDescription(e.target.value)}
                                placeholder={tr("item_description_en", "Description (English)")}
                                className="input w-full"
                            />
                            <input
                                value={newItemDescriptionAr}
                                onChange={(e) => setNewItemDescriptionAr(e.target.value)}
                                placeholder={tr("item_description_ar", "الوصف (بالعربية)")}
                                className="input w-full"
                            />
                        </div>
                        <div className="mt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={handleCreateItemInline}
                                disabled={isCreatingItem}
                                className="btn-ghost flex items-center gap-2 rounded-xl"
                            >
                                {isCreatingItem ? (
                                    <>
                                        <Loader2 size={14} className="text-light-500 animate-spin" />
                                        {tr("creating", "Creating...")}
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        {tr("add_item", "Add Item")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {availableItems.map((item) => {
                            const isSelected = selectedItemIds.includes(item._id);

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => {
                                        setActiveChooserFor((cur) => (cur === item._id ? null : item._id));
                                    }}
                                    className={`relative flex cursor-pointer flex-col items-start justify-between gap-2 overflow-hidden rounded-2xl border px-4 py-3 text-sm transition-all duration-200 ${
                                        isSelected
                                            ? "border-light-500 bg-light-50/80 text-light-900 dark:bg-dark-900 dark:text-dark-50"
                                            : "border-light-200 text-light-900 hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 bg-white"
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
                                                                      className="input w-12 rounded-md px-1 py-0.5 text-center text-sm"
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
                                                                  className="input w-40 rounded-md px-2 py-1 text-sm"
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
                                                                  {availabilities[item._id] ? tr("true", "True") : tr("false", "False")}
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
                                                { key: "string", label: "Aa", title: tr("as_text", "Text") },
                                                { key: "availability", label: "✓", title: tr("as_availability", "Availability") },
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
                                                {tr("cancel", "Cancel")}
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
                                                placeholder={tr("item_note_placeholder", "Note...")}
                                                className="input w-full rounded-md px-2 py-1 text-xs"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {availableItems.length === 0 && (
                        <p className="text-light-600 dark:text-dark-400 text-sm">
                            {tr("no_items_available", "No items available. Please create items first.")}
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
                        className="btn-ghost rounded-xl"
                    >
                        {tr("cancel", "Cancel")}
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-primary flex items-center gap-2 rounded-xl"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2
                                    size={16}
                                    className="text-light-500 animate-spin"
                                />
                                {editPackageId ? tr("updating", "Updating...") : tr("creating", "Creating...")}
                            </>
                        ) : (
                            <>
                                {editPackageId ? <Check size={16} /> : <Plus size={16} />}
                                {editPackageId ? tr("update_package", "Update Package") : tr("create_package", "Create Package")}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddPackagePage;
