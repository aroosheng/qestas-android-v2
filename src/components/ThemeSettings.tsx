
import { Check, Palette } from 'lucide-react';
import { THEME_PALETTES, useTheme } from '@/contexts/ThemeContext';

const previews: Record<
  string,
  { background: string; card: string; secondary: string; text: string; accent: string }
> = {
  light: {
    background: '#F1F4F8',
    card: '#FFFFFF',
    secondary: '#E2E8F0',
    text: '#172B4D',
    accent: '#D4A017',
  },
  dark: {
    background: '#0B1424',
    card: '#192A42',
    secondary: '#263B58',
    text: '#F8FAFC',
    accent: '#D4A017',
  },
  ruby: {
    background: '#B91C35',
    card: '#FFFFFF',
    secondary: '#F9DDE3',
    text: '#3F1721',
    accent: '#EF4444',
  },
  magenta: {
    background: '#A81770',
    card: '#FFFFFF',
    secondary: '#F9D9ED',
    text: '#421333',
    accent: '#EC4899',
  },
  navy: {
    background: '#0B1120',
    card: '#172B4D',
    secondary: '#263B5B',
    text: '#FFFFFF',
    accent: '#F59E0B',
  },
  ocean: {
    background: '#082F49',
    card: '#164E70',
    secondary: '#245F7F',
    text: '#FFFFFF',
    accent: '#38BDF8',
  },
  emerald: {
    background: '#062E26',
    card: '#145343',
    secondary: '#216B57',
    text: '#FFFFFF',
    accent: '#34D399',
  },
  purple: {
    background: '#24113F',
    card: '#45266D',
    secondary: '#583782',
    text: '#FFFFFF',
    accent: '#C084FC',
  },
};

export function ThemeSettings() {
  const { palette, setPalette } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-primary-400" />
          <h2 className="text-lg font-bold text-surface-50">
            تم اپلیکیشن
          </h2>
        </div>
      </div>

      <section className="bg-surface-900 border border-surface-800 rounded-2xl p-5">
        <div className="grid grid-cols-2 gap-4">
          {THEME_PALETTES.map((item) => {
            const selected = palette === item.id;
            const colors = previews[item.id];
            const isBasic = item.id === 'light' || item.id === 'dark';

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPalette(item.id)}
                aria-label={
                  isBasic
                    ? `${item.id === 'light' ? 'روشن' : 'تاریک'}`
                    : 'انتخاب این ترکیب رنگ'
                }
                aria-pressed={selected}
                className={`relative group rounded-2xl p-2 text-right transition-all duration-300 ${
                  selected
                    ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-surface-900'
                    : 'hover:-translate-y-1'
                }`}
              >
                <div
                  className="relative overflow-hidden rounded-xl p-3 shadow-xl transition-all duration-300 group-hover:shadow-2xl"
                  style={{
                    background: colors.background,
                    boxShadow: selected
                      ? `0 10px 25px ${colors.background}66, inset 0 1px 0 #FFFFFF30`
                      : `0 7px 16px ${colors.background}55, inset 0 1px 0 #FFFFFF25`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-7 h-7 rounded-lg shadow-inner"
                      style={{ background: colors.secondary }}
                    />
                    {selected && (
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: colors.accent }}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </span>
                    )}
                  </div>

                  <div
                    className="rounded-lg p-3 shadow-md"
                    style={{
                      background: colors.card,
                      boxShadow: '0 4px 10px #00000020, inset 0 1px 0 #FFFFFF80',
                    }}
                  >
                    <div
                      className="h-2 w-2/3 rounded-full mb-2"
                      style={{ background: colors.text, opacity: 0.85 }}
                    />
                    <div
                      className="h-1.5 w-1/2 rounded-full mb-3"
                      style={{ background: colors.text, opacity: 0.3 }}
                    />
                    <div className="flex gap-2">
                      <div
                        className="h-8 flex-1 rounded-md shadow-sm"
                        style={{ background: colors.secondary }}
                      />
                      <div
                        className="h-8 w-10 rounded-md shadow-sm"
                        style={{ background: colors.accent }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-1.5 mt-3">
                    {[colors.card, colors.secondary, colors.accent].map(
                      (color, index) => (
                        <span
                          key={index}
                          className="h-2 flex-1 rounded-full shadow-inner"
                          style={{ background: color }}
                        />
                      )
                    )}
                  </div>
                </div>

                {isBasic && (
                  <div className="pt-3 text-center">
                    <span className="block text-sm font-bold text-surface-50">
                      {item.id === 'light' ? 'روشن' : 'تاریک'}
                    </span>
                    <span className="block text-xs text-surface-400 mt-1">
                      {item.id === 'light' ? 'Light' : 'Dark'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
