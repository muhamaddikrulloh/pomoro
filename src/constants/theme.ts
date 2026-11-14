import { Platform } from 'react-native';

// Palet warna netral minimalis Pomoro dengan aksen kuning lembut.
export const palette = {
  background: '#F8F7F4', surface: '#FFFFFF', surfaceMuted: '#F4F4F2',
  pillBackground: '#F0EDE7',
  foreground: '#171717', muted: '#6D6D68', border: '#E8E7E3',
  accentYellow: '#F9E49C', successGreen: '#80D6AF', alertOrange: '#F4C08B',
  softPink: '#F4BED2', softPurple: '#CBBEF6', danger: '#A32E2E',
} as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
// Pemetaan token warna untuk tema terang dan gelap.
export const Colors = {
  light: { text: palette.foreground, background: palette.background, backgroundElement: palette.surfaceMuted, backgroundSelected: palette.accentYellow, textSecondary: palette.muted },
  dark: { text: palette.foreground, background: palette.background, backgroundElement: palette.surfaceMuted, backgroundSelected: palette.accentYellow, textSecondary: palette.muted },
} as const;
export type ThemeColor = keyof typeof Colors.light;
export const Fonts = { sans: Platform.OS === 'ios' ? 'System' : 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' };
export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const BottomTabInset = 0;
// Lebar maksimum container agar tampilan tetap proporsional di tablet/web.
export const MaxContentWidth = 600;

