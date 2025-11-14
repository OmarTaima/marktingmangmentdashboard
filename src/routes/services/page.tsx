import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";

type Service = {
    id: string;
    en?: string;
    ar?: string;
    description?: string;
    category?: string;
};

const ServicesPage = () => {
    const { t, lang } = useLang();
    const [services, setServices] = useState<Service[]>([]);
    const [inputEn, setInputEn] = useState<string>("");
    const [inputAr, setInputAr] = useState<string>("");
    const [inputDescription, setInputDescription] = useState<string>("");
    const [editingIndex, setEditingIndex] = useState<number>(-1);
    const [editingValue, setEditingValue] = useState<string>("");
    const [editingDescription, setEditingDescription] = useState<string>("");
    const [activeCategory, setActiveCategory] = useState<string>("all");

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
                    .map((s: any, idx: number) => {
                        if (!s) return null;
                        if (typeof s === "string")
                            return {
                                id: `svc_${idx}_${Date.now()}`,
                                en: s,
                                ar: "",
                                category: "other",
                                description: "",
                            };
                        // already object - ensure category exists
                        return s.id
                            ? {
                                  ...s,
                                  category: s.category || "other",
                                  description: s.description || "",
                              }
                            : {
                                  id: `svc_${idx}_${Date.now()}`,
                                  en: s.en || "",
                                  ar: s.ar || "",
                                  category: s.category || "other",
                                  description: s.description || "",
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

    const persist = (next: Service[]) => {
        setServices(next);
        try {
            localStorage.setItem("services_master", JSON.stringify(next));
        } catch (e) {}
    };

    const handleAdd = () => {
        const en = (inputEn || "").trim();
        const ar = (inputAr || "").trim();
        const desc = (inputDescription || "").trim();
        // allow adding services even when english/arabic fields are empty (no required inputs)
        // avoid duplicates by English or Arabic label
        if (
            services.some((s) => (s.en || "").toLowerCase() === (en || "").toLowerCase() || (s.ar || "").toLowerCase() === (ar || "").toLowerCase())
        ) {
            setInputEn("");
            setInputAr("");
            return;
        }
        const category = activeCategory === "all" ? "other" : activeCategory;
        const item = {
            id: `svc_${Date.now()}`,
            en: en || ar,
            ar: ar || en,
            description: desc || "",
            category,
        };
        const next = [...services, item];
        persist(next);
        setInputEn("");
        setInputAr("");
        setInputDescription("");
    };

    const startEdit = (idx: number) => {
        setEditingIndex(idx);
        const s = services[idx] || { en: "", ar: "" };
        setEditingValue(s.en || "");
        setInputAr(s.ar || "");
        setEditingDescription(s.description || "");
    };

    const saveEdit = (idx: number) => {
        const en = (editingValue || "").trim();
        const ar = (inputAr || "").trim();
        const desc = (editingDescription || "").trim();
        // allow saving edits even when english/arabic fields are empty (no required inputs)
        const next = services.slice();
        next[idx] = {
            ...(next[idx] || {}),
            id: next[idx]?.id || `svc_${Date.now()}`,
            en: en || ar,
            ar: ar || en,
            description: desc || "",
            category: next[idx]?.category || "other",
        };
        persist(next);
        setEditingIndex(-1);
        setEditingValue("");
        setInputAr("");
        setEditingDescription("");
    };

    const remove = (idx: number) => {
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
                <div className="mb-4 flex flex-wrap justify-center gap-2">
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
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/3 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    placeholder={t("english_label") || "English"}
                                                />
                                                <input
                                                    value={inputAr}
                                                    onChange={(e) => setInputAr(e.target.value)}
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/3 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    placeholder={t("arabic_label") || "Arabic"}
                                                />
                                                <input
                                                    value={editingDescription}
                                                    onChange={(e) => setEditingDescription(e.target.value)}
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/3 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none"
                                                    placeholder={t("service_description") || "Description (optional)"}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex w-full">
                                                <div className="flex w-full items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-light-900 dark:text-dark-50 text-sm">
                                                            {(() => {
                                                                if (typeof s === "string") return s;
                                                                return lang === "ar" ? s.ar || s.en || "" : s.en || s.ar || "";
                                                            })()}
                                                        </span>
                                                        {/* category label (small) */}
                                                        <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                            {lang === "ar"
                                                                ? categories.find((c) => c.id === s.category)?.ar || ""
                                                                : categories.find((c) => c.id === s.category)?.en || ""}
                                                        </span>
                                                        {s.description && (
                                                            <span className="text-light-600 dark:text-dark-400 mt-1 text-xs">{s.description}</span>
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
                                                        setEditingDescription("");
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
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/3 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={inputAr}
                        onChange={(e) => setInputAr(e.target.value)}
                        placeholder={t("add_custom_service_placeholder_arabic") || "الخدمة (بالعربية)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/3 rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                    />
                    <input
                        value={inputDescription}
                        onChange={(e) => setInputDescription(e.target.value)}
                        placeholder={t("service_description") || "Description (optional)"}
                        className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-1/3 rounded-lg border bg-white px-2 py-2 text-sm transition-colors focus:outline-none"
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
