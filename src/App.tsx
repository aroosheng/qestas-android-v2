
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CMSProvider } from '@/contexts/CMSContext';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BottomNav } from '@/components/BottomNav';

import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { LawyersPage } from '@/pages/LawyersPage';
import { LawyerDetailPage } from '@/pages/LawyerDetailPage';
import { WalletPage } from '@/pages/WalletPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { ChatPage } from '@/pages/ChatPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CMSProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/lawyers" element={<LawyersPage />} />
              <Route path="/lawyers/:id" element={<LawyerDetailPage />} />

              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/chat/:id"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/wallet"
                element={
                  <ProtectedRoute>
                    <WalletPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            <BottomNav />
          </BrowserRouter>
        </CMSProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
