import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import validators from "@/constants/validators";
import fieldValidations from "@/constants/validations";

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
    const [errors, setErrors] = useState({});

    const handleAddCompetitor = () => {
        const newErrors = {};

        // Only validate website format if provided. Name/description are optional now.
        if (currentCompetitor.website && !validators.isValidURL(currentCompetitor.website, { allowProtocolLess: true })) {
            newErrors.website = t("invalid_website");
        }

        // Persist the competitor even if name/description empty; show non-blocking errors.
        setErrors(newErrors);
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
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold transition-colors duration-300">{t("competitor_analysis")}</h2>

            <p className="text-primary-light-600 dark:text-dark-400 mb-4 text-sm transition-colors duration-300">{t("competitor_analysis_help")}</p>

            <div className="bg-dark-50 dark:bg-dark-800/50 space-y-4 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">
                                    {t("competitor_name")}
                                </label>
                                <input
                                    type="text"
                                    value={currentCompetitor.name}
                                    onChange={(e) => {
                                        setCurrentCompetitor({ ...currentCompetitor, name: e.target.value });
                                        if (errors.name) setErrors({ ...errors, name: "" });
                                    }}
                                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.name ? "border-danger-500" : "border-primary-light-600"}`}
                                />
                                {errors.name && <p className="text-danger-500 mt-1 text-sm">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">{t("website_url")}</label>
                                <input
                                    type="url"
                                    value={currentCompetitor.website}
                                    onChange={(e) => {
                                        setCurrentCompetitor({ ...currentCompetitor, website: e.target.value });
                                        if (errors.website) setErrors({ ...errors, website: "" });
                                    }}
                                    placeholder={t("website_placeholder")}
                                    dir={dirFor(t("website_placeholder"))}
                                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.website ? "border-danger-500" : "border-primary-light-600"}`}
                                />
                                {errors.website && <p className="text-danger-500 mt-1 text-sm">{errors.website}</p>}
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium">{t("description")}</label>
                            <textarea
                                value={currentCompetitor.description}
                                onChange={(e) => {
                                    setCurrentCompetitor({ ...currentCompetitor, description: e.target.value });
                                    if (errors.description) setErrors({ ...errors, description: "" });
                                }}
                                rows={3}
                                className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full resize-none rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.description ? "border-danger-500" : "border-primary-light-600"}`}
                            />
                            {errors.description && <p className="text-danger-500 mt-1 text-sm">{errors.description}</p>}
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                                <label
                                    dir="ltr"
                                    className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium"
                                >
                                    {t("facebook_label")}
                                </label>
                                <input
                                    type="url"
                                    value={currentCompetitor.facebook}
                                    onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, facebook: e.target.value })}
                                    placeholder="https://facebook.com/..."
                                    dir={dirFor("https://facebook.com/...")}
                                    className="border-primary-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label
                                    dir="ltr"
                                    className="text-dark-700 dark:text-primary-dark-600 mb-2 block text-sm font-medium"
                                >
                                    {t("instagram_label")}
                                </label>
                                <input
                                    type="url"
                                    value={currentCompetitor.instagram}
                                    onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, instagram: e.target.value })}
                                    placeholder="https://instagram.com/..."
                                    dir={dirFor("https://instagram.com/...")}
                                    className="border-primary-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <h3 className="text-md text-light-900 dark:text-dark-50 mb-2 font-medium">{t("competitor_swot")}</h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {["strengths", "weaknesses", "opportunities", "threats"].map((category) => (
                                    <div
                                        key={category}
                                        className="space-y-1"
                                    >
                                        <label className="text-primary-light-600 dark:text-dark-400 block text-xs font-medium">{t(category)}</label>
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
                                                className="border-primary-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 flex-1 rounded border bg-white px-2 py-1 text-sm transition-colors duration-300"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddSwotItem(category)}
                                                className="text-light-500 px-2"
                                                aria-label={`add-${category}`}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            {currentCompetitor.swot[category].map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="dark:bg-dark-800 flex items-center justify-between rounded bg-white px-2 py-1 text-xs"
                                                >
                                                    <span className="text-light-900 dark:text-dark-50 break-words">{item}</span>
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

                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={handleAddCompetitor}
                                className="btn-ghost flex items-center gap-2"
                            >
                                <Plus size={16} />
                                {t("add_competitor")}
                            </button>
                        </div>
                    </div>
                </div>

                {competitors.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-dark-700 dark:text-primary-dark-600 text-sm font-medium">
                            {t("added_competitors", { count: competitors.length })}
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {competitors.map((competitor, index) => (
                                <div
                                    key={index}
                                    className="border-primary-light-600 dark:border-dark-700 dark:bg-dark-800 rounded-lg border bg-white p-3 transition-colors duration-300"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-light-900 dark:text-dark-50 truncate font-medium">{competitor.name}</h4>
                                            <p className="text-primary-light-600 dark:text-dark-400 line-clamp-3 text-sm">{competitor.description}</p>
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
                                                onClick={() => handleRemoveCompetitor(index)}
                                                className="text-danger-500 hover:text-danger-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {expandedIndex === index && (
                                        <div className="border-dark-200 dark:border-dark-700 mt-3 border-t pt-3 text-sm">
                                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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

CompetitorsStep.propTypes = {
    data: PropTypes.object,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
    isLast: PropTypes.bool,
};
