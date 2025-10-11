import { useState } from "react";
import PropTypes from "prop-types";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";

// Egyptian phone validation: accepts +20, 20, or 01 followed by 9 digits
const validateEgyptianPhone = (phone) => {
    const cleaned = phone.replace(/\s+/g, "");
    const patterns = [
        /^\+20[0-9]{10}$/, // +20 followed by 10 digits
        /^20[0-9]{10}$/, // 20 followed by 10 digits
        /^01[0-9]{9}$/, // 01 followed by 9 digits
        /^[0-9]{11}$/, // 11 digits starting with 01
    ];
    return patterns.some((pattern) => pattern.test(cleaned));
};

export const PersonalInfoStep = ({ data, onNext, onPrevious, isFirst }) => {
    const { t, lang } = useLang();
    const [formData, setFormData] = useState(
        data.personal || {
            fullName: "",
            email: "",
            phone: "",
            position: "",
        },
    );
    const [phoneError, setPhoneError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate Egyptian phone number
        if (!validateEgyptianPhone(formData.phone)) {
            setPhoneError(t("phone_error"));
            return;
        }

        setPhoneError("");
        onNext({ personal: formData });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === "phone") {
            setPhoneError(""); // Clear error when user types
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">{t("personal_info")}</h2>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("full_name")} *</label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder={t("full_name_placeholder")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("email_address")} *</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder={t("email_placeholder")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("phone_number")} *</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    required
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${phoneError ? "border-red-500" : "border-slate-300"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50`}
                />
                {phoneError && <p className="mt-1 text-sm text-red-500">{phoneError}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("position_role")}</label>
                <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder={t("position_placeholder")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
            </div>

            <div className="flex justify-between gap-4 pt-4">
                {!isFirst && (
                    <button
                        type="button"
                        onClick={onPrevious}
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

PersonalInfoStep.propTypes = {
    data: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
    isFirst: PropTypes.bool.isRequired,
};
