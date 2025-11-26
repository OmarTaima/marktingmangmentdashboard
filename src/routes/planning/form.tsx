import React, { useState, useEffect, useMemo } from "react";
import { Save, Plus, Trash2, Edit3, Loader2 } from "lucide-react";
import { showAlert } from "@/utils/swal";
import { useCreateCampaign, useUpdateCampaign } from "@/hooks/queries";
import { getCampaignById } from "@/api/requests/planService";
// Using MUI DatePicker for plan-level dates
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useTheme as useAppTheme } from "@/hooks/useTheme";
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

    const handleBudgetChange = (value: string) => {
        setPlanData((p) => ({ ...p, budget: value }));
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
                    budget: Number(planData.budget) || 0,
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
                                    return (
                                        <button
                                            key={sid}
                                            type="button"
                                            onClick={() => toggleSegment(sid)}
                                            aria-pressed={checked}
                                            disabled={!isEditing}
                                            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                                                checked
                                                    ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                    : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                            }`}
                                        >
                                            <div className="text-sm">
                                                <div className="text-light-900 dark:text-dark-50 font-medium">{label}</div>
                                                {s.description && <div className="text-light-600 dark:text-dark-400 text-xs">{s.description}</div>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {s.population && (
                                                    <div className="text-light-500 text-xs">
                                                        {Array.isArray(s.population) ? s.population.join(", ") : s.population}
                                                    </div>
                                                )}
                                                {checked && <span className="text-light-500 text-xs">Selected</span>}
                                            </div>
                                        </button>
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
                                    return (
                                        <button
                                            key={cid}
                                            type="button"
                                            onClick={() => toggleCompetitor(cid)}
                                            aria-pressed={checked}
                                            disabled={!isEditing}
                                            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                                                checked
                                                    ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                    : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                            }`}
                                        >
                                            <div className="text-sm">
                                                <div className="text-light-900 dark:text-dark-50 font-medium">{label}</div>
                                                {c.description && <div className="text-light-600 dark:text-dark-400 text-xs">{c.description}</div>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {c.website && <div className="text-light-500 text-xs">{c.website}</div>}
                                                {checked && <span className="text-light-500 text-xs">Selected</span>}
                                            </div>
                                        </button>
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
                                    return (
                                        <button
                                            key={bid}
                                            type="button"
                                            onClick={() => toggleBranch(bid)}
                                            aria-pressed={checked}
                                            disabled={!isEditing}
                                            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                                                checked
                                                    ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                    : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                            }`}
                                        >
                                            <div className="text-sm">
                                                <div className="text-light-900 dark:text-dark-50 font-medium">{label}</div>
                                                {b.mainOfficeAddress && (
                                                    <div className="text-light-600 dark:text-dark-400 text-xs">{b.mainOfficeAddress}</div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {b.phone && <div className="text-light-500 text-xs">{b.phone}</div>}
                                                {checked && <span className="text-light-500 text-xs">Selected</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {openPanel === "swot" && (
                        <div className="space-y-3">
                            {(["strengths", "weaknesses", "opportunities", "threats"] as SwotCategory[]).map((cat) => (
                                <div key={cat}>
                                    <div className="text-light-600 dark:text-dark-400 mb-2 text-sm font-medium">
                                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {((clientData?.swot as any)?.[cat] || []).length === 0 && <div className="text-dark-500">No items</div>}
                                        {((clientData?.swot as any)?.[cat] || []).map((item: any, i: number) => {
                                            const checked = (selectedSwot as any)[cat]?.includes(item);
                                            return (
                                                <button
                                                    key={`${cat}-${i}`}
                                                    type="button"
                                                    onClick={() => toggleSwotItem(cat, item)}
                                                    aria-pressed={checked}
                                                    disabled={!isEditing}
                                                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                                                        checked
                                                            ? "border-light-500 bg-light-100 text-light-900 dark:border-dark-500 dark:bg-dark-700"
                                                            : "border-light-200 bg-light-50 text-light-900 dark:border-dark-700 dark:bg-dark-800"
                                                    }`}
                                                >
                                                    <div className="text-light-900 dark:text-dark-50 text-sm">{item}</div>
                                                    {checked && <div className="text-light-500 text-xs">Selected</div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
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
                        </label>

                        <label className="flex flex-col">
                            <span className="text-light-600 dark:text-dark-400 mb-1 text-sm">Description (strategy)</span>
                            <input
                                className="text-light-900 dark:border-dark-700 dark:bg-dark-800 dark:text-dark-50 focus:border-light-500 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none"
                                placeholder="Strategy description"
                                value={planData.strategy}
                                onChange={(e) => setPlanData((p) => ({ ...p, strategy: e.target.value }))}
                                disabled={!isEditing}
                            />
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
