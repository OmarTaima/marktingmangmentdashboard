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
        // Load everything from localStorage once (on mount or when lang changes)
        const selectedId = localStorage.getItem("selectedClientId");

        // try to load clients list and resolve by selectedId
        let resolvedClient = null;
        const clientsRaw = localStorage.getItem("clients");
        if (clientsRaw) {
            try {
                const clients = JSON.parse(clientsRaw);
                if (selectedId) {
                    resolvedClient = clients.find((c) => String(c.id) === String(selectedId)) || null;
                }
            } catch (e) {
                // ignore parse errors
            }
        }

        // fallback to single clientData stored
        const clientRaw = localStorage.getItem("clientData");
        if (!resolvedClient && clientRaw) {
            try {
                resolvedClient = JSON.parse(clientRaw);
            } catch (e) {
                // ignore
            }
        }
        setClientData(resolvedClient);

        // load plan and package (use local vars so we can use them immediately)
        let planObj = null;
        const planRaw = localStorage.getItem("campaign_plan_0");
        if (planRaw) {
            try {
                planObj = JSON.parse(planRaw);
                setPlanData(planObj);
            } catch (e) {}
        }

        let pkgObj = null;
        const pkgRaw = localStorage.getItem("selectedPackage");
        if (pkgRaw) {
            try {
                pkgObj = JSON.parse(pkgRaw);
                setPackageData(pkgObj);
            } catch (e) {}
        }

        // if user previously saved custom contract terms, respect them
        const savedTerms = localStorage.getItem("contractTerms");
        if (savedTerms) {
            setContractTerms(savedTerms);
            return;
        }

        // templates use simple placeholders that we will replace
        const englishTemplate = `MARKETING SERVICES AGREEMENT

This Agreement is entered into as of [DATE] between:

CLIENT: [Client Name]
AGENCY: Marketing Agency Name

1. SERVICES
The Agency agrees to provide the following services as outlined in the [PACKAGE_NAME].

2. TERM
This agreement shall commence on [START DATE] and continue for a period of [DURATION].

3. COMPENSATION
Client agrees to pay the Agency [PACKAGE_PRICE] payable monthly.

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
توافق الوكالة على تقديم الخدمات التالية كما هو موضح في [PACKAGE_NAME].

2. المدة
تبدأ هذه الاتفاقية في [START DATE] وتستمر لمدة [DURATION].

3. التعويض
يوافق العميل على دفع [PACKAGE_PRICE] للوكالة شهريًا.

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

        const fillTemplate = (template, opts = {}) => {
            const { client = null, plan = null, pkg = null } = opts;
            const now = new Date();
            const dateStr = now.toLocaleDateString(lang === "ar" ? "ar-EG" : undefined);
            const startDate = plan?.startDate || "[START DATE]";
            const duration = plan?.duration || "[DURATION]";
            const clientName = client?.business?.businessName || client?.personal?.fullName || "[Client Name]";
            const packageName = pkg?.name || "[PACKAGE_NAME]";
            const packagePrice = pkg?.price || "[PACKAGE_PRICE]";

            return template
                .replace(/\[DATE\]/g, dateStr)
                .replace(/\[START DATE\]/g, startDate)
                .replace(/\[DURATION\]/g, duration)
                .replace(/\[Client Name\]/g, clientName)
                .replace(/\[PACKAGE_NAME\]/g, packageName)
                .replace(/\[PACKAGE_PRICE\]/g, packagePrice);
        };

        const baseTemplate = lang === "ar" ? arabicTemplate : englishTemplate;
        const filled = fillTemplate(baseTemplate, { client: resolvedClient, plan: planObj, pkg: pkgObj });
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
                <div className="flex flex-nowrap items-center gap-1 sm:gap-2">
                    {isEditing ? (
                        <button
                            onClick={handleSave}
                            className="btn-primary btn-sm flex items-center gap-2 whitespace-nowrap"
                            aria-label={t("save_contract")}
                        >
                            <Save size={16} />
                            <span className="hidden sm:inline">{t("save_contract")}</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn-ghost btn-sm flex items-center gap-2 whitespace-nowrap"
                                aria-label={t("edit")}
                            >
                                <Edit2 size={16} />
                                <span className="hidden sm:inline">{t("edit")}</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="btn-primary btn-sm flex items-center gap-2 whitespace-nowrap"
                                aria-label={t("download_contract")}
                            >
                                <Download size={16} />
                                <span className="hidden sm:inline">{t("download_contract")}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {/* Summary Cards */}
                <div className="space-y-4 md:col-span-1 lg:col-span-1 xl:col-span-1">
                    {clientData ? (
                        <div className="card transition-colors duration-300">
                            <h3 className="card-title mb-3">{t("client_info")}</h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-secondary-900 dark:text-secondary-50 font-medium break-words">
                                    {clientData.business?.businessName}
                                </p>
                                <p className="text-secondary-600 dark:text-secondary-400 break-words">{clientData.personal?.fullName}</p>
                                <p className="text-secondary-600 dark:text-secondary-400 break-words">{clientData.contact?.businessEmail}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="card transition-colors duration-300">
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
                        <div className="card transition-colors duration-300">
                            <h3 className="card-title mb-3">{t("package_label")}</h3>
                            <p className="text-secondary-900 dark:text-secondary-50 font-medium break-words">{packageData.name}</p>
                            <p className="text-primary-500 mt-2 text-2xl font-bold">{packageData.price}</p>
                        </div>
                    )}

                    {planData && (
                        <div className="card transition-colors duration-300">
                            <h3 className="card-title mb-3">{t("campaign_info")}</h3>
                            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                <div>
                                    <span className="text-secondary-500">{t("budget_label")}</span>
                                    <p className="text-secondary-900 dark:text-secondary-50 break-words">${planData.budget}</p>
                                </div>
                                <div>
                                    <span className="text-secondary-500">{t("timeline_label")}</span>
                                    <p className="text-secondary-900 dark:text-secondary-50 break-words">{planData.timeline}</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="text-secondary-500">{t("services_label")}</span>
                                    <p className="text-secondary-900 dark:text-secondary-50 break-words">
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
                <div className="md:col-span-1 lg:col-span-2 xl:col-span-3">
                    <div className="card transition-colors duration-300">
                        <h3 className="card-title mb-4">{t("contract_terms")}</h3>
                        {isEditing ? (
                            <textarea
                                value={contractTerms}
                                onChange={(e) => setContractTerms(e.target.value)}
                                rows={25}
                                className="border-secondary-300 text-secondary-900 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-50 focus:border-primary-500 w-full rounded-lg border bg-white px-4 py-3 font-mono text-sm transition-colors duration-300 focus:outline-none"
                            />
                        ) : (
                            <div className="bg-secondary-50 text-secondary-900 dark:bg-secondary-800/50 dark:text-secondary-50 rounded-lg p-6 font-mono text-sm break-words whitespace-pre-wrap">
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
