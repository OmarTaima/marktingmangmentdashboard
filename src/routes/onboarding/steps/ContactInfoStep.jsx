import { useState } from "react";
import PropTypes from "prop-types";

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
            errors.businessPhone = "Please enter a valid Egyptian phone number";
        }

        // Validate WhatsApp
        if (!validateEgyptianPhone(formData.businessWhatsApp)) {
            errors.businessWhatsApp = "Please enter a valid Egyptian phone number";
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
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">Contact Information</h2>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Business Phone *</label>
                <input
                    type="tel"
                    name="businessPhone"
                    value={formData.businessPhone}
                    onChange={handleChange}
                    placeholder="01012345678 or +201012345678"
                    required
                    className={`w-full rounded-lg border ${phoneErrors.businessPhone ? "border-red-500" : "border-slate-300"} bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50`}
                />
                {phoneErrors.businessPhone && <p className="mt-1 text-sm text-red-500">{phoneErrors.businessPhone}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Business WhatsApp *</label>
                <input
                    type="tel"
                    name="businessWhatsApp"
                    value={formData.businessWhatsApp}
                    onChange={handleChange}
                    placeholder="01012345678 or +201012345678"
                    required
                    className={`w-full rounded-lg border ${phoneErrors.businessWhatsApp ? "border-red-500" : "border-slate-300"} bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50`}
                />
                {phoneErrors.businessWhatsApp && <p className="mt-1 text-sm text-red-500">{phoneErrors.businessWhatsApp}</p>}
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Business Email *</label>
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
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Website URL</label>
                <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
            </div>

            <div className="flex justify-between gap-4 pt-4">
                <button
                    type="button"
                    onClick={onPrevious}
                    className="btn-ghost px-6 py-2"
                >
                    Previous
                </button>
                <button
                    type="submit"
                    className="btn-primary px-6 py-2"
                >
                    Next
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
