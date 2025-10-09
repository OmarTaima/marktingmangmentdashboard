import { useState } from "react";
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
    const [selectedPackage, setSelectedPackage] = useState(null);

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        localStorage.setItem("selectedPackage", JSON.stringify(pkg));
        alert(`${pkg.name} selected! Proceed to contract generation.`);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="title">Service Packages</h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Choose the best package for your client's needs</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={`card cursor-pointer transition-shadow hover:shadow-lg ${
                            selectedPackage?.id === pkg.id ? "ring-2 ring-blue-500" : ""
                        }`}
                        onClick={() => setSelectedPackage(pkg)}
                    >
                        <h3 className="card-title mb-2 text-xl">{pkg.name}</h3>
                        <p className="mb-6 text-3xl font-bold text-blue-500">{pkg.price}</p>
                        <ul className="space-y-3">
                            {pkg.items.map((item, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2"
                                >
                                    <Check
                                        size={20}
                                        className="mt-0.5 flex-shrink-0 text-green-500"
                                    />
                                    <span className="text-slate-700 dark:text-slate-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPackage(pkg);
                            }}
                            className="btn-primary mt-6 w-full"
                        >
                            Select Package
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PackagesPage;
