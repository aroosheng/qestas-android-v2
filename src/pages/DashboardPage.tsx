
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon, Scale, Clock, CheckCircle2, XCircle, LogOut,
  FileText, Phone, Mail, MapPin, MessageSquare, Star, Loader2,
  Edit3, Save, X, Palette,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCMS } from '@/contexts/CMSContext';
import { ThemeSettings } from '@/components/ThemeSettings';

import type {
  LawyerProfile, Consultation, UserProfile, Specialty,
  ReviewWithUser, ConsultationStatus,
} from '@/types/database';

import { StarRating, SpecialtyBadge, Avatar } from '@/components/ui';
import { Logo } from '@/components/auth/FileUploadField';
import { uploadProfilePicture } from '@/lib/storage';

type Tab =
  | 'overview'
  | 'consultations'
  | 'reviews'
  | 'lawyer_profile'
  | 'theme';

export function DashboardPage() {
  const navigate = useNavigate();
  const { profile, signOut, refreshProfile } = useAuth();
  const { getText, isVisible } = useCMS();

  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [consultations, setConsultations] = useState<
    (Consultation & { lawyer: UserProfile | null })[]
  >([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);
  const [reviewingConsult, setReviewingConsult] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editMainSpecialty, setEditMainSpecialty] = useState('');
  const [editSubSpecialties, setEditSubSpecialties] = useState<string[]>([]);
  const [editResume, setEditResume] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const loadLawyerProfile = useCallback(async () => {
    if (!profile) return;

    const { data } = await supabase
      .from('lawyer_profiles')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    setLawyerProfile(data as LawyerProfile | null);

    if (data) {
      setEditMainSpecialty((data as LawyerProfile).main_specialty ?? '');
      setEditSubSpecialties((data as LawyerProfile).sub_specialties ?? []);
      setEditResume((data as LawyerProfile).resume_text ?? '');
    }
  }, [profile]);

  const loadConsultations = useCallback(async () => {
    if (!profile) return;

    setConsultationsLoading(true);

    const { data } = await supabase
      .from('consultations')
      .select(`
        *,
        lawyer:users!consultations_lawyer_id_fkey(
          id,
          first_name,
          last_name,
          profile_picture,
          city,
          province
        )
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    setConsultations(
      (data ?? []) as unknown as (Consultation & {
        lawyer: UserProfile | null;
      })[]
    );

    setConsultationsLoading(false);
  }, [profile]);

  const loadReviews = useCallback(async () => {
    if (!profile) return;

    setReviewsLoading(true);

    const { data } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users!reviews_user_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('lawyer_id', profile.id)
      .order('created_at', { ascending: false });

    setReviews((data ?? []) as unknown as ReviewWithUser[]);
    setReviewsLoading(false);
  }, [profile]);

  const loadSpecialties = useCallback(async () => {
    const { data } = await supabase
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('name');

    setSpecialties((data ?? []) as Specialty[]);
  }, []);

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    Promise.all([
      loadLawyerProfile(),
      loadConsultations(),
    ]).finally(() => setLoading(false));

    loadSpecialties();

    if (profile.role === 'lawyer') {
      loadReviews();
    }
  }, [
    profile,
    loadLawyerProfile,
    loadConsultations,
    loadSpecialties,
    loadReviews,
  ]);

  const handleSaveProfile = async () => {
    if (!lawyerProfile) return;

    setProfileSaving(true);

    const { error } = await supabase
      .from('lawyer_profiles')
      .update({
        main_specialty: editMainSpecialty || null,
        sub_specialties: editSubSpecialties,
        resume_text: editResume.trim() || null,
      })
      .eq('id', lawyerProfile.id);

    if (error) {
      console.error('Save error:', error);
    } else {
      await loadLawyerProfile();
      setEditMode(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }

    setProfileSaving(false);
  };

  const toggleSubSpecialty = (name: string) => {
    setEditSubSpecialties((prev) =>
      prev.includes(name)
        ? prev.filter((s) => s !== name)
        : prev.length < 6
          ? [...prev, name]
          : prev
    );
  };

  const handleProfilePictureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !profile) return;

    const url = await uploadProfilePicture(file, profile.id);

    if (url) {
      await supabase
        .from('users')
        .update({ profile_picture: url })
        .eq('id', profile.id);

      await refreshProfile();
    }
  };

  const handleSubmitReview = async (
    consultId: string,
    lawyerId: string
  ) => {
    if (reviewRating < 1 || !profile) return;

    setReviewSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      consultation_id: consultId,
      user_id: profile.id,
      lawyer_id: lawyerId,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });

    if (error) {
      console.error('Review error:', error);
    } else {
      await loadConsultations();
      setReviewingConsult(null);
      setReviewRating(0);
      setReviewComment('');
    }

    setReviewSubmitting(false);
  };

  const hasReviewed = (consultId: string) => {
    return reviews.some((r) => r.consultation_id === consultId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const verificationBadge = (status: string | null) => {
    if (!status || status === 'pending') {
      return (
        <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-400 px-3 py-2 rounded-xl text-sm font-medium">
          <Clock className="w-4 h-4" />
          در انتظار تایید مدیر
        </div>
      );
    }

    if (status === 'approved') {
      return (
        <div className="flex items-center gap-2 bg-green-500/10 text-green-400 px-3 py-2 rounded-xl text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          تایید شده
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-2 rounded-xl text-sm font-medium">
        <XCircle className="w-4 h-4" />
        رد شده
      </div>
    );
  };

  const tabs: {
    key: Tab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      key: 'overview',
      label: getText('dashboard.tab_overview'),
      icon: UserIcon,
    },
    {
      key: 'theme',
      label: 'ظاهر برنامه',
      icon: Palette,
    },
  ];

  if (isVisible('consultations_section')) {
    tabs.push({
      key: 'consultations',
      label: getText('dashboard.tab_consultations'),
      icon: MessageSquare,
    });
  }

  if (profile?.role === 'lawyer') {
    if (isVisible('reviews_section')) {
      tabs.push({
        key: 'reviews',
        label: getText('dashboard.tab_reviews'),
        icon: Star,
      });
    }

    tabs.push({
      key: 'lawyer_profile',
      label: getText('dashboard.tab_lawyer_profile'),
      icon: Scale,
    });
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="bg-surface-900 border-b border-surface-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Logo size="sm" />

          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="text-xs bg-accent-600/20 text-accent-400 px-3 py-1.5 rounded-lg font-medium hover:bg-accent-600/30 transition-colors"
              >
                پنل مدیریت
              </button>
            )}

            <button
              onClick={() => navigate('/')}
              className="text-sm text-surface-400 hover:text-white transition-colors px-3 py-1.5"
            >
              {getText('general.home')}
            </button>

            <button
              onClick={signOut}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 text-surface-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            {getText('dashboard.greeting')}، {profile?.first_name} {profile?.last_name}
          </h1>

          <p className="text-sm text-surface-500">
            {profile?.role === 'lawyer'
              ? getText('dashboard.lawyer_account')
              : profile?.role === 'admin'
                ? getText('dashboard.admin_account')
                : getText('dashboard.user_account')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-900 border border-surface-800 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center overflow-hidden">
                    {profile?.profile_picture ? (
                      <img
                        src={profile.profile_picture}
                        alt="پروفایل"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-8 h-8 text-white" />
                    )}
                  </div>

                  <label className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Edit3 className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                    />
                  </label>
                </div>

                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white">
                    {profile?.first_name} {profile?.last_name}
                  </h2>
                  <p className="text-sm text-surface-500">
                    {profile?.email ?? profile?.phone_number}
                  </p>
                </div>

                {profile?.role === 'lawyer' &&
                  lawyerProfile &&
                  verificationBadge(lawyerProfile.verification_status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile?.phone_number && (
                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    label="تلفن"
                    value={profile.phone_number}
                  />
                )}

                {profile?.province && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="استان"
                    value={profile.province}
                  />
                )}

                {profile?.city && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="شهر"
                    value={profile.city}
                  />
                )}

                {profile?.email && (
                  <InfoRow
                    icon={<Mail className="w-4 h-4" />}
                    label="ایمیل"
                    value={profile.email}
                  />
                )}
              </div>
            </div>

            {profile?.role === 'lawyer' && lawyerProfile && (
              <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Scale className="w-5 h-5 text-accent-400" />
                  <h3 className="font-semibold text-white">اطلاعات حرفه‌ای</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow
                    icon={<FileText className="w-4 h-4" />}
                    label="شماره پروانه"
                    value={lawyerProfile.license_number ?? '—'}
                  />

                  {lawyerProfile.sheba_number && (
                    <InfoRow
                      icon={<FileText className="w-4 h-4" />}
                      label="شماره شبا"
                      value={lawyerProfile.sheba_number}
                    />
                  )}
                </div>

                {lawyerProfile.verification_status === 'rejected' &&
                  lawyerProfile.rejection_reason && (
                    <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <p className="text-sm text-red-300 font-medium mb-1">
                        دلیل رد درخواست:
                      </p>
                      <p className="text-sm text-red-200">
                        {lawyerProfile.rejection_reason}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Theme settings */}
        {activeTab === 'theme' && <ThemeSettings />}

        {/* Consultations tab */}
        {activeTab === 'consultations' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-2">
              مشاوره‌های من
            </h2>

            {consultationsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : consultations.length === 0 ? (
              <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-12 text-center">
                <MessageSquare className="w-14 h-14 mx-auto mb-3 text-surface-700" />
                <p className="text-surface-400 font-medium">
                  هنوز مشاوره‌ای ثبت نشده است
                </p>

                <button
                  onClick={() => navigate('/lawyers')}
                  className="mt-4 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  مشاهده وکلا
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {consultations.map((consult) => {
                  const isCompleted = consult.status === 'completed';
                  const canReview = isCompleted && !hasReviewed(consult.id);
                  const isReviewing = reviewingConsult === consult.id;

                  return (
                    <div
                      key={consult.id}
                      className="bg-surface-900 border border-surface-800 rounded-2xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={consult.lawyer?.profile_picture}
                            name={`${consult.lawyer?.first_name ?? ''} ${consult.lawyer?.last_name ?? ''}`}
                            size="md"
                          />

                          <div>
                            <button
                              onClick={() =>
                                navigate(`/lawyers/${consult.lawyer_id}`)
                              }
                              className="font-medium text-white text-sm hover:text-primary-300 transition-colors"
                            >
                              {consult.lawyer?.first_name} {consult.lawyer?.last_name}
                            </button>

                            <p className="text-xs text-surface-600 mt-0.5">
                              {new Date(consult.created_at).toLocaleDateString('fa-IR')}
                            </p>
                          </div>
                        </div>

                        <ConsultStatusBadge status={consult.status} />
                      </div>

                      {isReviewing && (
                        <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-4 mt-3 space-y-3 animate-fade-in">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-surface-300">
                              امتیاز شما:
                            </span>

                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="transition-transform hover:scale-110"
                                >
                                  <Star
                                    className={`w-6 h-6 ${
                                      star <= reviewRating
                                        ? 'text-accent-400 fill-accent-400'
                                        : 'text-surface-700'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="نظر خود را بنویسید (اختیاری)..."
                            rows={3}
                            className="w-full bg-surface-800 border border-surface-700 rounded-xl p-3 text-white text-sm placeholder:text-surface-600 focus:outline-none focus:border-primary-600 transition-all resize-none"
                          />

                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                handleSubmitReview(consult.id, consult.lawyer_id)
                              }
                              disabled={reviewRating < 1 || reviewSubmitting}
                              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {reviewSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'ثبت نظر'
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setReviewingConsult(null);
                                setReviewRating(0);
                                setReviewComment('');
                              }}
                              className="px-4 bg-surface-800 hover:bg-surface-700 text-surface-400 text-sm py-2.5 rounded-xl transition-colors"
                            >
                              انصراف
                            </button>
                          </div>
                        </div>
                      )}

                      {canReview && !isReviewing && (
                        <button
                          onClick={() => setReviewingConsult(consult.id)}
                          className="w-full mt-2 bg-accent-600/15 hover:bg-accent-600/25 text-accent-400 text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-accent-600/30"
                        >
                          <Star className="w-4 h-4" />
                          ثبت نظر برای این مشاوره
                        </button>
                      )}

                      {isCompleted && hasReviewed(consult.id) && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          نظر شما ثبت شده است
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reviews tab (lawyer only) */}
        {activeTab === 'reviews' && profile?.role === 'lawyer' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-2">
              نظرات دریافتی
            </h2>

            {reviewsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-12 text-center">
                <Star className="w-14 h-14 mx-auto mb-3 text-surface-700" />
                <p className="text-surface-400 font-medium">
                  هنوز نظری دریافت نشده است
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-surface-900 border border-surface-800 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          size="sm"
                          name={`${review.user?.first_name ?? ''} ${review.user?.last_name ?? ''}`}
                        />

                        <span className="text-sm font-medium text-surface-200">
                          {review.user?.first_name} {review.user?.last_name}
                        </span>
                      </div>

                      <StarRating rating={review.rating} size="sm" />
                    </div>

                    {review.comment && (
                      <p className="text-sm text-surface-400 leading-relaxed mt-2">
                        {review.comment}
                      </p>
                    )}

                    <p className="text-xs text-surface-600 mt-2">
                      {new Date(review.created_at).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lawyer profile edit tab */}
        {activeTab === 'lawyer_profile' &&
          profile?.role === 'lawyer' &&
          lawyerProfile && (
            <div className="space-y-6 animate-fade-in">
              {lawyerProfile.verification_status !== 'approved' ? (
                <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-8 text-center">
                  <Clock className="w-14 h-14 mx-auto mb-3 text-yellow-500/50" />
                  <p className="text-surface-400 font-medium">
                    پروفایل شما هنوز تایید نشده است
                  </p>
                  <p className="text-sm text-surface-600 mt-2">
                    پس از تایید توسط مدیر، می‌توانید پروفایل خود را ویرایش کنید
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">
                        پروفایل عمومی وکیل
                      </h3>

                      {!editMode ? (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center gap-1.5 text-sm bg-surface-800 hover:bg-surface-700 text-surface-300 px-3 py-2 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          ویرایش
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProfile}
                            disabled={profileSaving}
                            className="flex items-center gap-1.5 text-sm bg-primary-600 hover:bg-primary-500 text-white px-3 py-2 rounded-lg transition-colors"
                          >
                            {profileSaving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            ذخیره
                          </button>

                          <button
                            onClick={() => {
                              setEditMode(false);
                              loadLawyerProfile();
                            }}
                            className="flex items-center gap-1.5 text-sm bg-surface-800 hover:bg-surface-700 text-surface-400 px-3 py-2 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            انصراف
                          </button>
                        </div>
                      )}
                    </div>

                    {profileSaved && (
                      <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-300">
                          تغییرات با موفقیت ذخیره شد
                        </span>
                      </div>
                    )}

                    {/* Main specialty */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-surface-300 mb-2">
                        تخصص اصلی
                      </p>

                      {editMode ? (
                        <select
                          value={editMainSpecialty}
                          onChange={(e) => setEditMainSpecialty(e.target.value)}
                          className="w-full bg-surface-800 border border-surface-700 rounded-xl py-3 pr-4 pl-4 text-white text-sm focus:outline-none focus:border-primary-600 transition-all"
                        >
                          <option value="">انتخاب تخصص اصلی...</option>
                          {specialties.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : lawyerProfile.main_specialty ? (
                        <SpecialtyBadge
                          name={lawyerProfile.main_specialty}
                          variant="main"
                        />
                      ) : (
                        <span className="text-sm text-surface-600">
                          تنظیم نشده
                        </span>
                      )}
                    </div>

                    {/* Sub specialties */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-surface-300 mb-2">
                        تخصص‌های فرعی (حداکثر ۶)
                      </p>

                      {editMode ? (
                        <div className="flex flex-wrap gap-2">
                          {specialties
                            .filter((s) => s.name !== editMainSpecialty)
                            .map((s) => (
                              <button
                                key={s.id}
                                onClick={() => toggleSubSpecialty(s.name)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                  editSubSpecialties.includes(s.name)
                                    ? 'bg-primary-600 border-primary-500 text-white'
                                    : 'bg-surface-800 border-surface-700 text-surface-300 hover:border-surface-600'
                                }`}
                              >
                                {s.name}
                              </button>
                            ))}
                        </div>
                      ) : lawyerProfile.sub_specialties &&
                        lawyerProfile.sub_specialties.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {lawyerProfile.sub_specialties.map((sub, i) => (
                            <SpecialtyBadge key={i} name={sub} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-surface-600">
                          تنظیم نشده
                        </span>
                      )}
                    </div>

                    {/* Resume */}
                    <div>
                      <p className="text-sm font-medium text-surface-300 mb-2">
                        سوابق و تحصیلات
                      </p>

                      {editMode ? (
                        <textarea
                          value={editResume}
                          onChange={(e) => setEditResume(e.target.value)}
                          placeholder="سوابق تحصیلی و حرفه‌ای خود را وارد کنید..."
                          rows={6}
                          className="w-full bg-surface-800 border border-surface-700 rounded-xl p-3 text-white text-sm placeholder:text-surface-600 focus:outline-none focus:border-primary-600 transition-all resize-none"
                        />
                      ) : lawyerProfile.resume_text ? (
                        <p className="text-sm text-surface-300 leading-relaxed whitespace-pre-wrap">
                          {lawyerProfile.resume_text}
                        </p>
                      ) : (
                        <span className="text-sm text-surface-600">
                          تنظیم نشده
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
      </main>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-surface-800 flex items-center justify-center text-surface-500">
        {icon}
      </div>
      <div>
        <p className="text-xs text-surface-600">{label}</p>
        <p className="text-sm text-surface-200 font-medium">{value}</p>
      </div>
    </div>
  );
}

function ConsultStatusBadge({ status }: { status: ConsultationStatus }) {
  const config = {
    pending: {
      icon: Clock,
      text: 'در انتظار',
      className: 'bg-yellow-500/10 text-yellow-400',
    },
    in_progress: {
      icon: MessageSquare,
      text: 'در حال انجام',
      className: 'bg-primary-500/10 text-primary-400',
    },
    completed: {
      icon: CheckCircle2,
      text: 'تکمیل شده',
      className: 'bg-green-500/10 text-green-400',
    },
    cancelled: {
      icon: XCircle,
      text: 'لغو شده',
      className: 'bg-red-500/10 text-red-400',
    },
  };

  const { icon: Icon, text, className } = config[status];

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {text}
    </div>
  );
}
