import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui';
import { Logo } from '@/components/auth/FileUploadField';

const API_BASE_URL = 'https://demo.qestas.ir/api';

export function MessagesPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) { navigate('/auth'); return; }
    fetch(`${API_BASE_URL}/consultations.php?list=true`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json()).then(data => {
      if (data.success) setChats(data.consultations);
    }).finally(() => setLoading(false));
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-surface-950">
      <header className="bg-surface-900 border-b border-surface-800 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 text-surface-400 hover:text-white">
            <ArrowRight className="w-5 h-5" />
          </button>
          <Logo size="sm" />
          <h1 className="text-lg font-bold text-white mr-auto">پیام نگار</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
        ) : chats.length === 0 ? (
          <div className="text-center py-20 text-surface-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>هنوز گفتگویی ندارید.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => {
              const isLawyer = chat.lawyer_id === profile?.id;
              const otherName = isLawyer ? `${chat.client_first_name} ${chat.client_last_name}` : `${chat.lawyer_first_name} ${chat.lawyer_last_name}`;
              const otherPic = isLawyer ? chat.client_picture : chat.lawyer_picture;
              const typeLabel = chat.type === 'reyazni' ? 'رایزنی' : 'مشاوره آنلاین';

              return (
                <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`)} className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:bg-surface-800 transition-colors">
                  <Avatar src={otherPic} name={otherName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm truncate">{otherName}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${chat.type === 'reyazni' ? 'bg-accent-600/20 text-accent-400' : 'bg-primary-600/20 text-primary-400'}`}>
                        {typeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-surface-500 mt-1">برای مشاهده گفتگو کلیک کنید</p>
                  </div>
                  {chat.status === 'completed' ? (
                    <span className="text-[10px] text-surface-600 bg-surface-800 px-2 py-1 rounded">پایان یافته</span>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}