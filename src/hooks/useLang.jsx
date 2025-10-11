import { useContext } from "react";
import { LangProviderContext } from "@/contexts/langContext";

export const useLang = () => {
    const ctx = useContext(LangProviderContext);
    if (!ctx) throw new Error("useLang must be used within a LangProvider");
    return ctx;
};
