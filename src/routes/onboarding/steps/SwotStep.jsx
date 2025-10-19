import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";

// Move SwotSection outside the main component to prevent re-renders
const SwotSection = ({ title, category, inputKey, color, inputs, setInputs, swot, handleAdd, handleRemove, placeholder }) => (
    <div className="space-y-2">
        <h3 className={`text-md font-medium ${color}`}>{title}</h3>
        <div className="flex gap-2">
            <input
                type="text"
                value={inputs[inputKey]}
                onChange={(e) => {
                    const value = e.target.value;
                    setInputs((prev) => ({ ...prev, [inputKey]: value }));
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdd(category, inputKey);
                    }
                }}
                placeholder={placeholder}
                className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 flex-1 rounded-lg border bg-white px-4 py-2 focus:outline-none"
            />
            <button
                type="button"
                onClick={() => handleAdd(category, inputKey)}
                className="btn-ghost !px-3"
            >
                <Plus size={16} />
            </button>
        </div>
        <div className="space-y-1">
            {swot[category].map((item, index) => (
                <div
                    key={index}
                    className="bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-between rounded px-3 py-2"
                >
                    <span className="text-secondary-900 dark:text-secondary-50 text-sm">{item}</span>
                    <button
                        type="button"
                        onClick={() => handleRemove(category, index)}
                        className="text-danger-500 hover:text-danger-600 dark:text-danger-400"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
    </div>
);

SwotSection.propTypes = {
    title: PropTypes.string.isRequidanger,
    category: PropTypes.string.isRequidanger,
    inputKey: PropTypes.string.isRequidanger,
    color: PropTypes.string.isRequidanger,
    inputs: PropTypes.object.isRequidanger,
    setInputs: PropTypes.func.isRequidanger,
    swot: PropTypes.object.isRequidanger,
    handleAdd: PropTypes.func.isRequidanger,
    handleRemove: PropTypes.func.isRequidanger,
};

export const SwotStep = ({ data, onNext, onPrevious }) => {
    const { t } = useLang();
    const [swot, setSwot] = useState(
        data.swot || {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
        },
    );

    const [inputs, setInputs] = useState({
        strength: "",
        weakness: "",
        opportunity: "",
        threat: "",
    });

    const handleAdd = (category, inputKey) => {
        const value = inputs[inputKey];
        if (value.trim()) {
            setSwot((prev) => ({
                ...prev,
                [category]: [...prev[category], value.trim()],
            }));
            setInputs((prev) => ({ ...prev, [inputKey]: "" }));
            if (error) setError("");
        }
    };

    const handleRemove = (category, index) => {
        setSwot((prev) => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const total = swot.strengths.length + swot.weaknesses.length + swot.opportunities.length + swot.threats.length;
        if (total === 0) {
            setError(t("swot_require_one"));
            return;
        }
        onNext({ swot });
    };

    const [error, setError] = useState("");

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-xl font-semibold">{t("swot_analysis")}</h2>

            <p className="text-secondary-600 dark:text-secondary-400 text-sm">{t("swot_help")}</p>

            {error && <p className="text-danger-500 text-sm">{error}</p>}

            <div className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${error ? "ring-danger-300 rounded-md p-3 ring" : ""}`}>
                <SwotSection
                    title={t("strengths_title")}
                    category="strengths"
                    inputKey="strength"
                    color="text-green-600 dark:text-green-400"
                    inputs={inputs}
                    setInputs={setInputs}
                    swot={swot}
                    handleAdd={handleAdd}
                    handleRemove={handleRemove}
                    placeholder={t("swot_add_placeholder", { type: t("strengths") })}
                />
                <SwotSection
                    title={t("weaknesses_title")}
                    category="weaknesses"
                    inputKey="weakness"
                    color="text-danger-600 dark:text-danger-400"
                    inputs={inputs}
                    setInputs={setInputs}
                    swot={swot}
                    handleAdd={handleAdd}
                    handleRemove={handleRemove}
                    placeholder={t("swot_add_placeholder", { type: t("weaknesses") })}
                />
                <SwotSection
                    title={t("opportunities_title")}
                    category="opportunities"
                    inputKey="opportunity"
                    color="text-primary-600 dark:text-primary-400"
                    inputs={inputs}
                    setInputs={setInputs}
                    swot={swot}
                    handleAdd={handleAdd}
                    handleRemove={handleRemove}
                    placeholder={t("swot_add_placeholder", { type: t("opportunities") })}
                />
                <SwotSection
                    title={t("threats_title")}
                    category="threats"
                    inputKey="threat"
                    color="text-orange-600 dark:text-orange-400"
                    inputs={inputs}
                    setInputs={setInputs}
                    swot={swot}
                    handleAdd={handleAdd}
                    handleRemove={handleRemove}
                    placeholder={t("swot_add_placeholder", { type: t("threats") })}
                />
            </div>

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

SwotStep.propTypes = {
    data: PropTypes.object.isRequidanger,
    onNext: PropTypes.func.isRequidanger,
    onPrevious: PropTypes.func.isRequidanger,
};
