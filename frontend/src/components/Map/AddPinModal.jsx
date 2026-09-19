import React, { useState, useEffect } from 'react';
import { X, MapPin, Sparkles, Image as ImageIcon, Film, Music, Globe, Users, Target, Lock, Check, Upload, Trash2, Building2 } from 'lucide-react';
import { MOCK_FOLLOWERS } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AddPinModal = ({ isOpen, onClose, categories, initialCoords, existingSpot, onSubmitPin }) => {
  const { user } = useAuth();
  const [spotName, setSpotName] = useState(existingSpot?.spotName || '');
  const [spotSubtitle, setSpotSubtitle] = useState(existingSpot?.spotSubtitle || '');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 1);
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video' | 'audio'
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [visibility, setVisibility] = useState('public'); // 'public', 'followers', 'selected_followers', 'private'
  const [selectedFollowerIds, setSelectedFollowerIds] = useState([]);
  const [lat, setLat] = useState(initialCoords?.lat || 41.0082);
  const [lng, setLng] = useState(initialCoords?.lng || 28.9784);

  const isCorporate = user?.userType === 'corporate';
  const isExistingSpotFixed = Boolean(existingSpot && existingSpot.spotName);

  useEffect(() => {
    if (initialCoords) {
      setLat(initialCoords.lat);
      setLng(initialCoords.lng);
    }
  }, [initialCoords]);

  useEffect(() => {
    setSpotName(existingSpot?.spotName || '');
    setSpotSubtitle(existingSpot?.spotSubtitle || '');
  }, [existingSpot]);

  if (!isOpen) return null;

  // Dosya Yükleme İşleyicisi (Galeri / Cihaz Dosyaları Seçimi)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const toggleFollowerSelect = (followerId) => {
    if (selectedFollowerIds.includes(followerId)) {
      setSelectedFollowerIds(selectedFollowerIds.filter(id => id !== followerId));
    } else {
      setSelectedFollowerIds([...selectedFollowerIds, followerId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!spotName.trim() || !title.trim()) {
      alert('Lütfen konum adını ve anı başlığınızı doldurun 🌸');
      return;
    }

    if (visibility === 'selected_followers' && selectedFollowerIds.length === 0) {
      alert('Lütfen anınızı paylaşmak istediğiniz en az 1 takipçi seçin 🎯');
      return;
    }

    onSubmitPin({
      spotName,
      spotSubtitle,
      categoryId: parseInt(categoryId, 10),
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      title,
      subtitle,
      contentText,
      mediaType,
      mediaUrl,
      visibility,
      allowedUserIds: visibility === 'selected_followers' ? selectedFollowerIds : null,
      memoryDate: new Date().toISOString().split('T')[0]
    });

    setSpotName('');
    setSpotSubtitle('');
    setTitle('');
    setSubtitle('');
    setContentText('');
    setMediaUrl('');
    setFileName('');
    setVisibility('public');
    setSelectedFollowerIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-pastel-dark/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-pastel-rose/40">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-pastel-rose/40 border-b border-pastel-rose/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-pastel-dark shadow-sm">
              <Sparkles className="w-5 h-5 text-pastel-roseHover" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-pastel-dark">Haritaya Anı Pinle</h3>
              <p className="text-xs text-pastel-gray font-medium">Seçili konuma yeni anını ekle & galerinden paylaş</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-pastel-dark shadow-sm transition-transform active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[75vh]">
          
          {/* Konum Adı & Alt Başlığı (Eğer var olan bir pinse kilitli/sadece gösterimdir) */}
          {isExistingSpotFixed ? (
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex items-center space-x-2.5">
              <Building2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-purple-900 block">{spotName}</span>
                {spotSubtitle && <span className="text-purple-700 text-[11px] block">{spotSubtitle}</span>}
                <span className="text-purple-500 text-[10px] italic">Bu kayıtlı konuma anı ekliyorsunuz.</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-pastel-dark mb-1">Mekan / Konum Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Galata Kulesi Sokak Kahvecisi ☕"
                  value={spotName}
                  onChange={(e) => setSpotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-dark mb-1">Konum Alt Başlığı</label>
                <input
                  type="text"
                  placeholder="Örn: Tarihi kule caddesi üzeri"
                  value={spotSubtitle}
                  onChange={(e) => setSpotSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose"
                />
              </div>
            </div>
          )}

          {/* Kategori Seçimi */}
          {!isExistingSpotFixed && (
            <div>
              <label className="block text-xs font-semibold text-pastel-dark mb-1">Kategori Seçin *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 border transition-all text-left ${
                      categoryId === cat.id
                        ? 'border-pastel-dark shadow-sm ring-2 ring-pastel-dark'
                        : 'border-transparent hover:opacity-90'
                    }`}
                    style={{ backgroundColor: cat.colorHex }}
                  >
                    <span className="w-2 h-2 rounded-full bg-pastel-dark"></span>
                    <span className="truncate text-pastel-dark">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Anı Başlığı & Alt Başlığı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-pastel-rose/20">
            <div>
              <label className="block text-xs font-semibold text-pastel-dark mb-1">Anı Başlığı *</label>
              <input
                type="text"
                required
                placeholder="Örn: Dondurma Keyfi 🍦"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-pastel-dark mb-1">Anı Alt Başlığı</label>
              <input
                type="text"
                placeholder="Örn: Gün batarken harika bir gündü..."
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-pastel-dark mb-1">Detaylı Hikaye</label>
            <textarea
              rows={2}
              placeholder="Hikayeni buraya yaz..."
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose resize-none"
            />
          </div>

          {/* ANİ GİZLİLİK SEÇENEKLERİ */}
          <div className="pt-2 border-t border-pastel-rose/20 space-y-2">
            <label className="block text-xs font-semibold text-pastel-dark">Anı Görme Yetkisi (Gizlilik) *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                  visibility === 'public'
                    ? 'bg-emerald-100 border-emerald-600 text-emerald-900 shadow-xs'
                    : 'bg-pastel-bg border-transparent text-pastel-gray'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Herkese Açık 🌐</span>
              </button>

              {!isCorporate && (
                <button
                  type="button"
                  onClick={() => setVisibility('followers')}
                  className={`p-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                    visibility === 'followers'
                      ? 'bg-sky-100 border-sky-600 text-sky-900 shadow-xs'
                      : 'bg-pastel-bg border-transparent text-pastel-gray'
                  }`}
                >
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Tüm Takipçilerim 👥</span>
                </button>
              )}

              {!isCorporate && (
                <button
                  type="button"
                  onClick={() => setVisibility('selected_followers')}
                  className={`p-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                    visibility === 'selected_followers'
                      ? 'bg-amber-100 border-amber-600 text-amber-900 shadow-xs'
                      : 'bg-pastel-bg border-transparent text-pastel-gray'
                  }`}
                >
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Seçtiğim Takipçilere 🎯</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                  visibility === 'private'
                    ? 'bg-rose-100 border-rose-600 text-rose-900 shadow-xs'
                    : 'bg-pastel-bg border-transparent text-pastel-gray'
                }`}
              >
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Sadece Bana Özel 🔒</span>
              </button>
            </div>

            {/* SEÇİLİ TAKİPÇİ SEÇİCİ */}
            {visibility === 'selected_followers' && !isCorporate && (
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2 mt-2">
                <p className="text-[11px] font-bold text-amber-900">Bu anıyı görmesini istediğin takipçilerini seç:</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {MOCK_FOLLOWERS.map((follower) => {
                    const isSelected = selectedFollowerIds.includes(follower.id);
                    return (
                      <div
                        key={follower.id}
                        onClick={() => toggleFollowerSelect(follower.id)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                          isSelected ? 'bg-amber-200 border-amber-500 font-bold text-amber-950' : 'bg-white border-pastel-rose/20 text-pastel-dark'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <img src={follower.avatarUrl} alt={follower.fullName} className="w-5 h-5 rounded-full" />
                          <span>{follower.fullName}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-700" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Medya Türü Seçimi (Foto / Video / Ses) */}
          <div>
            <label className="block text-xs font-semibold text-pastel-dark mb-1">Medya Türü Seçin</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMediaType('image')}
                className={`py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1 border ${
                  mediaType === 'image' ? 'bg-pastel-rose border-pastel-dark text-pastel-dark' : 'bg-pastel-bg text-pastel-gray'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Fotoğraf</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1 border ${
                  mediaType === 'video' ? 'bg-pastel-sky border-pastel-dark text-pastel-dark' : 'bg-pastel-bg text-pastel-gray'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video</span>
              </button>

              <button
                type="button"
                onClick={() => setMediaType('audio')}
                className={`py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1 border ${
                  mediaType === 'audio' ? 'bg-pastel-mint border-pastel-dark text-pastel-dark' : 'bg-pastel-bg text-pastel-gray'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Ses Kaydı</span>
              </button>
            </div>
          </div>

          {/* DOĞRUDAN DOSYA YÜKLEME ALANI (GALERİ / CİHAZ DOSYASI SEÇİMİ) */}
          <div className="p-3.5 bg-pastel-bg rounded-2xl border border-pastel-rose/30 space-y-2">
            <label className="block text-xs font-semibold text-pastel-dark">
              {mediaType === 'image' && '🖼️ Galeriden / Cihazdan Fotoğraf Seçin'}
              {mediaType === 'video' && '🎥 Galeriden / Cihazdan Video Seçin'}
              {mediaType === 'audio' && '🎵 Cihazdan Ses Kaydı Seçin'}
            </label>

            <div className="flex items-center space-x-2">
              <label className="flex-1 cursor-pointer flex items-center justify-center space-x-2 py-3 px-4 bg-white border border-dashed border-pastel-roseHover hover:bg-pastel-rose/20 rounded-2xl text-xs font-bold text-pastel-dark transition-colors shadow-xs">
                <Upload className="w-4 h-4 text-pastel-roseHover" />
                <span className="truncate">{fileName ? `Seçilen: ${fileName}` : 'Dosya Seç (Galeri veya Cihaz)'}</span>
                <input
                  type="file"
                  accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : 'audio/*'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {mediaUrl && (
                <button
                  type="button"
                  onClick={() => { setMediaUrl(''); setFileName(''); }}
                  className="p-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex-shrink-0"
                  title="Dosyayı Kaldır"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Önizleme Alanı */}
            {mediaUrl && (
              <div className="mt-2 rounded-2xl overflow-hidden border border-pastel-rose/30 max-h-48 bg-black flex items-center justify-center">
                {mediaType === 'image' && <img src={mediaUrl} alt="Önizleme" className="max-h-48 object-cover w-full" />}
                {mediaType === 'video' && <video src={mediaUrl} controls className="max-h-48 w-full" />}
                {mediaType === 'audio' && <audio src={mediaUrl} controls className="w-full p-2" />}
              </div>
            )}
          </div>

          {/* Konum Bilgisi */}
          <div className="p-3 bg-pastel-bg rounded-2xl border border-pastel-rose/20 flex items-center justify-between text-xs text-pastel-gray">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-pastel-roseHover" />
              <span>Harita Konumu:</span>
            </div>
            <span className="font-mono font-medium text-pastel-dark">{lat.toFixed(4)}, {lng.toFixed(4)}</span>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark rounded-2xl font-bold text-xs shadow-pastel-soft transition-all active:scale-98"
          >
            Anıyı Pinle ✨
          </button>
        </form>

      </div>
    </div>
  );
};

export default AddPinModal;
