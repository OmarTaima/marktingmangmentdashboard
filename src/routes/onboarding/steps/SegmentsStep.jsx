import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import fieldValidations from "@/constants/validations";

export const SegmentsStep = ({ data, onNext, onPrevious }) => {
    const { t } = useLang();
    const [segments, setSegments] = useState(data.segments || []);
    const [currentSegment, setCurrentSegment] = useState({
        name: "",
        description: "",
        targetAge: "",
        targetGender: "",
        interests: "",
        income: "",
    });

    const [errors, setErrors] = useState({});

    const handleAddSegment = () => {
        const newErrors = {};

        // Make segment name/description optional; validate presence only if provided
        if (currentSegment.name && !currentSegment.name.trim()) {
            newErrors.name = t(fieldValidations.segmentName.messageKey);
        }
        if (currentSegment.description && !currentSegment.description.trim()) {
            newErrors.description = t(fieldValidations.segmentDescription.messageKey);
        }

        setErrors(newErrors);
        setSegments([...segments, currentSegment]);
        setCurrentSegment({
            name: "",
            description: "",
            targetAge: "",
            targetGender: "",
            interests: "",
            income: "",
        });
        setErrors({});
    };

    const handleRemoveSegment = (index) => {
        setSegments(segments.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ segments });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("target_segments")}</h2>

            <p className="text-primary-light-600 dark:text-dark-400 mb-4 text-sm">{t("target_segments_help")}</p>

            <div className="bg-dark-50 dark:bg-dark-800/50 space-y-3 rounded-lg p-4">
                <div>
                    <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">{t("segment_name")}</label>
                    <input
                        type="text"
                        value={currentSegment.name}
                        onChange={(e) => {
                            setCurrentSegment({ ...currentSegment, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: "" });
                        }}
                        placeholder={t("segment_name_placeholder")}
                        className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.name ? "border-danger-500" : "border-primary-light-600"}`}
                    />
                    {errors.name && <p className="text-danger-500 mt-1 text-sm">{errors.name}</p>}
                </div>

                <div>
                    <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">{t("description")}</label>
                    <textarea
                        value={currentSegment.description}
                        onChange={(e) => {
                            setCurrentSegment({ ...currentSegment, description: e.target.value });
                            if (errors.description) setErrors({ ...errors, description: "" });
                        }}
                        rows={2}
                        placeholder={t("describe_segment_placeholder")}
                        className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.description ? "border-danger-500" : "border-primary-light-600"}`}
                    />
                    {errors.description && <p className="text-danger-500 mt-1 text-sm">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">{t("age_range")}</label>
                        <input
                            type="text"
                            value={currentSegment.targetAge}
                            onChange={(e) => {
                                // Only allow numbers and dashes
                                const value = e.target.value.replace(/[^0-9-]/g, "");
                                setCurrentSegment({ ...currentSegment, targetAge: value });
                            }}
                            placeholder={t("age_range_placeholder")}
                            className="border-primary-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">{t("gender")}</label>
                        <select
                            value={currentSegment.targetGender}
                            onChange={(e) => setCurrentSegment({ ...currentSegment, targetGender: e.target.value })}
                            className="border-primary-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        >
                            <option value="">{t("all")}</option>
                            <option value="male">{t("male")}</option>
                            <option value="female">{t("female")}</option>
                            <option value="other">{t("other")}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">{t("interests")}</label>
                    <input
                        type="text"
                        value={currentSegment.interests}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, interests: e.target.value })}
                        placeholder={t("interests_placeholder")}
                        className="border-primary-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">{t("income_level")}</label>
                    <select
                        value={currentSegment.income}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, income: e.target.value })}
                        className="border-primary-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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
                    <h3 className="text-dark-700 dark:text-primary-dark-600 text-sm font-medium">
                        {t("added_segments", { count: segments.length })}
                    </h3>
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            className="border-primary-light-600 dark:border-dark-700 dark:bg-dark-800 flex items-start justify-between rounded-lg border bg-white p-3"
                        >
                            <div className="flex-1">
                                <h4 className="text-light-900 dark:text-dark-50 font-medium">{segment.name}</h4>
                                <p className="text-primary-light-600 dark:text-dark-400 text-sm">{segment.description}</p>
                                <div className="text-dark-500 dark:text-dark-400 mt-2 flex gap-4 text-xs">
                                    {segment.targetAge && <span>Age: {segment.targetAge}</span>}
                                    {segment.targetGender && <span>Gender: {segment.targetGender}</span>}
                                    {segment.income && <span>Income: {segment.income}</span>}
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

SegmentsStep.propTypes = {
    data: PropTypes.object,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};
