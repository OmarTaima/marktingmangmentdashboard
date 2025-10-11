import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import translations from "../constants/i18n";

export const LangProviderContext = createContext({
    lang: "en",
    setLang: () => {},
    t: (k) => k,
});

export function LangProvider({ children, storageKey = "app-lang", defaultLang = "en", ...props }) {
    const [lang, setLangState] = useState(() => {
        try {
            return localStorage.getItem(storageKey) || defaultLang;
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

    const setLang = (l) => {
        try {
            localStorage.setItem(storageKey, l);
        } catch (e) {
            // ignore
        }
        setLangState(l);
    };

    const t = (key) => {
        return (translations[lang] && translations[lang][key]) || (translations.en && translations.en[key]) || key;
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

LangProvider.propTypes = {
    children: PropTypes.node,
    storageKey: PropTypes.string,
    defaultLang: PropTypes.string,
};
