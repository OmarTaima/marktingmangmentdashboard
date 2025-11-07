# Backend Development Requirements for Marketing Management Dashboard

## Project Overview

Create a comprehensive RESTful API backend for a bilingual (English/Arabic) marketing management dashboard with RTL/LTR support. The system manages client onboarding, campaign planning, service packages, quotations, contracts, and reporting.

---

## Frontend Application Description

### Application Purpose

The Marketing Management Dashboard is a comprehensive web application designed for marketing agencies to manage their entire client lifecycle - from initial onboarding through campaign planning, quotation generation, contract management, and performance reporting. The system supports both English and Arabic languages with proper RTL/LTR text direction handling.

### Target Users

- **Marketing Agencies**: Primary users who manage multiple clients
- **Agency Managers**: Oversee operations and client portfolios
- **Marketing Employees**: Execute campaigns and create reports
- **Administrators**: System configuration and user management

### Key Features Overview

1. **Multi-step Client Onboarding**: Comprehensive 8-step process to collect all client information
2. **Campaign Planning**: Strategic planning with objectives, services, and budgeting
3. **Service Management**: Master service catalog with pricing and discounts
4. **Package Creation**: Bundle services into marketable packages
5. **Quotation Generation**: Create professional quotations with custom pricing
6. **Contract Management**: Generate and manage client contracts
7. **Reporting**: Performance metrics and analytics for clients
8. **Bilingual Support**: Full English/Arabic interface with RTL support

---

## Detailed Feature Descriptions

### 1. Dashboard (Home Page)

**Route**: `/`

**Purpose**: Provides an overview of business metrics and recent activities.

**Features**:

- **Statistics Cards**:
    - Total Products/Services count
    - Total Paid Orders with percentage change
    - Total Customers with growth indicators
    - Sales figures with trend arrows
- **Recent Sales List**: Shows recent client transactions with:
    - Customer profile images
    - Customer names and emails
    - Transaction amounts
    - Scrollable list view
- **Top Orders Table**: Displays product/service performance with:
    - Product images and descriptions
    - Pricing information
    - Status indicators
    - Star ratings
    - Edit and delete action buttons

**Data Storage**: Currently uses mock data from `constants/index.jsx`

**Future Backend Requirements**:

- GET `/api/v1/dashboard/stats` - Real-time business metrics
- GET `/api/v1/dashboard/recent-sales` - Recent transaction data
- GET `/api/v1/dashboard/top-products` - Top performing services/products

---

### 2. Client Onboarding System

**Route**: `/onboarding`

**Purpose**: Multi-step wizard to collect comprehensive client information for marketing strategy development.

#### Step 1: Personal Information

**Fields**:

- Full Name (optional, validated)
- Email Address (validated format)
- Phone Number (Egyptian mobile format: +201XXXXXXXXX or 01XXXXXXXXX)
- Position/Role (optional)

**Validation**:

- Email must be valid format
- Phone must match Egyptian mobile pattern
- Non-blocking validations - users can proceed with warnings

**Data Structure**:

```javascript
personal: {
    fullName: string,
    email: string,
    phone: string,
    position: string
}
```

#### Step 2: Business Information

**Fields**:

- Business Name
- Business Category (dropdown with options):
    - Retail, Restaurant/Food Service, Healthcare, Technology
    - Education, Real Estate, Automotive, Beauty & Wellness
    - Finance, Other
- Business Description (textarea)
- Main Office Address
- Established Year (optional)

**Data Structure**:

```javascript
business: {
    businessName: string,
    category: string,
    description: text,
    mainOfficeAddress: string,
    establishedYear: integer
}
```

#### Step 3: Contact Information

**Fields**:

- Business Phone (validated Egyptian mobile)
- Business WhatsApp (validated Egyptian mobile)
- Business Email (validated email format)
- Website URL (optional, validated URL format)

**Validation**:

- Phone numbers must be Egyptian mobile format
- Email must be valid format
- Website must be valid HTTP/HTTPS URL

**Data Structure**:

```javascript
contact: {
    businessPhone: string,
    businessWhatsApp: string,
    businessEmail: string,
    website: string
}
```

#### Step 4: Branches

**Purpose**: Collect multiple business location information.

**Features**:

- Add unlimited branches
- Each branch has: Name, Address, Phone
- Edit existing branches inline
- Delete branches
- Display count of added branches

**Data Structure**:

```javascript
branches: [
    {
        name: string,
        address: string,
        phone: string,
    },
];
```

#### Step 5: Social Media Links

**Purpose**: Collect client's social media presence.

**Main Platforms** (with dedicated inputs):

- Facebook
- Instagram

**Other Platforms** (custom entries):

- Platform Name (e.g., LinkedIn, YouTube, TikTok, Twitter/X)
- Platform URL

**Features**:

- Pre-filled platform names with URL inputs
- Add custom social media platforms
- Edit and delete links
- Validation for URL format

**Data Structure**:

```javascript
socialLinks: {
    business: [
        { platform: string, url: string }
    ],
    custom: [
        { platform: string, platformName: string, url: string }
    ]
}
```

#### Step 6: SWOT Analysis

**Purpose**: Strategic analysis of client's business position.

**Four Quadrants**:

1. **Strengths** 💪: Internal positive attributes
2. **Weaknesses** ⚠️: Internal limitations
3. **Opportunities** 🎯: External favorable conditions
4. **Threats** ⚡: External challenges

**Features**:

- Add multiple items per quadrant
- Input field for each category
- Real-time list display
- Remove individual items
- At least one item required validation

**Data Structure**:

```javascript
swot: {
    strengths: [string],
    weaknesses: [string],
    opportunities: [string],
    threats: [string]
}
```

#### Step 7: Target Segments

**Purpose**: Define target audience demographics and characteristics.

**Fields per Segment**:

- Segment Name (e.g., "Young Professionals", "Students")
- Description (detailed segment characteristics)
- Age Range (e.g., "18-35")
- Gender (All, Male, Female, Other)
- Interests (comma-separated, e.g., "Technology, Fashion, Sports")
- Income Level (Low, Middle, High, Varied)

**Features**:

- Add multiple target segments
- Edit existing segments
- Delete segments
- Display count of added segments

**Data Structure**:

```javascript
segments: [
    {
        name: string,
        description: text,
        ageRange: string,
        gender: enum,
        interests: string,
        incomeLevel: enum,
    },
];
```

#### Step 8: Competitors

**Purpose**: Analyze competitor landscape.

**Fields per Competitor**:

- Competitor Name
- Description
- Competitor SWOT Analysis:
    - Strengths
    - Weaknesses
    - Opportunities
    - Threats

**Features**:

- Add multiple competitors
- Full SWOT analysis per competitor
- Edit and delete competitors
- Display count of added competitors

**Data Structure**:

```javascript
competitors: [
    {
        name: string,
        description: text,
        swot: {
            strengths: [string],
            weaknesses: [string],
            opportunities: [string],
            threats: [string],
        },
    },
];
```

#### Onboarding Completion

**Functionality**:

- Generate unique client ID: `client_${Date.now()}`
- Add createdAt timestamp
- Save to localStorage as `clients` array
- Clear draft from `onboarding_draft`
- Navigate to clients list page

**Edit Mode**:

- Can edit existing clients via URL parameter: `/onboarding?id={clientId}`
- Loads existing data into form
- Updates client instead of creating new one
- Maintains same validation rules

---

### 3. Clients Management

**Route**: `/clients`

**Purpose**: View and manage all onboarded clients.

**Features**:

#### Client Cards Grid

- Responsive grid layout (1-4 columns based on screen size)
- Each card displays:
    - **Client Info Component**:
        - Business name or "Unnamed Business"
        - Business category with icon
        - Contact person name
        - Email and phone
    - **Quick Statistics**:
        - Number of target segments
        - Number of competitors tracked
        - Total SWOT items
    - **Action Buttons**:
        - "View Details" - Navigate to client detail page
        - "Plan Campaign" - Navigate to planning page with client selected

#### Empty State

- Displays when no clients exist
- Large building icon
- Helpful message
- "Add Your First Client" button

#### Search & Filter (Future Enhancement)

- Search by business name or contact name
- Filter by category
- Filter by status (active, inactive)
- Sort options

**Data Storage**: `localStorage.getItem('clients')` - Array of client objects

**Navigation**:

- Click card → `/clients/{clientId}` (detail view)
- "Plan Campaign" → `/planning` with clientId in localStorage

---

### 4. Client Detail Page

**Route**: `/clients/:id`

**Purpose**: Comprehensive view and editing of single client information.

**Features**:

#### Client Overview Section

- Business logo/avatar placeholder
- Business name as title
- Category badge
- Edit button (enables edit mode)
- Quick stats: Segments, Competitors, SWOT items

#### Personal Information Tab

- Full name with edit capability
- Email address
- Phone number
- Position/role

#### Business Information Tab

- Business name
- Category selector
- Description (expandable textarea)
- Main office address
- Established year

#### Contact Information Tab

- Business phone
- WhatsApp number
- Business email
- Website URL with clickable link

#### Branches Section

- List of all branches
- Each shows: Name, Address, Phone
- Add new branch functionality
- Edit existing branches
- Delete branches

#### Target Segments Section

- Cards displaying each segment
- Shows: Name, Age Range, Gender
- Interests and Income Level
- Description
- Edit and delete per segment

#### Competitors Section

- List of competitor analysis
- Competitor name and description
- SWOT breakdown per competitor
- Edit and delete functionality

#### Social Media Section

- Icons for each platform (Facebook, Instagram, TikTok, X/Twitter)
- Clickable links to profiles
- Custom platforms with names

#### SWOT Analysis Section

- Four-quadrant display:
    - Strengths (green theme)
    - Weaknesses (red/orange theme)
    - Opportunities (blue theme)
    - Threats (purple theme)
- List of items per category
- Visual icons for each quadrant

#### Edit Mode

- Toggle via "Edit Client" button
- Inline editing of all fields
- Save or Cancel options
- Validation on save
- Updates localStorage
- Query parameter: `?edit=true`

**Navigation Options**:

- Back to clients list
- Plan Campaign for this client
- Edit client information
- View reports for client

---

### 5. Services Management

**Route**: `/services`

**Purpose**: Manage master catalog of services offered by the agency.

**Features**:

#### Service Categories

