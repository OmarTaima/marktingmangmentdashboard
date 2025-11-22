import { useState, useEffect } from "react";
import type { FC } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import validators from "@/constants/validators";
import fieldValidations from "@/constants/validations";

type Branch = {
    name?: string;
    city?: string;
    address?: string;
    phone?: string;
};

type BranchesStepProps = {
    data?: { branches?: Branch[]; branchesDraft?: Branch };
    onNext: (payload: any) => void;
    onPrevious: (payload: any) => void;
    onUpdate?: (payload: any) => void;
};

export const BranchesStep: FC<BranchesStepProps> = ({ data = {}, onNext, onPrevious, onUpdate }) => {
    const { t } = useLang();
    const [branches, setBranches] = useState<Branch[]>(data?.branches || []);
    const [currentBranch, setCurrentBranch] = useState<Branch>(data?.branchesDraft || { name: "", city: "", address: "", phone: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAddBranch = () => {
        const { name, city, address, phone } = currentBranch || {};
        if (!name && !city && !address && !phone) return; // nothing to add

        const nextErrors: Record<string, string> = {};

        // Require name when trying to add a branch (backend requires name)
        if (!name || !name.trim()) {
            nextErrors.name = (t(fieldValidations.branchName.messageKey) as string) || "Branch name is required";
            setErrors(nextErrors);
            return;
        }

        // Conditional validation for contentful fields
        if (name && name.trim().length < 2) {
            nextErrors.name = (t("name_too_short") as string) || t("invalid_name");
        }

        if (city && city.trim().length < 2) {
            nextErrors.city = (t("city_too_short") as string) || t("invalid_city");
        }

        if (address && address.trim().length < 3) {
            nextErrors.address = (t("address_too_short") as string) || t("invalid_address");
        }

        if (phone) {
            if (!validators.isValidEgyptianMobile(phone)) {
                nextErrors.phone = t("phone_error");
            }
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        // Normalize phone digits before saving (ensure result is typed as string)
        const normalizedPhone: string = phone ? (validators.normalizeDigits((phone as string).trim()) as string) : "";

        const next: Branch[] = [
            ...branches,
            { name: (name || "").trim(), city: (city || "").trim(), address: (address || "").trim(), phone: normalizedPhone },
        ];
        setBranches(next);
        const emptyBranch: Branch = { name: "", city: "", address: "", phone: "" };
        if (typeof onUpdate === "function") onUpdate({ branches: next, branchesDraft: emptyBranch });
        setCurrentBranch(emptyBranch);
        setErrors({});
    };

    const handleRemoveBranch = (index: number) => {
        const next = branches.filter((_, i) => i !== index);
        setBranches(next);
        if (typeof onUpdate === "function") onUpdate({ branches: next });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-add current draft if it has any content
        let finalBranches = [...branches];
        const { name, city, address, phone } = currentBranch || {};
        if (name?.trim() || city?.trim() || address?.trim() || phone?.trim()) {
            // Require name when auto-adding draft branch
            const nextErrors: Record<string, string> = {};
            if (!name || !name.trim()) {
                nextErrors.name = (t(fieldValidations.branchName.messageKey) as string) || "Branch name is required";
                setErrors(nextErrors);
                return;
            }

            // Validate before adding
            if (name && name.trim().length < 2) {
                nextErrors.name = (t("name_too_short") as string) || t("invalid_name");
            }
            if (city && city.trim().length < 2) {
                nextErrors.city = (t("city_too_short") as string) || t("invalid_city");
            }
            if (address && address.trim().length < 3) {
                nextErrors.address = (t("address_too_short") as string) || t("invalid_address");
            }
            if (phone && !validators.isValidEgyptianMobile(phone)) {
                nextErrors.phone = t("phone_error");
            }

            if (Object.keys(nextErrors).length > 0) {
                setErrors(nextErrors);
                return;
            }

            const normalizedPhone: string = phone ? (validators.normalizeDigits((phone as string).trim()) as string) : "";
            finalBranches = [
                ...branches,
                { name: (name || "").trim(), city: (city || "").trim(), address: (address || "").trim(), phone: normalizedPhone },
            ];
        }

        onNext({ branches: finalBranches, branchesDraft: { name: "", city: "", address: "", phone: "" } });
    };

    useEffect(() => {
        // sync local state to parent whenever branches change
        if (typeof onUpdate === "function") onUpdate({ branches });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [branches]);

    // Keep local state in sync when parent `data` changes (for example when navigating between steps)
    useEffect(() => {
        setBranches(data?.branches || []);
    }, [data?.branches]);

    useEffect(() => {
        setCurrentBranch(data?.branchesDraft || { name: "", city: "", address: "", phone: "" });
    }, [data?.branchesDraft]);

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("business_branches")}</h2>

            <p className="text-light-600 dark:text-dark-400 mb-4 text-sm">{t("business_branches_help")}</p>

            <div className="bg-dark-50 dark:bg-dark-800/50 space-y-3 rounded-lg p-4 transition-colors duration-300">
                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("branch_name")}</label>
                    <input
                        type="text"
                        value={currentBranch.name}
                        onChange={(e) => {
                            const updated = { ...currentBranch, name: e.target.value };
                            setCurrentBranch(updated);
                            if (typeof onUpdate === "function") onUpdate({ branchesDraft: updated });
                            if (errors.name) setErrors({ ...errors, name: "" });
                        }}
                        className={`border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.name ? "border-danger-500" : ""}`}
                        placeholder={t("branch_name_placeholder")}
                    />
                    {errors.name && <p className="text-danger-500 mt-1 text-sm">{errors.name}</p>}
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("city")}</label>
                    <input
                        type="text"
                        value={currentBranch.city}
                        onChange={(e) => {
                            const updated = { ...currentBranch, city: e.target.value };
                            setCurrentBranch(updated);
                            if (typeof onUpdate === "function") onUpdate({ branchesDraft: updated });
                            if (errors.city) setErrors({ ...errors, city: "" });
                        }}
                        className={`border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.city ? "border-danger-500" : ""}`}
                        placeholder={t("city_placeholder")}
                    />
                    {errors.city && <p className="text-danger-500 mt-1 text-sm">{errors.city}</p>}
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("branch_address")}</label>
                    <textarea
                        value={currentBranch.address}
                        onChange={(e) => {
                            const updated = { ...currentBranch, address: e.target.value };
                            setCurrentBranch(updated);
                            if (typeof onUpdate === "function") onUpdate({ branchesDraft: updated });
                            if (errors.address) setErrors({ ...errors, address: "" });
                        }}
                        rows={2}
                        className={`border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 transition-colors duration-300 focus:outline-none ${errors.address ? "border-danger-500" : ""}`}
                    />
                    {errors.address && <p className="text-danger-500 mt-1 text-sm">{errors.address}</p>}
                </div>

                <div>
                    <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("phone_number")}</label>
                    <input
                        type="tel"
                        value={currentBranch.phone}
                        onChange={(e) => {
                            const updated = { ...currentBranch, phone: e.target.value };
                            setCurrentBranch(updated);
                            if (typeof onUpdate === "function") onUpdate({ branchesDraft: updated });
                            if (errors.phone) setErrors({ ...errors, phone: "" });
                        }}
                        placeholder={t("phone_placeholder")}
                        dir={dirFor(t("phone_placeholder"))}
                        className={`w-full rounded-lg border ${errors.phone ? "border-danger-500" : "border-light-600"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 transition-colors duration-300 focus:outline-none`}
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
                    <h3 className="text-dark-700 dark:text-secdark-200 text-sm font-medium">
                        {t("added_branches")} ({branches.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {branches.map((branch, index) => (
                            <div
                                key={index}
                                className="border-light-600 dark:border-dark-700 dark:bg-dark-800/50 flex flex-col items-start justify-between rounded-lg border bg-white p-3 transition-colors duration-300 sm:flex-row sm:items-center"
                            >
                                <div className="flex-1">
                                    <h4 className="text-light-900 dark:text-dark-50 font-medium break-words">{branch.name}</h4>
                                    {branch.city && <p className="text-light-600 dark:text-dark-400 text-sm break-words">{branch.city}</p>}
                                    <p className="text-light-600 dark:text-dark-400 text-sm break-words">{branch.address}</p>
                                    {branch.phone && <p className="text-light-600 dark:text-dark-400 text-sm break-words">{branch.phone}</p>}
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
                    onClick={() => onPrevious({ branches })}
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
