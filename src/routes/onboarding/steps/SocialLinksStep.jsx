import { useState } from "react";
import PropTypes from "prop-types";
import { Plus, Trash2, Facebook, Instagram } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX } from "react-icons/si";

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
        color: "text-slate-900 dark:text-white",
        domains: ["tiktok.com", "vm.tiktok.com"],
    },
    {
        name: "X (Twitter)",
        icon: SiX,
        color: "text-slate-900 dark:text-white",
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
            <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-50">Social Media Links</h2>

            <div>
                <h3 className="mb-3 text-lg font-medium text-slate-900 dark:text-slate-50">Main Marketing Platforms</h3>
                <div className="space-y-4">
                    {mainPlatforms.map((platform, index) => {
                        const Icon = platform.icon;
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-3"
                            >
                                <div className="flex w-40 items-center gap-2">
                                    <Icon className={`${platform.color} h-5 w-5`} />
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{platform.name}</label>
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="url"
                                        value={businessLinks[index]?.url || ""}
                                        onChange={(e) => handleBusinessLinkChange(index, e.target.value)}
                                        placeholder={`https://${platform.name.toLowerCase().replace(/\s+/g, "")}.com/yourpage`}
                                        className={`w-full rounded-lg border ${urlErrors[index] ? "border-red-500" : "border-slate-300"} bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50`}
                                    />
                                    {urlErrors[index] && <p className="mt-1 text-xs text-red-500">{urlErrors[index]}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="mb-3 text-lg font-medium text-slate-900 dark:text-slate-50">Other Platforms (Optional)</h3>
                <div className="space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Platform Name</label>
                            <input
                                type="text"
                                value={newCustom.platform}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewCustom((prev) => ({ ...prev, platform: value }));
                                }}
                                placeholder="e.g., LinkedIn, YouTube"
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">URL</label>
                            <input
                                type="url"
                                value={newCustom.url}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setNewCustom((prev) => ({ ...prev, url: value }));
                                }}
                                placeholder="https://..."
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddCustom}
                        className="btn-ghost flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Add Platform
                    </button>
                </div>

                {customLinks.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {customLinks.map((link, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                            >
                                <div>
                                    <span className="font-medium text-slate-900 dark:text-slate-50">{link.platform}</span>
                                    <p className="truncate text-sm text-slate-600 dark:text-slate-400">{link.url}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveCustom(index)}
                                    className="text-red-500 hover:text-red-600"
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

SocialLinksStep.propTypes = {
    data: PropTypes.object.isRequired,
    onNext: PropTypes.func.isRequired,
    onPrevious: PropTypes.func.isRequired,
};
