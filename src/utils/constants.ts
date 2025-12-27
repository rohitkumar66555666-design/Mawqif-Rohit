// App constants

export const PLACE_TYPES = [
  { value: "masjid", label: "Masjid" },
  { value: "musalla", label: "Musalla" },
  { value: "home", label: "Home" },
  { value: "office", label: "Office" },
  { value: "shop", label: "Shop" },
  { value: "other", label: "Other" },
] as const;

export const RADIUS_OPTIONS = [
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
  { value: 2000, label: "2km" },
  { value: 5000, label: "5km" },
] as const;

export const DEFAULT_RADIUS = 2000; // 2km

// Legacy COLORS - kept for backward compatibility
// Use useTheme() hook for dynamic theming
export const COLORS = {
  primary: "#4CAF50",
  primaryLight: "rgba(76, 175, 80, 0.1)",
  secondary: "#2E7D32",
  accent: "#FFC107",
  background: "#F8F9FA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#6B7280",
  textLight: "#9CA3AF",
  error: "#DC2626",
  success: "#059669",
  warning: "#D97706",
  border: "#E5E7EB",
  shadow: "#000000",
} as const;
