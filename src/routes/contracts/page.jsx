import { useState, useEffect } from "react";
import { Download, Edit2, Save } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useNavigate } from "react-router-dom";

const ContractPage = () => {
    const { t, lang } = useLang();
    const navigate = useNavigate();
    const [clientData, setClientData] = useState(null);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(localStorage.getItem("selectedClientId") || "");
    const [planData, setPlanData] = useState(null);
    const [packageData, setPackageData] = useState(null);
    const [contractTerms, setContractTerms] = useState("");
    const [termsInput, setTermsInput] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // load list of clients for the preview cards
        try {
            const clientsRaw = localStorage.getItem("clients");
            if (clientsRaw) {
                const parsed = JSON.parse(clientsRaw);
                if (Array.isArray(parsed)) setClients(parsed);
            }
        } catch (e) {
            // ignore parse errors
        }

        const selectedId = localStorage.getItem("selectedClientId");

        let resolvedClient = null;
        const clientsRaw = localStorage.getItem("clients");
        if (clientsRaw) {
            try {
                const clients = JSON.parse(clientsRaw);
                if (selectedId) {
                    resolvedClient = clients.find((c) => String(c.id) === String(selectedId)) || null;
                }
            } catch (e) {}
        }

        const clientRaw = localStorage.getItem("clientData");
        if (!resolvedClient && clientRaw) {
            try {
                resolvedClient = JSON.parse(clientRaw);
            } catch (e) {}
        }
        setClientData(resolvedClient);
        if (selectedId) setSelectedClientId(String(selectedId));

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

    const handlePreview = (client) => {
        try {
            localStorage.setItem("selectedClientId", String(client.id));
        } catch (e) {}
        setClientData(client);
        setSelectedClientId(String(client.id));
        // ensure we're on contracts page
        navigate("/contracts");
    };

    const handleClearSelection = () => {
        try {
            localStorage.removeItem("selectedClientId");
        } catch (e) {}
        setSelectedClientId("");
        setClientData(null);
    };

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
            {/* Header Section */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="title">{t("contracts_title")}</h1>
                    <p className="text-light-600 dark:text-dark-400 mt-1">{t("contracts_subtitle")}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                    {isEditing ? (
                        <button
                            onClick={handleSave}
                            className="btn-primary btn-sm flex items-center gap-2"
                        >
                            <Save size={16} />
                            <span>{t("save_contract")}</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn-ghost btn-sm flex items-center gap-2"
                            >
                                <Edit2 size={16} />
                                <span>{t("edit")}</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="btn-primary btn-sm flex items-center gap-2"
                            >
                                <Download size={16} />
                                <span>{t("download_contract")}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            {!selectedClientId ? (
                <div>
                    {clients.length > 0 ? (
                        <>
                            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-lg font-semibold">
                                {t("select_a_client_to_preview") || "Select a client to preview"}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {clients.map((client) => {
                                    const savedPlan = localStorage.getItem(`plan_${client.id}`);
                                    const plan = savedPlan ? JSON.parse(savedPlan) : null;
                                    return (
                                        <div
                                            key={client.id}
                                            className="card group hover:border-light-500 relative flex h-full flex-col transition-all"
                                        >
                                            <div className="flex-1">
                                                <h3 className="card-title text-lg">{client.business?.businessName || t("unnamed_client")}</h3>
                                                <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                                                    {client.business?.category || t("no_category")}
                                                </p>
                                                {plan ? (
                                                    <div className="text-light-600 dark:text-dark-400 mt-3 space-y-1 text-xs">
                                                        <p>
                                                            💰 {t("budget_usd")}: ${plan.budget || "N/A"}
                                                        </p>
                                                        <p>
                                                            📅 {t("timeline")}: {plan.timeline || "N/A"}
                                                        </p>
                                                        <p>
                                                            🎯 {t("services_to_provide")}: {plan.services?.length || 0}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-400">
                                                        ⚠️ {t("no_plan_created_yet")}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row">
                                                <button
                                                    onClick={() => handlePreview(client)}
                                                    className="btn-primary w-full"
                                                >
                                                    {t("preview_contract")}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="card">
                            <div className="py-8 text-center">
                                <p className="text-light-600 dark:text-dark-400 mb-4">{t("no_clients_found")}</p>
                                <a
                                    href="/onboarding"
                                    className="btn-primary"
                                >
                                    {t("add_your_first_client")}
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleClearSelection}
                            className="btn-ghost"
                        >
                            <LocalizedArrow size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Summary Cards */}
                        <div className="space-y-4 lg:col-span-1">
                            {clientData ? (
                                <div className="card">
                                    <h3 className="card-title mb-3">{t("client_info")}</h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="text-light-900 dark:text-dark-50 font-medium break-words">
                                            {clientData.business?.businessName}
                                        </p>
                                        <p className="text-light-600 dark:text-dark-400 break-words">{clientData.personal?.fullName}</p>
                                        <p className="text-light-600 dark:text-dark-400 break-words">{clientData.contact?.businessEmail}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="card">
                                    <h3 className="card-title mb-3">{t("client_info")}</h3>
                                    <div className="space-y-2 text-sm">
                                        <p className="text-light-600 dark:text-dark-400">{t("no_client_selected")}</p>
                                        <button
                                            className="btn-primary mt-2 w-full sm:w-auto"
                                            onClick={handleSelectClient}
                                        >
                                            {t("select_client")}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Terms quick-insert card placed under client info */}
                            {selectedClientId && (
                                <div className="card">
                                    <h3 className="card-title mb-3">{t("add_term") || "Add Term"}</h3>
                                    <div className="flex gap-2">
                                        <input
                                            placeholder={t("terms_placeholder") || "Enter a term to insert into contract"}
                                            value={termsInput}
                                            onChange={(e) => setTermsInput(e.target.value)}
                                            className="border-light-600 text-light-900 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 flex-1 rounded-lg border px-3 py-2 text-sm transition-colors duration-300 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const trimmed = (termsInput || "").trim();
                                                if (!trimmed) return;
                                                setContractTerms((prev) => (prev ? `${prev}\n\n${trimmed}` : trimmed));
                                                setTermsInput("");
                                            }}
                                            className="btn-primary btn-sm"
                                        >
                                            {t("insert_term") || "Insert"}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {packageData && (
                                <div className="card">
                                    <h3 className="card-title mb-3">{t("package_label")}</h3>
                                    <p className="text-light-900 dark:text-dark-50 font-medium break-words">{packageData.name}</p>
                                    <p className="text-light-500 mt-2 text-2xl font-bold">{packageData.price}</p>
                                </div>
                            )}

                            {planData && (
                                <div className="card">
                                    <h3 className="card-title mb-3">{t("campaign_info")}</h3>
                                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                        <div>
                                            <span className="text-dark-500">{t("budget_label")}</span>
                                            <p className="text-light-900 dark:text-dark-50 break-words">${planData.budget}</p>
                                        </div>
                                        <div>
                                            <span className="text-dark-500">{t("timeline_label")}</span>
                                            <p className="text-light-900 dark:text-dark-50 break-words">{planData.timeline}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <span className="text-dark-500">{t("services_label")}</span>
                                            <p className="text-light-900 dark:text-dark-50 break-words">
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
                        <div className="lg:col-span-2">
                            <div className="card">
                                <h3 className="card-title mb-4">{t("contract_terms")}</h3>
                                {isEditing ? (
                                    <textarea
                                        value={contractTerms}
                                        onChange={(e) => setContractTerms(e.target.value)}
                                        rows={25}
                                        className="border-light-600 text-light-900 focus:border-light-500 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 w-full rounded-lg border bg-white px-4 py-3 font-mono text-sm transition-colors duration-300 focus:outline-none"
                                    />
                                ) : (
                                    <div className="bg-dark-50 text-light-900 dark:bg-dark-800/50 dark:text-dark-50 rounded-lg p-6 font-mono text-sm break-words whitespace-pre-wrap">
                                        {contractTerms}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ContractPage;
