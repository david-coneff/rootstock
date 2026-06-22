import type { ThemeDescriptor } from '../services/theme.js';

// The default theme catalogue, lifted from tessel's ThemeManager. Each theme
// carries its full CSS custom-property map AND maps the core `--rs-*` tokens
// (used by rootstock's own dialogs/toasts/panes) so the framework chrome themes
// in step with the app surface.

type Vars = Record<string, string>;

function theme(
  id: string,
  label: string,
  dark: boolean,
  vars: Vars,
  accentText = dark ? '#ffffff' : '#ffffff',
): ThemeDescriptor {
  const rs: Vars = {
    '--rs-surface': vars['--surface'],
    '--rs-surface-elevated': vars['--surface2'] ?? vars['--surface'],
    '--rs-text': vars['--text'],
    '--rs-border': vars['--border'],
    '--rs-accent': vars['--accent'],
    '--rs-accent-text': vars['--accent-text'] ?? accentText,
  };
  return { id, label, dark, vars: { ...vars, ...rs } };
}

export const themeCatalogue: ThemeDescriptor[] = [
  theme('dark', 'Dark', true, {
    '--bg': '#1a1b1e', '--surface': '#24262b', '--border': '#3a3c42', '--text': '#d4d4d4',
    '--muted': '#7a7d87', '--accent': '#5b8af0', '--surface2': '#2d2f35',
    '--canvas-bg': '#24262b', '--canvas-text': '#d4d4d4', '--canvas-muted': '#5a5d6b',
    '--field-bg': '#252a42', '--field-border': '#3d5299',
  }),
  theme('light', 'Light', false, {
    '--bg': '#f0f0f2', '--surface': '#ffffff', '--border': '#d0d2d8', '--text': '#1a1b1e',
    '--muted': '#6b7280', '--accent': '#5b8af0', '--surface2': '#e8e9ec',
    '--canvas-bg': '#ffffff', '--canvas-text': '#1a1b1e', '--canvas-muted': '#6b7280',
    '--field-bg': '#eef2ff', '--field-border': '#c7d2fe',
  }, '#1a1b1e'),
  theme('nord', 'Nord', true, {
    '--bg': '#2e3440', '--surface': '#3b4252', '--border': '#4c566a', '--text': '#eceff4',
    '--muted': '#7b88a1', '--accent': '#88c0d0', '--surface2': '#434c5e',
    '--canvas-bg': '#3b4252', '--canvas-text': '#eceff4', '--canvas-muted': '#7b88a1',
    '--field-bg': '#3b4f6b', '--field-border': '#5e81ac',
  }, '#2e3440'),
  theme('solarized-dark', 'Solarized Dark', true, {
    '--bg': '#002b36', '--surface': '#073642', '--border': '#094652', '--text': '#839496',
    '--muted': '#586e75', '--accent': '#268bd2', '--surface2': '#073642',
    '--canvas-bg': '#073642', '--canvas-text': '#839496', '--canvas-muted': '#586e75',
    '--field-bg': '#00323f', '--field-border': '#1a6a8a',
  }),
  theme('warm-light', 'Warm Light', false, {
    '--bg': '#faf8f3', '--surface': '#fffefb', '--border': '#ddd8cc', '--text': '#2c2416',
    '--muted': '#8a7d68', '--accent': '#c07c3a', '--surface2': '#f0ece3',
    '--canvas-bg': '#fffefb', '--canvas-text': '#2c2416', '--canvas-muted': '#8a7d68',
    '--field-bg': '#fef3e2', '--field-border': '#e0c090',
  }, '#fffefb'),
  theme('high-contrast', 'High Contrast', true, {
    '--bg': '#000000', '--surface': '#0d0d0d', '--border': '#777777', '--text': '#ffffff',
    '--muted': '#cccccc', '--accent': '#ffff00', '--accent-text': '#000000', '--surface2': '#1a1a1a',
    '--canvas-bg': '#0d0d0d', '--canvas-text': '#ffffff', '--canvas-muted': '#cccccc',
    '--field-bg': '#001a33', '--field-border': '#4499ff',
  }),
];

/** Default active theme id from the catalogue. */
export const DEFAULT_THEME_ID = 'dark';
