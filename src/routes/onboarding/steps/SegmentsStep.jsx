import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";

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

    const handleAddSegment = () => {
        if (currentSegment.name && currentSegment.description) {
            setSegments([...segments, currentSegment]);
            setCurrentSegment({
                name: "",
                description: "",
                targetAge: "",
                targetGender: "",
                interests: "",
                income: "",
            });
        }
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
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">{t("target_segments")}</h2>

            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{t("target_segments_help")}</p>

            <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("segment_name")} *</label>
                    <input
                        type="text"
                        value={currentSegment.name}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, name: e.target.value })}
                        placeholder={t("segment_name_placeholder")}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("description")} *</label>
                    <textarea
                        value={currentSegment.description}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, description: e.target.value })}
                        rows={2}
                        placeholder={t("describe_segment_placeholder")}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("age_range")}</label>
                        <input
                            type="text"
                            value={currentSegment.targetAge}
                            onChange={(e) => {
                                // Only allow numbers and dashes
                                const value = e.target.value.replace(/[^0-9-]/g, "");
                                setCurrentSegment({ ...currentSegment, targetAge: value });
                            }}
                            placeholder={t("age_range_placeholder")}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("gender")}</label>
                        <select
                            value={currentSegment.targetGender}
                            onChange={(e) => setCurrentSegment({ ...currentSegment, targetGender: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        >
                            <option value="">{t("all")}</option>
                            <option value="male">{t("male")}</option>
                            <option value="female">{t("female")}</option>
                            <option value="other">{t("other")}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("interests")}</label>
                    <input
                        type="text"
                        value={currentSegment.interests}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, interests: e.target.value })}
                        placeholder={t("interests_placeholder")}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("income_level")}</label>
                    <select
                        value={currentSegment.income}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, income: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
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
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("added_segments", { count: segments.length })}</h3>
                    {segments.map((segment, index) => (
                        <div
                            key={index}
                            className="flex items-start justify-between rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                        >
                            <div className="flex-1">
                                <h4 className="font-medium text-slate-900 dark:text-slate-50">{segment.name}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{segment.description}</p>
                                <div className="mt-2 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    {segment.targetAge && <span>Age: {segment.targetAge}</span>}
                                    {segment.targetGender && <span>Gender: {segment.targetGender}</span>}
                                    {segment.income && <span>Income: {segment.income}</span>}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveSegment(index)}
                                className="text-red-500 hover:text-red-600"
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
                    onClick={onPrevious}
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
    data: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};
