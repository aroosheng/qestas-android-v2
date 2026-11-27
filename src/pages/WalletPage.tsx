import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Wallet, Plus, ArrowUpFromLine, Loader2, ArrowDownLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/auth/FileUploadField';

const API_BASE_URL = 'https://demo.qestas.ir/api';

export function WalletPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // استیت‌های مودال
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/wallet.php`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleDeposit = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/wallet.php?action=deposit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        },
        body: JSON.stringify({ amount: parseInt(depositAmount) })
      });
      const data = await res.json();
      if (data.success) {
        setShowDeposit(false); setDepositAmount('');
        fetchWallet();
      } else alert(data.error);
    } finally { setProcessing(false); }
  };

  const handleWithdraw = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/wallet.php?action=request_withdrawal`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}` 
        },
        body: JSON.stringify({ amount: parseInt(withdrawAmount) })
      });
      const data = await res.json();
      if (data.success) {
        setShowWithdraw(false); setWithdrawAmount('');
        fetchWallet();
      } else alert(data.error);
    } finally { setProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-surface-950 pb-24">
      <header className="bg-surface-900 border-b border-surface-800 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 text-surface-400 hover:text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
          <Logo size="sm" />
          <h1 className="text-lg font-bold text-white mr-auto">کیف پول</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
        ) : (
          <>
            {/* کارت موجودی */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-900 rounded-2xl p-6 shadow-xl text-white mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <p className="text-sm opacity-80 mb-1">موجودی فعلی</p>
              <h2 className="text-3xl font-bold mb-6">{balance.toLocaleString('fa-IR')} <span className="text-sm font-normal">تومان</span></h2>
              
              <div className="flex gap-3 relative z-10">
                <button onClick={() => setShowDeposit(true)} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> شارژ کیف پول
                </button>
                {profile?.role === 'lawyer' && (
                  <button onClick={() => setShowWithdraw(true)} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <ArrowUpFromLine className="w-4 h-4" /> درخواست تسویه
                  </button>
                )}
              </div>
            </div>

            {/* تاریخچه تراکنش‌ها */}
            <h3 className="text-sm font-bold text-white mb-3">تاریخچه تراکنش‌ها</h3>
            <div className="space-y-2">
              {transactions.length === 0 ? (
                <p className="text-center text-surface-500 py-10 text-sm">تراکنشی وجود ندارد</p>
              ) : transactions.map(tx => (
                <div key={tx.id} className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'refund' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {tx.type === 'deposit' || tx.type === 'refund' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{tx.description}</p>
                    <p className="text-xs text-surface-500">{new Date(tx.created_at).toLocaleDateString('fa-IR')} - {tx.status === 'pending' ? 'در انتظار' : 'تکمیل شده'}</p>
                  </div>
                  <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('fa-IR')}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* مودال شارژ */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">شارژ کیف پول</h3>
            <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="مبلغ به تومان" className="w-full bg-surface-800 border border-surface-700 rounded-xl p-3 text-white mb-4" />
            <button onClick={handleDeposit} disabled={processing || !depositAmount} className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
              {processing ? 'در حال پردازش...' : 'پرداخت و شارژ'}
            </button>
          </div>
        </div>
      )}

      {/* مودال تسویه */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-2">درخواست تسویه</h3>
            <p className="text-xs text-surface-400 mb-4">حداقل مبلغ تسویه ۳,۰۰۰,۰۰۰ تومان است. مبلغ به شماره شبای ثبت‌شده در پروفایل واریز می‌شود.</p>
            <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="مبلغ به تومان" className="w-full bg-surface-800 border border-surface-700 rounded-xl p-3 text-white mb-4" />
            <button onClick={handleWithdraw} disabled={processing || !withdrawAmount} className="w-full bg-primary-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">
              {processing ? 'در حال پردازش...' : 'ثبت درخواست'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}