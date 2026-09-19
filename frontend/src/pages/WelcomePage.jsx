import React from 'react';
import { Heart, MapPin, Sparkles, ArrowRight } from 'lucide-react';

const WelcomePage = ({ onNavigateToAuth }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pastel-bg via-white to-pastel-rose/20 flex flex-col items-center justify-between p-6 sm:p-10 relative overflow-hidden">
      
      {/* Arka Plan Yumuşak Pastel Daireler */}
      <div className="absolute top-[-50px] left-[-50px] w-72 h-72 rounded-full bg-pastel-rose/30 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 rounded-full bg-pastel-sky/30 blur-3xl pointer-events-none"></div>

      {/* Üst Alan: Marka / Header */}
      <div className="w-full max-w-md flex items-center justify-center space-x-2 pt-4">
        <span className="px-4 py-1.5 rounded-full bg-pastel-rose/30 border border-pastel-rose/40 text-pastel-dark text-xs font-semibold tracking-wide flex items-center space-x-1.5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-pastel-roseHover" />
          <span>Pastel Anı Haritası</span>
        </span>
      </div>

      {/* Merkez Alan: Logo ve Tanıtım */}
      <div className="w-full max-w-md text-center space-y-6 my-auto z-10">
        
        {/* Ortalanmış Zarafet Logosu */}
        <div className="relative inline-block">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white p-3 shadow-pastel-soft border border-pastel-rose/30 mx-auto flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-pastel-rose to-pastel-peach flex items-center justify-center shadow-inner">
              <Heart className="w-12 h-12 text-white fill-white animate-pulse" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-white px-3 py-1 rounded-full shadow-md border border-pastel-rose/20 text-xs font-bold text-pastel-dark">
            📍 AnıPini
          </div>
        </div>

        {/* Başlık & Açıklama */}
        <div className="space-y-3">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-pastel-dark leading-tight">
            Anılarını Haritada <br />
            <span className="italic text-pastel-roseHover underline decoration-pastel-rose/40">Biriktir.</span>
          </h1>
          <p className="text-pastel-gray text-sm sm:text-base font-normal max-w-xs mx-auto leading-relaxed">
            Gezdiğin sokaklar, tatlı kahve molaları ve özel anların hepsi AnıPini'de pastel dokunuşlarla saklanır.
          </p>
        </div>

        {/* Giriş / Kayıt Seçenekleri */}
        <div className="space-y-3 pt-4 max-w-xs mx-auto">
          <button
            onClick={() => onNavigateToAuth('register')}
            className="w-full py-4 bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark font-bold text-sm rounded-2xl shadow-pastel-soft flex items-center justify-center space-x-2 transition-all duration-200 active:scale-95 group"
          >
            <span>Hemen Aramıza Katıl</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onNavigateToAuth('login')}
            className="w-full py-3.5 bg-white hover:bg-pastel-bg text-pastel-dark font-semibold text-sm rounded-2xl border border-pastel-rose/30 shadow-xs transition-all duration-200 active:scale-95"
          >
            Zaten Hesabım Var (Giriş Yap)
          </button>
        </div>

      </div>

      {/* Alt Bilgi */}
      <div className="text-center text-xs text-pastel-gray pb-4 z-10">
        <p>© 2026 AnıPini • Minimalist & Mobil Öncelikli Deneyim</p>
      </div>

    </div>
  );
};

export default WelcomePage;
