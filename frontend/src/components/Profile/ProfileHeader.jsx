import React, { useEffect, useRef, useState } from 'react';
import { Edit2, Check, MapPin, Building2, Users, UserPlus, UserCheck, Clock, ArrowLeft, Shield, Camera, X } from 'lucide-react';

const ProfileHeader = ({
  user,
  viewedUser,
  pinCount,
  stats = {},
  onUpdateBio,
  onUpdateProfile,
  onBackToMyProfile,
  followStatus,
  onToggleFollow
}) => {
  const isViewingOther = Boolean(viewedUser);
  const targetUser = viewedUser || user;

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [nameText, setNameText] = useState(targetUser?.fullName || '');
  const [emailText, setEmailText] = useState(targetUser?.email || '');
  const [bioText, setBioText] = useState(targetUser?.bio || 'Haritamda tatlı anılar biriktiriyorum 🌸');
  const fileInputRef = useRef(null);

  const isCorporate = targetUser?.userType === 'corporate';

  useEffect(() => {
    setNameText(targetUser?.fullName || '');
  }, [targetUser?.fullName]);

  useEffect(() => {
    setEmailText(targetUser?.email || '');
  }, [targetUser?.email]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Lütfen bir fotoğraf dosyası seçin.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Profil fotoğrafı en fazla 3 MB olabilir.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onUpdateProfile?.({ avatarUrl: reader.result });
    };
    reader.onerror = () => alert('Fotoğraf dosyası okunamadı.');
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    const fullName = nameText.trim();
    if (!fullName) {
      alert('Profil adı boş bırakılamaz.');
      return;
    }
    const saved = await onUpdateProfile?.({ fullName });
    if (saved !== false) setIsEditingName(false);
  };

  const handleSaveEmail = async () => {
    const email = emailText.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Geçerli bir e-posta adresi girin.');
      return;
    }
    const saved = await onUpdateProfile?.({ email });
    if (saved !== false) setIsEditingEmail(false);
  };

  const handleSaveBio = () => {
    if (onUpdateBio) {
      onUpdateBio(bioText);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pastel-rose/30 shadow-pastel-card max-w-4xl mx-auto space-y-4">
      
      {/* Eğer başka bir profil inceleniyorsa Üst Dönüş Butonu */}
      {isViewingOther && (
        <div className="flex items-center justify-between pb-3 border-b border-pastel-rose/20">
          <button
            onClick={onBackToMyProfile}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-pastel-bg hover:bg-pastel-rose/20 text-pastel-dark font-bold text-xs transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kendi Profilime Dön 🌸</span>
          </button>

          <span className="text-xs text-pastel-gray italic font-medium flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-pastel-roseHover" />
            <span>Kullanıcı Profili İnceleniyor</span>
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
        
        {/* Profil Fotoğrafı ve Halka Dekorasyonu */}
        <div className="relative group flex-shrink-0">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr ${
            isCorporate 
              ? 'from-purple-400 via-indigo-300 to-sky-300 ring-4 ring-purple-200 shadow-lg' 
              : 'from-pastel-rose via-pastel-peach to-pastel-sky shadow-pastel-soft'
          }`}>
            {targetUser?.avatarUrl ? (
              <img
                src={targetUser.avatarUrl}
                alt={targetUser?.fullName}
                className="w-full h-full rounded-full object-cover bg-white p-1"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-pastel-gray">
                <Camera className="w-8 h-8" />
              </div>
            )}
          </div>
          {!isViewingOther && !isCorporate && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Profil fotoğrafı seç"
                className="absolute bottom-0 left-0 p-2 rounded-full bg-pastel-dark text-white shadow-md hover:bg-pastel-roseHover"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </>
          )}
          
          {/* Rozet İkonu: Kurumsal hesaplarda Mekan İkonu, Bireyselde Çiçek */}
          <span className={`absolute bottom-1 right-1 text-xs p-1.5 rounded-full shadow-md border ${
            isCorporate ? 'bg-purple-600 text-white border-purple-300' : 'bg-white text-pastel-dark border-pastel-rose/30'
          }`}>
            {isCorporate ? <Building2 className="w-4 h-4" /> : '🌸'}
          </span>
        </div>

        {/* Bilgiler ve İstatistikler */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                {!isViewingOther && !isCorporate && isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      value={nameText}
                      onChange={(event) => setNameText(event.target.value)}
                      aria-label="Profil adı"
                      maxLength={100}
                      className="w-40 px-2 py-1 rounded-lg border border-pastel-rose/40 text-lg font-bold text-pastel-dark focus:outline-none focus:ring-2 focus:ring-pastel-rose"
                    />
                    <button onClick={handleSaveName} aria-label="Profil adını kaydet" className="p-1.5 text-emerald-600">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setNameText(targetUser?.fullName || ''); setIsEditingName(false); }} aria-label="Düzenlemeyi iptal et" className="p-1.5 text-pastel-gray">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold text-pastel-dark">{targetUser?.fullName || 'Gezgin Anısever'}</h2>
                    {!isViewingOther && !isCorporate && (
                      <button onClick={() => setIsEditingName(true)} aria-label="Profil adını düzenle" className="text-pastel-gray hover:text-pastel-dark">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* KURUMSAL HESAP İKONU & ROZETİ */}
                {isCorporate && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-purple-100 border border-purple-300 text-purple-800 text-[11px] font-bold shadow-xs">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Kurumsal / Mekan</span>
                  </span>
                )}
              </div>
              {!isViewingOther && !isCorporate && isEditingEmail ? (
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="email"
                    value={emailText}
                    onChange={(event) => setEmailText(event.target.value)}
                    aria-label="E-posta adresi"
                    maxLength={100}
                    className="w-56 px-2 py-1 rounded-lg border border-pastel-rose/40 text-xs text-pastel-dark focus:outline-none focus:ring-2 focus:ring-pastel-rose"
                  />
                  <button onClick={handleSaveEmail} aria-label="E-posta adresini kaydet" className="p-1.5 text-emerald-600">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEmailText(targetUser?.email || ''); setIsEditingEmail(false); }} aria-label="E-posta düzenlemesini iptal et" className="p-1.5 text-pastel-gray">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-xs text-pastel-gray">{targetUser?.email}</p>
                  {!isViewingOther && !isCorporate && (
                    <button onClick={() => setIsEditingEmail(true)} aria-label="E-posta adresini düzenle" className="text-pastel-gray hover:text-pastel-dark">
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* BAŞKA HESAP VEYA KENDİ PROFİLİ BUTONU */}
            {isViewingOther ? (
              <button
                onClick={onToggleFollow}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95 ${
                  followStatus === 'accepted'
                    ? 'bg-white text-pastel-dark border border-pastel-rose/30 hover:bg-red-50 hover:text-red-600'
                    : followStatus === 'pending'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : isCorporate
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark'
                }`}
              >
                {followStatus === 'accepted' ? (
                  <>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Takip Ediliyor 👥</span>
                  </>
                ) : followStatus === 'pending' ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    <span>İstek Gönderildi ⏳</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{targetUser?.isPrivate ? 'Takip İsteği Gönder 👥' : 'Takip Et 👤+'}</span>
                  </>
                )}
              </button>
            ) : null}
          </div>

          {/* İSTATİSTİK KARTLARI */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            {/* Anı Pinlendi Stat */}
            <div className="flex items-center space-x-1.5 bg-pastel-bg px-3.5 py-2 rounded-2xl border border-pastel-rose/20 shadow-2xs">
              <MapPin className="w-4 h-4 text-pastel-roseHover" />
              <span className="text-xs font-bold text-pastel-dark">{pinCount} Anı Pinlendi</span>
            </div>

            {/* Takipçi ve Takip Edilen (SADECE BİREYSEL HESAPLAR İÇİN) */}
            {!isCorporate ? (
              <>
                <div className="flex items-center space-x-1.5 bg-pastel-bg px-3.5 py-2 rounded-2xl border border-pastel-rose/20 shadow-2xs">
                  <Users className="w-4 h-4 text-sky-500" />
                  <span className="text-xs font-bold text-pastel-dark">{stats.followersCount || 142} Takipçi</span>
                </div>

                <div className="flex items-center space-x-1.5 bg-pastel-bg px-3.5 py-2 rounded-2xl border border-pastel-rose/20 shadow-2xs">
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-pastel-dark">{stats.followingCount || 98} Takip Edilen</span>
                </div>
              </>
            ) : (
              /* MEKANLARDA SADECE TAKİPÇİ SAYISI GÖSTERİLİR */
              <div className="flex items-center space-x-1.5 bg-purple-50 px-3.5 py-2 rounded-2xl border border-purple-200 shadow-2xs">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-purple-900">{(stats.followersCount || targetUser?.followerCount || 350).toLocaleString('tr-TR')} Takipçi</span>
              </div>
            )}
          </div>

          {/* Biyografi Alanı ve Düzenleme Modu */}
          <div className="pt-1">
            {!isViewingOther && isEditing ? (
              <div className="flex items-center space-x-2 mt-1">
                <input
                  type="text"
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-pastel-bg border border-pastel-rose/40 text-xs text-pastel-dark focus:outline-none focus:ring-2 focus:ring-pastel-rose"
                />
                <button
                  onClick={handleSaveBio}
                  className="p-2 rounded-xl bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark shadow-xs"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start space-x-2 text-xs text-pastel-charcoal group">
                <p className="italic">"{targetUser?.bio || bioText}"</p>
                {!isViewingOther && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-pastel-gray hover:text-pastel-dark transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileHeader;
