import { useState, useEffect } from "react";
import type { FC } from "react";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import fieldValidations from "@/constants/validations";

type Segment = {
    name?: string;
    description?: string;
    // Backend expects arrays for these fields
    ageRange?: string[];
    gender?: Array<"all" | "male" | "female" | "other">;
    // interests removed — use ageRange/area/governorate instead
    area?: string[];
    governorate?: string[];
    note?: string;
    productName?: string[];
    population?: number; // Changed from array to number
};

type SegmentsStepProps = {
    data?: { segments?: Segment[]; segmentsDraft?: Segment };
    onNext: (payload: any) => void;
    onPrevious: (payload: any) => void;
    onUpdate?: (payload: any) => void;
    isLoading?: boolean; // Add loading prop
};

export const SegmentsStep: FC<SegmentsStepProps> = ({ data = {}, onNext, onPrevious, onUpdate, isLoading = false }) => {
    const { t } = useLang();
    
    const [segments, setSegments] = useState<Segment[]>(data.segments || []);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [currentSegment, setCurrentSegment] = useState<Segment>(
        data.segmentsDraft || {
            name: "",
            description: "",
            ageRange: [],
            gender: ["all"],
            productName: [],
            area: [],
            governorate: [],
            note: "",
            population: undefined,
        },
    );
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [newProductName, setNewProductName] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [newArea, setNewArea] = useState<string>("");
    const [newGovernorate, setNewGovernorate] = useState<string>("");
    const [newAgeRange, setNewAgeRange] = useState<string>("");

    const addAgeRange = () => {
        const val = (newAgeRange || "").trim().replace(/[^0-9-]/g, "");
        if (!val) return;
        const arr = Array.isArray(currentSegment.ageRange) ? [...currentSegment.ageRange, val] : [val];
        const next = { ...currentSegment, ageRange: arr } as Segment;
        setCurrentSegment(next);
        setNewAgeRange("");
        if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
    };

    const handleAddOrUpdateSegment = () => {
        const newErrors: Record<string, string> = {};

        // Validate name is required
        if (!currentSegment.name || !currentSegment.name.trim()) {
            newErrors.name = (t(fieldValidations.segmentName.messageKey) as string) || "Segment name is required";
            setErrors(newErrors);
            return;
        }

        // Clean the segment data
        const cleanedSegment: Segment = {
            name: currentSegment.name.trim(),
        };

        if (currentSegment.productName && Array.isArray(currentSegment.productName) && currentSegment.productName.length > 0) {
            cleanedSegment.productName = currentSegment.productName.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
        }

        if (currentSegment.description && currentSegment.description.trim()) {
            cleanedSegment.description = currentSegment.description.trim();
        }

        if (currentSegment.ageRange && Array.isArray(currentSegment.ageRange) && currentSegment.ageRange.length > 0) {
            cleanedSegment.ageRange = currentSegment.ageRange.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
        }

        if (currentSegment.area && currentSegment.area.length > 0) {
            cleanedSegment.area = currentSegment.area.filter((i) => i.trim().length > 0);
        }

        // Fix: Handle population as number, not array
        if (currentSegment.population !== undefined && currentSegment.population !== null && currentSegment.population !== 0) {
            cleanedSegment.population = currentSegment.population;
        }

        if (currentSegment.governorate && currentSegment.governorate.length > 0) {
            cleanedSegment.governorate = currentSegment.governorate.filter((i) => i.trim().length > 0);
        }

        // Map gender to an array as backend expects
        if (currentSegment.gender && Array.isArray(currentSegment.gender)) {
            cleanedSegment.gender = currentSegment.gender.length > 0 ? currentSegment.gender : ["all"];
        } else if (currentSegment.gender && typeof currentSegment.gender === "string") {
            cleanedSegment.gender = currentSegment.gender !== "all" ? [currentSegment.gender as any] : ["all"];
        } else {
            cleanedSegment.gender = ["all"];
        }

        let next: Segment[];
        if (editingIndex !== null) {
            // Update existing segment
            next = [...segments];
            next[editingIndex] = cleanedSegment;
            setEditingIndex(null);
        } else {
            // Add new segment
            next = [...segments, cleanedSegment];
        }
        
        setSegments(next);
        const emptySegment: Segment = {
            name: "",
            description: "",
            ageRange: [],
            gender: ["all"],
            productName: [],
            area: [],
            governorate: [],
            population: undefined,
            note: "",
        };
        if (typeof onUpdate === "function") onUpdate({ segments: next, segmentsDraft: emptySegment });
        setCurrentSegment(emptySegment);
        setNewProductName("");
        setNewArea("");
        setNewGovernorate("");
        setNewAgeRange("");
        setErrors({});
    };

    const handleEditSegment = (index: number) => {
        const segmentToEdit = { ...segments[index] };
        // Ensure arrays are properly initialized and population is handled correctly
        setCurrentSegment({
            ...segmentToEdit,
            productName: segmentToEdit.productName || [],
            ageRange: segmentToEdit.ageRange || [],
            area: segmentToEdit.area || [],
            governorate: segmentToEdit.governorate || [],
            population: segmentToEdit.population !== undefined ? segmentToEdit.population : undefined,
        });
        setEditingIndex(index);
        setErrors({});
        // Reset input fields
        setNewProductName("");
        setNewArea("");
        setNewGovernorate("");
        setNewAgeRange("");
        // Scroll to form
        document.getElementById("segment-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleRemoveSegment = (index: number) => {
        const next = segments.filter((_, i) => i !== index);
        setSegments(next);
        if (typeof onUpdate === "function") onUpdate({ segments: next });
        
        // If we're editing the segment that was just deleted, reset the form
        if (editingIndex === index) {
            setEditingIndex(null);
            setCurrentSegment({
                name: "",
                description: "",
                ageRange: [],
                gender: ["all"],
                productName: [],
                area: [],
                governorate: [],
                population: undefined,
                note: "",
            });
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setCurrentSegment({
            name: "",
            description: "",
            ageRange: [],
            gender: ["all"],
            productName: [],
            area: [],
            governorate: [],
            population: undefined,
            note: "",
        });
        setNewProductName("");
        setNewArea("");
        setNewGovernorate("");
        setNewAgeRange("");
        setErrors({});
        if (typeof onUpdate === "function") onUpdate({ 
            segmentsDraft: {
                name: "",
                description: "",
                ageRange: [],
                gender: ["all"],
                productName: [],
                area: [],
                governorate: [],
                population: undefined,
                note: "",
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prevent multiple submissions
        if (isSubmitting || isLoading) return;
        
        setIsSubmitting(true);

        // Auto-add current draft if it has content and we're not editing
        let finalSegments = [...segments];
        if (editingIndex === null && currentSegment.name?.trim()) {
            // Clean the segment data
            const cleanedSegment: Segment = {
                name: currentSegment.name.trim(),
            };

            if (currentSegment.description && currentSegment.description.trim()) {
                cleanedSegment.description = currentSegment.description.trim();
            }

            if (currentSegment.ageRange && Array.isArray(currentSegment.ageRange) && currentSegment.ageRange.length > 0) {
                cleanedSegment.ageRange = currentSegment.ageRange.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
            }

            if (currentSegment.gender && Array.isArray(currentSegment.gender)) {
                cleanedSegment.gender = currentSegment.gender.length > 0 ? currentSegment.gender : ["all"];
            } else if (currentSegment.gender && typeof currentSegment.gender === "string") {
                cleanedSegment.gender = currentSegment.gender !== "all" ? [currentSegment.gender as any] : ["all"];
            } else {
                cleanedSegment.gender = ["all"];
            }

            if (currentSegment.productName && Array.isArray(currentSegment.productName) && currentSegment.productName.length > 0) {
                cleanedSegment.productName = currentSegment.productName.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
            }

            // Fix: Handle population as number
            if (currentSegment.population !== undefined && currentSegment.population !== null && currentSegment.population !== 0) {
                cleanedSegment.population = currentSegment.population;
            }

            if (currentSegment.area && currentSegment.area.length > 0) {
                cleanedSegment.area = currentSegment.area.filter((i) => i.trim().length > 0);
            }

            if (currentSegment.governorate && currentSegment.governorate.length > 0) {
                cleanedSegment.governorate = currentSegment.governorate.filter((i) => i.trim().length > 0);
            }

            finalSegments = [...segments, cleanedSegment];
        }

        try {
            // Call onNext and wait for it to complete (assuming it returns a promise)
            await onNext({
                segments: finalSegments,
                segmentsDraft: {
                    name: "",
                    description: "",
                    ageRange: [],
                    gender: ["all"],
                    productName: [],
                    area: [],
                    governorate: [],
                    population: undefined,
                    note: "",
                },
            });
        } catch (error) {
            console.error("Error submitting segments:", error);
        } finally {
            setIsSubmitting(false);
        }
        
        setNewProductName("");
        setNewArea("");
        setNewGovernorate("");
    };

    // Keep segments synced with parent data so values persist when navigating
    useEffect(() => {
        setSegments(data.segments || []);
    }, [data?.segments]);

    useEffect(() => {
        // Only update currentSegment from parent if we're not in editing mode
        if (editingIndex === null) {
            const draft = (data.segmentsDraft as any) || null;
            const normalized = draft
                ? {
                      ...draft,
                      productName: Array.isArray(draft.productName) ? draft.productName : draft.productName ? [draft.productName] : [],
                      area: Array.isArray(draft.area)
                          ? draft.area
                          : draft.area
                            ? ("" + draft.area)
                                  .split(/[,;\n]+/)
                                  .map((s: string) => s.trim())
                                  .filter(Boolean)
                            : [],
                      governorate: Array.isArray(draft.governorate)
                          ? draft.governorate
                          : draft.governorate
                            ? ("" + draft.governorate)
                                  .split(/[,;\n]+/)
                                  .map((s: string) => s.trim())
                                  .filter(Boolean)
                            : [],
                      // Fix: Handle population as single number
                      population: typeof draft.population === "number" 
                          ? draft.population 
                          : draft.population !== undefined && draft.population !== null && draft.population !== ""
                              ? Number(draft.population)
                              : undefined,
                  }
                : {
                      name: "",
                      description: "",
                      ageRange: [],
                      gender: ["all"],
                      productName: [],
                      area: [],
                      governorate: [],
                      population: undefined,
                      note: "",
                  };

            setCurrentSegment(normalized as Segment);
        }
        setNewProductName("");
        setNewArea("");
        setNewGovernorate("");
        setNewAgeRange("");
    }, [data?.segmentsDraft, editingIndex]);

    useEffect(() => {
        if (typeof onUpdate === "function") onUpdate({ segments });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segments]);

    // Determine if the submit button should be disabled
    const isButtonDisabled = isSubmitting || isLoading;

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            {/* Loading Overlay */}
            {(isSubmitting || isLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-dark-50 dark:bg-dark-800 rounded-lg p-8 shadow-xl">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="text-primary-600 h-12 w-12 animate-spin" />
                            <p className="text-light-900 dark:text-dark-50 text-lg font-semibold">
                                {t("creating_client") || "Creating your client..."}
                            </p>
                            <p className="text-light-600 dark:text-dark-400 text-sm">
                                {t("please_wait") || "Please wait, this may take a moment"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("target_segments")}</h2>

            <p className="text-light-600 dark:text-dark-400 mb-4 text-sm">{t("target_segments_help")}</p>

            <div id="segment-form" className="bg-dark-50 dark:bg-dark-800/50 space-y-3 rounded-lg p-4">
                {editingIndex !== null && (
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-dark-700 dark:text-secdark-200 text-sm font-medium">{t("editing_segment")}</p>
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="text-light-600 hover:text-light-900 text-sm"
                            disabled={isButtonDisabled}
                        >
                            {t("cancel")}
                        </button>
                    </div>
                )}
                
                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("segment_name")}</label>
                    <input
                        type="text"
                        value={currentSegment.name || ""}
                        onChange={(e) => {
                            const next = { ...currentSegment, name: e.target.value } as Segment;
                            setCurrentSegment(next);
                            if (errors.name) setErrors({ ...errors, name: "" });
                            if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                        }}
                        placeholder={t("segment_name_placeholder") as string}
                        disabled={isButtonDisabled}
                        className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.name ? "border-danger-500" : "border-light-600"}`}
                    />
                    {errors.name && <p className="text-danger-500 mt-1 text-sm">{errors.name}</p>}
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("description")}</label>
                    <textarea
                        value={currentSegment.description || ""}
                        onChange={(e) => {
                            const next = { ...currentSegment, description: e.target.value } as Segment;
                            setCurrentSegment(next);
                            if (errors.description) setErrors({ ...errors, description: "" });
                        }}
                        rows={2}
                        disabled={isButtonDisabled}
                        placeholder={t("describe_segment_placeholder") as string}
                        className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${errors.description ? "border-danger-500" : "border-light-600"}`}
                    />
                    {errors.description && <p className="text-danger-500 mt-1 text-sm">{errors.description}</p>}
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("product_name")}</label>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const val = newProductName.trim();
                                    if (!val) return;
                                    const arr = Array.isArray(currentSegment.productName) ? [...currentSegment.productName, val] : [val];
                                    const next = { ...currentSegment, productName: arr } as Segment;
                                    setCurrentSegment(next);
                                    setNewProductName("");
                                    if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                                }
                            }}
                            disabled={isButtonDisabled}
                            placeholder={t("product_name_placeholder") as string}
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const val = newProductName.trim();
                                if (!val) return;
                                const arr = Array.isArray(currentSegment.productName) ? [...currentSegment.productName, val] : [val];
                                const next = { ...currentSegment, productName: arr } as Segment;
                                setCurrentSegment(next);
                                setNewProductName("");
                                if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                            }}
                            disabled={isButtonDisabled}
                            className="btn-ghost flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} />
                            {t("add")}
                        </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {(currentSegment.productName || []).map((p, i) => (
                            <span
                                key={i}
                                className="bg-light-50 dark:bg-dark-700 text-light-900 dark:text-dark-50 border-light-200 dark:border-dark-700 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                            >
                                <span>{p}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const arr = (currentSegment.productName || []).filter((_, idx) => idx !== i);
                                        const next = { ...currentSegment, productName: arr } as Segment;
                                        setCurrentSegment(next);
                                        if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                                    }}
                                    disabled={isButtonDisabled}
                                    className="text-danger-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("age_range")}</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newAgeRange}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9-]/g, "");
                                    setNewAgeRange(value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addAgeRange();
                                    }
                                }}
                                disabled={isButtonDisabled}
                                placeholder={t("age_range_placeholder") as string}
                                className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                type="button"
                                onClick={() => addAgeRange()}
                                disabled={isButtonDisabled}
                                className="btn-ghost flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus size={14} />
                                {t("add")}
                            </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                            {(currentSegment.ageRange || []).map((a, i) => (
                                <span
                                    key={i}
                                    className="bg-light-50 dark:bg-dark-700 text-light-900 dark:text-dark-50 border-light-200 dark:border-dark-700 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                                >
                                    <span>{a}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const arr = (currentSegment.ageRange || []).filter((_, idx) => idx !== i);
                                            const next = { ...currentSegment, ageRange: arr } as Segment;
                                            setCurrentSegment(next);
                                            if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                                        }}
                                        disabled={isButtonDisabled}
                                        className="text-danger-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("gender")}</label>
                        <select
                            value={(currentSegment.gender && currentSegment.gender[0]) || "all"}
                            onChange={(e) => {
                                const next = { ...currentSegment, gender: [e.target.value as "all" | "male" | "female" | "other"] } as Segment;
                                setCurrentSegment(next);
                                if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                            }}
                            disabled={isButtonDisabled}
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="all">{t("all")}</option>
                            <option value="male">{t("male")}</option>
                            <option value="female">{t("female")}</option>
                            <option value="other">{t("other")}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("governorate")}</label>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newGovernorate}
                            onChange={(e) => setNewGovernorate(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const val = newGovernorate.trim();
                                    if (!val) return;
                                    const arr = Array.isArray(currentSegment.governorate) ? [...currentSegment.governorate, val] : [val];
                                    const next = { ...currentSegment, governorate: arr } as Segment;
                                    setCurrentSegment(next);
                                    setNewGovernorate("");
                                    if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                                }
                            }}
                            disabled={isButtonDisabled}
                            placeholder={t("governorate_placeholder") as string}
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const val = newGovernorate.trim();
                                if (!val) return;
                                const arr = Array.isArray(currentSegment.governorate) ? [...currentSegment.governorate, val] : [val];
                                const next = { ...currentSegment, governorate: arr } as Segment;
                                setCurrentSegment(next);
                                setNewGovernorate("");
                                if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                            }}
                            disabled={isButtonDisabled}
                            className="btn-ghost flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} />
                            {t("add")}
                        </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {(currentSegment.governorate || []).map((g, i) => (
                            <span
                                key={i}
                                className="bg-light-50 dark:bg-dark-700 text-light-900 dark:text-dark-50 border-light-200 dark:border-dark-700 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                            >
                                <span>{g}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const arr = (currentSegment.governorate || []).filter((_, idx) => idx !== i);
                                        const next = { ...currentSegment, governorate: arr } as Segment;
                                        setCurrentSegment(next);
                                        if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                                    }}
                                    disabled={isButtonDisabled}
                                    className="text-danger-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("areas")}</label>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newArea}
                            onChange={(e) => setNewArea(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    const val = newArea.trim();
                                    if (!val) return;
                                    const arr = Array.isArray(currentSegment.area) ? [...currentSegment.area, val] : [val];
                                    const next = { ...currentSegment, area: arr } as Segment;
                                    setCurrentSegment(next);
                                    setNewArea("");
                                    if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                                }
                            }}
                            disabled={isButtonDisabled}
                            placeholder={t("area_placeholder") as string}
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                const val = newArea.trim();
                                if (!val) return;
                                const arr = Array.isArray(currentSegment.area) ? [...currentSegment.area, val] : [val];
                                const next = { ...currentSegment, area: arr } as Segment;
                                setCurrentSegment(next);
                                setNewArea("");
                                if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                            }}
                            disabled={isButtonDisabled}
                            className="btn-ghost flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} />
                            {t("add")}
                        </button>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                        {(currentSegment.area || []).map((a, i) => (
                            <span
                                key={i}
                                className="bg-light-50 dark:bg-dark-700 text-light-900 dark:text-dark-50 border-light-200 dark:border-dark-700 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                            >
                                <span>{a}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const arr = (currentSegment.area || []).filter((_, idx) => idx !== i);
                                        const next = { ...currentSegment, area: arr } as Segment;
                                        setCurrentSegment(next);
                                        if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                                    }}
                                    disabled={isButtonDisabled}
                                    className="text-danger-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("population")}</label>
                    <input
                        type="number"
                        inputMode="numeric"
                        value={currentSegment.population !== undefined && currentSegment.population !== null ? currentSegment.population : ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            const num = v === "" ? undefined : Number(v);
                            const next = { ...currentSegment, population: num } as Segment;
                            setCurrentSegment(next);
                            if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                        }}
                        disabled={isButtonDisabled}
                        placeholder={t("population_placeholder") as string}
                        className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleAddOrUpdateSegment}
                        disabled={isButtonDisabled}
                        className="btn-ghost flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {editingIndex !== null ? (
                            <>
                                <Edit2 size={16} />
                                {t("update_segment")}
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                {t("add_segment")}
                            </>
                        )}
                    </button>
                    
                    {editingIndex !== null && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isButtonDisabled}
                            className="btn-ghost text-light-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t("cancel")}
                        </button>
                    )}
                </div>
            </div>

            {segments.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-dark-700 dark:text-secdark-200 text-sm font-medium">{`${t("added_segments")} (${segments.length})`}</h3>
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            className={`border-light-600 dark:border-dark-700 dark:bg-dark-800 flex items-start justify-between rounded-lg border bg-white p-3 transition-colors duration-300 ${
                                editingIndex === index ? "ring-primary-500 ring-2" : ""
                            }`}
                        >
                            <div className="flex-1">
                                <h4 className="text-light-900 dark:text-dark-50 font-medium">{segment.name}</h4>
                                <p className="text-light-600 dark:text-dark-400 text-sm">{segment.description}</p>
                                <div className="text-dark-500 dark:text-dark-400 mt-2 flex flex-wrap gap-4 text-xs">
                                    {segment.ageRange && segment.ageRange.length > 0 && (
                                        <span>Age: {segment.ageRange.join(", ")}</span>
                                    )}
                                    {segment.gender && Array.isArray(segment.gender) && !segment.gender.includes("all") && segment.gender.length > 0 && (
                                        <span>Gender: {segment.gender.join(", ")}</span>
                                    )}
                                    {segment.productName && segment.productName.length > 0 && (
                                        <span>Product: {segment.productName.join(", ")}</span>
                                    )}
                                    {segment.population !== undefined && segment.population !== null && (
                                        <span>Population: {segment.population.toLocaleString()}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleEditSegment(index)}
                                    disabled={isButtonDisabled}
                                    className="text-danger-600 hover:text-danger-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={t("edit_segment")}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSegment(index)}
                                    disabled={isButtonDisabled}
                                    className="text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={t("remove_segment")}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-between gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => onPrevious({ segments })}
                    disabled={isButtonDisabled}
                    className="btn-ghost px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {t("previous")}
                </button>
                <button
                    type="submit"
                    disabled={isButtonDisabled}
                    className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {(isSubmitting || isLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t("complete")}
                </button>
            </div>
        </form>
    );
};