export interface PersonalInfo {
    fullName: string;
    email: string;
    phone: string;
    position: string;
}

export interface BusinessInfo {
    name: string;
    businessName?: string;
    category: string;
    description: string;
    mainOfficeAddress: string;
    establishedYear: number;
}

export interface ContactInfo {
    businessPhone: string;
    businessWhatsApp: string;
    businessEmail: string;
    website: string;
}

export interface Branch {
    _id: string;
    name: string;
    address: string;
    phone: string;
}

export interface SocialLink {
    platform: string;
    url: string;
}

export interface SocialLinks {
    business: SocialLink[];
    personal: SocialLink[];
    custom: SocialLink[];
}

export interface SWOT {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

export interface Competitor {
    _id: string;
    name: string;
    description: string;
    website: string;
    strengths: string[];
    weaknesses: string[];
}

export interface Segment {
    _id?: string;
    clientId?: string;
    name: string;
    description?: string;
    ageRange?: string;
    gender?: "all" | "male" | "female" | "other";
    interests?: string[];
    incomeLevel?: "low" | "middle" | "high" | "varied";
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Client {
    _id: string;
    id?: string;
    personal: PersonalInfo;
    business: BusinessInfo;
    contact: ContactInfo;
    status: string;
    branches: Branch[];
    socialLinks: SocialLinks;
    swot: SWOT;
    competitors: Competitor[];
    segments?: Segment[];
    createdAt: string;
    updatedAt: string;
}