- Photography Services
- Web Services
- Reels Services
- Other Services
- All Services (view all)

#### Service Fields

- **English Name**: Service name in English
- **Arabic Name**: Service name in Arabic
- **Price**: Base service price (optional)
- **Discount**: Discount amount (optional)
- **Discount Type**: Percentage or Fixed amount
- **Description**: Detailed service description
- **Category**: Service classification

#### Service Operations

**Add Service**:

- Bilingual input (English + Arabic)
- Price and discount inputs
- Description textarea
- Category auto-assigned based on active tab
- Validates no duplicate names
- Validates discount (0-100% or positive fixed amount)

**Edit Service**:

- Inline editing mode
- Updates both language fields
- Updates pricing and discount
- Save or cancel options

**Delete Service**:

- Removes from master list
- Confirmation prompt

**Display**:

- Shows service name based on current language
- Displays price with discount (if applicable)
- Crossed-out original price when discount exists
- Final calculated price shown
- Edit and delete icons per service

#### Calculated Pricing

For each service with discount:

```javascript
if (discountType === "percentage") {
    finalPrice = price - (price * discount) / 100;
} else {
    finalPrice = price - discount;
}
```

**Data Storage**: `localStorage.setItem('services_master', JSON.stringify(services))`

**Service Structure**:

```javascript
{
    id: string,
    en: string,
    ar: string,
    price: string,
    discount: string,
    discountType: 'percentage' | 'fixed',
    description: string,
    category: 'photography' | 'web' | 'reels' | 'other'
}
```

---

### 6. Package Management

**Route**: `/packages` (View), `/packages/add` (Create/Edit)

**Purpose**: Create bundled service packages for clients.

#### Packages View Page (`/packages`)

**Features**:

- Grid display of all available packages
- Each package card shows:
    - Package name (bilingual)
    - Original price (if discount exists, shown crossed out)
    - Final price after discount
    - Discount badge (percentage or fixed amount)
    - List of included features/services with checkmarks
    - Feature quantities (if specified)
    - "Select Package" button

**Package Selection**:

- Click to select package
- Visual indicator (ring border) for selected package
- Stores in `localStorage.setItem('selectedPackage')`
- Alert confirmation when selected

**Empty State**:

- Displays when no packages exist
- Call-to-action to create packages

#### Package Creation Page (`/packages/add`)

**Features**:

**Package Information**:

- **Name (English)**: Package name in English
- **Name (Arabic)**: Package name in Arabic
- **Price**: Package total price
- **Discount**: Optional discount amount
- **Discount Type**: Percentage or Fixed

**Features/Items Section**:

- Add package features/items:
    - Feature text in English
    - Feature text in Arabic
    - Quantity (optional, e.g., "10 posts", "5 designs")
- Features displayed as list with checkmarks
- Edit inline or delete features
- Quick-add from services master list

**Service Selection**:

- Checkbox list of all available services
- Auto-add selected services as package features
- Pre-fill from global service catalog

**Package Operations**:

- **Add Package**: Creates new package
- **Edit Package**: Inline editing of existing packages
- **Delete Package**: Removes package with confirmation
- **Activate/Deactivate**: Toggle package availability

**Validation**:

- Package name required (at least English or Arabic)
- Price must be positive number
- Discount validation (0-100% or positive fixed)
- At least one feature recommended

**Package Structure**:

```javascript
{
    id: string,
    en: string, // English name
    ar: string, // Arabic name
    price: string,
    discount: string,
    discountType: 'percentage' | 'fixed',
    features: [
        {
            en: string,
            ar: string,
            quantity: string
        }
    ],
    serviceIds: [string], // References to services
    isActive: boolean
}
```

**Data Storage**: `localStorage.setItem('packages_master', JSON.stringify(packages))`

**Price Calculation with Discount**:

```javascript
const discountedPrice = discountType === "percentage" ? price - (price * discount) / 100 : price - discount;
```

---

### 7. Campaign Planning

**Route**: `/planning`

**Purpose**: Create strategic marketing campaign plans for clients.

**Features**:

#### Client Selection

- Sidebar with list of all clients
- Click to select client
- Shows: Business name, category, contact info
- Selected client highlighted
- Stores selection in `localStorage.setItem('selectedClientId')`

#### Campaign Plan Form

**1. Campaign Objectives Section**

- Add objectives in both English and Arabic
- Multiple objectives supported
- Each objective has:
    - English text
    - Arabic text
    - Unique ID
- Edit and delete individual objectives
- Display list of added objectives

**2. Strategic Approach Section**

- Add strategies in both English and Arabic
- Multiple strategies supported
- Each strategy has:
    - English text
    - Arabic text
    - Unique ID
- Edit and delete individual strategies
- Display list of added strategies

**3. Services to Provide**

- **Select from Master Services**:
    - Checkbox list of all available services
    - Shows service name (localized)
    - Shows service price
    - Custom price input per service
    - Calculated final price with service discount
- **Client-Specific Custom Services**:
    - Add custom service with:
        - English name
        - Arabic name
        - Price
        - Discount (percentage or fixed)
        - Quantity (optional)
    - Delete custom services
    - Stored per client: `services_custom_{clientId}`

- **Price Override**:
    - Can set custom price per service for this campaign
    - Overrides default service price
    - Stored in `servicesPricing` object

**4. Budget**

- Input field for campaign budget (EGP)
- Auto-calculated based on selected services (suggested)
- Can be manually overridden

**5. Timeline**

- Text input for campaign duration
- Examples: "3 months", "6 weeks", "Q1 2025"
- Optional start date
- Optional duration string

**6. Final Strategy Document**

- Generated text document combining:
    - Client information
    - Campaign objectives
    - Strategic approaches
    - Selected services
    - Budget and timeline
- Editable rich text area
- Download as text file

#### Plan Management

**Multiple Plans per Client**:

- Create multiple campaign plans for same client
- Switch between plans via dropdown
- Each plan stored separately: `campaign_plan_{index}`
- Plan naming: Auto-generated or custom

**Plan Operations**:

- **Save Plan**: Stores all campaign data
- **Edit Plan**: Toggle edit mode
- **New Plan**: Clear form for new campaign
- **Delete Plan**: Remove plan with confirmation

**Plan Structure**:

```javascript
{
    objective: string,
    strategy: string,
    services: [serviceId],
    servicesPricing: { serviceId: customPrice },
    budget: string,
    timeline: string,
    startDate: string,
    duration: string,
    finalStrategy: text,
    objectives: [
        { id, en, ar }
    ],
    strategies: [
        { id, en, ar }
    ]
}
```

**Data Storage**:

- Selected client: `localStorage.getItem('selectedClientId')`
- Campaign plan: `localStorage.setItem('campaign_plan_0', JSON.stringify(plan))`
- Client custom services: `localStorage.setItem('services_custom_{clientId}')`

#### Strategy Generation

- Auto-generates strategy document from:
    - Client SWOT analysis
    - Target segments
    - Selected objectives and strategies
    - Service descriptions
- Formatted markdown-style document
- Downloadable as text file

---

### 8. Quotations

**Route**: `/quotations`

**Purpose**: Generate professional price quotations for clients.

**Features**:

#### Client Selection

- Select existing client from list
- OR create "Global Quotation" without specific client
- Client name input for global quotations
- Shows client business info when selected

#### Service Selection

**From Master Catalog**:

- Checkbox list of all available services
- Each service shows:
    - Service name (bilingual)
    - Default price
    - Service-level discount (if any)
    - Custom price input field
- Select/deselect services for quotation

**Custom Services** (Quotation-Specific):

- Add ad-hoc services not in master catalog:
    - Service name (English)
    - Service name (Arabic)
    - Price
    - Discount (optional)
    - Discount type
- Stored per quotation
- Can delete custom services

#### Pricing Calculation

**Service-Level Pricing**:

1. Start with service price (default or custom)
2. Apply service discount if exists:
    ```javascript
    if (service.discount) {
        finalServicePrice = discountType === "percentage" ? price - (price * discount) / 100 : price - discount;
    }
    ```

**Subtotal Calculation**:

```javascript
subtotal = sum of all (service final prices)
```

**Quotation-Level Discount**:

- Apply additional discount to subtotal
- Can be percentage or fixed amount
- Input field for discount value
- Radio buttons for discount type

**Total Calculation**:

```javascript
if (quotationDiscountType === "percentage") {
    total = subtotal - (subtotal * quotationDiscount) / 100;
} else {
    total = subtotal - quotationDiscount;
}
```

#### Quotation Details

- **Note**: Additional comments or terms
- **Valid Until**: Expiration date (optional)
- **Services Summary**: List of all selected services with prices
- **Subtotal**: Sum before quotation discount
- **Discount**: Applied discount amount
- **Total**: Final quotation amount

#### Quotation Management

**Save Quotation**:

- Stores all quotation data
- Per-client storage: `quotations_{clientId}`
- Global quotations: `quotations_global`

**View Saved Quotations**:

- List of all quotations for selected client
- Shows: Date, services count, total amount, status
- Edit existing quotations
- Delete quotations

**Edit Quotation**:

- Load existing quotation data
- Modify services, prices, discounts
- Update and save changes

**Quotation Status** (Future):

- Draft
- Sent
- Approved
- Rejected

**Quotation Structure**:

```javascript
{
    id: string,
    clientId: string,
    clientName: string,
    selectedServices: [serviceId],
    servicesPricing: { serviceId: customPrice },
    customServices: [
        { id, en, ar, price, discount, discountType }
    ],
    subtotal: number,
    discountValue: number,
    discountType: 'percentage' | 'fixed',
    total: number,
    note: text,
    validUntil: date,
    createdAt: timestamp
}
```

**Data Storage**:

- Per-client: `localStorage.setItem('quotations_{clientId}')`
- Global: `localStorage.setItem('quotations_global')`
- Custom services: `localStorage.setItem('quotations_custom_{clientId}')`

#### Export Quotation (Future)

- Generate PDF quotation document
- Professional layout with company branding
- Itemized service list with pricing
- Terms and conditions
- Email to client

---

### 9. Contracts

**Route**: `/contracts`

**Purpose**: Generate and manage client contracts.

**Features**:

#### Client Selection

- Preview cards for all clients
- Click to select client for contract
- Shows client business name and contact info
- Can clear selection to choose different client

