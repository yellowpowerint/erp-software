// Color scheme matching the frontend dashboard
export const colors = {
  // Primary colors
  primary: '#1e293b', // slate-800 - primary dark
  primaryForeground: '#f8fafc', // slate-50
  
  // Background
  background: '#ffffff',
  foreground: '#0f172a', // slate-900
  
  // Card
  card: '#ffffff',
  cardForeground: '#0f172a',
  
  // Secondary
  secondary: '#f1f5f9', // slate-100
  secondaryForeground: '#1e293b',
  
  // Muted
  muted: '#f1f5f9',
  mutedForeground: '#64748b', // slate-500
  
  // Accent - Yellow Power brand
  accent: '#f5c400',
  accentForeground: '#1e293b',
  
  // Destructive
  destructive: '#dc2626', // red-600
  destructiveForeground: '#f8fafc',
  
  // Border
  border: '#e2e8f0', // slate-200
  input: '#e2e8f0',
  ring: '#0f172a',
  
  // Additional utility colors
  success: '#16a34a', // green-600
  warning: '#ea580c', // orange-600
  info: '#0284c7', // sky-600
  
  // Text colors
  textPrimary: '#0f172a',
  textSecondary: '#475569', // slate-600
  textMuted: '#94a3b8', // slate-400
  
  // Chart colors
  chart1: '#f59e0b', // amber-500
  chart2: '#14b8a6', // teal-500
  chart3: '#3b82f6', // blue-500
  chart4: '#f5c400', // yellow
  chart5: '#ec4899', // pink-500
};

// Helper to convert hex to rgba
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
