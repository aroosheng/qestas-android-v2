import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Paperclip, Image as ImageIcon, Loader2, X, Check, Download, CheckCircle2, Star, ArrowRight, Smile, MoreVertical, Edit2, Reply, Mic, Square, Play, Pause } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui';

const API_BASE_URL = 'https://demo.qestas.ir/api';
const LEGAL_EMOJIS = ['⚖️', '👨‍⚖️', '👩‍⚖️', '🏛️', '📜', '📄', '✍️', '🤝', '🙏', '🌹', '❗', '❓', '✅', '📌'];

// کامپوننت اختصاصی پخش صوت
function AudioPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-black/20 p-2 rounded-xl mt-2 min-w-[200px]">
      <button onClick={togglePlay} className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white shrink-0">
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div className="h-full bg-primary-400 w-1/2" /> {/* شبیه‌سازی موج صوتی */}
      </div>
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
}

export function ChatBox({ consultationId }: { consultationId: string }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('pending');
  const [consultType, setConsultType] = useState('reyazni');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [replyTo, setReplyTo] = useState<any>(null);
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ✅ استیت‌های ضبط صوت
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chat.php?consultation_id=${consultationId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setStatus(data.status);
        setConsultType(data.type);
        if (data.status === 'completed' && !reviewDone) setShowReview(true);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [consultationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ✅ منطق ضبط صوت
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
        setFile(file);
        setFilePreview('audio'); // علامت‌گذاری برای پیش‌نمایش صوت
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 119) { // محدودیت ۲ دقیقه
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      alert('دسترسی به میکروفن امکان‌پذیر نیست. لطفاً مجوز دهید.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !file) return;

    setSending(true);

    if (editingMsg) {
      try {
        const res = await fetch(`${API_BASE_URL}/chat.php?action=edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
          body: JSON.stringify({ message_id: editingMsg.id, message: newMessage.trim() })
        });
        const data = await res.json();
        if (data.success) { setNewMessage(''); setEditingMsg(null); await fetchMessages(); }
        else alert(data.error);
      } finally { setSending(false); }
      return;
    }

    const formData = new FormData();
    formData.append('consultation_id', consultationId);
    if (newMessage.trim()) formData.append('message', newMessage.trim());
    if (replyTo) formData.append('reply_to_id', replyTo.id);
    if (file) formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/chat.php`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage(''); setFile(null); setFilePreview(null); setReplyTo(null);
        await fetchMessages();
      } else alert(data.error);
    } finally { setSending(false); }
  };

  const handleEndChat = async () => {
    if (!confirm('آیا از پایان این گفتگو مطمئن هستید؟')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/consultations.php?end=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ consultation_id: consultationId })
      });
      const data = await res.json();
      if (data.success) fetchMessages();
      else alert(data.error);
    } catch (err) { console.error(err); }
  };

  const handleSubmitReview = async () => {
    setReviewSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reviews.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ consultation_id: consultationId, rating, comment })
      });
      const data = await res.json();
      if (data.success) { setReviewDone(true); setShowReview(false); }
      else alert(data.error);
    } finally { setReviewSubmitting(false); }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  if (loading) return <div className="flex justify-center p-10 h-full items-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

  const mainTitle = consultType === 'reyazni' ? 'رایزنی' : 'مشاوره آنلاین';
  const subTitle = status === 'completed' ? 'پایان یافته' : (consultType === 'reyazni' ? 'در حال رایزنی...' : 'در حال گفتگو...');

  return (
    <div className="flex flex-col h-full bg-surface-950 border border-surface-800 md:rounded-2xl overflow-hidden shadow-xl relative">
      
      {/* هدر */}
      <header className="p-4 border-b border-surface-800 bg-surface-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/messages')} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-800 text-surface-400 hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-sm font-bold text-white">{mainTitle}</h3>
            <p className="text-[10px] text-surface-400 mt-0.5">{subTitle}</p>
          </div>
        </div>
        {profile?.role === 'lawyer' && status !== 'completed' && (
          <button onClick={handleEndChat} className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
            پایان {consultType === 'reyazni' ? 'رایزنی' : 'مشاوره'}
          </button>
        )}
     </header>

      {/* پیام‌ها */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowEmojiPicker(false)}>
        {messages.map((msg) => {
          const isMe = msg.sender_id === profile?.id;
          const canEdit = isMe && (new Date().getTime() - new Date(msg.created_at).getTime()) < 60000;
          
          return (
            <div key={msg.id} className={`flex items-start gap-2 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <Avatar src={msg.profile_picture} name={`${msg.first_name} ${msg.last_name}`} size="sm" />
              
              <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'} relative`}>
                <span className="text-[10px] text-surface-500 mb-1">{msg.first_name} {msg.last_name}</span>
                
                <div className={`absolute top-6 ${isMe ? '-left-12' : '-right-12'} hidden group-hover:flex items-center gap-1 bg-surface-800 p-1 rounded-lg shadow-lg z-10`}>
                  <button onClick={() => setReplyTo(msg)} className="p-1 text-surface-400 hover:text-primary-400"><Reply className="w-3.5 h-3.5" /></button>
                  {canEdit && <button onClick={() => { setEditingMsg(msg); setNewMessage(msg.message); }} className="p-1 text-surface-400 hover:text-accent-400"><Edit2 className="w-3.5 h-3.5" /></button>}
                </div>

                <div className={`p-3 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-surface-800 text-surface-200 rounded-tl-sm'}`}>
                  
                  {msg.reply_to_id && msg.reply_message && (
                    <div className="mb-2 p-1.5 bg-black/20 rounded-lg border-r-2 border-white/30 text-xs opacity-80">
                      <span className="font-bold block mb-0.5">{msg.reply_sender_name}</span>
                      <span className="truncate block">{msg.reply_message}</span>
                    </div>
                  )}

                  {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                  
                  {/* ✅ نمایش عکس */}
                  {msg.file_url && msg.file_type === 'image' && (
                    <img src={msg.file_url} onClick={() => setPreviewImage(msg.file_url)} className="mt-2 rounded-lg max-h-48 cursor-pointer object-cover" />
                  )}
                  
                  {/* ✅ نمایش صوت */}
                  {msg.file_url && msg.file_type === 'audio' && (
                    <AudioPlayer src={msg.file_url} />
                  )}

                  {/* ✅ نمایش فایل معمولی */}
                  {msg.file_url && msg.file_type === 'file' && (
                    <a href={msg.file_url} target="_blank" className="mt-2 flex items-center gap-2 text-xs bg-black/20 p-2 rounded-lg"><Paperclip className="w-4 h-4" /> دانلود فایل</a>
                  )}

                  {msg.is_edited == 1 && <span className="text-[9px] opacity-70 block mt-1 text-left">(ویرایش شده)</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* نوار ارسال یا فرم نظر */}
      {status === 'completed' ? (
         <div className="p-4 bg-surface-900 border-t border-surface-800 shrink-0">
         {showReview ? (
           <div className="space-y-3">
             <h4 className="text-sm font-bold text-white text-center">گفتگو به پایان رسید. لطفاً نظر خود را ثبت کنید.</h4>
             <div className="flex justify-center gap-2">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button key={star} onClick={() => setRating(star)}>
                   <Star className={`w-6 h-6 ${star <= rating ? 'text-accent-400 fill-accent-400' : 'text-surface-600'}`} />
                 </button>
               ))}
             </div>
             <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="نظر خود را بنویسید..." rows={2} className="w-full bg-surface-800 border border-surface-700 rounded-xl p-3 text-sm text-white focus:outline-none" />
             <button onClick={handleSubmitReview} disabled={reviewSubmitting} className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-xl disabled:opacity-50">
               {reviewSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'ثبت نظر (در انتظار تایید مدیر)'}
             </button>
           </div>
         ) : reviewDone ? (
           <div className="text-center text-green-400 text-sm py-2 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> نظر شما ثبت شد.</div>
         ) : <p className="text-center text-surface-500 text-sm">این گفتگو پایان یافته است.</p>}
       </div>
      ) : (
        <div className="p-3 border-t border-surface-800 bg-surface-900 shrink-0 relative">
          
          {(replyTo || editingMsg) && (
            <div className="mb-2 flex items-center justify-between bg-surface-800 p-2 rounded-lg border-r-2 border-primary-500">
              <div className="flex flex-col text-xs overflow-hidden">
                <span className="font-bold text-primary-400">{editingMsg ? 'ویرایش پیام' : `پاسخ به ${replyTo.first_name}`}</span>
                <span className="truncate text-surface-400">{editingMsg ? editingMsg.message : replyTo.message}</span>
              </div>
              <button onClick={() => { setReplyTo(null); setEditingMsg(null); setNewMessage(''); }} className="text-red-400 p-1"><X className="w-4 h-4" /></button>
            </div>
          )}

          {file && (
            <div className="mb-2 flex items-center gap-2 bg-surface-800 p-2 rounded-lg">
              {filePreview === 'audio' ? (
                <Mic className="w-5 h-5 text-primary-400" />
              ) : filePreview ? (
                <img src={filePreview} className="w-8 h-8 rounded object-cover" />
              ) : (
                <Paperclip className="w-5 h-5 text-surface-400" />
              )}
              <span className="text-xs text-white truncate flex-1">{filePreview === 'audio' ? 'پیام صوتی آماده ارسال' : file.name}</span>
              <button type="button" onClick={() => { setFile(null); setFilePreview(null); }} className="text-red-400"><X className="w-4 h-4" /></button>
            </div>
          )}

          {showEmojiPicker && (
            <div className="absolute bottom-16 left-2 bg-surface-800 border border-surface-700 p-2 rounded-xl shadow-2xl grid grid-cols-5 gap-2 z-20 w-64">
              {LEGAL_EMOJIS.map(e => (
                <button key={e} onClick={() => addEmoji(e)} className="text-xl hover:bg-surface-700 p-1 rounded transition-colors">{e}</button>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            
            {/* دکمه ارسال (راست) */}
            {newMessage.trim() || file || editingMsg ? (
              <button type="submit" disabled={sending} className="p-2.5 bg-primary-600 text-white rounded-xl disabled:opacity-50 shadow-lg shrink-0 transition-all hover:bg-primary-500">
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            ) : isRecording ? (
              // ✅ دکمه توقف ضبط
              <button type="button" onClick={stopRecording} className="p-2.5 bg-red-600 text-white rounded-xl shrink-0 transition-all animate-pulse flex items-center gap-1">
                <Square className="w-4 h-4 fill-white" />
                <span className="text-xs font-mono">{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
              </button>
            ) : (
              // ✅ دکمه شروع ضبط (میکروفن)
              <button type="button" onClick={startRecording} className="p-2.5 bg-surface-800 text-surface-400 rounded-xl shrink-0 transition-all hover:bg-surface-700 hover:text-white">
                <Mic className="w-5 h-5" /> 
              </button>
            )}

            {/* دکمه سنجاق */}
            <label className="cursor-pointer p-2 text-surface-500 hover:text-white transition-colors shrink-0">
              <Paperclip className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected && selected.size <= 5 * 1024 * 1024) { 
                  setFile(selected); 
                  if (selected.type.startsWith('image/')) { 
                    const reader = new FileReader(); 
                    reader.onloadend = () => setFilePreview(reader.result as string); 
                    reader.readAsDataURL(selected); 
                  } else { setFilePreview(null); }
                }
              }} />
            </label>

            {/* فیلد تایپ */}
            <input 
              type="text" 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder={isRecording ? "در حال ضبط..." : (editingMsg ? "ویرایش پیام..." : "پیام خود را بنویسید...")} 
              disabled={isRecording}
              className="flex-1 bg-surface-800 border border-surface-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none min-w-0 disabled:opacity-50" 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            {/* ایموجی (چپ) */}
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-surface-500 hover:text-accent-400 transition-colors shrink-0">
              <Smile className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* مودال عکس */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} className="w-full max-h-[80vh] object-contain rounded-lg" />
            <div className="absolute top-4 right-4 flex gap-2">
              <a href={previewImage} download className="p-3 bg-primary-600 text-white rounded-xl shadow-lg"><Download className="w-5 h-5" /></a>
              <button onClick={() => setPreviewImage(null)} className="p-3 bg-surface-800 text-white rounded-xl shadow-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}