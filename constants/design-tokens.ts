// Design tokens: single source of truth for the todo app's visual language.
// Sleek minimalist glassmorphism, light + dark variants.

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  heading: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, fontWeight: '500' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
};

export interface Palette {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceSolid: string;
  border: string;
  fieldBackground: string;
  fieldBorder: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  dangerSoft: string;
  shadow: string;
  blurTint: 'light' | 'dark';
}

const lightPalette: Palette = {
  background: '#F2F4F8',
  backgroundAlt: '#E9ECF3',
  surface: 'rgba(255,255,255,0.72)',
  surfaceSolid: '#FFFFFF',
  border: 'rgba(15,23,42,0.08)',
  fieldBackground: 'rgba(15,23,42,0.05)',
  fieldBorder: 'rgba(15,23,42,0.18)',
  text: '#12172B',
  textMuted: '#5B6478',
  textFaint: '#8A93A6',
  accent: '#6C5CE7',
  accentSoft: 'rgba(108,92,231,0.14)',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.12)',
  shadow: 'rgba(31,41,74,0.16)',
  blurTint: 'light',
};

const darkPalette: Palette = {
  background: '#0B0E17',
  backgroundAlt: '#12162447',
  surface: 'rgba(30,33,48,0.6)',
  surfaceSolid: '#181B29',
  border: 'rgba(255,255,255,0.08)',
  fieldBackground: 'rgba(255,255,255,0.07)',
  fieldBorder: 'rgba(255,255,255,0.22)',
  text: '#F1F3FA',
  textMuted: '#9BA3B7',
  textFaint: '#6A7288',
  accent: '#8B7CF6',
  accentSoft: 'rgba(139,124,246,0.18)',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.16)',
  shadow: 'rgba(0,0,0,0.55)',
  blurTint: 'dark',
};

export const palettes = { light: lightPalette, dark: darkPalette };

// Deterministic-but-varied palette used to auto-color new tags.
export const tagColorSwatches = [
  '#6C5CE7', // violet
  '#00B894', // green
  '#0984E3', // blue
  '#E17055', // coral
  '#FD79A8', // pink
  '#FDCB6E', // amber
  '#00CEC9', // teal
  '#E84393', // magenta
];

export function colorForTagName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return tagColorSwatches[hash % tagColorSwatches.length];
}

export const shadow = {
  soft: {
    shadowColor: '#1F294A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  card: {
    shadowColor: '#1F294A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};
