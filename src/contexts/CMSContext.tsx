import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const API_BASE_URL = 'https://demo.qestas.ir/api'; // دامنه خود را جایگزین کنید

// داده‌های پیش‌فرض برای زمانی که API خطا می‌دهد
const DEFAULT_TEXTS: Record<string, string> = {
  'home.hero_title': 'پلتفرم جامع خدمات حقوقی',
  'home.hero_subtitle': 'مشاوره حقوقی آنلاین، ارتباط با وکلای پایه یک و پاسخ به سوالات حقوقی شما - همه در یکجا',
  'home.services_title': 'خدمات حقوقی',
  'home.login_button': 'ورود / ثبت‌نام',
  'general.admin_panel': 'پنل مدیریت',
  'general.user_panel': 'پنل کاربری',
  'general.home': 'خانه',
  'auth.login_tab': 'ورود',
  'auth.register_tab': 'ثبت‌نام',
};

const DEFAULT_VISIBILITY: Record<string, boolean> = {
  'side_drawer': true,
  'lawyers_section': true,
  'consultations_section': true,
  'reviews_section': true,
};

interface CMSContextValue {
  texts: Record<string, string>;
  visibility: Record<string, boolean>;
  loading: boolean;
  getText: (key: string) => string;
  isVisible: (key: string) => boolean;
  refreshTexts: () => Promise<void>;
  refreshVisibility: () => Promise<void>;
}

const CMSContext = createContext<CMSContextValue>({
  texts: DEFAULT_TEXTS,
  visibility: DEFAULT_VISIBILITY,
  loading: true,
  getText: (key) => key,
  isVisible: () => true,
  refreshTexts: async () => {},
  refreshVisibility: async () => {},
});

export function CMSProvider({ children }: { children: ReactNode }) {
  const [texts, setTexts] = useState<Record<string, string>>(DEFAULT_TEXTS);
  const [visibility, setVisibility] = useState<Record<string, boolean>>(DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(true);

  const refreshTexts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cms.php?type=texts`);
      const data = await res.json();
      
      console.log('API texts response:', data); // برای دیباگ

      if (data.success && data.texts && data.texts.length > 0) {
        const mapped = data.texts.reduce((acc: any, item: any) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
        setTexts({ ...DEFAULT_TEXTS, ...mapped });
      } else {
        console.warn('دیتابیس خالی است، از متن‌های پیش‌فرض استفاده می‌شود');
      }
    } catch (err) {
      console.warn('خطا در دریافت متن‌ها، از پیش‌فرض استفاده می‌شود:', err);
    }
  };

  const refreshVisibility = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/cms.php?type=visibility`);
      const data = await res.json();
      
      console.log('API visibility response:', data); // برای دیباگ

      if (data.success && data.visibility && data.visibility.length > 0) {
        const mapped = data.visibility.reduce((acc: any, item: any) => {
          acc[item.component_key] = item.is_visible;
          return acc;
        }, {});
        setVisibility({ ...DEFAULT_VISIBILITY, ...mapped });
      }
    } catch (err) {
      console.warn('خطا در دریافت تنظیمات نمایش، از پیش‌فرض استفاده می‌شود:', err);
    }
  };

  useEffect(() => {
    Promise.all([refreshTexts(), refreshVisibility()]).finally(() => setLoading(false));
  }, []);

  const getText = (key: string) => texts[key] || key;
  const isVisible = (key: string) => visibility[key] !== false;

  return (
    <CMSContext.Provider value={{ texts, visibility, loading, getText, isVisible, refreshTexts, refreshVisibility }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  return useContext(CMSContext);
}