import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "@/hooks/queries";
import { useLang } from "@/hooks/useLang";
// framer-motion removed (no animations on this page)
import { 
  ChevronDown, ChevronUp, Play, Maximize2, X, 
   MapPin, Users, Tag, Layers, 
    Code, FileText,  Copy, Check, Grid, List,
 User,  FolderTree,  File, Camera, Image,
  Award, Link as LinkIcon, Info, Settings, 
  Database, Trash2, Globe
} from "lucide-react";

const ProjectDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useLang();
    const tr = (key: string, fallback: string) => {
        const v = t(key);
        return !v || v === key ? fallback : v;
    };
    void tr; // to avoid unused variable warning since tr is used in JSX

    const { data: project, isLoading, error } = useProject(id);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedMedia, setSelectedMedia] = useState<any>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set([
      "overview", "materials", "cast", "identifiers", 
      "timeline", "categories", "metadata", "raw"
    ]));
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const formatBytes = (bytes: number) => {
        if (!bytes) return "N/A";
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

   

    // Helpers to avoid exposing raw IDs in the UI
    const isLikelyIdKey = (key: string) => {
        if (!key) return false;
        const k = key.toLowerCase();
        return k === '_id' || k.endsWith('id');
    };

    const sanitize = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (typeof obj === 'object') {
            const out: any = {};
            for (const k in obj) {
                if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
                if (isLikelyIdKey(k)) out[k] = 'Hidden';
                else out[k] = sanitize(obj[k]);
            }
            return out;
        }
        return obj;
    };

 

    if (isLoading) {
        return (
            <div className="min-h-screen bg-light-50 dark:bg-dark-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-light-200 dark:border-dark-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-light-500 dark:border-t-secdark-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-gradient-to-r from-light-500 to-light-600 dark:from-secdark-500 dark:to-secdark-600 rounded-sm rotate-45"></div>
                        </div>
                    </div>
                    <p className="text-light-600 dark:text-dark-400 font-light tracking-wide">Loading masterpiece...</p>
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-light-50 dark:bg-dark-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-24 h-24 mx-auto mb-6 bg-danger-50 dark:bg-danger-950/30 rounded-full flex items-center justify-center">
                        <X className="w-12 h-12 text-danger-500 dark:text-danger-400" />
                    </div>
                    <h2 className="text-2xl font-light mb-2 text-light-900 dark:text-dark-50">Project Not Found</h2>
                    <p className="text-light-600 dark:text-dark-400 mb-6">{(error as any)?.message || "The requested project doesn't exist or has been removed."}</p>
                    <Link to="/projects" className="btn-primary inline-flex">
                        Browse All Projects
                    </Link>
                </div>
            </div>
        );
    }

    const p: any = project;

    const DetailRow = ({ label, value, icon: Icon, copyable = false, copyId = "" }: any) => {
        const formatValue = (v: any) => {
            if (v === null || v === undefined || v === "") return "—";
            if (typeof v === "object") {
                if (Array.isArray(v)) return v.join(", ");
                return v.fullName ?? v.name ?? 'Hidden';
            }
            return String(v);
        };

        const copyValue = (v: any) => {
            if (v === null || v === undefined) return "";
            if (typeof v === "object") {
                return v.fullName ?? v.name ?? "";
            }
            return String(v);
        };

        const display = formatValue(value);
        const toCopy = copyValue(value);

        return (
            <div className="flex items-start justify-between py-2 border-b border-light-100 dark:border-dark-800 last:border-0">
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-4 h-4 text-light-400 dark:text-dark-500" />}
                    <span className="text-sm font-medium text-light-600 dark:text-dark-400">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-light-900 dark:text-dark-50 break-all text-right">{display}</span>
                    {copyable && toCopy && (
                        <button
                            onClick={() => copyToClipboard(toCopy, copyId)}
                            className="p-1 hover:bg-light-100 dark:hover:bg-dark-800 rounded transition-colors"
                        >
                            {copied === copyId ? <Check className="w-3 h-3 text-success-500" /> : <Copy className="w-3 h-3 text-light-400 dark:text-dark-500" />}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const Section = ({ id, title, icon: Icon, children }: any) => (
        <div className="mb-8 card p-0 overflow-hidden">
            <button
                onClick={() => toggleSection(id)}
                className="w-full flex items-center justify-between p-5 hover:bg-light-50 dark:hover:bg-dark-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-light-500 dark:text-secdark-500" />}
                    <h2 className="text-lg font-semibold text-light-900 dark:text-dark-50">{title}</h2>
                    <span className="text-xs text-light-400 dark:text-dark-500 font-mono">{id}</span>
                </div>
                {expandedSections.has(id) ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.has(id) && (
                <div className="border-t border-light-200 dark:border-dark-800 p-5">
                    {children}
                </div>
            )}
        </div>
    );

    const renderMaterialItem = (m: any, idx: number) => {
        if (!m) return null;
        const key = m._id || m.id || idx;
        const caption = m.caption || m.textContent || m.label || "";

        const MediaCard = ({ children, onClick }: any) => (
            <div
                className="group relative bg-white dark:bg-dark-800 rounded-xl overflow-hidden border border-light-200 dark:border-dark-700 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                onClick={onClick}
            >
                {children}
            </div>
        );

        switch (m.type) {
            case "photo":
                return (
                    <MediaCard key={key} onClick={() => setSelectedMedia(m)}>
                        <div className="relative aspect-square overflow-hidden">
                                    <img src={m.url} alt={caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                                Photo #{m.order}
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            {caption && <p className="text-sm text-light-600 dark:text-dark-400 line-clamp-2">{caption}</p>}
                            <div className="text-xs text-light-400 dark:text-dark-500 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span>{m.mimeType || "image"}</span>
                                </div>
                                {m.size && <div className="flex items-center justify-between">
                                    <span>Size:</span>
                                    <span>{formatBytes(m.size)}</span>
                                </div>}
                                {m.originalName && <div className="truncate" title={m.originalName}>
                                    <span>Original: {m.originalName}</span>
                                </div>}
                            </div>
                        </div>
                    </MediaCard>
                );

            case "video":
                return (
                    <MediaCard key={key} onClick={() => setSelectedMedia(m)}>
                        <div className="relative aspect-square overflow-hidden bg-black">
                            <video
                                ref={el => { if (el) videoRefs.current[key] = el; }}
                                src={m.url}
                                className="w-full h-full object-cover"
                                poster={m.thumbnail}
                                preload="metadata"
                                muted
                                playsInline
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                                    <Play className="w-6 h-6 text-black ml-0.5" />
                                </div>
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                                Video #{m.order}
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            {caption && <p className="text-sm text-light-600 dark:text-dark-400">{caption}</p>}
                            <div className="text-xs text-light-400 dark:text-dark-500 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span>{m.mimeType || "video"}</span>
                                </div>
                                {m.size && <div>Size: {formatBytes(m.size)}</div>}
                                {m.originalName && <div className="truncate">{m.originalName}</div>}
                            </div>
                        </div>
                    </MediaCard>
                );

            case "before_after":
                return (
                    <MediaCard key={key}>
                        <div className="relative aspect-square overflow-hidden">
                            <div className="absolute inset-0 flex">
                                <div className="w-1/2 overflow-hidden relative">
                                    {m.before?.url ? (
                                        <img src={m.before.url} alt={m.before?.label} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-light-100 dark:bg-dark-700 flex items-center justify-center text-light-400 dark:text-dark-500">
                                            <Image className="w-6 h-6 opacity-40" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{m.before?.label || "Before"}</div>
                                </div>
                                <div className="w-1/2 overflow-hidden relative">
                                    {m.after?.url ? (
                                        <img src={m.after.url} alt={m.after?.label} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-light-100 dark:bg-dark-700 flex items-center justify-center text-light-400 dark:text-dark-500">
                                            <Image className="w-6 h-6 opacity-40" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{m.after?.label || "After"}</div>
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                                <div className="w-0.5 h-4 bg-black"></div>
                            </div>
                        </div>
                        <div className="p-3">
                            {caption && <p className="text-sm text-light-600 dark:text-dark-400 mb-2">{caption}</p>}
                            <div className="text-xs text-light-400 dark:text-dark-500">
                                <div>Order: {m.order}</div>
                                <div className="mt-1">Before: {m.before?.type} • After: {m.after?.type}</div>
                            </div>
                        </div>
                    </MediaCard>
                );

            case "text":
                return (
                    <div
                        key={key}
                        className="bg-light-50 dark:bg-dark-800/50 rounded-xl p-4 border border-light-200 dark:border-dark-700"
                    >
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-light-500 dark:text-secdark-500 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    {caption && <p className="text-xs text-light-500 dark:text-secdark-400 font-medium">{caption}</p>}
                                    <span className="text-xs text-light-400 dark:text-dark-500">Text #{m.order}</span>
                                </div>
                                <p className="text-light-700 dark:text-dark-300 whitespace-pre-wrap">{m.textContent}</p>
                                <div className="mt-2 pt-2 border-t border-light-200 dark:border-dark-700 text-xs text-light-400 dark:text-dark-500">
                                    {/* ID removed for privacy */}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "html":
                return (
                    <div
                        key={key}
                        className="bg-light-50 dark:bg-dark-800/50 rounded-xl p-4 border border-light-200 dark:border-dark-700"
                    >
                        <div className="flex items-start gap-3">
                            <Code className="w-5 h-5 text-light-500 dark:text-secdark-500 mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    {caption && <p className="text-xs text-light-500 dark:text-secdark-400 font-medium">{caption}</p>}
                                    <span className="text-xs text-light-400 dark:text-dark-500">HTML #{m.order}</span>
                                </div>
                                <div className="prose prose-sm max-w-none text-light-700 dark:text-dark-300" dangerouslySetInnerHTML={{ __html: m.htmlContent }} />
                                <div className="mt-2 pt-2 border-t border-light-200 dark:border-dark-700 text-xs text-light-400 dark:text-dark-500">
                                    {/* ID removed for privacy */}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div
                        key={key}
                        className="bg-light-50 dark:bg-dark-800/50 rounded-xl p-4 border border-light-200 dark:border-dark-700"
                    >
                        <div className="text-xs text-light-500 dark:text-secdark-400 mb-2">Unknown Type: {m.type}</div>
                            <pre className="text-xs overflow-auto text-light-700 dark:text-dark-300">{JSON.stringify(sanitize(m), null, 2)}</pre>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-light-50 dark:bg-dark-950">
            {/* Card-like Hero */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="relative rounded-2xl bg-light-50/5 dark:bg-dark-950/70 border border-light-100 dark:border-dark-800 p-6 lg:p-8 shadow-xl overflow-hidden">
                    {/* background removed per design — plain card */}

                    <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-wider text-light-400 dark:text-dark-300">Project Library</span>
                                <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-semibold text-light-900 dark:text-dark-50 leading-tight">{p.name}</h1>
                                <p className="mt-2 text-sm text-light-600 dark:text-dark-400 max-w-3xl">{p.description}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Link to="/projects" className="btn-ghost">Back</Link>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-white/5 dark:bg-dark-800/40 border border-light-100 dark:border-dark-700">
                                <div className="text-xs text-light-400 dark:text-dark-400 uppercase">Materials</div>
                                <div className="mt-2 text-2xl font-bold text-light-700 dark:text-secdark-500">{p.material?.length || 0}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 dark:bg-dark-800/40 border border-light-100 dark:border-dark-700">
                                <div className="text-xs text-light-400 dark:text-dark-400 uppercase">Team Members</div>
                                <div className="mt-2 text-2xl font-bold text-light-700 dark:text-secdark-500">{p.cast?.length || 0}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-white/5 dark:bg-dark-800/40 border border-light-100 dark:border-dark-700">
                                <div className="text-xs text-light-400 dark:text-dark-400 uppercase">Categories</div>
                                <div className="mt-2 text-2xl font-bold text-light-700 dark:text-secdark-500">{p.categories?.length || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* View Controls */}
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-light-200 dark:border-dark-800">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === "grid" 
                                    ? "bg-light-500 text-white dark:bg-secdark-700 dark:text-white" 
                                    : "bg-light-100 dark:bg-dark-800 text-light-600 dark:text-dark-400 hover:bg-light-200 dark:hover:bg-dark-700"
                            }`}
                        >
                            <Grid className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === "list" 
                                    ? "bg-light-500 text-white dark:bg-secdark-700 dark:text-white" 
                                    : "bg-light-100 dark:bg-dark-800 text-light-600 dark:text-dark-400 hover:bg-light-200 dark:hover:bg-dark-700"
                            }`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="text-sm text-light-500 dark:text-secdark-400">
                        {p.material?.length || 0} materials • {p.cast?.length || 0} team members
                    </div>
                </div>

                {/* Section: Basic Overview */}
                <Section id="overview" title="Project Overview" icon={Info}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                            <DetailRow label="Project Name" value={p.name} icon={FolderTree} copyable copyId="name" />
                            <DetailRow label="Description" value={p.description} icon={FileText} />
                            <DetailRow label="Location" value={p.location} icon={MapPin} copyable copyId="location" />
                            <DetailRow label="Parent Project" value={typeof p.parentProject === 'object' ? (p.parentProject?.name || 'Hidden') : 'Hidden'} icon={LinkIcon} />
                        </div>
                        <div className="space-y-3">
                            <DetailRow label="Published" value={p.published ? "Yes ✓" : "No ✗"} icon={Globe} />
                            <DetailRow label="Deleted" value={p.deleted ? "Yes (Archived)" : "No"} icon={Trash2} />
                            <DetailRow label="Internal Version" value={p.__v !== undefined ? `v${p.__v}` : "N/A"} icon={Settings} />
                            <DetailRow label="Created By" value={typeof p.createdBy === 'object' ? (p.createdBy.fullName || p.createdBy.name || 'Hidden') : 'Hidden'} icon={User} />
                        </div>
                    </div>
                </Section>

               

                {/* Section: Categories & Tags */}
                <Section id="categories" title="Categories & Tags" icon={Tag}>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-light-700 dark:text-dark-300 mb-3">Categories</h3>
                            <div className="flex flex-wrap gap-2">
                                {p.categories?.map((cat: string) => (
                                    <span key={cat} className="px-3 py-1.5 bg-light-500 text-white dark:bg-secdark-700 dark:text-white rounded-lg text-sm">
                                        {cat}
                                    </span>
                                )) || <span className="text-light-400 dark:text-dark-500">No categories</span>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-light-700 dark:text-dark-300 mb-3">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {p.tags?.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1.5 bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-300 rounded-lg text-sm">
                                        #{tag}
                                    </span>
                                )) || <span className="text-light-400 dark:text-dark-500">No tags</span>}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-light-700 dark:text-dark-300 mb-3">Project Types</h3>
                            <div className="flex flex-wrap gap-2">
                                {p.types?.map((type: string) => (
                                    <span key={type} className="px-3 py-1.5 border border-light-200 dark:border-dark-700 text-light-700 dark:text-dark-300 rounded-lg text-sm">
                                        {type}
                                    </span>
                                )) || <span className="text-light-400 dark:text-dark-500">No types</span>}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Section: Materials & Media */}
                <Section id="materials" title="Materials & Media" icon={Layers}>
                    <div className="mb-4 text-sm text-light-500 dark:text-secdark-400">
                        Total: {p.material?.length || 0} items • Types: {p.material?.map((m: any) => m.type).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(", ") || "None"}
                    </div>
                    <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "space-y-4"
                    }>
                        {(p.material || []).map((m: any, idx: number) => renderMaterialItem(m, idx))}
                    </div>
                </Section>

                {/* Section: Cast & Crew */}
                <Section id="cast" title="Cast & Crew" icon={Users}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(p.cast || []).sort((a: any, b: any) => a.order - b.order).map((c: any) => (
                            <div
                                key={c._id || c.name}
                                className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-light-200 dark:border-dark-700 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-light-200 to-light-300 dark:from-dark-700 dark:to-dark-600 rounded-full flex items-center justify-center">
                                            <span className="text-lg font-medium text-light-600 dark:text-dark-300">
                                                {c.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-light-900 dark:text-dark-50">{c.name}</h3>
                                            <p className="text-sm text-light-500 dark:text-secdark-400">{c.title}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-light-400 dark:text-dark-500">Order: {c.order}</span>
                                </div>
                                <div className="text-xs text-light-400 dark:text-dark-500 pt-2 border-t border-light-100 dark:border-dark-700">
                                    {/* ID removed for privacy */}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

               

                {/* Section: Main Cover */}
                {p.mainCover && (
                    <Section id="mainCover" title="Main Cover Details" icon={Camera}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="rounded-lg overflow-hidden border border-light-200 dark:border-dark-700">
                                <img src={p.mainCover.url} alt={p.name} className="w-full h-auto" />
                            </div>
                            <div className="space-y-3">
                                <DetailRow label="MIME Type" value={p.mainCover.mimeType} icon={File} />
                                <DetailRow label="Original Name" value={p.mainCover.originalName} icon={FileText} />
                                <DetailRow label="Size" value={formatBytes(p.mainCover.size)} icon={Database} />
                            </div>
                        </div>
                    </Section>
                )}

                

              

                {/* Section: Statistics */}
                <Section id="stats" title="Statistics & Summary" icon={Award}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="text-center p-4 bg-light-50 dark:bg-dark-800/50 rounded-lg border border-light-200 dark:border-dark-700">
                            <div className="text-2xl font-bold text-light-500 dark:text-secdark-500">{p.material?.length || 0}</div>
                            <div className="text-xs text-light-600 dark:text-dark-400">Materials</div>
                        </div>
                        <div className="text-center p-4 bg-light-50 dark:bg-dark-800/50 rounded-lg border border-light-200 dark:border-dark-700">
                            <div className="text-2xl font-bold text-light-500 dark:text-secdark-500">{p.cast?.length || 0}</div>
                            <div className="text-xs text-light-600 dark:text-dark-400">Team Members</div>
                        </div>
                        <div className="text-center p-4 bg-light-50 dark:bg-dark-800/50 rounded-lg border border-light-200 dark:border-dark-700">
                            <div className="text-2xl font-bold text-light-500 dark:text-secdark-500">{p.categories?.length || 0}</div>
                            <div className="text-xs text-light-600 dark:text-dark-400">Categories</div>
                        </div>
                        <div className="text-center p-4 bg-light-50 dark:bg-dark-800/50 rounded-lg border border-light-200 dark:border-dark-700">
                            <div className="text-2xl font-bold text-light-500 dark:text-secdark-500">{p.tags?.length || 0}</div>
                            <div className="text-xs text-light-600 dark:text-dark-400">Tags</div>
                        </div>
                        <div className="text-center p-4 bg-light-50 dark:bg-dark-800/50 rounded-lg border border-light-200 dark:border-dark-700">
                            <div className="text-2xl font-bold text-light-500 dark:text-secdark-500">{p.types?.length || 0}</div>
                            <div className="text-xs text-light-600 dark:text-dark-400">Project Types</div>
                        </div>
                        <div className="text-center p-4 bg-light-50 dark:bg-dark-800/50 rounded-lg border border-light-200 dark:border-dark-700">
                            <div className="text-2xl font-bold text-light-500 dark:text-secdark-500">{Object.keys(p).length}</div>
                            <div className="text-xs text-light-600 dark:text-dark-400">Total Fields</div>
                        </div>
                    </div>
                </Section>
            </div>

            {/* Media Modal */}
            {selectedMedia && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <div
                        className="relative w-full max-w-6xl max-h-[90vh] bg-black rounded-xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedMedia(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                            {selectedMedia.type === "photo" && (
                                <img src={selectedMedia.url} alt={selectedMedia.caption} className="w-full h-auto max-h-[90vh] object-contain" />
                            )}
                        
                            {selectedMedia.type === "video" && (
                                <video controls autoPlay src={selectedMedia.url} className="w-full h-auto max-h-[90vh]" />
                            )}
                        
                        {selectedMedia.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                <p className="text-white text-center">{selectedMedia.caption}</p>
                                <div className="text-xs text-white/60 text-center mt-1">
                                            {/* ID removed for privacy */}
                                        </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectDetails;