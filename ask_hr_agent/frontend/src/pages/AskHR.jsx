import { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import ChatContainer from '@/components/chat/ChatContainer';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function AskHR() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (err) {
      console.error('Failed to load user:', err);
      // For demo purposes, create a mock user
      setUser({
        id: 'demo-user',
        full_name: 'Demo Employee',
        email: 'demo@michaels.com'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <LoadingSpinner size="lg" message="Loading AskHR..." />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <ChatContainer user={user} />
    </div>
  );
}
