import crypto from "node:crypto";

const parseCloudinaryUrl = (value = "") => {
    if (typeof value !== "string") return null;
    const match = value.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^\s]+)$/);
    if (!match) return null;

    return {
        apiKey: match[1],
        apiSecret: match[2],
        cloudName: match[3],
    };
};

const getCloudinaryConfig = () => {
    const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL || "");

    const apiKey = process.env.CLOUDINARY_API_KEY || fromUrl?.apiKey;
    const apiSecret = process.env.CLOUDINARY_API_SECRET || fromUrl?.apiSecret;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || fromUrl?.cloudName;

    return { apiKey, apiSecret, cloudName };
};

const buildSignature = (params, apiSecret) => {
    const serialized = Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("&");

    return crypto.createHash("sha1").update(`${serialized}${apiSecret}`).digest("hex");
};

export default function handler(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
        const timestamp = Number(body.timestamp) || Math.floor(Date.now() / 1000);
        const folder = typeof body.folder === "string" ? body.folder.trim() : "";

        const { apiKey, apiSecret, cloudName } = getCloudinaryConfig();

        if (!apiKey || !apiSecret || !cloudName) {
            return res.status(500).json({
                error: "Missing Cloudinary server configuration. Set CLOUDINARY_URL or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET/CLOUDINARY_CLOUD_NAME.",
            });
        }

        const paramsToSign = {
            timestamp,
            ...(folder ? { folder } : {}),
        };

        const signature = buildSignature(paramsToSign, apiSecret);

        return res.status(200).json({
            signature,
            timestamp,
            apiKey,
            cloudName,
            folder: folder || undefined,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to generate Cloudinary signature.",
        });
    }
}
