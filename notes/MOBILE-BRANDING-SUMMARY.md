# Mining ERP Mobile - Yellow Power International Branding

## Brand Colors Applied

Based on **https://yellowpowerinternational.com**

### Primary Colors
- **Yellow Power Gold**: `#FDB913` - Primary brand color (buttons, highlights, active states)
- **Navy Blue**: `#003366` - Headers, navigation, secondary buttons
- **Deep Blue**: `#001F3F` - Dark accents and depth

### Typography
- **Font Family**: Inter (matching company website)
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)
- **Fallbacks**: SF Pro (iOS), Roboto (Android)

### Component Examples

**Primary Button**
- Background: #FDB913 (Yellow Power Gold)
- Text: #FFFFFF (White)
- Font: Inter Bold (700)

**Secondary Button**
- Background: #003366 (Navy Blue)
- Text: #FFFFFF (White)
- Font: Inter Bold (700)

**Active Tab**
- Color: #FDB913 (Yellow Power Gold)

**Status Badges**
- Pending: #F59E0B (Orange)
- Approved: #10B981 (Green)
- Rejected: #EF4444 (Red)

## Files Updated

✅ **`notes/MOBILE-WIREFRAMES.md`** - Complete design system with YPI branding
✅ **`dev/mobile/theme.config.ts`** - TypeScript theme configuration file
✅ **`notes/MOBILE-SUMMARY.md`** - Updated with branding references

## Implementation

The theme configuration is ready in `dev/mobile/theme.config.ts` with all Yellow Power International brand colors, typography, and component styles.

**Next Steps**:
1. Install Inter font: `npx expo install @expo-google-fonts/inter`
2. Import theme in app: `import { theme } from './theme.config'`
3. Apply colors consistently across all screens
