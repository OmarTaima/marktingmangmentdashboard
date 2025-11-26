import { useState, useEffect } from "react";
import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
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
    population?: number[];
};

type SegmentsStepProps = {
    data?: { segments?: Segment[]; segmentsDraft?: Segment };
    onNext: (payload: any) => void;
    onPrevious: (payload: any) => void;
    onUpdate?: (payload: any) => void;
};

export const SegmentsStep: FC<SegmentsStepProps> = ({ data = {}, onNext, onPrevious, onUpdate }) => {
    const { t } = useLang();
    // helper to normalize population into a single number (first valid) or undefined
    const normalizePopulation = (val: any): number | undefined => {
        if (val === undefined || val === null || val === "") return undefined;
        if (Array.isArray(val)) {
            const first = val.length > 0 ? val[0] : undefined;
            const n = first === undefined || first === null ? NaN : Number(first);
            return Number.isNaN(n) ? undefined : n;
        }
        if (typeof val === "string") {
            const parts = val
                .toString()
                .split(/[,;\n]+/)
                .map((s: string) => s.trim())
                .filter(Boolean);
            const n = parts.length > 0 ? Number(parts[0]) : NaN;
            return Number.isNaN(n) ? undefined : n;
        }
        if (typeof val === "number") {
            return Number.isNaN(val) ? undefined : val;
        }
        return undefined;
    };
    const [segments, setSegments] = useState<Segment[]>(data.segments || []);
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
        },
    );

    const [newProductName, setNewProductName] = useState<string>("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    // Keep textual editors for age ranges. Areas and governorate use chip-style inputs now.
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

    const handleAddSegment = () => {
        const newErrors: Record<string, string> = {};

        // Validate name is required
        if (!currentSegment.name || !currentSegment.name.trim()) {
            newErrors.name = (t(fieldValidations.segmentName.messageKey) as string) || "Segment name is required";
            setErrors(newErrors);
            return;
        }

        // Clean the segment data - remove empty strings and keep only meaningful values
        const cleanedSegment: Segment = {
            name: currentSegment.name.trim(),
        };

        if (currentSegment.productName && Array.isArray(currentSegment.productName) && currentSegment.productName.length > 0) {
            cleanedSegment.productName = currentSegment.productName.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
        }

        if (currentSegment.description && currentSegment.description.trim()) {
            cleanedSegment.description = currentSegment.description.trim();
        }

        // Use ageRange array from currentSegment (set by the age range input)
        if (currentSegment.ageRange && Array.isArray(currentSegment.ageRange) && currentSegment.ageRange.length > 0) {
            cleanedSegment.ageRange = currentSegment.ageRange.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
        }

        if (currentSegment.area && currentSegment.area.length > 0) {
            cleanedSegment.area = currentSegment.area.filter((i) => i.trim().length > 0);
        }

        if (currentSegment.population !== undefined && currentSegment.population !== null) {
            cleanedSegment.population = normalizePopulation(currentSegment.population) as any;
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

        // incomeLevel removed — not included in payload

        const next = [...segments, cleanedSegment];
        setSegments(next);
        const emptySegment: Segment = {
            name: "",
            description: "",
            ageRange: [],
            gender: ["all"],
            productName: [],
            area: [],
            governorate: [],
            population: [],
            note: "",
        };
        if (typeof onUpdate === "function") onUpdate({ segments: next, segmentsDraft: emptySegment });
        setCurrentSegment(emptySegment);
        setNewProductName("");
        setNewArea("");
        setNewGovernorate("");
        setErrors({});
    };

    const handleRemoveSegment = (index: number) => {
        const next = segments.filter((_, i) => i !== index);
        setSegments(next);
        if (typeof onUpdate === "function") onUpdate({ segments: next });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-add current draft if it has content
        let finalSegments = [...segments];
        if (currentSegment.name?.trim()) {
            // Clean the segment data
            const cleanedSegment: Segment = {
                name: currentSegment.name.trim(),
            };

            if (currentSegment.description && currentSegment.description.trim()) {
                cleanedSegment.description = currentSegment.description.trim();
            }

            // map ageRange array from currentSegment
            if (currentSegment.ageRange && Array.isArray(currentSegment.ageRange) && currentSegment.ageRange.length > 0) {
                cleanedSegment.ageRange = currentSegment.ageRange.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
            }

            // map gender to array
            if (currentSegment.gender && Array.isArray(currentSegment.gender)) {
                cleanedSegment.gender = currentSegment.gender.length > 0 ? currentSegment.gender : ["all"];
            } else if (currentSegment.gender && typeof currentSegment.gender === "string") {
                cleanedSegment.gender = currentSegment.gender !== "all" ? [currentSegment.gender as any] : ["all"];
            } else {
                cleanedSegment.gender = ["all"];
            }

            // interests removed — nothing to keep here

            if (currentSegment.productName && Array.isArray(currentSegment.productName) && currentSegment.productName.length > 0) {
                cleanedSegment.productName = currentSegment.productName.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);
            }

            if (currentSegment.population !== undefined && currentSegment.population !== null) {
                cleanedSegment.population = normalizePopulation(currentSegment.population) as any;
            }

            if (currentSegment.area && currentSegment.area.length > 0) {
                cleanedSegment.area = currentSegment.area.filter((i) => i.trim().length > 0);
            }

            if (currentSegment.governorate && currentSegment.governorate.length > 0) {
                cleanedSegment.governorate = currentSegment.governorate.filter((i) => i.trim().length > 0);
            }
            // incomeLevel removed — not included in payload

            finalSegments = [...segments, cleanedSegment];
        }

        // Normalize population for backend: send a single number (server expects number)
        const normalizedForServer = finalSegments.map((s) => {
            let val: number | undefined;
            if (Array.isArray(s.population)) {
                const n = s.population.length > 0 ? Number(s.population[0]) : undefined;
                val = !Number.isNaN(n) ? n : undefined;
            } else if (s.population !== undefined && s.population !== null && s.population !== "") {
                const n = Number(s.population);
                val = !Number.isNaN(n) ? n : undefined;
            }
            return {
                ...s,
                // send population as a number (server validation expects a number)
                population: typeof val === "number" ? val : undefined,
            } as any;
        });

        onNext({
            segments: normalizedForServer,
            segmentsDraft: {
                name: "",
                description: "",
                ageRange: [],
                gender: ["all"],
                productName: [],
                area: [],
                governorate: [],
                population: [],
                note: "",
            },
        });
        setNewProductName("");
        setNewArea("");
        setNewGovernorate("");
    };

    // Keep segments synced with parent data so values persist when navigating
    useEffect(() => {
        setSegments(data.segments || []);
    }, [data?.segments]);

    useEffect(() => {
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
                  population: Array.isArray(draft.population)
                      ? draft.population.map((n: any) => Number(n)).filter((n: number) => !Number.isNaN(n))
                      : draft.population
                        ? ("" + draft.population)
                              .split(/[,;\n]+/)
                              .map((s: string) => Number((s || "").trim()))
                              .filter((n: number) => !Number.isNaN(n))
                        : [],
              }
            : {
                  name: "",
                  description: "",
                  ageRange: [],
                  gender: ["all"],
                  productName: [],
                  area: [],
                  governorate: [],
                  population: [],
                  note: "",
              };

        setCurrentSegment(normalized as Segment);
        setNewProductName("");
        setNewArea("");
        setNewGovernorate("");
    }, [data?.segmentsDraft]);

    useEffect(() => {
        if (typeof onUpdate === "function") onUpdate({ segments });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segments]);

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("target_segments")}</h2>

            <p className="text-light-600 dark:text-dark-400 mb-4 text-sm">{t("target_segments_help")}</p>

            <div className="bg-dark-50 dark:bg-dark-800/50 space-y-3 rounded-lg p-4">
                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("segment_name")}</label>
                    <input
                        type="text"
                        value={currentSegment.name}
                        onChange={(e) => {
                            const next = { ...currentSegment, name: e.target.value } as Segment;
                            setCurrentSegment(next);
                            if (errors.name) setErrors({ ...errors, name: "" });
                            if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                        }}
                        placeholder={t("segment_name_placeholder") as string}
                        className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.name ? "border-danger-500" : "border-light-600"}`}
                    />
                    {errors.name && <p className="text-danger-500 mt-1 text-sm">{errors.name}</p>}
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("description")}</label>
                    <textarea
                        value={currentSegment.description}
                        onChange={(e) => {
                            const next = { ...currentSegment, description: e.target.value } as Segment;
                            setCurrentSegment(next);
                            if (errors.description) setErrors({ ...errors, description: "" });
                        }}
                        rows={2}
                        placeholder={t("describe_segment_placeholder") as string}
                        className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.description ? "border-danger-500" : "border-light-600"}`}
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
                            placeholder={t("product_name_placeholder") as string}
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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
                            className="btn-ghost flex items-center gap-2"
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
                                    className="text-danger-600"
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
                                placeholder={t("age_range_placeholder") as string}
                                className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => addAgeRange()}
                                className="btn-ghost flex items-center gap-2"
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
                                        className="text-danger-600"
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
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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
                            placeholder={t("governorate_placeholder") as string}
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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
                            className="btn-ghost flex items-center gap-2"
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
                                    className="text-danger-600"
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
                            placeholder={t("area_placeholder") as string}
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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
                            className="btn-ghost flex items-center gap-2"
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
                                    className="text-danger-600"
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
                        value={(currentSegment.population && currentSegment.population[0]) ?? ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            const num = v === "" ? NaN : Number(v);
                            const next = { ...currentSegment, population: Number.isNaN(num) ? [] : [num] } as Segment;
                            setCurrentSegment(next);
                            if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                        }}
                        placeholder={t("population_placeholder") as string}
                        className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAddSegment}
                    className="btn-ghost flex items-center gap-2"
                >
                    <Plus size={16} />
                    {t("add_segment")}
                </button>
            </div>

            {segments.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-dark-700 dark:text-secdark-200 text-sm font-medium">{`${t("added_segments")} (${segments.length})`}</h3>
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            className="border-light-600 dark:border-dark-700 dark:bg-dark-800 flex items-start justify-between rounded-lg border bg-white p-3"
                        >
                            <div className="flex-1">
                                <h4 className="text-light-900 dark:text-dark-50 font-medium">{segment.name}</h4>
                                <p className="text-light-600 dark:text-dark-400 text-sm">{segment.description}</p>
                                <div className="text-dark-500 dark:text-dark-400 mt-2 flex gap-4 text-xs">
                                    {segment.ageRange && (Array.isArray(segment.ageRange) ? segment.ageRange.length > 0 : !!segment.ageRange) && (
                                        <span>Age: {Array.isArray(segment.ageRange) ? segment.ageRange.join(", ") : segment.ageRange}</span>
                                    )}
                                    {segment.gender && Array.isArray(segment.gender) && !segment.gender.includes("all") && (
                                        <span>Gender: {segment.gender.join(", ")}</span>
                                    )}
                                    {segment.productName && Array.isArray(segment.productName) && segment.productName.length > 0 && (
                                        <span>Product: {segment.productName.join(", ")}</span>
                                    )}
                                    {segment.population && Array.isArray(segment.population) && segment.population.length > 0 && (
                                        <span>Population: {segment.population.join(", ")}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveSegment(index)}
                                className="text-danger-500 hover:text-danger-600"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-between gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => onPrevious({ segments })}
                    className="btn-ghost px-6 py-2"
                >
                    {t("previous")}
                </button>
                <button
                    type="submit"
                    className="btn-primary px-6 py-2"
                >
                    {t("next")}
                </button>
            </div>
        </form>
    );
};