#### Contract Data Sources

The contract automatically pulls data from:

- **Client Data**: From `localStorage.getItem('clients')` or by ID
- **Campaign Plan**: From `localStorage.getItem('campaign_plan_0')`
- **Selected Package**: From `localStorage.getItem('selectedPackage')`

#### Contract Template

**English Template** includes:

```
MARKETING SERVICES AGREEMENT

1. SERVICES - Package details
2. TERM - Start date and duration
3. COMPENSATION - Package price and payment terms
4. RESPONSIBILITIES - Agency and client duties
5. CONFIDENTIALITY - NDA clauses
6. TERMINATION - Cancellation terms
7. INTELLECTUAL PROPERTY - Ownership rights
8. LIMITATION OF LIABILITY - Legal protection
```

**Arabic Template** (مسودة العقد بالعربية):

- Full Arabic contract template
- RTL text direction
- All equivalent sections

**Auto-Fill Variables**:

- `[DATE]` → Current date
- `[Client Name]` → From client business name or full name
- `[PACKAGE_NAME]` → From selected package
- `[PACKAGE_PRICE]` → From selected package pricing
- `[START DATE]` → From campaign plan
- `[DURATION]` → From campaign plan

#### Contract Editing

**Edit Mode**:

- Toggle edit mode with "Edit" button
- Large textarea for contract terms
- Modify any part of the contract
- Bilingual support (switch language)

**Quick Insert Terms** (Bilingual):

- Add custom terms/clauses
- English term input
- Arabic term input
- "Insert" button adds to contract
- Maintains formatting

**Save Contract**:

- Stores in `localStorage.setItem('contractTerms')`
- Persists across sessions
- Can be loaded and modified later

#### Contract Display

**Information Panels**:

1. **Client Info**:
    - Business name
    - Contact person
    - Email
    - Phone

2. **Package Info** (if selected):
    - Package name
    - Price
    - Included features

3. **Campaign Info** (if exists):
    - Budget
    - Timeline
    - Selected services count
    - Start date

**Contract Preview**:

- Formatted text display
- Scrollable contract body
- Preserves line breaks and formatting
- Language-specific rendering

#### Contract Actions

**Download Contract**:

- Downloads as `.txt` file
- Filename: `contract_{businessName}.txt`
- Contains full contract text
- Can be opened in any text editor

**Future Enhancements**:

- Generate PDF contracts
- E-signature integration
- Contract status tracking (draft, signed, active, expired)
- Contract renewal
- Version history

**Contract Structure**:

```javascript
{
    clientId: string,
    contractTerms: text,
    packageId: string,
    campaignPlanId: string,
    startDate: date,
    endDate: date,
    value: number,
    status: 'draft' | 'active' | 'signed',
    createdAt: timestamp
}
```

**Data Storage**:

- Contract terms: `localStorage.setItem('contractTerms')`
- Selected client: `localStorage.setItem('selectedClientId')`
- Associated data pulled from respective storage keys

---

### 10. Reports

**Route**: `/reports`

**Purpose**: Display client performance metrics and analytics.

**Features**:

#### Client Selection

- Automatically loads from `localStorage.getItem('selectedClientId')`
- Falls back to URL query parameter: `?client={clientId}`
- Back button to return to client detail page

#### Report Period Selection

- Month picker dropdown
- Format: "YYYY-MM" (e.g., "2025-01")
- Filter data by selected period

#### Earnings Card

- Large display of total earnings
- Percentage change indicator
- Trend direction (up/down arrow)
- Visual styling based on performance

#### Metrics Grid

Four key metrics with icons:

1. **Reach** 👁️: Total audience reached
2. **Engagement** ❤️: Interactions and engagement
3. **Followers** 👥: Follower growth
4. **Shares** 🔄: Content sharing metrics

Each metric shows:

- Current value (formatted with K suffix)
- Percentage change
- Trend indicator
- Color-coded icon

#### Platform Performance

Social media platform breakdown:

- **Facebook**: Reach and engagement
- **Instagram**: Reach and engagement
- **TikTok**: Reach and engagement
- **X (Twitter)**: Reach and engagement

Each platform shows:

- Platform name
- Reach metric with bar chart visualization
- Engagement metric with bar chart visualization
- Color-coded bars per platform

#### Top Posts Section

Table displaying best-performing content:

- **Platform**: Which social media platform
- **Content**: Post description
- **Reach**: Number of people reached
- **Engagement**: Number of interactions
- **Date**: Publication date

Sortable and filterable table with:

- Visual indicators for high performance
- Click to view post details (future)

#### Data Visualization

- Bar charts for platform comparison
- Percentage badges for changes
- Color-coded metrics (green for positive, red for negative)
- Responsive chart sizing

**Report Structure**:

```javascript
{
    clientId: string,
    period: string, // "2025-01"
    reportType: 'monthly' | 'quarterly' | 'campaign',
    earnings: {
        total: string,
        change: string,
        trend: 'up' | 'down'
    },
    metrics: [
        {
            key: string,
            label: string,
            value: string,
            change: string,
            icon: Component
        }
    ],
    platforms: [
        {
            name: string,
            reach: number,
            engagement: number,
            color: string
        }
    ],
    topPosts: [
        {
            id: number,
            platform: string,
            content: string,
            reach: number,
            engagement: number,
            date: string
        }
    ]
}
```

**Current Data**: Mock/sample data from component state

**Future Backend Integration**:

- Real-time data from social media APIs
- Historical data tracking
- Automated report generation
- PDF export
- Email delivery
- Custom date ranges
- Multiple report types (weekly, monthly, quarterly, annual)

---

### 11. System Features

#### Theme Support

**Implementation**: `contexts/themeContext.jsx`

**Features**:

- Light and Dark mode toggle
- System preference detection
- Persistent theme selection in localStorage
- CSS variables for colors:
    - Light mode: White backgrounds, dark text
    - Dark mode: Dark backgrounds, light text
- Smooth theme transitions
- Theme toggle in header/settings

**Color Scheme**:

- Light: `bg-light-50`, `text-light-900`
- Dark: `bg-dark-950`, `text-dark-50`
- Accent: `light-500` (orange/primary color)
- Secondary: `secdark-700`

#### Language & Internationalization

**Implementation**: `contexts/langContext.jsx`, `constants/i18n.js`

**Features**:

- **Bilingual Support**: Full English and Arabic translations
- **RTL/LTR Support**: Automatic text direction based on language
    - English: Left-to-Right (LTR)
    - Arabic: Right-to-Left (RTL)
- **Dynamic Translation**: `t(key)` function for all UI text
- **Language Toggle**: Switch between English/Arabic in header
- **Persistent Selection**: Stores language preference in localStorage
- **Localized Arrows**: Direction-aware arrow icons for navigation

**Translation Coverage**:

- All UI labels and buttons
- Form field labels and placeholders
- Validation error messages
- Navigation menu items
- Status messages and alerts
- Empty states and help text
- Data labels (services, categories, etc.)

**Translation Keys Structure**:

```javascript
{
    // Common
    "search_placeholder": "Search..." / "...ابحث",
    "save": "Save" / "حفظ",
    "cancel": "Cancel" / "إلغاء",

    // Navigation
    "Dashboard": "Dashboard" / "لوحة القيادة",
    "Clients": "Clients" / "العملاء",

    // Forms
    "full_name": "Full Name" / "الاسم الكامل",
    "email_address": "Email Address" / "البريد الإلكتروني",

    // Validations
    "invalid_email": "Invalid email" / "بريد إلكتروني غير صالح",
    "phone_error": "Invalid phone" / "رقم هاتف غير صالح"
}
```

#### Navigation System

**Implementation**: `Layouts/Sidebar.jsx`, `constants/index.jsx`

**Features**:

- Collapsible sidebar navigation
- Responsive mobile menu
- Grouped navigation items:
    - **Overview**: Dashboard, Reports
    - **Client Management**: New Client, Strategies, Quotations, Packages, Contracts
    - **Operations**: Clients, Add Packages, Services
    - **Management**: Users, Communications, Settings
- Active route highlighting
- Icon for each menu item
- Bilingual menu labels
- Smooth animations

**Layout Structure**:

- **Header**: Logo, search, theme toggle, language toggle, user menu
- **Sidebar**: Navigation menu with groups
- **Main Content**: Page content area
- **Footer**: Copyright and links

#### Data Persistence

**Implementation**: Browser's `localStorage`

**Storage Keys**:

- `clients` - Array of all clients
- `services_master` - Global services catalog
- `services_custom_{clientId}` - Client-specific services
- `packages_master` - All packages
- `campaign_plan_0` - Campaign plan (per client/index)
- `quotations_{clientId}` - Quotations per client
- `quotations_global` - Global quotations
- `quotations_custom_{clientId}` - Custom quotation services
- `selectedClientId` - Currently selected client
- `selectedPackage` - Currently selected package
- `contractTerms` - Contract template text
- `onboarding_draft` - Onboarding form draft (auto-save)
- `theme` - Selected theme (light/dark)
- `language` - Selected language (en/ar)

**Data Operations**:

- **Create**: Add new items to arrays
- **Read**: Parse JSON from localStorage
- **Update**: Find by ID and update object
- **Delete**: Soft delete or filter from array
- **Auto-save**: Form drafts saved on change

#### Form Validation

**Implementation**: `constants/validators.js`, `constants/validations.js`

**Validators**:

- **Email**: RFC 5322 compliant
- **Egyptian Mobile**: `^(\+201|01)[0-2,5][0-9]{8}$`
- **URL**: HTTP/HTTPS validation with protocol-less support
- **Required Fields**: Non-empty string check
- **Custom Validators**: Per-field validation functions

**Validation Approach**:

- Non-blocking validations (show warnings, allow progression)
- Real-time validation on field blur
- Clear errors on field change
- Visual error indicators (red borders, error messages)
- Internationalized error messages

#### Responsive Design

**Implementation**: Tailwind CSS with responsive utilities

**Breakpoints**:

- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md, lg)
- Desktop: > 1024px (xl, 2xl)

**Responsive Patterns**:

- Stack columns on mobile
- Grid layouts adapt to screen size
- Collapsible navigation on mobile
- Touch-friendly button sizes
- Readable font sizes across devices
- Appropriate spacing and padding

#### Component Architecture

**Reusable Components**:

