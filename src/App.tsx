import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { TopBar } from './components/layout/TopBar';
import { BottomBar } from './components/layout/BottomBar';
import { DrawerPanel } from './components/layout/DrawerPanel';
import { BaiduMapView } from './components/map/BaiduMapView';
import { LoginPage } from './components/pages/LoginPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { ToastProvider } from './components/common/Toast';
import { ConfirmModalProvider } from './components/common/ConfirmModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function HomePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFormType, setActiveFormType] = useState<string | null>(null);

  const handleAddMarker = (type: string) => {
    setActiveFormType(type);
  };

  return (
    <div className="app-container">
      <TopBar onMenuClick={() => setDrawerOpen(true)} />
      <DrawerPanel open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <BaiduMapView />
      <BottomBar onAdd={handleAddMarker} />
      {activeFormType && (
        <DynamicFormModal
          type={activeFormType}
          onClose={() => setActiveFormType(null)}
          onSuccess={() => setActiveFormType(null)}
        />
      )}
    </div>
  );
}

// 接受 props 的占位组件
function DynamicFormModal(props: any) {
  void props; // 避免未使用警告
  return <div className="form-modal">表单占位</div>;
}

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">加载中...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmModalProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
              <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" />} />
            </Routes>
          </BrowserRouter>
        </ConfirmModalProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;