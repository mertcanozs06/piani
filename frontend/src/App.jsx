import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import WelcomePage from './pages/WelcomePage';
import AuthPage from './pages/AuthPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import Navbar from './components/Navbar';

const MainApp = () => {
  const { user } = useAuth();
  
  // Ekran Durumları: 'welcome' | 'auth' | 'main'
  const [screen, setScreen] = useState('welcome');
  const [authMode, setAuthMode] = useState('login');
  
  // Ana Ekran Tab Durumları: 'map' | 'profile'
  const [activeTab, setActiveTab] = useState('map');
  const [viewedUser, setViewedUser] = useState(null); // Başka bir kullanıcının profilini izleme durumu

  const [isAddPinOpen, setIsAddPinOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSponsorshipOpen, setIsSponsorshipOpen] = useState(false);

  const handleNavigateToAuth = (mode) => {
    setAuthMode(mode);
    setScreen('auth');
  };

  const handleAuthSuccess = () => {
    setScreen('main');
    setActiveTab('map');
  };

  const handleOpenAddPin = () => {
    if (screen !== 'main') {
      setScreen('main');
    }
    setActiveTab('map');
    setIsAddPinOpen(true);
  };

  const handleOpenSearch = () => {
    if (screen !== 'main') {
      setScreen('main');
    }
    setActiveTab('map');
    setIsSearchOpen(true);
  };

  const handleOpenSponsorship = () => {
    if (screen !== 'main') {
      setScreen('main');
    }
    setActiveTab('map');
    setIsSponsorshipOpen(true);
  };

  const handleSelectTab = (tab) => {
    if (tab === 'profile') {
      setViewedUser(null); // Kendi profilini görüntüle
    }
    setActiveTab(tab);
  };

  const handleViewProfile = (targetUser) => {
    setViewedUser(targetUser);
    setActiveTab('profile');
  };

  if (!user && screen === 'main') {
    setScreen('welcome');
  }

  return (
    <div className="min-h-screen bg-pastel-bg text-pastel-charcoal font-sans selection:bg-pastel-rose selection:text-pastel-dark">
      
      {/* 1. Karşılama Görünümü */}
      {screen === 'welcome' && (
        <WelcomePage
          onNavigateToAuth={handleNavigateToAuth}
        />
      )}

      {/* 2. Giriş ve Kayıt Görünümü */}
      {screen === 'auth' && (
        <AuthPage
          initialMode={authMode}
          onBack={() => setScreen('welcome')}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* 3. Ana Uygulama Görünümü (Harita & Profil) */}
      {screen === 'main' && (
        <div className="flex flex-col h-screen overflow-hidden">
          <Navbar
            activeTab={activeTab}
            setActiveTab={handleSelectTab}
            onOpenAddPin={handleOpenAddPin}
            onOpenSearch={handleOpenSearch}
            onOpenSponsorship={handleOpenSponsorship}
          />

          <main className="flex-1 overflow-y-auto relative">
            {activeTab === 'map' && (
              <MapPage
                isAddPinOpen={isAddPinOpen}
                setIsAddPinOpen={setIsAddPinOpen}
                isSearchOpen={isSearchOpen}
                setIsSearchOpen={setIsSearchOpen}
                isSponsorshipOpen={isSponsorshipOpen}
                setIsSponsorshipOpen={setIsSponsorshipOpen}
                onViewProfile={handleViewProfile}
              />
            )}

            {activeTab === 'profile' && (
              <ProfilePage
                viewedUser={viewedUser}
                onBackToMyProfile={() => setViewedUser(null)}
              />
            )}
          </main>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
