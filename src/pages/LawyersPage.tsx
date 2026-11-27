import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Loader2, Scale, Filter, X, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCMS } from '@/contexts/CMSContext';
import type { LawyerWithUser, Specialty } from '@/types/database';
import { StarRating, SpecialtyBadge, Avatar } from '@/components/ui';
import { Logo } from '@/components/auth/FileUploadField';

const API_BASE_URL = 'https://demo.qestas.ir/api'; // دامنه خود را جایگزین کنید

export function LawyersPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { getText } = useCMS();
  const [lawyers, setLawyers] = useState<LawyerWithUser[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // دریافت تخصص‌ها
  const loadSpecialties = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/lawyers.php?action=specialties`);
      const data = await res.json();
      if (data.success) {
        setSpecialties(data.specialties);
      }
    } catch (err) {
      console.error('Error loading specialties:', err);
    }
  }, []);

  // دریافت وکلا
  const loadLawyers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/lawyers.php?`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (selectedSpecialty) url += `specialty=${encodeURIComponent(selectedSpecialty)}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setLawyers(data.lawyers);
      }
    } catch (err) {
      console.error('Error loading lawyers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedSpecialty]);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  useEffect(() => {
    const debounce = setTimeout(() => loadLawyers(), 300);
    return () => clearTimeout(debounce);
  }, [loadLawyers]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950">
      <header className="bg-surface-900/80 backdrop-blur-xl border-b border-surface-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {profile ? (
              <>
                <span className="text-sm text-surface-400 hidden sm:block">
                  {profile.first_name}
                </span>
                {profile.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="text-xs bg-accent-600/20 text-accent-400 px-3 py-1.5 rounded-lg font-medium hover:bg-accent-600/30 transition-colors"
                  >
                    {getText('general.admin_panel')}
                  </button>
                )}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs bg-surface-800 text-surface-300 px-3 py-1.5 rounded-lg font-medium hover:bg-surface-700 transition-colors"
                >
                  {getText('general.user_panel')}
                </button>
                <button
                  onClick={signOut}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 text-surface-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                ورود
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 pb-24">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{getText('lawyers.page_title')}</h1>
              <p className="text-sm text-surface-500">{getText('lawyers.page_subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={getText('lawyers.search_placeholder')}
              className="w-full bg-surface-900 border border-surface-800 rounded-xl py-3 pr-10 pl-4 text-white text-sm placeholder:text-surface-600 focus:outline-none focus:border-primary-600 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 bg-surface-900 border border-surface-800 rounded-xl text-surface-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{getText('lawyers.filter_button')}</span>
          </button>
        </div>

        {/* Specialty filters */}
        {showFilters && (
          <div className="mb-6 bg-surface-900 border border-surface-800 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white">فیلتر بر اساس تخصص</h3>
              {selectedSpecialty && (
                <button
                  onClick={() => setSelectedSpecialty('')}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  حذف فیلتر
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {specialties.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === spec.name ? '' : spec.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedSpecialty === spec.name
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-600'
                  }`}
                >
                  {spec.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lawyers list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : lawyers.length === 0 ? (
          <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-16 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-surface-700" />
            <p className="text-lg text-surface-400 font-medium">{getText('lawyers.no_results')}</p>
            <p className="text-sm text-surface-600 mt-2">{getText('lawyers.no_results_hint')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {lawyers.map((lawyer) => (
              <button
                key={lawyer.id}
                onClick={() => navigate(`/lawyers/${lawyer.user_id}`)}
                className="group bg-surface-900 border border-surface-800 rounded-2xl p-5 text-right hover:border-primary-700 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <Avatar
                    src={lawyer.user?.profile_picture}
                    name={`${lawyer.user?.first_name ?? ''} ${lawyer.user?.last_name ?? ''}`}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-base mb-1 truncate">
                      {lawyer.user?.first_name} {lawyer.user?.last_name}
                    </h3>
                    {lawyer.user?.city && (
                      <div className="flex items-center gap-1 text-xs text-surface-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        {lawyer.user.city}
                      </div>
                    )}
                    {lawyer.main_specialty && (
                      <SpecialtyBadge name={lawyer.main_specialty} variant="main" />
                    )}
                  </div>
                </div>
                {lawyer.sub_specialties && lawyer.sub_specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {lawyer.sub_specialties.slice(0, 3).map((sub, i) => (
                      <SpecialtyBadge key={i} name={sub} />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}