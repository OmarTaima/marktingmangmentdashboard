import { createContext, useEffect, useState, ReactNode } from "react";
import translations from "../constants/i18n";

type Lang = "en" | "ar";

interface LangContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
}

export const LangProviderContext = createContext<LangContextType>({
    lang: "en",
    setLang: () => {},
    t: (k) => k,
});

interface LangProviderProps {
    children: ReactNode;
    storageKey?: string;
    defaultLang?: Lang;
}

export function LangProvider({ children, storageKey = "app-lang", defaultLang = "en", ...props }: LangProviderProps) {
    const [lang, setLangState] = useState<Lang>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            return stored === "ar" || stored === "en" ? stored : defaultLang;
        } catch (e) {
            return defaultLang;
        }
    });

    useEffect(() => {
        const root = document.documentElement;
        if (lang === "ar") {
            root.setAttribute("dir", "rtl");
            root.setAttribute("lang", "ar");
        } else {
            root.setAttribute("dir", "ltr");
            root.setAttribute("lang", "en");
        }
    }, [lang]);

    const setLang = (l: Lang) => {
        try {
            localStorage.setItem(storageKey, l);
        } catch (e) {
            // ignore
        }
        setLangState(l);
    };

    const t = (key: string): string => {
        const langTranslations = translations[lang as keyof typeof translations];
        const enTranslations = translations.en;
        return (langTranslations && (langTranslations as any)[key]) || (enTranslations as any)[key] || key;
    };

    return (
        <LangProviderContext.Provider
            value={{ lang, setLang, t }}
            {...props}
        >
            {children}
        </LangProviderContext.Provider>
    );
}