- `ClientInfo.jsx` - Client card display
- `LocalizedArrow.jsx` - Direction-aware arrows
- Custom hooks:
    - `useLang()` - Translation and language context
    - `useTheme()` - Theme context
    - `use-click-outside()` - Detect clicks outside element

**Design System**:

- Consistent card styling
- Standardized buttons (primary, secondary, ghost, danger)
- Form input styling
- Loading states
- Empty states with illustrations
- Consistent spacing scale
- Color palette with semantic naming

---

## User Workflows

### Workflow 1: Complete Client Onboarding

1. Navigate to `/onboarding`
2. Fill Step 1: Personal Info → Next
3. Fill Step 2: Business Info → Next
4. Fill Step 3: Contact Info → Next
5. Add branches (optional) → Next
6. Add social media links → Next
7. Fill SWOT analysis → Next
8. Add target segments → Next
9. Add competitors → Complete
10. Client saved to database
11. Redirected to `/clients`

### Workflow 2: Create Campaign Plan

1. Navigate to `/planning`
2. Select client from sidebar
3. Add campaign objectives (bilingual)
4. Add strategic approaches (bilingual)
5. Select services from master list
6. Add custom services (optional)
7. Set budget
8. Set timeline
9. Review/edit final strategy
10. Save plan
11. Plan available for contract generation

### Workflow 3: Generate Quotation

1. Navigate to `/quotations`
2. Select client OR choose global quotation
3. Select services from catalog
4. Adjust prices (optional)
5. Add custom services (optional)
6. Apply quotation-level discount (optional)
7. Add notes
8. Review subtotal and total
9. Save quotation
10. Download/send to client

### Workflow 4: Create Contract

1. Ensure campaign plan exists (optional)
2. Ensure package selected (optional)
3. Navigate to `/contracts`
4. Select client
5. Contract auto-populated with:
    - Client details
    - Package info
    - Campaign info
6. Edit contract terms as needed
7. Add custom clauses
8. Save contract
9. Download for signing

### Workflow 5: View Client Reports

1. Navigate to `/clients`
2. Select client card
3. View client detail page
4. Navigate to Reports
5. Select report period (month)
6. View metrics:
    - Earnings
    - Reach, Engagement, Followers, Shares
    - Platform performance
    - Top posts
7. Export report (future)

---

## State Management & Data Flow

### Current Implementation

- **Local State**: React useState in components
- **Context State**: Theme and Language contexts
- **Persistent State**: Browser localStorage
- **No Backend**: All data stored client-side

### Data Flow Patterns

**Client Selection Flow**:

```
User clicks client card
  → Store clientId in localStorage
  → Navigate to destination page
  → Destination reads localStorage
  → Loads client data
  → Displays client info
```

**Form Submission Flow**:

```
User fills form
  → Validation on blur/change
  → Submit button clicked
  → Validate all fields
  → Generate unique ID
  → Add timestamp
  → Store in localStorage
  → Navigate to success page
```

**Multi-Step Form Flow**:

```
Step 1: Collect data → Store in state
Step 2: Collect data → Merge with state
...
Final Step: Collect data → Merge with state
Complete: Save entire object to localStorage
```

**Edit Flow**:

```
Load item by ID from localStorage
  → Parse JSON to object
  → Set as form state
  → User edits fields
  → Save updates same object
  → Update localStorage array
```

### Future Backend Integration Points

**Authentication Flow**:

```
Login → POST /api/v1/auth/login
  → Receive JWT token
  → Store token in localStorage/cookies
  → Include in all subsequent requests
```

**Data Fetching Flow**:

```
Component mounts
  → Check cache/localStorage
  → If stale, fetch from API
  → GET /api/v1/[resource]
  → Update local state
  → Render component
```

**Data Mutation Flow**:

```
User submits form
  → Optimistic update (local state)
  → POST/PUT /api/v1/[resource]
  → On success: Confirm update
  → On error: Rollback + show error
```

---

## Technical Implementation Details

### Technology Stack

- **Framework**: React 19.2.0
- **Routing**: React Router DOM 6.27.0
- **Styling**: Tailwind CSS 4.1.14
- **Icons**: Lucide React 0.545.0
- **Forms**: Formik 2.4.5
- **Validation**: Yup 1.4.0
- **Rich Text**: React Quill 3.6.0
- **Build Tool**: Vite 7.1.9
- **Language**: JavaScript (ES6+)

### Project Structure

```
src/
├── App.jsx                 # Main app component & routing
├── main.jsx               # App entry point
├── index.css              # Global styles
├── assets/                # Images, fonts, static files
├── components/            # Reusable components
│   └── LocalizedArrow.jsx
├── constants/             # Static data & config
│   ├── i18n.js           # Translation keys
│   ├── index.jsx         # Nav links, mock data
│   ├── validations.js    # Validation rules
│   └── validators.js     # Validation functions
├── contexts/              # React contexts
│   ├── langContext.jsx   # Language state
│   └── themeContext.jsx  # Theme state
├── hooks/                 # Custom hooks
│   ├── use-click-outside.jsx
│   ├── useLang.jsx
│   └── useTheme.jsx
├── Layouts/               # Layout components
│   ├── Footer.jsx
│   ├── Header.jsx
│   └── Sidebar.jsx
├── routes/                # Page components
│   ├── Layout.jsx        # Main layout wrapper
│   ├── dashboard/
│   │   └── page.jsx
│   ├── onboarding/
│   │   ├── page.jsx
│   │   └── steps/        # Onboarding step components
│   ├── clients/
│   │   ├── page.jsx      # Clients list
│   │   ├── ClientInfo.jsx
│   │   └── detail/
│   │       └── page.jsx  # Client detail
│   ├── planning/
│   │   └── page.jsx
│   ├── services/
│   │   └── page.jsx
│   ├── packages/
│   │   ├── page.jsx      # Packages list
│   │   └── add.jsx       # Create package
│   ├── quotations/
│   │   └── page.jsx
│   ├── contracts/
│   │   └── page.jsx
│   └── reports/
│       └── page.jsx
└── utils/                 # Utility functions
    ├── cn.js             # Class name utility
    └── direction.js      # RTL/LTR helpers
```

### Key Dependencies

- `@tanstack/react-query`: Data fetching (prepared for backend)
- `formik`: Form state management
- `yup`: Schema validation
- `react-router-dom`: Client-side routing
- `next-themes`: Theme management
- `lucide-react`: Icon library
- `clsx` & `tailwind-merge`: Conditional classes

### Build Configuration

- **Development**: `npm run dev` - Vite dev server on port 5173
- **Production**: `npm run build` - Static build to `dist/`
- **Preview**: `npm run preview` - Preview production build
- **Linting**: `npm run lint` - ESLint code quality

### Environment Variables (Vite)

- `VITE_BASE`: Base URL for deployment (e.g., GitHub Pages)
- `import.meta.env.BASE_URL`: Accessed in code

---

## Design Patterns & Best Practices

### Component Patterns

1. **Container/Presentational**: Separate logic from UI
2. **Compound Components**: Multi-part components (e.g., cards)
3. **Render Props**: Flexible component composition
4. **Custom Hooks**: Reusable stateful logic

### Code Organization

- **Feature-based Structure**: Pages grouped by feature
- **Shared Components**: Reusable UI components
- **Constants**: Centralized configuration
- **Utils**: Pure helper functions
- **Contexts**: Global state management

### Naming Conventions

- **Components**: PascalCase (e.g., `ClientInfo`)
- **Files**: camelCase for utils, PascalCase for components
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_URL`)
- **CSS Classes**: Tailwind utilities + custom classes

### Error Handling

- Try-catch blocks for localStorage operations
- Fallback values for missing data
- User-friendly error messages
- Validation feedback
- Empty state handling

### Performance Optimizations

- Lazy loading routes (future)
- Memoization with useMemo/useCallback
- Debounced search inputs
- Virtual scrolling for long lists (future)
- Code splitting

---

## Technology Stack Requirements

### Recommended Stack:

- **Framework**: Node.js with Express.js OR Python with FastAPI/Django
- **Database**: PostgreSQL (preferred) or MongoDB
- **Authentication**: JWT-based authentication with refresh tokens
- **File Storage**: AWS S3 or local storage for documents/images
- **Email Service**: SendGrid, AWS SES, or similar
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Joi (Node.js) or Pydantic (Python)
- **ORM**: Prisma/TypeORM (Node.js) or SQLAlchemy (Python)

---

## Core Data Models & Database Schema

### 1. User Model

```
Fields:
- id (UUID, primary key)
- email (string, unique, required, indexed)
- password (string, hashed with bcrypt, required)
- fullName (string)
- role (enum: 'admin', 'manager', 'employee')
- createdAt (timestamp)
- updatedAt (timestamp)
- lastLogin (timestamp)
- isActive (boolean, default: true)
- deletedAt (timestamp, nullable for soft delete)

Relations:
- One-to-Many: Clients (as creator)
- One-to-Many: CampaignPlans (as creator)
- One-to-Many: Quotations (as creator)
- One-to-Many: Contracts (as creator)
```

### 2. Client Model

```
Fields:
- id (UUID, primary key)
- createdBy (UUID, foreign key -> User)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)
- status (enum: 'active', 'inactive', 'pending', default: 'active')

// Personal Information (JSON or nested fields)
- personal_fullName (string)
- personal_email (string, validated)
- personal_phone (string, Egyptian mobile format: +201XXXXXXXXX or 01XXXXXXXXX)
- personal_position (string, optional)

// Business Information
- business_name (string, indexed)
- business_category (enum: 'retail', 'restaurant', 'healthcare', 'technology',
                     'education', 'real-estate', 'automotive', 'beauty', 'finance', 'other')
- business_description (text)
- business_mainOfficeAddress (text)
- business_establishedYear (integer, optional)

// Contact Information
- contact_businessPhone (string, Egyptian mobile)
- contact_businessWhatsApp (string, Egyptian mobile)
- contact_businessEmail (string, validated)
- contact_website (string, URL format, optional)

