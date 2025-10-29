import { useEffect, useState, useRef } from "react";
import { Plus, FileText, Loader2, Check, Trash2 } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";

const QuotationsPage = () => {
    const { t, lang } = useLang();
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState(null);
    const [globalClientName, setGlobalClientName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const isTransitioningRef = useRef(false);

    const [servicesMaster, setServicesMaster] = useState([]);
    const [pageCustomServices, setPageCustomServices] = useState([]);

    const [selectedServices, setSelectedServices] = useState([]);
    const [servicesPricing, setServicesPricing] = useState({});

    const [customName, setCustomName] = useState("");
    const [customPrice, setCustomPrice] = useState("");

    const [quotations, setQuotations] = useState([]);
    const [isEditing, setIsEditing] = useState(true);

    const loadClients = () => {
        try {
            const raw = localStorage.getItem("clients");
            setClients(raw ? JSON.parse(raw) : []);
        } catch (e) {
            setClients([]);
        }
    };

    const loadMaster = () => {
        try {
            const raw = localStorage.getItem("services_master");
            setServicesMaster(raw ? JSON.parse(raw) : []);
        } catch (e) {
            setServicesMaster([]);
        }
    };

    useEffect(() => {
        loadClients();
        loadMaster();
        const t = setTimeout(() => setIsLoading(false), 120);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        // when selectedClientId changes, load client-scoped data
        if (!selectedClientId) {
            setSelectedClient(null);
            setPageCustomServices([]);
            setQuotations([]);
            return;
        }

        // support global (no-client) mode
        if (selectedClientId === "global") {
            setSelectedClient({ business: { businessName: t("global_quotation") || "Global Quotation" } });
            try {
                const raw = localStorage.getItem(`quotations_custom_global`);
                setPageCustomServices(raw ? JSON.parse(raw) : []);
            } catch (e) {
                setPageCustomServices([]);
            }
            try {
                const raw = localStorage.getItem(`quotations_global`);
                setQuotations(raw ? JSON.parse(raw) : []);
            } catch (e) {
                setQuotations([]);
            }
            setSelectedServices([]);
            setServicesPricing({});
            setIsEditing(true);
            return;
        }

        try {
            const raw = localStorage.getItem("clients");
            if (raw) {
                const list = JSON.parse(raw);
                setSelectedClient(list.find((c) => String(c.id) === String(selectedClientId)) || null);
            }
        } catch (e) {
            setSelectedClient(null);
        }

        try {
            const raw = localStorage.getItem(`quotations_custom_${selectedClientId}`);
            setPageCustomServices(raw ? JSON.parse(raw) : []);
        } catch (e) {
            setPageCustomServices([]);
        }

        try {
            const raw = localStorage.getItem(`quotations_${selectedClientId}`);
            setQuotations(raw ? JSON.parse(raw) : []);
        } catch (e) {
            setQuotations([]);
        }

        setSelectedServices([]);
        setServicesPricing({});
        setIsEditing(true);
    }, [selectedClientId]);

    const handleSelectClient = (id) => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        try {
            localStorage.setItem("selectedClientId", String(id));
        } catch (e) {}
        setSelectedClientId(String(id));
        setTimeout(() => (isTransitioningRef.current = false), 300);
    };

    const handleSelectGlobal = () => {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        try {
            localStorage.setItem("selectedClientId", "global");
        } catch (e) {}
        setSelectedClientId("global");
        setTimeout(() => (isTransitioningRef.current = false), 300);
    };

    const combined = (servicesMaster || []).concat(pageCustomServices || []);

    const idOf = (s) => (typeof s === "string" ? s : s.id || s.en || "");
    const labelOf = (s) => (typeof s === "string" ? s : lang === "ar" ? s.ar || s.en : s.en || s.ar);
    const priceOf = (s) => (typeof s === "string" ? "" : s.price || "");

    const toggleService = (identifier) => {
        if (selectedServices.includes(identifier)) {
            setSelectedServices(selectedServices.filter((x) => x !== identifier));
            const p = { ...servicesPricing };
            delete p[identifier];
            setServicesPricing(p);
            return;
        }
        const found = combined.find((s) => idOf(s) === identifier || labelOf(s) === identifier);
        const def = found ? priceOf(found) : "";
        setSelectedServices([...selectedServices, identifier]);
        setServicesPricing({ ...(servicesPricing || {}), [identifier]: def });
    };

    const updatePrice = (id, val) => setServicesPricing((p) => ({ ...(p || {}), [id]: val }));

    const addCustom = () => {
        const name = (customName || "").trim();
        const price = (customPrice || "").toString().trim();
        if (!name || !price || isNaN(Number(price))) return;
        const item = { id: `qsvc_${Date.now()}`, en: name, ar: "", price };
        const updated = [...(pageCustomServices || []), item];
        setPageCustomServices(updated);
        // choose storage key: per-client or global
        const key = selectedClientId === "global" || !selectedClientId ? `quotations_custom_global` : `quotations_custom_${selectedClientId}`;
        try {
            localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}
        const ident = item.en || item.id;
        setSelectedServices((s) => [...s, ident]);
        setServicesPricing((p) => ({ ...(p || {}), [ident]: price }));
        setCustomName("");
        setCustomPrice("");
    };

    const createQuotation = () => {
        if (!selectedServices.length) return;
        const services = selectedServices.map((identifier) => {
            const found = combined.find((s) => idOf(s) === identifier || labelOf(s) === identifier);
            const name = found ? labelOf(found) : identifier;
            const price = Number(servicesPricing[identifier] || (found ? priceOf(found) : 0));
            return { id: identifier, name, price };
        });
        const total = services.reduce((a, b) => a + Number(b.price || 0), 0);
        const clientIdKey = selectedClientId === "global" || !selectedClientId ? "global" : selectedClientId;
        const clientName =
            selectedClientId === "global"
                ? globalClientName || t("global_quotation") || "Global Quotation"
                : selectedClient?.business?.businessName || "";
        const q = { id: `quotation_${Date.now()}`, createdAt: new Date().toISOString(), clientId: clientIdKey, clientName, services, total };
        const updated = [...(quotations || []), q];
        setQuotations(updated);
        try {
            const storageKey = clientIdKey === "global" ? `quotations_global` : `quotations_${clientIdKey}`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {}
        setIsEditing(false);
    };

    const download = (q) => {
        const lines = [`Quotation: ${q.id}`, `Client: ${q.clientName}`, `Date: ${new Date(q.createdAt).toLocaleString()}`, "", "Services:"];
        q.services.forEach((s) => lines.push(`${s.name} - ${s.price}`));
        lines.push("\nTotal: " + q.total);
        const blob = new Blob([lines.join("\n")], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${q.id}.txt`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("quotations") || "Quotations"}</h1>
                    <p className="text-secondary-600 dark:text-secondary-400">
                        {t("create_and_manage_quotations") || "Create and manage quotations"}
                    </p>
                </div>

                {/* top-level Custom/Global Quotation button (not a card) */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSelectGlobal}
                        className="btn-primary"
                        title={t("create_global_quotation") || "Create Global Quotation"}
                    >
                        {t("custom_quotation") || t("create_global_quotation") || "Custom Quotation"}
                    </button>
                </div>
            </div>

            {!selectedClientId && !isLoading && (
                <div>
                    {clients.length > 0 ? (
                        <>
                            <h2 className="text-secondary-900 dark:text-secondary-50 mb-4 text-lg font-semibold">
                                {t("select_a_client") || "Select a client"}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {clients.map((c) => (
                                    <div
                                        key={c.id}
                                        className="card flex flex-col"
                                    >
                                        <h3 className="card-title text-lg">{c.business?.businessName || t("unnamed_client")}</h3>
                                        <p className="text-secondary-600 mt-1 text-sm">{c.business?.category}</p>
                                        <button
                                            onClick={() => handleSelectClient(c.id)}
                                            className="btn-primary mt-4 w-full"
                                        >
                                            {t("create_quotation") || "Create Quotation"}
                                        </button>
                                    </div>
                                ))}
                                {/* global card removed — global/global-custom access available via top header button */}
                            </div>
                        </>
                    ) : (
                        <div className="card">
                            <div className="py-8 text-center">
                                <p className="text-secondary-600">{t("no_clients_found")}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedClient && !isLoading && (
                <>
                    <div className="card bg-secondary-50 dark:bg-secondary-800/50">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    try {
                                        localStorage.removeItem("selectedClientId");
                                    } catch (e) {}
                                    setSelectedClientId("");
                                }}
                                className="btn-ghost"
                            >
                                <LocalizedArrow size={20} />
                            </button>
                            <div>
                                <h2 className="text-secondary-900 dark:text-secondary-50 text-xl font-bold">
                                    {selectedClient.business?.businessName}
                                </h2>
                                <p className="text-secondary-600 text-sm">{selectedClient.business?.category}</p>
                            </div>
                        </div>
                    </div>

                    {selectedClientId === "global" && (
                        <div className="card">
                            <label className="text-secondary-600 mb-2 block text-sm">{t("global_client_name") || "Quotation Name (optional)"}</label>
                            <input
                                value={globalClientName}
                                onChange={(e) => setGlobalClientName(e.target.value)}
                                placeholder={t("quotation_name_placeholder") || "e.g., Quote for Prospect"}
                                className="border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    <div className="card">
                        <h3 className="card-title mb-4">{t("select_services") || "Select services"}</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {combined.map((s) => {
                                const identifier = idOf(s) || labelOf(s);
                                const label = labelOf(s);
                                const def = priceOf(s);
                                const sel = selectedServices.includes(identifier);
                                const custom = (pageCustomServices || []).some((cs) => (cs.id || cs.en) === (s.id || s.en));
                                return (
                                    <div
                                        key={identifier}
                                        className="relative flex flex-col items-stretch"
                                    >
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => {
                                                if (!isEditing) return;
                                                toggleService(identifier);
                                            }}
                                            onKeyDown={(e) => {
                                                if (!isEditing) return;
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    toggleService(identifier);
                                                }
                                            }}
                                            className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-2 pr-10 text-sm transition-all ${
                                                sel
                                                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-950 dark:text-primary-300"
                                                    : "dark:hover:bg-secondary-750 border-secondary-300 text-secondary-700 hover:bg-secondary-50 dark:border-secondary-700 dark:bg-secondary-800 dark:text-secondary-300 bg-white"
                                            } ${!isEditing ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {sel && (
                                                    <Check
                                                        size={16}
                                                        className="flex-shrink-0"
                                                    />
                                                )}
                                                <span className="truncate break-words">{label}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="text-secondary-600 text-sm">
                                                    {`${(servicesPricing && servicesPricing[identifier]) || def || ""} ${lang === "ar" ? "ج.م" : "EGP"}`}
                                                </div>
                                            </div>
                                        </div>

                                        {custom && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // remove custom service
                                                    try {
                                                        const idKey = s.id || s.en || identifier;
                                                        const updated = (pageCustomServices || []).filter((cs) => (cs.id || cs.en) !== idKey);
                                                        setPageCustomServices(updated);
                                                        const key =
                                                            selectedClientId === "global" || !selectedClientId
                                                                ? `quotations_custom_global`
                                                                : `quotations_custom_${selectedClientId}`;
                                                        localStorage.setItem(key, JSON.stringify(updated));
                                                        // also remove from selectedServices/pricing if present
                                                        if (selectedServices.includes(identifier)) {
                                                            setSelectedServices(selectedServices.filter((x) => x !== identifier));
                                                            const p = { ...servicesPricing };
                                                            delete p[identifier];
                                                            setServicesPricing(p);
                                                        }
                                                    } catch (err) {
                                                        // ignore
                                                    }
                                                }}
                                                className="text-secondary-500 hover:text-secondary-700 absolute top-3 right-2 rounded-md p-0.5"
                                                aria-label={t("remove") || "Remove"}
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder={t("custom_service_name") || "Service name"}
                                className="border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                            <input
                                type="number"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                placeholder={t("service_price") || "Price"}
                                className="border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-50 w-32 rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                            <button
                                onClick={addCustom}
                                disabled={!customName.trim() || !customPrice.toString().trim() || isNaN(Number(customPrice))}
                                className="btn-ghost flex items-center gap-2 px-3 py-2"
                            >
                                <Plus size={14} />
                                {t("add")}
                            </button>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <p className="text-secondary-600 text-sm">
                                    {t("selected_services_count") || "Selected"}: {selectedServices.length}
                                </p>
                                <p className="text-secondary-900 text-lg font-bold">
                                    {t("total") || "Total"}: {selectedServices.reduce((sum, id) => sum + Number(servicesPricing[id] || 0), 0)}{" "}
                                    {lang === "ar" ? "ج.م" : "EGP"}
                                </p>
                            </div>
                            <div>
                                {isEditing ? (
                                    <button
                                        onClick={createQuotation}
                                        disabled={selectedServices.length === 0}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <FileText size={16} />
                                        {t("create_quotation") || "Create Quotation"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setSelectedServices([]);
                                            setServicesPricing({});
                                        }}
                                        className="btn-ghost"
                                    >
                                        {t("create_another") || "Create another"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-4">{t("existing_quotations") || "Existing quotations"}</h3>
                        {quotations.length === 0 ? (
                            <p className="text-secondary-600">{t("no_quotations_yet") || "No quotations yet"}</p>
                        ) : (
                            <div className="space-y-3">
                                {quotations.map((q) => (
                                    <div
                                        key={q.id}
                                        className="border-secondary-300 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 flex items-start justify-between rounded-lg border p-3"
                                    >
                                        <div>
                                            <div className="text-secondary-600 dark:text-secondary-400 font-medium">
                                                {q.clientName} — {new Date(q.createdAt).toLocaleString()}
                                            </div>
                                            <div className="text-secondary-600 dark:text-secondary-400 mt-1 text-sm">
                                                {q.services.map((s) => `${s.name} (${s.price})`).join(", ")}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-secondary-600 dark:text-secondary-400 text-lg font-bold">
                                                {q.total} {lang === "ar" ? "ج.م" : "EGP"}
                                            </div>
                                            <button
                                                onClick={() => download(q)}
                                                className="btn-ghost"
                                            >
                                                <FileText size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin" />
                </div>
            )}
        </div>
    );
};

export default QuotationsPage;
