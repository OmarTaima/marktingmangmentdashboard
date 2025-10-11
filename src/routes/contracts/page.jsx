import { useState, useEffect } from "react";
import { Download, Edit2, Save } from "lucide-react";

const ContractPage = () => {
    const [clientData, setClientData] = useState(null);
    const [planData, setPlanData] = useState(null);
    const [packageData, setPackageData] = useState(null);
    const [contractTerms, setContractTerms] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // Load all data from localStorage
        const client = localStorage.getItem("clientData");
        const plan = localStorage.getItem("campaign_plan_0");
        const pkg = localStorage.getItem("selectedPackage");

        if (client) setClientData(JSON.parse(client));
        if (plan) setPlanData(JSON.parse(plan));
        if (pkg) setPackageData(JSON.parse(pkg));

        // Load or set default contract terms
        const savedTerms = localStorage.getItem("contractTerms");
        if (savedTerms) {
            setContractTerms(savedTerms);
        } else {
            setContractTerms(`MARKETING SERVICES AGREEMENT

This Agreement is entered into as of [DATE] between:

CLIENT: [Client Name]
AGENCY: Marketing Agency Name

1. SERVICES
The Agency agrees to provide the following services as outlined in the ${pkg ? JSON.parse(pkg).name : "selected package"}.

2. TERM
This agreement shall commence on [START DATE] and continue for a period of [DURATION].

3. COMPENSATION
Client agrees to pay the Agency ${pkg ? JSON.parse(pkg).price : "$X,XXX/month"} payable monthly.

4. RESPONSIBILITIES
4.1 Agency shall provide services as specified in the campaign plan.
4.2 Client shall provide necessary access, materials, and approvals.

5. CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information.

6. TERMINATION
Either party may terminate with 30 days written notice.

7. INTELLECTUAL PROPERTY
All creative work remains property of the Agency until full payment is received.

8. LIMITATION OF LIABILITY
Agency's liability shall not exceed the total amount paid under this agreement.`);
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem("contractTerms", contractTerms);
        setIsEditing(false);
        alert("Contract saved successfully!");
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([contractTerms], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `contract_${clientData?.business?.businessName || "client"}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">Contract Generation</h1>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Review and customize the contract terms</p>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <button
                            onClick={handleSave}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Save size={16} />
                            Save Contract
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn-ghost flex items-center gap-2"
                            >
                                <Edit2 size={16} />
                                Edit
                            </button>
                            <button
                                onClick={handleDownload}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Download size={16} />
                                Download
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Summary Cards */}
                <div className="space-y-4 lg:col-span-1">
                    {clientData && (
                        <div className="card">
                            <h3 className="card-title mb-3">Client Info</h3>
                            <div className="space-y-2 text-sm">
                                <p className="font-medium text-slate-900 dark:text-slate-50">{clientData.business?.businessName}</p>
                                <p className="text-slate-600 dark:text-slate-400">{clientData.personal?.fullName}</p>
                                <p className="text-slate-600 dark:text-slate-400">{clientData.contact?.businessEmail}</p>
                            </div>
                        </div>
                    )}

                    {packageData && (
                        <div className="card">
                            <h3 className="card-title mb-3">Package</h3>
                            <p className="font-medium text-slate-900 dark:text-slate-50">{packageData.name}</p>
                            <p className="mt-2 text-2xl font-bold text-blue-500">{packageData.price}</p>
                        </div>
                    )}

                    {planData && (
                        <div className="card">
                            <h3 className="card-title mb-3">Campaign Info</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-slate-500">Budget:</span>
                                    <p className="text-slate-900 dark:text-slate-50">${planData.budget}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Timeline:</span>
                                    <p className="text-slate-900 dark:text-slate-50">{planData.timeline}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Services:</span>
                                    <p className="text-slate-900 dark:text-slate-50">{planData.selectedServices?.length || 0} selected</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contract Editor */}
                <div className="lg:col-span-3">
                    <div className="card">
                        <h3 className="card-title mb-4">Contract Terms</h3>
                        {isEditing ? (
                            <textarea
                                value={contractTerms}
                                onChange={(e) => setContractTerms(e.target.value)}
                                rows={25}
                                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                            />
                        ) : (
                            <div className="rounded-lg bg-slate-50 p-6 font-mono text-sm whitespace-pre-wrap text-slate-900 dark:bg-slate-800/50 dark:text-slate-50">
                                {contractTerms}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractPage;
