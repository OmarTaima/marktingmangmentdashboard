import validators from "./validators";

// Map of field keys to validator functions and error message keys (i18n)
export const fieldValidations = {
    fullName: {
        required: true,
        messageKey: "please_fill_required_fields",
    },
    email: {
        required: true,
        validator: validators.isValidEmail,
        messageKey: "invalid_email",
    },
    phone: {
        required: true,
        validator: validators.isValidEgyptianMobile,
        messageKey: "phone_error",
    },
    businessPhone: {
        required: true,
        validator: validators.isValidEgyptianMobile,
        messageKey: "phone_error",
    },
    businessWhatsApp: {
        required: true,
        validator: validators.isValidEgyptianMobile,
        messageKey: "phone_error",
    },
    businessEmail: {
        required: true,
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
        required: true,
        messageKey: "please_fill_required_fields",
    },
    category: {
        required: true,
        messageKey: "please_fill_required_fields",
    },
    description: {
        required: true,
        messageKey: "please_fill_required_fields",
    },
    mainOfficeAddress: {
        required: true,
        messageKey: "please_fill_required_fields",
    },
    // Competitors
    competitorName: {
        required: true,
        messageKey: "please_fill_required_fields",
    },
    competitorDescription: {
        required: true,
        messageKey: "please_fill_required_fields",
    },
    // Segments
    segmentName: {
        required: true,
        messageKey: "please_fill_required_fields",
    },
    segmentDescription: {
        required: true,
        messageKey: "please_fill_required_fields",
    },
};

export default fieldValidations;
