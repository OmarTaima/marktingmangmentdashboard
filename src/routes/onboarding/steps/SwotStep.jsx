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
                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
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
                    className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
                >
                    <span className="text-sm text-slate-900 dark:text-slate-50">{item}</span>
                    <button
                        type="button"
                        onClick={() => handleRemove(category, index)}
                        className="text-red-500 hover:text-red-600 dark:text-red-400"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}
        </div>
    </div>
);

SwotSection.propTypes = {
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    inputKey: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    inputs: PropTypes.object.isRequired,
    setInputs: PropTypes.func.isRequired,
    swot: PropTypes.object.isRequired,
    handleAdd: PropTypes.func.isRequired,
    handleRemove: PropTypes.func.isRequired,
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
        onNext({ swot });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">{t("swot_analysis")}</h2>

            <p className="text-sm text-slate-600 dark:text-slate-400">{t("swot_help")}</p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                    color="text-red-600 dark:text-red-400"
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
                    color="text-blue-600 dark:text-blue-400"
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
    data: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};
