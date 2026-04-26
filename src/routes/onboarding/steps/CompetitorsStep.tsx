import { useState, useEffect } from "react";
import type { FC } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Edit2, X } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import validators from "@/constants/validators";
import fieldValidations from "@/constants/validations";

type CompetitorSwot = {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
};

type Competitor = {
    name?: string;
    description?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    swot?: CompetitorSwot;
};

type CompetitorsStepProps = {
    data?: {
        competitors?: Competitor[];
        competitorsDraft?: Competitor;
        currentCompetitorDraft?: Competitor;
    };
    onNext: (payload: any) => void;
    onPrevious: (payload: any) => void;
    isLast?: boolean;
    onUpdate?: (payload: any) => void;
};

export const CompetitorsStep: FC<CompetitorsStepProps> = ({ data = {}, onNext, onPrevious, isLast = false, onUpdate }) => {
    const { t } = useLang();
    const [competitors, setCompetitors] = useState<Competitor[]>(data.competitors || []);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingSwotItem, setEditingSwotItem] = useState<{
        category: keyof CompetitorSwot | null;
        index: number | null;
        value: string;
    }>({ category: null, index: null, value: "" });
    const [currentCompetitor, setCurrentCompetitor] = useState<Competitor>(
        data.competitorsDraft ||
            data.currentCompetitorDraft || {
                name: "",
                description: "",
                website: "",
                facebook: "",
                instagram: "",
                tiktok: "",
                twitter: "",
                swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            },
    );

    const [swotInput, setSwotInput] = useState<Record<"strength" | "weakness" | "opportunity" | "threat", string>>({
        strength: "",
        weakness: "",
        opportunity: "",
        threat: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAddOrUpdateCompetitor = () => {
        const newErrors: Record<string, string> = {};

        // Require competitor name (backend requires `name`)
        if (!currentCompetitor.name || !currentCompetitor.name.trim()) {
            newErrors.name = (t(fieldValidations.competitorName.messageKey) as string) || "Competitor name is required";
            setErrors(newErrors);
            return;
        }

        // Preserve URLs as entered (do not remove leading protocol)
        const normalizedCompetitor = {
            ...currentCompetitor,
            website: currentCompetitor.website ? currentCompetitor.website.trim() : "",
            facebook: currentCompetitor.facebook ? currentCompetitor.facebook.trim() : "",
            instagram: currentCompetitor.instagram ? currentCompetitor.instagram.trim() : "",
            tiktok: currentCompetitor.tiktok ? currentCompetitor.tiktok.trim() : "",
            twitter: currentCompetitor.twitter ? currentCompetitor.twitter.trim() : "",
        };

        if (normalizedCompetitor.website && !validators.isValidURL(normalizedCompetitor.website, { allowProtocolLess: true })) {
            newErrors.website = (t("invalid_website") as string) || "";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        let next: Competitor[];
        if (editingIndex !== null) {
            // Update existing competitor
            next = [...competitors];
            next[editingIndex] = normalizedCompetitor;
            setEditingIndex(null);
        } else {
            // Add new competitor
            next = [...competitors, normalizedCompetitor];
        }
        
        setCompetitors(next);
        if (typeof onUpdate === "function") onUpdate({ competitors: next });
        
        // Reset form
        setCurrentCompetitor({
            name: "",
            description: "",
            website: "",
            facebook: "",
            instagram: "",
            tiktok: "",
            twitter: "",
            swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        });
        setSwotInput({ strength: "", weakness: "", opportunity: "", threat: "" });
        setErrors({});
    };

    const handleEditCompetitor = (index: number) => {
        const competitorToEdit = competitors[index];
        setCurrentCompetitor(JSON.parse(JSON.stringify(competitorToEdit))); // Deep clone to avoid reference issues
        setEditingIndex(index);
        setErrors({});
        setEditingSwotItem({ category: null, index: null, value: "" });
        setSwotInput({ strength: "", weakness: "", opportunity: "", threat: "" });
        // Scroll to form
        document.getElementById("competitor-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleRemoveCompetitor = (index: number) => {
        const next = competitors.filter((_, i) => i !== index);
        setCompetitors(next);
        if (typeof onUpdate === "function") onUpdate({ competitors: next });
        
        // If we're editing the competitor that was just deleted, reset the form
        if (editingIndex === index) {
            setEditingIndex(null);
            setCurrentCompetitor({
                name: "",
                description: "",
                website: "",
                facebook: "",
                instagram: "",
                tiktok: "",
                twitter: "",
                swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            });
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setCurrentCompetitor({
            name: "",
            description: "",
            website: "",
            facebook: "",
            instagram: "",
            tiktok: "",
            twitter: "",
            swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        });
        setSwotInput({ strength: "", weakness: "", opportunity: "", threat: "" });
        setEditingSwotItem({ category: null, index: null, value: "" });
        setErrors({});
        if (typeof onUpdate === "function") onUpdate({ 
            competitorsDraft: {
                name: "",
                description: "",
                website: "",
                facebook: "",
                instagram: "",
                tiktok: "",
                twitter: "",
                swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            }
        });
    };

    const handleAddSwotItem = (category: keyof CompetitorSwot & string) => {
        const key = category.slice(0, -1);
        const inputKey = key as "strength" | "weakness" | "opportunity" | "threat";
        const value = (swotInput as Record<string, string>)[inputKey];
        if (value && value.trim()) {
            setCurrentCompetitor((prev) => ({
                ...(prev || {}),
                swot: {
                    ...(prev?.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] }),
                    [category]: [...(prev?.swot?.[category] || []), value.trim()],
                },
            }));
            setSwotInput({ ...swotInput, [inputKey]: "" });
        }
    };

    const handleEditSwotItem = (category: keyof CompetitorSwot, index: number, currentValue: string) => {
        setEditingSwotItem({ category, index, value: currentValue });
    };

    const handleUpdateSwotItem = () => {
        const { category, index, value } = editingSwotItem;
        if (category !== null && index !== null && value.trim()) {
            setCurrentCompetitor((prev) => ({
                ...(prev || {}),
                swot: {
                    ...(prev?.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] }),
                    [category]: (prev?.swot?.[category] || []).map((item, i) => 
                        i === index ? value.trim() : item
                    ),
                },
            }));
            setEditingSwotItem({ category: null, index: null, value: "" });
        }
    };

    const handleCancelEditSwotItem = () => {
        setEditingSwotItem({ category: null, index: null, value: "" });
    };

    const handleRemoveSwotItem = (category: keyof CompetitorSwot & string, itemIndex: number) => {
        setCurrentCompetitor((prev) => ({
            ...(prev || {}),
            swot: {
                ...(prev?.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] }),
                [category]: (prev?.swot?.[category] || []).filter((_, i) => i !== itemIndex),
            },
        }));
        
        // If we were editing this item, cancel edit mode
        if (editingSwotItem.category === category && editingSwotItem.index === itemIndex) {
            setEditingSwotItem({ category: null, index: null, value: "" });
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Auto-add current draft if it has any content and we're not editing
        let finalCompetitors = [...competitors];
        const hasContent = Object.values(currentCompetitor).some((v) => {
            if (Array.isArray(v)) return v.length > 0;
            if (typeof v === "object" && v !== null)
                return Object.values(v).some((val) => (Array.isArray(val) ? val.length > 0 : !!(val && String(val).trim())));
            return !!(v && String(v).trim());
        });

        if (editingIndex === null && hasContent) {
            // Require name when adding draft competitor
            if (!currentCompetitor.name || !currentCompetitor.name.trim()) {
                setErrors({ name: (t(fieldValidations.competitorName.messageKey) as string) || "Competitor name is required" });
                return;
            }

            // Validate website if provided
            const normalized = {
                ...currentCompetitor,
                website: currentCompetitor.website ? currentCompetitor.website.trim() : "",
                facebook: currentCompetitor.facebook ? currentCompetitor.facebook.trim() : "",
                instagram: currentCompetitor.instagram ? currentCompetitor.instagram.trim() : "",
                tiktok: currentCompetitor.tiktok ? currentCompetitor.tiktok.trim() : "",
                twitter: currentCompetitor.twitter ? currentCompetitor.twitter.trim() : "",
            };

            if (normalized.website && !validators.isValidURL(normalized.website, { allowProtocolLess: true })) {
                setErrors({ website: (t("invalid_website") as string) || "" });
                return;
            }
            finalCompetitors = [...competitors, normalized];
        }

        onNext({
            competitors: finalCompetitors,
            competitorsDraft: {
                name: "",
                description: "",
                website: "",
                facebook: "",
                instagram: "",
                tiktok: "",
                twitter: "",
                swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            },
        });
    };

    // Keep competitors synced with parent data
    useEffect(() => {
        setCompetitors(data.competitors || []);
    }, [data?.competitors]);

    useEffect(() => {
        // Only update currentCompetitor from parent if we're not in editing mode
        if (editingIndex === null) {
            setCurrentCompetitor(
                data.competitorsDraft ||
                    data.currentCompetitorDraft || {
                        name: "",
                        description: "",
                        website: "",
                        facebook: "",
                        instagram: "",
                        tiktok: "",
                        twitter: "",
                        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
                    },
            );
        }
    }, [data?.competitorsDraft, data?.currentCompetitorDraft, editingIndex]);

    useEffect(() => {
        if (typeof onUpdate === "function") onUpdate({ competitors });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [competitors]);

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold transition-colors duration-300">{t("competitor_analysis")}</h2>

            <p className="text-light-600 dark:text-dark-400 mb-4 text-sm transition-colors duration-300">{t("competitor_analysis_help")}</p>

            <div id="competitor-form" className="bg-dark-50 dark:bg-dark-800/50 space-y-4 rounded-lg p-4">
                {editingIndex !== null && (
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-dark-700 dark:text-secdark-200 text-sm font-medium">{t("editing_competitor")}</p>
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="text-light-600 hover:text-light-900 text-sm"
                        >
                            {t("cancel")}
                        </button>
                    </div>
                )}
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("competitor_name")}</label>
                                <input
                                    type="text"
                                    value={currentCompetitor.name || ""}
                                    onChange={(e) => {
                                        const updated = { ...currentCompetitor, name: e.target.value };
                                        setCurrentCompetitor(updated);
                                        if (errors.name) setErrors({ ...errors, name: "" });
                                    }}
                                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.name ? "border-danger-500" : "border-light-600"}`}
                                />
                                {errors.name && <p className="text-danger-500 mt-1 text-sm">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("website_url")}</label>
                                <input
                                    type="text"
                                    value={currentCompetitor.website || ""}
                                    onChange={(e) => {
                                        const stored = e.target.value ? e.target.value.trim() : "";
                                        const updated = { ...currentCompetitor, website: stored };
                                        setCurrentCompetitor(updated);
                                        if (errors.website) setErrors({ ...errors, website: "" });
                                    }}
                                    placeholder={t("website_placeholder")}
                                    dir={dirFor(t("website_placeholder"))}
                                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.website ? "border-danger-500" : "border-light-600"}`}
                                />
                                {errors.website && <p className="text-danger-500 mt-1 text-sm">{errors.website}</p>}
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("description")}</label>
                            <textarea
                                value={currentCompetitor.description || ""}
                                onChange={(e) => {
                                    const updated = { ...currentCompetitor, description: e.target.value };
                                    setCurrentCompetitor(updated);
                                    if (errors.description) setErrors({ ...errors, description: "" });
                                }}
                                rows={3}
                                className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full resize-none rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.description ? "border-danger-500" : "border-light-600"}`}
                            />
                            {errors.description && <p className="text-danger-500 mt-1 text-sm">{errors.description}</p>}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    dir="ltr"
                                    className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium"
                                >
                                    {t("facebook_label")}
                                </label>
                                <input
                                    type="text"
                                    value={currentCompetitor.facebook || ""}
                                    onChange={(e) => {
                                        const stored = e.target.value ? e.target.value.trim() : "";
                                        const updated = { ...currentCompetitor, facebook: stored };
                                        setCurrentCompetitor(updated);
                                    }}
                                    placeholder="https://facebook.com/..."
                                    dir={dirFor("https://facebook.com/...")}
                                    className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label
                                    dir="ltr"
                                    className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium"
                                >
                                    {t("instagram_label")}
                                </label>
                                <input
                                    type="text"
                                    value={currentCompetitor.instagram || ""}
                                    onChange={(e) => {
                                        const stored = e.target.value ? e.target.value.trim() : "";
                                        const updated = { ...currentCompetitor, instagram: stored };
                                        setCurrentCompetitor(updated);
                                    }}
                                    placeholder="https://instagram.com/..."
                                    dir={dirFor("https://instagram.com/...")}
                                    className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-md text-light-900 dark:text-dark-50 mb-2 font-medium">{t("competitor_swot")}</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {(["strengths", "weaknesses", "opportunities", "threats"] as const).map((category) => {
                                    const inputKey = category.slice(0, -1) as "strength" | "weakness" | "opportunity" | "threat";
                                    return (
                                        <div
                                            key={category}
                                            className="space-y-2"
                                        >
                                            <label className="text-light-600 dark:text-dark-400 block text-xs font-medium">{t(category)}</label>
                                            
                                            {/* Add new SWOT item input */}
                                            <div className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={swotInput[inputKey]}
                                                    onChange={(e) => setSwotInput({ ...swotInput, [inputKey]: e.target.value })}
                                                    onKeyPress={(e: KeyboardEvent<HTMLInputElement>) => {
                                                        if ((e as KeyboardEvent<HTMLInputElement>).key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddSwotItem(category);
                                                        }
                                                    }}
                                                    className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 flex-1 rounded border bg-white px-2 py-1 text-sm transition-colors duration-300"
                                                    placeholder={t(`add_${inputKey}`)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSwotItem(category)}
                                                    className="text-light-500 px-2 hover:text-light-700"
                                                    aria-label={`add-${category}`}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            
                                            {/* List of SWOT items with edit capability */}
                                            <div className="space-y-2">
                                                {(currentCompetitor.swot?.[category] || []).map((item: string, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="dark:bg-dark-800 flex items-center justify-between rounded bg-white px-2 py-1 text-xs"
                                                    >
                                                        {editingSwotItem.category === category && editingSwotItem.index === idx ? (
                                                            <div className="flex flex-1 items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={editingSwotItem.value}
                                                                    onChange={(e) => setEditingSwotItem({ ...editingSwotItem, value: e.target.value })}
                                                                    onKeyPress={(e) => {
                                                                        if (e.key === "Enter") {
                                                                            e.preventDefault();
                                                                            handleUpdateSwotItem();
                                                                        }
                                                                    }}
                                                                    className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 flex-1 rounded border bg-white px-2 py-1 text-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                                    autoFocus
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleUpdateSwotItem}
                                                                    className="text-primary-600 hover:text-primary-700"
                                                                >
                                                                    {t("save")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleCancelEditSwotItem}
                                                                    className="text-light-500 hover:text-light-700"
                                                                >
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="text-light-900 dark:text-dark-50 flex-1 break-words">{item}</span>
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleEditSwotItem(category, idx, item)}
                                                                        className="text-danger-500 hover:text-danger-600"
                                                                        title={t("edit")}
                                                                    >
                                                                        <Edit2 size={12} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveSwotItem(category, idx)}
                                                                        className="text-red-500 hover:text-red-600"
                                                                        title={t("remove")}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={handleAddOrUpdateCompetitor}
                                className="btn-ghost flex items-center gap-2"
                            >
                                {editingIndex !== null ? (
                                    <>
                                        <Edit2 size={16} />
                                        {t("update_competitor")}
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        {t("add_competitor")}
                                    </>
                                )}
                            </button>
                            
                            {editingIndex !== null && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="btn-ghost text-light-600 flex items-center gap-2"
                                >
                                    {t("cancel")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {competitors.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-dark-700 dark:text-secdark-200 text-sm font-medium">
                            {t("added_competitors")} ({competitors.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {competitors.map((competitor, index) => (
                                <div
                                    key={index}
                                    className={`border-light-600 dark:border-dark-700 dark:bg-dark-800 rounded-lg border bg-white p-3 transition-colors duration-300 ${
                                        editingIndex === index ? "ring-primary-500 ring-2" : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-light-900 dark:text-dark-50 truncate font-medium">{competitor.name}</h4>
                                            <p className="text-light-600 dark:text-dark-400 line-clamp-3 text-sm">{competitor.description}</p>
                                        </div>
                                        <div className="flex flex-shrink-0 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                                className="text-light-500"
                                                aria-expanded={expandedIndex === index}
                                            >
                                                {expandedIndex === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEditCompetitor(index)}
                                                className="text-danger-500 hover:text-danger-600"
                                                title={t("edit_competitor")}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCompetitor(index)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {expandedIndex === index && (
                                        <div className="border-dark-200 dark:border-dark-700 mt-3 border-t pt-3 text-sm">
                                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                                {competitor.swot?.strengths && competitor.swot.strengths.length > 0 && (
                                                    <div>
                                                        <strong className="text-green-600">{t("strengths")}:</strong>
                                                        <ul className="list-inside list-disc">
                                                            {(competitor.swot?.strengths || []).map((s, i) => (
                                                                <li key={i}>{s}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {competitor.swot?.weaknesses && competitor.swot.weaknesses.length > 0 && (
                                                    <div>
                                                        <strong className="text-danger-600">{t("weaknesses")}:</strong>
                                                        <ul className="list-inside list-disc">
                                                            {(competitor.swot?.weaknesses || []).map((w, i) => (
                                                                <li key={i}>{w}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {competitor.swot?.opportunities && competitor.swot.opportunities.length > 0 && (
                                                    <div>
                                                        <strong className="text-blue-600">{t("opportunities")}:</strong>
                                                        <ul className="list-inside list-disc">
                                                            {(competitor.swot?.opportunities || []).map((o, i) => (
                                                                <li key={i}>{o}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {competitor.swot?.threats && competitor.swot.threats.length > 0 && (
                                                    <div>
                                                        <strong className="text-yellow-600">{t("threats")}:</strong>
                                                        <ul className="list-inside list-disc">
                                                            {(competitor.swot?.threats || []).map((t, i) => (
                                                                <li key={i}>{t}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex flex-col-reverse justify-between gap-4 pt-4 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => onPrevious({ competitors })}
                        className="btn-ghost px-6 py-2"
                    >
                        {t("previous")}
                    </button>
                    <button
                        type="submit"
                        className="btn-primary px-6 py-2"
                    >
                        {isLast ? t("complete") : t("next")}
                    </button>
                </div>
            </div>
        </form>
    );
};