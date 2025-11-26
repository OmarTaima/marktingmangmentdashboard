import React, { useState } from "react";
import { Save, Plus, Trash2, Edit3 } from "lucide-react";
import { showAlert } from "@/utils/swal";
import { useCreateCampaign } from "@/hooks/queries";
// Using MUI DatePicker for plan-level dates
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { useMemo } from "react";
import { useTheme as useAppTheme } from "@/hooks/useTheme";
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

type Props = { selectedClientId?: string };

const PlanningForm: React.FC<Props> = ({ selectedClientId }) => {
    const createCampaignMutation = useCreateCampaign();
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

    const [isEditing, setIsEditing] = useState(true);

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

            const timelinePayload =
                timelineItems.length > 0
                    ? timelineItems.map((t) => ({
                          timelineStart: t.start ? t.start.toISOString() : undefined,
                          timelineEnd: t.end ? t.end.toISOString() : undefined,
                          objectiveEn: t.objectiveEn || undefined,
                          objectiveAr: t.objectiveAr || undefined,
                      }))
                    : [
                          {
                              timelineStart: planData.timelineStart || undefined,
                              timelineEnd: planData.timelineEnd || undefined,
                              objectiveEn: planData.objectiveEn || undefined,
                              objectiveAr: planData.objectiveAr || undefined,
                          },
                      ];

            const payload = {
                clientId: selectedClientId,
                description: planData.objective || planData.strategy || "Campaign Plan",
                objectives: campaignObjectives,
                strategy: {
                    budget: Number(planData.budget) || 0,
                    timeline: timelinePayload,
                    description: planData.strategy || undefined,
                },
            };

            await createCampaignMutation.mutateAsync(payload as any);
            showAlert("Plan saved successfully!", "success");
            setIsEditing(false);
        } catch (e: any) {
            console.error("Failed to save campaign:", e);
            showAlert(e?.response?.data?.message || "Failed to save plan.", "error");
        }
    };

    // New Strategy Handler (reset fields for new strategy)
    const handleCreateNewPlan = () => {
        setPlanData({ objective: "", strategy: "", budget: "", timelineStart: "", timelineEnd: "", objectiveEn: "", objectiveAr: "" });
        setObjectives([]);
        setIsEditing(true);
    };

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
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleSavePlan}
                        className="btn-primary flex items-center gap-2"
                        type="button"
                    >
                        <Save size={16} /> Save Plan
                    </button>
                    <button
                        onClick={handleCreateNewPlan}
                        className="btn-secondary flex items-center gap-2"
                        type="button"
                    >
                        <Plus size={16} /> New Strategy
                    </button>
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

const TimelineObjectivesEditor: React.FC<TimelineObjectivesEditorProps> = () => {
    return null; // TODO: Implement editor UI
};

export default PlanningForm;
