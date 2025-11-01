import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { BusinessInfoStep } from "./steps/BusinessInfoStep";
import { ContactInfoStep } from "./steps/ContactInfoStep";
import { BranchesStep } from "./steps/BranchesStep";
import { SocialLinksStep } from "./steps/SocialLinksStep";
import { SwotStep } from "./steps/SwotStep";
import { SegmentsStep } from "./steps/SegmentsStep";
import { CompetitorsStep } from "./steps/CompetitorsStep";

import { useLang } from "@/hooks/useLang";
import { User, Briefcase, Phone, MapPin, Share2, BarChart2, Target, Users } from "lucide-react";

const steps = [
    { id: 1, name: "Personal Info", component: PersonalInfoStep },
    { id: 2, name: "Business Info", component: BusinessInfoStep },
    { id: 3, name: "Contact Info", component: ContactInfoStep },
    { id: 4, name: "Branches", component: BranchesStep },
    { id: 5, name: "Social Links", component: SocialLinksStep },
    { id: 6, name: "SWOT Analysis", component: SwotStep },
    { id: 7, name: "Target Segments", component: SegmentsStep },
    { id: 8, name: "Competitors", component: CompetitorsStep },
];

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { t } = useLang();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        personal: {},
        business: {},
        contact: {},
        branches: [],
        socialLinks: { business: [], personal: [] },
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        segments: [],
        competitors: [],
    });
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("id");

    // If editing an existing client, load its data into formData
    useEffect(() => {
        if (!editId) return;
        const stored = localStorage.getItem("clients");
        if (!stored) return;
        try {
            const clients = JSON.parse(stored);
            const found = clients.find((c) => c.id === editId);
            if (found) {
                // Remove id and createdAt from nested objects when prefilling (we keep id at top-level)
                setFormData({
                    personal: found.personal || {},
                    business: found.business || {},
                    contact: found.contact || {},
                    branches: found.branches || [],
                    socialLinks: found.socialLinks || { business: [], personal: [] },
                    swot: found.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
                    segments: found.segments || [],
                    competitors: found.competitors || [],
                });
            }
        } catch (err) {
            // ignore parse errors
        }
    }, [editId]);

    // Load draft from localStorage when not editing an existing client
    useEffect(() => {
        if (editId) return; // editing mode takes precedence
        try {
            const draft = localStorage.getItem("onboarding_draft");
            if (draft) {
                const parsed = JSON.parse(draft);
                setFormData((prev) => ({ ...prev, ...parsed }));
            }
        } catch (err) {
            // ignore
        }
    }, [editId]);

    // Persist draft whenever formData changes
    useEffect(() => {
        try {
            localStorage.setItem("onboarding_draft", JSON.stringify(formData));
        } catch (err) {
            // ignore storage errors
        }
    }, [formData]);

    const CurrentStepComponent = steps[currentStep].component;

    const handleNext = (stepData) => {
        // Build an updated snapshot combining current formData and incoming step data.
        const updatedFormData = stepData ? { ...formData, [Object.keys(stepData)[0]]: stepData[Object.keys(stepData)[0]] } : { ...formData };

        // persist immediately to state
        setFormData(updatedFormData);

        if (currentStep < steps.length - 1) {
            setCurrentStep((s) => s + 1);
        } else {
            // If editing, update existing client instead of creating new
            if (editId) {
                const stodangerClients = localStorage.getItem("clients");
                const clients = stodangerClients ? JSON.parse(stodangerClients) : [];
                const idx = clients.findIndex((c) => c.id === editId);
                if (idx !== -1) {
                    const updatedClient = { ...clients[idx], ...updatedFormData };
                    clients[idx] = updatedClient;
                    localStorage.setItem("clients", JSON.stringify(clients));
                    console.log("✅ Updated client:", updatedClient);
                    alert("Client updated successfully!");
                    // clear draft
                    localStorage.removeItem("onboarding_draft");
                    navigate("/clients");
                    return;
                }
                // if editId not found, fallthrough to create new client
            }

            // Generate unique ID for the client
            const clientId = `client_${Date.now()}`;

            // Create client object with ID
            const newClient = {
                id: clientId,
                ...updatedFormData,
                createdAt: new Date().toISOString(),
            };

            // Load existing clients
            const stodangerClients = localStorage.getItem("clients");
            const clients = stodangerClients ? JSON.parse(stodangerClients) : [];

            // Add new client to array
            clients.push(newClient);

            // Save back to localStorage
            localStorage.setItem("clients", JSON.stringify(clients));

            // clear draft
            localStorage.removeItem("onboarding_draft");

            console.log("✅ Saved client data:", newClient);
            console.log("Total clients:", clients.length);
            console.log("Segments count:", updatedFormData.segments?.length || 0);
            console.log("Competitors count:", updatedFormData.competitors?.length || 0);

            alert("Client added successfully!");

            // redirect to clients page
            navigate("/clients");
        }
    };

    const handlePrevious = (stepData) => {
        // optionally merge step data before going back
        if (stepData) {
            const stepKey = Object.keys(stepData)[0];
            setFormData((prev) => ({ ...prev, [stepKey]: stepData[stepKey] }));
        }

        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="card transition-colors duration-300">
                <div className="card-header">
                    <h1 className="card-title text-2xl">{t("client_onboarding")}</h1>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="mb-2 flex items-center justify-between">
                        {steps.map((step, index) => {
                            const icons = [User, Briefcase, Phone, MapPin, Share2, BarChart2, Target, Users];
                            const Icon = icons[index] || User;
                            return (
                                <div
                                    key={step.id}
                                    className="flex flex-1 items-center"
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            try {
                                                localStorage.setItem("onboarding_draft", JSON.stringify(formData));
                                            } catch (e) {}
                                            setCurrentStep(index);
                                        }}
                                        aria-label={`Go to step ${index + 1} - ${step.name}`}
                                        tabIndex={0}
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors focus:outline-none ${
                                            index <= currentStep
                                                ? "bg-light-500 text-white"
                                                : "bg-dark-200 text-light-600 dark:bg-dark-700 dark:text-dark-400"
                                        }`}
                                    >
                                        <Icon size={16} />
                                    </button>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`h-1 flex-1 transition-colors ${
                                                index < currentStep ? "bg-light-500" : "bg-dark-200 dark:bg-dark-700"
                                            }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-light-600 dark:text-dark-400 text-sm font-medium">
                            Step {currentStep + 1} of {steps.length}: {t(steps[currentStep].name)}
                        </span>
                    </div>
                </div>

                {/* Step Content */}
                <div className="card-body">
                    <CurrentStepComponent
                        data={formData}
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        onUpdate={(stepData) => {
                            if (stepData) {
                                const key = Object.keys(stepData)[0];
                                setFormData((prev) => ({ ...prev, [key]: stepData[key] }));
                            }
                        }}
                        isFirst={currentStep === 0}
                        isLast={currentStep === steps.length - 1}
                    />
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
