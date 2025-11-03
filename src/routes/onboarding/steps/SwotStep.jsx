import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";

// Reusable SWOT input section
const SwotSection = ({ title, category, inputKey, color, inputs, setInputs, swot, handleAdd, handleRemove, placeholder }) => (
    <div className="space-y-2">
        <h3 className={`text-md font-medium ${color}`}>{title}</h3>

        {/* Input and Add Button */}
        <div className="flex flex-col gap-2 sm:flex-row">
            <input
                type="text"
                value={inputs[inputKey]}
                onChange={(e) => setInputs((prev) => ({ ...prev, [inputKey]: e.target.value }))}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdd(category, inputKey);
                    }
                }}
                placeholder={placeholder}
                className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full flex-1 rounded-lg border bg-white px-4 py-2 focus:outline-none"
            />
            <button
                type="button"
                onClick={() => handleAdd(category, inputKey)}
                className="btn-ghost w-full sm:w-auto sm:!px-3"
            >
                <Plus size={16} />
            </button>
        </div>

        {/* List of added SWOT items */}
        <div className="space-y-1">
            {swot[category].map((item, index) => (
                <div
                    key={index}
                    className="bg-dark-50 dark:bg-dark-800/50 flex items-center justify-between rounded px-3 py-2"
                >
                    <span className="text-light-900 dark:text-dark-50 text-sm">{item}</span>
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
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    inputKey: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    inputs: PropTypes.object.isRequired,
    setInputs: PropTypes.func.isRequired,
    swot: PropTypes.object.isRequired,
    handleAdd: PropTypes.func.isRequired,
    handleRemove: PropTypes.func.isRequired,
    placeholder: PropTypes.string.isRequired,
};

export const SwotStep = ({ data, onNext, onPrevious, onUpdate }) => {
    const { t } = useLang();
    const [swot, setSwot] = useState(
        data.swot || {
            strengths: [],
            weaknesses: [],
            opportunities: [],
            threats: [],
        },
    );

    const [inputs, setInputs] = useState(
        data.swotDraftInputs || {
            strength: "",
            weakness: "",
            opportunity: "",
            threat: "",
        },
    );

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

    useEffect(() => {
        if (typeof onUpdate === "function") onUpdate({ swot });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [swot]);

    // sync with parent data when it changes (preserve values when navigating)
    useEffect(() => {
        setSwot(data.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] });
    }, [data?.swot]);

    useEffect(() => {
        setInputs(
            data.swotDraftInputs || {
                strength: "",
                weakness: "",
                opportunity: "",
                threat: "",
            },
        );
    }, [data?.swotDraftInputs]);

    // Persist partially-typed SWOT inputs so they are not lost when navigating away
    useEffect(() => {
        if (typeof onUpdate === "function") onUpdate({ swotDraftInputs: inputs });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputs]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ swot, swotDraftInputs: inputs });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("swot_analysis")}</h2>

            <p className="text-light-600 dark:text-dark-400 text-sm">{t("swot_help")}</p>

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
                    color="text-secdark-700 dark:text-secdark-100"
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
                    onClick={() => onPrevious({ swot })}
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
    onUpdate: PropTypes.func,
};
