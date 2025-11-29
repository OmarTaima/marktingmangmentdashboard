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

                // If campaign references package id(s), set them so UI reflects selection
                const pkgIdRaw = camp.strategy?.packageId || camp.strategy?.packageIds || camp.packageId || camp.packageIds;
                if (pkgIdRaw) {
                    let pkgIds: string[] = [];
                    if (Array.isArray(pkgIdRaw)) pkgIds = pkgIdRaw.map((p: any) => (typeof p === "string" ? p : p._id || p.id));
                    else pkgIds = [typeof pkgIdRaw === "string" ? pkgIdRaw : pkgIdRaw._id || pkgIdRaw.id];
                    setSelectedPackageIds(pkgIds.filter(Boolean));
                    setPackageSetFromServer(true);
                }

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
                setPackages(Array.isArray(res?.data) ? res.data : []);
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

    // Compute selected packages total and overall total combining manual budget input
    const packagesTotal = useMemo(() => {
        if (!packages || packages.length === 0 || !selectedPackageIds || selectedPackageIds.length === 0) return 0;
        return packages.filter((p) => selectedPackageIds.includes(p._id)).reduce((s, p) => s + (Number((p as any).price) || 0), 0);
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
                strategy: {
                    budget: Number(totalBudget) || 0,
                    packageIds: selectedPackageIds && selectedPackageIds.length > 0 ? selectedPackageIds : undefined,
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

                {/* Objectives chips */}
                {objectives.length > 0 && (
                    <div className="mb-3">
                        <div className="text-light-600 dark:text-dark-400 mb-2 text-sm">Added objectives</div>
                        <div className="flex flex-wrap gap-2">
                            {objectives.map((obj, idx) => (
                                <div
                                    key={obj.id}
                                    className="border-light-200 bg-light-50 dark:border-dark-600 dark:bg-dark-700 text-light-900 dark:text-dark-50 inline-flex min-w-[160px] items-center gap-2 rounded-full border px-4 py-1 text-xs font-medium shadow-sm hover:shadow-md"
                                >
                                    <div className="flex flex-col">
                                        <div className="text-light-900 dark:text-dark-50 font-medium">{obj.en}</div>
                                        <div className="text-light-600 dark:text-dark-400 text-xs">{obj.ar}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingObjectiveIndex(idx);
                                                setObjectiveInputEn(obj.en || "");
                                                setObjectiveInputAr(obj.ar || "");
                                                setObjectiveDescEn(obj.enDesc || "");
                                                setObjectiveDescAr(obj.arDesc || "");
                                            }}
                                            className="text-light-600 hover:text-light-800 p-1"
                                            aria-label="Edit objective"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={() => removeObjective(idx)}
                                            className="ml-1 p-1 text-red-500 hover:text-red-600"
                                            aria-label="Remove objective"
                                        >
                                            <Trash2 size={14} />
                                        </button>
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
                        <div className="space-y-2">
                            {(clientData?.segments || []).length === 0 && <div className="text-dark-500">No segments available</div>}
                            <div className="grid grid-cols-1 gap-2">
                                {(clientData?.segments || []).map((s: any) => {
                                    const sid = typeof s === "string" ? s : s._id || s.id;
                                    const label = typeof s === "string" ? s : s.name || s.title || "Unnamed segment";
                                    const checked = selectedSegments.includes(sid);
                                    const key = `segment-${sid}`;
                                    return (
                                        <div
                                            key={sid}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => isEditing && toggleSegment(sid)}
                                            onKeyDown={(e) => handleItemKeyDown(e, () => isEditing && toggleSegment(sid))}
                                            className={`flex flex-col gap-1 rounded-lg border px-3 py-2 transition-colors ${
                                                checked
                                                    ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                    : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm">
                                                    <div className="text-light-900 dark:text-dark-50 font-medium">{label}</div>
                                                </div>
                                                <div />
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDetail(key);
                                                    }}
                                                    className="btn-primary text-sm"
                                                >
                                                    {expandedDetails[key] ? "Hide details" : "Show details"}
                                                </button>
                                            </div>
                                            {expandedDetails[key] && (
                                                <div className="text-light-600 dark:text-dark-400 mt-2 space-y-1 rounded border-t pt-2 text-sm">
                                                    {s.description && <div className="text-light-900 dark:text-dark-50 text-sm">{s.description}</div>}
                                                    {Array.isArray(s.ageRange) && s.ageRange.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Age range: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{s.ageRange.join(", ")}</span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(s.productName) && s.productName.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Products: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{s.productName.join(", ")}</span>
                                                        </div>
                                                    )}
                                                    {s.population !== undefined && s.population !== null && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Population: </span>
                                                            <span className="text-light-600 dark:text-dark-400">
                                                                {Array.isArray(s.population) ? s.population.join(", ") : s.population}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(s.gender) && s.gender.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Gender: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{s.gender.join(", ")}</span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(s.area) && s.area.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Area: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{s.area.join(", ")}</span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(s.governorate) && s.governorate.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Governorates: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{s.governorate.join(", ")}</span>
                                                        </div>
                                                    )}
                                                    {s.note && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Note: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{s.note}</span>
                                                        </div>
                                                    )}
                                                    {s.metadata && (
                                                        <pre className="text-light-600 dark:text-dark-400 mt-1 text-xs">
                                                            {JSON.stringify(s.metadata, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {openPanel === "competitors" && (
                        <div className="space-y-2">
                            {(clientData?.competitors || []).length === 0 && <div className="text-dark-500">No competitors available</div>}
                            <div className="grid grid-cols-1 gap-2">
                                {(clientData?.competitors || []).map((c: any) => {
                                    const cid = typeof c === "string" ? c : c._id || c.id;
                                    const label = typeof c === "string" ? c : c.name || "Unnamed competitor";
                                    const checked = selectedCompetitors.includes(cid);
                                    const key = `competitor-${cid}`;
                                    return (
                                        <div
                                            key={cid}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => isEditing && toggleCompetitor(cid)}
                                            onKeyDown={(e) => handleItemKeyDown(e, () => isEditing && toggleCompetitor(cid))}
                                            className={`flex flex-col gap-1 rounded-lg border px-3 py-2 transition-colors ${
                                                checked
                                                    ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                    : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm">
                                                    <div className="text-light-900 dark:text-dark-50 font-medium">{label}</div>
                                                </div>
                                                <div />
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDetail(key);
                                                    }}
                                                    className="btn-primary text-sm"
                                                >
                                                    {expandedDetails[key] ? "Hide details" : "Show details"}
                                                </button>
                                            </div>
                                            {expandedDetails[key] && (
                                                <div className="text-light-600 dark:text-dark-400 mt-2 space-y-1 rounded border-t pt-2 text-sm">
                                                    {c.description && <div className="text-light-900 dark:text-dark-50 text-sm">{c.description}</div>}
                                                    {Array.isArray(c.swot_strengths) && c.swot_strengths.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">SWOT strengths: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{c.swot_strengths.join(", ")}</span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(c.swot_weaknesses) && c.swot_weaknesses.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">SWOT weaknesses: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{c.swot_weaknesses.join(", ")}</span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(c.swot_opportunities) && c.swot_opportunities.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">SWOT opportunities: </span>
                                                            <span className="text-light-600 dark:text-dark-400">
                                                                {c.swot_opportunities.join(", ")}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(c.swot_threats) && c.swot_threats.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">SWOT threats: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{c.swot_threats.join(", ")}</span>
                                                        </div>
                                                    )}
                                                    {Array.isArray(c.socialLinks) && c.socialLinks.length > 0 && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Social links:</span>
                                                            <ul className="text-light-600 dark:text-dark-400 ml-3 list-disc">
                                                                {c.socialLinks.map((sl: any, idx: number) => (
                                                                    <li
                                                                        key={idx}
                                                                        className="text-xs"
                                                                    >
                                                                        {(sl.platform || sl.name) + ": " + (sl.url || sl.value)}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {openPanel === "branches" && (
                        <div className="space-y-2">
                            {(clientData?.branches || []).length === 0 && <div className="text-dark-500">No branches available</div>}
                            <div className="grid grid-cols-1 gap-2">
                                {(clientData?.branches || []).map((b: any) => {
                                    const bid = typeof b === "string" ? b : b._id || b.id;
                                    const label = typeof b === "string" ? b : b.name || b.address || "Unnamed branch";
                                    const checked = selectedBranches.includes(bid);
                                    const key = `branch-${bid}`;
                                    return (
                                        <div
                                            key={bid}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => isEditing && toggleBranch(bid)}
                                            onKeyDown={(e) => handleItemKeyDown(e, () => isEditing && toggleBranch(bid))}
                                            className={`flex flex-col gap-1 rounded-lg border px-3 py-2 transition-colors ${
                                                checked
                                                    ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                    : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm">
                                                    <div className="text-light-900 dark:text-dark-50 font-medium">{label}</div>
                                                </div>
                                                <div />
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDetail(key);
                                                    }}
                                                    className="btn-primary text-sm"
                                                >
                                                    {expandedDetails[key] ? "Hide details" : "Show details"}
                                                </button>
                                            </div>
                                            {expandedDetails[key] && (
                                                <div className="text-light-600 dark:text-dark-400 mt-2 space-y-1 rounded border-t pt-2 text-sm">
                                                    {(b.mainOfficeAddress || b.address) && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Address: </span>
                                                            <span className="text-light-600 dark:text-dark-400">
                                                                {b.mainOfficeAddress || b.address}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {b.city && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">City: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{b.city}</span>
                                                        </div>
                                                    )}
                                                    {b.phone && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Phone: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{b.phone}</span>
                                                        </div>
                                                    )}
                                                    {b.notes && (
                                                        <div className="text-xs">
                                                            <span className="text-light-900 dark:text-dark-50 font-medium">Notes: </span>
                                                            <span className="text-light-600 dark:text-dark-400">{b.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
                {/* Timeline chips list */}
                {timelineItems.length > 0 && (
                    <div className="mt-3">
                        <div className="text-light-600 dark:text-dark-400 mb-2 text-sm">Added timelines</div>
                        <div className="flex flex-wrap gap-2">
                            {timelineItems.map((t) => (
                                <div
                                    key={t.id}
                                    className="border-light-200 bg-light-50 dark:border-dark-600 dark:bg-dark-700 text-light-900 dark:text-dark-50 inline-flex min-w-[160px] items-center gap-2 rounded-full border px-4 py-1 text-xs font-medium shadow-sm hover:shadow-md"
                                >
                                    <div className="flex flex-col">
                                        <div className="text-light-900 dark:text-dark-50 font-medium">
                                            {t.start ? format(t.start, "yyyy-MM-dd") : "-"} → {t.end ? format(t.end, "yyyy-MM-dd") : "-"}
                                        </div>
                                        <div className="text-light-600 dark:text-dark-400 text-xs">
                                            {t.objectiveEn || t.objectiveAr || "No objective"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => removeTimeline(t.id)}
                                            className="p-1 text-red-500 hover:text-red-600"
                                            aria-label="Remove timeline"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="card p-4">
                    <h3 className="card-title mb-2">Campaign Details</h3>

                    <div className="mb-3 grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col">
                            <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Budget</span>
                            <input
                                type="number"
                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                placeholder="Budget"
                                value={planData.budget}
                                onChange={(e) => handleBudgetChange(e.target.value)}
                                disabled={!isEditing}
                            />
                            <div className="mt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-light-600 dark:text-dark-400 mb-1 text-xs">pick packages</span>
                                    <div className="text-light-600 dark:text-dark-400 text-xs">
                                        {selectedPackageIds.length > 0 ? `${selectedPackageIds.length} selected` : "None selected"}
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                    <div className="text-light-600 dark:text-dark-400 text-xs">Total Budget (packages + manual)</div>
                                    <div className="text-light-900 dark:text-dark-50 text-sm font-semibold">
                                        {(totalBudget || 0).toLocaleString()}
                                    </div>
                                </div>

                                {packagesLoading ? (
                                    <div className="text-light-600 dark:text-dark-400 text-sm">Loading packages...</div>
                                ) : packages.length === 0 ? (
                                    <div className="text-light-600 dark:text-dark-400 text-sm">No packages available</div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                        {packages.map((pkg) => {
                                            const checked = selectedPackageIds.includes(pkg._id);
                                            const expanded = expandedPackageDetails.includes(pkg._id);

                                            const pkgItems = Array.isArray((pkg as any).items) ? (pkg as any).items : [];
                                            const visibleItems = expanded ? pkgItems : pkgItems.slice(0, 6);

                                            const renderLabel = (it: any) => {
                                                if (!it) return "";
                                                if (typeof it === "string") return it;
                                                const en = it.name || (it.item && it.item.name) || undefined;
                                                const ar = it.ar || (it.item && it.item.ar) || undefined;
                                                // Only show Arabic label when current site language is Arabic
                                                if (en) return en;
                                                if (lang === "ar" && ar) return ar;
                                                if (it.item && typeof it.item === "string") return it.item;
                                                if (it.item && typeof it.item === "object")
                                                    return it.item.name || it.item._id || JSON.stringify(it.item);
                                                return it._id || JSON.stringify(it);
                                            };

                                            return (
                                                <div
                                                    key={pkg._id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => isEditing && togglePackage(pkg._id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter" || e.key === " ") {
                                                            e.preventDefault();
                                                            isEditing && togglePackage(pkg._id);
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
                                                                <div className="text-smtext-light-900 dark:text-dark-50 font-semibold">
                                                                    {pkg.price}
                                                                </div>
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
                        </label>
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
