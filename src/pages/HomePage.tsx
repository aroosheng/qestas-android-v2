import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, FileText, HelpCircle, BookOpen, User, Settings, Scale, Menu as MenuIcon, X, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCMS } from '@/contexts/CMSContext';
import type { DynamicMenu } from '@/types/database';
import { Logo } from '@/components/auth/FileUploadField';

const API_BASE_URL = 'https://demo.qestas.ir/api';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Users, FileText, HelpCircle, BookOpen, User, Settings, Scale,
};

export function HomePage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { getText, isVisible } = useCMS();
  const [gridMenus, setGridMenus] = useState<DynamicMenu[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/menus.php?location=home_grid`);
        const data = await res.json();
        if (data.success) setGridMenus(data.menus);
      } catch (err) {
        console.error('Error loading grid menus:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMenus();
  }, []);

  const showSideDrawer = isVisible('side_drawer');

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950 pb-24">
      {/* Header */}
      <header className="bg-surface-900/80 backdrop-blur-xl border-b border-surface-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {profile ? (
              <>
                <span className="text-sm text-surface-400 hidden sm:block">{profile.first_name} {profile.last_name}</span>
                {profile.role === 'admin' && (
                  <button onClick={() => navigate('/admin')} className="text-xs bg-accent-600/20 text-accent-400 px-3 py-1.5 rounded-lg font-medium hover:bg-accent-600/30 transition-colors">
                    {getText('general.admin_panel')}
                  </button>
                )}
                <button onClick={signOut} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 text-surface-400 hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/auth')} className="flex items-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                <LogIn className="w-4 h-4" /> {getText('home.login_button')}
              </button>
            )}
            {showSideDrawer && (
              <button onClick={() => setDrawerOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 text-surface-400 hover:text-white transition-colors">
                <MenuIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative overflow-hidden py-16 px-4">
        <div className="absolute top-0 right-1/3 w-72 h-72 bg-primary-700/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-accent-600/5 rounded-full blur-3xl" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl shadow-primary-900/50 mb-6">
            <Scale className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{getText('home.hero_title')}</h1>
          <p className="text-surface-400 text-lg leading-relaxed max-w-xl mx-auto">{getText('home.hero_subtitle')}</p>
        </div>
      </section>

      {/* Menu grid */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-lg font-semibold text-surface-300 mb-6 text-center">{getText('home.services_title')}</h2>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface-900 border border-surface-800 rounded-2xl p-6 animate-pulse">
                <div className="w-12 h-12 bg-surface-800 rounded-xl mb-4" />
                <div className="h-4 bg-surface-800 rounded w-20 mb-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gridMenus.map((menu) => {
              const Icon = ICON_MAP[menu.icon_name ?? 'Scale'] ?? Scale;
              return (
                <button key={menu.id} onClick={() => navigate(menu.target_url ?? '/')} className="group bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center hover:border-primary-700 hover:bg-surface-800/80 transition-all hover:shadow-lg hover:shadow-primary-900/20">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-800/20 group-hover:from-primary-600/30 group-hover:to-primary-800/30 mb-3 transition-all">
                    <Icon className="w-7 h-7 text-primary-400" />
                  </div>
                  <h3 className="text-sm font-medium text-surface-200 group-hover:text-white transition-colors">{menu.title}</h3>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Side drawer */}
      {showSideDrawer && <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
    </div>
  );
}

function SideDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [menus, setMenus] = useState<DynamicMenu[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/menus.php?location=side_drawer`)
      .then(res => res.json())
      .then(data => { if (data.success) setMenus(data.menus); })
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={onClose} />}
      <div className={`fixed top-0 right-0 bottom-0 w-72 bg-surface-900 border-l border-surface-800 z-50 transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-surface-800">
          <Logo size="sm" />
          <button onClick={onClose} className="text-surface-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-1">
          {menus.map((menu) => {
            const Icon = ICON_MAP[menu.icon_name ?? 'Home'] ?? Home;
            return (
              <button key={menu.id} onClick={() => { navigate(menu.target_url ?? '/'); onClose(); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-surface-300 hover:bg-surface-800 hover:text-white transition-colors text-sm font-medium">
                <Icon className="w-5 h-5 text-surface-500" /> {menu.title}
              </button>
            );
          })}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-800">
          {profile ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-surface-400"><User className="w-4 h-4" /> {profile.first_name} {profile.last_name}</div>
              <button onClick={() => { signOut(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
                <LogOut className="w-4 h-4" /> خروج از حساب
              </button>
            </div>
          ) : (
            <button onClick={() => { navigate('/auth'); onClose(); }} className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              <LogIn className="w-4 h-4" /> ورود / ثبت‌نام
            </button>
          )}
        </div>
      </div>
    </>
  );
}