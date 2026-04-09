import crypto from "crypto";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const DEFAULT_UPLOAD_FOLDER = "Markting/projects";

const parseCloudinaryUrl = (value = "") => {
    const match = value.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) return null;
    return {
        apiKey: match[1],
        apiSecret: match[2],
        cloudName: match[3],
    };
};

const getCloudinaryConfig = (env) => {
    const fromUrl = parseCloudinaryUrl(env.CLOUDINARY_URL || "");
    return {
        apiKey: env.CLOUDINARY_API_KEY || fromUrl?.apiKey || "",
        apiSecret: env.CLOUDINARY_API_SECRET || fromUrl?.apiSecret || "",
        cloudName: env.CLOUDINARY_CLOUD_NAME || fromUrl?.cloudName || "",
    };
};

const buildSignature = (params, apiSecret) => {
    const queryString = Object.keys(params)
        .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");

    return crypto
        .createHash("sha1")
        .update(`${queryString}${apiSecret}`)
        .digest("hex");
};

const createDevCloudinarySignaturePlugin = (cloudinaryConfig) => ({
    name: "dev-cloudinary-signature",
    apply: "serve",
    configureServer(server) {
        server.middlewares.use("/api/cloudinary-signature", (req, res) => {
            if (req.method !== "POST") {
                res.statusCode = 405;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ message: "Method not allowed" }));
                return;
            }

            const { apiKey, apiSecret, cloudName } = cloudinaryConfig;
            if (!apiKey || !apiSecret || !cloudName) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                    JSON.stringify({
                        message:
                            "Cloudinary env is missing. Set CLOUDINARY_URL or CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET/CLOUDINARY_CLOUD_NAME.",
                    }),
                );
                return;
            }

            let rawBody = "";
            req.on("data", (chunk) => {
                rawBody += chunk;
            });

            req.on("end", () => {
                try {
                    const parsedBody = rawBody ? JSON.parse(rawBody) : {};
                    const timestamp = Number(parsedBody.timestamp) || Math.floor(Date.now() / 1000);
                    const folder =
                        typeof parsedBody.folder === "string" && parsedBody.folder.trim()
                            ? parsedBody.folder.trim()
                            : DEFAULT_UPLOAD_FOLDER;

                    const signature = buildSignature({ timestamp, folder }, apiSecret);

                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                        JSON.stringify({
                            signature,
                            timestamp,
                            apiKey,
                            cloudName,
                            folder,
                        }),
                    );
                } catch {
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ message: "Invalid JSON body" }));
                }
            });
        });
    },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const cloudinaryConfig = getCloudinaryConfig(env);

    return {
        plugins: [react(), createDevCloudinarySignaturePlugin(cloudinaryConfig)],
        // allow overriding base at build time (e.g. VITE_BASE=/my-repo/ vite build)
        base: process.env.VITE_BASE || "/",
        server: {
            port: 5173,
            strictPort: true,
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
        },
    };
});
