import { useState } from "react";
import PropTypes from "prop-types";
import { useLang } from "@/hooks/useLang";

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ business: formData });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4"
        >
            <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-xl font-semibold">{t("business_info")}</h2>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("business_name")} *</label>
                <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    requidanger
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                />
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("business_category")} *</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    requidanger
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("business_description")} *</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    requidanger
                    rows={4}
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                    placeholder={t("describe_business_placeholder")}
                />
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("main_office_address")} *</label>
                <textarea
                    name="mainOfficeAddress"
                    value={formData.mainOfficeAddress}
                    onChange={handleChange}
                    requidanger
                    rows={2}
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                />
            </div>

            <div>
                <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("established_year")}</label>
                <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
                    className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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

BusinessInfoStep.propTypes = {
    data: PropTypes.object.isRequidanger,
    onNext: PropTypes.func.isRequidanger,
    onPrevious: PropTypes.func.isRequidanger,
};
