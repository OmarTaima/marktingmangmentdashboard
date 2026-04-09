export type CloudinaryResourceType = "image" | "video";

interface CloudinarySignatureResponse {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder?: string;
}

interface CloudinaryUploadResponse {
    secure_url?: string;
    url?: string;
    public_id?: string;
    bytes?: number;
    format?: string;
    resource_type?: string;
}

export interface CloudinaryUploadResult {
    url: string;
    mimeType?: string;
    size?: number;
    originalName?: string;
    publicId?: string;
}

interface UploadFileOptions {
    resourceType: CloudinaryResourceType;
    folder?: string;
}

interface UploadDataUrlOptions extends UploadFileOptions {
    fileName: string;
}

const DEFAULT_UPLOAD_FOLDER = "Markting/projects";

export const isDataUrl = (value?: string): value is string => typeof value === "string" && value.startsWith("data:");

const getUploadFolder = (folder?: string): string => {
    if (folder && folder.trim()) return folder.trim();
    const envFolder = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER;
    if (typeof envFolder === "string" && envFolder.trim()) return envFolder.trim();
    return DEFAULT_UPLOAD_FOLDER;
};

const getSignatureEndpoint = (): string => {
    const endpoint = import.meta.env.VITE_CLOUDINARY_SIGNATURE_ENDPOINT;
    if (typeof endpoint === "string" && endpoint.trim()) {
        return endpoint.trim();
    }
    return "/api/cloudinary-signature";
};

const extensionFromMimeType = (mimeType: string): string => {
    if (!mimeType) return "bin";
    const parts = mimeType.split("/");
    return parts[1] || "bin";
};

const ensureFileName = (fileName: string, mimeType: string): string => {
    const name = (fileName || "upload").trim();
    if (name.includes(".")) return name;
    return `${name}.${extensionFromMimeType(mimeType)}`;
};

const dataUrlToFile = (dataUrl: string, fileName: string): File => {
    const [header, base64] = dataUrl.split(",");
    if (!header || !base64) {
        throw new Error("Invalid data URL for Cloudinary upload.");
    }

    const mimeMatch = header.match(/data:(.*?);base64/);
    const mimeType = mimeMatch?.[1] || "application/octet-stream";
    const bytes = atob(base64);
    const buffer = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i += 1) {
        buffer[i] = bytes.charCodeAt(i);
    }

    return new File([buffer], ensureFileName(fileName, mimeType), { type: mimeType });
};

const fetchCloudinarySignature = async (folder: string): Promise<CloudinarySignatureResponse> => {
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(getSignatureEndpoint(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ timestamp, folder }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Unable to fetch Cloudinary signature.");
    }

    return (await response.json()) as CloudinarySignatureResponse;
};

export const uploadFileToCloudinary = async (file: File, options: UploadFileOptions): Promise<CloudinaryUploadResult> => {
    const folder = getUploadFolder(options.folder);
    const signature = await fetchCloudinarySignature(folder);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signature.apiKey);
    formData.append("timestamp", String(signature.timestamp));
    formData.append("signature", signature.signature);
    formData.append("folder", signature.folder || folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${options.resourceType}/upload`;
    const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
    });

    if (!uploadResponse.ok) {
        const text = await uploadResponse.text();
        throw new Error(text || "Cloudinary upload failed.");
    }

    const uploaded = (await uploadResponse.json()) as CloudinaryUploadResponse;
    const secureUrl = uploaded.secure_url || uploaded.url;

    if (!secureUrl) {
        throw new Error("Cloudinary response did not include a media URL.");
    }

    const fallbackMimeType = file.type || `${options.resourceType}/${uploaded.format || "*"}`;

    return {
        url: secureUrl,
        mimeType: fallbackMimeType,
        size: uploaded.bytes || file.size,
        originalName: file.name,
        publicId: uploaded.public_id,
    };
};

export const uploadDataUrlToCloudinary = async (
    dataUrl: string,
    options: UploadDataUrlOptions,
): Promise<CloudinaryUploadResult> => {
    const file = dataUrlToFile(dataUrl, options.fileName);
    return uploadFileToCloudinary(file, {
        resourceType: options.resourceType,
        folder: options.folder,
    });
};
