import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const ServicesPage = () => {
    const { t, lang } = useLang();
    const [services, setServices] = useState([]);
    const [inputEn, setInputEn] = useState("");
    const [inputAr, setInputAr] = useState("");
    const [inputPrice, setInputPrice] = useState("");
    const [inputQuantity, setInputQuantity] = useState("");
    const [inputDiscount, setInputDiscount] = useState("");
    const [editingIndex, setEditingIndex] = useState(-1);
    const [editingValue, setEditingValue] = useState("");
    const [editingPrice, setEditingPrice] = useState("");
    const [editingDiscount, setEditingDiscount] = useState("");
    const [editingQuantity, setEditingQuantity] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const categories = [
        { id: "all", en: "All Services", ar: "جميع الخدمات" },
        { id: "photography", en: "Photography Services", ar: "خدمات التصوير" },
        { id: "web", en: "Web Services", ar: "خدمات الويب" },
        { id: "reels", en: "Reels Services", ar: "خدمات الريلز" },
        { id: "other", en: "Other Services", ar: "خدمات أخرى" },
    ];

    useEffect(() => {
        try {
            const stored = localStorage.getItem("services_master");
            if (stored) {
                const parsed = JSON.parse(stored) || [];
                // normalize entries: strings -> { id, en, ar, category, discount }
                const normalized = parsed
                    .map((s, idx) => {
                        if (!s) return null;
                        if (typeof s === "string")
                            return { id: `svc_${idx}_${Date.now()}`, en: s, ar: "", category: "other", discount: "", quantity: "" };
                        // already object - ensure price, category, and discount exist
                        return s.id
                            ? { ...s, price: s.price || "", category: s.category || "other", discount: s.discount || "", quantity: s.quantity || "" }
                            : {
                                  id: `svc_${idx}_${Date.now()}`,
                                  en: s.en || "",
                                  ar: s.ar || "",
                                  price: s.price || "",
                                  category: s.category || "other",
                                  discount: s.discount || "",
                                  quantity: s.quantity || "",
                              };
                    })
                    .filter(Boolean);
                setServices(normalized);
            } else {
                // leave empty; Planning will seed defaults
                setServices([]);
            }
        } catch (e) {
            setServices([]);
        }
    }, []);

    const persist = (next) => {
        setServices(next);
        try {
            localStorage.setItem("services_master", JSON.stringify(next));
        } catch (e) {}
    };

    const handleAdd = () => {
        const en = (inputEn || "").trim();
        const ar = (inputAr || "").trim();
        const p = (inputPrice || "").trim();
        const qty = (inputQuantity || "").toString().trim();
        const disc = (inputDiscount || "").trim();
        if (!en && !ar) return;
        // require price and validate
        if (!p) {
            alert(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        if (isNaN(Number(p))) {
            alert(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        // validate quantity if provided
        if (qty && (!Number.isFinite(Number(qty)) || Number(qty) < 0)) {
            alert(t("invalid_quantity") || "Please enter a valid quantity.");
            return;
        }
        // validate discount if provided
        if (disc && isNaN(Number(disc))) {
            alert(t("invalid_discount") || "Please enter a valid discount.");
            return;
        }
        // avoid duplicates by English or Arabic label
        if (
            services.some((s) => (s.en || "").toLowerCase() === (en || "").toLowerCase() || (s.ar || "").toLowerCase() === (ar || "").toLowerCase())
        ) {
            setInputEn("");
            setInputAr("");
            setInputPrice("");
            setInputDiscount("");
            return;
        }
        const category = activeCategory === "all" ? "other" : activeCategory;
        const item = { id: `svc_${Date.now()}`, en: en || ar, ar: ar || en, price: p || "", discount: disc || "", category, quantity: qty || "" };
        const next = [...services, item];
        persist(next);
        setInputEn("");
        setInputAr("");
        setInputPrice("");
        setInputDiscount("");
        setInputQuantity("");
    };

    const startEdit = (idx) => {
        setEditingIndex(idx);
        const s = services[idx] || { en: "", ar: "", discount: "" };
        setEditingValue(s.en || "");
        setInputAr(s.ar || "");
        setEditingPrice(s.price || "");
        setEditingDiscount(s.discount || "");
        setEditingQuantity(s.quantity || "");
    };

    const saveEdit = (idx) => {
        const en = (editingValue || "").trim();
        const ar = (inputAr || "").trim();
        const p = (editingPrice || "").trim();
        const qty = (editingQuantity || "").toString().trim();
        const disc = (editingDiscount || "").trim();
        if (!en && !ar) return;
        if (!p) {
            alert(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        if (isNaN(Number(p))) {
            alert(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        if (qty && (!Number.isFinite(Number(qty)) || Number(qty) < 0)) {
            alert(t("invalid_quantity") || "Please enter a valid quantity.");
            return;
        }
        if (disc && isNaN(Number(disc))) {
            alert(t("invalid_discount") || "Please enter a valid discount.");
            return;
        }
        const next = services.slice();
        next[idx] = {
            ...(next[idx] || {}),
            id: next[idx]?.id || `svc_${Date.now()}`,
            en: en || ar,
            ar: ar || en,
            price: p || "",
            discount: disc || "",
            quantity: qty || "",
            category: next[idx]?.category || "other",
        };
        persist(next);
        setEditingIndex(-1);
        setEditingValue("");
        setInputAr("");
        setEditingPrice("");
        setEditingDiscount("");
        setEditingQuantity("");
    };

    const removeDiscount = (idx) => {
        const next = services.slice();
        next[idx] = { ...(next[idx] || {}), discount: "" };
        persist(next);
    };

    const remove = (idx) => {
        if (!confirm(t("confirm_delete_service") || "Delete this service?")) return;
        const next = services.filter((_, i) => i !== idx);
        persist(next);
    };

    const filteredServices = activeCategory === "all" ? services : services.filter((s) => s.category === activeCategory);

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("Services")}</h1>
                    <p className="text-light-600 dark:text-dark-400">
                        {t("manage_services_sub") || "Manage available services shown throughout the app."}
                    </p>
                </div>
            </div>

            <div className="card">
                <h2 className="card-title mb-3">{t("manage_services") || "Manage Services"}</h2>

                {/* Category Tabs */}
                <div className="mb-4 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                                activeCategory === cat.id
                                    ? "bg-light-500 dark:bg-secdark-600 text-white"
                                    : "bg-light-100 text-dark-700 hover:bg-light-200 dark:bg-dark-700 dark:text-dark-50 dark:hover:bg-dark-600"
                            }`}
                        >
                            {lang === "ar" ? cat.ar : cat.en}
                        </button>
                    ))}
                </div>

                <div className="grid gap-3">
                    {filteredServices.length > 0 ? (
                        filteredServices.map((s, idx) => {
                            const actualIndex = services.findIndex((svc) => svc.id === s.id);
                            return (
                                <div
                                    key={s.id || `${s}${idx}`}
                                    className="border-light-600 text-light-900 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-50 flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                                >
                                    <div className="flex w-full items-center gap-3">
                                        {editingIndex === actualIndex ? (
                                            <div className="flex w-full gap-2">
                                                <input
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/5 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    placeholder={t("english_label") || "English"}
                                                />
                                                <input
                                                    value={inputAr}
                                                    onChange={(e) => setInputAr(e.target.value)}
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/5 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    placeholder={t("arabic_label") || "Arabic"}
                                                />
                                                <input
                                                    value={editingPrice}
                                                    onChange={(e) => setEditingPrice(e.target.value)}
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/5 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    placeholder={t("service_price") || "Price"}
                                                />
                                                <input
                                                    value={editingQuantity}
                                                    onChange={(e) => setEditingQuantity(e.target.value)}
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/5 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    placeholder={t("quantity") || "Quantity"}
                                                />
                                                <input
                                                    value={editingDiscount}
                                                    onChange={(e) => setEditingDiscount(e.target.value)}
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/5 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    placeholder={t("discount") || "Discount"}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex w-full">
                                                <div className="flex w-full items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-light-900 dark:text-dark-50 text-sm">
                                                            {lang === "ar" ? s.ar || s.en || s : s.en || s}
                                                        </span>
                                                        {/* category label (small) */}
                                                        <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                            {lang === "ar"
                                                                ? categories.find((c) => c.id === s.category)?.ar || ""
                                                                : categories.find((c) => c.id === s.category)?.en || ""}
                                                        </span>
                                                        {/* quantity (small) */}
                                                        {s.quantity !== undefined && s.quantity !== "" && (
                                                            <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                                {t("quantity") || "Qty"}: {s.quantity}
                                                            </span>
                                                        )}
                                                        {s.discount && (
                                                            <span className="mt-1 text-xs text-green-600 dark:text-green-400">
                                                                {t("discount") || "Discount"}: {s.discount} {lang === "ar" ? "ج.م" : "EGP"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-dark-700 dark:text-dark-400 text-sm">
                                                            {s.price ? `${s.price} ${lang === "ar" ? "ج.م" : "EGP"}` : ""}
                                                        </span>
                                                        {s.discount && (
                                                            <button
                                                                onClick={() => removeDiscount(actualIndex)}
                                                                className="btn-ghost text-danger-500 text-xs"
                                                                title={t("remove_discount") || "Remove Discount"}
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {editingIndex === actualIndex ? (
                                            <>
                                                <button
                                                    onClick={() => saveEdit(actualIndex)}
                                                    className="btn-ghost flex items-center gap-2"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingIndex(-1);
                                                        setEditingValue("");
                                                        setInputAr("");
                                                        setEditingDiscount("");
                                                    }}
                                                    className="btn-ghost flex items-center gap-2"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => startEdit(actualIndex)}
                                                    className="btn-ghost flex items-center gap-2"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => remove(actualIndex)}
                                                    className="btn-ghost text-danger-500 flex items-center gap-2"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-light-600">{t("no_services_defined") || "No services defined yet."}</p>
                    )}
                </div>

                <div className="mt-4 flex gap-2">
                    <input
                        value={inputEn}
                        onChange={(e) => setInputEn(e.target.value)}
                        placeholder={t("add_custom_service_placeholder") || "Service (English)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={inputAr}
                        onChange={(e) => setInputAr(e.target.value)}
                        placeholder={t("add_custom_service_placeholder_arabic") || "الخدمة (بالعربية)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={inputPrice}
                        onChange={(e) => setInputPrice(e.target.value)}
                        placeholder={t("service_price") || "Price"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/6 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={inputQuantity}
                        onChange={(e) => setInputQuantity(e.target.value)}
                        placeholder={t("quantity") || "Qty"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/6 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={inputDiscount}
                        onChange={(e) => setInputDiscount(e.target.value)}
                        placeholder={t("discount_optional") || "Discount"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/6 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <button
                        onClick={handleAdd}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={14} />
                        {t("add")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
