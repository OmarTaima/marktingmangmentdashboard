import { useState, useEffect } from "react";
import type { FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { BusinessInfoStep } from "./steps/BusinessInfoStep";
import { ContactInfoStep } from "./steps/ContactInfoStep";
import { BranchesStep } from "./steps/BranchesStep";
import { SocialLinksStep } from "./steps/SocialLinksStep";
import { SwotStep } from "./steps/SwotStep";
import { CompetitorsStep } from "./steps/CompetitorsStep";

import { useLang } from "@/hooks/useLang";
import { User, Briefcase, Phone, MapPin, Share2, BarChart2, Target, Users } from "lucide-react";
import { createClient, getClientById, updateClient } from "@/api";

type Swot = { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] };

type OnboardingData = {
    personal?: Record<string, any>;
    business?: Record<string, any>;
    contact?: Record<string, any>;
    branches?: any[];
    branchesDraft?: any;
    socialLinks?: { business?: any[]; personal?: any[]; custom?: any[] };
    socialLinksDraft?: any;
    swot?: Swot;
    swotDraftInputs?: Record<string, string> | null;
    competitors?: any[];
    competitorsDraft?: any;
    currentCompetitorDraft?: any;
};

type StepDef = { id: number; name: string; component: FC<any> };

const steps: StepDef[] = [
    { id: 1, name: "Personal Info", component: PersonalInfoStep },
    { id: 2, name: "Business Info", component: BusinessInfoStep },
    { id: 3, name: "Contact Info", component: ContactInfoStep },
    { id: 4, name: "Branches", component: BranchesStep },
    { id: 5, name: "Social Links", component: SocialLinksStep },
    { id: 6, name: "SWOT Analysis", component: SwotStep },
    { id: 7, name: "Competitors", component: CompetitorsStep },
];

