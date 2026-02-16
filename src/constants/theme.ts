// Bloom — Botanical Warm Theme
// Warm cream, terracotta, sage green, golden amber
// Inspired by a sunlit garden journal

export const colors = {
  // Brand
  primary: {
    50: '#FBF0EC',
    100: '#F2D6CC',
    200: '#E4AD99',
    300: '#D4937E',
    400: '#C4725A',
    500: '#A45B44',
    600: '#8B4A37',
    700: '#6E3A2B',
  },
  secondary: {
    50: '#F0F5EF',
    100: '#DAE7D8',
    200: '#C0D6BD',
    300: '#A8C4A5',
    400: '#8BA888',
    500: '#6B8B6A',
    600: '#557055',
    700: '#3F5440',
  },
  accent: {
    50: '#FEF7E8',
    100: '#FCEBC4',
    200: '#F5D48A',
    300: '#F0C478',
    400: '#E8A948',
    500: '#D49330',
    600: '#B57A20',
  },
  neutral: {
    50: '#FAF6F0',
    100: '#F3EDE6',
    200: '#E8E0D8',
    300: '#D6CCC2',
    400: '#B8AFA6',
    500: '#7A7570',
    600: '#5C5752',
    700: '#44403C',
    800: '#2D2926',
    900: '#1C1917',
  },
  error: '#C75450',
  warning: '#D49330',
  success: '#6B8B6A',
  info: '#7E9EB5',
  background: '#FAF6F0',
  surface: '#FFFFFF',
};

export const fonts = {
  serif: 'DMSerifDisplay_400Regular',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
  rounded: 'Nunito_600SemiBold',
  roundedBold: 'Nunito_700Bold',
};

export const typography = {
  // Serif display — screen titles, emotional headers
  displayLarge: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 40,
  } as const,
  displayMedium: {
    fontFamily: fonts.serif,
    fontSize: 26,
    lineHeight: 34,
  } as const,
  displaySmall: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 30,
  } as const,
  // Sans — headers, body, labels
  heading1: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    lineHeight: 32,
  } as const,
  heading2: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 20,
    lineHeight: 28,
  } as const,
  heading3: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
  } as const,
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
  } as const,
  bodyBold: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    lineHeight: 22,
  } as const,
  caption: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  } as const,
  small: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    lineHeight: 16,
  } as const,
  // Rounded — tags, badges, mood labels
  tag: {
    fontFamily: fonts.rounded,
    fontSize: 12,
    lineHeight: 16,
  } as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  warm: {
    shadowColor: colors.primary[400],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
};
