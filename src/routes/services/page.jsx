import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const ServicesPage = () => {
    const { t, lang } = useLang();
    const [services, setServices] = useState([]);
    const [inputEn, setInputEn] = useState("");
    const [inputAr, setInputAr] = useState("");
    const [inputPrice, setInputPrice] = useState("");
    const [editingIndex, setEditingIndex] = useState(-1);
    const [editingValue, setEditingValue] = useState("");
    const [editingPrice, setEditingPrice] = useState("");

    useEffect(() => {
        try {
            const stored = localStorage.getItem("services_master");
            if (stored) {
                const parsed = JSON.parse(stored) || [];
                // normalize entries: strings -> { id, en, ar }
                const normalized = parsed
                    .map((s, idx) => {
                        if (!s) return null;
                        if (typeof s === "string") return { id: `svc_${idx}_${Date.now()}`, en: s, ar: "" };
                        // already object - ensure price exists
                        return s.id
                            ? { ...s, price: s.price || "" }
                            : { id: `svc_${idx}_${Date.now()}`, en: s.en || "", ar: s.ar || "", price: s.price || "" };
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
        // avoid duplicates by English or Arabic label
        if (
            services.some((s) => (s.en || "").toLowerCase() === (en || "").toLowerCase() || (s.ar || "").toLowerCase() === (ar || "").toLowerCase())
        ) {
            setInputEn("");
            setInputAr("");
            setInputPrice("");
            return;
        }
        const item = { id: `svc_${Date.now()}`, en: en || ar, ar: ar || en, price: p || "" };
        const next = [...services, item];
        persist(next);
        setInputEn("");
        setInputAr("");
        setInputPrice("");
    };

    const startEdit = (idx) => {
        setEditingIndex(idx);
        const s = services[idx] || { en: "", ar: "" };
        setEditingValue(s.en || "");
        setInputAr(s.ar || "");
        setEditingPrice(s.price || "");
    };

    const saveEdit = (idx) => {
        const en = (editingValue || "").trim();
        const ar = (inputAr || "").trim();
        const p = (editingPrice || "").trim();
        if (!en && !ar) return;
        if (!p) {
            alert(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        if (isNaN(Number(p))) {
            alert(t("invalid_price") || "Please enter a valid price.");
            return;
        }
        const next = services.slice();
        next[idx] = { ...(next[idx] || {}), id: next[idx]?.id || `svc_${Date.now()}`, en: en || ar, ar: ar || en, price: p || "" };
        persist(next);
        setEditingIndex(-1);
        setEditingValue("");
        setInputAr("");
        setEditingPrice("");
    };

    const remove = (idx) => {
        if (!confirm(t("confirm_delete_service") || "Delete this service?")) return;
        const next = services.filter((_, i) => i !== idx);
        persist(next);
    };

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

                <div className="grid gap-3">
                    {services.length > 0 ? (
                        services.map((s, idx) => (
                            <div
                                key={s.id || `${s}${idx}`}
                                className="border-light-600 text-light-900 dark:bg-dark-800 dark:border-dark-700 dark:text-dark-50 flex items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2"
                            >
                                <div className="flex w-full items-center gap-3">
                                    {editingIndex === idx ? (
                                        <div className="flex w-full gap-2">
                                            <input
                                                value={editingValue}
                                                onChange={(e) => setEditingValue(e.target.value)}
                                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                placeholder={t("english_label") || "English"}
                                            />
                                            <input
                                                value={inputAr}
                                                onChange={(e) => setInputAr(e.target.value)}
                                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                placeholder={t("arabic_label") || "Arabic"}
                                            />
                                            <input
                                                value={editingPrice}
                                                onChange={(e) => setEditingPrice(e.target.value)}
                                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/3 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                placeholder={t("service_price") || "Price"}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex w-full">
                                            <div className="flex w-full items-center justify-between">
                                                <span className="text-light-900 dark:text-dark-50 text-sm">
                                                    {lang === "ar" ? s.ar || s.en || s : s.en || s}
                                                </span>
                                                <span className="text-dark-700 dark:text-dark-400 text-sm">
                                                    {s.price ? `${s.price} ${lang === "ar" ? "ج.م" : "EGP"}` : ""}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {editingIndex === idx ? (
                                        <>
                                            <button
                                                onClick={() => saveEdit(idx)}
                                                className="btn-ghost flex items-center gap-2"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingIndex(-1);
                                                    setEditingValue("");
                                                    setInputAr("");
                                                }}
                                                className="btn-ghost flex items-center gap-2"
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEdit(idx)}
                                                className="btn-ghost flex items-center gap-2"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => remove(idx)}
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
                        <p className="text-light-600">{t("no_services_defined") || "No services defined yet."}</p>
                    )}
                </div>

                <div className="mt-4 flex gap-2">
                    <input
                        value={inputEn}
                        onChange={(e) => setInputEn(e.target.value)}
                        placeholder={t("add_custom_service_placeholder") || "Service (English)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={inputAr}
                        onChange={(e) => setInputAr(e.target.value)}
                        placeholder={t("add_custom_service_placeholder_arabic") || "الخدمة (بالعربية)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/2 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={inputPrice}
                        onChange={(e) => setInputPrice(e.target.value)}
                        placeholder={t("service_price") || "Price"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/4 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
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
