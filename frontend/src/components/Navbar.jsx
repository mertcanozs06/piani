import React from 'react';
import { Map, User, PlusCircle, LogOut, Search, Trophy, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeTab, setActiveTab, onOpenAddPin, onOpenSearch, onOpenSponsorship }) => {
  const { user, logoutUser } = useAuth();

  return (
    <>
      {/* Masaüstü Üst Navigasyon Barı */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-pastel-rose/30 sticky top-0 z-40 shadow-sm">
        <div 
          onClick={() => setActiveTab('map')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-pastel-rose flex items-center justify-center shadow-pastel-soft group-hover:scale-105 transition-transform">
            <span className="text-xl">🌸</span>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-pastel-dark">AnıPini</h1>
            <p className="text-xs text-pastel-gray font-medium">Haritada Biriken Anılar</p>
          </div>
        </div>

        {/* Orta Butonlar */}
        <nav className="flex items-center space-x-2 bg-pastel-bg p-1.5 rounded-full border border-pastel-rose/20">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-5 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
              activeTab === 'map'
                ? 'bg-white text-pastel-dark shadow-sm'
                : 'text-pastel-gray hover:text-pastel-dark'
            }`}
          >
            <Map className="w-4 h-4 text-pastel-roseHover" />
            <span>Anı Haritası</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 px-5 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
              activeTab === 'profile'
                ? 'bg-white text-pastel-dark shadow-sm'
                : 'text-pastel-gray hover:text-pastel-dark'
            }`}
          >
            <User className="w-4 h-4 text-pastel-skyHover" />
            <span>Profilim</span>
          </button>
        </nav>

        {/* Sağ Butonlar (Arama, Sponsor Ol, Anı Ekle, Çıkış) */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-1.5 bg-white hover:bg-pastel-bg text-pastel-dark px-4 py-2.5 rounded-full font-medium text-xs border border-pastel-rose/30 shadow-xs transition-transform active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-pastel-roseHover" />
            <span>Kişi & Mekan Ara</span>
          </button>

          <button
            onClick={onOpenSponsorship}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:opacity-90 text-amber-950 px-4 py-2.5 rounded-full font-bold text-xs shadow-xs transition-transform active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-950" />
            <span>Sponsor Ol 🌟</span>
          </button>

          <button
            onClick={onOpenAddPin}
            className="flex items-center space-x-2 bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark px-5 py-2.5 rounded-full font-medium text-sm shadow-pastel-soft transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Anı Ekle</span>
          </button>

          {user && (
            <button
              onClick={logoutUser}
              title="Çıkış Yap"
              className="w-10 h-10 rounded-full bg-pastel-lightGray hover:bg-red-50 text-pastel-gray hover:text-red-500 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Mobil Mobil-First Yüzen Alt Navigasyon Barı */}
      <div className="md:hidden fixed bottom-5 left-4 right-4 z-50">
        <nav className="bg-white/90 backdrop-blur-lg border border-pastel-rose/30 shadow-2xl rounded-3xl p-2 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all ${
              activeTab === 'map' ? 'bg-pastel-rose/30 text-pastel-dark' : 'text-pastel-gray'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Harita</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center py-2 px-3 rounded-2xl text-pastel-gray hover:text-pastel-dark"
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Ara</span>
          </button>

          {/* Ortada Öne Çıkan Pastel Ekle Butonu */}
          <button
            onClick={onOpenAddPin}
            className="w-12 h-12 -mt-5 bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark rounded-full shadow-lg flex items-center justify-center border-4 border-pastel-bg active:scale-90 transition-transform"
          >
            <PlusCircle className="w-6 h-6 text-pastel-dark" />
          </button>

          <button
            onClick={onOpenSponsorship}
            className="flex flex-col items-center py-2 px-3 rounded-2xl text-amber-700 hover:text-amber-900"
          >
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-medium mt-0.5">Sponsor</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all ${
              activeTab === 'profile' ? 'bg-pastel-sky/50 text-pastel-dark' : 'text-pastel-gray'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5">Profil</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Navbar;
