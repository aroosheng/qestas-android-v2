import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, FileText, Loader2, Scale, LogOut, LogIn, MessageSquare, Star, CheckCircle2, X, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCMS } from '@/contexts/CMSContext';
import type { LawyerWithDetails } from '@/types/database';
import { StarRating, SpecialtyBadge, Avatar } from '@/components/ui';
import { Logo } from '@/components/auth/FileUploadField';

const API_BASE_URL = 'https://demo.qestas.ir/api';

export function LawyerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { getText } = useCMS();
  
  // استیت‌های اصلی
  const [lawyer, setLawyer] = useState<LawyerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // استیت‌های درخواست (رایزنی و مشاوره)
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultType, setConsultType] = useState<'reyazni' | 'consultation'>('reyazni');
  const [consultSubmitting, setConsultSubmitting] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState(false);
  
  // استیت‌های وضعیت فعال (برای هر دو نوع)
  const [activeReyazniId, setActiveReyazniId] = useState<string | null>(null);
  const [activeConsultId, setActiveConsultId] = useState<string | null>(null);

  // دریافت اطلاعات وکیل
  const loadLawyer = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lawyers.php?id=${id}`);
      const data = await res.json();
      if (data.success && data.lawyer) {
        setLawyer(data.lawyer);
      } else {
        setError('وکیل یافت نشد');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLawyer();
  }, [loadLawyer]);

  // چک کردن وضعیت درخواست‌ها (هم رایزنی و هم مشاوره)
  useEffect(() => {
    if (!profile || !id) return;
    const checkConsults = async () => {
      try {
        // چک رایزنی
        const resR = await fetch(`${API_BASE_URL}/consultations.php?check=true&lawyer_id=${id}&type=reyazni`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const dataR = await resR.json();
        if (dataR.success && dataR.has_active) setActiveReyazniId(dataR.consultation_id);

        // چک مشاوره
        const resC = await fetch(`${API_BASE_URL}/consultations.php?check=true&lawyer_id=${id}&type=consultation`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        const dataC = await resC.json();
        if (dataC.success && dataC.has_active) setActiveConsultId(dataC.consultation_id);
      } catch (err) {
        console.error('Error checking consults:', err);
      }
    };
    checkConsults();
  }, [profile, id]);

  // ثبت درخواست جدید
  const handleRequestConsult = async () => {
    if (!profile || !id) return;
    setConsultSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/consultations.php`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ lawyer_id: id, type: consultType })
      });
      const data = await res.json();
      
      if (data.success) {
        setConsultSuccess(true);
        if (consultType === 'reyazni') setActiveReyazniId(data.consultation_id);
        else setActiveConsultId(data.consultation_id);
      } else {
        setError(data.error || 'خطا در ثبت درخواست');
        setShowConsultModal(false);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور');
    } finally {
      setConsultSubmitting(false);
    }
  };

  const openConsultModal = (type: 'reyazni' | 'consultation') => {
    setConsultType(type);
    setConsultSuccess(false);
    setShowConsultModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4">
        <Scale className="w-16 h-16 mb-4 text-surface-700" />
        <p className="text-lg text-surface-400 mb-4">{error || 'خطا در بارگذاری'}</p>
        <button onClick={() => navigate('/lawyers')} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
          بازگشت به لیست وکلا
        </button>
      </div>
    );
  }

  const isOwnProfile = profile?.id === id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950">
      <header className="bg-surface-900/80 backdrop-blur-xl border-b border-surface-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/lawyers')} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 text-surface-400 hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
            <Logo size="sm" />
          </div>
          <div className="flex items-center gap-2">
            {profile ? (
              <button onClick={signOut} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 text-surface-400 hover:text-red-400 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => navigate('/auth')} className="flex items-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                <LogIn className="w-4 h-4" />
                ورود
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {/* Profile header */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar src={lawyer.user?.profile_picture} name={`${lawyer.user?.first_name ?? ''} ${lawyer.user?.last_name ?? ''}`} size="xl" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {lawyer.user?.first_name} {lawyer.user?.last_name}
              </h1>
              {lawyer.user?.city && (
                <div className="flex items-center gap-1 text-sm text-surface-400 mb-3">
                  <MapPin className="w-4 h-4" />
                  {lawyer.user.city} {lawyer.user?.province && `, ${lawyer.user.province}`}
                </div>
              )}
              {lawyer.avg_rating && lawyer.avg_rating > 0 ? (
                <StarRating rating={lawyer.avg_rating} size="md" showNumber reviewCount={lawyer.review_count} />
              ) : null}
            </div>
            
            {/* دکمه‌های عملیات */}
            {!isOwnProfile && profile && profile.role === 'user' && (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                {activeReyazniId ? (
                  <button onClick={() => navigate(`/chat/${activeReyazniId}`)} className="bg-accent-600 hover:bg-accent-500 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4" /> ادامه رایزنی
                  </button>
                ) : (
                  <button onClick={() => openConsultModal('reyazni')} className="bg-accent-600 hover:bg-accent-500 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4" /> رایزنی (چت اولیه)
                  </button>
                )}
                
                {activeConsultId ? (
                  <button onClick={() => navigate(`/chat/${activeConsultId}`)} className="bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                    <Scale className="w-4 h-4" /> ادامه مشاوره
                  </button>
                ) : (
                  <button onClick={() => openConsultModal('consultation')} className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary-900/40">
                    <Scale className="w-4 h-4" /> سفارش مشاوره آنلاین
                  </button>
                )}
              </div>
            )}
            {!profile && (
              <button onClick={() => navigate('/auth')} className="w-full sm:w-auto bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm">
                {getText('lawyers.login_to_consult')}
              </button>
            )}
          </div>
        </div>

        {/* Specialties */}
        {lawyer.main_specialty && (
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary-400" /> تخصص‌های حقوقی
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-surface-600 mb-2">تخصص اصلی</p>
                <SpecialtyBadge name={lawyer.main_specialty} variant="main" />
              </div>
              {lawyer.sub_specialties && lawyer.sub_specialties.length > 0 && (
                <div>
                  <p className="text-xs text-surface-600 mb-2">تخصص‌های فرعی</p>
                  <div className="flex flex-wrap gap-2">
                    {lawyer.sub_specialties.map((sub: string, i: number) => <SpecialtyBadge key={i} name={sub} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Resume */}
        {lawyer.resume_text && (
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 mb-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" /> سوابق و تحصیلات
            </h2>
            <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">{lawyer.resume_text}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 mt-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-400" /> نظرات کاربران {lawyer.review_count ? `(${lawyer.review_count})` : ''}
          </h2>
          {lawyer.reviews && lawyer.reviews.length > 0 ? (
            <div className="space-y-4">
              {lawyer.reviews.map((review: any) => (
                <div key={review.id} className="border-b border-surface-800 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm" name={`${review.user?.first_name ?? ''} ${review.user?.last_name ?? ''}`} />
                      <span className="text-sm font-medium text-surface-200">{review.user?.first_name} {review.user?.last_name}</span>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.comment && <p className="text-sm text-surface-400 leading-relaxed mt-2">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-surface-600 text-center py-8">هنوز نظری ثبت نشده است.</p>}
        </div>
      </main>

      {/* Consultation request modal */}
      {showConsultModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => { setShowConsultModal(false); setConsultSuccess(false); }}>
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {consultSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
                <h3 className="text-lg font-semibold text-white mb-2">درخواست ثبت شد</h3>
                <p className="text-sm text-surface-400 mb-6">درخواست شما ارسال شد. اکنون می‌توانید وارد صفحه گفتگو شوید.</p>
                <button onClick={() => { 
                  setShowConsultModal(false); 
                  navigate(`/chat/${consultType === 'reyazni' ? activeReyazniId : activeConsultId}`); 
                }} className="w-full bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-xl transition-colors">
                  ورود به گفتگو
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{consultType === 'reyazni' ? 'درخواست رایزنی' : 'سفارش مشاوره آنلاین'}</h3>
                  <button onClick={() => setShowConsultModal(false)} className="text-surface-500 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="bg-surface-800/50 rounded-xl p-4 mb-4 text-xs text-surface-300 leading-relaxed">
                  {consultType === 'reyazni' ? (
                    <p>این یک گفتگوی کوتاه برای رایزنی پیش از سفارش است. ارسال هرگونه اطلاعات تماس در آن زیبنده نبوده و برخلاف قوانین قسطاس است.</p>
                  ) : (
                    <p>مشاوره آنلاین راهکار سریع و کوتاه برای رسیدن به بهترین پاسخ حقوقی است. با ثبت این سفارش، پرونده شما به صورت رسمی بررسی می‌شود.</p>
                  )}
                </div>

                <button onClick={handleRequestConsult} disabled={consultSubmitting} className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {consultSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> تایید و شروع</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}