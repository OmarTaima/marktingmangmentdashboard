import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";

export const SegmentsStep = ({ data, onNext, onPrevious }) => {
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
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">Target Segments</h2>

            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
                Define your target audience segments. You can add multiple if you have different products/services.
            </p>

            <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Segment Name *</label>
                    <input
                        type="text"
                        value={currentSegment.name}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, name: e.target.value })}
                        placeholder="e.g., Young Professionals, Students"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description *</label>
                    <textarea
                        value={currentSegment.description}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, description: e.target.value })}
                        rows={2}
                        placeholder="Describe this target segment..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Age Range</label>
                        <input
                            type="text"
                            value={currentSegment.targetAge}
                            onChange={(e) => {
                                // Only allow numbers and dashes
                                const value = e.target.value.replace(/[^0-9-]/g, "");
                                setCurrentSegment({ ...currentSegment, targetAge: value });
                            }}
                            placeholder="e.g., 18-35"
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                        <select
                            value={currentSegment.targetGender}
                            onChange={(e) => setCurrentSegment({ ...currentSegment, targetGender: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        >
                            <option value="">All</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Interests</label>
                    <input
                        type="text"
                        value={currentSegment.interests}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, interests: e.target.value })}
                        placeholder="e.g., Technology, Fashion, Sports"
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Income Level</label>
                    <select
                        value={currentSegment.income}
                        onChange={(e) => setCurrentSegment({ ...currentSegment, income: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    >
                        <option value="">Select...</option>
                        <option value="low">Low Income</option>
                        <option value="middle">Middle Income</option>
                        <option value="high">High Income</option>
                        <option value="varied">Varied</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={handleAddSegment}
                    className="btn-ghost flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Segment
                </button>
            </div>

            {segments.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Added Segments ({segments.length})</h3>
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
                    Previous
                </button>
                <button
                    type="submit"
                    className="btn-primary px-6 py-2"
                >
                    Next
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
