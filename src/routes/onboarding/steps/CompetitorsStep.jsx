import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";

export const CompetitorsStep = ({ data, onNext, onPrevious, isLast }) => {
    const { t } = useLang();
    const [competitors, setCompetitors] = useState(data.competitors || []);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [currentCompetitor, setCurrentCompetitor] = useState({
        name: "",
        description: "",
        website: "",
        facebook: "",
        instagram: "",
        tiktok: "",
        twitter: "",
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    });

    const [swotInput, setSwotInput] = useState({
        strength: "",
        weakness: "",
        opportunity: "",
        threat: "",
    });

    const handleAddCompetitor = () => {
        if (currentCompetitor.name && currentCompetitor.description) {
            setCompetitors([...competitors, currentCompetitor]);
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
        }
    };

    const handleRemoveCompetitor = (index) => {
        setCompetitors(competitors.filter((_, i) => i !== index));
    };

    const handleAddSwotItem = (category) => {
        const key = category.slice(0, -1);
        if (swotInput[key].trim()) {
            setCurrentCompetitor({
                ...currentCompetitor,
                swot: {
                    ...currentCompetitor.swot,
                    [category]: [...currentCompetitor.swot[category], swotInput[key]],
                },
            });
            setSwotInput({ ...swotInput, [key]: "" });
        }
    };

    const handleRemoveSwotItem = (category, itemIndex) => {
        setCurrentCompetitor({
            ...currentCompetitor,
            swot: {
                ...currentCompetitor.swot,
                [category]: currentCompetitor.swot[category].filter((_, i) => i !== itemIndex),
            },
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ competitors });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-xl font-semibold">{t("competitor_analysis")}</h2>

            <p className="text-secondary-600 dark:text-secondary-400 mb-4 text-sm">{t("competitor_analysis_help")}</p>

            <div className="bg-secondary-50 dark:bg-secondary-800/50 space-y-4 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                        <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("competitor_name")} *</label>
                        <input
                            type="text"
                            value={currentCompetitor.name}
                            onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, name: e.target.value })}
                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("website_url")}</label>
                        <input
                            type="url"
                            value={currentCompetitor.website}
                            onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, website: e.target.value })}
                            placeholder={t("website_placeholder")}
                            dir={dirFor(t("website_placeholder"))}
                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("description")} *</label>
                    <textarea
                        value={currentCompetitor.description}
                        onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, description: e.target.value })}
                        rows={2}
                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label
                            dir="ltr"
                            className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium"
                        >
                            {t("facebook_label")}
                        </label>
                        <input
                            type="url"
                            value={currentCompetitor.facebook}
                            onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, facebook: e.target.value })}
                            placeholder="https://facebook.com/..."
                            dir={dirFor("https://facebook.com/...")}
                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label
                            dir="ltr"
                            className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium"
                        >
                            {t("instagram_label")}
                        </label>
                        <input
                            type="url"
                            value={currentCompetitor.instagram}
                            onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, instagram: e.target.value })}
                            placeholder="https://instagram.com/..."
                            dir={dirFor("https://instagram.com/...")}
                            className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-md text-secondary-900 dark:text-secondary-50 mb-2 font-medium">{t("competitor_swot")}</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {["strengths", "weaknesses", "opportunities", "threats"].map((category) => (
                            <div
                                key={category}
                                className="space-y-1"
                            >
                                <label className="text-secondary-600 dark:text-secondary-400 block text-xs font-medium">{t(category)}</label>
                                <div className="flex gap-1">
                                    <input
                                        type="text"
                                        value={swotInput[category.slice(0, -1)]}
                                        onChange={(e) => setSwotInput({ ...swotInput, [category.slice(0, -1)]: e.target.value })}
                                        onKeyPress={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddSwotItem(category);
                                            }
                                        }}
                                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 flex-1 rounded border bg-white px-2 py-1 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddSwotItem(category)}
                                        className="text-primary-500 px-2"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="space-y-0.5">
                                    {currentCompetitor.swot[category].map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="dark:bg-secondary-800 flex items-center justify-between rounded bg-white px-2 py-1 text-xs"
                                        >
                                            <span className="text-secondary-900 dark:text-secondary-50">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSwotItem(category, idx)}
                                                className="text-danger-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleAddCompetitor}
                    className="btn-ghost flex items-center gap-2"
                >
                    <Plus size={16} />
                    {t("add_competitor")}
                </button>
            </div>

            {competitors.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-secondary-700 dark:text-secondary-300 text-sm font-medium">
                        {t("added_competitors", { count: competitors.length })}
                    </h3>
                    {competitors.map((competitor, index) => (
                        <div
                            key={index}
                            className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 rounded-lg border bg-white p-3"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{competitor.name}</h4>
                                    <p className="text-secondary-600 dark:text-secondary-400 text-sm">{competitor.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                        className="text-primary-500"
                                    >
                                        {expandedIndex === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCompetitor(index)}
                                        className="text-danger-500 hover:text-danger-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            {expandedIndex === index && (
                                <div className="border-secondary-200 dark:border-secondary-700 mt-3 border-t pt-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        {competitor.swot.strengths.length > 0 && (
                                            <div>
                                                <strong className="text-green-600">Strengths:</strong>
                                                <ul className="list-inside list-disc">
                                                    {competitor.swot.strengths.map((s, i) => (
                                                        <li key={i}>{s}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {competitor.swot.weaknesses.length > 0 && (
                                            <div>
                                                <strong className="text-danger-600">Weaknesses:</strong>
                                                <ul className="list-inside list-disc">
                                                    {competitor.swot.weaknesses.map((w, i) => (
                                                        <li key={i}>{w}</li>
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
                    {isLast ? t("complete") : t("next")}
                </button>
            </div>
        </form>
    );
};

CompetitorsStep.propTypes = {
    data: PropTypes.object.isRequidanger,
    onNext: PropTypes.func.isRequidanger,
    onPrevious: PropTypes.func.isRequidanger,
    isLast: PropTypes.bool.isRequidanger,
};
