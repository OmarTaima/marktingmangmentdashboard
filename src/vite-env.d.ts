/// <reference types="vite/client" />

// Loosely type import.meta.env so code that reads env vars doesn't error during migration.
interface ImportMetaEnv {
    [key: string]: string | boolean | undefined;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
