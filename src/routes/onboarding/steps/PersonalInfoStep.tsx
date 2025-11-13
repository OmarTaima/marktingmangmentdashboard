import { useState, useEffect, type FC } from "react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import validators from "@/constants/validators";
import fieldValidations from "@/constants/validations";
import type { OnboardingStepProps } from "../types";

export const PersonalInfoStep: FC<OnboardingStepProps> = ({ data, onNext, onPrevious, isFirst, onUpdate }) => {
    const { t } = useLang();
    type PersonalForm = {
        fullName?: string;
        email?: string;
        phone?: string;
        position?: string;
    };

    const [formData, setFormData] = useState<PersonalForm>(
        (data?.personal as PersonalForm) || {
            fullName: "",
            email: "",
            phone: "",
            position: "",
        },
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        // fullName: optional — don't block progression; only warn when empty based on previous rules (kept permissive)
        if (formData.fullName && !formData.fullName.trim()) {
            newErrors.fullName = t(fieldValidations.fullName.messageKey);
        }

        // email validation: only when provided
        if (formData.email && !validators.isValidEmail(formData.email || "")) {
            newErrors.email = t(fieldValidations.email.messageKey || "invalid_email");
        }

        // phone validation: only when provided
        if (formData.phone && !validators.isValidEgyptianMobile(formData.phone || "")) {
            newErrors.phone = t(fieldValidations.phone.messageKey);
        }

        // Show non-blocking errors but allow navigation
        setErrors(newErrors);
        onNext({ personal: formData });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const next = { ...formData, [e.target.name]: e.target.value } as PersonalForm;
        setFormData(next);
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
        if (typeof onUpdate === "function") onUpdate({ personal: next });
    };

    // Keep formData synced with parent data so values persist when navigating
    useEffect(() => {
        setFormData(
            data.personal || {
                fullName: "",
                email: "",
                phone: "",
                position: "",
            },
        );
    }, [data?.personal]);

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("personal_info")}</h2>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("full_name")}</label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder={t("full_name_placeholder")}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.fullName ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.fullName && <p className="text-danger-500 mt-1 text-sm">{errors.fullName}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("email_address")}</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("email_placeholder")}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.email ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.email && <p className="text-danger-500 mt-1 text-sm">{errors.email}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("phone_number")}</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${errors.phone ? "border-danger-500" : "border-light-600"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 focus:outline-none`}
                />
                {errors.phone && <p className="text-danger-500 mt-1 text-sm">{errors.phone}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("position_role")}</label>
                <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder={t("position_placeholder")}
                    className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                />
            </div>

            <div className="flex justify-between gap-4 pt-4">
                {!isFirst && (
                    <button
                        type="button"
                        onClick={() => onPrevious({ personal: formData })}
                        className="btn-ghost px-6 py-2"
                    >
                        {t("previous")}
                    </button>
                )}
                <button
                    type="submit"
                    className="btn-primary ml-auto px-6 py-2"
                >
                    {t("next")}
                </button>
            </div>
        </form>
    );
};
