import { useState } from "react";
import PropTypes from "prop-types";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import validators from "@/constants/validators";
import fieldValidations from "@/constants/validations";

export const ContactInfoStep = ({ data, onNext, onPrevious }) => {
    const { t, lang } = useLang();
    const [formData, setFormData] = useState(
        data.contact || {
            businessPhone: "",
            businessWhatsApp: "",
            businessEmail: "",
            website: "",
        },
    );
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrors = {};

        // Validate business phone
        if (!validators.isValidEgyptianMobile(formData.businessPhone || "")) {
            newErrors.businessPhone = t(fieldValidations.businessPhone.messageKey);
        }

        // Validate WhatsApp
        if (!validators.isValidEgyptianMobile(formData.businessWhatsApp || "")) {
            newErrors.businessWhatsApp = t(fieldValidations.businessWhatsApp.messageKey);
        }

        // Validate business email
        if (!validators.isValidEmail(formData.businessEmail || "")) {
            newErrors.businessEmail = t(fieldValidations.businessEmail.messageKey || "invalid_email");
        }

        // Validate website (optional)
        if (formData.website && !validators.isValidURL(formData.website, { allowProtocolLess: true })) {
            newErrors.website = t(fieldValidations.website.messageKey || "invalid_website");
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        onNext({ contact: formData });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: "" });
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-xl font-semibold">{t("contact_info")}</h2>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("business_phone")} *</label>
                <input
                    type="tel"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    requidanger
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${errors.businessPhone ? "border-danger-500" : "border-secondary-300"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 focus:outline-none`}
                />
                {errors.businessPhone && <p className="text-danger-500 mt-1 text-sm">{errors.businessPhone}</p>}
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("business_whatsapp")} *</label>
                <input
                    type="tel"
                    name="businessWhatsApp"
                    value={formData.businessWhatsApp}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    requidanger
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${errors.businessWhatsApp ? "border-danger-500" : "border-secondary-300"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 focus:outline-none`}
                />
                {errors.businessWhatsApp && <p className="text-danger-500 mt-1 text-sm">{errors.businessWhatsApp}</p>}
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("business_email")} *</label>
                <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    requidanger
                    className={`text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.businessEmail ? "border-danger-500" : "border-secondary-300"}`}
                />
                {errors.businessEmail && <p className="text-danger-500 mt-1 text-sm">{errors.businessEmail}</p>}
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("website_url")}</label>
                <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder={t("website_placeholder")}
                    dir={dirFor(t("website_placeholder"))}
                    className={`text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.website ? "border-danger-500" : "border-secondary-300"}`}
                />
                {errors.website && <p className="text-danger-500 mt-1 text-sm">{errors.website}</p>}
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

ContactInfoStep.propTypes = {
    data: PropTypes.object.isRequidanger,
    onNext: PropTypes.func.isRequidanger,
    onPrevious: PropTypes.func.isRequidanger,
};
