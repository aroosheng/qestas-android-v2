import { useParams } from 'react-router-dom';
import { ChatBox } from '@/components/ChatBox';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) return null;

  return (
    <div className="h-[100dvh] bg-surface-950 flex flex-col overflow-hidden">
      <ChatBox consultationId={id} />
    </div>
  );
}