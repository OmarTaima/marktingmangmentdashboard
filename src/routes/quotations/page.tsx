import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useLang } from "@/hooks/useLang";
import { useClients, useQuotations } from "@/hooks/queries";
import type { Client } from "@/api/interfaces/clientinterface";
import type { Quotation } from "@/api/requests/quotationsService";
import CreateQuotation from "./CreateQuotation";
import CustomQuotation from "./CustomQuotation";
import PreviewQuotation from "./PreviewQuotation";

type View = "list" | "create" | "preview" | "custom";

const QuotationsPage = () => {
    const { t } = useLang();

    const [currentView, setCurrentView] = useState<View>("list");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
    const [customCreateName, setCustomCreateName] = useState<string | null>(null);

    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: allQuotationsResponse } = useQuotations({ page: 1, limit: 1000 });

    const allQuotations: any[] = Array.isArray(allQuotationsResponse)
        ? allQuotationsResponse
        : allQuotationsResponse?.data && Array.isArray(allQuotationsResponse.data)
          ? allQuotationsResponse.data
          : [];

    const handleCreateQuotation = (client: Client) => {
        setSelectedClient(client);
        setEditingQuotation(null);
        setCurrentView("create");
    };

    const handleShowQuotations = (client: Client) => {
        setSelectedClient(client);
        setCurrentView("preview");
    };

    const handleCreateCustomQuotation = () => {
        setSelectedClient({ business: { businessName: t("custom_quotation") || "Custom Quotation" } } as Client);
        setEditingQuotation(null);
        setCurrentView("create");
    };

    const handleBack = () => {
        setCurrentView("list");
        setSelectedClient(null);
        setEditingQuotation(null);
    };

    const handleEditQuotation = (quotation: Quotation) => {
        setEditingQuotation(quotation);
        setCurrentView("create");
    };

    // Group custom quotations (those without clientId) by their clientName/customName
    const customQuotationsByName: { name: string; quotations: any[] }[] = (() => {
        const map = new Map<string, { name: string; quotations: any[] }>();
        allQuotations.forEach((q: any) => {
            if (!q) return;
            const hasClientId = q.clientId || q.client;
            if (hasClientId) return; // skip quotations attached to real clients

            const rawName = (q.clientName || q.customName || q.customClientName || "") as string;
            const displayName = rawName.trim() || t("unnamed_custom_quotation") || "Unnamed";
            const key = displayName.trim().toLowerCase();

            if (!map.has(key)) map.set(key, { name: displayName, quotations: [] });
            map.get(key)!.quotations.push(q);
        });

        return Array.from(map.values());
    })();

    // Build a map of quotation counts per client id (for quotations that reference a client)
    const quotationsCountByClientId: Record<string, number> = (() => {
        const counts: Record<string, number> = {};
        allQuotations.forEach((q: any) => {
            if (!q) return;
            // Determine client id from different shapes
            const cid = q.clientId || (q.client && (q.client._id || q.client.id));
            if (!cid) return;
            const key = String(cid);
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    })();

    // Combine clients and custom groups into a single list and sort by name so they show together
    type CombinedItem =
        | { type: "client"; id: string; name: string; client: Client; quotationCount: number }
        | { type: "custom"; id: string; name: string; quotations: any[] };

    const combinedItems: CombinedItem[] = [];

    // add clients
    clients.forEach((client) => {
        const id = (client as any).id || (client as any)._id || "";
        const name = client.business?.businessName || client.personal?.fullName || t("unnamed_client") || "Unnamed";
        const count = quotationsCountByClientId[String(id)] || 0;
        combinedItems.push({ type: "client", id: String(id), name, client, quotationCount: count });
    });

    // add custom groups
    customQuotationsByName.forEach((g) => {
        combinedItems.push({ type: "custom", id: `custom-${g.name}`, name: g.name, quotations: g.quotations });
    });

    // Sort alphabetically by name so clients and custom groups appear interleaved
    combinedItems.sort((a, b) => a.name.localeCompare(b.name));

    // Render Create View
    if (currentView === "create" && selectedClient) {
        const clientId = (selectedClient as any).id || (selectedClient as any)._id || undefined;
        const clientName = selectedClient.business?.businessName || selectedClient.personal?.fullName || t("custom_quotation") || "Custom Quotation";

        return (
            <div className="px-4 sm:px-6">
                <CreateQuotation
                    clientId={clientId}
                    clientName={clientName}
                    onBack={handleBack}
                    onSuccess={(newClientId?: string, newClientName?: string) => {
                        // If API returned clientId, find corresponding client and open preview for it
                        if (newClientId) {
                            const found = clients.find(
                                (c: any) => String(c.id) === String(newClientId) || String((c as any)._id) === String(newClientId),
                            );
                            if (found) return handleShowQuotations(found);

                            // If client not in list (e.g. recently created elsewhere), create a minimal stub and open preview
                            const stub = { id: newClientId, business: { businessName: newClientName || "" } } as Client;
                            return handleShowQuotations(stub);
                        }

                        // If we have a client name (custom quotation), create a stub to open preview grouped by name
                        if (!newClientId && newClientName) {
                            const nameStub = { id: `custom-${Date.now()}`, business: { businessName: newClientName } } as Client;
                            return handleShowQuotations(nameStub);
                        }

                        // fallback: re-open preview for the currently selected client (if any)
                        if (selectedClient) return handleShowQuotations(selectedClient);

                        // last resort: go back to list
                        setCurrentView("list");
                    }}
                    editQuotation={editingQuotation || undefined}
                />
            </div>
        );
    }

    // Render Custom Create View (for grouped custom quotation names)
    if (currentView === "custom" && customCreateName) {
        return (
            <div className="px-4 sm:px-6">
                <CustomQuotation
                    clientName={customCreateName}
                    onBack={handleBack}
                    onSuccess={(newClientId?: string, newClientName?: string) => {
                        if (newClientId) {
                            const found = clients.find(
                                (c: any) => String(c.id) === String(newClientId) || String((c as any)._id) === String(newClientId),
                            );
                            if (found) return handleShowQuotations(found);

                            const stub = { id: newClientId, business: { businessName: newClientName || "" } } as Client;
                            return handleShowQuotations(stub);
                        }

                        if (!newClientId && newClientName) {
                            const nameStub = { id: `custom-${Date.now()}`, business: { businessName: newClientName } } as Client;
                            return handleShowQuotations(nameStub);
                        }

                        if (selectedClient) return handleShowQuotations(selectedClient);
                        setCurrentView("list");
                    }}
                />
            </div>
        );
    }

    // Render Preview View
    if (currentView === "preview" && selectedClient) {
        const clientId = (selectedClient as any).id || (selectedClient as any)._id || undefined;
        const clientName = selectedClient.business?.businessName || selectedClient.personal?.fullName || "";

        return (
            <div className="px-4 sm:px-6">
                <PreviewQuotation
                    clientId={clientId}
                    clientName={clientName}
                    onBack={handleBack}
                    onCreateNew={() => setCurrentView("create")}
                    onEdit={handleEditQuotation}
                />
            </div>
        );
    }

    // Render List View (Client Selection)
    return (
        <div className="space-y-6 px-4 sm:px-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="title">{t("quotations") || "Quotations"}</h1>
                    <p className="text-light-600 dark:text-dark-400">{t("create_and_manage_quotations") || "Create and manage quotations"}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCreateCustomQuotation}
                        className="btn-primary"
                        title={t("create_global_quotation") || "Create Custom Quotation"}
                    >
                        {t("custom_quotation") || "Custom Quotation"}
                    </button>
                </div>
            </div>

            {/* Client Selection */}
            {clientsLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2
                        className="text-light-500 animate-spin"
                        size={32}
                    />
                </div>
            ) : (
                <>
                    {/* Combined grid of clients and custom quotation groups (sorted by name) */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {combinedItems.map((item) => {
                            if (item.type === "client") {
                                const client = item.client;
                                return (
                                    <div key={`client-${item.id}`} className="card flex flex-col">
                                        <h3 className="card-title text-lg">{item.name}</h3>
                                        <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{client.business?.category || ""}</p>
                                        <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{item.quotationCount} {t("quotations") || "quotations"}</p>
                                        <div className="mt-4 flex flex-col gap-2">
                                            <button onClick={() => handleCreateQuotation(client)} className="btn-primary w-full">
                                                {t("create_quotation") || "Create Quotation"}
                                            </button>
                                            <button onClick={() => handleShowQuotations(client)} className="btn-ghost w-full">
                                                {t("show_quotations") || "Show Quotations"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            }

                            // custom group
                            return (
                                <div key={item.id} className="card flex flex-col">
                                    <h3 className="card-title text-lg">{item.name}</h3>
                                    <p className="text-light-600 dark:text-dark-400 mt-1 text-sm">{item.quotations.length} {t("quotations") || "quotations"}</p>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <button
                                            onClick={() => {
                                                setCustomCreateName(item.name);
                                                setEditingQuotation(null);
                                                setCurrentView("custom");
                                            }}
                                            className="btn-primary w-full"
                                        >
                                            {t("create_quotation") || "Create Quotation"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedClient({ business: { businessName: item.name } } as Client);
                                                setCurrentView("preview");
                                            }}
                                            className="btn-ghost w-full"
                                        >
                                            {t("show_quotations") || "Show Quotations"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {combinedItems.length === 0 && (
                        <div className="card">
                            <div className="py-8 text-center">
                                <p className="text-light-600 dark:text-dark-400">{t("no_clients_found") || "No clients found"}</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default QuotationsPage;
