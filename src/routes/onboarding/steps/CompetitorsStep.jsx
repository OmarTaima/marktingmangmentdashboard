import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export const CompetitorsStep = ({ data, onNext, onPrevious, isLast }) => {
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
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">Competitor Analysis</h2>

            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Add information about your main competitors to help us develop a better strategy.
            </p>

            <div className="space-y-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Competitor Name *</label>
                        <input
                            type="text"
                            value={currentCompetitor.name}
                            onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, name: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                        <input
                            type="url"
                            value={currentCompetitor.website}
                            onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, website: e.target.value })}
                            placeholder="https://..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
                    <textarea
                        value={currentCompetitor.description}
                        onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, description: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Facebook</label>
                        <input
                            type="url"
                            value={currentCompetitor.facebook}
                            onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, facebook: e.target.value })}
                            placeholder="https://facebook.com/..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Instagram</label>
                        <input
                            type="url"
                            value={currentCompetitor.instagram}
                            onChange={(e) => setCurrentCompetitor({ ...currentCompetitor, instagram: e.target.value })}
                            placeholder="https://instagram.com/..."
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        />
                    </div>
                </div>

                <div>
                    <h3 className="text-md mb-2 font-medium text-slate-900 dark:text-slate-50">Competitor SWOT</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {["strengths", "weaknesses", "opportunities", "threats"].map((category) => (
                            <div
                                key={category}
                                className="space-y-1"
                            >
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </label>
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
                                        className="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleAddSwotItem(category)}
                                        className="px-2 text-blue-500"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="space-y-0.5">
                                    {currentCompetitor.swot[category].map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs dark:bg-slate-800"
                                        >
                                            <span className="text-slate-900 dark:text-slate-50">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSwotItem(category, idx)}
                                                className="text-red-500"
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
                    Add Competitor
                </button>
            </div>

            {competitors.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Added Competitors ({competitors.length})</h3>
                    {competitors.map((competitor, index) => (
                        <div
                            key={index}
                            className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 dark:text-slate-50">{competitor.name}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{competitor.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                        className="text-blue-500"
                                    >
                                        {expandedIndex === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                                <div className="mt-3 border-t border-slate-200 pt-3 text-sm dark:border-slate-700">
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
                                                <strong className="text-red-600">Weaknesses:</strong>
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
                    Previous
                </button>
                <button
                    type="submit"
                    className="btn-primary px-6 py-2"
                >
                    {isLast ? "Complete" : "Next"}
                </button>
            </div>
        </form>
    );
};

CompetitorsStep.propTypes = {
    data: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
    isLast: PropTypes.bool.isRequired,
};
