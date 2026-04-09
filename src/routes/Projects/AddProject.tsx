import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { useCreateProject, useClients, useProjectCategories, useProjectTypes } from "@/hooks/queries";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { isDataUrl, uploadDataUrlToCloudinary } from "@/utils/cloudinaryUpload";
import { compressImageFileToMaxBytes } from "@/utils/imageCompression";
import type { Client } from "@/api/interfaces/clientinterface";
import { Autocomplete, TextField } from "@mui/material";
import { 
    Plus, X, ArrowLeft, CheckCircle, AlertCircle,
    Trash2, Edit, MapPin, Users, Layers,
    Image as ImageIcon, Video, Code, Upload, GripVertical,
    Camera, User, FileText, Info
} from "lucide-react";

interface Material {
  _id?: string;
    type: "photo" | "bulk" | "video" | "before_after" | "text" | "html";
  order: number;
  caption?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  originalName?: string;
    items?: PhotoMaterialItem[];
  textContent?: string;
  htmlContent?: string;
    before?: { url: string; label?: string; type?: string; mimeType?: string; originalName?: string; size?: number };
    after?: { url: string; label?: string; type?: string; mimeType?: string; originalName?: string; size?: number };
}

interface PhotoMaterialItem {
    url: string;
    mimeType?: string;
    size?: number;
    originalName?: string;
    type?: "photo";
}

interface Cast {
    _id?: string;
    name: string;
    title: string;
    order: number;
    clientId?: string;
}

const MAX_PHOTO_THUMBNAIL_BYTES = 50 * 1024;

