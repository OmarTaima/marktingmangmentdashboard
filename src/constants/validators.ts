// Utility: convert Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩) → Western (0-9)
export function normalizeDigits(value: unknown): unknown {
    if (typeof value !== "string") return value;
    const arabicToEnglishMap: Record<string, string> = {
        "٠": "0",
        "١": "1",
        "٢": "2",
        "٣": "3",
        "٤": "4",
        "٥": "5",
        "٦": "6",
        "٧": "7",
        "٨": "8",
        "٩": "9",
    };
    return value.replace(/[٠-٩]/g, (d) => arabicToEnglishMap[d] ?? d);
}

/**
 * Validate Egyptian mobile numbers
 * Supports Arabic and English numerals.
 */
export function isValidEgyptianMobile(value: unknown): boolean {
    if (typeof value !== "string") return false;
    const v = normalizeDigits(value.trim()) as string;
    const re = /^(?:\+?20|0)?1(?:0|1|2|5)\d{8}$/;
    return re.test(v);
}

/**
 * Validate Email (standard)
 * Arabic words not allowed (no Arabic letters).
 */
export function isValidEmail(value: unknown): boolean {
    if (typeof value !== "string") return false;
    const v = value.trim();
    // Reject Arabic letters explicitly
    if (/[\u0600-\u06FF]/.test(v)) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(v);
}

/**
 * Validate website URL (Arabic words not allowed)
 * Allows http(s):// or protocol-less (example.com)
 */
export function isValidURL(value: unknown, { allowProtocolLess = false }: { allowProtocolLess?: boolean } = {}): boolean {
    if (typeof value !== "string") return false;
    const v = value.trim();
    if (!v) return false;
    // Disallow Arabic letters
    if (/[\u0600-\u06FF]/.test(v)) return false;

    if (allowProtocolLess) {
        // Require a dot and a top-level domain of 2-63 letters/digits/hyphen (basic check)
        const protoLessRe = /^[^\s\/]+\.[A-Za-z0-9-]{2,63}(?:\.|$)/;
        if (protoLessRe.test(v)) return true;
    }

    try {
        const url = new URL(v);
        if (!(url.protocol === "http:" || url.protocol === "https:")) return false;
        // ensure hostname includes a dot and a valid-looking TLD
        const host = url.hostname || "";
        // require at least one dot and a TLD 2-63 chars
        if (!/\.[A-Za-z0-9-]{2,63}$/.test(host)) return false;
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate age range (Arabic digits accepted)
 */
export function validateAgeRange(
    value: unknown,
    { min = 0, max = 120 }: { min?: number; max?: number } = {},
): { valid: boolean; parsed: number | null; reason: string | null } {
    if (value === null || value === undefined || value === "") {
        return { valid: false, parsed: null, reason: "empty" };
    }

    const normalized = normalizeDigits(String(value));
    if (typeof normalized === "string" && /[\u0600-\u06FF]/.test(normalized)) {
        return { valid: false, parsed: null, reason: "arabic_text" };
    }

    const n = Number(normalized as any);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
        return { valid: false, parsed: null, reason: "not_integer" };
    }
    if (n < min) return { valid: false, parsed: n, reason: "too_young" };
    if (n > max) return { valid: false, parsed: n, reason: "too_old" };
    return { valid: true, parsed: n, reason: null };
}

const validators = {
    normalizeDigits,
    isValidEgyptianMobile,
    isValidEmail,
    isValidURL,
    validateAgeRange,
};

export default validators;
