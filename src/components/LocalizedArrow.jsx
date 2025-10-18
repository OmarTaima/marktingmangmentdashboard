import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLang } from "@/hooks/useLang";

const LocalizedArrow = (props) => {
    const { lang } = useLang();
    const rtl = lang === "ar";
    return rtl ? <ArrowRight {...props} /> : <ArrowLeft {...props} />;
};

export default LocalizedArrow;
