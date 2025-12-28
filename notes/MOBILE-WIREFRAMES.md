# Mining ERP Mobile - Wireframes & UI Specifications

## Navigation Structure

4-Tab Bottom Navigation:
- 🏠 **Home**: Dashboard, quick actions
- 💼 **Work**: Approvals, tasks
- 📋 **Modules**: All ERP modules grid
- ⚙️ **More**: Settings, profile, additional features

## Key Screens

### 1. Login Screen
```
┌─────────────────────────────┐
│     Mining ERP              │
│                             │
│  Email                      │
│  [___________________]      │
│                             │
│  Password                   │
│  [___________________]      │
│                             │
│  [ ] Remember me            │
│                             │
│  [    Sign In    ]          │
│                             │
│  Forgot password?           │
└─────────────────────────────┘
```

### 2. Home Dashboard
```
┌─────────────────────────────┐
│  Mining ERP        🔔(3) 👤 │
├─────────────────────────────┤
│  Good morning, John Mensah  │
│  CEO • Yellow Power Int'l   │
├─────────────────────────────┤
│  ┌──────────┐  ┌──────────┐│
│  │ Approvals│  │  Tasks   ││
│  │    12    │  │    5     ││
│  └──────────┘  └──────────┘│
│  ┌──────────┐  ┌──────────┐│
│  │Inventory │  │ Incidents││
│  │    3     │  │    2     ││
│  └──────────┘  └──────────┘│
├─────────────────────────────┤
│  Quick Actions              │
│  [Request] [Incident]       │
│  [Upload]  [Maintenance]    │
├─────────────────────────────┤
│  Recent Activity            │
│  • Invoice approved 2h ago  │
│  • Incident logged 4h ago   │
└─────────────────────────────┘
```

### 3. Approval Detail
```
┌─────────────────────────────┐
│  ← Invoice #INV-2301    ⋮   │
├─────────────────────────────┤
│  Status: PENDING APPROVAL   │
│  Priority: HIGH             │
├─────────────────────────────┤
│  Vendor: ABC Mining Ltd.    │
│  Amount: ₵ 45,250.00        │
│  Due: Dec 30, 2025          │
│  Submitted: Kwame Asante    │
├─────────────────────────────┤
│  Line Items                 │
│  • Hydraulic Pump  ₵25,000  │
│  • Conveyor Belt   ₵15,250  │
│  • Safety Harness  ₵5,000   │
├─────────────────────────────┤
│  Attachments (2)            │
│  📄 Invoice_ABC_2301.pdf    │
├─────────────────────────────┤
│  Comments                   │
│  [Add comment...]           │
├─────────────────────────────┤
│  [  REJECT  ]  [  APPROVE  ]│
└─────────────────────────────┘
```

### 4. Modules Grid
```
┌─────────────────────────────┐
│  Modules              🔍     │
├─────────────────────────────┤
│  ┌──────────┐  ┌──────────┐│
│  │Inventory │  │Procure-  ││
│  │& Warehouse│  │ment      ││
│  │125 items │  │18 pending││
│  └──────────┘  └──────────┘│
│  ┌──────────┐  ┌──────────┐│
│  │ Safety & │  │   HR &   ││
│  │Compliance│  │Personnel ││
│  │2 incidents│  │45 staff  ││
│  └──────────┘  └──────────┘│
│  ┌──────────┐  ┌──────────┐│
│  │Fleet &   │  │Projects &││
│  │Equipment │  │Operations││
│  │24 vehicles│  │8 active  ││
│  └──────────┘  └──────────┘│
└─────────────────────────────┘
```

### 5. Offline Incident Capture
```
┌─────────────────────────────┐
│  ← New Incident   📡OFFLINE │
├─────────────────────────────┤
│  ⚠️ Offline - will sync     │
│     when connected          │
├─────────────────────────────┤
│  Type *                     │
│  [Near Miss          ▼]     │
│                             │
│  Severity *                 │
│  [Low][Medium][High][Crit]  │
│          ✓                  │
│                             │
│  Location *                 │
│  [Site B - Excavation]      │
│  📍 Use Current Location    │
│                             │
│  Description *              │
│  [____________________]     │
│  [____________________]     │
│                             │
│  Photos                     │
│  [📷][📷][+ Add]           │
├─────────────────────────────┤
│  [Save Draft][Queue Submit] │
└─────────────────────────────┘
```

## Design System (Yellow Power International Branding)

### Colors (from yellowpowerinternational.com)

**Primary Colors**
- **Brand Yellow**: #FDB913 (Primary brand color - buttons, accents, highlights)
- **Navy Blue**: #003366 (Header, navigation, primary text on dark backgrounds)
- **Deep Blue**: #001F3F (Alternative dark blue for depth)

**Neutral Colors**
- **White**: #FFFFFF (Backgrounds, cards)
- **Light Gray**: #F5F5F5 (Secondary backgrounds)
- **Medium Gray**: #E0E0E0 (Borders, dividers)
- **Dark Gray**: #333333 (Body text)
- **Charcoal**: #020817 (Headings, emphasis text)

**Semantic Colors**
- **Success**: #10B981 (Approvals, confirmations)
- **Error**: #EF4444 (Rejections, alerts)
- **Warning**: #F59E0B (Pending, caution)
- **Info**: #3B82F6 (Information, links)

**Gradient Overlays** (for hero sections)
- Dark overlay: rgba(0, 0, 0, 0.5) to rgba(0, 0, 0, 0.7)

### Typography (from yellowpowerinternational.com)

**Font Family**
- **Primary**: Inter (matches company website)
- **iOS Fallback**: SF Pro Display, SF Pro Text
- **Android Fallback**: Roboto

**Font Weights**
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

**Font Sizes**
- xs: 12px (captions, labels)
- sm: 14px (secondary text)
- base: 16px (body text)
- lg: 18px (emphasized text)
- xl: 20px (section headings)
- 2xl: 24px (screen titles)
- 3xl: 32px (hero headings)
- 4xl: 40px (large display)

**Line Heights**
- Tight: 1.2 (headings)
- Normal: 1.5 (body)
- Relaxed: 1.75 (long-form content)

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px
- 3xl: 64px

### Component Styles

**Buttons**
- Height: 48px (primary), 40px (secondary)
- Border radius: 6px
- Primary: #FDB913 background, #FFFFFF text, bold
- Secondary: #003366 background, #FFFFFF text
- Outline: Transparent background, #FDB913 border, #FDB913 text
- Touch target: 44px minimum

**Cards**
- Background: #FFFFFF
- Border radius: 12px
- Shadow: 0 2px 8px rgba(0, 0, 0, 0.1)
- Padding: 16px

**Inputs**
- Height: 48px
- Border radius: 8px
- Border: 1px solid #E0E0E0
- Focus border: 2px solid #FDB913
- Background: #FFFFFF

**List Items**
- Min height: 64px
- Padding: 12px 16px
- Border bottom: 1px solid #E0E0E0
- Active state: #F5F5F5 background

**Navigation**
- Tab bar height: 60px
- Tab bar background: #FFFFFF
- Active tab: #FDB913
- Inactive tab: #666666
- Tab bar shadow: 0 -2px 8px rgba(0, 0, 0, 0.1)

**Status Badges**
- Pending: #F59E0B background, #FFFFFF text
- Approved: #10B981 background, #FFFFFF text
- Rejected: #EF4444 background, #FFFFFF text
- Draft: #6B7280 background, #FFFFFF text
- Border radius: 12px
- Padding: 4px 12px
- Font size: 12px, bold
