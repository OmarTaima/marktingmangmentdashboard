import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Facebook, Instagram } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";
import { useLang } from "@/hooks/useLang";
import { dirFor } from "@/utils/direction";
import { cn } from "@/utils/cn";
import validators from "@/constants/validators";

const mainPlatforms = [
    {
        name: "Facebook",
        icon: SiFacebook,
        color: "text-blue-600",
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
        color: "text-light-900 dark:text-white",
        domains: ["tiktok.com", "vm.tiktok.com"],
    },
    {
        name: "X (Twitter)",
        icon: SiX,
        color: "text-light-900 dark:text-white",
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

export const SocialLinksStep = ({ data, onNext, onPrevious, onUpdate }) => {
    const { t, lang } = useLang();
    const [businessLinks, setBusinessLinks] = useState(() => {
        if (data.socialLinks?.business) {
            return data.socialLinks.business;
        }
        return mainPlatforms.map((p) => ({ platform: p.name, url: "" }));
    });
    const [customLinks, setCustomLinks] = useState(data.socialLinks?.custom || []);
    const [newCustom, setNewCustom] = useState(data.socialLinksDraft?.newCustom || { platform: "", url: "" });
    const [urlErrors, setUrlErrors] = useState({});

    const handleBusinessLinkChange = (index, value) => {
        setBusinessLinks((prevLinks) => {
            const updated = [...prevLinks];
            updated[index] = { ...updated[index], url: value };
            if (typeof onUpdate === "function") onUpdate({ socialLinks: { business: updated, custom: customLinks } });
            return updated;
        });

        // Validate URL for the platform
        // first check general URL validity
        if (value && !validators.isValidURL(value, { allowProtocolLess: true })) {
            setUrlErrors((prev) => ({ ...prev, [index]: t("invalid_website") }));
            return;
        }

        // then platform-specific check
        if (value && !validatePlatformUrl(value, mainPlatforms[index])) {
            setUrlErrors((prev) => ({ ...prev, [index]: t("invalid_website") }));
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
            const next = [...customLinks, newCustom];
            setCustomLinks(next);
            if (typeof onUpdate === "function") onUpdate({ socialLinks: { business: businessLinks, custom: next } });
            setNewCustom({ platform: "", url: "" });
        }
    };

    const handleRemoveCustom = (index) => {
        const next = customLinks.filter((_, i) => i !== index);
        setCustomLinks(next);
        if (typeof onUpdate === "function") onUpdate({ socialLinks: { business: businessLinks, custom: next } });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Non-blocking: show URL errors but allow moving forward
        onNext({
            socialLinks: {
                business: businessLinks,
                custom: customLinks,
            },
            socialLinksDraft: { newCustom },
        });
    };

    // Keep local lists in sync with parent data so entered values persist when navigating
    useEffect(() => {
        setBusinessLinks(data.socialLinks?.business || mainPlatforms.map((p) => ({ platform: p.name, url: "" })));
        setCustomLinks(data.socialLinks?.custom || []);
    }, [data?.socialLinks]);

    useEffect(() => {
        setNewCustom(data.socialLinksDraft?.newCustom || { platform: "", url: "" });
    }, [data?.socialLinksDraft]);

    useEffect(() => {
        if (typeof onUpdate === "function") onUpdate({ socialLinks: { business: businessLinks, custom: customLinks } });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessLinks, customLinks]);

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-xl font-semibold">{t("social_media_links")}</h2>

            <div>
                <h3 className="text-light-900 dark:text-dark-50 mb-3 text-lg font-medium">{t("main_marketing_platforms")}</h3>
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
                                            "text-dark-700 dark:text-secdark-200 text-sm font-medium",
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
                                            "focus:border-light-500 w-full rounded-lg border px-4 py-2 focus:outline-none",
                                            urlErrors[index] ? "border-danger-500" : "border-light-600",
                                            dirFor(t("platform_placeholder", { platform: platform.name.toLowerCase().replace(/\s+/g, "") })) === "rtl"
                                                ? "text-right"
                                                : "text-left",
                                            "text-light-900 dark:bg-dark-800 dark:text-dark-50 bg-white",
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
                <h3 className="text-light-900 dark:text-dark-50 mb-3 text-lg font-medium">{t("other_platforms")}</h3>
                <div className="bg-dark-50 dark:bg-dark-800/50 space-y-3 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("platform_name")}</label>
                            <input
                                type="text"
                                value={newCustom.platform}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewCustom((prev) => ({ ...prev, platform: value }));
                                }}
                                placeholder={t("platform_name_placeholder")}
                                className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-dark-700 dark:text-secdark-200 mb-2 block text-sm font-medium">{t("url")}</label>
                            <input
                                type="url"
                                value={newCustom.url}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewCustom((prev) => ({ ...prev, url: value }));
                                }}
                                placeholder={t("website_placeholder")}
                                dir={dirFor(t("website_placeholder"))}
                                className="border-light-600 text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-4 py-2 focus:outline-none"
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
                                className="border-light-600 dark:border-dark-700 dark:bg-dark-800 flex items-center justify-between rounded-lg border bg-white p-3"
                            >
                                <div>
                                    <span className="text-light-900 dark:text-dark-50 font-medium">{link.platform}</span>
                                    <p className="text-light-600 dark:text-dark-400 truncate text-sm">{link.url}</p>
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
                    onClick={() =>
                        onPrevious({
                            socialLinks: { business: businessLinks, custom: customLinks },
                        })
                    }
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
    data: PropTypes.object,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
    onUpdate: PropTypes.func,
};
