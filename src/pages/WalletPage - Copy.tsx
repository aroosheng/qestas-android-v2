import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, Loader2,
  LogOut, Home, Plus, Clock, CheckCircle2, XCircle, X, AlertCircle,
  TrendingUp, TrendingDown, Scale,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useCMS } from '@/contexts/CMSContext';
import type { Wallet, Transaction, WithdrawalRequest } from '@/types/database';
import { MIN_WITHDRAWAL_AMOUNT, TOP_UP_AMOUNT } from '@/types/database';
import { Logo } from '@/components/auth/FileUploadField';

const formatToman = (amount: number): string => {
  return amount.toLocaleString('fa-IR');
};

export function WalletPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { getText, isVisible } = useCMS();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const isLawyer = profile?.role === 'lawyer';

  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data: walletData } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();
    setWallet(walletData as Wallet | null);

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setTransactions((txData ?? []) as Transaction[]);

    if (profile.role === 'lawyer') {
      const { data: wdData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('lawyer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setWithdrawals((wdData ?? []) as WithdrawalRequest[]);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTopUp = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data, error: rpcError } = await supabase.rpc('wallet_deposit', {
        p_amount: TOP_UP_AMOUNT,
        p_description: 'شارژ کیف پول - تست',
      });
      if (rpcError) throw rpcError;
      if (data && typeof data === 'object' && 'new_balance' in data) {
        setWallet((prev) => prev ? { ...prev, balance: data.new_balance as number } : prev);
      }
      setSuccess(`${formatToman(TOP_UP_AMOUNT)} تومان به کیف پول شما اضافه شد`);
      setTimeout(() => setSuccess(''), 4000);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در شارژ کیف پول');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawSubmit = async () => {
    setWithdrawError('');
    const amount = parseInt(withdrawAmount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) {
      setWithdrawError('مبلغ نامعتبر است');
      return;
    }
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      setWithdrawError(`حداقل مبلغ برداشت ${formatToman(MIN_WITHDRAWAL_AMOUNT)} تومان است`);
      return;
    }
    if (wallet && amount > wallet.balance) {
      setWithdrawError('مبلغ درخواستی بیشتر از موجودی شماست');
      return;
    }

    setActionLoading(true);
    try {
      const { error: rpcError } = await supabase.rpc('wallet_request_withdrawal', {
        p_amount: amount,
      });
      if (rpcError) throw rpcError;
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setSuccess('درخواست تسویه حساب با موفقیت ثبت شد و در انتظار تایید مدیر است');
      setTimeout(() => setSuccess(''), 5000);
      loadData();
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'خطا در ثبت درخواست');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isVisible('wallet_section') && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
        <div className="text-center">
          <WalletIcon className="w-16 h-16 mx-auto mb-4 text-surface-700" />
          <p className="text-lg text-surface-400 font-medium">این بخش در حال حاضر غیرفعال است</p>
          <button onClick={() => navigate('/')} className="mt-4 text-primary-400 hover:text-primary-300 text-sm">
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="bg-surface-900/80 backdrop-blur-xl border-b border-surface-800 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {profile?.role === 'admin' && (
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
              onClick={() => navigate('/')}
              className="text-sm text-surface-400 hover:text-white transition-colors px-2 py-1.5"
            >
              <Home className="w-4 h-4" />
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
            <WalletIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">کیف پول</h1>
            <p className="text-sm text-surface-500">مدیریت موجودی و تراکنش‌ها</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-green-300">{success}</p>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-surface-900 to-surface-800/50 border border-surface-800 rounded-2xl p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-primary-700/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm text-surface-400 mb-2">موجودی فعلی</p>
            {loading ? (
              <div className="h-10 w-48 bg-surface-800 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight">
                  {formatToman(wallet?.balance ?? 0)}
                </span>
                <span className="text-sm text-surface-500">تومان</span>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTopUp}
                disabled={actionLoading}
                className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                شارژ کیف پول ({formatToman(TOP_UP_AMOUNT)} ت)
              </button>
              {isLawyer && (
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={!wallet || wallet.balance < MIN_WITHDRAWAL_AMOUNT}
                  className="flex items-center gap-2 bg-surface-800 hover:bg-surface-700 text-surface-200 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-surface-700"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  درخواست تسویه حساب
                </button>
              )}
            </div>
            {isLawyer && wallet && wallet.balance < MIN_WITHDRAWAL_AMOUNT && (
              <div className="mt-4 flex items-center gap-2 text-xs text-surface-500 bg-surface-800/50 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span>
                  برای درخواست تسویه حساب حداقل {formatToman(MIN_WITHDRAWAL_AMOUNT)} تومان موجودی نیاز دارید
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lawyer withdrawal requests */}
        {isLawyer && withdrawals.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Scale className="w-5 h-5 text-accent-400" />
              درخواست‌های تسویه
            </h2>
            <div className="space-y-2">
              {withdrawals.map((wd) => (
                <WithdrawalRequestCard key={wd.id} request={wd} />
              ))}
            </div>
          </div>
        )}

        {/* Transactions list */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            تاریخچه تراکنش‌ها
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-surface-900/50 border border-surface-800 rounded-2xl p-12 text-center">
              <WalletIcon className="w-12 h-12 mx-auto mb-3 text-surface-700" />
              <p className="text-sm text-surface-400">هنوز تراکنشی ثبت نشده است</p>
              <p className="text-xs text-surface-600 mt-1">با شارژ کیف پول اولین تراکنش را ثبت کنید</p>
            </div>
          ) : (
            <div className="bg-surface-900 border border-surface-800 rounded-2xl divide-y divide-surface-800">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div
            className="bg-surface-900 border border-surface-800 rounded-2xl p-6 max-w-md w-full animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-primary-400" />
                درخواست تسویه حساب
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-surface-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-surface-800/50 rounded-xl p-3 mb-4">
              <p className="text-xs text-surface-400">موجودی شما</p>
              <p className="text-lg font-bold text-white">{formatToman(wallet?.balance ?? 0)} تومان</p>
            </div>

            {withdrawError && (
              <div className="mb-3 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-300">{withdrawError}</p>
              </div>
            )}

            <label className="block text-sm text-surface-300 mb-2">مبلغ برداشت (تومان)</label>
            <input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={`${formatToman(MIN_WITHDRAWAL_AMOUNT)} - ${formatToman(wallet?.balance ?? 0)}`}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl py-3 px-4 text-white text-sm placeholder:text-surface-600 focus:outline-none focus:border-primary-600 transition-all mb-3"
              dir="ltr"
            />
            <p className="text-xs text-surface-500 mb-4">
              حداقل مبلغ برداشت: {formatToman(MIN_WITHDRAWAL_AMOUNT)} تومان
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleWithdrawSubmit}
                disabled={actionLoading}
                className="flex-1 bg-primary-600 hover:bg-primary-500 text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ثبت درخواست'}
              </button>
              <button
                onClick={() => { setShowWithdrawModal(false); setWithdrawAmount(''); setWithdrawError(''); }}
                className="px-5 bg-surface-800 hover:bg-surface-700 text-surface-300 text-sm py-3 rounded-xl transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.amount > 0;
  const isPending = tx.status === 'pending';

  const typeMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
    deposit: { icon: ArrowDownToLine, label: 'واریز', color: 'text-green-400' },
    withdrawal: { icon: ArrowUpFromLine, label: 'برداشت', color: 'text-red-400' },
    payment: { icon: TrendingUp, label: 'پرداخت', color: 'text-blue-400' },
    refund: { icon: TrendingDown, label: 'بازگشت', color: 'text-green-400' },
    admin_adjustment: { icon: Scale, label: 'تنظیم', color: 'text-accent-400' },
  };

  const meta = typeMeta[tx.type] ?? typeMeta.deposit;
  const Icon = meta.icon;

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center ${meta.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-surface-200">
            {meta.label}
            {isPending && (
              <span className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded mr-2">در انتظار</span>
            )}
          </p>
          <p className="text-xs text-surface-600 mt-0.5">
            {tx.description ?? '—'}
          </p>
          <p className="text-xs text-surface-700 mt-0.5">
            {new Date(tx.created_at).toLocaleDateString('fa-IR')}
          </p>
        </div>
      </div>
      <div className={`text-sm font-bold ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
        {isCredit ? '+' : ''}{formatToman(tx.amount)}
        <span className="text-xs text-surface-600 font-normal mr-1">ت</span>
      </div>
    </div>
  );
}

function WithdrawalRequestCard({ request }: { request: WithdrawalRequest }) {
  const statusMeta: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; bg: string; text: string }> = {
    pending: { icon: Clock, label: 'در انتظار', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    completed: { icon: CheckCircle2, label: 'تایید شده', bg: 'bg-green-500/10', text: 'text-green-400' },
    rejected: { icon: XCircle, label: 'رد شده', bg: 'bg-red-500/10', text: 'text-red-400' },
  };

  const meta = statusMeta[request.status] ?? statusMeta.pending;
  const Icon = meta.icon;

  return (
    <div className="bg-surface-900 border border-surface-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center ${meta.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-surface-200">
              {formatToman(request.amount)} <span className="text-xs text-surface-600 font-normal">تومان</span>
            </p>
            <p className="text-xs text-surface-600 mt-0.5">
              {new Date(request.created_at).toLocaleDateString('fa-IR')}
            </p>
          </div>
        </div>
        <div className="text-left">
          <span className={`text-xs font-medium ${meta.text} ${meta.bg} px-2.5 py-1 rounded-lg`}>
            {meta.label}
          </span>
          {request.admin_note && (
            <p className="text-xs text-surface-500 mt-1 max-w-[200px]">{request.admin_note}</p>
          )}
        </div>
      </div>
    </div>
  );
}