Relations:
- Many-to-One: User (creator)
- One-to-Many: Branches
- One-to-Many: Segments
- One-to-Many: Competitors
- One-to-Many: SocialLinks
- One-to-One: SwotAnalysis
- One-to-Many: CampaignPlans
- One-to-Many: Quotations
- One-to-Many: Contracts
- One-to-Many: Reports
- One-to-Many: Services (client-specific)
```

### 3. Branch Model

```
Fields:
- id (UUID, primary key)
- clientId (UUID, foreign key -> Client, indexed)
- name (string, required)
- address (text)
- phone (string, optional)
- createdAt (timestamp)
- updatedAt (timestamp)

Relations:
- Many-to-One: Client
```

### 4. Segment (Target Audience) Model

```
Fields:
- id (UUID, primary key)
- clientId (UUID, foreign key -> Client, indexed)
- name (string, required)
- description (text)
- ageRange (string, e.g., "18-35")
- gender (enum: 'all', 'male', 'female', 'other')
- interests (text, comma-separated or JSON array)
- incomeLevel (enum: 'low', 'middle', 'high', 'varied')
- createdAt (timestamp)
- updatedAt (timestamp)

Relations:
- Many-to-One: Client
```

### 5. Competitor Model

```
Fields:
- id (UUID, primary key)
- clientId (UUID, foreign key -> Client, indexed)
- name (string, required)
- description (text)
- swot_strengths (JSON array of strings)
- swot_weaknesses (JSON array of strings)
- swot_opportunities (JSON array of strings)
- swot_threats (JSON array of strings)
- createdAt (timestamp)
- updatedAt (timestamp)

Relations:
- Many-to-One: Client
```

### 6. SocialLink Model

```
Fields:
- id (UUID, primary key)
- clientId (UUID, foreign key -> Client, indexed)
- platform (string, e.g., 'facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'custom')
- platformName (string, for custom platforms)
- url (string, URL format, required)
- type (enum: 'business', 'personal')
- createdAt (timestamp)
- updatedAt (timestamp)

Relations:
- Many-to-One: Client
```

### 7. SwotAnalysis Model

```
Fields:
- id (UUID, primary key)
- clientId (UUID, foreign key -> Client, unique, indexed)
- strengths (JSON array of strings)
- weaknesses (JSON array of strings)
- opportunities (JSON array of strings)
- threats (JSON array of strings)
- createdAt (timestamp)
- updatedAt (timestamp)

Relations:
- One-to-One: Client
```

### 8. Service Model

```
Fields:
- id (UUID, primary key)
- en (string, English name, required)
- ar (string, Arabic name, required)
- description (text)
- category (enum: 'photography', 'web', 'reels', 'other')
- price (decimal(10,2), optional)
- discount (decimal(10,2), optional)
- discountType (enum: 'percentage', 'fixed', default: 'percentage')
- isGlobal (boolean, default: true)
- clientId (UUID, foreign key -> Client, nullable, only for client-specific services)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)

Relations:
- Many-to-One: Client (optional, for client-specific services)
- Many-to-Many: Packages (through PackageService)
- Many-to-Many: CampaignPlans (through CampaignService)

Constraints:
- Unique constraint on (en, clientId) - prevent duplicate service names per client
- If isGlobal=true, clientId must be null
```

### 9. Package Model

```
Fields:
- id (UUID, primary key)
- nameEn (string, English name, required)
- nameAr (string, Arabic name, required)
- price (decimal(10,2), required)
- discount (decimal(10,2), optional, default: 0)
- discountType (enum: 'percentage', 'fixed', default: 'percentage')
- features (JSON array): [
    {
        en: string,
        ar: string,
        quantity: string (optional)
    }
]
- isActive (boolean, default: true)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)

Relations:
- Many-to-Many: Services (through PackageService)
- One-to-Many: Contracts

Computed Fields:
- finalPrice (calculated): price - discount based on discountType
```

### 10. PackageService (Join Table)

```
Fields:
- id (UUID, primary key)
- packageId (UUID, foreign key -> Package)
- serviceId (UUID, foreign key -> Service)
- createdAt (timestamp)

Relations:
- Many-to-One: Package
- Many-to-One: Service
```

### 11. CampaignPlan Model

```
Fields:
- id (UUID, primary key)
- clientId (UUID, foreign key -> Client, indexed)
- planName (string)
- objectives (JSON array): [
    { id: string, en: string, ar: string }
]
- strategies (JSON array): [
    { id: string, en: string, ar: string }
]
- servicesPricing (JSON object): { serviceId: customPrice }
- budget (decimal(10,2))
- timeline (string)
- startDate (date, optional)
- duration (string, optional)
- finalStrategy (text, generated document)
- status (enum: 'draft', 'active', 'completed', 'cancelled', default: 'draft')
- createdBy (UUID, foreign key -> User, indexed)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)

Relations:
- Many-to-One: Client
- Many-to-One: User (creator)
- Many-to-Many: Services (through CampaignService)
- One-to-Many: Contracts
```

### 12. CampaignService (Join Table)

```
Fields:
- id (UUID, primary key)
- campaignPlanId (UUID, foreign key -> CampaignPlan)
- serviceId (UUID, foreign key -> Service)
- customPrice (decimal(10,2), optional)
- createdAt (timestamp)

Relations:
- Many-to-One: CampaignPlan
- Many-to-One: Service
```

### 13. Quotation Model

```
Fields:
- id (UUID, primary key)
- quotationNumber (string, unique, auto-generated, e.g., "QUO-2025-0001")
- clientId (UUID, foreign key -> Client, nullable, indexed)
- clientName (string, for global quotations without client)
- servicesPricing (JSON object): { serviceId: customPrice }
- customServices (JSON array): [
    {
        id: string,
        en: string,
        ar: string,
        price: decimal,
        discount: decimal,
        discountType: string
    }
]
- subtotal (decimal(10,2), calculated)
- discountValue (decimal(10,2), default: 0)
- discountType (enum: 'percentage', 'fixed', default: 'percentage')
- total (decimal(10,2), calculated)
- note (text, optional)
- status (enum: 'draft', 'sent', 'approved', 'rejected', default: 'draft')
- validUntil (date, optional)
- sentAt (timestamp, nullable)
- approvedAt (timestamp, nullable)
- rejectedAt (timestamp, nullable)
- createdBy (UUID, foreign key -> User, indexed)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)

Relations:
- Many-to-One: Client (optional)
- Many-to-One: User (creator)
- Many-to-Many: Services (through QuotationService)
- One-to-One: Contract (when converted)

Computed Fields:
- subtotal: sum of all service prices + custom service prices
- total: subtotal - discount based on discountType
```

### 14. QuotationService (Join Table)

```
Fields:
- id (UUID, primary key)
- quotationId (UUID, foreign key -> Quotation)
- serviceId (UUID, foreign key -> Service)
- customPrice (decimal(10,2), optional)
- createdAt (timestamp)

Relations:
- Many-to-One: Quotation
- Many-to-One: Service
```

### 15. Contract Model

```
Fields:
- id (UUID, primary key)
- contractNumber (string, unique, auto-generated, e.g., "CNT-2025-0001")
- clientId (UUID, foreign key -> Client, indexed)
- packageId (UUID, foreign key -> Package, optional)
- campaignPlanId (UUID, foreign key -> CampaignPlan, optional)
- quotationId (UUID, foreign key -> Quotation, optional)
- contractTerms (text, customizable, required)
- startDate (date, required)
- endDate (date, required)
- value (decimal(10,2), required)
- status (enum: 'draft', 'active', 'completed', 'cancelled', 'renewed', default: 'draft')
- signedDate (date, optional)
- createdBy (UUID, foreign key -> User, indexed)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)

Relations:
- Many-to-One: Client
- Many-to-One: Package (optional)
- Many-to-One: CampaignPlan (optional)
- Many-to-One: Quotation (optional)
- Many-to-One: User (creator)

Constraints:
- endDate must be after startDate
- At least one of packageId, campaignPlanId, or quotationId should be present
```

### 16. Report Model

```
Fields:
- id (UUID, primary key)
- clientId (UUID, foreign key -> Client, indexed)
- reportType (enum: 'monthly', 'quarterly', 'campaign', 'custom')
- period (string, e.g., "2025-01")
- title (string)
- metrics (JSON object): {
    earnings: { total: string, change: string, trend: string },
    reach: integer,
    engagement: integer,
    followers: integer,
    shares: integer
}
- platforms (JSON array): [
    { name: string, reach: integer, engagement: integer, color: string }
]
- topPosts (JSON array): [
    { id: integer, platform: string, content: string, reach: integer, engagement: integer, date: string }
]
- generatedBy (UUID, foreign key -> User, indexed)
- createdAt (timestamp)
- updatedAt (timestamp)
- deletedAt (timestamp, nullable)

Relations:
- Many-to-One: Client
- Many-to-One: User (generator)
```

### 17. AuditLog Model

```
Fields:
- id (UUID, primary key)
- userId (UUID, foreign key -> User, indexed)
- action (enum: 'create', 'read', 'update', 'delete')
- entityType (string, e.g., 'Client', 'Contract', 'Quotation')
- entityId (UUID)
- changes (JSON object, stores before/after values)
- ipAddress (string)
- userAgent (string)
- timestamp (timestamp, indexed)

Relations:
- Many-to-One: User
```

---

## API Endpoints Structure

### Authentication Endpoints

```
POST   /api/v1/auth/register
Body: { email, password, fullName, role }
Response: { user, accessToken, refreshToken }

POST   /api/v1/auth/login
Body: { email, password }
Response: { user, accessToken, refreshToken }

POST   /api/v1/auth/refresh
Body: { refreshToken }
Response: { accessToken, refreshToken }

POST   /api/v1/auth/logout
Headers: Authorization: Bearer <token>
Response: { message }

POST   /api/v1/auth/forgot-password
Body: { email }
Response: { message }

POST   /api/v1/auth/reset-password
Body: { token, newPassword }
Response: { message }

GET    /api/v1/auth/me
Headers: Authorization: Bearer <token>
Response: { user }

PUT    /api/v1/auth/profile
Headers: Authorization: Bearer <token>
Body: { fullName, email, currentPassword, newPassword }
Response: { user }
```

### Client Management Endpoints

```
GET    /api/v1/clients
Headers: Authorization: Bearer <token>
Query: page, limit, search, status, category, sortBy, sortOrder
Response: { clients[], total, page, totalPages }

POST   /api/v1/clients
Headers: Authorization: Bearer <token>
Body: { personal, business, contact, branches[], segments[], competitors[], socialLinks[], swot }
Response: { client }

