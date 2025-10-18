import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";

// Egyptian phone validation
const validateEgyptianPhone = (phone) => {
    if (!phone) return true; // Phone is optional for branches
    const cleaned = phone.replace(/\s+/g, "");
    const patterns = [/^\+20[0-9]{10}$/, /^20[0-9]{10}$/, /^01[0-9]{9}$/, /^[0-9]{11}$/];
    return patterns.some((pattern) => pattern.test(cleaned));
};

export const BranchesStep = ({ data, onNext, onPrevious }) => {
    const { t, lang } = useLang();
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
            <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-xl font-semibold">{t("business_branches")}</h2>

            <p className="text-secondary-600 dark:text-secondary-400 mb-4 text-sm">{t("business_branches_help")}</p>

            <div className="bg-secondary-50 dark:bg-secondary-800/50 space-y-3 rounded-lg p-4">
                <div>
                    <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("branch_name")}</label>
                    <input
                        type="text"
                        value={currentBranch.name}
                        onChange={(e) => setCurrentBranch({ ...currentBranch, name: e.target.value })}
                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        placeholder={t("branch_name_placeholder")}
                    />
                </div>

                <div>
                    <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("branch_address")}</label>
                    <textarea
                        value={currentBranch.address}
                        onChange={(e) => setCurrentBranch({ ...currentBranch, address: e.target.value })}
                        rows={2}
                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("phone_number")}</label>
                    <input
                        type="tel"
                        value={currentBranch.phone}
                        onChange={(e) => {
                            setCurrentBranch({ ...currentBranch, phone: e.target.value });
                            setPhoneError("");
                        }}
                        placeholder={t("phone_placeholder")}
                        dir={dirFor(t("phone_placeholder"))}
                        className={`w-full rounded-lg border ${phoneError ? "border-danger-500" : "border-secondary-300"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 focus:outline-none`}
                    />
                    {phoneError && <p className="text-danger-500 mt-1 text-sm">{phoneError}</p>}
                </div>

                <button
                    type="button"
                    onClick={handleAddBranch}
                    className="btn-ghost flex items-center gap-2"
                >
                    <Plus size={16} />
                    {t("add_branch")}
                </button>
            </div>

            {branches.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-secondary-700 dark:text-secondary-300 text-sm font-medium">
                        {t("added_branches", { count: branches.length })}
                    </h3>
                    {branches.map((branch, index) => (
                        <div
                            key={index}
                            className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 flex items-start justify-between rounded-lg border bg-white p-3"
                        >
                            <div>
                                <h4 className="text-secondary-900 dark:text-secondary-50 font-medium">{branch.name}</h4>
                                <p className="text-secondary-600 dark:text-secondary-400 text-sm">{branch.address}</p>
                                {branch.phone && <p className="text-secondary-600 dark:text-secondary-400 text-sm">{branch.phone}</p>}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveBranch(index)}
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

BranchesStep.propTypes = {
    data: PropTypes.object.isRequidanger,
    onNext: PropTypes.func.isRequidanger,
    onPrevious: PropTypes.func.isRequidanger,
};
