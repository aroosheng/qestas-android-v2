
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemePalette =
  | 'light'
  | 'dark'
  | 'navy'
  | 'ocean'
  | 'emerald'
  | 'purple'
  | 'ruby'
  | 'magenta';

interface ThemeContextType {
  palette: ThemePalette;
  setPalette: (palette: ThemePalette) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_PALETTES: {
  id: ThemePalette;
  name: string;
  color: string;
}[] = [
  { id: 'light', name: 'روشن', color: '#DCE3EC' },
  { id: 'dark', name: 'تاریک', color: '#172B4D' },
  { id: 'ruby', name: 'قرمز یاقوتی', color: '#EF4444' },
  { id: 'magenta', name: 'سرخابی', color: '#EC4899' },
  { id: 'navy', name: 'سرمه‌ای طلایی', color: '#F59E0B' },
  { id: 'ocean', name: 'آبی اقیانوسی', color: '#38BDF8' },
  { id: 'emerald', name: 'سبز زمردی', color: '#34D399' },
  { id: 'purple', name: 'بنفش سلطنتی', color: '#C084FC' },
];

function getInitialPalette(): ThemePalette {
  const savedPalette = localStorage.getItem('qestas_theme_palette');

  if (THEME_PALETTES.some((item) => item.id === savedPalette)) {
    // Preserve previously selected custom palettes.
    if (
      savedPalette === 'ruby' ||
      savedPalette === 'magenta' ||
      savedPalette === 'ocean' ||
      savedPalette === 'emerald' ||
      savedPalette === 'purple'
    ) {
      return savedPalette;
    }

    // Migrate the old light/dark mode preference.
    const oldMode = localStorage.getItem('qestas_theme_mode');

    if (oldMode === 'light' || oldMode === 'dark') {
      return oldMode;
    }

    return savedPalette as ThemePalette;
  }

  const oldMode = localStorage.getItem('qestas_theme_mode');

  return oldMode === 'light' ? 'light' : 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<ThemePalette>(
    getInitialPalette
  );

  const setPalette = (value: ThemePalette) => {
    setPaletteState(value);
    localStorage.setItem('qestas_theme_palette', value);
  };

  useEffect(() => {
    document.documentElement.dataset.palette = palette;

    // Remove the old independent display mode.
    delete document.documentElement.dataset.mode;

    localStorage.removeItem('qestas_theme_mode');
  }, [palette]);

  return (
    <ThemeContext.Provider value={{ palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
