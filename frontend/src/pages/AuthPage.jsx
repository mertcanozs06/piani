import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, User, Sparkles, Chrome, Apple, Building2, UserCheck, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthPage = ({ initialMode = 'login', onBack, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [userType, setUserType] = useState('individual'); // 'individual' | 'corporate'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser, registerUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await loginUser(email, password);
      } else {
        const extraData = userType === 'corporate' ? {
          address: address || 'Galata Meydanı No:12, Beyoğlu / İstanbul',
          latitude: 41.0256,
          longitude: 28.9742
        } : {};

        result = await registerUser(fullName, email, password, userType, extraData);
      }

      if (result.success) {
        onSuccess();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pastel-bg flex flex-col items-center justify-center p-4 sm:p-6 relative">
      
      {/* Geri Dönüş Butonu */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center space-x-2 px-4 py-2 rounded-full bg-white/80 border border-pastel-rose/30 text-pastel-dark text-xs font-semibold hover:bg-white shadow-xs transition-transform active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Karşılamaya Dön</span>
      </button>

      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-pastel-card border border-pastel-rose/30 mt-12 mb-6 space-y-6">
        
        {/* Mod Değiştirme Tab Barı */}
        <div className="flex bg-pastel-bg p-1 rounded-2xl border border-pastel-rose/20">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isLogin ? 'bg-white text-pastel-dark shadow-xs' : 'text-pastel-gray hover:text-pastel-dark'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              !isLogin ? 'bg-white text-pastel-dark shadow-xs' : 'text-pastel-gray hover:text-pastel-dark'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Sayfa Başlığı */}
        <div className="text-center space-y-1">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-pastel-dark">
            {isLogin ? 'Tekrar Hoş Geldin ✨' : 'AnıPini Hesabı Oluştur 🌸'}
          </h2>
          <p className="text-xs text-pastel-gray">
            {isLogin ? 'Haritandaki anılara erişmek için giriş yap.' : 'Hesap türünü seçip anı biriktirmeye başla.'}
          </p>
        </div>

        {/* Hata Mesajı */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Kayıt Olunuyorsa Kullanıcı Tipi Seçimi (Bireysel vs Kurumsal) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-pastel-dark">Hesap Türünü Seçin *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUserType('individual')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                    userType === 'individual'
                      ? 'bg-pastel-rose/40 border-pastel-dark text-pastel-dark shadow-xs'
                      : 'bg-pastel-bg border-pastel-rose/20 text-pastel-gray hover:text-pastel-dark'
                  }`}
                >
                  <UserCheck className="w-5 h-5 text-pastel-dark" />
                  <span>Bireysel Hesap 👤</span>
                  <span className="text-[10px] font-normal text-pastel-gray text-center">Kişisel anılar ve geziler</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType('corporate')}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all ${
                    userType === 'corporate'
                      ? 'bg-purple-100 border-purple-600 text-purple-900 shadow-xs ring-2 ring-purple-400'
                      : 'bg-pastel-bg border-pastel-rose/20 text-pastel-gray hover:text-pastel-dark'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span>Kurumsal / Mekan 🏢</span>
                  <span className="text-[10px] font-normal text-pastel-gray text-center">Mekan adresi & sponsorluk</span>
                </button>
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-pastel-dark mb-1">
                {userType === 'corporate' ? 'Mekan / İşletme Adı *' : 'Ad Soyad *'}
              </label>
              <div className="relative">
                {userType === 'corporate' ? (
                  <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-purple-500" />
                ) : (
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-pastel-gray" />
                )}
                <input
                  type="text"
                  required
                  placeholder={userType === 'corporate' ? 'Örn: Galata Kahvecisi' : 'Örn: Mertcan Yılmaz'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-sm focus:outline-none focus:ring-2 focus:ring-pastel-rose transition-all"
                />
              </div>
            </div>
          )}

          {/* MEKAN HESABI İÇİN ADRES/KONUM GİRDİSİ */}
          {!isLogin && userType === 'corporate' && (
            <div>
              <label className="block text-xs font-semibold text-pastel-dark mb-1">Mekan Açık Adresi / Şehir *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-purple-600" />
                <input
                  type="text"
                  required
                  placeholder="Örn: Galata Meydanı No:12 Beyoğlu / İstanbul"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-purple-50/60 border border-purple-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all font-medium"
                />
              </div>
              <p className="text-[10px] text-pastel-gray mt-1">Sponsor olacağınızda haritadaki bu mekan konumunuz otomatik kullanılacaktır.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-pastel-dark mb-1">E-Posta Adresi *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-pastel-gray" />
              <input
                type="email"
                required
                placeholder="mertcan@anipini.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-sm focus:outline-none focus:ring-2 focus:ring-pastel-rose transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-pastel-dark mb-1">Şifre *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-pastel-gray" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-sm focus:outline-none focus:ring-2 focus:ring-pastel-rose transition-all"
              />
            </div>
          </div>

          {/* Gönder Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark rounded-2xl font-bold text-sm shadow-pastel-soft transition-all active:scale-98 mt-2 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'İşlem yapılıyor...' : isLogin ? 'Giriş Yap 🚀' : userType === 'corporate' ? 'Kurumsal Hesap Oluştur 🏢' : 'Bireysel Kayıt Ol 🌸'}</span>
          </button>
        </form>

        {/* Sosyal Giriş Seçenekleri */}
        <div className="space-y-3 pt-2">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-pastel-rose/20 w-full"></div>
            <span className="bg-white px-3 text-[11px] text-pastel-gray font-medium absolute">veya sosyal hesabınla</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => alert('Google ile hızlı giriş yakında aktif olacak! 🎉')}
              className="flex items-center justify-center space-x-2 py-2.5 rounded-2xl border border-pastel-rose/30 bg-white hover:bg-pastel-bg text-xs font-medium text-pastel-dark shadow-xs transition-colors"
            >
              <Chrome className="w-4 h-4 text-red-500" />
              <span>Google</span>
            </button>

            <button
              onClick={() => alert('Apple ile hızlı giriş yakında aktif olacak! 🍎')}
              className="flex items-center justify-center space-x-2 py-2.5 rounded-2xl border border-pastel-rose/30 bg-white hover:bg-pastel-bg text-xs font-medium text-pastel-dark shadow-xs transition-colors"
            >
              <Apple className="w-4 h-4 text-black" />
              <span>Apple</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
