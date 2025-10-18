import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Facebook, Instagram } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import { cn } from "@/utils/cn";

const mainPlatforms = [
    {
        name: "Facebook",
        icon: SiFacebook,
        color: "text-primary-600",
        domains: ["facebook.com", "fb.com", "fb.me"],
    },
    {
        name: "Instagram",
        icon: SiInstagram,
        color: "text-pink-600",
        domains: ["instagram.com", "instagr.am"],
    },
    {
        name: "TikTok",
        icon: SiTiktok,
        color: "text-secondary-900 dark:text-white",
        domains: ["tiktok.com", "vm.tiktok.com"],
    },
    {
        name: "X (Twitter)",
        icon: SiX,
        color: "text-secondary-900 dark:text-white",
        domains: ["twitter.com", "x.com", "t.co"],
    },
];

// Validate if URL belongs to the platform
const validatePlatformUrl = (url, platform) => {
    if (!url) return true; // Empty is okay
    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase().replace("www.", "");
        return platform.domains.some((domain) => hostname.includes(domain));
    } catch {
        return false; // Invalid URL format
    }
};

export const SocialLinksStep = ({ data, onNext, onPrevious }) => {
    const { t, lang } = useLang();
    const [businessLinks, setBusinessLinks] = useState(() => {
        if (data.socialLinks?.business) {
            return data.socialLinks.business;
        }
        return mainPlatforms.map((p) => ({ platform: p.name, url: "" }));
    });
    const [customLinks, setCustomLinks] = useState(data.socialLinks?.custom || []);
    const [newCustom, setNewCustom] = useState({ platform: "", url: "" });
    const [urlErrors, setUrlErrors] = useState({});

    const handleBusinessLinkChange = (index, value) => {
        setBusinessLinks((prevLinks) => {
            const updated = [...prevLinks];
            updated[index] = { ...updated[index], url: value };
            return updated;
        });

        // Validate URL for the platform
        if (value && !validatePlatformUrl(value, mainPlatforms[index])) {
            setUrlErrors((prev) => ({
                ...prev,
                [index]: `Please enter a valid ${mainPlatforms[index].name} URL`,
            }));
        } else {
            setUrlErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[index];
                return newErrors;
            });
        }
    };

    const handleAddCustom = () => {
        if (newCustom.platform && newCustom.url) {
            setCustomLinks([...customLinks, newCustom]);
            setNewCustom({ platform: "", url: "" });
        }
    };

    const handleRemoveCustom = (index) => {
        setCustomLinks(customLinks.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Check if there are any validation errors
        if (Object.keys(urlErrors).length > 0) {
            alert("Please fix the invalid URLs before continuing");
            return;
        }

        onNext({
            socialLinks: {
                business: businessLinks,
                custom: customLinks,
            },
        });
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-xl font-semibold">{t("social_media_links")}</h2>

            <div>
                <h3 className="text-secondary-900 dark:text-secondary-50 mb-3 text-lg font-medium">{t("main_marketing_platforms")}</h3>
                <div className="space-y-4">
                    {mainPlatforms.map((platform, index) => {
                        const Icon = platform.icon;
                        return (
                            <div
                                key={index}
                                className={cn("flex items-center gap-3", lang === "ar" ? "flex-row-reverse" : "")}
                            >
                                <div className={cn("flex w-40 items-center gap-2", lang === "ar" ? "flex-row-reverse" : "")}>
                                    <Icon className={`${platform.color} h-5 w-5`} />
                                    <label
                                        className={cn(
                                            "text-secondary-700 dark:text-secondary-300 text-sm font-medium",
                                            dirFor(platform.name) === "rtl" ? "text-right" : "text-left",
                                        )}
                                    >
                                        {platform.name}
                                    </label>
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="url"
                                        value={businessLinks[index]?.url || ""}
                                        onChange={(e) => handleBusinessLinkChange(index, e.target.value)}
                                        placeholder={t("platform_placeholder", { platform: platform.name.toLowerCase().replace(/\s+/g, "") })}
                                        dir={dirFor(t("platform_placeholder", { platform: platform.name.toLowerCase().replace(/\s+/g, "") }))}
                                        className={cn(
                                            "focus:border-primary-500 w-full rounded-lg border px-4 py-2 focus:outline-none",
                                            urlErrors[index] ? "border-danger-500" : "border-secondary-300",
                                            dirFor(t("platform_placeholder", { platform: platform.name.toLowerCase().replace(/\s+/g, "") })) === "rtl"
                                                ? "text-right"
                                                : "text-left",
                                            "text-secondary-900 dark:bg-secondary-800 dark:text-secondary-50 bg-white",
                                        )}
                                    />
                                    {urlErrors[index] && <p className="text-danger-500 mt-1 text-xs">{urlErrors[index]}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="text-secondary-900 dark:text-secondary-50 mb-3 text-lg font-medium">{t("other_platforms")}</h3>
                <div className="bg-secondary-50 dark:bg-secondary-800/50 space-y-3 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("platform_name")}</label>
                            <input
                                type="text"
                                value={newCustom.platform}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewCustom((prev) => ({ ...prev, platform: value }));
                                }}
                                placeholder={t("platform_name_placeholder")}
                                className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-secondary-700 dark:text-secondary-300 mb-2 block text-sm font-medium">{t("url")}</label>
                            <input
                                type="url"
                                value={newCustom.url}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewCustom((prev) => ({ ...prev, url: value }));
                                }}
                                placeholder={t("website_placeholder")}
                                dir={dirFor(t("website_placeholder"))}
                                className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddCustom}
                        className="btn-ghost flex items-center gap-2"
                    >
                        <Plus size={16} />
                        {t("add_platform")}
                    </button>
                </div>

                {customLinks.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {customLinks.map((link, index) => (
                            <div
                                key={index}
                                className="border-secondary-300 dark:border-secondary-700 dark:bg-secondary-800 flex items-center justify-between rounded-lg border bg-white p-3"
                            >
                                <div>
                                    <span className="text-secondary-900 dark:text-secondary-50 font-medium">{link.platform}</span>
                                    <p className="text-secondary-600 dark:text-secondary-400 truncate text-sm">{link.url}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCustom(index)}
                                    className="text-danger-500 hover:text-danger-600"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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

SocialLinksStep.propTypes = {
    data: PropTypes.object.isRequidanger,
    onNext: PropTypes.func.isRequidanger,
    onPrevious: PropTypes.func.isRequidanger,
};
