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
            <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-xl font-semibold">{t("personal_info")}</h2>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("full_name")} *</label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    requidanger
                    placeholder={t("full_name_placeholder")}
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                />
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("email_address")} *</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    requidanger
                    placeholder={t("email_placeholder")}
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                />
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("phone_number")} *</label>
                <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    requidanger
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${phoneError ? "border-danger-500" : "border-secondary-300"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 focus:outline-none`}
                />
                {phoneError && <p className="text-danger-500 mt-1 text-sm">{phoneError}</p>}
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("position_role")}</label>
                <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder={t("position_placeholder")}
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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
    data: PropTypes.object.isRequidanger,
    onNext: PropTypes.func.isRequidanger,
    onPrevious: PropTypes.func.isRequidanger,
    isFirst: PropTypes.bool.isRequidanger,
};
