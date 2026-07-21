import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#191c1e',
    background: '#f7f9fb',
    tint: '#004ac6',
    icon: '#434655',
    tabIconDefault: '#737686',
    tabIconSelected: '#004ac6',
  },
  dark: {
    text: '#eff1f3',
    background: '#2d3133',
    tint: '#b4c5ff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#b4c5ff',
  },
};

export const Luminous = {
  surface: '#f7f9fb',
  surfaceDim: '#d8dadc',
  surfaceBright: '#f7f9fb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f6',
  surfaceContainer: '#eceef0',
  surfaceContainerHigh: '#e6e8ea',
  surfaceContainerHighest: '#e0e3e5',
  onSurface: '#191c1e',
  onSurfaceVariant: '#434655',
  outline: '#737686',
  outlineVariant: '#c3c6d7',
  surfaceTint: '#0053db',
  primary: '#004ac6',
  onPrimary: '#ffffff',
  primaryContainer: '#2563eb',
  onPrimaryContainer: '#eeefff',
  inversePrimary: '#b4c5ff',
  secondary: '#505f76',
  onSecondary: '#ffffff',
  secondaryContainer: '#d0e1fb',
  onSecondaryContainer: '#54647a',
  tertiary: '#943700',
  onTertiary: '#ffffff',
  tertiaryContainer: '#bc4800',
  onTertiaryContainer: '#ffede6',
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  success: '#2e7d32',
  successContainer: '#c8e6c9',
  onSuccessContainer: '#1b5e20',
  primaryFixed: '#dbe1ff',
  primaryFixedDim: '#b4c5ff',
  onPrimaryFixed: '#00174b',
  onPrimaryFixedVariant: '#003ea8',
  secondaryFixed: '#d3e4fe',
  secondaryFixedDim: '#b7c8e1',
  onSecondaryFixed: '#0b1c30',
  onSecondaryFixedVariant: '#38485d',
  tertiaryFixed: '#ffdbcd',
  tertiaryFixedDim: '#ffb596',
  onTertiaryFixed: '#360f00',
  onTertiaryFixedVariant: '#7d2d00',
  background: '#f7f9fb',
  onBackground: '#191c1e',
  surfaceVariant: '#e0e3e5',
};

export const FontFamilies = {
  regular: 'HankenGrotesk_400Regular',
  medium: 'HankenGrotesk_500Medium',
  semiBold: 'HankenGrotesk_600SemiBold',
  bold: 'HankenGrotesk_700Bold',
};

export const Typography = {
  headlineLg: {
    fontFamily: FontFamilies.bold,
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    letterSpacing: -0.02 * 24,
  },
  headlineMd: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.01 * 20,
  },
  bodyLg: {
    fontFamily: FontFamilies.regular,
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: FontFamilies.regular,
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  labelMd: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.05 * 12,
  },
  labelSm: {
    fontFamily: FontFamilies.medium,
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 14,
  },
};

export const Radius = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Spacing = {
  containerMargin: 20,
  stackGapSm: 8,
  stackGapMd: 16,
  stackGapLg: 24,
  touchTargetMin: 44,
};

export const Fonts = Platform.select({
  ios: {
    sans: FontFamilies.regular,
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: FontFamilies.regular,
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: FontFamilies.regular,
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
