import { useState, useEffect } from "react";
import type { FC } from "react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import validators from "@/constants/validators";
import fieldValidations from "@/constants/validations";

type Contact = {
    businessPhone?: string;
    businessWhatsApp?: string;
    businessEmail?: string;
    website?: string;
};

type ContactInfoStepProps = {
    data?: { contact?: Contact };
    onNext: (payload: any) => void;
    onPrevious: (payload: any) => void;
    onUpdate?: (payload: any) => void;
};

export const ContactInfoStep: FC<ContactInfoStepProps> = ({ data = {}, onNext, onPrevious, onUpdate }) => {
    const { t } = useLang();
    const [formData, setFormData] = useState<Contact>(
        data.contact || {
            businessPhone: "",
            businessWhatsApp: "",
            businessEmail: "",
            website: "",
        },
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};

        // Validate business phone
        if (formData.businessPhone && !validators.isValidEgyptianMobile(formData.businessPhone || "")) {
            newErrors.businessPhone = (t(fieldValidations.businessPhone.messageKey || "invalid_phone") as string) || "";
        }

        // Validate WhatsApp
        if (formData.businessWhatsApp && !validators.isValidEgyptianMobile(formData.businessWhatsApp || "")) {
            newErrors.businessWhatsApp = (t(fieldValidations.businessWhatsApp.messageKey || "invalid_phone") as string) || "";
        }

        // Validate business email
        if (formData.businessEmail && !validators.isValidEmail(formData.businessEmail || "")) {
            newErrors.businessEmail = (t(fieldValidations.businessEmail.messageKey || "invalid_email") as string) || "";
        }

        // Keep website as entered (do not strip leading protocol)
        const submitData = { ...formData };

        // Validate website (optional)
        if (submitData.website && !validators.isValidURL(submitData.website, { allowProtocolLess: true })) {
            newErrors.website = (t(fieldValidations.website.messageKey || "invalid_website") as string) || "";
        }
        // Non-blocking: show errors but allow moving forward
        setErrors(newErrors);
        onNext({ contact: submitData });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.name;
        const value = e.target.value;
        // Preserve user-entered website value (trim whitespace only)
        const storedValue = name === "website" ? value.trim() : value;
        const next = { ...formData, [name]: storedValue } as Contact;
        setFormData(next);
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
        if (typeof onUpdate === "function") onUpdate({ contact: next });
    };

    // Keep formData synced with parent data so values persist when navigating
    useEffect(() => {
        setFormData(
            data.contact || {
                businessPhone: "",
                businessWhatsApp: "",
                businessEmail: "",
                website: "",
            },
        );
    }, [data?.contact]);

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("contact_info")}</h2>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("business_phone")}</label>
                <input
                    type="tel"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${errors.businessPhone ? "border-danger-500" : "border-light-600"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 focus:outline-none`}
                />
                {errors.businessPhone && <p className="text-danger-500 mt-1 text-sm">{errors.businessPhone}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("business_whatsapp")}</label>
                <input
                    type="tel"
                    name="businessWhatsApp"
                    value={formData.businessWhatsApp}
                    onChange={handleChange}
                    placeholder={t("phone_placeholder")}
                    dir={dirFor(t("phone_placeholder"))}
                    className={`w-full rounded-lg border ${errors.businessWhatsApp ? "border-danger-500" : "border-light-600"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder")) === "rtl" ? "text-right" : "text-left"} dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 focus:outline-none`}
                />
                {errors.businessWhatsApp && <p className="text-danger-500 mt-1 text-sm">{errors.businessWhatsApp}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("business_email")}</label>
                <input
                    type="email"
                    name="businessEmail"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.businessEmail ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.businessEmail && <p className="text-danger-500 mt-1 text-sm">{errors.businessEmail}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("website_url")}</label>
                <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder={t("website_placeholder")}
                    dir={dirFor(t("website_placeholder"))}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.website ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.website && <p className="text-danger-500 mt-1 text-sm">{errors.website}</p>}
            </div>

            <div className="flex justify-between gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => onPrevious({ contact: formData })}
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
