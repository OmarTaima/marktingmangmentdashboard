import { useState, useEffect } from "react";
import { Download, Edit2, Save } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useNavigate } from "react-router-dom";

const ContractPage = () => {
    const { t, lang } = useLang();
    const navigate = useNavigate();
    const [clientData, setClientData] = useState(null);
    const [planData, setPlanData] = useState(null);
    const [packageData, setPackageData] = useState(null);
    const [contractTerms, setContractTerms] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // Prefer explicit selected client id
        const selectedId = localStorage.getItem("selectedClientId");
        if (selectedId) {
            const clientsRaw = localStorage.getItem("clients");
            if (clientsRaw) {
                try {
                    const clients = JSON.parse(clientsRaw);
                    const found = clients.find((c) => String(c.id) === String(selectedId));
                    if (found) setClientData(found);
                } catch (e) {
                    // ignore parse errors
                }
            }
        }

        // Load fallback client data
        const client = localStorage.getItem("clientData");
        const plan = localStorage.getItem("campaign_plan_0");
        const pkgRaw = localStorage.getItem("selectedPackage");
        const pkg = pkgRaw ? JSON.parse(pkgRaw) : null;

        if (!clientData && client) setClientData(JSON.parse(client));
        if (plan) setPlanData(JSON.parse(plan));
        if (pkg) setPackageData(pkg);

        // Load or set default contract terms. If a saved custom contract exists, keep it.
        const savedTerms = localStorage.getItem("contractTerms");
        if (savedTerms) {
            setContractTerms(savedTerms);
            return;
        }

        const englishTemplate = `MARKETING SERVICES AGREEMENT

This Agreement is entered into as of [DATE] between:

CLIENT: [Client Name]
AGENCY: Marketing Agency Name

1. SERVICES
The Agency agrees to provide the following services as outlined in the ${pkg ? pkg.name : "selected package"}.

2. TERM
This agreement shall commence on [START DATE] and continue for a period of [DURATION].

3. COMPENSATION
Client agrees to pay the Agency ${pkg ? pkg.price : "$X,XXX/month"} payable monthly.

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
Agency's liability shall not exceed the total amount paid under this agreement.`;

        const arabicTemplate = `اتفاقية خدمات تسويق

تم إبرام هذه الاتفاقية بتاريخ [DATE] بين:

العميل: [Client Name]
الوكالة: اسم وكالة التسويق

1. الخدمات
توافق الوكالة على تقديم الخدمات التالية كما هو موضح في ${pkg ? pkg.name : "الحزمة المحددة"}.

2. المدة
تبدأ هذه الاتفاقية في [START DATE] وتستمر لمدة [DURATION].

3. التعويض
يوافق العميل على دفع ${pkg ? pkg.price : "$X,XXX/شهريًا"} للوكالة شهريًا.

4. المسؤوليات
4.1 يجب على الوكالة تقديم الخدمات كما هو محدد في خطة الحملة.
4.2 يجب على العميل توفير الوصول والمواد والموافقات اللازمة.

5. السرية
يتفق الطرفان على الحفاظ على سرية المعلومات المملوكة.

6. الإنهاء
يجوز لأي من الطرفين إنهاء الاتفاقية بعد إشعار كتابي قبل 30 يومًا.

7. الملكية الفكرية
تظل جميع الأعمال الإبداعية ملكًا للوكالة حتى يتم استلام الدفعة الكاملة.

8. تحديد المسؤولية
لا تتجاوز مسؤولية الوكالة إجمالي المبلغ المدفوع بموجب هذه الاتفاقية.`;

        // Helper to fill placeholders using available data
        const fillTemplate = (template) => {
            const now = new Date();
            const dateStr = now.toLocaleDateString(lang === "ar" ? "ar-EG" : undefined);
            const startDate = planData?.startDate || "[START DATE]";
            const duration = planData?.duration || "[DURATION]";
            const clientName = clientData?.business?.businessName || clientData?.personal?.fullName || "[Client Name]";
            const packageName = packageData?.name || (pkg ? pkg.name : "selected package");
            const packagePrice = packageData?.price || (pkg ? pkg.price : "$X,XXX/month");

            return template
                .replace(/\[DATE\]/g, dateStr)
                .replace(/\[START DATE\]/g, startDate)
                .replace(/\[DURATION\]/g, duration)
                .replace(/\[Client Name\]/g, clientName)
                .replace(/\$\{pkg \? pkg.name : "selected package"\}/g, packageName)
                .replace(/\$\{pkg \? pkg.price : "\\$X,XXX\/month"\}/g, packagePrice)
                .replace(/\$\{pkg \? pkg.name : "الحزمة المحددة"\}/g, packageName)
                .replace(/\$\{pkg \? pkg.price : "\\$X,XXX\/شهريًا"\}/g, packagePrice);
        };

        // fill with available data
        const filled = fillTemplate(lang === "ar" ? arabicTemplate : englishTemplate);
        setContractTerms(filled);
    }, [lang]);

    const handleSave = () => {
        localStorage.setItem("contractTerms", contractTerms);
        setIsEditing(false);
        alert(t("save_contract") || "Contract saved successfully!");
    };

    const handleDownload = () => {
        const filename = `contract_${clientData?.business?.businessName || "client"}.txt`.replace(/\s+/g, "_");
        const element = document.createElement("a");
        const file = new Blob([contractTerms], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleSelectClient = () => {
        navigate("/clients");
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("contracts_title")}</h1>
                    <p className="text-secondary-600 dark:text-secondary-400 mt-1">{t("contracts_subtitle")}</p>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <button
                            onClick={handleSave}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Save size={16} />
                            {t("save_contract")}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn-ghost flex items-center gap-2"
                            >
                                <Edit2 size={16} />
                                {t("edit")}
                            </button>
                            <button
                                onClick={handleDownload}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Download size={16} />
                                {t("download_contract")}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Summary Cards */}
                <div className="space-y-4 lg:col-span-1">
                    {clientData ? (
                        <div className="card">
                            <h3 className="card-title mb-3">{t("client_info")}</h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-secondary-900 dark:text-secondary-50 font-medium">{clientData.business?.businessName}</p>
                                <p className="text-secondary-600 dark:text-secondary-400">{clientData.personal?.fullName}</p>
                                <p className="text-secondary-600 dark:text-secondary-400">{clientData.contact?.businessEmail}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="card">
                            <h3 className="card-title mb-3">{t("client_info")}</h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-secondary-600 dark:text-secondary-400">{t("no_client_selected")}</p>
                                <button
                                    className="btn btn-primary mt-2"
                                    onClick={handleSelectClient}
                                >
                                    {t("select_client")}
                                </button>
                            </div>
                        </div>
                    )}

                    {packageData && (
                        <div className="card">
                            <h3 className="card-title mb-3">{t("package_label")}</h3>
                            <p className="text-secondary-900 dark:text-secondary-50 font-medium">{packageData.name}</p>
                            <p className="text-primary-500 mt-2 text-2xl font-bold">{packageData.price}</p>
                        </div>
                    )}

                    {planData && (
                        <div className="card">
                            <h3 className="card-title mb-3">{t("campaign_info")}</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-secondary-500">{t("budget_label")}</span>
                                    <p className="text-secondary-900 dark:text-secondary-50">${planData.budget}</p>
                                </div>
                                <div>
                                    <span className="text-secondary-500">{t("timeline_label")}</span>
                                    <p className="text-secondary-900 dark:text-secondary-50">{planData.timeline}</p>
                                </div>
                                <div>
                                    <span className="text-secondary-500">{t("services_label")}</span>
                                    <p className="text-secondary-900 dark:text-secondary-50">
                                        {(t("services_selected") || "{count} selected").replace(
                                            "{count}",
                                            String(planData.selectedServices?.length || 0),
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contract Editor */}
                <div className="lg:col-span-3">
                    <div className="card">
                        <h3 className="card-title mb-4">{t("contract_terms")}</h3>
                        {isEditing ? (
                            <textarea
                                value={contractTerms}
                                onChange={(e) => setContractTerms(e.target.value)}
                                rows={25}
                                className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-3 font-mono text-sm focus:outline-none"
                            />
                        ) : (
                            <div className="bg-secondary-50 text-secondary-900 dark:bg-secondary-800/50 dark:text-secondary-50 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap">
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
