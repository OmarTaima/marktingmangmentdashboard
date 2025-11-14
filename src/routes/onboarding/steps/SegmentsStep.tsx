import { useState, useEffect } from "react";
import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import fieldValidations from "@/constants/validations";

type Segment = {
    name?: string;
    description?: string;
    ageRange?: string;
    gender?: "all" | "male" | "female" | "other";
    interests?: string[];
    incomeLevel?: "low" | "middle" | "high" | "varied";
};

type SegmentsStepProps = {
    data?: { segments?: Segment[]; segmentsDraft?: Segment };
    onNext: (payload: any) => void;
    onPrevious: (payload: any) => void;
    onUpdate?: (payload: any) => void;
};

export const SegmentsStep: FC<SegmentsStepProps> = ({ data = {}, onNext, onPrevious, onUpdate }) => {
    const { t } = useLang();
    const [segments, setSegments] = useState<Segment[]>(data.segments || []);
    const [currentSegment, setCurrentSegment] = useState<Segment>(
        data.segmentsDraft || {
            name: "",
            description: "",
            ageRange: "",
            gender: "all",
            interests: [],
            incomeLevel: undefined,
        },
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [interestsText, setInterestsText] = useState<string>((data.segmentsDraft?.interests || []).join("\n"));

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

        if (currentSegment.description && currentSegment.description.trim()) {
            cleanedSegment.description = currentSegment.description.trim();
        }

        if (currentSegment.ageRange && currentSegment.ageRange.trim()) {
            cleanedSegment.ageRange = currentSegment.ageRange.trim();
        }

        if (currentSegment.gender && currentSegment.gender !== "all") {
            cleanedSegment.gender = currentSegment.gender;
        } else {
            cleanedSegment.gender = "all";
        }

        if (currentSegment.interests && currentSegment.interests.length > 0) {
            cleanedSegment.interests = currentSegment.interests.filter((i) => i.trim().length > 0);
        }

        if (currentSegment.incomeLevel) {
            cleanedSegment.incomeLevel = currentSegment.incomeLevel;
        }

        const next = [...segments, cleanedSegment];
        setSegments(next);
        const emptySegment: Segment = {
            name: "",
            description: "",
            ageRange: "",
            gender: "all",
            interests: [],
            incomeLevel: undefined,
        };
        if (typeof onUpdate === "function") onUpdate({ segments: next, segmentsDraft: emptySegment });
        setCurrentSegment(emptySegment);
        setErrors({});
    };

    const handleRemoveSegment = (index: number) => {
        const next = segments.filter((_, i) => i !== index);
        setSegments(next);
        if (typeof onUpdate === "function") onUpdate({ segments: next });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext({ segments, segmentsDraft: currentSegment });
    };

    // Keep segments synced with parent data so values persist when navigating
    useEffect(() => {
        setSegments(data.segments || []);
    }, [data?.segments]);

    useEffect(() => {
        setCurrentSegment(
            data.segmentsDraft || {
                name: "",
                description: "",
                ageRange: "",
                gender: "all",
                interests: [],
                incomeLevel: undefined,
            },
        );
        setInterestsText((data.segmentsDraft?.interests || []).join("\n"));
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
                            if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                        }}
                        rows={2}
                        placeholder={t("describe_segment_placeholder") as string}
                        className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.description ? "border-danger-500" : "border-light-600"}`}
                    />
                    {errors.description && <p className="text-danger-500 mt-1 text-sm">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("age_range")}</label>
                        <input
                            type="text"
                            value={currentSegment.ageRange || ""}
                            onChange={(e) => {
                                // Only allow numbers and dashes
                                const value = e.target.value.replace(/[^0-9-]/g, "");
                                const next = { ...currentSegment, ageRange: value };
                                setCurrentSegment(next);
                                if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                            }}
                            placeholder={t("age_range_placeholder") as string}
                            className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("gender")}</label>
                        <select
                            value={currentSegment.gender || "all"}
                            onChange={(e) => {
                                const next = { ...currentSegment, gender: e.target.value as "all" | "male" | "female" | "other" };
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
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("interests")}</label>
                    <textarea
                        rows={3}
                        value={interestsText}
                        onChange={(e) => {
                            const raw = e.target.value;
                            setInterestsText(raw);
                        }}
                        onBlur={() => {
                            const interestsArray = (interestsText || "")
                                .split(/[,;\n]+/)
                                .map((i) => i.trim())
                                .filter((i) => i.length > 0);
                            const next = { ...currentSegment, interests: interestsArray };
                            setCurrentSegment(next);
                            if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                        }}
                        placeholder={t("interests_placeholder") as string}
                        className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("income_level")}</label>
                    <select
                        value={currentSegment.incomeLevel || ""}
                        onChange={(e) => {
                            const next = { ...currentSegment, incomeLevel: e.target.value as "low" | "middle" | "high" | "varied" | undefined };
                            setCurrentSegment(next);
                            if (typeof onUpdate === "function") onUpdate({ segmentsDraft: next });
                        }}
                        className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                    >
                        <option value="">{t("select")}</option>
                        <option value="low">{t("low_income")}</option>
                        <option value="middle">{t("middle_income")}</option>
                        <option value="high">{t("high_income")}</option>
                        <option value="varied">{t("varied")}</option>
                    </select>
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
                                    {segment.ageRange && <span>Age: {segment.ageRange}</span>}
                                    {segment.gender && segment.gender !== "all" && <span>Gender: {segment.gender}</span>}
                                    {segment.incomeLevel && <span>Income: {segment.incomeLevel}</span>}
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
