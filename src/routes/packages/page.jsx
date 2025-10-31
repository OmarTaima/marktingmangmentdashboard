import { useState, useEffect } from "react";
import { useLang } from "@/hooks/useLang";
import { Check } from "lucide-react";
// Packages are loaded from persisted `packages_master` now. No static defaults are used.
const PackagesPage = () => {
    const { t, lang } = useLang();
    const [selectedPackage, setSelectedPackage] = useState(() => {
        try {
            const stored = localStorage.getItem("selectedPackage");
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            return null;
        }
    });
    const [packages, setPackages] = useState([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("packages_master");
            if (stored) {
                const parsed = JSON.parse(stored) || [];
                // normalize parsed packages to shape { id, name, price, items }
                const normalized = parsed.map((p) => {
                    const rawItems = p.features || p.items || [];
                    const items = Array.isArray(rawItems)
                        ? rawItems.map((f) => {
                              if (!f) return "";
                              if (typeof f === "string") return f;
                              if (typeof f === "object") return lang === "ar" ? f.ar || f.en || "" : f.en || f.ar || "";
                              return String(f);
                          })
                        : [];

                    return {
                        id: p.id || `pkg_${Date.now()}`,
                        name: (lang === "ar" ? p.ar || p.en : p.en || p.ar) || p.name || "",
                        price: p.price || "",
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

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        try {
            localStorage.setItem("selectedPackage", JSON.stringify(pkg));
        } catch (e) {}
        alert(`${pkg.name} ${t("package_selected_message")}`);
    };

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="title text-xl sm:text-2xl lg:text-3xl">{t("service_packages")}</h1>
                <p className="text-primary-light-600 dark:text-dark-400 mt-1 text-sm sm:text-base">{t("service_packages_subtitle")}</p>
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
                                <p className="text-light-500 dark:text-dark-600 mb-4 text-2xl font-bold break-words sm:text-3xl">
                                    {pkg.price ? `${pkg.price} ${lang === "ar" ? "ج.م" : "EGP"}` : ""}
                                </p>
                            </div>
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
                                        <span className="text-dark-700 dark:text-dark-50 text-sm break-words sm:text-base">{item}</span>
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
