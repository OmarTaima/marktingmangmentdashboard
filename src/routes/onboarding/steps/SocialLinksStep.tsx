import { useState, useEffect } from "react";
import type { FC } from "react";
import { Plus, Trash2, Edit2, X } from "lucide-react";
import { SiFacebook, SiInstagram, SiTiktok, SiX, SiThreads } from "react-icons/si";
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
        name: "Threads",
        icon: SiThreads,
        color: "text-indigo-600",
        domains: ["threads.net"],
    },
    {
        name: "X (Twitter)",
        icon: SiX,
        color: "text-light-900 dark:text-white",
        domains: ["twitter.com", "x.com", "t.co"],
    },
];

// Validate if URL belongs to the platform
type Platform = {
    name: string;
    icon: any;
    color: string;
    domains: string[];
};

const validatePlatformUrl = (url: string, platform: Platform) => {
    if (!url) return true; // Empty is okay
    try {
        // Support protocol-less URLs like `trello.com/b/xyz` by adding https:// when missing
        const trimmed = url.trim();
        const urlToParse = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
        const urlObj = new URL(urlToParse);
        const hostname = urlObj.hostname.toLowerCase().replace("www.", "");

        // If the hostname matches one of the known platform domains, it's a clear match.
        if (platform.domains.some((domain) => hostname.includes(domain))) return true;

        // Otherwise: don't treat domain mismatch as a hard validation failure — accept any valid URL.
        // This allows users to paste generic links (e.g. `trello.com/...`) without being blocked.
        return true;
    } catch {
        return false; // Invalid URL format
    }
};
type SocialLink = { platform: string; url: string };

type SocialLinksStepProps = {
    data?: { socialLinks?: { business?: SocialLink[]; custom?: SocialLink[] }; socialLinksDraft?: { newCustom?: SocialLink } };
    onNext: (payload: any) => void;
    onPrevious: (payload: any) => void;
    onUpdate?: (payload: any) => void;
};

