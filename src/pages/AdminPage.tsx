import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Clock, Loader2, FileText, User as UserIcon,
  Scale, Eye, X, Plus, Trash2, Settings, Save, Type, ToggleRight,
  Search, Layers, Wallet as WalletIcon, ArrowUpFromLine, MessageSquare, Star, Edit2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/auth/FileUploadField';
import type { LawyerWithUser, Specialty, AppSetting, DynamicText, ComponentVisibility, WithdrawalRequest } from '@/types/database';

type AdminTab = 'pending' | 'lawyers' | 'specialties' | 'texts' | 'visibility' | 'withdrawals' | 'settings' | 'reviews';

const API_BASE_URL = 'https://demo.qestas.ir/api';

export function AdminPage() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');

  // استیت‌های عمومی
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // استیت‌های وکلا
  const [lawyers, setLawyers] = useState<LawyerWithUser[]>([]);
  const [allLawyers, setAllLawyers] = useState<LawyerWithUser[]>([]);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // استیت‌های تخصص‌ها
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');

  // استیت‌های متون
  const [texts, setTexts] = useState<DynamicText[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const [newTextKey, setNewTextKey] = useState('');
  const [newTextValue, setNewTextValue] = useState('');

  // استیت‌های نمایش اجزا
  const [components, setComponents] = useState<ComponentVisibility[]>([]);

  // استیت‌های نظرات
  const [adminReviews, setAdminReviews] = useState<any[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // ✅ استیت‌های جدید تسویه
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const fetchWithAuth = async (url: string, options: any = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        ...options.headers
      }
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resLawyers = await fetchWithAuth(`${API_BASE_URL}/lawyers.php`);
      const dataLawyers = await resLawyers.json();
      if (dataLawyers.success) {
        setLawyers(dataLawyers.lawyers.filter((l: any) => l.verification_status === 'pending'));
        setAllLawyers(dataLawyers.lawyers.filter((l: any) => l.verification_status !== 'pending'));
      }

      const resSpec = await fetchWithAuth(`${API_BASE_URL}/lawyers.php?action=specialties`);
      const dataSpec = await resSpec.json();
      if (dataSpec.success) setSpecialties(dataSpec.specialties);

      const resCms = await fetchWithAuth(`${API_BASE_URL}/admin_cms.php?type=texts`);
      const dataCms = await resCms.json();
      if (dataCms.success) setTexts(dataCms.data);

      const resVis = await fetchWithAuth(`${API_BASE_URL}/admin_cms.php?type=visibility`);
      const dataVis = await resVis.json();
      if (dataVis.success) setComponents(dataVis.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/admin_reviews.php?status=${reviewFilter}`);
      const data = await res.json();
      if (data.success) setAdminReviews(data.reviews);
    } catch (err) { console.error(err); }
  }, [reviewFilter]);

  // ✅ تابع جدید دریافت تسویه‌ها
  const loadWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/admin_withdrawals.php`);
      const data = await res.json();
      if (data.success) setWithdrawals(data.requests);
    } finally { setWithdrawalsLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews();
    if (activeTab === 'withdrawals') loadWithdrawals(); // ✅ فراخوانی تسویه‌ها
  }, [activeTab, loadReviews, loadWithdrawals]);

  const handleApproveLawyer = async (lawyerId: string) => {
    setActionLoading(lawyerId);
    await fetchWithAuth(`${API_BASE_URL}/admin.php?action=approve_lawyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lawyer_id: lawyerId })
    });
    loadData();
    setActionLoading(null);
  };

  const handleRejectLawyer = async (lawyerId: string) => {
    if (!rejectReason.trim()) return;
    setActionLoading(lawyerId);
    await fetchWithAuth(`${API_BASE_URL}/admin.php?action=reject_lawyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lawyer_id: lawyerId, reason: rejectReason })
    });
    loadData();
    setActionLoading(null);
    setRejecting(null);
    setRejectReason('');
  };

  const handleSaveText = async (id: string) => {
    await fetchWithAuth(`${API_BASE_URL}/admin_cms.php?type=update_text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, value: editingTextValue })
    });
    setEditingTextId(null);
    loadData();
  };

  const handleAddText = async () => {
    if (!newTextKey || !newTextValue) return;
    await fetchWithAuth(`${API_BASE_URL}/admin_cms.php?type=add_text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: newTextKey, value: newTextValue })
    });
    setNewTextKey(''); setNewTextValue('');
    loadData();
  };

  const handleToggleVisibility = async (id: string, current: boolean) => {
    await fetchWithAuth(`${API_BASE_URL}/admin_cms.php?type=toggle_visibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_visible: !current })
    });
    loadData();
  };

  const handleReviewStatus = async (reviewId: string, status: 'approved' | 'rejected') => {
    await fetchWithAuth(`${API_BASE_URL}/admin_reviews.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, status })
    });
    loadReviews();
  };

  // ✅ تابع جدید مدیریت تسویه
  const handleWithdrawal = async (requestId: string, action: 'approve' | 'reject') => {
    await fetchWithAuth(`${API_BASE_URL}/admin.php?action=${action === 'approve' ? 'approve_withdrawal' : 'reject_withdrawal'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId })
    });
    loadWithdrawals();
  };

  const navItems: { key: AdminTab; label: string; icon: any; badge?: number }[] = [
    { key: 'pending', label: 'تایید وکلا', icon: Clock, badge: lawyers.length },
    { key: 'lawyers', label: 'لیست وکلا', icon: CheckCircle2 },
    { key: 'specialties', label: 'مدیریت تخصص‌ها', icon: Scale },
    { key: 'texts', label: 'مدیریت متون', icon: Type },
    { key: 'visibility', label: 'کنترل نمایش اجزا', icon: ToggleRight },
    { key: 'reviews', label: 'مدیریت نظرات', icon: Star },
    { key: 'withdrawals', label: 'درخواست‌های تسویه', icon: WalletIcon },
    { key: 'settings', label: 'تنظیمات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-950 pb-20">
      <header className="bg-surface-900 border-b border-surface-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs bg-accent-600/20 text-accent-400 px-2 py-1 rounded-md font-medium">پنل مدیریت</span>
          </div>
          <button onClick={signOut} className="text-sm text-surface-400 hover:text-red-400 transition-colors flex items-center gap-1.5">
            <X className="w-4 h-4" /> خروج
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0">
          <nav className="bg-surface-900 border border-surface-800 rounded-2xl p-2 sticky top-24 flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-w-max ${
                    activeTab === item.key ? 'bg-primary-600 text-white' : 'text-surface-400 hover:bg-surface-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-right">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-accent-600 text-white">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
          ) : (
            <>
              {/* تب تایید وکلا */}
              {activeTab === 'pending' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">درخواست‌های در انتظار تایید</h2>
                  {lawyers.length === 0 ? <p className="text-surface-500">درخواستی وجود ندارد.</p> : lawyers.map(l => (
                    <div key={l.id} className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                      <p className="font-bold text-white">{l.user?.first_name} {l.user?.last_name}</p>
                      <p className="text-sm text-surface-400 mt-1">پروانه: {l.license_number}</p>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleApproveLawyer(l.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">تایید</button>
                        <button onClick={() => setRejecting(l.id)} className="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg text-sm">رد</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* تب مدیریت متون */}
              {activeTab === 'texts' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">مدیریت متون اپلیکیشن</h2>
                  <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex gap-2">
                    <input placeholder="کلید (مثلاً home.title)" value={newTextKey} onChange={e => setNewTextKey(e.target.value)} className="bg-surface-800 p-2 rounded-lg text-sm text-white flex-1" />
                    <input placeholder="مقدار" value={newTextValue} onChange={e => setNewTextValue(e.target.value)} className="bg-surface-800 p-2 rounded-lg text-sm text-white flex-1" />
                    <button onClick={handleAddText} className="bg-primary-600 text-white px-4 rounded-lg"><Plus className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-2">
                    {texts.map(t => (
                      <div key={t.id} className="bg-surface-900 border border-surface-800 rounded-xl p-3 flex items-center gap-3">
                        <code className="text-xs text-primary-400 bg-primary-600/10 px-2 py-1 rounded">{t.key}</code>
                        {editingTextId === t.id ? (
                          <input value={editingTextValue} onChange={e => setEditingTextValue(e.target.value)} className="flex-1 bg-surface-800 p-2 rounded text-sm text-white" />
                        ) : (
                          <span className="flex-1 text-sm text-surface-300">{t.value}</span>
                        )}
                        {editingTextId === t.id ? (
                          <button onClick={() => handleSaveText(t.id)} className="text-green-400"><Save className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => { setEditingTextId(t.id); setEditingTextValue(t.value); }} className="text-surface-400"><Edit2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* تب نمایش اجزا */}
              {activeTab === 'visibility' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">کنترل نمایش اجزا</h2>
                  {components.map(c => (
                    <div key={c.id} className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{c.label}</p>
                        <p className="text-xs text-surface-500">{c.description}</p>
                      </div>
                      <button onClick={() => handleToggleVisibility(c.id, c.is_visible)} className={`w-12 h-6 rounded-full relative transition-colors ${c.is_visible ? 'bg-primary-600' : 'bg-surface-700'}`}>
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${c.is_visible ? 'right-1' : 'right-7'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* تب مدیریت نظرات */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">مدیریت نظرات</h2>
                    <select value={reviewFilter} onChange={e => setReviewFilter(e.target.value as any)} className="bg-surface-800 text-white text-sm p-2 rounded-lg">
                      <option value="pending">در انتظار</option>
                      <option value="approved">تایید شده</option>
                      <option value="rejected">رد شده</option>
                      <option value="all">همه</option>
                    </select>
                  </div>
                  {adminReviews.map(r => (
                    <div key={r.id} className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                      <p className="text-sm text-surface-200"><b>{r.user_first_name}</b> برای <b>{r.lawyer_first_name}</b></p>
                      <p className="text-sm text-surface-400 mt-2 bg-surface-800 p-2 rounded">{r.comment}</p>
                      {r.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleReviewStatus(r.id, 'approved')} className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-sm">تایید</button>
                          <button onClick={() => handleReviewStatus(r.id, 'rejected')} className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-sm">رد</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ✅ تب درخواست‌های تسویه */}
              {activeTab === 'withdrawals' && (
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-white">درخواست‌های تسویه وکلا</h2>
                  {withdrawalsLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
                  ) : withdrawals.length === 0 ? (
                    <p className="text-center text-surface-500 py-10 text-sm">درخواستی وجود ندارد</p>
                  ) : withdrawals.map(req => (
                    <div key={req.id} className="bg-surface-900 border border-surface-800 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-white">وکیل: <b>{req.lawyer_name}</b></p>
                        <span className={`text-xs px-2 py-1 rounded-lg ${
                          req.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          req.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                          'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {req.status === 'completed' ? 'تایید شده' : req.status === 'rejected' ? 'رد شده' : 'در انتظار'}
                        </span>
                      </div>
                      <p className="text-sm text-surface-400 mt-1">مبلغ: {req.amount.toLocaleString('fa-IR')} تومان</p>
                      <p className="text-xs text-surface-500 mt-1">شبا: {req.sheba_number}</p>
                      {req.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => handleWithdrawal(req.id, 'approve')} className="flex-1 bg-green-600 text-white py-1.5 rounded-lg text-sm">تایید واریز</button>
                          <button onClick={() => handleWithdrawal(req.id, 'reject')} className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-sm">رد درخواست</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}