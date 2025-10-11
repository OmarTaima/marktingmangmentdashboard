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
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">{t("business_info")}</h2>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("business_name")} *</label>
                <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("business_category")} *</label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
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
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("business_description")} *</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                    placeholder={t("describe_business_placeholder")}
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("main_office_address")} *</label>
                <textarea
                    name="mainOfficeAddress"
                    value={formData.mainOfficeAddress}
                    onChange={handleChange}
                    required
                    rows={2}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{t("established_year")}</label>
                <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleChange}
                    min="1900"
                    max={new Date().getFullYear()}
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

BusinessInfoStep.propTypes = {
    data: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};