export const SocialLinksStep: FC<SocialLinksStepProps> = ({ data = {}, onNext, onPrevious, onUpdate }) => {
    // Add default values if data is null/undefined
    const safeData = data || {};
    const { t, lang } = useLang();
    
    const [businessLinks, setBusinessLinks] = useState<SocialLink[]>(() => {
        if (safeData.socialLinks?.business && Array.isArray(safeData.socialLinks.business)) {
            return safeData.socialLinks.business;
        }
        return mainPlatforms.map((p) => ({ platform: p.name, url: "" }));
    });
    const [customLinks, setCustomLinks] = useState<SocialLink[]>(data.socialLinks?.custom || []);
    const [newCustom, setNewCustom] = useState<SocialLink>(data.socialLinksDraft?.newCustom || { platform: "", url: "" });
    const [urlErrors, setUrlErrors] = useState<Record<string, string>>({});
    const [editingCustomIndex, setEditingCustomIndex] = useState<number | null>(null);

    const handleBusinessLinkChange = (index: number, value: string) => {
        setBusinessLinks((prevLinks) => {
            const updated = [...prevLinks];
            // Fix: Add safety check for platform existence
            const platform = updated[index]?.platform || mainPlatforms[index]?.name || "";
            const storedUrl = value.trim();
            updated[index] = { platform, url: storedUrl };
            if (typeof onUpdate === "function") onUpdate({ socialLinks: { business: updated, custom: customLinks } });
            return updated;
        });

        // Fix: Add safety check for mainPlatforms[index]
        if (value && !validators.isValidURL(value, { allowProtocolLess: true })) {
            setUrlErrors((prev) => ({ ...prev, [index]: t("invalid_website") }));
            return;
        }

        // Fix: Ensure mainPlatforms[index] exists before passing to validatePlatformUrl
        if (value && mainPlatforms[index] && !validatePlatformUrl(value, mainPlatforms[index] as Platform)) {
            setUrlErrors((prev) => ({ ...prev, [index]: t("invalid_website") }));
        } else {
            setUrlErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[index];
                return newErrors;
            });
        }
    };

    const handleAddOrUpdateCustom = () => {
        if (newCustom.platform && newCustom.url) {
            const normalized = { platform: newCustom.platform.trim(), url: newCustom.url.trim() };
            
            let next: SocialLink[];
            if (editingCustomIndex !== null) {
                // Update existing custom link
                next = [...customLinks];
                next[editingCustomIndex] = normalized;
                setEditingCustomIndex(null);
            } else {
                // Add new custom link
                next = [...customLinks, normalized];
            }
            
            setCustomLinks(next);
            if (typeof onUpdate === "function") onUpdate({ socialLinks: { business: businessLinks, custom: next } });
            setNewCustom({ platform: "", url: "" });
        }
    };

    const handleEditCustom = (index: number) => {
        const linkToEdit = customLinks[index];
        setNewCustom(linkToEdit);
        setEditingCustomIndex(index);
        // Scroll to form
        document.getElementById("custom-platform-form")?.scrollIntoView({ behavior: "smooth" });
    };

    const handleRemoveCustom = (index: number) => {
        const next = customLinks.filter((_, i) => i !== index);
        setCustomLinks(next);
        if (typeof onUpdate === "function") onUpdate({ socialLinks: { business: businessLinks, custom: next } });
        
        // If we're editing the link that was just deleted, reset the form
        if (editingCustomIndex === index) {
            setEditingCustomIndex(null);
            setNewCustom({ platform: "", url: "" });
        }
    };

    const handleCancelEdit = () => {
        setEditingCustomIndex(null);
        setNewCustom({ platform: "", url: "" });
    };

    const handleSubmit = (e: React.FormEvent) => {
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
        // Ensure business links always have platform names from mainPlatforms
        if (data?.socialLinks?.business && Array.isArray(data.socialLinks.business)) {
            const businessWithPlatforms = data.socialLinks.business.map((link: SocialLink, index: number) => ({
                platform: link?.platform || mainPlatforms[index]?.name || "",
                url: link?.url || "",
            }));
            setBusinessLinks(businessWithPlatforms);
        } else {
            setBusinessLinks(mainPlatforms.map((p) => ({ platform: p.name, url: "" })));
        }
        setCustomLinks(data?.socialLinks?.custom || []);
    }, [data?.socialLinks]);
    
    useEffect(() => {
        // Only update newCustom from parent if we're not in editing mode
        if (editingCustomIndex === null) {
            setNewCustom(data.socialLinksDraft?.newCustom || { platform: "", url: "" });
        }
    }, [data?.socialLinksDraft, editingCustomIndex]);

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
    const currentLink = businessLinks[index] || { platform: platform.name, url: "" };
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
                    type="text"
                    value={currentLink.url}
                    onChange={(e) => handleBusinessLinkChange(index, e.target.value)}
                    placeholder={
                        (t as any)("platform_placeholder", {
                            platform: platform.name.toLowerCase().replace(/\s+/g, ""),
                        }) as string
                    }
                    dir={dirFor(
                        (t as any)("platform_placeholder", {
                            platform: platform.name.toLowerCase().replace(/\s+/g, ""),
                        }) as string,
                    )}
                    className={cn(
                        "focus:border-light-500 w-full rounded-lg border px-4 py-2 focus:outline-none",
                        urlErrors[index] ? "border-danger-500" : "border-light-600",
                        dirFor(
                            (t as any)("platform_placeholder", {
                                platform: platform.name.toLowerCase().replace(/\s+/g, ""),
                            }) as string,
                        ) === "rtl"
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
                <div id="custom-platform-form" className="bg-dark-50 dark:bg-dark-800/50 space-y-3 rounded-lg p-4">
                    {editingCustomIndex !== null && (
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-danger-600 text-sm font-medium">{t("editing_platform")}</p>
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-light-600 hover:text-light-900 text-sm"
                            >
                                {t("cancel")}
                            </button>
                        </div>
                    )}
                    
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
                                type="text"
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
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleAddOrUpdateCustom}
                            className="btn-ghost flex items-center gap-2"
                        >
                            {editingCustomIndex !== null ? (
                                <>
                                    <Edit2 size={16} />
                                    {t("update_platform")}
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    {t("add_platform")}
                                </>
                            )}
                        </button>
                        
                        {editingCustomIndex !== null && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="btn-ghost text-light-600 flex items-center gap-2"
                            >
                                {t("cancel")}
                            </button>
                        )}
                    </div>
                </div>

                {customLinks.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <h3 className="text-dark-700 dark:text-secdark-200 text-sm font-medium">
                            {t("added_platforms")} ({customLinks.length})
                        </h3>
                        {customLinks.map((link, index) => (
                            <div
                                key={index}
                                className={`border-light-600 dark:border-dark-700 dark:bg-dark-800 flex items-center justify-between rounded-lg border bg-white p-3 transition-colors duration-300 ${
                                    editingCustomIndex === index ? "ring-primary-500 ring-2" : ""
                                }`}
                            >
                                <div className="flex-1">
                                    <span className="text-light-900 dark:text-dark-50 font-medium">{link.platform}</span>
                                    <p className="text-light-600 dark:text-dark-400 truncate text-sm">{link.url}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleEditCustom(index)}
                                        className="text-danger-600 hover:text-danger-700"
                                        title={t("edit_platform")}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCustom(index)}
                                        className="text-red-500 hover:text-red-600"
                                        title={t("remove_platform")}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
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