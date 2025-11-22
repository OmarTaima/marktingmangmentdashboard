import validators from "./validators";

type ValidatorFn = (v: unknown) => boolean;

interface FieldValidation {
    required: boolean;
    validator?: ValidatorFn;
    messageKey: string;
}

// Map of field keys to validator functions and error message keys (i18n)
export const fieldValidations: Record<string, FieldValidation> = {
    fullName: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    email: {
        required: false,
        validator: validators.isValidEmail,
        messageKey: "invalid_email",
    },
    phone: {
        required: false,
        validator: validators.isValidEgyptianMobile,
        messageKey: "phone_error",
    },
    businessPhone: {
        required: false,
        validator: validators.isValidEgyptianMobile,
        messageKey: "phone_error",
    },
    businessWhatsApp: {
        required: false,
        validator: validators.isValidEgyptianMobile,
        messageKey: "phone_error",
    },
    businessEmail: {
        required: false,
        validator: validators.isValidEmail,
        messageKey: "invalid_email",
    },
    website: {
        required: false,
        validator: (v) => !v || validators.isValidURL(v, { allowProtocolLess: true }),
        messageKey: "invalid_website",
    },
    // Business info
    businessName: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    category: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    description: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    mainOfficeAddress: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    // Competitors
    competitorName: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    competitorDescription: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    // Segments
    segmentName: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    segmentDescription: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
    // Branches
    branchName: {
        required: false,
        messageKey: "please_fill_required_fields",
    },
};

export default fieldValidations;