GET    /api/v1/clients/:id
Headers: Authorization: Bearer <token>
Response: { client }

PUT    /api/v1/clients/:id
Headers: Authorization: Bearer <token>
Body: { personal, business, contact, status }
Response: { client }

DELETE /api/v1/clients/:id
Headers: Authorization: Bearer <token>
Response: { message }

GET    /api/v1/clients/:id/branches
Response: { branches[] }

POST   /api/v1/clients/:id/branches
Body: { name, address, phone }
Response: { branch }

PUT    /api/v1/clients/:id/branches/:branchId
Body: { name, address, phone }
Response: { branch }

DELETE /api/v1/clients/:id/branches/:branchId
Response: { message }

GET    /api/v1/clients/:id/segments
Response: { segments[] }

POST   /api/v1/clients/:id/segments
Body: { name, description, ageRange, gender, interests, incomeLevel }
Response: { segment }

PUT    /api/v1/clients/:id/segments/:segmentId
Body: { name, description, ageRange, gender, interests, incomeLevel }
Response: { segment }

DELETE /api/v1/clients/:id/segments/:segmentId
Response: { message }

GET    /api/v1/clients/:id/competitors
Response: { competitors[] }

POST   /api/v1/clients/:id/competitors
Body: { name, description, swot }
Response: { competitor }

PUT    /api/v1/clients/:id/competitors/:competitorId
Body: { name, description, swot }
Response: { competitor }

DELETE /api/v1/clients/:id/competitors/:competitorId
Response: { message }

GET    /api/v1/clients/:id/swot
Response: { swot }

PUT    /api/v1/clients/:id/swot
Body: { strengths[], weaknesses[], opportunities[], threats[] }
Response: { swot }

GET    /api/v1/clients/:id/social-links
Response: { socialLinks[] }

POST   /api/v1/clients/:id/social-links
Body: { platform, platformName, url, type }
Response: { socialLink }

PUT    /api/v1/clients/:id/social-links/:linkId
Body: { platform, platformName, url, type }
Response: { socialLink }

DELETE /api/v1/clients/:id/social-links/:linkId
Response: { message }
```

### Service Management Endpoints

```
GET    /api/v1/services
Headers: Authorization: Bearer <token>
Query: category, isGlobal, clientId, page, limit
Response: { services[], total }

POST   /api/v1/services
Headers: Authorization: Bearer <token>
Body: { en, ar, description, category, price, discount, discountType, isGlobal, clientId }
Response: { service }

GET    /api/v1/services/:id
Headers: Authorization: Bearer <token>
Response: { service }

PUT    /api/v1/services/:id
Headers: Authorization: Bearer <token>
Body: { en, ar, description, category, price, discount, discountType }
Response: { service }

DELETE /api/v1/services/:id
Headers: Authorization: Bearer <token>
Response: { message }

GET    /api/v1/services/by-category/:category
Headers: Authorization: Bearer <token>
Response: { services[] }

GET    /api/v1/clients/:clientId/services
Headers: Authorization: Bearer <token>
Response: { services[] }

POST   /api/v1/clients/:clientId/services
Headers: Authorization: Bearer <token>
Body: { en, ar, description, price, discount, discountType, quantity }
Response: { service }
```

### Package Management Endpoints

```
GET    /api/v1/packages
Headers: Authorization: Bearer <token>
Query: isActive, page, limit
Response: { packages[], total }

POST   /api/v1/packages
Headers: Authorization: Bearer <token>
Body: { nameEn, nameAr, price, discount, discountType, features[], serviceIds[] }
Response: { package }

GET    /api/v1/packages/:id
Headers: Authorization: Bearer <token>
Response: { package }

PUT    /api/v1/packages/:id
Headers: Authorization: Bearer <token>
Body: { nameEn, nameAr, price, discount, discountType, features[], serviceIds[] }
Response: { package }

DELETE /api/v1/packages/:id
Headers: Authorization: Bearer <token>
Response: { message }

PATCH  /api/v1/packages/:id/activate
Headers: Authorization: Bearer <token>
Response: { package }

PATCH  /api/v1/packages/:id/deactivate
Headers: Authorization: Bearer <token>
Response: { package }
```

### Campaign Planning Endpoints

```
GET    /api/v1/campaigns
Headers: Authorization: Bearer <token>
Query: clientId, status, page, limit
Response: { campaigns[], total }

POST   /api/v1/campaigns
Headers: Authorization: Bearer <token>
Body: { clientId, planName, objectives[], strategies[], serviceIds[], servicesPricing, budget, timeline, startDate, duration }
Response: { campaign }

GET    /api/v1/campaigns/:id
Headers: Authorization: Bearer <token>
Response: { campaign }

PUT    /api/v1/campaigns/:id
Headers: Authorization: Bearer <token>
Body: { planName, objectives[], strategies[], serviceIds[], servicesPricing, budget, timeline, startDate, duration, status }
Response: { campaign }

DELETE /api/v1/campaigns/:id
Headers: Authorization: Bearer <token>
Response: { message }

GET    /api/v1/clients/:clientId/campaigns
Headers: Authorization: Bearer <token>
Response: { campaigns[] }

POST   /api/v1/campaigns/:id/generate-strategy
Headers: Authorization: Bearer <token>
Body: { language: 'en' | 'ar' }
Response: { finalStrategy }

GET    /api/v1/campaigns/:id/download
Headers: Authorization: Bearer <token>
Query: format=pdf|docx, language=en|ar
Response: File download
```

### Quotation Endpoints

```
GET    /api/v1/quotations
Headers: Authorization: Bearer <token>
Query: clientId, status, page, limit, search
Response: { quotations[], total }

POST   /api/v1/quotations
Headers: Authorization: Bearer <token>
Body: { clientId, clientName, serviceIds[], servicesPricing, customServices[], discountValue, discountType, note, validUntil }
Response: { quotation }

GET    /api/v1/quotations/:id
Headers: Authorization: Bearer <token>
Response: { quotation }

PUT    /api/v1/quotations/:id
Headers: Authorization: Bearer <token>
Body: { serviceIds[], servicesPricing, customServices[], discountValue, discountType, note, validUntil }
Response: { quotation }

DELETE /api/v1/quotations/:id
Headers: Authorization: Bearer <token>
Response: { message }

POST   /api/v1/quotations/:id/send
Headers: Authorization: Bearer <token>
Body: { recipientEmail, message }
Response: { message }

PATCH  /api/v1/quotations/:id/approve
Headers: Authorization: Bearer <token>
Response: { quotation }

PATCH  /api/v1/quotations/:id/reject
Headers: Authorization: Bearer <token>
Body: { reason }
Response: { quotation }

GET    /api/v1/quotations/:id/pdf
Headers: Authorization: Bearer <token>
Query: language=en|ar
Response: PDF file download

POST   /api/v1/quotations/:id/convert-to-contract
Headers: Authorization: Bearer <token>
Body: { startDate, endDate, contractTerms }
Response: { contract }

GET    /api/v1/clients/:clientId/quotations
Headers: Authorization: Bearer <token>
Response: { quotations[] }
```

### Contract Endpoints

```
GET    /api/v1/contracts
Headers: Authorization: Bearer <token>
Query: clientId, status, page, limit, search
Response: { contracts[], total }

POST   /api/v1/contracts
Headers: Authorization: Bearer <token>
Body: { clientId, packageId, campaignPlanId, quotationId, contractTerms, startDate, endDate, value }
Response: { contract }

GET    /api/v1/contracts/:id
Headers: Authorization: Bearer <token>
Response: { contract }

PUT    /api/v1/contracts/:id
Headers: Authorization: Bearer <token>
Body: { contractTerms, startDate, endDate, value, status }
Response: { contract }

DELETE /api/v1/contracts/:id
Headers: Authorization: Bearer <token>
Response: { message }

PATCH  /api/v1/contracts/:id/sign
Headers: Authorization: Bearer <token>
Body: { signedDate }
Response: { contract }

PATCH  /api/v1/contracts/:id/activate
Headers: Authorization: Bearer <token>
Response: { contract }

PATCH  /api/v1/contracts/:id/complete
Headers: Authorization: Bearer <token>
Response: { contract }

PATCH  /api/v1/contracts/:id/cancel
Headers: Authorization: Bearer <token>
Body: { reason }
Response: { contract }

POST   /api/v1/contracts/:id/renew
Headers: Authorization: Bearer <token>
Body: { newStartDate, newEndDate, newValue }
Response: { contract }

GET    /api/v1/contracts/:id/download
Headers: Authorization: Bearer <token>
Query: format=pdf|docx, language=en|ar
Response: File download

GET    /api/v1/clients/:clientId/contracts
Headers: Authorization: Bearer <token>
Response: { contracts[] }
```

### Report Endpoints

```
GET    /api/v1/reports
Headers: Authorization: Bearer <token>
Query: clientId, reportType, period, page, limit
Response: { reports[], total }

POST   /api/v1/reports
Headers: Authorization: Bearer <token>
Body: { clientId, reportType, period, title, metrics, platforms, topPosts }
Response: { report }

GET    /api/v1/reports/:id
Headers: Authorization: Bearer <token>
Response: { report }

PUT    /api/v1/reports/:id
Headers: Authorization: Bearer <token>
Body: { title, metrics, platforms, topPosts }
Response: { report }

DELETE /api/v1/reports/:id
Headers: Authorization: Bearer <token>
Response: { message }

GET    /api/v1/clients/:clientId/reports
Headers: Authorization: Bearer <token>
Response: { reports[] }

GET    /api/v1/reports/:id/pdf
Headers: Authorization: Bearer <token>
Query: language=en|ar
Response: PDF file download

GET    /api/v1/reports/:id/excel
Headers: Authorization: Bearer <token>
Response: Excel file download
```

### Dashboard/Analytics Endpoints

```
GET    /api/v1/dashboard/stats
Headers: Authorization: Bearer <token>
Response: {
    totalClients,
    activeClients,
    totalContracts,
    activeContracts,
    totalRevenue,
    monthlyRevenue,
    pendingQuotations,
    completedCampaigns
}

GET    /api/v1/dashboard/recent-sales
Headers: Authorization: Bearer <token>
Query: limit (default: 10)
Response: { recentSales[] }

