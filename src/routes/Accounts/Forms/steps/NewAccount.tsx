import { useState, type FC } from "react";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";

type NewAccountFormData = {
    client?: string;
    platformName?: string;
    userName?: string;
    password?: string;
    twoFactorMethod?: "mail" | "phone" | "non";
    mail?: string;
    phoneOwnerName?: string;
    phoneNumber?: string;
    note?: string;
    mailPassword?: string;
};

type NewAccountProps = {
    onSubmit?: (data: NewAccountFormData) => void;
    onCancel?: () => void;
    initialData?: NewAccountFormData;
};

export const NewAccount: FC<NewAccountProps> = ({ onSubmit, onCancel, initialData }) => {
    const { t } = useLang();
    
    const [formData, setFormData] = useState<NewAccountFormData>(initialData || {
        client: "",
        platformName: "",
        userName: "",
        password: "",
        twoFactorMethod: "non",
        mail: "",
        phoneOwnerName: "",
        phoneNumber: "",
        note: "",
        mailPassword: "",
    });
    
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors: Record<string, string> = {};
        
        // Add your validation logic here if needed
        // Example:
        // if (!formData.platformName?.trim()) {
        //     newErrors.platformName = "Platform name is required";
        // }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setErrors({});
        
        if (onSubmit) {
            onSubmit(formData);
        } else {
            console.log("Form submitted:", formData);
            // Reset form or show success message
            setFormData({
                client: "",
                platformName: "",
                userName: "",
                password: "",
                twoFactorMethod: "non",
                mail: "",
                phoneOwnerName: "",
                phoneNumber: "",
                note: "",
                mailPassword: "",
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">
                Create New Account
            </h2>

            {/* Client Selection */}
            <div>
                <select
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                >
                    <option value="">{t("select_client") || "Select Client"}</option>
                    <option value="client1">Client 1</option>
                    <option value="client2">Client 2</option>
                    <option value="client3">Client 3</option>
                </select>
            </div>

            {/* Platform Name */}
            <div>
                <input
                    type="text"
                    name="platformName"
                    value={formData.platformName}
                    onChange={handleChange}
                    placeholder={t("platform_name_placeholder") || "Platform Name"}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.platformName ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.platformName && <p className="text-danger-500 mt-1 text-sm">{errors.platformName}</p>}
            </div>

            {/* User Name */}
            <div>
                <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    placeholder={t("user_name_placeholder") || "User Name"}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.userName ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.userName && <p className="text-danger-500 mt-1 text-sm">{errors.userName}</p>}
            </div>

            {/* Password */}
            <div>
                <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t("password_placeholder") || "Password"}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.password ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.password && <p className="text-danger-500 mt-1 text-sm">{errors.password}</p>}
            </div>

            {/* Two Factor Selection */}
            <div>
                <select
                    name="twoFactorMethod"
                    value={formData.twoFactorMethod}
                    onChange={handleChange}
                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                >
                    <option value="non">{t("none") || "None"}</option>
                    <option value="mail">{t("mail") || "Mail"}</option>
                    <option value="phone">{t("phone") || "Phone"}</option>
                </select>
            </div>

            {/* Conditional Fields for Mail */}
            {formData.twoFactorMethod === "mail" && (
                <>
                    <div>
                        <input
                            type="email"
                            name="mail"
                            value={formData.mail}
                            onChange={handleChange}
                            placeholder={t("email_placeholder") || "Email address"}
                            className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border mb-2 bg-white px-4 py-2 focus:outline-none ${errors.mail ? "border-danger-500" : "border-light-600"}`}
                        />
                        {errors.mail && <p className="text-danger-500 mt-1 text-sm">{errors.mail}</p>}
                    </div>
                    <div>
                        <input
                            type="string"
                            name="mailPassword"
                            value={formData.mailPassword}
                            onChange={handleChange}
                            placeholder="Password for email (if required)"
                            className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                        />
                    </div>
                </>
            )}

            {/* Conditional Fields for Phone */}
            {formData.twoFactorMethod === "phone" && (
                <>
                    <div>
                        <input
                            type="text"
                            name="phoneOwnerName"
                            value={formData.phoneOwnerName}
                            onChange={handleChange}
                            placeholder={t("phone_owner_name_placeholder") || "Phone owner name"}
                            className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.phoneOwnerName ? "border-danger-500" : "border-light-600"}`}
                        />
                        {errors.phoneOwnerName && <p className="text-danger-500 mt-1 text-sm">{errors.phoneOwnerName}</p>}
                    </div>

                    <div>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder={t("phone_placeholder") || "Phone number"}
                            dir={dirFor(t("phone_placeholder") || "Phone number")}
                            className={`w-full rounded-lg border ${errors.phoneNumber ? "border-danger-500" : "border-light-600"} bg-white px-4 py-2 ${dirFor(t("phone_placeholder") || "Phone number") === "rtl" ? "text-right" : "text-left"} dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 focus:outline-none`}
                        />
                        {errors.phoneNumber && <p className="text-danger-500 mt-1 text-sm">{errors.phoneNumber}</p>}
                    </div>
                </>
            )}
            
            {/* Note */}
            <div>
                <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder={t("notes_placeholder") || "Notes (optional)"}
                    rows={3}
                    className={`text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none ${errors.note ? "border-danger-500" : "border-light-600"}`}
                />
                {errors.note && <p className="text-danger-500 mt-1 text-sm">{errors.note}</p>}
            </div>

            <div className="flex justify-end gap-4 pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-ghost px-6 py-2"
                    >
                        {t("cancel") || "Cancel"}
                    </button>
                )}
                <button
                    type="submit"
                    className="btn-primary px-6 py-2"
                >
                    {t("create_account") || "Create Account"}
                </button>
            </div>
        </form>
    );
};