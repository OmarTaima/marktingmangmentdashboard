import { useState, useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { Check } from "lucide-react";
// Packages are loaded from persisted `packages_master` now. No static defaults are used.
const PackagesPage = () => {
    const { t, lang } = useLang();
    type PackageItem = {
        id: string;
        name?: string;
        description?: string;
        price?: string;
        priceNum?: number;
        discount?: string;
        discountType?: string;
        discountAmount?: number;
        discountedPrice?: number;
        items: { text: string; quantity?: string }[];
        [key: string]: any;
    } | null;

    const [selectedPackage, setSelectedPackage] = useState<PackageItem>(() => {
        try {
            const stored = localStorage.getItem("selectedPackage");
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });
    const [packages, setPackages] = useState<NonNullable<PackageItem>[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("packages_master");
            if (stored) {
                const parsed = JSON.parse(stored) || [];
                // normalize parsed packages to shape { id, name, price, items }
                const normalized = parsed.map((p: any) => {
                    const rawItems = p.features || p.items || [];
                    // keep items as objects { text, quantity } so we can render quantities
                    const items = Array.isArray(rawItems)
                        ? rawItems.map((f) => {
                              if (!f) return { text: "", quantity: "" };
                              if (typeof f === "string") return { text: String(f), quantity: "" };
                              if (typeof f === "object") {
                                  const text = lang === "ar" ? f.ar || f.en || f.text || "" : f.en || f.ar || f.text || "";
                                  return { text, quantity: f.quantity || "" };
                              }
                              return { text: String(f), quantity: "" };
                          })
                        : [];

                    // compute discount if present
                    const priceNum = Number(p.price || 0);
                    const discountVal = p.discount !== undefined && p.discount !== null ? String(p.discount).trim() : "";
                    const discountNum = discountVal === "" ? 0 : Number(discountVal || 0);
                    const discountType = p.discountType || "percentage";
                    let discountAmount = 0;
                    if (discountVal !== "" && !isNaN(priceNum) && priceNum > 0) {
                        if (discountType === "percentage") {
                            discountAmount = (priceNum * (discountNum || 0)) / 100;
                        } else {
                            // fixed amount
                            discountAmount = discountNum || 0;
                        }
                    }
                    const discountedPrice = Math.max(0, priceNum - discountAmount);

                    // resolve description (support string or {en,ar})
                    let descText = "";
                    try {
                        if (p.description) {
                            if (typeof p.description === "string") descText = p.description;
                            else if (typeof p.description === "object")
                                descText = lang === "ar" ? p.description.ar || p.description.en || "" : p.description.en || p.description.ar || "";
                        }
                    } catch (e) {
                        descText = "";
                    }

                    return {
                        id: p.id || `pkg_${Date.now()}`,
                        name: (lang === "ar" ? p.ar || p.en : p.en || p.ar) || p.name || "",
                        description: descText,
                        price: p.price || "",
                        priceNum,
                        discount: discountVal || "",
                        discountType: discountType || "percentage",
                        discountAmount,
                        discountedPrice,
                        items,
                    };
                });
                setPackages(normalized);
            } else {
                setPackages([]);
            }
        } catch (e) {
            setPackages([]);
        }
    }, [lang]);

    const handleSelectPackage = (pkg: any) => {
        setSelectedPackage(pkg as any);
        try {
            localStorage.setItem("selectedPackage", JSON.stringify(pkg));
        } catch (e) {}
        alert(`${pkg.name} ${t("package_selected_message")}`);
    };

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="title text-xl sm:text-2xl lg:text-3xl">{t("service_packages")}</h1>
                <p className="text-light-600 dark:text-dark-400 mt-1 text-sm sm:text-base">{t("service_packages_subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={`card flex min-h-[400px] cursor-pointer flex-col justify-between p-4 transition-all duration-300 hover:shadow-lg sm:p-6 ${
                            selectedPackage?.id === pkg.id ? "ring-light-500 ring-2" : ""
                        }`}
                        onClick={() => setSelectedPackage(pkg)}
                    >
                        <div>
                            <div className="text-center">
                                <h3 className="card-title mb-2 text-lg font-semibold break-words sm:text-xl">{pkg.name}</h3>
                                <div className="mb-4">
                                    {pkg.discount && Number(pkg.discountAmount) > 0 ? (
                                        <div>
                                            <div className="text-light-500 dark:text-secdark-700 mb-1 text-sm line-through">
                                                {pkg.price ? `${pkg.price} ${lang === "ar" ? "ج.م" : "EGP"}` : ""}
                                            </div>
                                            <div className="text-light-900 dark:text-dark-50 text-2xl font-bold sm:text-3xl">
                                                {`${pkg.discountedPrice} ${lang === "ar" ? "ج.م" : "EGP"}`}
                                            </div>
                                            <div className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                {t("discount") || "Discount"}: {pkg.discount}
                                                {pkg.discountType === "percentage" ? "%" : ` ${lang === "ar" ? "ج.م" : "EGP"}`}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-light-500 dark:text-secdark-700 mb-4 text-2xl font-bold break-words sm:text-3xl">
                                            {pkg.price ? `${pkg.price} ${lang === "ar" ? "ج.م" : "EGP"}` : ""}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {pkg.description ? <p className="text-light-600 dark:text-dark-400 mt-2 text-sm">{pkg.description}</p> : null}

                            <ul className="space-y-2 sm:space-y-3">
                                {pkg.items.map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-2"
                                    >
                                        <Check
                                            size={18}
                                            className="mt-0.5 flex-shrink-0 text-green-500"
                                        />
                                        <span className="text-dark-700 dark:text-dark-50 text-sm break-words sm:text-base">
                                            {item.text}
                                            {item.quantity ? (
                                                <span className="text-light-600 dark:text-dark-400 ml-1 text-xs">({item.quantity})</span>
                                            ) : null}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPackage(pkg);
                            }}
                            className="btn-primary btn-sm mt-6 w-full"
                        >
                            {t("select_package")}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PackagesPage;