GET    /api/v1/dashboard/top-products
Headers: Authorization: Bearer <token>
Query: limit (default: 10)
Response: { topProducts[] }

GET    /api/v1/analytics/clients
Headers: Authorization: Bearer <token>
Query: startDate, endDate, groupBy (day|week|month)
Response: { clientGrowth[], clientsByCategory[], clientsByStatus[] }

GET    /api/v1/analytics/revenue
Headers: Authorization: Bearer <token>
Query: startDate, endDate, groupBy (day|week|month)
Response: { revenueByPeriod[], revenueByService[], revenueByClient[] }

GET    /api/v1/analytics/services
Headers: Authorization: Bearer <token>
Query: startDate, endDate
Response: { serviceUsage[], popularServices[], serviceRevenue[] }
```

---

## Business Logic & Validation Rules

### Validation Rules

#### 1. Egyptian Phone Numbers

- Format: `+201XXXXXXXXX` (international) or `01XXXXXXXXX` (local)
- Valid prefixes: 010, 011, 012, 015
- Regex: `^(\+201|01)[0-2,5][0-9]{8}$`

#### 2. Email Validation

- Standard RFC 5322 email format
- Must contain @ symbol and valid domain

#### 3. URL Validation

- Must start with http:// or https://
- Valid domain format required

#### 4. Price & Discount Validation

- Prices: Non-negative decimals, max 2 decimal places
- Discounts:
    - Percentage: 0-100
    - Fixed: >= 0, cannot exceed base price
    - Calculate final price correctly based on type

#### 5. Date Validation

- All dates must be valid ISO 8601 format
- End dates must be after start dates
- Contract duration minimum: 1 day

#### 6. Text Length Limits

- Short text (names, titles): 255 characters
- Medium text (descriptions): 1000 characters
- Long text (terms, strategy): 50000 characters

### Calculation Logic

#### 1. Package Final Price

```javascript
function calculatePackagePrice(price, discount, discountType) {
    if (!discount || discount === 0) return price;

    if (discountType === "percentage") {
        return price - (price * discount) / 100;
    } else {
        return price - discount;
    }
}
```

#### 2. Quotation Total

```javascript
function calculateQuotationTotal(services, customServices, quotationDiscount, quotationDiscountType) {
    // Calculate subtotal
    let subtotal = 0;

    // Add service prices (with individual service discounts already applied)
    services.forEach((service) => {
        let servicePrice = service.customPrice || service.price;
        if (service.discount) {
            if (service.discountType === "percentage") {
                servicePrice -= (servicePrice * service.discount) / 100;
            } else {
                servicePrice -= service.discount;
            }
        }
        subtotal += servicePrice;
    });

    // Add custom service prices
    customServices.forEach((customService) => {
        let price = customService.price;
        if (customService.discount) {
            if (customService.discountType === "percentage") {
                price -= (price * customService.discount) / 100;
            } else {
                price -= customService.discount;
            }
        }
        subtotal += price;
    });

    // Apply quotation-level discount
    let total = subtotal;
    if (quotationDiscount) {
        if (quotationDiscountType === "percentage") {
            total -= (subtotal * quotationDiscount) / 100;
        } else {
            total -= quotationDiscount;
        }
    }

    return {
        subtotal: Math.max(0, subtotal),
        total: Math.max(0, total),
    };
}
```

#### 3. Service Final Price with Discount

```javascript
function calculateServiceFinalPrice(price, discount, discountType) {
    if (!discount || discount === 0) return price;

    let discountAmount = 0;
    if (discountType === "percentage") {
        discountAmount = (price * discount) / 100;
    } else {
        discountAmount = discount;
    }

    return Math.max(0, price - discountAmount);
}
```

### Multi-language Support

#### Request Handling

- Accept `Accept-Language` header: `en` or `ar`
- Default to `en` if not provided
- Return error messages in requested language

#### Response Format

```json
{
    "id": "uuid",
    "nameEn": "Social Media Marketing",
    "nameAr": "التسويق عبر وسائل التواصل الاجتماعي",
    "description": "Complete social media management"
}
```

For API responses, return both language fields and let frontend choose which to display.

#### Error Messages

Maintain translation files:

```javascript
// en.json
{
    "validation.email.invalid": "Please enter a valid email address",
    "validation.phone.invalid": "Please enter a valid Egyptian phone number",
    "error.client.notFound": "Client not found",
    "error.unauthorized": "Unauthorized access"
}

// ar.json
{
    "validation.email.invalid": "الرجاء إدخال بريد إلكتروني صالح",
    "validation.phone.invalid": "الرجاء إدخال رقم هاتف مصري صالح",
    "error.client.notFound": "العميل غير موجود",
    "error.unauthorized": "وصول غير مصرح به"
}
```

---

## Security Requirements

### 1. Authentication & Authorization

#### JWT Implementation

```javascript
// Access Token
- Payload: { userId, email, role }
- Expiry: 15 minutes
- Secret: Strong random string (min 32 characters)

// Refresh Token
- Payload: { userId, tokenId }
- Expiry: 7 days
- Store in database with user association
- Rotate on each refresh
```

#### Password Security

- Minimum length: 8 characters
- Must contain: uppercase, lowercase, number
- Hash with bcrypt (12 rounds)
- Never store plain text passwords

#### Role-Based Access Control (RBAC)

```
Admin:
- Full CRUD access to all entities
- User management
- System configuration

Manager:
- Full CRUD on clients, campaigns, quotations, contracts, reports
- Read-only on users
- Cannot modify system settings

Employee:
- Read access to clients, campaigns, contracts
- Create/update reports
- Cannot delete any records
- Cannot access user management
```

### 2. Data Protection

#### Input Sanitization

- Strip HTML tags from text inputs
- Escape special characters
- Validate all input against schema
- Maximum input size limits

#### SQL Injection Prevention

- Use parameterized queries/prepared statements
- Use ORM with proper escaping
- Never concatenate user input into queries

#### XSS Prevention

- Sanitize all user-generated content
- Set proper Content-Security-Policy headers
- Escape HTML in responses

### 3. API Security

#### Rate Limiting

```
General endpoints: 100 requests per 15 minutes per IP
Auth endpoints: 5 requests per 15 minutes per IP
File upload: 10 requests per hour per user
```

#### CORS Configuration

```javascript
{
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
    credentials: true,
    maxAge: 86400 // 24 hours
}
```

#### Request Size Limits

- JSON payload: 10MB max
- File uploads: 5MB per file
- Total request: 20MB max

### 4. Data Privacy

#### Soft Delete

- Never permanently delete clients, contracts, quotations
- Add `deletedAt` timestamp field
- Exclude soft-deleted records from queries by default
- Admin can restore or permanently delete

#### Data Encryption

- Encrypt sensitive data at rest (passwords, tokens)
- Use HTTPS for all communications
- Encrypt database backups

#### Audit Logging

Log all critical operations:

- User login/logout
- Client creation/modification/deletion
- Contract creation/signing/cancellation
- Quotation approval/rejection
- Package changes

---

## Error Handling

### HTTP Status Codes

```
200 OK - Successful GET, PUT, PATCH
201 Created - Successful POST
204 No Content - Successful DELETE
400 Bad Request - Validation errors, malformed request
401 Unauthorized - Missing or invalid authentication
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
409 Conflict - Duplicate resource, constraint violation
422 Unprocessable Entity - Semantic errors
429 Too Many Requests - Rate limit exceeded
500 Internal Server Error - Unexpected server error
503 Service Unavailable - Temporary downtime
```

### Error Response Format

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": [
            {
                "field": "email",
                "message": "Invalid email format",
                "code": "INVALID_FORMAT"
            },
            {
                "field": "phone",
                "message": "Please enter a valid Egyptian phone number",
                "code": "INVALID_PHONE"
            }
        ],
        "timestamp": "2025-11-06T10:30:00Z",
        "path": "/api/v1/clients"
    }
}
```

### Common Error Codes

```
VALIDATION_ERROR - Input validation failed
AUTHENTICATION_FAILED - Invalid credentials
UNAUTHORIZED - Missing authentication
FORBIDDEN - Insufficient permissions
NOT_FOUND - Resource not found
DUPLICATE_ENTRY - Resource already exists
CONSTRAINT_VIOLATION - Database constraint failed
RATE_LIMIT_EXCEEDED - Too many requests
INTERNAL_ERROR - Server error
SERVICE_UNAVAILABLE - Service temporarily down
```

---

## Environment Variables

```bash
# Application
NODE_ENV=development
PORT=5000
API_VERSION=v1
APP_NAME=Marketing Management Dashboard
APP_URL=http://localhost:5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/marketing_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_SSL=false

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# File Storage
STORAGE_TYPE=local # or 's3'
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880 # 5MB in bytes

# AWS S3 (if using S3)
AWS_REGION=us-east-1
AWS_S3_BUCKET=marketing-dashboard-files
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Marketing Dashboard <noreply@example.com>

# Frontend
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
RATE_LIMIT_AUTH_MAX=5

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging
LOG_LEVEL=info # debug, info, warn, error
LOG_FILE=./logs/app.log

# API Documentation
SWAGGER_ENABLED=true
SWAGGER_PATH=/api-docs

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-min-32-chars
CORS_ENABLED=true

# Features
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_AUDIT_LOGGING=true
ENABLE_FILE_UPLOAD=true
```

---

## Database Indexing Strategy

### Primary Indexes

