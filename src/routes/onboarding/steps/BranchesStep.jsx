import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";

// Egyptian phone validation
const validateEgyptianPhone = (phone) => {
    if (!phone) return true; // Phone is optional for branches
    const cleaned = phone.replace(/\s+/g, "");
    const patterns = [/^\+20[0-9]{10}$/, /^20[0-9]{10}$/, /^01[0-9]{9}$/, /^[0-9]{11}$/];
    return patterns.some((pattern) => pattern.test(cleaned));
};

export const BranchesStep = ({ data, onNext, onPrevious }) => {
    const [branches, setBranches] = useState(data.branches || []);
    const [currentBranch, setCurrentBranch] = useState({
        name: "",
        address: "",
        phone: "",
    });
    const [phoneError, setPhoneError] = useState("");

    const handleAddBranch = () => {
        if (currentBranch.name && currentBranch.address) {
            // Validate phone if provided
            if (currentBranch.phone && !validateEgyptianPhone(currentBranch.phone)) {
                setPhoneError("Please enter a valid Egyptian phone number");
                return;
            }

            setBranches([...branches, currentBranch]);
            setCurrentBranch({ name: "", address: "", phone: "" });
            setPhoneError("");
        }
    };

    const handleRemoveBranch = (index) => {
        setBranches(branches.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ branches });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">Business Branches</h2>

            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">Add all your business branch locations (optional)</p>

            <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Branch Name</label>
                    <input
                        type="text"
                        value={currentBranch.name}
                        onChange={(e) => setCurrentBranch({ ...currentBranch, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                        placeholder="e.g., Downtown Branch"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                    <textarea
                        value={currentBranch.address}
                        onChange={(e) => setCurrentBranch({ ...currentBranch, address: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                    <input
                        type="tel"
                        value={currentBranch.phone}
                        onChange={(e) => {
                            setCurrentBranch({ ...currentBranch, phone: e.target.value });
                            setPhoneError("");
                        }}
                        placeholder="01012345678 or +201012345678"
                        className={`w-full rounded-lg border ${phoneError ? "border-red-500" : "border-slate-300"} bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50`}
                    />
                    {phoneError && <p className="mt-1 text-sm text-red-500">{phoneError}</p>}
                </div>

                <button
                    type="button"
                    onClick={handleAddBranch}
                    className="btn-ghost flex items-center gap-2"
                >
                    <Plus size={16} />
                    Add Branch
                </button>
            </div>

            {branches.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Added Branches ({branches.length})</h3>
                    {branches.map((branch, index) => (
                        <div
                            key={index}
                            className="flex items-start justify-between rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                        >
                            <div>
                                <h4 className="font-medium text-slate-900 dark:text-slate-50">{branch.name}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{branch.address}</p>
                                {branch.phone && <p className="text-sm text-slate-600 dark:text-slate-400">{branch.phone}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveBranch(index)}
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

BranchesStep.propTypes = {
    data: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};