const OnboardingPage: FC = () => {
    const navigate = useNavigate();
    const { t } = useLang();
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<OnboardingData>({
        personal: {},
        business: {},
        contact: {},
        branches: [],
        socialLinks: { business: [], personal: [] },
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        competitors: [],
    });
    const [searchParams] = useSearchParams();
    const editId = searchParams.get("id");

    // If editing an existing client, load its data from API
    useEffect(() => {
        if (!editId) return;

        const abortController = new AbortController();

        const fetchClient = async () => {
            try {
                const client = await getClientById(editId);

                // Only update state if component is still mounted and we received a client
                if (!abortController.signal.aborted && client) {
                    setFormData({
                        personal: client.personal || {},
                        business: client.business || {},
                        contact: client.contact || {},
                        branches: client.branches || [],
                        socialLinks: client.socialLinks || { business: [], personal: [] },
                        swot: client.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
                        competitors: client.competitors || [],
                    });
                }
            } catch (error) {
                const err = error as any;
                if (err?.name === "AbortError" || err?.name === "CanceledError") {
                    console.log("Request cancelled");
                    return;
                }
                console.error("Error loading client:", err);
                if (!abortController.signal.aborted) {
                    alert("Failed to load client data. Please try again.");
                }
            }
        };

        fetchClient();

        // Cleanup function to abort request on unmount
        return () => {
            abortController.abort();
        };
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

    const handleNext = (stepData?: Partial<OnboardingData>) => {
        // Build an updated snapshot combining current formData and incoming step data.
        let updatedFormData: OnboardingData = stepData ? { ...formData, ...stepData } : { ...formData };

        // If this is the last step (Complete button), commit any remaining drafts
        if (currentStep === steps.length - 1) {
            // Commit branchesDraft if it has any non-empty value
            if (updatedFormData.branchesDraft) {
                const d = updatedFormData.branchesDraft;
                if ((d.name && d.name.trim()) || (d.address && d.address.trim()) || (d.phone && d.phone.trim())) {
                    updatedFormData.branches = [...(updatedFormData.branches || []), d];
                }
                delete updatedFormData.branchesDraft;
            }

            // Commit socialLinksDraft.newCustom if it exists
            if (updatedFormData.socialLinksDraft && updatedFormData.socialLinksDraft.newCustom) {
                const nc = updatedFormData.socialLinksDraft.newCustom;
                if ((nc.platform && nc.platform.trim()) || (nc.url && nc.url.trim())) {
                    updatedFormData.socialLinks = updatedFormData.socialLinks || { business: [], custom: [] };
                    updatedFormData.socialLinks.custom = [...(updatedFormData.socialLinks.custom || []), nc];
                }
                delete updatedFormData.socialLinksDraft;
            }

            // Commit swotDraftInputs if any
            if (updatedFormData.swotDraftInputs) {
                updatedFormData.swot = updatedFormData.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };
                const inputs = updatedFormData.swotDraftInputs;
                if (inputs.strength && inputs.strength.trim())
                    updatedFormData.swot.strengths = [...updatedFormData.swot.strengths, inputs.strength.trim()];
                if (inputs.weakness && inputs.weakness.trim())
                    updatedFormData.swot.weaknesses = [...updatedFormData.swot.weaknesses, inputs.weakness.trim()];
                if (inputs.opportunity && inputs.opportunity.trim())
                    updatedFormData.swot.opportunities = [...updatedFormData.swot.opportunities, inputs.opportunity.trim()];
                if (inputs.threat && inputs.threat.trim()) updatedFormData.swot.threats = [...updatedFormData.swot.threats, inputs.threat.trim()];
                delete updatedFormData.swotDraftInputs;
            }

            // Commit currentCompetitorDraft if it exists
            if (updatedFormData.competitorsDraft || updatedFormData.currentCompetitorDraft) {
                const cd = updatedFormData.competitorsDraft || updatedFormData.currentCompetitorDraft;
                const has = Object.values(cd).some((v) => {
                    if (Array.isArray(v)) return v.length > 0;
                    if (typeof v === "object" && v !== null)
                        return Object.values(v).some((val) => (Array.isArray(val) ? val.length > 0 : !!(val && String(val).trim())));
                    return !!(v && String(v).trim());
                });
                if (has) updatedFormData.competitors = [...(updatedFormData.competitors || []), cd];
                delete updatedFormData.competitorsDraft;
                delete updatedFormData.currentCompetitorDraft;
            }
        }

        // persist immediately to state
        setFormData(updatedFormData);

        if (currentStep < steps.length - 1) {
            setCurrentStep((s) => s + 1);
        } else {
            // Handle API submission
            const submitClient = async () => {
                try {
                    if (editId) {
                        // Update existing client
                        await updateClient(editId, updatedFormData as any);
                        console.log("✅ Updated client:", editId);
                        alert("Client updated successfully!");
                    } else {
                        // Create new client
                        const newClient = await createClient(updatedFormData as any);
                        console.log("✅ Created client:", newClient);
                        alert("Client added successfully!");
                    }

                    // Clear draft
                    localStorage.removeItem("onboarding_draft");

                    // Redirect to clients page
                    navigate("/clients");
                } catch (error) {
                    const err = error as any;
                    console.error("Error saving client:", err);
                    const errorMessage = err?.response?.data?.message || err?.message || "Failed to save client";
                    alert(`Error: ${errorMessage}. Please try again.`);
                }
            };

            submitClient();
        }
    };

    const handlePrevious = (stepData?: Partial<OnboardingData>) => {
        // optionally merge step data before going back
        if (stepData) {
            setFormData((prev) => ({ ...prev, ...stepData }));
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
                        onUpdate={(stepData?: Partial<OnboardingData>) => {
                            if (stepData) {
                                const key = Object.keys(stepData)[0] as keyof Partial<OnboardingData>;
                                setFormData((prev) => ({ ...prev, [key]: (stepData as any)[key] }));
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