const AddProject: React.FC = () => {
    const { t } = useLang();
    const navigate = useNavigate();
    const tr = (key: string, fallback: string) => {
        const v = t(key);
        return !v || v === key ? fallback : v;
    };
    void tr; // avoid unused variable warning
    
    const mutation = useCreateProject();
    const { data: clients = [], isLoading: clientsLoading } = useClients();
    const { data: projectCategories = [], isLoading: projectCategoriesLoading } = useProjectCategories();
    const { data: projectTypes = [], isLoading: projectTypesLoading } = useProjectTypes();
    
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
    
    const [newTag, setNewTag] = useState("");
    const [activeTab, setActiveTab] = useState<"basic" | "materials" | "cast" | "media">("basic");
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [draggedMaterialIndex, setDraggedMaterialIndex] = useState<number | null>(null);
    const [editingCast, setEditingCast] = useState<Cast | null>(null);
    const [draggedCastIndex, setDraggedCastIndex] = useState<number | null>(null);
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const displayImgRef = useRef<HTMLImageElement | null>(null);
    const loadedImgRef = useRef<HTMLImageElement | null>(null);
    const [mainCoverMeta, setMainCoverMeta] = useState<{ width: number; height: number } | null>(null);
    const [cropEnabled, setCropEnabled] = useState(false);
    const [cropCenter, setCropCenter] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
    const [zoom, setZoom] = useState(1);
    const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
    const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef<{ x: number; y: number; center: { x: number; y: number } }>({ x: 0, y: 0, center: { x: 0.5, y: 0.5 } });

    const getOptionLabel = (value: any): string => {
        if (typeof value === "string") return value;
        if (!value || typeof value !== "object") return "";
        return value.name || value.title || value.label || value.value || value._id || value.id || "";
    };

    const getOptionValue = (value: any): string => {
        if (typeof value === "string") return value.trim();
        if (!value || typeof value !== "object") return "";
        return value._id || value.id || value.name || value.title || value.value || "";
    };

    const normalizeArrayField = (arr: any[] = []): string[] =>
        arr
            .map((item) => getOptionValue(item))
            .filter((item, index, all) => !!item && all.indexOf(item) === index);

    const normalizeTaxonomyArrayField = (arr: any[] = []): string[] =>
        arr
            .map((item) => {
                if (typeof item === "string") return item.trim();
                if (!item || typeof item !== "object") return "";
                const existingId = String(item._id || item.id || "").trim();
                if (existingId) return existingId;
                return getOptionLabel(item).trim();
            })
            .filter((item, index, all) => !!item && all.indexOf(item) === index);

    const isSameOption = (a: any, b: any): boolean => {
        const aId = a && typeof a === "object" ? String(a._id || a.id || "").trim() : "";
        const bId = b && typeof b === "object" ? String(b._id || b.id || "").trim() : "";
        if (aId && bId) return aId === bId;

        return getOptionLabel(a).trim().toLowerCase() === getOptionLabel(b).trim().toLowerCase();
    };

    const taxonomyAutocompleteSx = {
        fontFamily: "inherit",
        "& .MuiOutlinedInput-root": {
            minHeight: "2.5rem",
            borderRadius: "0.75rem",
            backgroundColor: "var(--color-white)",
            fontFamily: "inherit",
            "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--color-light-200)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--color-light-300)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--color-light-500)",
            },
        },
        "& .MuiInputBase-input, & .MuiAutocomplete-input": {
            color: "var(--color-light-900)",
            fontSize: "0.875rem",
            fontFamily: "inherit",
            textTransform: "none",
        },
        "& .MuiInputBase-input::placeholder, & .MuiAutocomplete-input::placeholder": {
            color: "var(--color-light-400)",
            opacity: 1,
        },
        "& .MuiChip-root": {
            borderRadius: "0.5rem",
            backgroundColor: "var(--color-light-100)",
            color: "var(--color-light-700)",
            border: "1px solid var(--color-light-200)",
            height: "1.6rem",
            fontFamily: "inherit",
        },
        "& .MuiChip-label": {
            fontFamily: "inherit",
            textTransform: "none",
        },
        "& .MuiChip-deleteIcon": {
            color: "var(--color-light-500)",
        },
        "& .MuiAutocomplete-popupIndicator, & .MuiAutocomplete-clearIndicator": {
            color: "var(--color-light-500)",
        },
        ".dark & .MuiOutlinedInput-root": {
            backgroundColor: "var(--color-dark-900)",
        },
        ".dark & .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--color-dark-700)",
        },
        ".dark & .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--color-dark-600)",
        },
        ".dark & .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--color-secdark-700)",
        },
        ".dark & .MuiInputBase-input, .dark & .MuiAutocomplete-input": {
            color: "var(--color-dark-50)",
            fontFamily: "inherit",
        },
        ".dark & .MuiInputBase-input::placeholder, .dark & .MuiAutocomplete-input::placeholder": {
            color: "var(--color-dark-500)",
            opacity: 1,
        },
        ".dark & .MuiChip-root": {
            backgroundColor: "var(--color-dark-800)",
            color: "var(--color-dark-200)",
            borderColor: "var(--color-dark-700)",
            fontFamily: "inherit",
        },
        ".dark & .MuiChip-deleteIcon": {
            color: "var(--color-dark-400)",
        },
        ".dark & .MuiAutocomplete-popupIndicator, .dark & .MuiAutocomplete-clearIndicator": {
            color: "var(--color-dark-400)",
        },
    };

    const taxonomyAutocompleteSlotProps = {
        paper: {
            sx: {
                fontFamily: "inherit",
                mt: "0.5rem",
                borderRadius: "0.9rem",
                border: "1px solid var(--color-light-200)",
                backgroundColor: "var(--color-light-50)",
                color: "var(--color-light-900)",
                boxShadow: "0 20px 40px rgba(17, 24, 39, 0.12)",
                overflow: "hidden",
                "& .MuiAutocomplete-listbox": {
                    padding: "0.4rem",
                    maxHeight: "18rem",
                },
                "& .MuiAutocomplete-option": {
                    fontFamily: "inherit",
                    fontSize: "0.875rem",
                    textTransform: "none",
                    borderRadius: "0.625rem",
                    minHeight: "2.25rem",
                    color: "var(--color-light-900)",
                    transition: "background-color 160ms ease, color 160ms ease",
                },
                "& .MuiAutocomplete-option.Mui-focused": {
                    backgroundColor: "var(--color-light-100)",
                },
                "& .MuiAutocomplete-option[aria-selected='true']": {
                    backgroundColor: "var(--color-light-200)",
                    color: "var(--color-light-800)",
                    fontWeight: 600,
                },
                "& .MuiAutocomplete-option[aria-selected='true'].Mui-focused": {
                    backgroundColor: "var(--color-light-300)",
                },
                "& .MuiAutocomplete-noOptions": {
                    fontFamily: "inherit",
                    fontSize: "0.875rem",
                    color: "var(--color-light-500)",
                },
                ".dark &": {
                    borderColor: "var(--color-dark-700)",
                    backgroundColor: "var(--color-dark-900)",
                    color: "var(--color-dark-50)",
                    boxShadow: "0 20px 48px rgba(0, 0, 0, 0.45)",
                },
                ".dark & .MuiAutocomplete-option": {
                    color: "var(--color-dark-100, var(--color-dark-50))",
                },
                ".dark & .MuiAutocomplete-option.Mui-focused": {
                    backgroundColor: "var(--color-dark-800)",
                },
                ".dark & .MuiAutocomplete-option[aria-selected='true']": {
                    backgroundColor: "rgba(185, 28, 28, 0.24)",
                    color: "var(--color-dark-50)",
                },
                ".dark & .MuiAutocomplete-option[aria-selected='true'].Mui-focused": {
                    backgroundColor: "rgba(185, 28, 28, 0.36)",
                },
                ".dark & .MuiAutocomplete-noOptions": {
                    color: "var(--color-dark-400)",
                },
            },
        },
        popper: {
            sx: {
                zIndex: 1400,
            },
        },
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setForm({ ...form, [name]: checked });
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    // Tag Management
    const handleAddTag = () => {
        const next = newTag.trim();
        const exists = form.tags.some((t: any) => getOptionLabel(t).toLowerCase() === next.toLowerCase());
        if (next && !exists) {
            setForm({ ...form, tags: [...form.tags, next] });
            setNewTag("");
        }
    };

    const handleRemoveTag = (tag: any) => {
        setForm({ ...form, tags: form.tags.filter((t: any) => !isSameOption(t, tag)) });
    };

    const readFileAsDataUrl = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });

    const isPhotoMaterialType = (type?: string): boolean => type === "photo" || type === "bulk";

    const buildPhotoItems = (material: Partial<Material>): PhotoMaterialItem[] => {
        const merged: PhotoMaterialItem[] = [];

        if (material.url) {
            merged.push({
                url: material.url,
                mimeType: material.mimeType,
                originalName: material.originalName,
                size: material.size,
                type: "photo",
            });
        }

        if (Array.isArray(material.items)) {
            material.items
                .filter((item): item is PhotoMaterialItem => !!item?.url)
                .forEach((item) => {
                    merged.push({
                        url: item.url,
                        mimeType: item.mimeType || material.mimeType,
                        originalName: item.originalName,
                        size: item.size,
                        type: "photo",
                    });
                });
        }

        const seen = new Set<string>();
        return merged.filter((item) => {
            const key = item.url.trim();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const normalizePhotoMaterial = (material: Material): Material => {
        if (!isPhotoMaterialType(material.type)) {
            return material;
        }

        const items = buildPhotoItems(material);
        const primary = items[0];

        return {
            ...material,
            type: "photo",
            items,
            url: primary?.url || "",
            mimeType: primary?.mimeType || material.mimeType,
            originalName: primary?.originalName || material.originalName,
            size: primary?.size || material.size,
        };
    };

    // Material Management
    const handleAddMaterial = () => {
        const newMaterial: Material = {
            type: "photo",
            order: form.materials.length + 1,
            caption: "",
            url: "",
            mimeType: "image/jpeg",
            items: [],
        };
        setEditingMaterial(newMaterial);
    };

    const handleEditMaterial = (material: Material) => {
        const normalized = isPhotoMaterialType(material.type) ? normalizePhotoMaterial({ ...material }) : { ...material };
        setEditingMaterial(normalized);
    };

    const handleSaveMaterial = () => {
        if (editingMaterial) {
            const materialToSave = isPhotoMaterialType(editingMaterial.type) ? normalizePhotoMaterial(editingMaterial) : editingMaterial;
            if (editingMaterial._id) {
                // Update existing
                setForm({
                    ...form,
                    materials: form.materials.map((m: Material) =>
                        m._id === editingMaterial._id ? materialToSave : m
                    ),
                });
            } else {
                // Add new
                setForm({
                    ...form,
                    materials: [...form.materials, { ...materialToSave, order: form.materials.length + 1 }],
                });
            }
            setEditingMaterial(null);
        }
    };

    const handleMaterialFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length || !editingMaterial) return;

        try {
            if (editingMaterial.type === "photo") {
                const uploadedItems: PhotoMaterialItem[] = await Promise.all(
                    files.map(async (file) => {
                        const optimizedFile = await compressImageFileToMaxBytes(file, {
                            maxBytes: MAX_PHOTO_THUMBNAIL_BYTES,
                        });

                        return {
                            url: await readFileAsDataUrl(optimizedFile),
                            mimeType: optimizedFile.type || file.type,
                            size: optimizedFile.size || file.size,
                            originalName: optimizedFile.name || file.name,
                            type: "photo" as const,
                        };
                    })
                );

                setEditingMaterial((prev) => {
                    if (!prev || prev.type !== "photo") return prev;
                    const items = [...buildPhotoItems(prev), ...uploadedItems];
                    const primary = items[0];
                    return {
                        ...prev,
                        items,
                        url: primary?.url || "",
                        mimeType: primary?.mimeType || prev.mimeType,
                        size: primary?.size || prev.size,
                        originalName: primary?.originalName || prev.originalName,
                    };
                });
            } else {
                const file = files[0];
                const dataUrl = await readFileAsDataUrl(file);
                setEditingMaterial((prev) =>
                    prev
                        ? {
                              ...prev,
                              url: dataUrl,
                              mimeType: file.type,
                              size: file.size,
                              originalName: file.name,
                          }
                        : prev
                );
            }
        } catch {
            // Ignore file read errors and keep the current editor state unchanged.
        } finally {
            e.target.value = "";
        }
    };

    const handleRemovePhotoItem = (itemIndex: number) => {
        setEditingMaterial((prev) => {
            if (!prev || prev.type !== "photo") return prev;
            const items = buildPhotoItems(prev).filter((_, idx) => idx !== itemIndex);
            const primary = items[0];
            return {
                ...prev,
                items,
                url: primary?.url || "",
                mimeType: primary?.mimeType,
                originalName: primary?.originalName,
                size: primary?.size,
            };
        });
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

    const handleMaterialDragStart = (index: number) => {
        setDraggedMaterialIndex(index);
    };

    const handleMaterialDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleMaterialDrop = (targetIndex: number) => {
        if (draggedMaterialIndex === null || draggedMaterialIndex === targetIndex) {
            setDraggedMaterialIndex(null);
            return;
        }

        setForm((prev: any) => {
            const nextMaterials = [...prev.materials];
            const [moved] = nextMaterials.splice(draggedMaterialIndex, 1);
            nextMaterials.splice(targetIndex, 0, moved);
            return {
                ...prev,
                materials: nextMaterials.map((m: Material, idx: number) => ({ ...m, order: idx + 1 })),
            };
        });
        setDraggedMaterialIndex(null);
    };

    const handleMaterialDragEnd = () => {
        setDraggedMaterialIndex(null);
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

    const handleDeleteCast = (castIndex: number) => {
        setForm((prev: any) => {
            const nextCast = prev.cast.filter((_: Cast, idx: number) => idx !== castIndex);
            return {
                ...prev,
                cast: nextCast.map((c: Cast, idx: number) => ({ ...c, order: idx + 1 })),
            };
        });
    };

    const handleCastDragStart = (index: number) => {
        setDraggedCastIndex(index);
    };

    const handleCastDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleCastDrop = (targetIndex: number) => {
        if (draggedCastIndex === null || draggedCastIndex === targetIndex) {
            setDraggedCastIndex(null);
            return;
        }

        setForm((prev: any) => {
            const nextCast = [...prev.cast];
            const [moved] = nextCast.splice(draggedCastIndex, 1);
            nextCast.splice(targetIndex, 0, moved);
            return {
                ...prev,
                cast: nextCast.map((c: Cast, idx: number) => ({ ...c, order: idx + 1 })),
            };
        });

        setDraggedCastIndex(null);
    };

    const handleCastDragEnd = () => {
        setDraggedCastIndex(null);
    };

    // Main Cover Management
    const handleMainCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                // load image to read natural dimensions
                const img = new Image();
                img.onload = () => {
                    loadedImgRef.current = img;
                    setMainCoverMeta({ width: img.naturalWidth, height: img.naturalHeight });
                    setCroppedPreview(null);
                    setCropCenter({ x: 0.5, y: 0.5 });
                    setZoom(1);
                    setCropEnabled(true);
                    setForm({
                        ...form,
                        mainCover: {
                            url: dataUrl,
                            mimeType: file.type,
                            originalName: file.name,
                            size: file.size,
                        },
                    });
                };
                img.src = dataUrl;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveMainCover = () => {
        setForm({ ...form, mainCover: null });
        loadedImgRef.current = null;
        setMainCoverMeta(null);
        setCroppedPreview(null);
        setCropEnabled(false);
        setOverlayStyle({});
    };

    const updateOverlayStyle = () => {
        if (!form.mainCover || !loadedImgRef.current || !displayImgRef.current || !mainCoverMeta) return;
        const imgEl = displayImgRef.current;
        const rect = imgEl.getBoundingClientRect();
        const displayedW = rect.width;
        const scale = displayedW / mainCoverMeta.width;
        const sideNat = Math.min(mainCoverMeta.width, mainCoverMeta.height) / zoom;
        const cx = clamp(cropCenter.x, 0, 1) * mainCoverMeta.width;
        const cy = clamp(cropCenter.y, 0, 1) * mainCoverMeta.height;
        let sx = cx - sideNat / 2;
        let sy = cy - sideNat / 2;
        sx = clamp(sx, 0, mainCoverMeta.width - sideNat);
        sy = clamp(sy, 0, mainCoverMeta.height - sideNat);
        const left = sx * scale;
        const top = sy * scale;
        const sidePx = sideNat * scale;
        setOverlayStyle({ left: `${left}px`, top: `${top}px`, width: `${sidePx}px`, height: `${sidePx}px` });
    };

    const generateCropPreview = () => {
        if (!form.mainCover || !loadedImgRef.current || !mainCoverMeta) return;
        const img = loadedImgRef.current;
        const naturalW = mainCoverMeta.width;
        const naturalH = mainCoverMeta.height;
        const side = Math.min(naturalW, naturalH) / zoom;
        const cx = clamp(cropCenter.x, 0, 1) * naturalW;
        const cy = clamp(cropCenter.y, 0, 1) * naturalH;
        let sx = Math.round(cx - side / 2);
        let sy = Math.round(cy - side / 2);
        sx = Math.max(0, Math.min(sx, Math.round(naturalW - side)));
        sy = Math.max(0, Math.min(sy, Math.round(naturalH - side)));

        const canvas = document.createElement('canvas');
        const maxSize = 1200;
        let outSize = Math.round(side);
        if (outSize > maxSize) { outSize = maxSize; }
        canvas.width = outSize;
        canvas.height = outSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
        const dataUrl = canvas.toDataURL(form.mainCover.mimeType || 'image/jpeg', 0.9);
        setCroppedPreview(dataUrl);
        // store crop metadata
        setForm((prev: any) => ({ ...prev, mainCover: { ...prev.mainCover, croppedUrl: dataUrl, crop: { center: cropCenter, zoom } } }));
    };

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    const onPointerMoveWindow = (ev: PointerEvent) => {
        if (!isDraggingRef.current || !displayImgRef.current || !mainCoverMeta) return;
        const dx = ev.clientX - dragStartRef.current.x;
        const dy = ev.clientY - dragStartRef.current.y;
        const rect = displayImgRef.current.getBoundingClientRect();
        const scale = rect.width / mainCoverMeta.width;
        const deltaNaturalX = dx / scale;
        const deltaNaturalY = dy / scale;
        const newCenterX = clamp((dragStartRef.current.center.x * mainCoverMeta.width + deltaNaturalX) / mainCoverMeta.width, 0, 1);
        const newCenterY = clamp((dragStartRef.current.center.y * mainCoverMeta.height + deltaNaturalY) / mainCoverMeta.height, 0, 1);
        setCropCenter({ x: newCenterX, y: newCenterY });
    };

    const onPointerUpWindow = () => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
        window.removeEventListener('pointermove', onPointerMoveWindow);
        window.removeEventListener('pointerup', onPointerUpWindow);
    };

    const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!cropEnabled || !displayImgRef.current || !mainCoverMeta) return;
        e.preventDefault();
        e.stopPropagation();
        isDraggingRef.current = true;
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY, center: { ...cropCenter } };
        window.addEventListener('pointermove', onPointerMoveWindow);
        window.addEventListener('pointerup', onPointerUpWindow);
    };

    const handleImageClickToCenter = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!cropEnabled || !displayImgRef.current || !mainCoverMeta || isDraggingRef.current) return;
        const rect = displayImgRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const scale = rect.width / mainCoverMeta.width;
        const naturalX = px / scale;
        const naturalY = py / scale;
        setCropCenter({ x: clamp(naturalX / mainCoverMeta.width, 0, 1), y: clamp(naturalY / mainCoverMeta.height, 0, 1) });
    };

    useEffect(() => {
        if (cropEnabled) {
            // update overlay and preview when crop values change
            updateOverlayStyle();
            generateCropPreview();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cropEnabled, cropCenter.x, cropCenter.y, zoom, mainCoverMeta, form.mainCover]);

    useEffect(() => {
        const onResize = () => updateOverlayStyle();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mainCoverMeta, form.mainCover, cropCenter, zoom]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!form.name.trim()) {
            alert("Project name is required");
            return;
        }
        
        setSaveStatus("saving");
        
        try {
            const uploadAssetIfNeeded = async (
                asset: { url?: string; mimeType?: string; size?: number; originalName?: string },
                resourceType: "image" | "video",
                fallbackFileName: string,
            ) => {
                if (!asset?.url || !isDataUrl(asset.url)) {
                    return asset;
                }

                const uploaded = await uploadDataUrlToCloudinary(asset.url, {
                    resourceType,
                    fileName: asset.originalName || fallbackFileName,
                });

                return {
                    ...asset,
                    url: uploaded.url,
                    mimeType: uploaded.mimeType || asset.mimeType,
                    size: uploaded.size || asset.size,
                    originalName: uploaded.originalName || asset.originalName || fallbackFileName,
                };
            };

            // Prepare data for submission (sanitize fields that server validation disallows)
            const clone = JSON.parse(JSON.stringify(form));

            if (clone.mainCover) {
                const coverUploadSource = clone.mainCover.croppedUrl || clone.mainCover.url;
                const uploadedMainCover = await uploadAssetIfNeeded(
                    { ...clone.mainCover, url: coverUploadSource },
                    "image",
                    clone.mainCover.originalName || `main-cover-${Date.now()}.jpg`,
                );

                clone.mainCover = {
                    ...clone.mainCover,
                    ...uploadedMainCover,
                    url: uploadedMainCover.url,
                };

                // remove cropping preview data that backend validation may reject
                delete clone.mainCover.croppedUrl;
                delete clone.mainCover.crop;
            }

            // strip nested metadata from before/after sub-objects (server expects simple {url,label,type})
            if (Array.isArray(clone.materials)) {
                clone.materials = await Promise.all(
                    clone.materials.map(async (m: any, materialIndex: number) => {
                        const copy: any = { ...m };

                        if (isPhotoMaterialType(copy.type)) {
                            let normalizedItems = buildPhotoItems(copy).map((item) => ({
                                url: item.url,
                                mimeType: item.mimeType,
                                originalName: item.originalName,
                                size: item.size,
                                type: "photo",
                            }));

                            normalizedItems = await Promise.all(
                                normalizedItems.map(async (item, itemIndex) => {
                                    const uploadedItem = await uploadAssetIfNeeded(
                                        item,
                                        "image",
                                        item.originalName || `project-photo-${materialIndex + 1}-${itemIndex + 1}.jpg`,
                                    );

                                    return {
                                        ...item,
                                        ...uploadedItem,
                                        type: "photo",
                                    };
                                }),
                            );

                            const [primary, ...restItems] = normalizedItems;
                            copy.url = primary?.url || copy.url;
                            copy.mimeType = primary?.mimeType || copy.mimeType;
                            copy.originalName = primary?.originalName || copy.originalName;
                            copy.size = primary?.size || copy.size;
                            copy.items = restItems;
                            copy.type = normalizedItems.length > 1 ? "bulk" : "photo";
                        }

                        if (copy.type === "video" && copy.url) {
                            const uploadedVideo = await uploadAssetIfNeeded(
                                copy,
                                "video",
                                copy.originalName || `project-video-${materialIndex + 1}.mp4`,
                            );

                            copy.url = uploadedVideo.url;
                            copy.mimeType = uploadedVideo.mimeType || copy.mimeType;
                            copy.originalName = uploadedVideo.originalName || copy.originalName;
                            copy.size = uploadedVideo.size || copy.size;
                        }

                        if (copy.before?.url) {
                            const uploadedBefore = await uploadAssetIfNeeded(
                                copy.before,
                                "image",
                                copy.before.originalName || `before-${materialIndex + 1}.jpg`,
                            );
                            copy.before = { ...copy.before, ...uploadedBefore };
                        }

                        if (copy.after?.url) {
                            const uploadedAfter = await uploadAssetIfNeeded(
                                copy.after,
                                "image",
                                copy.after.originalName || `after-${materialIndex + 1}.jpg`,
                            );
                            copy.after = { ...copy.after, ...uploadedAfter };
                        }

                        if (copy.before) {
                            const { url, label, type } = copy.before;
                            copy.before = { url, label, type };
                        }
                        if (copy.after) {
                            const { url, label, type } = copy.after;
                            copy.after = { url, label, type };
                        }

                        return copy;
                    }),
                );

                clone.materials = clone.materials.map((material: any, index: number) => ({
                    ...material,
                    order: index + 1,
                }));
            }

            const submitData = {
                name: clone.name,
                description: clone.description,
                location: clone.location,
                published: clone.published,
                categories: normalizeTaxonomyArrayField(clone.categories),
                tags: normalizeArrayField(clone.tags),
                types: normalizeTaxonomyArrayField(clone.types),
                material: clone.materials,
                cast: clone.cast,
                mainCover: clone.mainCover,
            };

            mutation.mutate(submitData, {
                onSuccess: (newProject: any) => {
                    setSaveStatus("success");
                    setTimeout(() => {
                        const projectId = newProject?.id || newProject?._id;
                        navigate(projectId ? `/projects/${projectId}` : "/projects");
                    }, 1500);
                },
                onError: () => {
                    setSaveStatus("error");
                    setTimeout(() => setSaveStatus("idle"), 3000);
                },
            });
        } catch (error) {
            console.error("Project submission failed:", error);
            setSaveStatus("error");
            setTimeout(() => setSaveStatus("idle"), 3000);
        }
    };

    const formatBytes = (bytes: number) => {
        if (!bytes) return "N/A";
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    const formatRichText = (content?: string) => {
        if (!content) return "";
        return /<\/?[a-z][\s\S]*>/i.test(content) ? content : content.replace(/\n/g, "<br />");
    };

    const isSaving = mutation.isPending || saveStatus === "saving";

    return (
        <div className="min-h-screen bg-light-50 dark:bg-dark-950">
            {/* Header Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="relative rounded-2xl bg-light-50/5 dark:bg-dark-950/70 border border-light-100 dark:border-dark-800 p-6 lg:p-8 shadow-xl overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Link to="/projects" className="text-light-500 dark:text-secdark-500 hover:text-light-600 dark:hover:text-secdark-400 transition-colors">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Link>
                                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs uppercase tracking-wider text-light-400 dark:text-dark-300">
                                        Create New
                                    </span>
                                </div>
                                <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-light-900 dark:text-dark-50 leading-tight">
                                    Add New Project
                                </h1>
                                <p className="mt-2 text-sm text-light-600 dark:text-dark-400 max-w-2xl">
                                    Create a new project with complete details including materials, team members, and media
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Link to="/projects" className="btn-ghost inline-flex items-center gap-2">
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
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
                                            Publish this project immediately (make it publicly visible)
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
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            disablePortal
                                            options={projectCategories}
                                            loading={projectCategoriesLoading}
                                            value={form.categories}
                                            filterSelectedOptions
                                            isOptionEqualToValue={(option, value) => isSameOption(option, value)}
                                            getOptionLabel={(option) => getOptionLabel(option)}
                                            onChange={(_, value) => setForm({ ...form, categories: value })}
                                            className="w-full"
                                            sx={taxonomyAutocompleteSx}
                                            slotProps={taxonomyAutocompleteSlotProps}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Select existing or type a new category"
                                                    size="small"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Tags</label>
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {form.tags.map((tag: any, idx: number) => (
                                                <span key={getOptionValue(tag) || `${getOptionLabel(tag)}-${idx}`} className="inline-flex items-center gap-1 px-2 py-1 bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-300 rounded-md text-sm">
                                                    #{getOptionLabel(tag)}
                                                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-light-500 dark:hover:text-secdark-500">
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
                                        <Autocomplete
                                            multiple
                                            freeSolo
                                            disablePortal
                                            options={projectTypes}
                                            loading={projectTypesLoading}
                                            value={form.types}
                                            filterSelectedOptions
                                            isOptionEqualToValue={(option, value) => isSameOption(option, value)}
                                            getOptionLabel={(option) => getOptionLabel(option)}
                                            onChange={(_, value) => setForm({ ...form, types: value })}
                                            className="w-full"
                                            sx={taxonomyAutocompleteSx}
                                            slotProps={taxonomyAutocompleteSlotProps}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    placeholder="Select existing or type a new type"
                                                    size="small"
                                                />
                                            )}
                                        />
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
                                        <div
                                            key={material._id || idx}
                                            onDragOver={handleMaterialDragOver}
                                            onDrop={() => handleMaterialDrop(idx)}
                                            className={`border border-light-200 dark:border-dark-700 rounded-lg p-4 transition-shadow ${draggedMaterialIndex === idx ? "opacity-60" : "hover:shadow-md"}`}
                                        >
                                            <div className="w-full grid grid-cols-12 gap-4 items-start">
                                                <div className="col-span-12 sm:col-span-1 flex sm:justify-center">
                                                    <button
                                                        type="button"
                                                        draggable
                                                        onDragStart={() => handleMaterialDragStart(idx)}
                                                        onDragEnd={handleMaterialDragEnd}
                                                        className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-light-200 dark:border-dark-700 bg-white/70 dark:bg-dark-900/50 text-light-500 dark:text-dark-400 cursor-grab active:cursor-grabbing"
                                                        title="Drag to reorder"
                                                        aria-label="Drag material to reorder"
                                                    >
                                                        <GripVertical className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="col-span-12 sm:col-span-2">
                                                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-black/5">
                                                        {material.type === "before_after" ? (
                                                            <BeforeAfterSlider
                                                                beforeUrl={material.before?.url}
                                                                afterUrl={material.after?.url}
                                                                beforeLabel={material.before?.label || "Before"}
                                                                afterLabel={material.after?.label || "After"}
                                                                className="w-full h-full"
                                                                mediaClassName="w-full h-full"
                                                                showSlider={false}
                                                            />
                                                        ) : material.type === "photo" ? (
                                                            (() => {
                                                                const previewItems = buildPhotoItems(material);

                                                                if (!previewItems.length) {
                                                                    return (
                                                                        <div className="w-full h-full flex items-center justify-center text-light-400 dark:text-dark-500">
                                                                            <ImageIcon className="w-6 h-6 opacity-40" />
                                                                        </div>
                                                                    );
                                                                }

                                                                if (previewItems.length === 1) {
                                                                    return <img src={previewItems[0].url} alt={material.caption || ""} className="w-full h-full object-cover" />;
                                                                }

                                                                return (
                                                                    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
                                                                        {previewItems.slice(0, 4).map((item, itemIdx) => (
                                                                            <div key={`preview-${item.originalName || itemIdx}`} className="relative w-full h-full">
                                                                                <img src={item.url} alt={material.caption || `Photo ${itemIdx + 1}`} className="w-full h-full object-cover" />
                                                                                {itemIdx === 3 && previewItems.length > 4 && (
                                                                                    <div className="absolute inset-0 bg-black/45 text-white text-xs font-medium flex items-center justify-center">
                                                                                        +{previewItems.length - 4}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()
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
                                                                <ImageIcon className="w-6 h-6 opacity-40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-span-12 sm:col-span-7">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {material.type === "photo" && <ImageIcon className="w-4 h-4 text-light-500" />}
                                                        {material.type === "video" && <Video className="w-4 h-4 text-light-500" />}
                                                        {material.type === "before_after" && <Camera className="w-4 h-4 text-light-500" />}
                                                        {material.type === "text" && <FileText className="w-4 h-4 text-light-500" />}
                                                        {material.type === "html" && <Code className="w-4 h-4 text-light-500" />}
                                                        <span className="text-sm font-medium text-light-900 dark:text-dark-50">
                                                            {material.type.toUpperCase()} #{material.order}
                                                        </span>
                                                        {material.caption && (
                                                            <span className="text-xs text-light-500 dark:text-secdark-500">{material.caption}</span>
                                                        )}
                                                    </div>

                                                    {material.type === "photo" && (
                                                        <div>
                                                            {(() => {
                                                                const photoItems = buildPhotoItems(material);
                                                                const primarySize = photoItems[0]?.size || material.size;

                                                                return (
                                                            <div className="mt-2 text-xs text-light-500 dark:text-dark-400">
                                                                {photoItems.length > 0
                                                                    ? `${photoItems.length} ${photoItems.length === 1 ? "photo" : "photos"} grouped`
                                                                    : (material.originalName ? `File: ${material.originalName}` : "Uploaded image")}
                                                                {primarySize ? ` • ${formatBytes(primarySize || 0)}` : ""}
                                                            </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}

                                                    {material.type === "video" && material.url && (
                                                        <div>
                                                            <div className="mt-2 text-xs text-light-500 dark:text-dark-400">
                                                                {material.originalName ? `File: ${material.originalName}` : "Uploaded video"}
                                                                {material.size ? ` • ${formatBytes(material.size)}` : ""}
                                                            </div>
                                                        </div>
                                                    )}

                                                    

                                                    {material.textContent && (
                                                        <div className="mt-2">
                                                            <div
                                                                className="p-3 bg-light-100 dark:bg-dark-800 rounded-md text-sm text-light-700 dark:text-dark-300 max-h-28 overflow-auto break-words"
                                                                dangerouslySetInnerHTML={{ __html: formatRichText(material.textContent) }}
                                                            >
                                                            </div>
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
                                        <div
                                            key={member._id || idx}
                                            draggable
                                            onDragStart={() => handleCastDragStart(idx)}
                                            onDragOver={(e) => handleCastDragOver(e)}
                                            onDrop={() => handleCastDrop(idx)}
                                            onDragEnd={handleCastDragEnd}
                                            className={`border border-light-200 dark:border-dark-700 rounded-lg p-4 transition-all cursor-grab active:cursor-grabbing hover:shadow-md ${
                                                draggedCastIndex === idx
                                                    ? "opacity-60 ring-2 ring-light-400 dark:ring-secdark-500"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <span className="inline-flex mt-0.5 h-8 w-8 items-center justify-center rounded-lg border border-light-200 dark:border-dark-700 bg-white/70 dark:bg-dark-900/40 text-light-500 dark:text-dark-400">
                                                        <GripVertical className="w-4 h-4" />
                                                    </span>
                                                    <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <User className="w-4 h-4 text-light-500" />
                                                        <span className="font-medium text-light-900 dark:text-dark-50">{member.name}</span>
                                                        <span className="text-sm text-light-500 dark:text-secdark-500">{member.title}</span>
                                                    </div>
                                                    <div className="text-xs text-light-400 dark:text-dark-500">Order: {member.order}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => handleEditCast(member)} title="Edit" aria-label="Edit cast member" className="p-2 rounded-lg hover:bg-light-100 dark:hover:bg-dark-800 text-light-600 dark:text-dark-400 transition-colors">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDeleteCast(idx)} title="Delete" aria-label="Delete cast member" className="p-2 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/30 text-danger-500 transition-colors">
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
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-md text-sm px-2 py-1 bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-300">Current Cover</div>
                                                <div className="text-sm text-light-600 dark:text-dark-400">{form.mainCover.originalName}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="inline-flex items-center gap-2 text-sm">
                                                </label>
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary">
                                                    <Upload className="w-4 h-4 inline mr-2" />Replace
                                                </button>
                                                <button type="button" onClick={handleRemoveMainCover} className="btn-danger">
                                                    <Trash2 className="w-4 h-4 inline mr-2" />Remove
                                                </button>
                                            </div>
                                        </div>

                                        {cropEnabled ? (
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                                                <div className="col-span-2">
                                                    <div className="rounded-lg overflow-hidden border border-light-200 dark:border-dark-700 relative bg-black/5">
                                                        <img
                                                            ref={(el) => { displayImgRef.current = el; }}
                                                            src={form.mainCover.url}
                                                            alt="Main Cover"
                                                            className="w-full h-auto max-h-[420px] object-contain block"
                                                            onLoad={() => setTimeout(updateOverlayStyle, 20)}
                                                            onClick={(e) => handleImageClickToCenter(e)}
                                                        />
                                                        <div
                                                            style={{ ...overlayStyle, touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
                                                            className="absolute border-2 border-white/80"
                                                            onPointerDown={(e) => handleOverlayPointerDown(e)}
                                                        />
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-3">
                                                        <label className="text-xs text-light-500 dark:text-dark-400">Zoom</label>
                                                        <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
                                                        <button type="button" onClick={() => { setZoom(1); setCropCenter({ x: 0.5, y: 0.5 }); }} className="btn-ghost">Reset</button>
                                                    </div>

                                                    <div className="mt-2 text-sm text-light-500 dark:text-dark-400">Drag the square on the image to position the 1:1 crop. Use the zoom slider to scale.</div>
                                                </div>

                                                <div className="col-span-1">
                                                    <div className="rounded-lg border border-light-200 dark:border-dark-700 overflow-hidden w-full aspect-square bg-white/5 flex items-center justify-center">
                                                        {croppedPreview ? (
                                                            <img src={croppedPreview} alt="Cropped preview" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="text-sm text-light-500 dark:text-dark-400 p-4">Cropped preview (1:1)</div>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 flex gap-2">
                                                        <button type="button" onClick={() => { generateCropPreview(); }} className="btn-secondary">Preview</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
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
                                                        <span className="ml-2 text-light-900 dark:text-dark-50">{form.mainCover.size ? formatBytes(form.mainCover.size) : "N/A"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 border-2 border-dashed border-light-200 dark:border-dark-700 rounded-lg">
                                        <Camera className="w-12 h-12 text-light-400 dark:text-dark-500 mx-auto mb-3" />
                                        <p className="text-light-600 dark:text-dark-400 mb-4 mr-2">No main cover image set</p>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="btn-primary inline-flex items-center gap-2"
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
                    <div className="flex items-center justify-end gap-4 pt-8 mt-8 border-t border-light-200 dark:border-dark-800">
                        <Link to="/projects" className="btn-ghost">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`inline-flex items-center gap-2 min-w-[120px] justify-center rounded-lg px-4 py-2 transition-colors ${
                                isSaving
                                    ? "bg-light-100 dark:bg-dark-800 text-light-700 dark:text-dark-200 border border-light-200 dark:border-dark-700 cursor-not-allowed"
                                    : "btn-primary"
                            }`}
                        >
                            {saveStatus === "saving" && (
                                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            )}
                            {saveStatus === "success" && <CheckCircle className="w-4 h-4" />}
                            {saveStatus === "error" && <AlertCircle className="w-4 h-4" />}
                            {saveStatus === "idle" && <Plus className="w-4 h-4" />}
                            {saveStatus === "saving" && "Creating..."}
                            {saveStatus === "success" && "Created!"}
                            {saveStatus === "error" && "Failed!"}
                            {saveStatus === "idle" && "Create Project"}
                        </button>
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
                                </select>
                            </div>
                            
                            <div>
                                <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Title</label>
                                <input
                                    type="text"
                                    value={editingMaterial.caption || ""}
                                    onChange={(e) => setEditingMaterial({ ...editingMaterial, caption: e.target.value })}
                                    className="input w-full"
                                    placeholder="Optional caption"
                                />
                            </div>

                            {(editingMaterial.type === "photo" || editingMaterial.type === "video") && (
                                <>
                                    <div>
                                        <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">
                                            {editingMaterial.type === "photo" ? "Upload photos" : "Upload file"}
                                        </label>
                                        <input
                                            type="file"
                                            accept={editingMaterial.type === "photo" ? "image/*" : "video/*"}
                                            multiple={editingMaterial.type === "photo"}
                                            onChange={handleMaterialFileUpload}
                                            className="input w-full"
                                        />
                                    </div>

                                    {editingMaterial.type === "photo" && (() => {
                                        const groupedPhotoItems = buildPhotoItems(editingMaterial);
                                        if (groupedPhotoItems.length === 0) return null;

                                        return (
                                            <div className="mt-3">
                                                <div className="text-xs text-light-500 dark:text-dark-400 mb-2">
                                                    {groupedPhotoItems.length} {groupedPhotoItems.length === 1 ? "photo" : "photos"} grouped under this title
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {groupedPhotoItems.map((item, itemIndex) => (
                                                        <div key={`${item.originalName || "photo"}-${itemIndex}`} className="relative group overflow-hidden rounded border border-light-200 dark:border-dark-700">
                                                            <img src={item.url} alt={item.originalName || `Photo ${itemIndex + 1}`} className="w-full h-28 object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemovePhotoItem(itemIndex)}
                                                                className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                                title="Remove photo"
                                                                aria-label="Remove photo"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {editingMaterial.type === "video" && editingMaterial.url && (
                                        <div className="mt-3">
                                            <video src={editingMaterial.url} controls className="w-full h-40 object-cover rounded" />
                                        </div>
                                    )}
                                  
                                </>
                            )}

                            {editingMaterial.type === "text" && (
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-light-700 dark:text-dark-300">Text Content</label>
                                    <div className="project-quill rounded-xl overflow-hidden border border-light-200 dark:border-dark-700">
                                        <ReactQuill
                                            theme="snow"
                                            value={editingMaterial.textContent || ""}
                                            onChange={(value) => setEditingMaterial({ ...editingMaterial, textContent: value })}
                                            placeholder="Enter your text content here..."
                                        />
                                    </div>
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

export default AddProject;