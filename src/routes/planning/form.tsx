import React, { useState, useEffect, useMemo } from "react";
import { Save, Plus, Trash2, Edit3, Loader2, Check, X } from "lucide-react";
import { showAlert } from "@/utils/swal";
import { useCreateCampaign, useUpdateCampaign } from "@/hooks/queries";
import { getCampaignById } from "@/api/requests/planService";
import { getPackages, Package as PackageType } from "@/api/requests/packagesService";
// Using MUI DatePicker for plan-level dates
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useTheme as useAppTheme } from "@/hooks/useTheme";
import { useLang } from "@/hooks/useLang";
import { useNavigate } from "react-router-dom";
import { useClient } from "@/hooks/queries/useClientsQuery";
import { useServices, useItems } from "@/hooks/queries";
import format from "date-fns/format";

type Bilingual = { id: string; en?: string; ar?: string; enDesc?: string; arDesc?: string };

type PlanData = {
    objective: string;
    strategy: string;
    budget: string;
    timelineStart: string;
    timelineEnd: string;
    objectiveEn?: string;
    objectiveAr?: string;
};

type Props = { selectedClientId?: string; editCampaignId?: string; onSaved?: () => void; viewOnly?: boolean };

const PlanningForm: React.FC<Props> = ({ selectedClientId, editCampaignId, onSaved, viewOnly }) => {
    const createCampaignMutation = useCreateCampaign();
    const updateCampaignMutation = useUpdateCampaign();
    const navigate = useNavigate();
    const [campaignLoading, setCampaignLoading] = useState<boolean>(false);
    const [planData, setPlanData] = useState<PlanData>({
        objective: "",
        strategy: "",
        budget: "",
        timelineStart: "",
        timelineEnd: "",
        objectiveEn: "",
        objectiveAr: "",
    });

    const [objectives, setObjectives] = useState<Bilingual[]>([]);
    const [objectiveInputEn, setObjectiveInputEn] = useState("");
    const [objectiveInputAr, setObjectiveInputAr] = useState("");
    const [objectiveDescEn, setObjectiveDescEn] = useState("");
    const [objectiveDescAr, setObjectiveDescAr] = useState("");
    const [editingObjectiveIndex, setEditingObjectiveIndex] = useState(-1);

    const [isEditing, setIsEditing] = useState<boolean>(() => !(viewOnly ?? false));

    // Client-related selections: segments, competitors, branches, swot
    const { data: clientData } = useClient(selectedClientId || "", !!selectedClientId);
    const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
    const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [selectedSwot, setSelectedSwot] = useState<{
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    }>({ strengths: [], weaknesses: [], opportunities: [], threats: [] });

    // Packages for budget quick-select (support multiple selection)
    const [packages, setPackages] = useState<PackageType[]>([]);
    const [packagesLoading, setPackagesLoading] = useState(false);
    const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
    const [packageSetFromServer, setPackageSetFromServer] = useState(false);
    // Pricing fields (from quotation UI)
    const [customServices, setCustomServices] = useState<
        Array<{ id: string; en: string; ar?: string; price: number; discount?: number; discountType?: string }>
    >([]);
    const [customServiceName, setCustomServiceName] = useState<string>("");
    const [customNameAr, setCustomNameAr] = useState<string>("");
    const [customPrice, setCustomPrice] = useState<string>("");
    const [discountValue, setDiscountValue] = useState<string>("0");
    const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");

    // Load campaign for edit when editCampaignId provided
    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!editCampaignId) return;
            setCampaignLoading(true);
            try {
                const campRaw = await getCampaignById(editCampaignId);
                if (!mounted) return;
                // normalize responses that may be wrapped in { data: ... }
                const camp: any = campRaw && (campRaw as any).data ? (campRaw as any).data : campRaw;

                // Populate planData
                setPlanData({
                    objective: camp.description || "",
                    strategy: camp.strategy?.description || "",
                    budget: camp.strategy?.budget ? String(camp.strategy?.budget) : camp.budget ? String(camp.budget) : "",
                    timelineStart: camp.strategy?.timeline && camp.strategy.timeline[0] ? camp.strategy.timeline[0].timelineStart || "" : "",
                    timelineEnd: camp.strategy?.timeline && camp.strategy.timeline[0] ? camp.strategy.timeline[0].timelineEnd || "" : "",
                    objectiveEn: camp.strategy?.timeline && camp.strategy.timeline[0] ? camp.strategy.timeline[0].objectiveEn || "" : "",
                    objectiveAr: camp.strategy?.timeline && camp.strategy.timeline[0] ? camp.strategy.timeline[0].objectiveAr || "" : "",
                });

                // Populate objectives
                const rawObjs = camp.objectives || [];
                const objs: Bilingual[] = (Array.isArray(rawObjs) ? rawObjs : []).map((o: any, idx: number) => {
                    if (!o) return { id: `obj_${Date.now()}_${idx}`, en: "", ar: "" };
                    if (typeof o === "string") {
                        return { id: `obj_${Date.now()}_${idx}`, en: o, ar: o };
                    }
                    return {
                        id: `obj_${Date.now()}_${idx}`,
                        en: o.name || o.en || o.title || "",
                        ar: o.ar || o.nameAr || "",
                        enDesc: o.description || o.desc || o.enDesc || undefined,
                        arDesc: o.descriptionAr || o.descAr || o.arDesc || undefined,
                    };
                });
                setObjectives(objs);

                // Populate timelineItems (support older responses where timeline may be top-level)
                const rawTimeline = camp.strategy?.timeline || camp.timeline || [];
                const tItems = (Array.isArray(rawTimeline) ? rawTimeline : []).map((t: any, idx: number) => ({
                    id: `timeline_${Date.now()}_${idx}`,
                    start: t.timelineStart ? new Date(t.timelineStart) : null,
                    end: t.timelineEnd ? new Date(t.timelineEnd) : null,
                    objectiveEn: t.objectiveEn || t.objective || t.name || undefined,
                    objectiveAr: t.objectiveAr || undefined,
                    objectives: [] as Bilingual[],
                }));
                setTimelineItems(tItems);

                // Populate selection fields (segments, competitors, branches, swot)
                setSelectedSegments(Array.isArray(camp.segments) ? camp.segments.map((s: any) => (typeof s === "string" ? s : s._id || s.id)) : []);
                setSelectedBranches(Array.isArray(camp.branches) ? camp.branches.map((b: any) => (typeof b === "string" ? b : b._id || b.id)) : []);
                const sw = camp.swotAnalysis || camp.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };
                setSelectedSwot({
                    strengths: Array.isArray(sw.strengths) ? sw.strengths : [],
                    weaknesses: Array.isArray(sw.weaknesses) ? sw.weaknesses : [],
                    opportunities: Array.isArray(sw.opportunities) ? sw.opportunities : [],
                    threats: Array.isArray(sw.threats) ? sw.threats : [],
                });

                // If campaign references package id(s) or package objects, set them so UI reflects selection
                const pkgIdRaw = camp.strategy?.packageId || camp.strategy?.packageIds || camp.packageId || camp.packageIds;
                let pkgIds: string[] = [];
                if (pkgIdRaw) {
                    if (Array.isArray(pkgIdRaw)) pkgIds = pkgIdRaw.map((p: any) => (typeof p === "string" ? p : p._id || p.id));
                    else pkgIds = [typeof pkgIdRaw === "string" ? pkgIdRaw : pkgIdRaw._id || pkgIdRaw.id];
                }

                // support campaign shape where `packages` is an array of full package objects
                if ((!pkgIds || pkgIds.length === 0) && Array.isArray(camp.packages) && camp.packages.length > 0) {
                    pkgIds = camp.packages.map((p: any) => p?._id || p?.id).filter(Boolean as any);
                    // merge full package objects into local packages state so we can resolve prices
                    try {
                        setPackages((prev) => {
                            const existed = Array.isArray(prev) ? prev.slice() : [];
                            const toAdd = (camp.packages || []).filter(
                                (p: any) => !existed.some((e: any) => String(e._id) === String(p._id) || String(e.id) === String(p._id)),
                            );
                            return [...existed, ...toAdd];
                        });
                    } catch (err) {
                        // ignore
                    }
                }

                // support campaign shape where servicesPricing contains package references
                if ((!pkgIds || pkgIds.length === 0) && Array.isArray(camp.servicesPricing) && camp.servicesPricing.length > 0) {
                    const spIds = camp.servicesPricing
                        .map((s: any) => {
                            const p = s?.package;
                            if (!p) return null;
                            return typeof p === "string" ? p : p._id || p.id || null;
                        })
                        .filter(Boolean as any);
                    if (spIds.length > 0) pkgIds = spIds as string[];
                }

                if (pkgIds && pkgIds.length > 0) {
                    setSelectedPackageIds(pkgIds.filter(Boolean));
                    setPackageSetFromServer(true);
                }

                // Load custom services and discounts if present on campaign (top-level schema)
                const rawCustomServices = camp.customServices || camp.custom_services || [];
                const normalizedCustomServices = Array.isArray(rawCustomServices)
                    ? rawCustomServices.map((cs: any, idx: number) => {
                          if (!cs) return { id: `custom_${Date.now()}_${idx}`, en: "", price: 0 };
                          if (typeof cs === "string") return { id: cs, en: cs, price: 0 };
                          return {
                              id: cs.id || cs._id || `custom_${Date.now()}_${idx}`,
                              en: cs.en || cs.name || cs.ar || "",
                              ar: cs.ar || cs.nameAr || undefined,
                              price: Number(cs.price) || 0,
                          };
                      })
                    : [];
                setCustomServices(normalizedCustomServices);

                // Discount values
                if (typeof camp.discountValue !== "undefined") setDiscountValue(String(camp.discountValue ?? 0));
                if (typeof camp.discountType !== "undefined") setDiscountType(camp.discountType === "fixed" ? "fixed" : "percentage");

                // respect initial viewOnly flag: only enable editing if not view-only
                setIsEditing(!(viewOnly ?? false));
            } catch (e) {
                showAlert("Failed to load campaign for editing", "error");
            } finally {
                if (mounted) setCampaignLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editCampaignId]);

    // We intentionally do NOT auto-apply package prices into the budget field when
    // packages are selected. The budget input should remain under the user's control.
    // (Previously this effect would set `planData.budget` when packages were selected.)

    // Load available packages so user can pick one for budget quick-select
    useEffect(() => {
        let mounted = true;
        const loadPackages = async () => {
            setPackagesLoading(true);
            try {
                const res = await getPackages({ limit: 1000 });
                if (!mounted) return;
                // accept both API shapes: { data: [...] } and plain array
                if (Array.isArray(res?.data)) setPackages(res.data);
                else if (Array.isArray(res)) setPackages(res as any);
                else setPackages([]);
            } catch (e) {
                // ignore package load errors silently
            } finally {
                if (mounted) setPackagesLoading(false);
            }
        };
        loadPackages();
        return () => {
            mounted = false;
        };
    }, []);

    // Services (for filtering packages by service like quotations UI)
    const { data: servicesResponse, isLoading: servicesLoading } = useServices({ limit: 100 });
    const services = servicesResponse?.data || [];
    const { data: itemsResponse } = useItems({ limit: 1000 });
    const items = itemsResponse?.data || [];
    const servicesWithPackages = (services || []).filter((s: any) => s.packages && s.packages.length > 0);
    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

    useEffect(() => {
        if (!expandedServiceId && servicesWithPackages.length > 0) {
            setExpandedServiceId(servicesWithPackages[0]._id);
        }
    }, [servicesWithPackages]);

    const packagesToShow = (() => {
        if (expandedServiceId) {
            const svc = servicesWithPackages.find((s: any) => s._id === expandedServiceId);
            if (svc && Array.isArray(svc.packages) && svc.packages.length > 0) {
                // ensure selected packages are visible even if they belong to another service
                const base = svc.packages.slice();
                const missing = (selectedPackageIds || []).filter((id) => !base.some((p: any) => p._id === id || p.id === id));
                if (missing.length > 0 && Array.isArray(packages) && packages.length > 0) {
                    const extras = packages.filter((p) => missing.includes(p._id));
                    return [...base, ...extras];
                }
                return base;
            }
        }

        // default: show all packages, but make sure selected packages (if any) are included
        if (!packages || packages.length === 0) return [];
        const all = packages.slice();
        const missing = (selectedPackageIds || []).filter((id) => !all.some((p: any) => p._id === id || p.id === id));
        if (missing.length > 0) {
            const extras = packages.filter((p) => missing.includes(p._id));
            return [...all, ...extras];
        }
        return all;
    })();

    // Compute selected packages total and overall total combining manual budget input
    const packagesTotal = useMemo(() => {
        if (!packages || packages.length === 0 || !selectedPackageIds || selectedPackageIds.length === 0) return 0;
        return packages
            .filter((p) => selectedPackageIds.includes(p._id) || selectedPackageIds.includes((p as any).id))
            .reduce((s, p) => s + (Number((p as any).price) || 0), 0);
    }, [packages, selectedPackageIds]);

    const manualBudgetNum = Number(planData.budget) || 0;

    const totalBudget = useMemo(() => {
        // If the manual budget equals the packages total (e.g., auto-applied), don't double-count.
        const manualIsSameAsPackages = manualBudgetNum === packagesTotal && packagesTotal > 0;
        return packagesTotal + (manualIsSameAsPackages ? 0 : manualBudgetNum);
    }, [packagesTotal, manualBudgetNum]);

    // Timeline items (multiple chips)
    const [timelineItems, setTimelineItems] = useState<
        Array<{
            id: string;
            start: Date | null;
            end: Date | null;
            objectiveEn?: string;
            objectiveAr?: string;
            objectives: Bilingual[];
        }>
    >([]);

    // Inline add-timeline UI state (shows inputs after pressing Add timeline)
    const [showAddTimeline, setShowAddTimeline] = useState(true);
    const [newTimelineStart, setNewTimelineStart] = useState<Date | null>(null);
    const [newTimelineEnd, setNewTimelineEnd] = useState<Date | null>(null);
    const [newTimelineObjectiveEn, setNewTimelineObjectiveEn] = useState("");
    const [newTimelineObjectiveAr, setNewTimelineObjectiveAr] = useState("");

    // MUI theme sync with app theme (light/dark/system)
    const { theme: appTheme } = useAppTheme();
    const muiMode = useMemo(() => {
        if (appTheme === "system") {
            if (typeof window !== "undefined" && window.matchMedia) {
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            return "light";
        }
        return appTheme === "dark" ? "dark" : "light";
    }, [appTheme]);

    const muiTheme = useMemo(() => createTheme({ palette: { mode: muiMode } }), [muiMode]);

    const { lang } = useLang();

    const handleAddTimeline = () => {
        const start = newTimelineStart || null;
        const end = newTimelineEnd || null;
        const item = {
            id: `timeline_${Date.now()}`,
            start,
            end,
            objectiveEn: newTimelineObjectiveEn.trim() || undefined,
            objectiveAr: newTimelineObjectiveAr.trim() || undefined,
            objectives: [] as Bilingual[],
        };

        setTimelineItems((prev) => [...prev, item]);

        // reset inputs but keep the add form open so user can add multiple (like objectives)
        setNewTimelineStart(null);
        setNewTimelineEnd(null);
        setNewTimelineObjectiveEn("");
        setNewTimelineObjectiveAr("");
    };

    // Enter key handling for timeline inputs
    const handleTimelineEnter = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddTimeline();
        }
    };

    const removeTimeline = (id: string) => {
        setTimelineItems((prev) => prev.filter((t) => t.id !== id));
    };

    // Objectives handlers
    const handleAddObjective = () => {
        const en = (objectiveInputEn || "").trim();
        const ar = (objectiveInputAr || "").trim();
        const enDesc = (objectiveDescEn || "").trim();
        const arDesc = (objectiveDescAr || "").trim();
        const newObjective = {
            id: `obj_${Date.now()}`,
            en: en || ar,
            ar: ar || en,
            enDesc: enDesc || arDesc || undefined,
            arDesc: arDesc || enDesc || undefined,
        };
        setObjectives([...objectives, newObjective]);
        setObjectiveInputEn("");
        setObjectiveInputAr("");
        setObjectiveDescEn("");
        setObjectiveDescAr("");
    };

    // Enter key handling for objective inputs (add or save)
    const handleObjectiveEnter = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (editingObjectiveIndex === -1) {
                handleAddObjective();
            } else {
                saveEditObjective(editingObjectiveIndex);
            }
        }
    };

    const saveEditObjective = (idx: number) => {
        const en = (objectiveInputEn || "").trim();
        const ar = (objectiveInputAr || "").trim();
        const enDesc = (objectiveDescEn || "").trim();
        const arDesc = (objectiveDescAr || "").trim();
        const updated = objectives.slice();
        updated[idx] = {
            ...updated[idx],
            en: en || ar,
            ar: ar || en,
            enDesc: enDesc || arDesc || undefined,
            arDesc: arDesc || enDesc || undefined,
        };
        setObjectives(updated);
        setEditingObjectiveIndex(-1);
        setObjectiveInputEn("");
        setObjectiveInputAr("");
        setObjectiveDescEn("");
        setObjectiveDescAr("");
    };

    const removeObjective = (idx: number) => {
        setObjectives(objectives.filter((_, i) => i !== idx));
    };

    // Selection toggles for client-related entities
    const toggleSegment = (id: string) => {
        setSelectedSegments((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    const toggleCompetitor = (id: string) => {
        setSelectedCompetitors((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    const toggleBranch = (id: string) => {
        setSelectedBranches((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    const togglePackage = (id: string) => {
        setSelectedPackageIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
        setPackageSetFromServer(false);
    };

    const addCustomService = () => {
        const name = customServiceName.trim();
        const nameAr = customNameAr.trim();
        const price = parseFloat(customPrice);

        if (!name && !nameAr) return;
        if (isNaN(price) || price <= 0) return;

        const newCustom = { id: `custom_${Date.now()}`, en: name || nameAr, ar: nameAr || name, price };
        setCustomServices((s) => [...s, newCustom]);
        setCustomServiceName("");
        setCustomNameAr("");
        setCustomPrice("");
    };

    const removeCustomService = (id: string) => {
        setCustomServices((s) => s.filter((c) => c.id !== id));
    };

    const calculateSubtotal = () => {
        const pkgs = packages || [];
        const packagesTotalCalc = selectedPackageIds.reduce((sum, pkgId) => {
            const pkg = pkgs.find((p) => String(p._id) === String(pkgId) || String((p as any).id) === String(pkgId));
            return sum + (Number((pkg as any)?.price) || 0);
        }, 0);
        const customTotal = (customServices || []).reduce((s, c) => s + (Number(c.price) || 0), 0);
        return packagesTotalCalc + customTotal;
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        const disc = parseFloat(discountValue) || 0;
        let discountAmount = 0;
        if (discountType === "percentage") {
            discountAmount = (subtotal * disc) / 100;
        } else {
            discountAmount = Math.min(disc, subtotal);
        }
        return subtotal - discountAmount;
    };

    // control expanded item lists per package
    const [expandedPackageDetails, setExpandedPackageDetails] = useState<string[]>([]);
    const togglePackageDetails = (id: string) => {
        setExpandedPackageDetails((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    };

    type SwotCategory = "strengths" | "weaknesses" | "opportunities" | "threats";

    const toggleSwotItem = (category: SwotCategory, value: string) => {
        setSelectedSwot((prev) => {
            const arr = prev[category] || [];
            return {
                ...prev,
                [category]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
            } as any;
        });
    };

    // UI state: which client-selection panel is open (segments/competitors/branches/swot)
    const [openPanel, setOpenPanel] = useState<"segments" | "competitors" | "branches" | "swot" | null>(null);

    // Expanded details state for items (so we can show a details panel per item)
    const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

    const toggleDetail = (key: string) => {
        setExpandedDetails((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleItemKeyDown = (e: React.KeyboardEvent, cb: () => void) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cb();
        }
    };

    // Build a flat list of all swot items available on the client
    const allSwotItems = useMemo(() => {
        const sw = (clientData?.swot as any) || {};
        return {
            strengths: Array.isArray(sw.strengths) ? sw.strengths : [],
            weaknesses: Array.isArray(sw.weaknesses) ? sw.weaknesses : [],
            opportunities: Array.isArray(sw.opportunities) ? sw.opportunities : [],
            threats: Array.isArray(sw.threats) ? sw.threats : [],
        } as Record<string, string[]>;
    }, [clientData?.swot]);

    const allSwotSelected = useMemo(() => {
        // true if there is at least one swot item and every available swot item is selected
        const cats = Object.keys(allSwotItems) as Array<SwotCategory>;
        let total = 0;
        for (const cat of cats) {
            total += (allSwotItems[cat] || []).length;
        }
        if (total === 0) return false; // nothing to select

        return cats.every((cat) => {
            const items = allSwotItems[cat] || [];
            const selected = (selectedSwot as any)[cat] || [];
            return items.every((it) => selected.includes(it));
        });
    }, [allSwotItems, selectedSwot]);
    const handleBudgetChange = (value: string) => {
        setPlanData((p) => ({ ...p, budget: value }));
        // Intentionally do NOT clear selected packages when the user edits the budget field.
        // Packages remain selected independently from the manual budget input.
    };

    const handleSelectPackagesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const values = Array.from(e.target.selectedOptions)
            .map((o) => o.value)
            .filter(Boolean);
        setSelectedPackageIds(values);
        // mark that this selection came from user interaction
        setPackageSetFromServer(false);
    };

    // Save Plan Handler -> call API
    const handleSavePlan = async () => {
        if (!selectedClientId) {
            showAlert("Please select a client first", "warning");
            return;
        }

        try {
            const campaignObjectives = (objectives || []).map((obj) => ({
                name: obj.en || "",
                ar: obj.ar || "",
                description: obj.enDesc || undefined,
                descriptionAr: obj.arDesc || undefined,
            }));

            // If the user added timeline items, send them. If editing and user removed all items,
            // send an explicit empty array so the backend knows to clear the timeline.
            // For create flows with no timelineItems, we still send an empty array.
            const timelinePayload =
                timelineItems.length > 0
                    ? timelineItems.map((t) => ({
                          timelineStart: t.start ? t.start.toISOString() : undefined,
                          timelineEnd: t.end ? t.end.toISOString() : undefined,
                          objectiveEn: t.objectiveEn || undefined,
                          objectiveAr: t.objectiveAr || undefined,
                      }))
                    : [];

            const payload = {
                clientId: selectedClientId,
                description: planData.objective || planData.strategy || "Campaign Plan",
                objectives: campaignObjectives,
                branches: selectedBranches,
                competitors: selectedCompetitors,
                segments: selectedSegments,
                // send `swot` to match backend validation (some servers expect `swot` instead of `swotAnalysis`)
                // loading logic already supports both `swot` and `swotAnalysis` so this is safe.
                swot: selectedSwot,
                // pricing fields live at the top level to match backend schema
                packages: selectedPackageIds && selectedPackageIds.length > 0 ? selectedPackageIds : undefined,
                customServices: customServices && customServices.length > 0 ? customServices : undefined,
                discountValue: Number(discountValue) || 0,
                discountType: discountType || "percentage",
                strategy: {
                    timeline: timelinePayload,
                    description: planData.strategy || undefined,
                },
            };

            let savedCampaign: any = null;
            if (editCampaignId) {
                savedCampaign = await updateCampaignMutation.mutateAsync({ campaignId: editCampaignId, payload: payload as any });
                showAlert("Plan updated successfully!", "success");
            } else {
                savedCampaign = await createCampaignMutation.mutateAsync(payload as any);
                showAlert("Plan saved successfully!", "success");
            }
            setIsEditing(false);

            // Navigate to the preview page for this client and campaign
            try {
                const cid = selectedClientId;
                const campaignId = savedCampaign?._id || savedCampaign?.id || editCampaignId;
                if (cid) {
                    // Ensure preview Back returns to the strategies list page instead of back to the form
                    navigate("/strategies/preview", {
                        state: {
                            clientId: cid,
                            campaignId,
                            // don't include clientId in referrer so Back returns to the strategies list
                            referrer: { pathname: "/strategies" },
                        },
                    });
                }
            } catch (navErr) {
                // ignore navigation errors
            }
            // notify parent (modal) that save completed so it can close / refresh
            try {
                onSaved && onSaved();
            } catch (e) {
                // ignore
            }
        } catch (e: any) {
            showAlert(e?.response?.data?.message || "Failed to save plan.", "error");
        }
    };

    if (campaignLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2
                    className="text-light-500 animate-spin"
                    size={32}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Objectives */}
            <div className="card p-4">
                <h3 className="card-title mb-2">Campaign Objectives</h3>
                {isEditing && (
                    <div className="mb-3 grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col">
                            <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Objective (EN)</span>
                            <input
                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                placeholder="Objective (EN)"
                                value={objectiveInputEn}
                                onChange={(e) => setObjectiveInputEn(e.target.value)}
                                disabled={!isEditing}
                                onKeyDown={handleObjectiveEnter}
                                aria-label="Objective English"
                            />
                        </label>
                        <label className="flex flex-col">
                            <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Objective (AR)</span>
                            <input
                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                placeholder="Objective (AR)"
                                value={objectiveInputAr}
                                onChange={(e) => setObjectiveInputAr(e.target.value)}
                                disabled={!isEditing}
                                onKeyDown={handleObjectiveEnter}
                                aria-label="Objective Arabic"
                            />
                        </label>
                    </div>
                )}

                {isEditing && (
                    <div className="mb-3 grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col">
                            <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Description (EN)</span>
                            <input
                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                placeholder="Short description (EN)"
                                value={objectiveDescEn}
                                onChange={(e) => setObjectiveDescEn(e.target.value)}
                                disabled={!isEditing}
                                onKeyDown={handleObjectiveEnter}
                                aria-label="Objective description English"
                            />
                        </label>
                        <label className="flex flex-col">
                            <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Description (AR)</span>
                            <input
                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                placeholder="Short description (AR)"
                                value={objectiveDescAr}
                                onChange={(e) => setObjectiveDescAr(e.target.value)}
                                disabled={!isEditing}
                                onKeyDown={handleObjectiveEnter}
                                aria-label="Objective description Arabic"
                            />
                        </label>
                    </div>
                )}
                {isEditing && (
                    <>
                        <button
                            onClick={editingObjectiveIndex === -1 ? handleAddObjective : () => saveEditObjective(editingObjectiveIndex)}
                            className="btn-ghost mb-3 flex items-center gap-2"
                            type="button"
                            aria-label={editingObjectiveIndex === -1 ? "Add objective" : "Save objective"}
                        >
                            {editingObjectiveIndex === -1 ? <Plus size={14} /> : <Save size={14} />}
                            <span className="ml-1">{editingObjectiveIndex === -1 ? "Add objective" : "Save objective"}</span>
                        </button>
                    </>
                )}

                {/* Objectives cards */}
                {objectives.length > 0 && (
                    <div className="mb-3">
                        <div className="text-light-600 dark:text-dark-400 mb-2 text-sm">Added objectives</div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {objectives.map((obj, idx) => (
                                <div
                                    key={obj.id}
                                    className="group dark:from-dark-800 relative flex cursor-default flex-col overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:border-orange-700 dark:to-orange-900/20"
                                >
                                    {/* Decorative blur overlay */}
                                    <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-orange-400/20 blur-3xl" />

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col gap-3 p-5">
                                        {/* Title section */}
                                        <div className="text-center">
                                            <h4 className="text-lg font-bold text-orange-600 dark:text-orange-400">{obj.en || "No title"}</h4>
                                            <p className="mt-1 text-sm text-orange-500 dark:text-orange-300">{obj.ar}</p>
                                        </div>

                                        {/* Description section */}
                                        {(obj.enDesc || obj.arDesc) && (
                                            <div className="border-t border-orange-200 pt-3 dark:border-orange-700">
                                                {obj.enDesc && <p className="text-light-700 dark:text-dark-200 text-sm">{obj.enDesc}</p>}
                                                {obj.arDesc && <p className="text-light-600 dark:text-dark-300 mt-1 text-sm">{obj.arDesc}</p>}
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="mt-auto flex items-center justify-center gap-2 border-t border-orange-200 pt-3 dark:border-orange-700">
                                            <button
                                                onClick={() => {
                                                    setEditingObjectiveIndex(idx);
                                                    setObjectiveInputEn(obj.en || "");
                                                    setObjectiveInputAr(obj.ar || "");
                                                    setObjectiveDescEn(obj.enDesc || "");
                                                    setObjectiveDescAr(obj.arDesc || "");
                                                }}
                                                className="flex items-center gap-1 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-800/40"
                                                aria-label="Edit objective"
                                            >
                                                <Edit3 size={12} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => removeObjective(idx)}
                                                className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/40"
                                                aria-label="Remove objective"
                                            >
                                                <Trash2 size={12} />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Client selections: quick buttons to reveal segments/competitors/branches/swot */}
                <div className="card p-4">
                    <h3 className="card-title mb-2">Client Selections</h3>
                    <div className="mb-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenPanel((p) => (p === "segments" ? null : "segments"))}
                            className={`rounded-lg px-3 py-1 text-sm ${openPanel === "segments" ? "btn-primary" : "btn-ghost"}`}
                        >
                            Segments {selectedSegments.length > 0 ? `(${selectedSegments.length})` : ""}
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenPanel((p) => (p === "competitors" ? null : "competitors"))}
                            className={`rounded-lg px-3 py-1 text-sm ${openPanel === "competitors" ? "btn-primary" : "btn-ghost"}`}
                        >
                            Competitors {selectedCompetitors.length > 0 ? `(${selectedCompetitors.length})` : ""}
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenPanel((p) => (p === "branches" ? null : "branches"))}
                            className={`rounded-lg px-3 py-1 text-sm ${openPanel === "branches" ? "btn-primary" : "btn-ghost"}`}
                        >
                            Branches {selectedBranches.length > 0 ? `(${selectedBranches.length})` : ""}
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpenPanel((p) => (p === "swot" ? null : "swot"))}
                            className={`rounded-lg px-3 py-1 text-sm ${openPanel === "swot" ? "btn-primary" : "btn-ghost"}`}
                        >
                            SWOT {Object.values(selectedSwot).flat().length > 0 ? `(${Object.values(selectedSwot).flat().length})` : ""}
                        </button>
                    </div>

                    {openPanel === "segments" && (
                        <div className="space-y-4">
                            {(clientData?.segments || []).length === 0 && <div className="text-dark-500">No segments available</div>}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {(clientData?.segments || []).map((s: any) => {
                                    const sid = typeof s === "string" ? s : s._id || s.id;
                                    const label = typeof s === "string" ? s : s.name || s.title || "Unnamed segment";
                                    const checked = selectedSegments.includes(sid);
                                    return (
                                        <div
                                            key={sid}
                                            onClick={() => isEditing && toggleSegment(sid)}
                                            className={`group to-light-50 dark:from-dark-800 dark:to-dark-900 relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                                                checked
                                                    ? "border-primary-500 ring-primary-200 dark:ring-primary-900/50 ring-4"
                                                    : "border-light-300 dark:border-dark-600"
                                            }`}
                                        >
                                            {/* Decorative gradient overlay */}
                                            <div className="from-primary-400/20 to-primary-600/20 absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br blur-3xl"></div>

                                            {/* Selection indicator */}
                                            {checked && (
                                                <div className="bg-primary-500 absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110">
                                                    <Check
                                                        className="h-6 w-6 text-white"
                                                        strokeWidth={3}
                                                    />
                                                </div>
                                            )}

                                            {/* Segment Name */}
                                            <div className="relative z-10 mb-4 text-center">
                                                <h3 className="text-light-900 dark:text-dark-50 text-xl font-bold tracking-tight">{label}</h3>
                                                {s.description && <p className="text-light-600 dark:text-dark-400 mt-2 text-sm">{s.description}</p>}
                                            </div>

                                            {/* Segment Details */}
                                            <div className="border-light-200 dark:border-dark-700 dark:bg-dark-900/30 relative z-10 space-y-3 rounded-xl border-2 bg-white/50 p-4">
                                                {Array.isArray(s.ageRange) && s.ageRange.length > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Age Range
                                                        </span>
                                                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                            {s.ageRange.join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                                {Array.isArray(s.productName) && s.productName.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Products
                                                        </span>
                                                        <span className="text-light-900 dark:text-dark-50 text-sm">{s.productName.join(", ")}</span>
                                                    </div>
                                                )}
                                                {s.population !== undefined && s.population !== null && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Population
                                                        </span>
                                                        <span className="text-light-900 dark:text-dark-50 text-sm font-semibold">
                                                            {Array.isArray(s.population) ? s.population.join(", ") : s.population}
                                                        </span>
                                                    </div>
                                                )}
                                                {Array.isArray(s.gender) && s.gender.length > 0 && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Gender
                                                        </span>
                                                        <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                                                            {s.gender.join(", ")}
                                                        </span>
                                                    </div>
                                                )}
                                                {Array.isArray(s.area) && s.area.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Area
                                                        </span>
                                                        <span className="text-light-900 dark:text-dark-50 text-sm">{s.area.join(", ")}</span>
                                                    </div>
                                                )}
                                                {Array.isArray(s.governorate) && s.governorate.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Governorate
                                                        </span>
                                                        <span className="text-light-900 dark:text-dark-50 text-sm">{s.governorate.join(", ")}</span>
                                                    </div>
                                                )}
                                                {s.note && (
                                                    <div className="border-light-200 dark:border-dark-700 flex flex-col gap-1 border-t pt-2">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Note
                                                        </span>
                                                        <span className="text-light-900 dark:text-dark-50 text-sm">{s.note}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {openPanel === "competitors" && (
                        <div className="space-y-4">
                            {(clientData?.competitors || []).length === 0 && <div className="text-dark-500">No competitors available</div>}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {(clientData?.competitors || []).map((c: any) => {
                                    const cid = typeof c === "string" ? c : c._id || c.id;
                                    const label = typeof c === "string" ? c : c.name || "Unnamed competitor";
                                    const checked = selectedCompetitors.includes(cid);
                                    return (
                                        <div
                                            key={cid}
                                            onClick={() => isEditing && toggleCompetitor(cid)}
                                            className={`group to-light-50 dark:from-dark-800 dark:to-dark-900 relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                                                checked
                                                    ? "border-orange-500 ring-4 ring-orange-200 dark:ring-orange-900/50"
                                                    : "border-light-300 dark:border-dark-600"
                                            }`}
                                        >
                                            {/* Decorative gradient overlay */}
                                            <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 blur-3xl"></div>

                                            {/* Selection indicator */}
                                            {checked && (
                                                <div className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 shadow-lg transition-transform duration-300 group-hover:scale-110">
                                                    <Check
                                                        className="h-6 w-6 text-white"
                                                        strokeWidth={3}
                                                    />
                                                </div>
                                            )}

                                            {/* Competitor Name */}
                                            <div className="relative z-10 mb-4 text-center">
                                                <h3 className="text-light-900 dark:text-dark-50 text-xl font-bold tracking-tight">{label}</h3>
                                                {c.description && <p className="text-light-600 dark:text-dark-400 mt-2 text-sm">{c.description}</p>}
                                            </div>

                                            {/* SWOT Analysis */}
                                            <div className="border-light-200 dark:border-dark-700 dark:bg-dark-900/30 relative z-10 space-y-3 rounded-xl border-2 bg-white/50 p-4">
                                                {Array.isArray(c.swot_strengths) && c.swot_strengths.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-medium tracking-wider text-green-600 uppercase dark:text-green-400">
                                                            Strengths
                                                        </span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {c.swot_strengths.map((str: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                                >
                                                                    {str}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {Array.isArray(c.swot_weaknesses) && c.swot_weaknesses.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-medium tracking-wider text-red-600 uppercase dark:text-red-400">
                                                            Weaknesses
                                                        </span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {c.swot_weaknesses.map((wk: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                                                >
                                                                    {wk}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {Array.isArray(c.swot_opportunities) && c.swot_opportunities.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-medium tracking-wider text-blue-600 uppercase dark:text-blue-400">
                                                            Opportunities
                                                        </span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {c.swot_opportunities.map((op: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                                >
                                                                    {op}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {Array.isArray(c.swot_threats) && c.swot_threats.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-medium tracking-wider text-yellow-600 uppercase dark:text-yellow-400">
                                                            Threats
                                                        </span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {c.swot_threats.map((th: string, idx: number) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                                                >
                                                                    {th}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {Array.isArray(c.socialLinks) && c.socialLinks.length > 0 && (
                                                    <div className="border-light-200 dark:border-dark-700 flex flex-col gap-1 border-t pt-2">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Social Links
                                                        </span>
                                                        <div className="space-y-1">
                                                            {c.socialLinks.map((sl: any, idx: number) => (
                                                                <div
                                                                    key={idx}
                                                                    className="text-light-900 dark:text-dark-50 text-xs"
                                                                >
                                                                    {sl.platform || sl.name}: {sl.url || sl.value}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {openPanel === "branches" && (
                        <div className="space-y-4">
                            {(clientData?.branches || []).length === 0 && <div className="text-dark-500">No branches available</div>}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {(clientData?.branches || []).map((b: any) => {
                                    const bid = typeof b === "string" ? b : b._id || b.id;
                                    const label = typeof b === "string" ? b : b.name || b.address || "Unnamed branch";
                                    const checked = selectedBranches.includes(bid);
                                    return (
                                        <div
                                            key={bid}
                                            onClick={() => isEditing && toggleBranch(bid)}
                                            className={`group to-light-50 dark:from-dark-800 dark:to-dark-900 relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-white p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                                                checked
                                                    ? "border-teal-500 ring-4 ring-teal-200 dark:ring-teal-900/50"
                                                    : "border-light-300 dark:border-dark-600"
                                            }`}
                                        >
                                            {/* Decorative gradient overlay */}
                                            <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-teal-400/20 to-teal-600/20 blur-3xl"></div>

                                            {/* Selection indicator */}
                                            {checked && (
                                                <div className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-teal-500 shadow-lg transition-transform duration-300 group-hover:scale-110">
                                                    <Check
                                                        className="h-6 w-6 text-white"
                                                        strokeWidth={3}
                                                    />
                                                </div>
                                            )}

                                            {/* Branch Name */}
                                            <div className="relative z-10 mb-4 text-center">
                                                <h3 className="text-light-900 dark:text-dark-50 text-xl font-bold tracking-tight">{label}</h3>
                                            </div>

                                            {/* Branch Details */}
                                            <div className="border-light-200 dark:border-dark-700 dark:bg-dark-900/30 relative z-10 space-y-3 rounded-xl border-2 bg-white/50 p-4">
                                                {(b.mainOfficeAddress || b.address) && (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Address
                                                        </span>
                                                        <span className="text-light-900 dark:text-dark-50 text-sm">
                                                            {b.mainOfficeAddress || b.address}
                                                        </span>
                                                    </div>
                                                )}
                                                {b.city && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            City
                                                        </span>
                                                        <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                            {b.city}
                                                        </span>
                                                    </div>
                                                )}
                                                {b.phone && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Phone
                                                        </span>
                                                        <span className="text-light-900 dark:text-dark-50 text-sm font-semibold">{b.phone}</span>
                                                    </div>
                                                )}
                                                {b.notes && (
                                                    <div className="border-light-200 dark:border-dark-700 flex flex-col gap-1 border-t pt-2">
                                                        <span className="text-light-600 dark:text-dark-400 text-xs font-medium tracking-wider uppercase">
                                                            Notes
                                                        </span>
                                                        <span className="text-light-900 dark:text-dark-50 text-sm">{b.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {openPanel === "swot" && (
                        <div className="space-y-3">
                            <div className="mb-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!isEditing) return;
                                        if (allSwotSelected) {
                                            setSelectedSwot({ strengths: [], weaknesses: [], opportunities: [], threats: [] });
                                        } else {
                                            setSelectedSwot({
                                                strengths: allSwotItems.strengths.slice(),
                                                weaknesses: allSwotItems.weaknesses.slice(),
                                                opportunities: allSwotItems.opportunities.slice(),
                                                threats: allSwotItems.threats.slice(),
                                            });
                                        }
                                    }}
                                    disabled={!isEditing || Object.values(allSwotItems).flat().length === 0}
                                    className="btn-primary text-sm"
                                >
                                    {allSwotSelected ? "Unselect all SWOT" : "Select all SWOT"}
                                </button>
                            </div>
                            {(["strengths", "weaknesses", "opportunities", "threats"] as SwotCategory[]).map((cat) => {
                                const items = ((clientData?.swot as any)?.[cat] || []) as string[];
                                const allSelected = items.length > 0 && items.every((it) => (selectedSwot as any)[cat]?.includes(it));
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between">
                                            <div className="text-light-600 dark:text-dark-400 mb-2 text-sm font-medium">
                                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            </div>
                                            <div />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                            {items.length === 0 && <div className="text-dark-500">No items</div>}
                                            {items.map((item: any, i: number) => {
                                                const checked = (selectedSwot as any)[cat]?.includes(item);
                                                const key = `swot-${cat}-${i}`;
                                                return (
                                                    <div
                                                        key={`${cat}-${i}`}
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => handleItemKeyDown(e, () => toggleSwotItem(cat, item))}
                                                        onClick={() => isEditing && toggleSwotItem(cat, item)}
                                                        className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                                                            checked
                                                                ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                                : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                                        }`}
                                                    >
                                                        <div className="text-light-900 dark:text-dark-50 text-sm">{item}</div>
                                                        <div className="flex items-center gap-2">
                                                            {checked && <div className="text-light-500 text-xs">Selected</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Timeline */}

                {isEditing && (
                    <>
                        <div className="mt-3">
                            <div className="mb-2 flex items-center justify-between">
                                <div className="text-light-600 dark:text-dark-400 text-sm">Timeline</div>
                                {!showAddTimeline && (
                                    <button
                                        onClick={() => setShowAddTimeline(true)}
                                        className="btn-ghost flex items-center gap-2"
                                        type="button"
                                        aria-label="Show add timeline"
                                    >
                                        <Plus size={14} />
                                        <span className="ml-1">Add timeline</span>
                                    </button>
                                )}
                            </div>
                            {showAddTimeline && (
                                <MuiThemeProvider theme={muiTheme}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <div className="mb-3 grid gap-3 md:grid-cols-4">
                                            <label className="flex flex-col">
                                                <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Start</span>
                                                <DatePicker
                                                    value={newTimelineStart}
                                                    onChange={(date) => setNewTimelineStart(date)}
                                                    slotProps={{
                                                        textField: {
                                                            size: "small",
                                                            className: "w-full",
                                                            sx: {
                                                                "& .MuiInputBase-input": {
                                                                    padding: "8px 12px",
                                                                    fontSize: "0.875rem",
                                                                },
                                                                "& .MuiOutlinedInput-root": {
                                                                    borderRadius: "0.5rem",
                                                                },
                                                            },
                                                            inputProps: {
                                                                onKeyDown: (e: any) => handleTimelineEnter(e),
                                                            },
                                                        },
                                                    }}
                                                />
                                            </label>

                                            <label className="flex flex-col">
                                                <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">End</span>
                                                <DatePicker
                                                    value={newTimelineEnd}
                                                    onChange={(date) => setNewTimelineEnd(date)}
                                                    slotProps={{
                                                        textField: {
                                                            size: "small",
                                                            className: "w-full",
                                                            sx: {
                                                                "& .MuiInputBase-input": {
                                                                    padding: "8px 12px",
                                                                    fontSize: "0.875rem",
                                                                },
                                                                "& .MuiOutlinedInput-root": {
                                                                    borderRadius: "0.5rem",
                                                                },
                                                            },
                                                        },
                                                    }}
                                                />
                                            </label>

                                            <label className="flex flex-col">
                                                <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Objective (EN)</span>
                                                <input
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    type="text"
                                                    placeholder="Objective (EN)"
                                                    value={newTimelineObjectiveEn}
                                                    onChange={(e) => setNewTimelineObjectiveEn(e.target.value)}
                                                    onKeyDown={handleTimelineEnter}
                                                    aria-label="Timeline objective English"
                                                />
                                            </label>

                                            <label className="flex flex-col">
                                                <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Objective (AR)</span>
                                                <input
                                                    className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                                    type="text"
                                                    placeholder="Objective (AR)"
                                                    value={newTimelineObjectiveAr}
                                                    onChange={(e) => setNewTimelineObjectiveAr(e.target.value)}
                                                    onKeyDown={handleTimelineEnter}
                                                    aria-label="Timeline objective Arabic"
                                                />
                                            </label>

                                            <div className="flex gap-2 md:col-span-4">
                                                <button
                                                    onClick={handleAddTimeline}
                                                    className="btn-primary flex items-center gap-2"
                                                    type="button"
                                                >
                                                    <Plus size={14} /> Add
                                                </button>
                                            </div>
                                        </div>
                                    </LocalizationProvider>
                                </MuiThemeProvider>
                            )}
                        </div>
                    </>
                )}
                {/* Timeline cards list */}
                {timelineItems.length > 0 && (
                    <div className="mt-3">
                        <div className="text-light-600 dark:text-dark-400 mb-2 text-sm">Added timelines</div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {timelineItems.map((t) => (
                                <div
                                    key={t.id}
                                    className="group dark:from-dark-800 relative flex cursor-default flex-col overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:border-emerald-700 dark:to-emerald-900/20"
                                >
                                    {/* Decorative blur overlay */}
                                    <div className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col gap-3 p-5">
                                        {/* Date range header */}
                                        <div className="text-center">
                                            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 dark:bg-emerald-900/40">
                                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                    {t.start ? format(t.start, "yyyy-MM-dd") : "-"}
                                                </span>
                                                <span className="text-emerald-500">→</span>
                                                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                                    {t.end ? format(t.end, "yyyy-MM-dd") : "-"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Objectives section */}
                                        <div className="border-t border-emerald-200 pt-3 dark:border-emerald-700">
                                            <div className="mb-1 text-xs font-semibold text-emerald-600 uppercase dark:text-emerald-400">
                                                Objective
                                            </div>
                                            {t.objectiveEn && <p className="text-light-700 dark:text-dark-200 text-sm">{t.objectiveEn}</p>}
                                            {t.objectiveAr && <p className="text-light-600 dark:text-dark-300 mt-1 text-sm">{t.objectiveAr}</p>}
                                            {!t.objectiveEn && !t.objectiveAr && (
                                                <p className="text-light-500 dark:text-dark-400 text-sm">No objective</p>
                                            )}
                                        </div>

                                        {/* Action button */}
                                        <div className="mt-auto flex items-center justify-center border-t border-emerald-200 pt-3 dark:border-emerald-700">
                                            <button
                                                onClick={() => removeTimeline(t.id)}
                                                className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/40"
                                                aria-label="Remove timeline"
                                            >
                                                <Trash2 size={12} />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="card p-4">
                    <h3 className="card-title mb-2">Campaign Details</h3>

                    <div className="mb-3">
                        <h4 className="text-light-900 dark:text-dark-50 mb-3 font-semibold">Pricing</h4>

                        {/* Packages selection (existing packages list) */}
                        <div className="mb-4">
                            {servicesWithPackages.length > 0 && (
                                <div className="mb-4 flex gap-2 overflow-auto">
                                    {servicesWithPackages.map((service: any) => {
                                        const selectedCount = (service.packages ?? []).filter((pkg: any) =>
                                            selectedPackageIds.includes(pkg._id),
                                        ).length;
                                        const isActive = expandedServiceId === service._id;
                                        return (
                                            <button
                                                key={service._id}
                                                onClick={() => setExpandedServiceId(service._id)}
                                                className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-shadow ${
                                                    isActive
                                                        ? "bg-light-500 dark:bg-secdark-700 text-white"
                                                        : "text-light-900 dark:bg-dark-800 dark:text-dark-50 border bg-white"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{lang === "ar" ? service.ar : service.en}</span>
                                                    <span className="bg-light-600 rounded-full px-2 py-0.5 text-xs text-white">
                                                        {service.packages?.length ?? 0}
                                                    </span>
                                                    {selectedCount > 0 && <span className="ml-1 text-xs">{selectedCount} selected</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {packagesLoading ? (
                                <div className="text-light-600 dark:text-dark-400 text-sm">Loading packages...</div>
                            ) : packages.length === 0 ? (
                                <div className="text-light-600 dark:text-dark-400 text-sm">No packages available</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    {packagesToShow.map((pkg: any) => {
                                        const checked = selectedPackageIds.includes(pkg._id) || selectedPackageIds.includes((pkg as any).id);
                                        const expanded = expandedPackageDetails.includes(pkg._id);

                                        const pkgItems = Array.isArray((pkg as any).items) ? (pkg as any).items : [];
                                        const visibleItems = expanded ? pkgItems : pkgItems.slice(0, 6);

                                        const renderLabel = (it: any) => {
                                            if (!it) return "";
                                            // case: item is a string id
                                            if (typeof it === "string") {
                                                const found = items.find((i: any) => String(i._id) === String(it) || String(i.id) === String(it));
                                                if (found) return found.name || found.ar || String(it);
                                                return it;
                                            }

                                            // case: item object or { item: ... }
                                            const inner = it.item || it;
                                            if (inner) {
                                                if (typeof inner === "string") {
                                                    const found = items.find(
                                                        (i: any) => String(i._id) === String(inner) || String(i.id) === String(inner),
                                                    );
                                                    if (found) return found.name || found.ar || String(inner);
                                                    return inner;
                                                }
                                                const en = inner.name || inner.nameEn || undefined;
                                                const ar = inner.ar || inner.nameAr || undefined;
                                                if (en) return en;
                                                if (lang === "ar" && ar) return ar;
                                                return inner._id || JSON.stringify(inner);
                                            }

                                            return it._id || JSON.stringify(it);
                                        };

                                        return (
                                            <div
                                                key={pkg._id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => isEditing && togglePackage(pkg._id || (pkg as any).id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        isEditing && togglePackage(pkg._id || (pkg as any).id);
                                                    }
                                                }}
                                                className={`rounded-lg p-3 transition-colors ${
                                                    checked
                                                        ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                        : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-light-900 dark:text-dark-50 font-medium">
                                                                {pkg.nameEn || pkg.nameAr}
                                                            </div>
                                                            <div className="text-smtext-light-900 dark:text-dark-50 font-semibold">{pkg.price}</div>
                                                        </div>
                                                        {pkg.description && (
                                                            <div className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                                {String(pkg.description).slice(0, 120)}
                                                            </div>
                                                        )}

                                                        {pkgItems.length > 0 && (
                                                            <div className="mt-3">
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <div className="text-light-600 dark:text-dark-400 text-xs font-medium">
                                                                        Items ({pkgItems.length})
                                                                    </div>
                                                                    {pkgItems.length > 6 && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                togglePackageDetails(pkg._id);
                                                                            }}
                                                                            className="text-light-500 text-xs hover:underline"
                                                                        >
                                                                            {expanded ? "Show less" : `Show all (${pkgItems.length})`}
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                                                    {visibleItems.map((it: any, idx: number) => {
                                                                        const quantity =
                                                                            it && typeof it === "object"
                                                                                ? (it.quantity ?? it.qty ?? undefined)
                                                                                : undefined;
                                                                        return (
                                                                            <span
                                                                                key={idx}
                                                                                className="text-light-700 dark:text-dark-200 bg-light-100 dark:bg-dark-600 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
                                                                            >
                                                                                <span className="max-w-[220px] truncate">{renderLabel(it)}</span>
                                                                                {typeof quantity !== "undefined" &&
                                                                                    (typeof quantity === "boolean" ? (
                                                                                        <span className="ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs">
                                                                                            {quantity ? (
                                                                                                <Check
                                                                                                    size={14}
                                                                                                    className="text-green-500"
                                                                                                />
                                                                                            ) : (
                                                                                                <X
                                                                                                    size={14}
                                                                                                    className="text-red-600"
                                                                                                />
                                                                                            )}
                                                                                        </span>
                                                                                    ) : typeof quantity === "number" ? (
                                                                                        <span className="bg-light-100 dark:bg-dark-600 text-light-900 dark:text-dark-50 ml-2 inline-block rounded-md px-2 py-0.5 text-xs">
                                                                                            x{quantity}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="bg-light-100 dark:bg-dark-600 text-light-900 dark:text-dark-50 ml-2 inline-block rounded-md px-2 py-0.5 text-xs">
                                                                                            {String(quantity)}
                                                                                        </span>
                                                                                    ))}
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Custom Services */}
                        <div className="mb-4">
                            <h5 className="text-light-900 dark:text-dark-50 mb-2 text-sm font-medium">Custom Services</h5>
                            {customServices.length > 0 && (
                                <div className="mb-3 space-y-2">
                                    {customServices.map((cs) => (
                                        <div
                                            key={cs.id}
                                            className="border-light-600 dark:border-dark-700 bg-light-50 dark:bg-dark-800 flex items-center justify-between rounded-lg border px-4 py-2"
                                        >
                                            <div>
                                                <div className="text-light-900 dark:text-dark-50 font-medium">
                                                    {lang === "ar" ? cs.ar || cs.en : cs.en}
                                                </div>
                                                <div className="text-light-600 dark:text-dark-400 text-sm">
                                                    {cs.price} {lang === "ar" ? "ج.م" : "EGP"}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeCustomService(cs.id)}
                                                className="btn-ghost text-danger-500"
                                                title="Remove"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap items-end gap-2">
                                <div className="min-w-[150px] flex-1">
                                    <input
                                        type="text"
                                        value={customServiceName}
                                        onChange={(e) => setCustomServiceName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addCustomService();
                                            }
                                        }}
                                        placeholder="Service name (English)"
                                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="min-w-[150px] flex-1">
                                    <input
                                        type="text"
                                        value={customNameAr}
                                        onChange={(e) => setCustomNameAr(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addCustomService();
                                            }
                                        }}
                                        placeholder="اسم الخدمة (بالعربية)"
                                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="w-32">
                                    <input
                                        type="number"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addCustomService();
                                            }
                                        }}
                                        placeholder="Price"
                                        className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addCustomService}
                                    className="btn-ghost flex items-center gap-2 px-3 py-2"
                                >
                                    <Plus size={14} />
                                    Add
                                </button>
                            </div>
                        </div>

                        {/* Discount and override */}
                        <div className="mb-4 grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">Discount Type</label>
                                <select
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                                    className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-dark-700 dark:text-dark-400 mb-2 block text-sm">Discount Value</label>
                                <input
                                    type="number"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    placeholder={discountType === "percentage" ? "0-100" : "Amount"}
                                    className="border-light-600 dark:border-dark-700 text-light-900 dark:text-dark-50 w-full rounded-lg border bg-transparent px-3 py-2 text-sm"
                                />
                            </div>
                            {/* override total removed - total is auto-calculated from packages + custom services and discount */}
                        </div>

                        {/* Summary */}
                        <div className="mb-3">
                            <p className="text-light-900 dark:text-dark-50 text-base">
                                Subtotal: {calculateSubtotal().toFixed(2)} {lang === "ar" ? "ج.م" : "EGP"}
                            </p>
                            {discountValue && parseFloat(discountValue) > 0 && (
                                <p className="text-light-600 dark:text-dark-400 text-sm">
                                    Discount:{" "}
                                    {discountType === "percentage" ? `${discountValue}%` : `${discountValue} ${lang === "ar" ? "ج.م" : "EGP"}`}
                                </p>
                            )}
                            <p className="text-light-900 dark:text-dark-50 text-lg font-bold">
                                Total: {calculateTotal().toFixed(2)} {lang === "ar" ? "ج.م" : "EGP"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={handleSavePlan}
                            className="btn-primary flex items-center gap-2"
                            type="button"
                        >
                            <Save size={16} /> Save Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Minimal TimelineObjectivesEditor stub to fix compile error.
 * You should replace this with your actual implementation.
 */
type TimelineObjectivesEditorProps = {
    timelineIndex: number;
    timelineItems: Array<{
        id: string;
        start: Date | null;
        end: Date | null;
        objectiveEn?: string;
        objectiveAr?: string;
        objectives: Bilingual[];
    }>;
    setTimelineItems: React.Dispatch<
        React.SetStateAction<
            Array<{
                id: string;
                start: Date | null;
                end: Date | null;
                objectiveEn?: string;
                objectiveAr?: string;
                objectives: Bilingual[];
            }>
        >
    >;
    isEditing: boolean;
};

// TimelineObjectivesEditor removed — implement if needed later
export default PlanningForm;
