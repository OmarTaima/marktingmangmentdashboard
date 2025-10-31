import { useState } from "react";
import PropTypes from "prop-types";
import { useLang } from "@/hooks/useLang";
import fieldValidations from "@/constants/validations";

export const BusinessInfoStep = ({ data, onNext, onPrevious }) => {
    const { t } = useLang();
    const [formData, setFormData] = useState(
        data.business || {
            businessName: "",
            category: "",
            description: "",
            mainOfficeAddress: "",
            establishedYear: "",
        },
    );

    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        const newErrors = {};

        // Keep validations informative but non-blocking. Only validate formats or presence when user provided values.
        if (formData.businessName && !formData.businessName.trim()) {
            newErrors.businessName = t(fieldValidations.businessName.messageKey);
        }
        if (formData.category && !formData.category) {
            newErrors.category = t(fieldValidations.category.messageKey);
        }
        if (formData.description && !formData.description.trim()) {
            newErrors.description = t(fieldValidations.description.messageKey);
        }
        if (formData.mainOfficeAddress && !formData.mainOfficeAddress.trim()) {
            newErrors.mainOfficeAddress = t(fieldValidations.mainOfficeAddress.messageKey);
        }

        setErrors(newErrors);
        onNext({ business: formData });
    };

    const handleChange = (e) => {
        const next = { ...formData, [e.target.name]: e.target.value };
        setFormData(next);
        if (typeof onUpdate === "function") onUpdate({ business: next });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("business_info")}</h2>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("business_name")}</label>
                <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.businessName ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.businessName && <p className="text-danger-500 mt-1 text-sm">{errors.businessName}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("business_category")}</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.category ? "border-danger-500" : "border-light-600"}`}
                >
                    <option value="">{t("select_category")}</option>
                    <option value="retail">{t("option_retail")}</option>
                    <option value="restaurant">{t("option_restaurant")}</option>
                    <option value="healthcare">{t("option_healthcare")}</option>
                    <option value="technology">{t("option_technology")}</option>
                    <option value="education">{t("option_education")}</option>
                    <option value="real-estate">{t("option_real_estate")}</option>
                    <option value="automotive">{t("option_automotive")}</option>
                    <option value="beauty">{t("option_beauty")}</option>
                    <option value="finance">{t("option_finance")}</option>
                    <option value="other">{t("option_other")}</option>
                </select>
                {errors.category && <p className="text-danger-500 mt-1 text-sm">{errors.category}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("business_description")}</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.description ? "border-danger-500" : "border-light-600"}`}
                    placeholder={t("describe_business_placeholder")}
                />
                {errors.description && <p className="text-danger-500 mt-1 text-sm">{errors.description}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("main_office_address")}</label>
                <textarea
                    name="mainOfficeAddress"
                    value={formData.mainOfficeAddress}
                    onChange={handleChange}
                    rows={2}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.mainOfficeAddress ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.mainOfficeAddress && <p className="text-danger-500 mt-1 text-sm">{errors.mainOfficeAddress}</p>}
            </div>

            <div>
                <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("established_year")}</label>
                <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                />
            </div>

            <div className="flex justify-between gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => onPrevious({ business: formData })}
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

BusinessInfoStep.propTypes = {
    data: PropTypes.object,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
    onUpdate: PropTypes.func,
};
