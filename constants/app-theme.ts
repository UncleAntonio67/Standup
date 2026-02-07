export type ThemeMode = 'dark' | 'light';

export const APP_THEME = {
  dark: {
    bg: '#050a10',
    surface: '#0f1926',
    surfaceAlt: '#152030',
    border: '#1e3a52',
    text: '#ffffff',
    textDim: '#8b9bb4',
    primary: '#00d4ff',
    success: '#39ff14',
    warning: '#ffb020',
    danger: '#ff3b3b',
    alarmBg: '#3a0d0d',
    chipBg: 'rgba(255,255,255,0.03)',
  },
  light: {
    bg: '#f2f6fb',
    surface: '#ffffff',
    surfaceAlt: '#f8fbff',
    border: '#d6e4f2',
    text: '#0f172a',
    textDim: '#56708a',
    primary: '#0077cc',
    success: '#39ff14',
    warning: '#ca8a04',
    danger: '#dc2626',
    alarmBg: '#fee2e2',
    chipBg: '#eef5fd',
  },
} as const;
