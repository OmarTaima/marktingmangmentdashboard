import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import validators from "@/constants/validators";

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
    const [errors, setErrors] = useState({});

    const handleAddBranch = () => {
        if (currentBranch.name && currentBranch.address) {
            // Validate phone if provided
            if (currentBranch.phone && !validators.isValidEgyptianMobile(currentBranch.phone)) {
                setErrors({ phone: t("phone_error") });
                return;
            }

            setBranches([...branches, currentBranch]);
            setCurrentBranch({ name: "", address: "", phone: "" });
            setErrors({});
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

            <div className="bg-secondary-50 dark:bg-secondary-800/50 space-y-3 rounded-lg p-4 transition-colors duration-300">
                <div>
                    <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("branch_name")}</label>
                    <input
                        type="text"
                        value={currentBranch.name}
                        onChange={(e) => setCurrentBranch({ ...currentBranch, name: e.target.value })}
                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none"
                        placeholder={t("branch_name_placeholder")}
                    />
                </div>

                <div>
                    <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("branch_address")}</label>
                    <textarea
                        value={currentBranch.address}
                        onChange={(e) => setCurrentBranch({ ...currentBranch, address: e.target.value })}
                        rows={2}
                        className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("phone_number")}</label>
                    <input
                        type="tel"
                        value={currentBranch.phone}
                        onChange={(e) => {
                            setCurrentBranch({ ...currentBranch, phone: e.target.value });
                            if (errors.phone) setErrors({ ...errors, phone: "" });
                        }}
                        placeholder={t("phone_placeholder")}
                        dir={dirFor(t("phone_placeholder"))}
                        className={`w-full rounded-lg border ${errors.phone ? "border-danger-500" : "border-secondary-300"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 transition-colors duration-300 focus:outline-none`}
                    />
                    {errors.phone && <p className="text-danger-500 mt-1 text-sm">{errors.phone}</p>}
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
                    <div className="grid grid-cols-1 gap-3">
                        {branches.map((branch, index) => (
                            <div
                                key={index}
                                className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800/50 flex flex-col items-start justify-between rounded-lg border bg-white p-3 transition-colors duration-300 sm:flex-row sm:items-center"
                            >
                                <div className="flex-1">
                                    <h4 className="text-secondary-900 dark:text-secondary-50 font-medium break-words">{branch.name}</h4>
                                    <p className="text-secondary-600 dark:text-secondary-400 text-sm break-words">{branch.address}</p>
                                    {branch.phone && <p className="text-secondary-600 dark:text-secondary-400 text-sm break-words">{branch.phone}</p>}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveBranch(index)}
                                    className="text-danger-500 hover:text-danger-600 mt-3 ml-0 sm:mt-0 sm:ml-4"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
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
