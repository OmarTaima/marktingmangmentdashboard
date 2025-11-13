import { useEffect, useState, useRef } from "react";
import { Plus, FileText, Loader2, Check, Trash2, Edit2 } from "lucide-react";
import LocalizedArrow from "@/components/LocalizedArrow";
import { useLang } from "@/hooks/useLang";

const QuotationsPage = () => {
    const { t, lang } = useLang();
    type ServiceDef = {
        id?: string;
        en?: string;
        ar?: string;
        price?: string | number;
        discount?: string | number;
        discountType?: string;
        description?: string;
        quantity?: string | number;
        name?: string;
        originalPrice?: string | number;
    };

    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>(localStorage.getItem("selectedClientId") || "");
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const [globalClientName, setGlobalClientName] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const isTransitioningRef = useRef<boolean>(false);

    const [servicesMaster, setServicesMaster] = useState<ServiceDef[]>([]);
    const [pageCustomServices, setPageCustomServices] = useState<ServiceDef[]>([]);

    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [servicesPricing, setServicesPricing] = useState<Record<string, string>>({});

    const [customName, setCustomName] = useState<string>("");
    const [customNameAr, setCustomNameAr] = useState<string>("");
    const [customPrice, setCustomPrice] = useState<string>("");
    const [customDiscount, setCustomDiscount] = useState<string>("");
    const [customDiscountType, setCustomDiscountType] = useState<string>("percentage");

    const [quotations, setQuotations] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState<boolean>(true);
    const [quotationNote, setQuotationNote] = useState<string>("");
    // quotation-level discount (percentage or fixed)
    const [discountValue, setDiscountValue] = useState<string>("");
    const [discountType, setDiscountType] = useState<string>("percentage");
    const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);

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
                setSelectedClient(list.find((c: any) => String(c.id) === String(selectedClientId)) || null);
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

    const handleSelectClient = (id: string | number) => {
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

    const idOf = (s: any) => (typeof s === "string" ? s : s.id || s.en || "");
    const labelOf = (s: any) => (typeof s === "string" ? s : lang === "ar" ? s.ar || s.en : s.en || s.ar);
    const priceOf = (s: any) => (typeof s === "string" ? "" : s.price || "");

    // compute final price for a service identifier after applying any service-level discount
    const finalPriceFor = (identifier: string) => {
        const found = combined.find((s: any) => idOf(s) === identifier || labelOf(s) === identifier);
        const base = Number((servicesPricing && servicesPricing[identifier]) || (found ? priceOf(found) : 0)) || 0;
        let svcDiscountAmount = 0;
        let svcDiscountType = "";
        if (found && found.discount) {
            const d = Number(found.discount || 0);
            svcDiscountType = found.discountType || "percentage";
            if (!isNaN(d) && d !== 0) {
                if (svcDiscountType === "percentage") svcDiscountAmount = (base * d) / 100;
                else svcDiscountAmount = d;
            }
        }
        return Math.max(0, base - svcDiscountAmount);
    };

    const toggleService = (identifier: string) => {
        if (selectedServices.includes(identifier)) {
            setSelectedServices(selectedServices.filter((x) => x !== identifier));
            const p = { ...servicesPricing };
            delete p[identifier];
            setServicesPricing(p);
            return;
        }
        const found = combined.find((s: any) => idOf(s) === identifier || labelOf(s) === identifier);
        const def = found ? priceOf(found) : "";
        setSelectedServices([...selectedServices, identifier]);
        setServicesPricing({ ...(servicesPricing || {}), [identifier]: def });
    };

    const addCustom = () => {
        const name = (customName || "").trim();
        const ar = (customNameAr || "").trim();
        const price = (customPrice || "").toString().trim();
        const disc = (customDiscount || "").toString().trim();
        const discType = customDiscountType || "percentage";
        if ((!name && !ar) || !price || isNaN(Number(price))) return;
        if (disc) {
            if (isNaN(Number(disc))) return;
            const dnum = Number(disc);
            if (discType === "percentage" && (dnum < 0 || dnum > 100)) return;
            if (discType === "fixed" && dnum < 0) return;
        }
        const item = { id: `qsvc_${Date.now()}`, en: name || ar, ar: ar || name, price, discount: disc || "", discountType: discType };
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
        setCustomNameAr("");
        setCustomPrice("");
        setCustomDiscount("");
        setCustomDiscountType("percentage");
    };

    const calculateDiscount = (subtotal: number, type = discountType, valRaw = discountValue) => {
        const val = Number(valRaw || 0);
        if (!val || val === 0) return 0;
        if (type === "percentage") {
            return (subtotal * val) / 100;
        }
        // fixed amount: don't exceed subtotal
        return Math.min(subtotal, val);
    };

    const createQuotation = () => {
        const services = selectedServices.map((identifier: string) => {
            const found = combined.find((s: any) => idOf(s) === identifier || labelOf(s) === identifier);
            const name = found ? labelOf(found) : identifier;
            // base price is either the user-entered pricing override or the master/custom price
            const basePrice = Number(servicesPricing[identifier] || (found ? priceOf(found) : 0));
            // apply service-level discount if present on the service definition
            let svcDiscountAmount = 0;
            let svcDiscountType = "";
            if (found && found.discount) {
                const d = Number(found.discount || 0);
                svcDiscountType = found.discountType || "percentage";
                if (!isNaN(d) && d !== 0) {
                    if (svcDiscountType === "percentage") svcDiscountAmount = (basePrice * d) / 100;
                    else svcDiscountAmount = d;
                }
            }
            const finalPrice = Math.max(0, basePrice - svcDiscountAmount);
            return {
                id: identifier,
                name,
                description: found && found.description ? found.description : "",
                originalPrice: basePrice,
                discountAmount: svcDiscountAmount,
                discountType: svcDiscountType,
                price: finalPrice,
            };
        });
        const subtotal = services.reduce((a, b) => a + Number(b.price || 0), 0);
        const discountAmount = calculateDiscount(subtotal, discountType, discountValue);
        const total = subtotal - discountAmount;
        const clientIdKey = selectedClientId === "global" || !selectedClientId ? "global" : selectedClientId;
        const clientName =
            selectedClientId === "global"
                ? globalClientName || t("global_quotation") || "Global Quotation"
                : selectedClient?.business?.businessName || "";
        const q = {
            id: editingQuotationId || `quotation_${Date.now()}`,
            createdAt: new Date().toISOString(),
            clientId: clientIdKey,
            clientName,
            services,
            subtotal,
            discountValue: discountValue || "0",
            discountType: discountType || "percentage",
            discountAmount,
            total,
            note: quotationNote || "",
        };

        let updated;
        if (editingQuotationId) {
            updated = quotations.map((qt) => (qt.id === editingQuotationId ? q : qt));
        } else {
            updated = [...(quotations || []), q];
        }
        setQuotations(updated);
        try {
            const storageKey = clientIdKey === "global" ? `quotations_global` : `quotations_${clientIdKey}`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {}
        setIsEditing(false);
        setEditingQuotationId(null);
    };

    const editQuotation = (q: any) => {
        setEditingQuotationId(q.id);
        setSelectedServices(q.services.map((s: any) => s.id));
        const pricing: Record<string, string> = {};
        q.services.forEach((s: any) => {
            pricing[s.id] = String(typeof s.originalPrice !== "undefined" ? s.originalPrice : s.price);
        });
        setServicesPricing(pricing);
        setQuotationNote(q.note || "");
        setDiscountValue(q.discountValue || "");
        setDiscountType(q.discountType || "percentage");
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setEditingQuotationId(null);
        setIsEditing(false);
        setSelectedServices([]);
        setServicesPricing({});
        setQuotationNote("");
        setDiscountValue("");
        setDiscountType("percentage");
    };

    const deleteQuotation = (qId: string) => {
        if (!confirm(t("confirm_delete_quotation") || "Delete this quotation?")) return;
        const updated = quotations.filter((q) => q.id !== qId);
        setQuotations(updated);
        const clientIdKey = selectedClientId === "global" || !selectedClientId ? "global" : selectedClientId;
        try {
            const storageKey = clientIdKey === "global" ? `quotations_global` : `quotations_${clientIdKey}`;
            localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (e) {}
    };

    const download = (q: any) => {
        const lines = [`Quotation: ${q.id}`, `Client: ${q.clientName}`, `Date: ${new Date(q.createdAt).toLocaleString()}`, "", "Services:"];
        q.services.forEach((s: any) => lines.push(`${s.name} - ${s.price}`));
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
                    <p className="text-light-600 dark:text-dark-400">{t("create_and_manage_quotations") || "Create and manage quotations"}</p>
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
                            <h2 className="text-light-900 dark:text-dark-50 mb-4 text-lg font-semibold">
                                {t("select_a_client") || "Select a client"}
                            </h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {clients.map((c) => (
                                    <div
                                        key={c.id}
                                        className="card flex flex-col"
                                    >
                                        <h3 className="card-title text-lg">{c.business?.businessName || t("unnamed_client")}</h3>
                                        <p className="text-light-600 mt-1 text-sm">{c.business?.category}</p>
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
                                <p className="text-light-600">{t("no_clients_found")}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedClient && !isLoading && (
                <>
                    <div className="card bg-dark-50 dark:bg-dark-800/50">
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
                                <h2 className="text-light-900 dark:text-dark-50 text-xl font-bold">{selectedClient.business?.businessName}</h2>
                                <p className="text-light-600 dark:text-dark-50 text-sm">{selectedClient.business?.category}</p>
                            </div>
                        </div>
                    </div>

                    {selectedClientId === "global" && (
                        <div className="card">
                            <label className="text-light-600 dark:bg-dark-900 dark:text-dark-50 text-md mb-2 font-medium">
                                {t("global_client_name") || "Quotation Name (optional)"}
                            </label>
                            <input
                                value={globalClientName}
                                onChange={(e) => setGlobalClientName(e.target.value)}
                                placeholder={t("quotation_name_placeholder") || "e.g., Quote for Prospect"}
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    <div className="card">
                        <h3 className="card-title mb-4">{t("select_services") || "Select services"}</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {combined.map((s: any) => {
                                const identifier = idOf(s) || labelOf(s);
                                const label = labelOf(s);
                                const sel = selectedServices.includes(identifier);
                                const custom = (pageCustomServices || []).some((cs) => (cs.id || cs.en) === (s.id || s.en));
                                const qty = typeof s === "string" ? "" : s.quantity || "";
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
                                                    ? "border-light-500 bg-light-500 dark:bg-secdark-700 dark:text-dark-50 text-white"
                                                    : "border-light-600 text-light-900 hover:bg-light-50 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 bg-white"
                                            } ${!isEditing ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {sel && (
                                                    <Check
                                                        size={16}
                                                        className="flex-shrink-0"
                                                    />
                                                )}
                                                <div>
                                                    <span className="truncate break-words">{label}</span>
                                                    {typeof s !== "string" && s.description ? (
                                                        <div className="text-light-600 dark:text-dark-400 text-xs">{s.description}</div>
                                                    ) : null}
                                                    {qty ? (
                                                        <div className="text-light-600 dark:text-dark-400 text-xs">{`${t("quantity") || "Qty"}: ${qty}`}</div>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="text-light-600 dark:text-dark-500 text-sm">
                                                    {`${finalPriceFor(identifier) || ""} ${lang === "ar" ? "ج.م" : "EGP"}`}
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
                                                className="text-dark-500 hover:text-dark-700 absolute top-3 right-2 rounded-md p-0.5"
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
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                            <input
                                type="text"
                                value={customNameAr}
                                onChange={(e) => setCustomNameAr(e.target.value)}
                                placeholder={t("custom_service_name_ar") || "اسم الخدمة (بالعربية)"}
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                            <input
                                type="number"
                                value={customPrice}
                                onChange={(e) => setCustomPrice(e.target.value)}
                                placeholder={t("service_price") || "Price"}
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-32 rounded-lg border bg-transparent px-3 py-2 text-sm"
                            />
                            <select
                                value={customDiscountType}
                                onChange={(e) => setCustomDiscountType(e.target.value)}
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-28 appearance-none rounded-lg border bg-transparent px-2 py-2 text-sm"
                                style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                            >
                                <option
                                    value="percentage"
                                    className="text-light-900 dark:text-dark-50 dark:bg-dark-800 bg-white"
                                >
                                    {t("percentage") || "%"}
                                </option>
                                <option
                                    value="fixed"
                                    className="text-light-900 dark:text-dark-50 dark:bg-dark-800 bg-white"
                                >
                                    {t("fixed") || "Fixed"}
                                </option>
                            </select>
                            <input
                                type="number"
                                value={customDiscount}
                                onChange={(e) => setCustomDiscount(e.target.value)}
                                placeholder={t("discount_optional") || "Discount"}
                                className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-24 rounded-lg border bg-transparent px-2 py-2 text-sm"
                            />
                            <button
                                onClick={addCustom}
                                disabled={
                                    (!customName.trim() && !customNameAr.trim()) || !customPrice.toString().trim() || isNaN(Number(customPrice))
                                }
                                className="btn-ghost flex items-center gap-2 px-3 py-2"
                            >
                                <Plus size={14} />
                                {t("add")}
                            </button>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div>
                                <p className="text-light-600 dark:text-dark-50 text-sm">
                                    {t("selected_services_count") || "Selected"}: {selectedServices.length}
                                </p>
                                <p className="text-light-900 dark:text-dark-50 text-base">
                                    {t("subtotal") || "Subtotal"}: {selectedServices.reduce((sum, id) => sum + Number(finalPriceFor(id) || 0), 0)}{" "}
                                    {lang === "ar" ? "ج.م" : "EGP"}
                                </p>
                                {discountValue && Number(discountValue) > 0 && (
                                    <p className="text-light-600 dark:text-dark-400 text-sm">
                                        {t("discount") || "Discount"}:{" "}
                                        {discountType === "percentage" ? `${discountValue}%` : `${discountValue} ${lang === "ar" ? "ج.م" : "EGP"}`} (-
                                        {calculateDiscount(
                                            selectedServices.reduce((sum, id) => sum + Number(finalPriceFor(id) || 0), 0),
                                            discountType,
                                            discountValue,
                                        )}{" "}
                                        {lang === "ar" ? "ج.م" : "EGP"})
                                    </p>
                                )}
                                <p className="text-light-900 dark:text-dark-50 text-lg font-bold">
                                    {t("total") || "Total"}:{" "}
                                    {selectedServices.reduce((sum, id) => sum + Number(finalPriceFor(id) || 0), 0) -
                                        calculateDiscount(
                                            selectedServices.reduce((sum, id) => sum + Number(finalPriceFor(id) || 0), 0),
                                            discountType,
                                            discountValue,
                                        )}{" "}
                                    {lang === "ar" ? "ج.م" : "EGP"}
                                </p>
                            </div>
                            <div>
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={createQuotation}
                                            disabled={selectedServices.length === 0}
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            <FileText size={16} />
                                            {editingQuotationId
                                                ? t("update_quotation") || "Update Quotation"
                                                : t("create_quotation") || "Create Quotation"}
                                        </button>
                                        {editingQuotationId && (
                                            <button
                                                onClick={cancelEdit}
                                                className="btn-ghost"
                                                type="button"
                                            >
                                                {t("cancel") || "Cancel"}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setSelectedServices([]);
                                            setServicesPricing({});
                                            setQuotationNote("");
                                            setDiscountValue("");
                                            setDiscountType("percentage");
                                        }}
                                        className="btn-ghost"
                                    >
                                        {t("create_another") || "Create another"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                                    {t("quotation_note") || "Note (optional)"}
                                </label>
                                <textarea
                                    value={quotationNote}
                                    onChange={(e) => setQuotationNote(e.target.value)}
                                    placeholder={t("quotation_note_placeholder") || "Add any additional notes or comments..."}
                                    rows={3}
                                    className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:ring-0 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">
                                        {t("discount_type") || "Discount Type"}
                                    </label>
                                    <select
                                        value={discountType}
                                        onChange={(e) => setDiscountType(e.target.value)}
                                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 focus:border-light-500 w-full appearance-none rounded-lg border bg-transparent px-3 py-2 text-sm"
                                        style={{ WebkitAppearance: "none", MozAppearance: "none" }}
                                    >
                                        <option
                                            value="percentage"
                                            className="text-light-900 dark:text-dark-50 dark:bg-dark-800 bg-white"
                                        >
                                            {t("percentage") || "%"}
                                        </option>
                                        <option
                                            value="fixed"
                                            className="text-light-900 dark:text-dark-50 dark:bg-dark-800 bg-white"
                                        >
                                            {t("fixed") || "Fixed"}
                                        </option>
                                    </select>

                                    <label className="text-dark-700 dark:text-dark-400 mt-2 mb-2 block text-sm">
                                        {t("discount_value") || "Discount Value"}
                                    </label>
                                    <input
                                        type="number"
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        placeholder={discountType === "percentage" ? "0-100" : t("amount") || "Amount"}
                                        min="0"
                                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 placeholder:text-light-600 dark:placeholder:text-dark-400 w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:ring-0 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h3 className="card-title mb-4">{t("existing_quotations") || "Existing quotations"}</h3>
                        {quotations.length === 0 ? (
                            <p className="text-light-600">{t("no_quotations_yet") || "No quotations yet"}</p>
                        ) : (
                            <div className="space-y-3">
                                {quotations.map((q) => (
                                    <div
                                        key={q.id}
                                        className="border-light-600 dark:border-dark-700 bg-dark-50 dark:bg-dark-800/50 flex items-start justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex-1">
                                            <div className="text-light-600 dark:text-dark-400 font-medium">
                                                {q.clientName} — {new Date(q.createdAt).toLocaleString()}
                                            </div>
                                            <div className="text-light-600 dark:text-dark-400 mt-1 text-sm">
                                                {q.services.map((s: any) => `${s.name} (${s.price})`).join(", ")}
                                            </div>
                                            {q.note && (
                                                <div className="text-light-500 dark:text-dark-500 mt-2 text-xs italic">
                                                    {t("note") || "Note"}: {q.note}
                                                </div>
                                            )}
                                            <div className="mt-2 text-sm">
                                                {q.discountValue && Number(q.discountValue) > 0 && (
                                                    <div className="text-light-600 dark:text-dark-400">
                                                        {t("discount") || "Discount"}:{" "}
                                                        {q.discountType === "percentage"
                                                            ? `${q.discountValue}%`
                                                            : `${q.discountValue} ${lang === "ar" ? "ج.م" : "EGP"}`}{" "}
                                                        (-{q.discountAmount || 0} {lang === "ar" ? "ج.م" : "EGP"})
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-light-600 dark:text-dark-400 text-lg font-bold">
                                                {q.total} {lang === "ar" ? "ج.م" : "EGP"}
                                            </div>
                                            <button
                                                onClick={() => editQuotation(q)}
                                                className="btn-ghost"
                                                title={t("edit") || "Edit"}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => download(q)}
                                                className="btn-ghost"
                                                title={t("download") || "Download"}
                                            >
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteQuotation(q.id)}
                                                className="btn-ghost text-danger-500"
                                                title={t("delete") || "Delete"}
                                            >
                                                <Trash2 size={16} />
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
