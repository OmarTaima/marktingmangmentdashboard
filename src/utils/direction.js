// Small helper to detect if a string contains RTL characters (Arabic/Hebrew etc.)
export function isRtl(text) {
    if (!text || typeof text !== "string") return false;
    // Unicode ranges for strong RTL scripts
    const rtlRange = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    return rtlRange.test(text);
}

export function dirFor(text) {
    return isRtl(text) ? "rtl" : "ltr";
}
