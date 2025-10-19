import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { Check } from "lucide-react";

const packages = [
    {
        id: "starter",
        name: "Starter Package",
        price: "$1,500/month",
        items: ["Social Media (2 posts/week)", "Basic Graphics", "Monthly Report"],
    },
    {
        id: "growth",
        name: "Growth Package",
        price: "$3,500/month",
        items: ["Social Media (5 posts/week)", "Professional Content", "Reels/Videos (2/week)", "Paid Ads Management", "Bi-weekly Reports"],
    },
    {
        id: "premium",
        name: "Premium Package",
        price: "$6,500/month",
        items: [
            "Daily Social Media Posts",
            "Premium Content Creation",
            "Reels/Videos (4/week)",
            "Multi-Platform Ads",
            "Influencer Partnerships",
            "Website Management",
            "Weekly Reports",
            "Dedicated Account Manager",
        ],
    },
];

const PackagesPage = () => {
    const { t } = useLang();
    const [selectedPackage, setSelectedPackage] = useState(null);

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        localStorage.setItem("selectedPackage", JSON.stringify(pkg));
        alert(`${pkg.name} ${t("package_selected_message")}`);
    };

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div>
                <h1 className="title">{t("service_packages")}</h1>
                <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t("service_packages_subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={`card flex h-full cursor-pointer flex-col transition-colors duration-300 hover:shadow-lg ${
                            selectedPackage?.id === pkg.id ? "ring-primary-500 ring-2" : ""
                        }`}
                        onClick={() => setSelectedPackage(pkg)}
                    >
                        <h3 className="card-title mb-2 text-xl break-words">{pkg.name}</h3>
                        <p className="text-primary-500 mb-6 text-3xl font-bold break-words">{pkg.price}</p>
                        <ul className="flex-1 space-y-3">
                            {pkg.items.map((item, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2"
                                >
                                    <Check
                                        size={20}
                                        className="mt-0.5 flex-shrink-0 text-green-500"
                                    />
                                    <span className="text-secondary-700 dark:text-secondary-300 break-words">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPackage(pkg);
                            }}
                            className="btn-primary btn-sm mt-auto w-full"
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
