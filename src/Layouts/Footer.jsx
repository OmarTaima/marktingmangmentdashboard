import { useLang } from "@/hooks/useLang";

export const Footer = () => {
    const { t } = useLang();
    return (
        <footer className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <p className="text-base font-medium text-slate-900 dark:text-slate-50">{t("copyright")}</p>
            <div className="flex flex-wrap gap-x-2">
                <a
                    href="#"
                    className="link"
                >
                    {t("privacy_policy")}
                </a>
                <a
                    href="#"
                    className="link"
                >
                    {t("terms_of_service")}
                </a>
            </div>
        </footer>
    );
};
