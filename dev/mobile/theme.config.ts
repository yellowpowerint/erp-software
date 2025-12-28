/**
 * Mining ERP Mobile App - Theme Configuration
 * Based on Yellow Power International branding
 * Website: https://yellowpowerinternational.com
 */

export const theme = {
  colors: {
    // Primary Brand Colors (from Yellow Power International)
    primary: '#FDB913', // Yellow Power Gold - Main brand color
    primaryDark: '#E5A711', // Darker shade for pressed states
    primaryLight: '#FECA4D', // Lighter shade for backgrounds
    
    // Navy Blue (Headers, Navigation)
    secondary: '#003366', // Navy Blue
    secondaryDark: '#001F3F', // Deep Blue
    secondaryLight: '#004C99', // Lighter navy
    
    // Neutral Colors
    white: '#FFFFFF',
    black: '#000000',
    background: '#FFFFFF',
    backgroundSecondary: '#F5F5F5',
    surface: '#FFFFFF',
    
    // Text Colors
    text: '#333333', // Dark gray for body text
    textSecondary: '#666666', // Medium gray for secondary text
    textTertiary: '#999999', // Light gray for tertiary text
    textInverse: '#FFFFFF', // White text on dark backgrounds
    heading: '#020817', // Charcoal for headings
    
    // Borders & Dividers
    border: '#E0E0E0',
    divider: '#E0E0E0',
    
    // Semantic Colors
    success: '#10B981', // Green for approvals, confirmations
    error: '#EF4444', // Red for errors, rejections
    warning: '#F59E0B', // Orange for warnings, pending
    info: '#3B82F6', // Blue for information
    
    // Status Colors
    approved: '#10B981',
    rejected: '#EF4444',
    pending: '#F59E0B',
    draft: '#6B7280',
    
    // Overlay & Shadows
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayDark: 'rgba(0, 0, 0, 0.7)',
    shadowColor: '#000000',
  },
  
  fonts: {
    // Font Family (Inter - matching Yellow Power International website)
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    
    // iOS Fallback
    ios: {
      regular: 'SF Pro Text',
      bold: 'SF Pro Display',
    },
    
    // Android Fallback
    android: {
      regular: 'Roboto',
      bold: 'Roboto',
    },
  },
  
  fontSizes: {
    xs: 12, // Captions, labels
    sm: 14, // Secondary text
    base: 16, // Body text
    lg: 18, // Emphasized text
    xl: 20, // Section headings
    '2xl': 24, // Screen titles
    '3xl': 32, // Hero headings
    '4xl': 40, // Large display
  },
  
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeights: {
    tight: 1.2, // Headings
    normal: 1.5, // Body text
    relaxed: 1.75, // Long-form content
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    '2xl': 16,
    full: 9999, // Pill shape
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  components: {
    button: {
      primary: {
        backgroundColor: '#FDB913',
        color: '#FFFFFF',
        height: 48,
        borderRadius: 6,
        fontWeight: '700',
        paddingHorizontal: 24,
        paddingVertical: 12,
      },
      secondary: {
        backgroundColor: '#003366',
        color: '#FFFFFF',
        height: 48,
        borderRadius: 6,
        fontWeight: '700',
        paddingHorizontal: 24,
        paddingVertical: 12,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: '#FDB913',
        borderWidth: 2,
        color: '#FDB913',
        height: 48,
        borderRadius: 6,
        fontWeight: '700',
        paddingHorizontal: 24,
        paddingVertical: 12,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#003366',
        height: 48,
        borderRadius: 6,
        fontWeight: '700',
        paddingHorizontal: 24,
        paddingVertical: 12,
      },
    },
    
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    
    input: {
      height: 48,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      fontSize: 16,
      color: '#333333',
      focusBorderColor: '#FDB913',
      focusBorderWidth: 2,
    },
    
    listItem: {
      minHeight: 64,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
      activeBackgroundColor: '#F5F5F5',
    },
    
    tabBar: {
      height: 60,
      backgroundColor: '#FFFFFF',
      activeColor: '#FDB913',
      inactiveColor: '#666666',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    
    badge: {
      pending: {
        backgroundColor: '#F59E0B',
        color: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        fontSize: 12,
        fontWeight: '700',
      },
      approved: {
        backgroundColor: '#10B981',
        color: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        fontSize: 12,
        fontWeight: '700',
      },
      rejected: {
        backgroundColor: '#EF4444',
        color: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        fontSize: 12,
        fontWeight: '700',
      },
      draft: {
        backgroundColor: '#6B7280',
        color: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        fontSize: 12,
        fontWeight: '700',
      },
    },
  },
};

export type Theme = typeof theme;

// Type-safe color access
export type ThemeColors = keyof typeof theme.colors;
export type ThemeFontSizes = keyof typeof theme.fontSizes;
export type ThemeSpacing = keyof typeof theme.spacing;