```sql
-- User table
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_active ON users(is_active);

-- Client table
CREATE INDEX idx_client_created_by ON clients(created_by);
CREATE INDEX idx_client_status ON clients(status);
CREATE INDEX idx_client_business_name ON clients(business_name);
CREATE INDEX idx_client_category ON clients(business_category);
CREATE INDEX idx_client_deleted_at ON clients(deleted_at);

-- Branch table
CREATE INDEX idx_branch_client_id ON branches(client_id);

-- Segment table
CREATE INDEX idx_segment_client_id ON segments(client_id);

-- Competitor table
CREATE INDEX idx_competitor_client_id ON competitors(client_id);

-- SocialLink table
CREATE INDEX idx_sociallink_client_id ON social_links(client_id);

-- SwotAnalysis table
CREATE INDEX idx_swot_client_id ON swot_analysis(client_id);

-- Service table
CREATE INDEX idx_service_category ON services(category);
CREATE INDEX idx_service_client_id ON services(client_id);
CREATE INDEX idx_service_is_global ON services(is_global);
CREATE INDEX idx_service_deleted_at ON services(deleted_at);

-- Package table
CREATE INDEX idx_package_is_active ON packages(is_active);
CREATE INDEX idx_package_deleted_at ON packages(deleted_at);

-- CampaignPlan table
CREATE INDEX idx_campaign_client_id ON campaign_plans(client_id);
CREATE INDEX idx_campaign_created_by ON campaign_plans(created_by);
CREATE INDEX idx_campaign_status ON campaign_plans(status);
CREATE INDEX idx_campaign_deleted_at ON campaign_plans(deleted_at);

-- Quotation table
CREATE INDEX idx_quotation_client_id ON quotations(client_id);
CREATE INDEX idx_quotation_created_by ON quotations(created_by);
CREATE INDEX idx_quotation_status ON quotations(status);
CREATE INDEX idx_quotation_number ON quotations(quotation_number);
CREATE INDEX idx_quotation_deleted_at ON quotations(deleted_at);

-- Contract table
CREATE INDEX idx_contract_client_id ON contracts(client_id);
CREATE INDEX idx_contract_created_by ON contracts(created_by);
CREATE INDEX idx_contract_status ON contracts(status);
CREATE INDEX idx_contract_number ON contracts(contract_number);
CREATE INDEX idx_contract_start_date ON contracts(start_date);
CREATE INDEX idx_contract_deleted_at ON contracts(deleted_at);

-- Report table
CREATE INDEX idx_report_client_id ON reports(client_id);
CREATE INDEX idx_report_generated_by ON reports(generated_by);
CREATE INDEX idx_report_type ON reports(report_type);
CREATE INDEX idx_report_period ON reports(period);

-- AuditLog table
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
```

### Composite Indexes

```sql
-- For common query patterns
CREATE INDEX idx_client_status_category ON clients(status, business_category);
CREATE INDEX idx_campaign_client_status ON campaign_plans(client_id, status);
CREATE INDEX idx_quotation_client_status ON quotations(client_id, status);
CREATE INDEX idx_contract_client_status ON contracts(client_id, status);
```

---

## Testing Requirements

### 1. Unit Tests

Test individual functions and methods:

- Validation functions
- Calculation logic (pricing, discounts)
- Date utilities
- Authentication helpers
- Error handling

**Coverage Target**: Minimum 80%

### 2. Integration Tests

Test API endpoints:

- All CRUD operations
- Authentication flow
- Authorization checks
- Error responses
- Pagination and filtering

### 3. End-to-End Tests

Test complete workflows:

- Client onboarding process
- Campaign creation and strategy generation
- Quotation creation, approval, and conversion to contract
- Contract lifecycle
- Report generation

### 4. Test Data

Provide seed scripts:

```javascript
// seeds/
- users.seed.js (admin, manager, employee users)
- clients.seed.js (10-20 sample clients with full data)
- services.seed.js (master service list)
- packages.seed.js (5-10 sample packages)
- campaigns.seed.js (sample campaign plans)
- quotations.seed.js (sample quotations)
- contracts.seed.js (sample contracts)
```

### 5. Test Scripts

```json
{
    "scripts": {
        "test": "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage",
        "test:integration": "jest --testPathPattern=integration",
        "test:e2e": "jest --testPathPattern=e2e"
    }
}
```

---

## Performance Optimization

### 1. Database Optimization

- Use connection pooling (min: 2, max: 10)
- Implement proper indexes
- Use eager loading for related entities
- Batch operations when possible
- Use database transactions for multi-step operations

### 2. Caching Strategy

Use Redis for:

- Dashboard statistics (5 minutes TTL)
- Master service list (1 hour TTL)
- Package list (30 minutes TTL)
- User sessions
- Rate limiting counters

```javascript
// Example cache keys
dashboard:stats:{userId}
services:master:all
packages:active:all
user:session:{userId}
ratelimit:{ip}:{endpoint}
```

### 3. Pagination

Mandatory for all list endpoints:

- Default page size: 20
- Maximum page size: 100
- Return metadata: total, page, totalPages, hasNext, hasPrev

```json
{
    "data": [...],
    "meta": {
        "total": 150,
        "page": 1,
        "limit": 20,
        "totalPages": 8,
        "hasNext": true,
        "hasPrev": false
    }
}
```

### 4. Query Optimization

- Use `SELECT` only needed fields
- Implement cursor-based pagination for large datasets
- Use database views for complex queries
- Avoid N+1 queries with proper joins/eager loading

### 5. Response Time Targets

- GET endpoints: < 200ms
- POST/PUT endpoints: < 500ms
- Complex reports: < 2s
- File downloads: < 5s

---

## API Documentation

### Swagger/OpenAPI Setup

Generate interactive API documentation:

```yaml
openapi: 3.0.0
info:
    title: Marketing Management Dashboard API
    version: 1.0.0
    description: RESTful API for marketing management with bilingual support
    contact:
        name: API Support
        email: support@example.com

servers:
    - url: http://localhost:5000/api/v1
      description: Development server
    - url: https://api.example.com/api/v1
      description: Production server

components:
    securitySchemes:
        bearerAuth:
            type: http
            scheme: bearer
            bearerFormat: JWT

    schemas:
        Client:
            type: object
            properties:
                id:
                    type: string
                    format: uuid
                personal:
                    type: object
                    properties:
                        fullName:
                            type: string
                        email:
                            type: string
                            format: email
                        phone:
                            type: string
                            pattern: '^(\+201|01)[0-2,5][0-9]{8}$'
                # ... more fields

security:
    - bearerAuth: []
```

Access documentation at: `http://localhost:5000/api-docs`

---

## Deployment Guide

### Prerequisites

- Node.js 18+ (or Python 3.10+)
- PostgreSQL 14+
- Redis 6+ (optional, for caching)
- AWS account (if using S3)

### Development Setup

```bash
# Clone repository
git clone <repo-url>
cd marketing-dashboard-backend

# Install dependencies
npm install # or pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run db:create
npm run db:migrate
npm run db:seed

# Run development server
npm run dev

# Run tests
npm test
```

### Production Deployment

#### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
    api:
        build: .
        ports:
            - "5000:5000"
        environment:
            - DATABASE_URL=postgresql://user:pass@db:5432/marketing_db
        depends_on:
            - db
            - redis

    db:
        image: postgres:14-alpine
        environment:
            POSTGRES_DB: marketing_db
            POSTGRES_USER: user
            POSTGRES_PASSWORD: password
        volumes:
            - postgres_data:/var/lib/postgresql/data

    redis:
        image: redis:6-alpine
        volumes:
            - redis_data:/data

volumes:
    postgres_data:
    redis_data:
```

#### Using PM2 (Node.js)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "marketing-api" -- start

# Setup auto-restart
pm2 startup
pm2 save
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Monitoring & Logging

### Application Logging

Use structured logging:

```javascript
logger.info("Client created", {
    clientId: client.id,
    userId: user.id,
    timestamp: new Date().toISOString(),
});

logger.error("Database error", {
    error: err.message,
    stack: err.stack,
    context: "createClient",
});
```

### Health Check Endpoint

```
GET /api/v1/health
Response: {
    "status": "ok",
    "timestamp": "2025-11-06T10:30:00Z",
    "uptime": 3600,
    "database": "connected",
    "redis": "connected"
}
```

### Metrics to Track

- Request count by endpoint
- Response times (average, p95, p99)
- Error rates by type
- Active users
- Database connection pool status
- Cache hit/miss rates

---

## Additional Features

### 1. Email Templates

Create HTML email templates for:

- Welcome email (new client onboarding)
- Quotation sent
- Quotation approved/rejected
- Contract signed
- Contract expiring soon
- Monthly report ready
- Password reset

### 2. PDF Generation

Use libraries like:

- Node.js: `pdfkit`, `puppeteer`, or `jspdf`
- Python: `reportlab`, `weasyprint`

Generate PDFs for:

- Quotations (with company branding)
- Contracts (formatted legal document)
- Reports (charts and tables)
- Campaign strategies

### 3. Export Functionality

Support exporting data as:

- CSV: Client lists, service lists
- Excel: Reports with multiple sheets
- PDF: Formal documents
- JSON: Data backup/migration

### 4. Webhook Support

Allow external systems to subscribe to events:

- Client created
- Contract signed
- Quotation approved
- Report generated

### 5. Bulk Operations

Endpoints for:

- Bulk import clients (CSV)
- Bulk update services
- Bulk send quotations
- Bulk export data

---

## Migration & Backup Strategy

### Database Migrations

Use migration tools:

- Node.js: Knex.js, Sequelize, or Prisma Migrate
- Python: Alembic (SQLAlchemy)

Version control all schema changes:

```
migrations/
  001_create_users_table.sql
  002_create_clients_table.sql
  003_add_client_status_field.sql
```

### Backup Strategy

- Automated daily database backups
- Retain backups for 30 days
- Weekly full backups to off-site storage
- Test restore process monthly
- Backup environment variables separately

### Data Import/Export

Provide scripts for:

- Exporting data from localStorage format
- Importing existing client data
- Migrating between environments
- Data anonymization for testing

---

## Support & Maintenance

### Documentation Required

1. **API Reference**: Complete Swagger documentation
2. **Setup Guide**: Development environment setup
3. **Deployment Guide**: Production deployment steps
4. **Database Schema**: ERD and table descriptions
5. **Architecture Diagram**: System components and flow
6. **Troubleshooting Guide**: Common issues and solutions

### Maintenance Tasks

- Regular dependency updates
- Security patches
- Database optimization (VACUUM, ANALYZE)
- Log rotation
- Performance monitoring
- Backup verification

---

## Success Criteria

The backend implementation is complete when:

1. ✅ All API endpoints are implemented and tested
2. ✅ Authentication and authorization working correctly
3. ✅ Database schema matches requirements
4. ✅ All validations properly implemented
5. ✅ Error handling consistent across all endpoints
6. ✅ API documentation complete and accurate
7. ✅ Test coverage above 80%
8. ✅ Performance targets met
9. ✅ Security best practices followed
10. ✅ Deployment guide verified in production environment

---

**Generated**: November 6, 2025  
**Version**: 1.0.0  
**For**: Marketing Management Dashboard Frontend  
**Repository**: marktingmangmentdashboard
