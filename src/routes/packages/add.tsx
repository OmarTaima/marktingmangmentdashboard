import { useEffect, useState } from "react";
import { Plus, Minus, Edit2, Trash2, Check, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const AddPackagePage = () => {
    const { t, lang } = useLang();
    type Feature = { en?: string; ar?: string; quantity?: string; fromServiceId?: string };
    type PackageDef = {
        id?: string;
        en?: string;
        ar?: string;
        description?: any;
        price?: string;
        discount?: string;
        discountType?: string;
        features?: Feature[];
    };

    const [packages, setPackages] = useState<PackageDef[]>([]);
    const [nameEn, setNameEn] = useState<string>("");
    const [nameAr, setNameAr] = useState<string>("");
    const [descriptionEn, setDescriptionEn] = useState<string>("");
    const [descriptionAr, setDescriptionAr] = useState<string>("");
    const [price, setPrice] = useState<string>("");
    const [discount, setDiscount] = useState<string>("");
    const [discountType, setDiscountType] = useState<string>("percentage");
    const [featureInputEn, setFeatureInputEn] = useState<string>("");
    const [featureInputAr, setFeatureInputAr] = useState<string>("");
    const [featureQuantity, setFeatureQuantity] = useState<string>("");
    // features now stored as array of {en, ar, quantity}
    const [features, setFeatures] = useState<Feature[]>([]);
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number>(-1);
    const [nameError, setNameError] = useState<string>("");
    const [featureError, setFeatureError] = useState<string>("");
    const [priceError, setPriceError] = useState<string>("");
    const [discountError, setDiscountError] = useState<string>("");

    useEffect(() => {
        try {
            const stored = localStorage.getItem("packages_master");
            if (stored) {
                const parsed = JSON.parse(stored) || [];
                // normalize features to {en, ar, quantity} objects for backward compatibility
                const normalized = parsed.map((pkg: any) => {
                    const next = { ...pkg };
                    if (Array.isArray(next.features)) {
                        next.features = next.features.map((f: any) => {
                            if (!f) return { en: "", ar: "", quantity: "" };
                            if (typeof f === "string") return { en: f, ar: f, quantity: "" };
                            if (typeof f === "object") return { en: f.en || f.text || "", ar: f.ar || f.en || "", quantity: f.quantity || "" };
                            return { en: String(f), ar: String(f), quantity: "" };
                        });
                    } else {
                        next.features = [];
                    }
                    // normalize description to {en, ar} when loading from storage (support string or object)
                    try {
                        if (typeof next.description === "string") {
                            next.description = { en: next.description || "", ar: next.description || "" };
                        } else if (next.description && typeof next.description === "object") {
                            next.description = {
                                en: next.description.en || next.description?.en || "",
                                ar: next.description.ar || next.description?.ar || next.description.en || "",
                            };
                        } else {
                            next.description = { en: "", ar: "" };
                        }
                    } catch (e) {
                        next.description = { en: "", ar: "" };
                    }
                    return next;
                });
                setPackages(normalized);
            } else setPackages([]);
        } catch (e) {
            setPackages([]);
        }
        // also load available services for quick-adding to packages
        try {
            const svcRaw = localStorage.getItem("services_master");
            if (svcRaw) {
                const parsed = JSON.parse(svcRaw) || [];
                const svcnorm = parsed
                    .map((s: any, idx: number) => {
                        if (!s) return null;
                        if (typeof s === "string")
                            return {
                                id: `svc_${idx}_${Date.now()}`,
                                en: s,
                                ar: "",
                                category: "other",
                                discount: "",
                                discountType: "percentage",
                                description: "",
                            };
                        return s.id
                            ? {
                                  ...s,
                                  category: s.category || "other",
                                  // When adding services into a package, do not carry over service-level pricing or discounts.
                                  // Package totals should be controlled by the package price, not individual service prices.
                                  price: "",
                                  discount: "",
                                  discountType: "percentage",
                                  description: s.description || "",
                              }
                            : {
                                  id: `svc_${idx}_${Date.now()}`,
                                  en: s.en || "",
                                  ar: s.ar || "",
                                  // don't include service price/discount in package add view
                                  price: "",
                                  category: s.category || "other",
                                  discount: "",
                                  discountType: "percentage",
                                  description: s.description || "",
                              };
                    })
                    .filter(Boolean);
                setAvailableServices(svcnorm);
            } else setAvailableServices([]);
        } catch (e) {
            setAvailableServices([]);
        }
    }, []);

    const persist = (next: PackageDef[]) => {
        setPackages(next);
        try {
            localStorage.setItem("packages_master", JSON.stringify(next));
        } catch (e) {}
    };

    const addFeature = () => {
        const en = (featureInputEn || "").trim();
        const ar = (featureInputAr || "").trim();
        const qty = (featureQuantity || "").trim();
        // allow adding features even when english/arabic fields are empty (no required inputs)
        // language checks: english input must not contain Arabic chars; arabic input must not contain Latin letters
        const containsArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(en);
        const containsLatinInAr = /[A-Za-z]/.test(ar);
        if (en && containsArabic) {
            setFeatureError(t("english_only") || "Please enter English text only in this field.");
            return;
        }
        if (ar && containsLatinInAr) {
            setFeatureError(t("arabic_only") || "Please enter Arabic text only in this field.");
            return;
        }
        setFeatureError("");
        const fobj = { en: en || ar, ar: ar || en, quantity: qty };
        // avoid duplicate features by english text
        if (features.some((x) => (x.en || "").toLowerCase() === (fobj.en || "").toLowerCase())) {
            setFeatureInputEn("");
            setFeatureInputAr("");
            setFeatureQuantity("");
            return;
        }
        setFeatures((prev) => [...prev, fobj]);
        setFeatureInputEn("");
        setFeatureInputAr("");
        setFeatureQuantity("");
    };

    const isServiceSelected = (id: string) => selectedServiceIds.includes(id);

    const toggleServiceSelection = (svc: any) => {
        const id = svc.id as string;
        const already = selectedServiceIds.includes(id);
        if (already) {
            // remove selection
            setSelectedServiceIds((prev) => prev.filter((x) => x !== id));
            // remove corresponding feature if it was added from this service
            setFeatures((prev) => prev.filter((f) => f.fromServiceId !== id));
            return;
        }
        // add selection
        setSelectedServiceIds((prev) => [...prev, id]);
        // add feature corresponding to service if not already present
        const en = svc.en || svc.name || "";
        const ar = svc.ar || svc.en || "";
        if (!features.some((x) => (x.en || "").toLowerCase() === (en || "").toLowerCase())) {
            // default quantity when adding from services: 1 (adjustable below)
            const fobj = { en: en, ar: ar, quantity: "1", fromServiceId: id };
            setFeatures((prev) => [...prev, fobj]);
        }
    };

    const updateFeatureQuantity = (idx: number, val: any) => {
        // normalize value to a positive integer (min 1)
        const raw = String(val || "").replace(/[^0-9]/g, "");
        const n = Math.max(1, Number(raw || 1));
        setFeatures((prev) => {
            const next = prev.slice();
            next[idx] = { ...(next[idx] || {}), quantity: String(n) };
            return next;
        });
    };

    const changeFeatureQuantity = (idx: number, delta: number) => {
        setFeatures((prev) => {
            const next = prev.slice();
            const cur = Number(next[idx]?.quantity) || 0;
            const nv = Math.max(1, cur + delta);
            next[idx] = { ...(next[idx] || {}), quantity: String(nv) };
            return next;
        });
    };

    const removeFeature = (idx: number) => {
        setFeatures((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleAddPackage = () => {
        const en = (nameEn || "").trim();
        const ar = (nameAr || "").trim();
        const p = (price || "").trim();
        const disc = (discount || "").trim();
        // allow creating package even when name fields are empty (no required inputs)
        // validate language of names
        const nameHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(en);
        const nameHasLatinInAr = /[A-Za-z]/.test(ar);
        if (en && nameHasArabic) {
            setNameError(t("english_only") || "Please enter English text only in this field.");
            return;
        }
        if (ar && nameHasLatinInAr) {
            setNameError(t("arabic_only") || "Please enter Arabic text only in this field.");
            return;
        }
        setNameError("");
        // validate price
        if (p && isNaN(Number(p))) {
            setPriceError(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        setPriceError("");
        // validate discount
        if (disc) {
            const discNum = Number(disc);
            if (isNaN(discNum) || discNum < 0) {
                setDiscountError(t("invalid_discount") || "Please enter a valid discount.");
                return;
            }
            if (discountType === "percentage" && (discNum < 0 || discNum > 100)) {
                setDiscountError(t("invalid_discount_percentage") || "Percentage must be between 0 and 100.");
                return;
            }
        }
        setDiscountError("");

        const descEn = (descriptionEn || "").trim();
        const descAr = (descriptionAr || "").trim();

        const item = {
            id: `pkg_${Date.now()}`,
            en: en || ar,
            ar: ar || en,
            description: { en: descEn || descAr, ar: descAr || descEn },
            price: p || "",
            discount: disc || "",
            discountType: discountType || "percentage",
            features: features.slice(),
        };
        const next = [...packages, item];
        persist(next);
        setNameEn("");
        setNameAr("");
        setDescriptionEn("");
        setDescriptionAr("");
        setPrice("");
        setDiscount("");
        setDiscountType("percentage");
        setFeatureInputEn("");
        setFeatureInputAr("");
        setFeatureQuantity("");
        setFeatures([]);
    };

    const startEdit = (idx: number) => {
        setEditingIndex(idx);
        const s = packages[idx] || { en: "", ar: "", price: "", discount: "", discountType: "percentage", features: [] };
        setNameEn(s.en || "");
        setNameAr(s.ar || "");
        // support string or object descriptions
        setDescriptionEn(s.description && typeof s.description === "object" ? s.description.en || "" : s.description || "");
        setDescriptionAr(s.description && typeof s.description === "object" ? s.description.ar || "" : s.description || "");
        setPrice(s.price || "");
        setDiscount(s.discount || "");
        setDiscountType(s.discountType || "percentage");
        const feats = Array.isArray(s.features) ? s.features.slice() : [];
        setFeatures(feats);
        // map features back to selectedServiceIds when possible (match by en/ar)
        try {
            const matchedIds: string[] = [];
            feats.forEach((f: any) => {
                const match = availableServices.find((svc: any) => {
                    const svcEn = (svc.en || "").toString().trim();
                    const svcAr = (svc.ar || "").toString().trim();
                    const fEn = (f.en || "").toString().trim();
                    const fAr = (f.ar || "").toString().trim();
                    return (svcEn && fEn && svcEn.toLowerCase() === fEn.toLowerCase()) || (svcAr && fAr && svcAr === fAr);
                });
                if (match) matchedIds.push(match.id);
            });
            setSelectedServiceIds(matchedIds);
        } catch (e) {
            setSelectedServiceIds([]);
        }
        setFeatureInputEn("");
        setFeatureInputAr("");
        setFeatureQuantity("");
    };

    const saveEdit = (idx: number) => {
        const en = (nameEn || "").trim();
        const ar = (nameAr || "").trim();
        const descEn = (descriptionEn || "").trim();
        const descAr = (descriptionAr || "").trim();
        const p = (price || "").trim();
        const disc = (discount || "").trim();
        // allow saving package edits even when name fields are empty (no required inputs)
        // validate language of names
        const nameHasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(en);
        const nameHasLatinInAr = /[A-Za-z]/.test(ar);
        if (en && nameHasArabic) {
            setNameError(t("english_only") || "Please enter English text only in this field.");
            return;
        }
        if (ar && nameHasLatinInAr) {
            setNameError(t("arabic_only") || "Please enter Arabic text only in this field.");
            return;
        }
        setNameError("");
        if (p && isNaN(Number(p))) {
            setPriceError(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        setPriceError("");
        // validate discount
        if (disc) {
            const discNum = Number(disc);
            if (isNaN(discNum) || discNum < 0) {
                setDiscountError(t("invalid_discount") || "Please enter a valid discount.");
                return;
            }
            if (discountType === "percentage" && (discNum < 0 || discNum > 100)) {
                setDiscountError(t("invalid_discount_percentage") || "Percentage must be between 0 and 100.");
                return;
            }
        }
        setDiscountError("");

        const next = packages.slice();
        next[idx] = {
            ...(next[idx] || {}),
            id: next[idx]?.id || `pkg_${Date.now()}`,
            en: en || ar,
            ar: ar || en,
            description: { en: descEn || descAr, ar: descAr || descEn },
            price: p || "",
            discount: disc || "",
            discountType: discountType || "percentage",
            features: features.slice(),
        };
        persist(next);
        setEditingIndex(-1);
        setNameEn("");
        setNameAr("");
        setDescriptionEn("");
        setDescriptionAr("");
        setPrice("");
        setDiscount("");
        setDiscountType("percentage");
        setFeatureInputEn("");
        setFeatureInputAr("");
        setFeatureQuantity("");
        setFeatures([]);
    };

    const removeFeatureFromPackage = (pkgIdx: number, featIdx: number) => {
        const next = packages.slice();
        const farr = Array.isArray(next[pkgIdx].features) ? next[pkgIdx].features.slice() : [];
        farr.splice(featIdx, 1);
        next[pkgIdx] = { ...(next[pkgIdx] || {}), features: farr };
        persist(next);
        // keep edit buffer in sync if we're editing the same package
        if (editingIndex === pkgIdx) setFeatures(farr.slice());
    };

    const remove = (idx: number) => {
        if (!confirm(t("confirm_delete_package") || "Delete this package?")) return;
        const next = packages.filter((_, i) => i !== idx);
        persist(next);
    };

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("add_packages") || "Add Packages"}</h1>
                    <p className="text-light-600 dark:text-dark-400">
                        {t("add_packages_sub") || "Create and manage packages available for clients."}
                    </p>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title mb-3">{t("create_package") || "Create Package"}</h2>

                <div className="grid gap-4 lg:grid-cols-3">
                    <input
                        value={nameEn}
                        onChange={(e) => setNameEn(e.target.value)}
                        placeholder={t("package_name_en") || "Package name (English)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={nameAr}
                        onChange={(e) => setNameAr(e.target.value)}
                        placeholder={t("package_name_ar") || "اسم الباقة (بالعربية)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder={t("package_price") || "Price"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                </div>
                {nameError && <p className="text-danger-500 mt-1 text-xs">{nameError}</p>}
                {priceError && <p className="text-danger-500 mt-1 text-xs">{priceError}</p>}

                {/* Package Discount Section */}
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        className="text-light-900 dark:border-dark-700 dark:text-dark-50 focus:border-light-500 w-full appearance-none rounded-lg border bg-transparent px-3 py-2 text-sm transition-colors focus:outline-none"
                        style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                    >
                        <option
                            value="percentage"
                            className="text-light-900 dark:text-dark-50 dark:bg-dark-800 bg-white"
                        >
                            {t("percentage") || "Percentage"}
                        </option>
                        <option
                            value="fixed"
                            className="text-light-900 dark:text-dark-50 dark:bg-dark-800 bg-white"
                        >
                            {t("fixed") || "Fixed Amount"}
                        </option>
                    </select>
                    <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder={t("package_discount") || "Package Discount (optional)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                </div>
                {discountError && <p className="text-danger-500 mt-1 text-xs">{discountError}</p>}

                {/* Package description inputs (English / Arabic) */}
                <div className="mt-4">
                    <label className="text-dark-700 dark:text-dark-400 text-sm">{t("package_description") || "Package description"}</label>
                    <div className="mt-2 grid gap-4 lg:grid-cols-2">
                        <textarea
                            value={descriptionEn}
                            onChange={(e) => setDescriptionEn(e.target.value)}
                            placeholder={t("package_description_en") || "Package description (English)"}
                            rows={3}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder-light-500 dark:placeholder-dark-400 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                        <textarea
                            value={descriptionAr}
                            onChange={(e) => setDescriptionAr(e.target.value)}
                            placeholder={t("package_description_ar") || "وصف الباقة (بالعربية)"}
                            rows={3}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder-light-500 dark:placeholder-dark-400 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                    </div>
                </div>

                <div className="mt-3">
                    {/* Available services quick-add */}
                    {availableServices && availableServices.length > 0 && (
                        <div className="mt-3">
                            <label className="text-dark-700 dark:text-dark-400 text-sm">{t("available_services") || "Available Services"}</label>
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                {availableServices.map((svc) => {
                                    const identifier = svc.id || svc.en || svc.name;
                                    const label = lang === "ar" ? svc.ar || svc.en : svc.en || svc.ar || svc.name || "";
                                    const sel = isServiceSelected(identifier);
                                    return (
                                        <div
                                            key={identifier}
                                            className="relative flex flex-col items-stretch"
                                        >
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => toggleServiceSelection(svc)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        toggleServiceSelection(svc);
                                                    }
                                                }}
                                                className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                                                    sel
                                                        ? "border-light-500 bg-light-500 dark:bg-secdark-700 dark:text-dark-50 text-white"
                                                        : "border-light-600 text-light-900 hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 bg-white"
                                                } cursor-pointer`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {sel && (
                                                        <Check
                                                            size={16}
                                                            className="flex-shrink-0"
                                                        />
                                                    )}
                                                    <span className="truncate break-words">{label}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-4">
                        <input
                            value={featureInputEn}
                            onChange={(e) => setFeatureInputEn(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addFeature();
                                }
                            }}
                            placeholder={t("feature_placeholder") || "e.g., Reels"}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                        <input
                            value={featureInputAr}
                            onChange={(e) => setFeatureInputAr(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addFeature();
                                }
                            }}
                            placeholder={t("feature_placeholder_ar") || "مثال: ریلز"}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                        <input
                            type="number"
                            value={featureQuantity}
                            onChange={(e) => setFeatureQuantity(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addFeature();
                                }
                            }}
                            placeholder={t("feature_quantity_placeholder") || t("quantity") || "Quantity (e.g., 12)"}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={addFeature}
                                className="btn-ghost flex items-center gap-2 px-3 py-2"
                                aria-label={t("add_feature") || "Add feature"}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {features && features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 md:col-span-4">
                            {features.map((f, idx) => {
                                const label = lang === "ar" ? f.ar || f.en : f.en || f.ar;
                                return (
                                    <div
                                        key={`feat-${idx}`}
                                        className="bg-light-100 dark:bg-dark-700 dark:text-dark-50 inline-flex items-center gap-2 rounded-full px-1 py-0.5 text-xs"
                                    >
                                        <span className="mr-1 text-xs">{label}</span>

                                        <div className="dark:bg-dark-800 inline-flex items-center overflow-hidden rounded border bg-white text-xs">
                                            <button
                                                type="button"
                                                onClick={() => changeFeatureQuantity(idx, -1)}
                                                className="px-1 py-0.5"
                                                aria-label={t("decrease_quantity") || "Decrease quantity"}
                                            >
                                                <Minus size={12} />
                                            </button>

                                            <input
                                                type="number"
                                                min="1"
                                                value={f.quantity || "1"}
                                                onChange={(e) => updateFeatureQuantity(idx, e.target.value)}
                                                className="dark:bg-dark-800 w-10 border-r border-l bg-white px-1 py-0.5 text-center text-xs"
                                                aria-label={t("feature_quantity_placeholder") || t("quantity") || "Qty"}
                                            />

                                            <button
                                                type="button"
                                                onClick={() => changeFeatureQuantity(idx, 1)}
                                                className="px-1 py-0.5"
                                                aria-label={t("increase_quantity") || "Increase quantity"}
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeFeature(idx)}
                                            className="text-dark-500 hover:text-danger-500 inline-flex items-center justify-center rounded-full p-1"
                                            aria-label={t("remove_feature") || "Remove feature"}
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {featureError && <p className="text-danger-500 mt-2 text-xs">{featureError}</p>}
                    <p className="text-dark-500 mt-2 text-xs">{t("package_features_note") || "Features added will be saved with the package."}</p>
                </div>

                <div className="mt-4 flex gap-2">
                    {editingIndex === -1 ? (
                        <button
                            type="button"
                            onClick={handleAddPackage}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus size={14} />
                            {t("add_package") || "Add Package"}
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => saveEdit(editingIndex)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Check size={14} />
                                {t("save_changes") || "Save"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingIndex(-1);
                                    setNameEn("");
                                    setNameAr("");
                                    setDescriptionEn("");
                                    setDescriptionAr("");
                                    setPrice("");
                                    setFeatures([]);
                                    setFeatureInputEn("");
                                    setFeatureInputAr("");
                                    setFeatureQuantity("");
                                }}
                                className="btn-ghost flex items-center gap-2"
                            >
                                {t("cancel") || "Cancel"}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="card">
                <h2 className="card-title mb-3">{t("existing_packages") || "Existing Packages"}</h2>
                <div className="grid gap-3">
                    {packages.length > 0 ? (
                        packages.map((p, idx) => (
                            <div
                                key={p.id}
                                className="border-light-600 text-light-900 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-50 flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">{lang === "ar" ? p.ar || p.en : p.en || p.ar}</span>
                                        </div>
                                        <div className="text-dark-700 dark:text-dark-400 text-sm">
                                            {p.price ? `${p.price} ${lang === "ar" ? "ج.م" : "EGP"}` : ""}
                                        </div>
                                    </div>

                                    {(() => {
                                        // Safely resolve description (support string or {en,ar})
                                        const raw = p.description;
                                        let desc = "";
                                        if (raw) {
                                            if (typeof raw === "string") desc = raw;
                                            else if (typeof raw === "object") desc = lang === "ar" ? raw.ar || raw.en || "" : raw.en || raw.ar || "";
                                        }
                                        return desc ? <p className="text-light-600 mt-1 text-sm">{desc}</p> : null;
                                    })()}

                                    {Array.isArray(p.features) && p.features.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {p.features.map((f, fi) => {
                                                const label = lang === "ar" ? f.ar || f.en : f.en || f.ar;
                                                const qtyText = f.quantity ? ` (${f.quantity})` : "";
                                                return (
                                                    <span
                                                        key={`${p.id}-feat-${fi}`}
                                                        className="bg-light-100 text-dark-800 dark:bg-dark-700 dark:text-dark-50 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                                                    >
                                                        <span>
                                                            {label}
                                                            {qtyText}
                                                        </span>
                                                        <button
                                                            onClick={() => removeFeatureFromPackage(idx, fi)}
                                                            className="text-dark-500 hover:text-danger-500 inline-flex items-center justify-center rounded-full p-1"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEdit(idx)}
                                        className="btn-ghost"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => remove(idx)}
                                        className="btn-ghost text-danger-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-light-600">{t("no_packages_yet") || "No packages yet."}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddPackagePage;
