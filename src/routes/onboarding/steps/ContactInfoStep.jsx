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
    const [phoneErrors, setPhoneErrors] = useState({
        businessPhone: "",
        businessWhatsApp: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        const errors = {};

        // Validate business phone
        if (!validateEgyptianPhone(formData.businessPhone)) {
            errors.businessPhone = t("phone_error");
        }

        // Validate WhatsApp
        if (!validateEgyptianPhone(formData.businessWhatsApp)) {
            errors.businessWhatsApp = t("phone_error");
        }

        if (Object.keys(errors).length > 0) {
            setPhoneErrors(errors);
            return;
        }

        setPhoneErrors({ businessPhone: "", businessWhatsApp: "" });
        onNext({ contact: formData });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === "businessPhone" || e.target.name === "businessWhatsApp") {
            setPhoneErrors({ ...phoneErrors, [e.target.name]: "" });
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">{t("contact_info")}</h2>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("business_phone")} *</label>
                <input
                    type="tel"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    required
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${phoneErrors.businessPhone ? "border-red-500" : "border-slate-300"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50`}
                />
                {phoneErrors.businessPhone && <p className="mt-1 text-sm text-red-500">{phoneErrors.businessPhone}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("business_whatsapp")} *</label>
                <input
                    type="tel"
                    name="businessWhatsApp"
                    value={formData.businessWhatsApp}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    required
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${phoneErrors.businessWhatsApp ? "border-red-500" : "border-slate-300"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50`}
                />
                {phoneErrors.businessWhatsApp && <p className="mt-1 text-sm text-red-500">{phoneErrors.businessWhatsApp}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("business_email")} *</label>
                <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("website_url")}</label>
                <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder={t("website_placeholder")}
                    dir={dirFor(t("website_placeholder"))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
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
    data: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};
