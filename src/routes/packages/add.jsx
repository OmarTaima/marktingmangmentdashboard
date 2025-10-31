import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const AddPackagePage = () => {
    const { t, lang } = useLang();
    const [packages, setPackages] = useState([]);
    const [nameEn, setNameEn] = useState("");
    const [nameAr, setNameAr] = useState("");
    const [price, setPrice] = useState("");
    const [featureInputEn, setFeatureInputEn] = useState("");
    const [featureInputAr, setFeatureInputAr] = useState("");
    // features now stored as array of {en, ar}
    const [features, setFeatures] = useState([]);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [nameError, setNameError] = useState("");
    const [featureError, setFeatureError] = useState("");
    const [priceError, setPriceError] = useState("");

    useEffect(() => {
        try {
            const stored = localStorage.getItem("packages_master");
            if (stored) {
                const parsed = JSON.parse(stored) || [];
                // normalize features to {en,ar} objects for backward compatibility
                const normalized = parsed.map((pkg) => {
                    const next = { ...pkg };
                    if (Array.isArray(next.features)) {
                        next.features = next.features.map((f) => {
                            if (!f) return { en: "", ar: "" };
                            if (typeof f === "string") return { en: f, ar: f };
                            if (typeof f === "object") return { en: f.en || f.text || "", ar: f.ar || f.en || "" };
                            return { en: String(f), ar: String(f) };
                        });
                    } else {
                        next.features = [];
                    }
                    return next;
                });
                setPackages(normalized);
            } else setPackages([]);
        } catch (e) {
            setPackages([]);
        }
    }, []);

    const persist = (next) => {
        setPackages(next);
        try {
            localStorage.setItem("packages_master", JSON.stringify(next));
        } catch (e) {}
    };

    const addFeature = () => {
        const en = (featureInputEn || "").trim();
        const ar = (featureInputAr || "").trim();
        if (!en && !ar) return;
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
        const fobj = { en: en || ar, ar: ar || en };
        // avoid duplicate features by english text
        if (features.some((x) => (x.en || "").toLowerCase() === (fobj.en || "").toLowerCase())) {
            setFeatureInputEn("");
            setFeatureInputAr("");
            return;
        }
        setFeatures((prev) => [...prev, fobj]);
        setFeatureInputEn("");
        setFeatureInputAr("");
    };

    const removeFeature = (idx) => {
        setFeatures((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleAddPackage = () => {
        const en = (nameEn || "").trim();
        const ar = (nameAr || "").trim();
        const p = (price || "").trim();
        if (!en && !ar) return;
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

        const item = { id: `pkg_${Date.now()}`, en: en || ar, ar: ar || en, price: p || "", features: features.slice() };
        const next = [...packages, item];
        persist(next);
        setNameEn("");
        setNameAr("");
        setPrice("");
        setFeatureInputEn("");
        setFeatureInputAr("");
        setFeatures([]);
    };

    const startEdit = (idx) => {
        setEditingIndex(idx);
        const s = packages[idx] || { en: "", ar: "", price: "", features: [] };
        setNameEn(s.en || "");
        setNameAr(s.ar || "");
        setPrice(s.price || "");
        setFeatures(Array.isArray(s.features) ? s.features.slice() : []);
        setFeatureInputEn("");
        setFeatureInputAr("");
    };

    const saveEdit = (idx) => {
        const en = (nameEn || "").trim();
        const ar = (nameAr || "").trim();
        const p = (price || "").trim();
        if (!en && !ar) return;
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

        const next = packages.slice();
        next[idx] = {
            ...(next[idx] || {}),
            id: next[idx]?.id || `pkg_${Date.now()}`,
            en: en || ar,
            ar: ar || en,
            price: p || "",
            features: features.slice(),
        };
        persist(next);
        setEditingIndex(-1);
        setNameEn("");
        setNameAr("");
        setPrice("");
        setFeatureInputEn("");
        setFeatureInputAr("");
        setFeatures([]);
    };

    const removeFeatureFromPackage = (pkgIdx, featIdx) => {
        const next = packages.slice();
        const farr = Array.isArray(next[pkgIdx].features) ? next[pkgIdx].features.slice() : [];
        farr.splice(featIdx, 1);
        next[pkgIdx] = { ...(next[pkgIdx] || {}), features: farr };
        persist(next);
        // keep edit buffer in sync if we're editing the same package
        if (editingIndex === pkgIdx) setFeatures(farr.slice());
    };

    const remove = (idx) => {
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
                {priceError && <p className="text-danger-500 mt-1 text-xs">{priceError}</p>}

                <div className="mt-3">
                    <label className="text-dark-700 dark:text-dark-400 text-sm">{t("package_features") || "Features (one at a time)"}</label>
                    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                        <input
                            value={featureInputEn}
                            onChange={(e) => setFeatureInputEn(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    addFeature();
                                }
                            }}
                            placeholder={t("feature_placeholder") || "e.g., 10 posts / month"}
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
                            placeholder={t("feature_placeholder_ar") || "مثال: 10 منشورات / شهر"}
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                        />
                        <div className="flex items-center">
                            <button
                                type="button"
                                onClick={addFeature}
                                className="btn-ghost flex items-center gap-2 px-3 py-2"
                                aria-label="Add feature"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {features && features.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 md:col-span-3">
                            {features.map((f, idx) => {
                                const label = lang === "ar" ? f.ar || f.en : f.en || f.ar;
                                return (
                                    <span
                                        key={`feat-${idx}`}
                                        className="bg-light-100 text-dark-800 dark:bg-dark-700 dark:text-dark-50 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                                    >
                                        <span>{label}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFeature(idx)}
                                            className="text-dark-500 hover:text-danger-500 inline-flex items-center justify-center rounded-full p-1"
                                            aria-label="Remove feature"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
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
                                    setPrice("");
                                    setFeatures([]);
                                    setFeatureInputEn("");
                                    setFeatureInputAr("");
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

                                    {Array.isArray(p.features) && p.features.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {p.features.map((f, fi) => {
                                                const label = lang === "ar" ? f.ar || f.en : f.en || f.ar;
                                                return (
                                                    <span
                                                        key={`${p.id}-feat-${fi}`}
                                                        className="bg-light-100 text-dark-800 dark:bg-dark-700 dark:text-dark-50 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs"
                                                    >
                                                        <span>{label}</span>
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
