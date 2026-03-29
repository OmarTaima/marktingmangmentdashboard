import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Package as PackageIcon, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLang } from "@/hooks/useLang";
import { showAlert, showConfirm } from "@/utils/swal";
import { createItem, getItems, type Item } from "@/api/requests/itemsService";
import type { Package as PackageType } from "@/api/requests/packagesService";
import { packagesKeys, useCreatePackage, useDeletePackage, usePackages, useUpdatePackage } from "@/hooks/queries/usePackagesQuery";
import { useServices } from "@/hooks/queries";

type DisplayType = "number" | "string" | "availability";
type LocalItem = Item & { id?: string };

const AddPackagePage = () => {
    const { t } = useLang();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const tr = (key: string, fallback: string) => {
        const value = t(key);
        return !value || value === key ? fallback : value;
    };

    const [nameEn, setNameEn] = useState("");
    const [nameAr, setNameAr] = useState("");
    const [description, setDescription] = useState("");
    const [descriptionAr, setDescriptionAr] = useState("");
    const [price, setPrice] = useState("");

    const [availableItems, setAvailableItems] = useState<LocalItem[]>([]);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [displayTypes, setDisplayTypes] = useState<Record<string, DisplayType>>({});
    const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
    const [stringValues, setStringValues] = useState<Record<string, string>>({});
    const [availabilities, setAvailabilities] = useState<Record<string, boolean>>({});
    const [itemNotes, setItemNotes] = useState<Record<string, string>>({});

    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [serviceSearch, setServiceSearch] = useState("");
    const [packageSearch, setPackageSearch] = useState("");
    const [itemSearch, setItemSearch] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editPackageId, setEditPackageId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [nameError, setNameError] = useState("");
    const [priceError, setPriceError] = useState("");

    const [newItemName, setNewItemName] = useState("");
    const [newItemNameAr, setNewItemNameAr] = useState("");
    const [newItemDescription, setNewItemDescription] = useState("");
    const [newItemDescriptionAr, setNewItemDescriptionAr] = useState("");
    const [isCreatingItem, setIsCreatingItem] = useState(false);
    const [quickAddError, setQuickAddError] = useState("");

    const { data: packagesData, isLoading: packagesLoading } = usePackages({ page: 1, limit: 100 });
    const packagesList: PackageType[] = packagesData?.data || [];
    const { data: servicesData, isLoading: servicesLoading } = useServices({ limit: 1000 });
    const services = servicesData?.data || [];

    const createPackageMutation = useCreatePackage();
    const updatePackageMutation = useUpdatePackage();
    const deleteMutation = useDeletePackage();

    const getItemId = (item: any): string => String(item?._id || item?.id || "");

    const normalizeItem = (raw: any): LocalItem | null => {
        const source = raw?.item || raw?.data || raw;
        const id = getItemId(source);
        if (!id) return null;

        return {
            ...(source || {}),
            _id: id,
            id,
            name: source?.name || source?.en || source?.title || "",
            ar: source?.ar || source?.nameAr || "",
            description: source?.description,
            descriptionAr: source?.descriptionAr,
        } as LocalItem;
    };

    const loadItems = async () => {
        setItemsLoading(true);
        setError("");
        try {
            const response = await getItems({ page: 1, limit: 200 });
            const normalized = (response.data || []).map((it: any) => normalizeItem(it)).filter(Boolean) as LocalItem[];
            setAvailableItems(normalized);
        } catch (err: any) {
            setError(err?.response?.data?.message || tr("items_load_failed", "Failed to load items"));
        } finally {
            setItemsLoading(false);
        }
    };

    useEffect(() => {
        loadItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getServiceId = (service: any): string => String(service?._id || service?.id || "");

    const packageMatchesService = (pkg: PackageType, serviceId: string) => {
        const maybeService = (pkg as any)?.service;
        const maybeServiceId = (pkg as any)?.serviceId;

        if (!serviceId) return false;
        if (typeof maybeService === "string") return maybeService === serviceId;
        if (maybeService && typeof maybeService === "object") {
            const id = String((maybeService as any)?._id || (maybeService as any)?.id || "");
            return id === serviceId;
        }

        return String(maybeServiceId || "") === serviceId;
    };

    const serviceCards = useMemo(() => {
        return services
            .map((service: any) => {
                const serviceId = getServiceId(service);
                const byPackages = serviceId ? packagesList.filter((pkg) => packageMatchesService(pkg, serviceId)).length : 0;
                const byEmbedded = Array.isArray(service?.packages) ? service.packages.length : 0;
                const count = byPackages > 0 ? byPackages : byEmbedded;
                return {
                    service,
                    serviceId,
                    count,
                    label: String(service?.en || service?.ar || service?.name || tr("service", "Service")),
                };
            })
            .filter((entry) => {
                if (!serviceSearch.trim()) return true;
                return entry.label.toLowerCase().includes(serviceSearch.trim().toLowerCase());
            });
    }, [services, packagesList, serviceSearch]);

    const filteredPackages = useMemo(() => {
        let baseList: PackageType[] = packagesList;

        if (selectedServiceId) {
            const directMatches = packagesList.filter((pkg) => packageMatchesService(pkg, selectedServiceId));

            if (directMatches.length > 0) {
                baseList = directMatches;
            } else {
                const selectedService: any = services.find((service: any) => getServiceId(service) === selectedServiceId);

                if (selectedService && Array.isArray(selectedService.packages) && selectedService.packages.length > 0) {
                    baseList = selectedService.packages.map((sp: any) => {
                        const found = packagesList.find((pkg) => pkg._id === (sp?._id || sp?.id));
                        if (found) return found;

                        return {
                            _id: String(sp?._id || sp?.id || Math.random()),
                            nameEn: String(sp?.nameEn || sp?.en || sp?.name || ""),
                            nameAr: String(sp?.nameAr || sp?.ar || ""),
                            price: Number(sp?.price) || 0,
                            description: sp?.description || sp?.desc || "",
                            descriptionAr: sp?.descriptionAr || "",
                            items: Array.isArray(sp?.items) ? sp.items : [],
                        } as PackageType;
                    });
                }
            }
        }

        return baseList.filter((pkg) => {
            if (!packageSearch.trim()) return true;
            const q = packageSearch.trim().toLowerCase();
            const en = (pkg.nameEn || "").toLowerCase();
            const ar = (pkg.nameAr || "").toLowerCase();
            const desc = (pkg.description || "").toLowerCase();
            return en.includes(q) || ar.includes(q) || desc.includes(q);
        });
    }, [packagesList, selectedServiceId, packageSearch, services]);

    const filteredItems = useMemo(() => {
        if (!itemSearch.trim()) return availableItems;
        const q = itemSearch.trim().toLowerCase();
        return availableItems.filter((item) => {
            const name = (item.name || "").toLowerCase();
            const ar = (item.ar || "").toLowerCase();
            const desc = (item.description || "").toLowerCase();
            return name.includes(q) || ar.includes(q) || desc.includes(q);
        });
    }, [availableItems, itemSearch]);

    const selectedServiceLabel = useMemo(() => {
        if (!selectedServiceId) return tr("all_services", "All Services");
        const selected = serviceCards.find((entry) => entry.serviceId === selectedServiceId);
        return selected?.label || tr("service", "Service");
    }, [selectedServiceId, serviceCards, tr]);

    const resetForm = () => {
        setEditPackageId(null);
        setNameEn("");
        setNameAr("");
        setDescription("");
        setDescriptionAr("");
        setPrice("");
        setSelectedItemIds([]);
        setDisplayTypes({});
        setItemQuantities({});
        setStringValues({});
        setAvailabilities({});
        setItemNotes({});
        setNameError("");
        setPriceError("");
    };

    const startEditPackage = (pkg: PackageType) => {
        setEditPackageId(pkg._id);
        setNameEn(pkg.nameEn || "");
        setNameAr(pkg.nameAr || "");
        setDescription(pkg.description || "");
        setDescriptionAr(pkg.descriptionAr || "");
        setPrice(pkg.price?.toString() || "");

        const ids: string[] = [];
        const quantities: Record<string, number> = {};
        const types: Record<string, DisplayType> = {};
        const strings: Record<string, string> = {};
        const bools: Record<string, boolean> = {};
        const notes: Record<string, string> = {};

        (pkg.items || []).forEach((entry: any) => {
            const itemObj = entry?.item || entry;
            const id = String(itemObj?._id || itemObj?.id || itemObj || "");
            if (!id) return;

            ids.push(id);

            if (typeof entry?.quantity === "number") {
                types[id] = "number";
                quantities[id] = Math.max(1, Number(entry.quantity) || 1);
            } else if (typeof entry?.quantity === "string") {
                types[id] = "string";
                strings[id] = entry.quantity;
            } else if (typeof entry?.quantity === "boolean") {
                types[id] = "availability";
                bools[id] = entry.quantity;
            } else {
                types[id] = "number";
                quantities[id] = 1;
            }

            notes[id] = typeof entry?.note === "string" ? entry.note : "";
        });

        setSelectedItemIds(ids);
        setDisplayTypes(types);
        setItemQuantities(quantities);
        setStringValues(strings);
        setAvailabilities(bools);
        setItemNotes(notes);
        setNameError("");
        setPriceError("");
        setError("");

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const removeItemSelection = (itemId: string) => {
        setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
        setDisplayTypes((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
        setItemQuantities((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
        setStringValues((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
        setAvailabilities((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
        setItemNotes((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
    };

    const setItemSelected = (itemId: string, selected: boolean) => {
        if (!selected) {
            removeItemSelection(itemId);
            return;
        }

        setSelectedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
        setDisplayTypes((prev) => ({ ...prev, [itemId]: prev[itemId] || "number" }));
        setItemQuantities((prev) => ({ ...prev, [itemId]: prev[itemId] || 1 }));
    };

    const setDisplayType = (itemId: string, nextType: DisplayType) => {
        setDisplayTypes((prev) => ({ ...prev, [itemId]: nextType }));
        if (nextType === "number") {
            setItemQuantities((prev) => ({ ...prev, [itemId]: prev[itemId] || 1 }));
        }
        if (nextType === "string") {
            setStringValues((prev) => ({ ...prev, [itemId]: prev[itemId] || "" }));
        }
        if (nextType === "availability") {
            setAvailabilities((prev) => ({ ...prev, [itemId]: prev[itemId] ?? true }));
        }
    };

    const buildItemsPayload = () => {
        return selectedItemIds
            .filter((itemId) => !itemId.startsWith("temp-item-"))
            .map((itemId) => {
            const type = displayTypes[itemId] || "number";
            let quantity: number | string | boolean = itemQuantities[itemId] || 1;

            if (type === "string") {
                quantity = stringValues[itemId] || "";
            }
            if (type === "availability") {
                quantity = !!availabilities[itemId];
            }

            return {
                item: itemId,
                quantity,
                note: (itemNotes[itemId] || "").trim() || undefined,
            };
        });
    };

    const handleSubmit = async () => {
        const en = nameEn.trim();
        const ar = nameAr.trim();
        const p = price.trim();
        const itemsPayload = buildItemsPayload();

        if (!en) {
            setNameError(tr("package_name_required", "Package name is required"));
            return;
        }

        const normalizedAr = ar || en;

        const enHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(en);
        const arHasLatin = /[A-Za-z]/.test(normalizedAr);
        if (enHasArabic) {
            setNameError(tr("english_only", "Please enter English text only in English field."));
            return;
        }
        if (ar && arHasLatin) {
            setNameError(tr("arabic_only", "Please enter Arabic text only in Arabic field."));
            return;
        }
        setNameError("");

        if (!p || Number.isNaN(Number(p)) || Number(p) <= 0) {
            setPriceError(tr("invalid_price", "Please enter a valid price."));
            return;
        }
        setPriceError("");

        if (itemsPayload.length === 0) {
            setError(tr("select_items", "Please select at least one item for the package"));
            return;
        }

        setIsSubmitting(true);
        setError("");

        const payload = {
            nameEn: en,
            nameAr: normalizedAr,
            price: Number(p),
            description: description.trim() || undefined,
            descriptionAr: descriptionAr.trim() || undefined,
            items: itemsPayload,
        };

        try {
            if (editPackageId) {
                await updatePackageMutation.mutateAsync({ id: editPackageId, data: payload });
                await showAlert(tr("package_updated_success", "Package updated successfully"), "success");
            } else {
                await createPackageMutation.mutateAsync(payload);
                await showAlert(tr("package_created_success", "Package created successfully"), "success");
            }

            queryClient.invalidateQueries({ queryKey: packagesKeys.lists() });
            navigate("/packages");
        } catch (err: any) {
            setError(err?.response?.data?.message || tr("package_save_failed", "Failed to save package"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateItemInline = async () => {
        const en = newItemName.trim();
        const ar = newItemNameAr.trim();
        const descriptionEn = newItemDescription.trim();
        const descriptionArabic = newItemDescriptionAr.trim();
        setQuickAddError("");

        if (!en) {
            const msg = tr("item_name_required", "Item name is required");
            setError(msg);
            setQuickAddError(msg);
            return;
        }

        const enHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(en);
        const arHasLatin = /[A-Za-z]/.test(ar);
        if (enHasArabic) {
            const msg = tr("english_only", "Please enter English text only in English field.");
            setError(msg);
            setQuickAddError(msg);
            return;
        }
        if (ar && arHasLatin) {
            const msg = tr("arabic_only", "Please enter Arabic text only in Arabic field.");
            setError(msg);
            setQuickAddError(msg);
            return;
        }

        setIsCreatingItem(true);
        setError("");
        setQuickAddError("");

        const tempId = `temp-item-${Date.now()}`;
        const optimisticItem: LocalItem = {
            _id: tempId,
            id: tempId,
            name: en,
            ar,
            description: descriptionEn || undefined,
            descriptionAr: descriptionArabic || undefined,
        };

        // Show item instantly in UI while request is in flight.
        setAvailableItems((prev) => [optimisticItem, ...prev]);
        setSelectedItemIds((prev) => (prev.includes(tempId) ? prev : [...prev, tempId]));
        setDisplayTypes((prev) => ({ ...prev, [tempId]: prev[tempId] || "number" }));
        setItemQuantities((prev) => ({ ...prev, [tempId]: prev[tempId] || 1 }));
        setItemSearch("");

        setNewItemName("");
        setNewItemNameAr("");
        setNewItemDescription("");
        setNewItemDescriptionAr("");

        try {
            const created = await createItem({
                name: en,
                ar,
                description: descriptionEn || undefined,
                descriptionAr: descriptionArabic || undefined,
            });

            const createdItem = normalizeItem(created);
            const createdId = createdItem?._id || "";

            if (createdItem && createdId) {
                setAvailableItems((prev) => {
                    const withoutTemp = prev.filter((item) => getItemId(item) !== tempId);
                    if (withoutTemp.some((item) => getItemId(item) === createdId)) return withoutTemp;
                    return [createdItem, ...withoutTemp];
                });

                setSelectedItemIds((prev) => {
                    const replaced = prev.map((id) => (id === tempId ? createdId : id));
                    return replaced.includes(createdId) ? replaced.filter((id, idx) => replaced.indexOf(id) === idx) : [...replaced, createdId];
                });

                setDisplayTypes((prev) => {
                    const tempType = prev[tempId] || "number";
                    const next = { ...prev, [createdId]: prev[createdId] || tempType };
                    delete next[tempId];
                    return next;
                });

                setItemQuantities((prev) => {
                    const tempValue = prev[tempId] || 1;
                    const next = { ...prev, [createdId]: prev[createdId] || tempValue };
                    delete next[tempId];
                    return next;
                });

                setStringValues((prev) => {
                    if (!(tempId in prev)) return prev;
                    const next = { ...prev, [createdId]: prev[createdId] || prev[tempId] };
                    delete next[tempId];
                    return next;
                });

                setAvailabilities((prev) => {
                    if (!(tempId in prev)) return prev;
                    const next = { ...prev, [createdId]: prev[createdId] ?? prev[tempId] };
                    delete next[tempId];
                    return next;
                });

                setItemNotes((prev) => {
                    if (!(tempId in prev)) return prev;
                    const next = { ...prev, [createdId]: prev[createdId] || prev[tempId] };
                    delete next[tempId];
                    return next;
                });
            } else {
                // If server response shape is unexpected, remove temp and reload canonical list.
                setAvailableItems((prev) => prev.filter((item) => getItemId(item) !== tempId));
                setSelectedItemIds((prev) => prev.filter((id) => id !== tempId));
            }

            // Sync with backend list ordering in background.
            void loadItems();
        } catch (err: any) {
            const msg = err?.response?.data?.message || tr("item_create_failed", "Failed to create item");
            setError(msg);
            setQuickAddError(msg);

            // Rollback optimistic UI if create fails.
            setAvailableItems((prev) => prev.filter((item) => getItemId(item) !== tempId));
            setSelectedItemIds((prev) => prev.filter((id) => id !== tempId));
            setDisplayTypes((prev) => {
                const next = { ...prev };
                delete next[tempId];
                return next;
            });
            setItemQuantities((prev) => {
                const next = { ...prev };
                delete next[tempId];
                return next;
            });
            setStringValues((prev) => {
                const next = { ...prev };
                delete next[tempId];
                return next;
            });
            setAvailabilities((prev) => {
                const next = { ...prev };
                delete next[tempId];
                return next;
            });
            setItemNotes((prev) => {
                const next = { ...prev };
                delete next[tempId];
                return next;
            });
        } finally {
            setIsCreatingItem(false);
        }
    };

    const handleDelete = async (pkgId: string) => {
        const confirmed = await showConfirm(
            tr("confirm_delete", "Are you sure you want to delete this package?"),
            tr("yes", "Yes"),
            tr("no", "No"),
        );
        if (!confirmed) return;

        setDeletingId(pkgId);
        deleteMutation.mutate(pkgId, {
            onSuccess: () => {
                setDeletingId(null);
            },
            onError: () => {
                setDeletingId(null);
                setError(tr("delete_failed", "Failed to delete package"));
            },
        });
    };

    const selectedCount = selectedItemIds.length;
    const hasPendingTempItems = selectedItemIds.some((id) => id.startsWith("temp-item-"));

    if (itemsLoading && packagesLoading && servicesLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-light-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4 pb-10 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-light-200/70 bg-white/90 p-6 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-8">
                <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-secdark-700/15 blur-3xl" />
                <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-light-400/20 blur-3xl" />

                <div className="relative flex flex-col gap-3">
                    <span className="inline-flex w-fit items-center rounded-full border border-light-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-light-700 dark:border-dark-600 dark:bg-dark-900/70 dark:text-dark-200">
                        {tr("packages_workspace", "Packages Workspace")}
                    </span>

                    <h1 className="title text-2xl sm:text-3xl">{tr("create_package", "Create Package")}</h1>
                    <p className="text-sm text-light-600 dark:text-dark-300 sm:text-base">
                        {tr(
                            "package_workspace_subtitle",
                            "Manage services and packages in one practical workspace, then build a package with selected items.",
                        )}
                    </p>
                </div>
            </section>

            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <div className="text-xs uppercase tracking-[0.08em] text-light-600 dark:text-dark-300">{tr("services", "Services")}</div>
                    <div className="mt-2 text-2xl font-semibold text-light-900 dark:text-dark-50">{services.length}</div>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <div className="text-xs uppercase tracking-[0.08em] text-light-600 dark:text-dark-300">{tr("packages", "Packages")}</div>
                    <div className="mt-2 text-2xl font-semibold text-light-900 dark:text-dark-50">{packagesList.length}</div>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <div className="text-xs uppercase tracking-[0.08em] text-light-600 dark:text-dark-300">{tr("filtered", "Filtered")}</div>
                    <div className="mt-2 text-2xl font-semibold text-light-900 dark:text-dark-50">{filteredPackages.length}</div>
                </div>
                <div className="rounded-2xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/60">
                    <div className="text-xs uppercase tracking-[0.08em] text-light-600 dark:text-dark-300">{tr("selected_items", "Selected Items")}</div>
                    <div className="mt-2 text-2xl font-semibold text-light-900 dark:text-dark-50">{selectedCount}</div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                <aside className="rounded-3xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-light-900 dark:text-dark-50">{tr("services", "Services")}</h2>
                        <span className="rounded-full bg-light-100 px-2.5 py-1 text-xs font-semibold text-light-700 dark:bg-dark-800 dark:text-dark-200">
                            {serviceCards.length}
                        </span>
                    </div>

                    <div className="relative mb-3">
                        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-light-500" />
                        <input
                            value={serviceSearch}
                            onChange={(e) => setServiceSearch(e.target.value)}
                            placeholder={tr("search_services", "Search services")}
                            className="input w-full pl-9"
                        />
                    </div>

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setSelectedServiceId(null)}
                            className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${
                                selectedServiceId === null
                                    ? "border-light-700 bg-light-700 text-white dark:border-dark-600 dark:bg-dark-700"
                                    : "border-light-200 bg-white text-light-900 hover:border-light-400 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-100"
                            }`}
                        >
                            {tr("all_services", "All Services")}
                        </button>

                        <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
                            {serviceCards.map((entry) => (
                                <button
                                    key={entry.serviceId || entry.label}
                                    type="button"
                                    onClick={() => setSelectedServiceId(entry.serviceId || null)}
                                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition ${
                                        selectedServiceId === entry.serviceId
                                            ? "border-light-700 bg-light-700 text-white dark:border-dark-600 dark:bg-dark-700"
                                            : "border-light-200 bg-white text-light-900 hover:border-light-400 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-100"
                                    }`}
                                >
                                    <span className="truncate">{entry.label}</span>
                                    <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs dark:bg-white/10">{entry.count}</span>
                                </button>
                            ))}
                        </div>

                        {serviceCards.length === 0 && (
                            <p className="px-2 py-4 text-sm text-light-600 dark:text-dark-400">{tr("no_services", "No services found.")}</p>
                        )}
                    </div>
                </aside>

                <div className="space-y-4">
                    <div className="rounded-3xl border border-light-200/70 bg-white/90 p-4 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-light-900 dark:text-dark-50">{tr("packages", "Packages")}</h2>
                                <p className="text-sm text-light-600 dark:text-dark-400">
                                    {tr("showing_for", "Showing for")}: <span className="font-medium">{selectedServiceLabel}</span>
                                </p>
                            </div>

                            <div className="relative w-full sm:max-w-xs">
                                <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-light-500" />
                                <input
                                    value={packageSearch}
                                    onChange={(e) => setPackageSearch(e.target.value)}
                                    placeholder={tr("search_packages", "Search packages")}
                                    className="input w-full pl-9"
                                />
                            </div>
                        </div>

                        {packagesLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-light-500" />
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {filteredPackages.map((pkg) => {
                                    const pkgId = String(pkg._id || "");
                                    const itemsCount = Array.isArray(pkg.items) ? pkg.items.length : 0;

                                    return (
                                        <article
                                            key={pkgId}
                                            className="group flex h-full flex-col justify-between rounded-2xl border border-light-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-dark-700/80 dark:bg-dark-800"
                                        >
                                            <div>
                                                <div className="mb-2 flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-base font-semibold text-light-900 dark:text-dark-50">
                                                            {pkg.nameEn || pkg.nameAr || tr("unnamed_package", "Unnamed package")}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-light-600 dark:text-dark-400">{itemsCount} {tr("items", "items")}</p>
                                                    </div>
                                                    <div className="rounded-xl bg-light-100 px-2.5 py-1 text-xs font-semibold text-light-700 dark:bg-dark-700 dark:text-dark-200">
                                                        {pkg.price ? `${pkg.price} EGP` : "-"}
                                                    </div>
                                                </div>

                                                {pkg.description && (
                                                    <p className="line-clamp-2 text-xs text-light-600 dark:text-dark-400">{pkg.description}</p>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEditPackage(pkg)}
                                                    className="btn-ghost inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs"
                                                >
                                                    <Check size={14} />
                                                    {tr("edit", "Edit")}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(pkgId)}
                                                    disabled={deletingId === pkgId}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-danger-200 px-2.5 py-1.5 text-xs font-medium text-danger-600 transition hover:bg-danger-50 disabled:opacity-60 dark:border-danger-800/60 dark:hover:bg-danger-900/20"
                                                >
                                                    {deletingId === pkgId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                                    {tr("delete", "Delete")}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}

                                {filteredPackages.length === 0 && (
                                    <div className="col-span-full rounded-2xl border border-dashed border-light-300 bg-light-50/70 px-4 py-10 text-center text-sm text-light-600 dark:border-dark-700 dark:bg-dark-900/30 dark:text-dark-300">
                                        {tr("no_packages", "No packages found for this filter.")}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {error && (
                <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-800 dark:bg-danger-900/20 dark:text-danger-200">
                    {error}
                </div>
            )}

            <section className="rounded-3xl border border-light-200/70 bg-white/90 p-5 shadow-sm dark:border-dark-700/70 dark:bg-dark-900/65 sm:p-6">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-light-900 dark:text-dark-50">
                            {editPackageId ? tr("edit_package", "Edit Package") : tr("package_builder", "Package Builder")}
                        </h2>
                        <p className="text-sm text-light-600 dark:text-dark-400">
                            {tr("builder_subtitle", "Create or update package details and choose exactly how each item is represented.")}
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-light-200 bg-white px-3 py-1.5 text-xs font-semibold text-light-700 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200">
                        <PackageIcon size={14} />
                        {selectedCount} {tr("items_selected", "items selected")}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm text-dark-700 dark:text-dark-400">{tr("package_name_en", "Package Name (English)")}</label>
                                <input
                                    value={nameEn}
                                    onChange={(e) => setNameEn(e.target.value)}
                                    placeholder={tr("package_name_en", "Package Name (English)")}
                                    className="input w-full"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm text-dark-700 dark:text-dark-400">{tr("package_name_ar", "Package Name (Arabic)")}</label>
                                <input
                                    value={nameAr}
                                    onChange={(e) => setNameAr(e.target.value)}
                                    placeholder={tr("package_name_ar", "اسم الباقة (بالعربية)")}
                                    className="input w-full"
                                />
                            </div>
                        </div>

                        {nameError && <p className="text-xs text-danger-500">{nameError}</p>}

                        <div>
                            <label className="mb-1.5 block text-sm text-dark-700 dark:text-dark-400">{tr("package_price", "Price")}</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder={tr("package_price", "Price")}
                                className="input w-full"
                            />
                            {priceError && <p className="mt-1 text-xs text-danger-500">{priceError}</p>}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm text-dark-700 dark:text-dark-400">{tr("package_description", "Description")}</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={tr("package_description_placeholder", "Describe the package")}
                                    rows={4}
                                    className="input w-full rounded-xl"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm text-dark-700 dark:text-dark-400">
                                    {tr("package_description_ar", "Description (Arabic)")}
                                </label>
                                <textarea
                                    value={descriptionAr}
                                    onChange={(e) => setDescriptionAr(e.target.value)}
                                    placeholder={tr("package_description_ar_placeholder", "اكتب وصف الباقة")}
                                    rows={4}
                                    className="input w-full rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-light-200/80 bg-light-50/60 p-4 dark:border-dark-700/80 dark:bg-dark-900/30">
                            <h3 className="mb-3 text-sm font-semibold text-light-900 dark:text-dark-50">{tr("quick_add_item", "Quick Add Item")}</h3>

                            <div className="grid gap-2 md:grid-cols-2">
                                <input
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder={tr("item_name_en", "Item Name (English)")}
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

                            {quickAddError && <p className="mt-2 text-xs text-danger-500">{quickAddError}</p>}

                            <div className="mt-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleCreateItemInline}
                                    disabled={isCreatingItem}
                                    className="btn-ghost inline-flex items-center gap-2 rounded-xl"
                                >
                                    {isCreatingItem ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                                    {isCreatingItem ? tr("creating", "Creating...") : tr("add_item", "Add Item")}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-light-900 dark:text-dark-50">{tr("select_items", "Select Items")}</h3>
                            <div className="relative w-full max-w-xs">
                                <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-light-500" />
                                <input
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                    placeholder={tr("search_items", "Search items")}
                                    className="input w-full pl-9"
                                />
                            </div>
                        </div>

                        <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                            {itemsLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="h-6 w-6 animate-spin text-light-500" />
                                </div>
                            ) : (
                                filteredItems.map((item) => {
                                    const isSelected = selectedItemIds.includes(item._id);
                                    const selectedType = displayTypes[item._id] || "number";

                                    return (
                                        <div
                                            key={item._id}
                                            className={`rounded-2xl border p-3 transition ${
                                                isSelected
                                                    ? "border-light-400 bg-light-50/70 dark:border-secdark-600 dark:bg-dark-900/40"
                                                    : "border-light-200 bg-white dark:border-dark-700 dark:bg-dark-800"
                                            }`}
                                        >
                                            <label className="flex cursor-pointer items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => setItemSelected(item._id, e.target.checked)}
                                                    className="mt-1 h-4 w-4 rounded border-light-300"
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-sm font-medium text-light-900 dark:text-dark-50">{item.name}</span>
                                                    {item.description && (
                                                        <span className="mt-0.5 block text-xs text-light-600 dark:text-dark-400">{item.description}</span>
                                                    )}
                                                </span>
                                            </label>

                                            {isSelected && (
                                                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    <div>
                                                        <label className="mb-1 block text-xs text-light-600 dark:text-dark-400">{tr("type", "Type")}</label>
                                                        <select
                                                            value={selectedType}
                                                            onChange={(e) => setDisplayType(item._id, e.target.value as DisplayType)}
                                                            className="input w-full"
                                                        >
                                                            <option value="number">{tr("number", "Number")}</option>
                                                            <option value="string">{tr("text", "Text")}</option>
                                                            <option value="availability">{tr("availability", "Availability")}</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="mb-1 block text-xs text-light-600 dark:text-dark-400">{tr("value", "Value")}</label>

                                                        {selectedType === "number" && (
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={itemQuantities[item._id] || 1}
                                                                onChange={(e) => {
                                                                    const next = Math.max(1, Number(e.target.value) || 1);
                                                                    setItemQuantities((prev) => ({ ...prev, [item._id]: next }));
                                                                }}
                                                                className="input w-full"
                                                            />
                                                        )}

                                                        {selectedType === "string" && (
                                                            <input
                                                                value={stringValues[item._id] || ""}
                                                                onChange={(e) => setStringValues((prev) => ({ ...prev, [item._id]: e.target.value }))}
                                                                placeholder={tr("text_value", "Text value")}
                                                                className="input w-full"
                                                            />
                                                        )}

                                                        {selectedType === "availability" && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setAvailabilities((prev) => ({ ...prev, [item._id]: !prev[item._id] }))}
                                                                className={`flex h-10 w-full items-center justify-center rounded-xl border text-sm font-medium transition ${
                                                                    availabilities[item._id]
                                                                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800/50 dark:bg-green-900/20 dark:text-green-300"
                                                                        : "border-light-300 bg-white text-light-700 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-200"
                                                                }`}
                                                            >
                                                                {availabilities[item._id] ? tr("available", "Available") : tr("not_available", "Not Available")}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="sm:col-span-2 lg:col-span-1">
                                                        <label className="mb-1 block text-xs text-light-600 dark:text-dark-400">{tr("note", "Note")}</label>
                                                        <input
                                                            value={itemNotes[item._id] || ""}
                                                            onChange={(e) => setItemNotes((prev) => ({ ...prev, [item._id]: e.target.value }))}
                                                            placeholder={tr("item_note_placeholder", "Optional note")}
                                                            className="input w-full"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {!itemsLoading && filteredItems.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-light-300 bg-light-50/70 px-4 py-8 text-center text-sm text-light-600 dark:border-dark-700 dark:bg-dark-900/30 dark:text-dark-300">
                                    {tr("no_items_available", "No items available.")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (editPackageId) {
                                resetForm();
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
                        disabled={isSubmitting || createPackageMutation.isPending || updatePackageMutation.isPending}
                        className="btn-primary inline-flex items-center gap-2 rounded-xl"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editPackageId ? <Check size={16} /> : <Plus size={16} />}
                        {isSubmitting
                            ? editPackageId
                                ? tr("updating", "Updating...")
                                : tr("creating", "Creating...")
                            : editPackageId
                              ? tr("update_package", "Update Package")
                              : tr("create_package", "Create Package")}
                    </button>
                </div>

                {hasPendingTempItems && (
                    <p className="mt-2 text-right text-xs text-light-600 dark:text-dark-400">
                        {tr("pending_items_note", "Some quick-added items are still syncing and will be included once ready.")}
                    </p>
                )}
            </section>
        </div>
    );
};

export default AddPackagePage;