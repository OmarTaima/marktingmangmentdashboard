import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProject, useUpdateProject, useDeleteProject, useClients } from "@/hooks/queries";
import type { Client } from "@/api/interfaces/clientinterface";
import { useLang } from "@/hooks/useLang";
import { 
  Save, Trash2, X, ArrowLeft, Loader2, 
  FileText, Info, AlertCircle, CheckCircle, Plus,
  Edit, Eye, MapPin,  Users, Layers,
  Image, Video, Code, Upload, MoveUp, MoveDown,
  Camera
} from "lucide-react";

interface Material {
  _id?: string;
  type: "photo" | "video" | "before_after" | "text" | "html";
  order: number;
  caption?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  originalName?: string;
  textContent?: string;
  htmlContent?: string;
    thumbnail?: string;
    before?: { url: string; label?: string; type?: string; mimeType?: string; originalName?: string; size?: number };
    after?: { url: string; label?: string; type?: string; mimeType?: string; originalName?: string; size?: number };
}

interface Cast {
  _id?: string;
  name: string;
  title: string;
  order: number;
    clientId?: string;
}


const EditProject: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useLang();
    const tr = (key: string, fallback: string) => {
        const v = t(key);
        return !v || v === key ? fallback : v;
    };
    void tr; // to avoid unused variable warning if translation is not used in this file
    const navigate = useNavigate();

    const { data: project, isLoading, error } = useProject(id);
    const update = useUpdateProject();
    const del = useDeleteProject();
    const { data: clients = [], isLoading: clientsLoading } = useClients();

    const [form, setForm] = useState<any>({
        name: "",
        description: "",
        location: "",
        published: false,
        categories: [] as string[],
        tags: [] as string[],
        types: [] as string[],
        materials: [] as Material[],
        cast: [] as Cast[],
        mainCover: null as any,
    });
    
    const [newCategory, setNewCategory] = useState("");
    const [newTag, setNewTag] = useState("");
    const [newType, setNewType] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
    const [activeTab, setActiveTab] = useState<"basic" | "materials" | "cast" | "media">("basic");
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [editingCast, setEditingCast] = useState<Cast | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (project) {
            setForm({
                name: project.name || "",
                description: project.description || "",
                location: project.location || "",
                published: project.published || false,
                categories: project.categories || [],
                tags: project.tags || [],
                types: project.types || [],
                materials: (project.material || []).sort((a: any, b: any) => a.order - b.order),
                cast: (project.cast || []).sort((a: any, b: any) => a.order - b.order),
                mainCover: project.mainCover || null,
            });
        }
    }, [project]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setForm({ ...form, [name]: checked });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    // Category Management
    const handleAddCategory = () => {
        if (newCategory.trim() && !form.categories.includes(newCategory.trim())) {
            setForm({ ...form, categories: [...form.categories, newCategory.trim()] });
            setNewCategory("");
        }
    };

    const handleRemoveCategory = (category: string) => {
        setForm({ ...form, categories: form.categories.filter((c: string) => c !== category) });
    };

    // Tag Management
    const handleAddTag = () => {
        if (newTag.trim() && !form.tags.includes(newTag.trim())) {
            setForm({ ...form, tags: [...form.tags, newTag.trim()] });
            setNewTag("");
        }
    };

    const handleRemoveTag = (tag: string) => {
        setForm({ ...form, tags: form.tags.filter((t: string) => t !== tag) });
    };

    // Type Management
    const handleAddType = () => {
        if (newType.trim() && !form.types.includes(newType.trim())) {
            setForm({ ...form, types: [...form.types, newType.trim()] });
            setNewType("");
        }
    };

    const handleRemoveType = (type: string) => {
        setForm({ ...form, types: form.types.filter((t: string) => t !== type) });
    };

    // Material Management
    const handleAddMaterial = () => {
        const newMaterial: Material = {
            type: "photo",
            order: form.materials.length + 1,
            caption: "",
            url: "",
            mimeType: "image/jpeg",
        };
        setEditingMaterial(newMaterial);
    };

    const handleEditMaterial = (material: Material) => {
        setEditingMaterial({ ...material });
    };

    const handleSaveMaterial = () => {
        if (editingMaterial) {
            if (editingMaterial._id) {
                // Update existing
                setForm({
                    ...form,
                    materials: form.materials.map((m: Material) =>
                        m._id === editingMaterial._id ? editingMaterial : m
                    ),
                });
            } else {
                // Add new
                setForm({
                    ...form,
                    materials: [...form.materials, { ...editingMaterial, order: form.materials.length + 1 }],
                });
            }
            setEditingMaterial(null);
        }
    };

    const handleMaterialFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingMaterial) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setEditingMaterial({ ...editingMaterial, url: dataUrl, mimeType: file.type, size: file.size, originalName: file.name });
        };
        reader.readAsDataURL(file);
    };

    const handleBeforeAfterUpload = (e: React.ChangeEvent<HTMLInputElement>, which: 'before' | 'after') => {
        const file = e.target.files?.[0];
        if (!file || !editingMaterial) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setEditingMaterial({
                ...editingMaterial,
                [which]: {
                    ...((editingMaterial as any)[which] || {}),
                    url: dataUrl,
                    mimeType: file.type,
                    originalName: file.name,
                    size: file.size,
                    label: which === 'before' ? 'Before' : 'After',
                    type: 'photo',
                },
            } as any);
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteMaterial = (materialId: string) => {
        setForm({
            ...form,
            materials: form.materials.filter((m: Material) => m._id !== materialId),
        });
    };

    const handleMoveMaterial = (index: number, direction: "up" | "down") => {
        const newMaterials = [...form.materials];
        if (direction === "up" && index > 0) {
            [newMaterials[index], newMaterials[index - 1]] = [newMaterials[index - 1], newMaterials[index]];
        } else if (direction === "down" && index < newMaterials.length - 1) {
            [newMaterials[index], newMaterials[index + 1]] = [newMaterials[index + 1], newMaterials[index]];
        }
        // Update order numbers
        newMaterials.forEach((m, idx) => { m.order = idx + 1; });
        setForm({ ...form, materials: newMaterials });
    };

    // Cast Management
    const handleAddCast = () => {
        setEditingCast({
            name: "",
            title: "",
            order: form.cast.length + 1,
        });
    };

    const handleEditCast = (cast: Cast) => {
        setEditingCast({ ...cast });
    };

    const handleSaveCast = () => {
        if (editingCast) {
            if (editingCast._id) {
                // Update existing
                setForm({
                    ...form,
                    cast: form.cast.map((c: Cast) =>
                        c._id === editingCast._id ? editingCast : c
                    ),
                });
            } else {
                // Add new
                setForm({
                    ...form,
                    cast: [...form.cast, { ...editingCast, order: form.cast.length + 1 }],
                });
            }
            setEditingCast(null);
        }
    };

    const handleDeleteCast = (castId: string) => {
        setForm({
            ...form,
            cast: form.cast.filter((c: Cast) => c._id !== castId),
        });
    };

    const handleMoveCast = (index: number, direction: "up" | "down") => {
        const newCast = [...form.cast];
        if (direction === "up" && index > 0) {
            [newCast[index], newCast[index - 1]] = [newCast[index - 1], newCast[index]];
        } else if (direction === "down" && index < newCast.length - 1) {
            [newCast[index], newCast[index + 1]] = [newCast[index + 1], newCast[index]];
        }
        newCast.forEach((c, idx) => { c.order = idx + 1; });
        setForm({ ...form, cast: newCast });
    };

    // Main Cover Management
    const handleMainCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setForm({
                    ...form,
                    mainCover: {
                        url: reader.result as string,
                        mimeType: file.type,
                        originalName: file.name,
                        size: file.size,
                    },
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveMainCover = () => {
        setForm({ ...form, mainCover: null });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        
        setSaveStatus("saving");

        // Prepare data for submission (sanitize fields the server validation disallows)
        const clone = JSON.parse(JSON.stringify(form));
        // remove cropping preview data that backend validation may reject
        if (clone.mainCover) {
            delete clone.mainCover.croppedUrl;
            delete clone.mainCover.crop;
        }
        // strip nested metadata from before/after sub-objects (server expects simple {url,label,type})
        if (Array.isArray(clone.materials)) {
            clone.materials = clone.materials.map((m: any) => {
                const copy: any = { ...m };
                if (copy.before) {
                    const { url, label, type } = copy.before;
                    copy.before = { url, label, type };
                }
                if (copy.after) {
                    const { url, label, type } = copy.after;
                    copy.after = { url, label, type };
                }
                return copy;
            });
        }

        const submitData = {
            name: clone.name,
            description: clone.description,
            location: clone.location,
            published: clone.published,
            categories: clone.categories,
            tags: clone.tags,
            types: clone.types,
            material: clone.materials,
            cast: clone.cast,
            mainCover: clone.mainCover,
        };
        
        update.mutate(
            { id, data: submitData },
            {
                onSuccess: () => {
                    setSaveStatus("success");
                    setTimeout(() => {
                        navigate(`/projects/${id}`);
                    }, 1500);
                },
                onError: () => {
                    setSaveStatus("error");
                    setTimeout(() => setSaveStatus("idle"), 3000);
                },
            }
        );
    };

    const handleDelete = () => {
        if (!id) return;
        del.mutate(id, {
            onSuccess: () => navigate("/projects"),
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-light-50 dark:bg-dark-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-light-200 dark:border-dark-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-light-500 dark:border-t-secdark-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-light-500 to-light-600 dark:from-secdark-500 dark:to-secdark-600 rounded-sm rotate-45"></div>
                        </div>
                    </div>
                    <p className="text-light-600 dark:text-dark-400 font-light tracking-wide">Loading project data...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-light-50 dark:bg-dark-950 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-24 h-24 mx-auto mb-6 bg-danger-50 dark:bg-danger-950/30 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-danger-500 dark:text-danger-400" />
                    </div>
                    <h2 className="text-2xl font-light mb-2 text-light-900 dark:text-dark-50">Project Not Found</h2>
                    <p className="text-light-600 dark:text-dark-400 mb-6">
                        {(error as any)?.message || "The project you're trying to edit doesn't exist."}
                    </p>
                    <Link to="/projects" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Projects
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-light-50 dark:bg-dark-950">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="relative rounded-2xl bg-light-50/5 dark:bg-dark-950/70 border border-light-100 dark:border-dark-800 p-6 lg:p-8 shadow-xl overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Link to={`/projects/${id}`} className="text-light-500 dark:text-secdark-500 hover:text-light-600 dark:hover:text-secdark-400 transition-colors">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Link>
                                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-wider text-light-400 dark:text-dark-300">
                                        Edit Mode
                                    </span>
                                </div>
                                <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-light-900 dark:text-dark-50 leading-tight">
                                    Edit Project
                                </h1>
                                <p className="mt-2 text-sm text-light-600 dark:text-dark-400 max-w-2xl">
                                    Modify project details, materials, team, and content for "{project.name}"
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Link to={`/projects/${id}`} className="btn-ghost inline-flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </Link>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div className="p-3 rounded-lg bg-white/5 dark:bg-dark-800/40 border border-light-100 dark:border-dark-700">
                                <div className="text-xs text-light-400 dark:text-dark-400 uppercase">Materials</div>
                                <div className="mt-1 text-lg font-bold text-light-700 dark:text-secdark-500">{form.materials.length}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 dark:bg-dark-800/40 border border-light-100 dark:border-dark-700">
                                <div className="text-xs text-light-400 dark:text-dark-400 uppercase">Team Members</div>
                                <div className="mt-1 text-lg font-bold text-light-700 dark:text-secdark-500">{form.cast.length}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 dark:bg-dark-800/40 border border-light-100 dark:border-dark-700">
                                <div className="text-xs text-light-400 dark:text-dark-400 uppercase">Categories</div>
                                <div className="mt-1 text-lg font-bold text-light-700 dark:text-secdark-500">{form.categories.length}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 dark:bg-dark-800/40 border border-light-100 dark:border-dark-700">
                                <div className="text-xs text-light-400 dark:text-dark-400 uppercase">Tags</div>
                                <div className="mt-1 text-lg font-bold text-light-700 dark:text-secdark-500">{form.tags.length}</div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 dark:bg-dark-800/40 border border-light-100 dark:border-dark-700">
                                <div className="text-xs text-light-400 dark:text-dark-400 uppercase">Types</div>
                                <div className="mt-1 text-lg font-bold text-light-700 dark:text-secdark-500">{form.types.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-2 border-b border-light-200 dark:border-dark-800 mb-6">
                    <button
                        onClick={() => setActiveTab("basic")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "basic"
                                ? "text-light-500 dark:text-secdark-500 border-b-2 border-light-500 dark:border-secdark-500"
                                : "text-light-600 dark:text-dark-400 hover:text-light-700 dark:hover:text-dark-300"
                        }`}
                    >
                        <Info className="w-4 h-4 inline mr-2" />
                        Basic Info
                    </button>
                    <button
                        onClick={() => setActiveTab("materials")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "materials"
                                ? "text-light-500 dark:text-secdark-500 border-b-2 border-light-500 dark:border-secdark-500"
                                : "text-light-600 dark:text-dark-400 hover:text-light-700 dark:hover:text-dark-300"
                        }`}
                    >
                        <Layers className="w-4 h-4 inline mr-2" />
                        Materials ({form.materials.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("cast")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "cast"
                                ? "text-light-500 dark:text-secdark-500 border-b-2 border-light-500 dark:border-secdark-500"
                                : "text-light-600 dark:text-dark-400 hover:text-light-700 dark:hover:text-dark-300"
                        }`}
                    >
                        <Users className="w-4 h-4 inline mr-2" />
                        Cast & Crew ({form.cast.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("media")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === "media"
                                ? "text-light-500 dark:text-secdark-500 border-b-2 border-light-500 dark:border-secdark-500"
                                : "text-light-600 dark:text-dark-400 hover:text-light-700 dark:hover:text-dark-300"
                        }`}
                    >
                        <Camera className="w-4 h-4 inline mr-2" />
                        Main Cover
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <form onSubmit={handleSubmit}>
                    {/* Basic Information Tab */}
                    {activeTab === "basic" && (
                        <div className="space-y-6">
                            <div className="card p-6">
                                <h2 className="text-lg font-semibold text-light-900 dark:text-dark-50 mb-4">Basic Information</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">
                                            Project Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            required
                                            className="input w-full"
                                            placeholder="Enter project name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={form.description}
                                            onChange={handleChange}
                                            rows={4}
                                            className="input w-full resize-y min-h-[100px]"
                                            placeholder="Describe the project..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">
                                            Location
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-light-400 dark:text-dark-500" />
                                            <input
                                                type="text"
                                                name="location"
                                                value={form.location}
                                                onChange={handleChange}
                                                className="input w-full pl-9"
                                                placeholder="e.g., Cairo, Egypt"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            name="published"
                                            id="published"
                                            checked={form.published}
                                            onChange={handleChange}
                                            className="w-4 h-4 rounded border-light-300 dark:border-dark-600 text-light-500 dark:text-secdark-500 focus:ring-light-500 dark:focus:ring-secdark-500"
                                        />
                                        <label htmlFor="published" className="text-sm text-light-700 dark:text-dark-300">
                                            Publish this project (make it publicly visible)
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-6">
                                <h2 className="text-lg font-semibold text-light-900 dark:text-dark-50 mb-4">Categories & Tags</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">
                                            Categories
                                        </label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {form.categories.map((cat: string) => (
                                                <span key={cat} className="inline-flex items-center gap-1 px-2 py-1 bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-300 rounded-md text-sm">
                                                    {cat}
                                                    <button type="button" onClick={() => handleRemoveCategory(cat)}>
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newCategory}
                                                onChange={(e) => setNewCategory(e.target.value)}
                                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                                                className="input flex-1"
                                                placeholder="Add a category..."
                                            />
                                            <button type="button" onClick={handleAddCategory} className="btn-secondary">Add</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Tags</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {form.tags.map((tag: string) => (
                                                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-300 rounded-md text-sm">
                                                    #{tag}
                                                    <button type="button" onClick={() => handleRemoveTag(tag)}>
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                                                className="input flex-1"
                                                placeholder="Add a tag..."
                                            />
                                            <button type="button" onClick={handleAddTag} className="btn-secondary">Add</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Project Types</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {form.types.map((type: string) => (
                                                <span key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-300 rounded-md text-sm">
                                                    {type}
                                                    <button type="button" onClick={() => handleRemoveType(type)}>
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newType}
                                                onChange={(e) => setNewType(e.target.value)}
                                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddType())}
                                                className="input flex-1"
                                                placeholder="e.g., branding, photography, video..."
                                            />
                                            <button type="button" onClick={handleAddType} className="btn-secondary">Add</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Materials Tab */}
                    {activeTab === "materials" && (
                        <div className="space-y-6">
                            <div className="card p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-light-900 dark:text-dark-50">Materials & Media</h2>
                                    <button type="button" onClick={handleAddMaterial} className="btn-primary inline-flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Material
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {form.materials.map((material: Material, idx: number) => (
                                        <div key={material._id || idx} className="border border-light-200 dark:border-dark-700 rounded-lg p-3 hover:shadow-md transition-shadow hover:bg-light-50 dark:hover:bg-dark-800/30">
                                            <div className="w-full grid grid-cols-12 gap-4 items-start">
                                                    <div className="col-span-12 sm:col-span-2">
                                                        <div className="aspect-square w-full overflow-hidden rounded-lg bg-black/5">
                                                            {material.type === "before_after" ? (
                                                                <div className="w-full h-full flex">
                                                                    <div className="w-1/2 h-full overflow-hidden">
                                                                        {material.before?.url ? (
                                                                            <img src={material.before.url} alt={material.before?.label || 'Before'} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-light-100 dark:bg-dark-700 flex items-center justify-center text-light-400 dark:text-dark-500">
                                                                                <Image className="w-6 h-6 opacity-40" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="w-1/2 h-full overflow-hidden">
                                                                        {material.after?.url ? (
                                                                            <img src={material.after.url} alt={material.after?.label || 'After'} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full bg-light-100 dark:bg-dark-700 flex items-center justify-center text-light-400 dark:text-dark-500">
                                                                                <Image className="w-6 h-6 opacity-40" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : material.type === "photo" && material.url ? (
                                                                <img src={material.url} alt={material.caption || ''} className="w-full h-full object-cover" />
                                                            ) : material.type === "video" && material.url ? (
                                                                <video src={material.url} controls className="w-full h-full object-cover" />
                                                            ) : material.type === "text" ? (
                                                                <div className="w-full h-full flex items-center justify-center text-light-400 dark:text-dark-500">
                                                                    <FileText className="w-6 h-6 opacity-40" />
                                                                </div>
                                                            ) : material.type === "html" ? (
                                                                <div className="w-full h-full flex items-center justify-center text-light-400 dark:text-dark-500">
                                                                    <Code className="w-6 h-6 opacity-40" />
                                                                </div>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-light-400 dark:text-dark-500">
                                                                    <Image className="w-6 h-6 opacity-40" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-12 sm:col-span-8">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className="inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-semibold bg-light-100 dark:bg-dark-800 text-danger-400">
                                                                    {material.type === "photo" && <Image className="w-4 h-4" />}
                                                                    {material.type === "video" && <Video className="w-4 h-4" />}
                                                                    {material.type === "before_after" && <Camera className="w-4 h-4" />}
                                                                    {material.type === "text" && <FileText className="w-4 h-4" />}
                                                                    {material.type === "html" && <Code className="w-4 h-4" />}
                                                                    <span className="uppercase">{material.type}</span>
                                                                    <span className="font-mono ml-1">#{material.order}</span>
                                                                </span>

                                                                <div className="truncate">
                                                                    {material.caption && <div className="text-sm font-medium text-light-900 dark:text-dark-50 truncate">{material.caption}</div>}
                                                                </div>
                                                            </div>

                                                          
                                                        </div>

                                                        {material.type === "photo" && material.originalName && (
                                                            <div className="mt-2 text-xs text-light-500 dark:text-dark-400">File: {material.originalName}{material.size ? ` • ${(material.size/1024).toFixed(1)}KB` : ''}</div>
                                                        )}

                                                       

                                                        {material.textContent && (
                                                            <div className="mt-2">
                                                                <div className="p-3 bg-light-100 dark:bg-dark-800 rounded-md text-sm text-light-700 dark:text-dark-300 max-h-28 overflow-auto whitespace-pre-wrap break-words">{material.textContent}</div>
                                                            </div>
                                                        )}

                                                        {material.htmlContent && (
                                                            <div className="mt-2">
                                                                <div className="p-3 bg-light-100 dark:bg-dark-800 rounded-md text-sm text-light-700 dark:text-dark-300 max-h-28 overflow-auto">
                                                                    <pre className="whitespace-pre-wrap text-xs break-words">{material.htmlContent}</pre>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="col-span-12 sm:col-span-2 sm:ml-auto flex items-center justify-end gap-2">
                                                        <button type="button" onClick={() => handleMoveMaterial(idx, "up")} title="Move up" aria-label="Move material up" className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-light-200 dark:border-dark-700 bg-white/70 dark:bg-dark-900/50 hover:bg-light-100 dark:hover:bg-dark-800 text-light-600 dark:text-dark-400 transition-colors">
                                                            <MoveUp className="w-4 h-4" />
                                                        </button>
                                                        <button type="button" onClick={() => handleMoveMaterial(idx, "down")} title="Move down" aria-label="Move material down" className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-light-200 dark:border-dark-700 bg-white/70 dark:bg-dark-900/50 hover:bg-light-100 dark:hover:bg-dark-800 text-light-600 dark:text-dark-400 transition-colors">
                                                            <MoveDown className="w-4 h-4" />
                                                        </button>
                                                        <button type="button" onClick={() => handleEditMaterial(material)} title="Edit" aria-label="Edit material" className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-light-200 dark:border-dark-700 bg-white/70 dark:bg-dark-900/50 hover:bg-light-100 dark:hover:bg-dark-800 text-light-600 dark:text-dark-400 transition-colors">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button type="button" onClick={() => handleDeleteMaterial(material._id!)} title="Delete" aria-label="Delete material" className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-danger-200 dark:border-danger-900/40 bg-white/70 dark:bg-dark-900/50 hover:bg-danger-50 dark:hover:bg-danger-950/30 text-danger-500 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                            </div>
                                        </div>
                                    ))}
                                    {form.materials.length === 0 && (
                                        <div className="text-center py-8 text-light-500 dark:text-dark-400">
                                            No materials yet. Click "Add Material" to get started.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cast Tab */}
                    {activeTab === "cast" && (
                        <div className="space-y-6">
                            <div className="card p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold text-light-900 dark:text-dark-50">Cast & Crew</h2>
                                    <button type="button" onClick={handleAddCast} className="btn-primary inline-flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Member
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {form.cast.map((member: Cast, idx: number) => (
                                        <div key={member._id || idx} className="border border-light-200 dark:border-dark-700 rounded-lg p-4 hover:shadow-md transition-shadow hover:bg-light-50 dark:hover:bg-dark-800/30">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-light-200 to-light-300 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center text-light-700 dark:text-dark-300 font-semibold">
                                                        {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="font-semibold text-light-900 dark:text-dark-50">{member.name}</h3>
                                                            {member.title && <span className="text-sm text-secdark-500">{member.title}</span>}
                                                        </div>
                                                        <div className="text-xs text-light-400 dark:text-dark-500 mt-1">Order: {member.order}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end gap-2">
                                                    <button type="button" onClick={() => handleMoveCast(idx, "up")} title="Move up" aria-label="Move cast up" className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 text-light-600 dark:text-dark-400 transition-colors">
                                                        <MoveUp className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleMoveCast(idx, "down")} title="Move down" aria-label="Move cast down" className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 text-light-600 dark:text-dark-400 transition-colors">
                                                        <MoveDown className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleEditCast(member)} title="Edit" aria-label="Edit cast member" className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 text-light-600 dark:text-dark-400 transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteCast(member._id!)} title="Delete" aria-label="Delete cast member" className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/30 text-danger-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {form.cast.length === 0 && (
                                        <div className="text-center py-8 text-light-500 dark:text-dark-400">
                                            No team members yet. Click "Add Member" to add cast or crew.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main Cover Tab */}
                    {activeTab === "media" && (
                        <div className="space-y-6">
                            <div className="card p-6">
                                <h2 className="text-lg font-semibold text-light-900 dark:text-dark-50 mb-4">Main Cover Image</h2>
                                
                                {form.mainCover ? (
                                    <div className="space-y-4">
                                        <div className="rounded-lg overflow-hidden border border-light-200 dark:border-dark-700">
                                            <img src={form.mainCover.url} alt="Main Cover" className="w-full h-auto max-h-[400px] object-contain" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-light-500 dark:text-dark-400">File Name:</span>
                                                <span className="ml-2 text-light-900 dark:text-dark-50">{form.mainCover.originalName}</span>
                                            </div>
                                         
                                            <div>
                                                <span className="text-light-500 dark:text-dark-400">Size:</span>
                                                <span className="ml-2 text-light-900 dark:text-dark-50">
                                                    {form.mainCover.size ? `${(form.mainCover.size / 1024).toFixed(2)} KB` : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="btn-secondary"
                                            >
                                                <Upload className="w-4 h-4 inline mr-2" />
                                                Replace Image
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRemoveMainCover}
                                                className="btn-danger"
                                            >
                                                <Trash2 className="w-4 h-4 inline mr-2" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-light-200 dark:border-dark-700 rounded-lg">
                                        <Camera className="w-12 h-12 text-light-400 dark:text-dark-500 mx-auto mb-3" />
                                        <p className="text-light-600 dark:text-dark-400 mb-4">No main cover image set</p>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn-primary"
                                        >
                                            <Upload className="w-4 h-4 inline mr-2" />
                                            Upload Cover Image
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleMainCoverUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-4 pt-8 mt-8 border-t border-light-200 dark:border-dark-800">
                        <div>
                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="btn-danger inline-flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Project
                                </button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-danger-600 dark:text-danger-400">
                                        Are you sure?
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={del.isPending}
                                        className="btn-danger inline-flex items-center gap-2"
                                    >
                                        {del.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        Yes, Delete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Link to={`/projects/${id}`} className="btn-ghost">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={update.isPending || saveStatus === "saving"}
                                className="btn-primary inline-flex items-center gap-2 min-w-[120px] justify-center"
                            >
                                {saveStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
                                {saveStatus === "success" && <CheckCircle className="w-4 h-4" />}
                                {saveStatus === "error" && <AlertCircle className="w-4 h-4" />}
                                {saveStatus === "idle" && <Save className="w-4 h-4" />}
                                {saveStatus === "saving" && "Saving..."}
                                {saveStatus === "success" && "Saved!"}
                                {saveStatus === "error" && "Failed!"}
                                {saveStatus === "idle" && "Save Changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Material Edit Modal */}
            {editingMaterial && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditingMaterial(null)}>
                    <div className="bg-white dark:bg-dark-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white dark:bg-dark-800 border-b border-light-200 dark:border-dark-700 p-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-light-900 dark:text-dark-50">
                                {editingMaterial._id ? "Edit Material" : "Add Material"}
                            </h3>
                            <button onClick={() => setEditingMaterial(null)} className="p-1 hover:bg-light-100 dark:hover:bg-dark-700 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Type</label>
                                <select
                                    value={editingMaterial.type}
                                    onChange={(e) => setEditingMaterial({ ...editingMaterial, type: e.target.value as any })}
                                    className="input w-full"
                                >
                                    <option value="photo">Photo</option>
                                    <option value="video">Video</option>
                                    <option value="before_after">Before/After</option>
                                    <option value="text">Text</option>
                                    <option value="html">HTML</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Caption</label>
                                <input
                                    type="text"
                                    value={editingMaterial.caption || ""}
                                    onChange={(e) => setEditingMaterial({ ...editingMaterial, caption: e.target.value })}
                                    className="input w-full"
                                />
                            </div>

                            {(editingMaterial.type === "photo" || editingMaterial.type === "video") && (
                                <>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Upload file</label>
                                        <input
                                            type="file"
                                            accept={editingMaterial.type === "photo" ? "image/*" : "video/*"}
                                            onChange={handleMaterialFileUpload}
                                            className="input w-full"
                                        />
                                    </div>

                                    {editingMaterial.url && (
                                        <div className="mt-3">
                                            {editingMaterial.type === "photo" ? (
                                                <img src={editingMaterial.url} alt={editingMaterial.caption || "preview"} className="w-full h-40 object-cover rounded" />
                                            ) : (
                                                <video src={editingMaterial.url} controls className="w-full h-40 object-cover rounded" />
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">MIME Type</label>
                                        <input
                                            type="text"
                                            value={editingMaterial.mimeType || ""}
                                            onChange={(e) => setEditingMaterial({ ...editingMaterial, mimeType: e.target.value })}
                                            className="input w-full"
                                            placeholder="image/jpeg, video/mp4..."
                                        />
                                    </div>
                                </>
                            )}

                            {editingMaterial.type === "text" && (
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Text Content</label>
                                    <textarea
                                        value={editingMaterial.textContent || ""}
                                        onChange={(e) => setEditingMaterial({ ...editingMaterial, textContent: e.target.value })}
                                        rows={6}
                                        className="input w-full resize-y"
                                    />
                                </div>
                            )}

                            {editingMaterial.type === "html" && (
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">HTML Content</label>
                                    <textarea
                                        value={editingMaterial.htmlContent || ""}
                                        onChange={(e) => setEditingMaterial({ ...editingMaterial, htmlContent: e.target.value })}
                                        rows={6}
                                        className="input w-full font-mono text-sm"
                                    />
                                </div>
                            )}

                            {editingMaterial.type === "before_after" && (
                                <>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Before Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleBeforeAfterUpload(e, 'before')}
                                            className="input w-full"
                                        />

                                        {editingMaterial.before?.url && (
                                            <div className="mt-3">
                                                <img src={editingMaterial.before.url} alt="Before preview" className="w-full h-40 object-cover rounded" />
                                                <div className="mt-2 text-xs text-light-500 dark:text-dark-400">File: {editingMaterial.before.originalName || 'Uploaded image'}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">After Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleBeforeAfterUpload(e, 'after')}
                                            className="input w-full"
                                        />

                                        {editingMaterial.after?.url && (
                                            <div className="mt-3">
                                                <img src={editingMaterial.after.url} alt="After preview" className="w-full h-40 object-cover rounded" />
                                                <div className="mt-2 text-xs text-light-500 dark:text-dark-400">File: {editingMaterial.after.originalName || 'Uploaded image'}</div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setEditingMaterial(null)} className="btn-ghost">Cancel</button>
                                <button onClick={handleSaveMaterial} className="btn-primary">Save Material</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cast Edit Modal */}
            {editingCast && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditingCast(null)}>
                    <div className="bg-white dark:bg-dark-800 rounded-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="border-b border-light-200 dark:border-dark-700 p-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-light-900 dark:text-dark-50">
                                {editingCast._id ? "Edit Team Member" : "Add Team Member"}
                            </h3>
                            <button onClick={() => setEditingCast(null)} className="p-1 hover:bg-light-100 dark:hover:bg-dark-700 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Link to existing client (optional)</label>
                                <select
                                    value={editingCast.clientId || ""}
                                    onChange={(e) => {
                                        const clientId = e.target.value || undefined;
                                        if (!clientId) {
                                            setEditingCast({ ...editingCast, clientId: undefined });
                                            return;
                                        }
                                        const chosen = (clients as Client[]).find((c) => c._id === clientId);
                                        setEditingCast({
                                            ...editingCast,
                                            clientId,
                                            name: chosen?.personal?.fullName || chosen?.business?.name || editingCast.name,
                                        });
                                    }}
                                    className="input w-full"
                                >
                                    <option value="">— Select client —</option>
                                    {(!clientsLoading && clients) && (clients as Client[]).map((c) => (
                                        <option key={c._id} value={c._id}>{c.personal?.fullName || c.business?.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Name</label>
                                <input
                                    type="text"
                                    value={editingCast.name}
                                    onChange={(e) => setEditingCast({ ...editingCast, name: e.target.value })}
                                    className="input w-full"
                                    placeholder="Full name"
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Title/Role</label>
                                <input
                                    type="text"
                                    value={editingCast.title}
                                    onChange={(e) => setEditingCast({ ...editingCast, title: e.target.value })}
                                    className="input w-full"
                                    placeholder="e.g., Creative Director, Photographer"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button onClick={() => setEditingCast(null)} className="btn-ghost">Cancel</button>
                                <button onClick={handleSaveCast} className="btn-primary">Save Member</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditProject;