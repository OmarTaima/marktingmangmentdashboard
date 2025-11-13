import { useLang } from "@/hooks/useLang";

export const Footer = () => {
    const { t } = useLang();
    return (
        <footer className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <p className="text-light-900 dark:text-dark-50 text-base font-medium">{t("copyright")}</p>
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
