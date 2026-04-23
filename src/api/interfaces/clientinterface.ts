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

export interface ClientAccount {
    _id?: string;
    id?: string;
    platform: string;
    username?: string;
    password?: string;
    twoFactor?: {
        method?: string; // 'email' | 'mobile'
        holderName?: string;
        username?: string;
        password?: string;
    };
    note?: string;
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface SWOT {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

export interface Competitor {
    _id?: string;
    clientId?: string;
    name: string;
    description?: string;
    website?: string;
    swot_strengths?: string[];
    swot_weaknesses?: string[];
    swot_opportunities?: string[];
    swot_threats?: string[];
    socialLinks?: Array<{
        platform: string;
        url: string;
        _id?: string;
    }>;
    deleted?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Segment {
    _id?: string;
    clientId?: string;
    name: string;
    description?: string;
    ageRange?: string[];
    productName?: string[];
    population?: number[];
    gender?: Array<"all" | "male" | "female" | "other">;
    area?: string[];
    governorate?: string[];
    note?: string;
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
    accounts?: ClientAccount[];
    segments?: Segment[];
    createdAt: string;
    updatedAt: string;
}
