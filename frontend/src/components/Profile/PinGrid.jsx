import React from 'react';
import { Calendar, MapPin, Heart, Film, Music, Image as ImageIcon, Globe, Users, Target, Lock, Repeat } from 'lucide-react';

const PinGrid = ({ pins, onSelectPin }) => {
  if (pins.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-pastel-rose/20 shadow-sm max-w-4xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-pastel-rose/30 mx-auto flex items-center justify-center text-pastel-dark mb-4">
          <Heart className="w-8 h-8 text-pastel-roseHover" />
        </div>
        <h3 className="font-serif font-bold text-xl text-pastel-dark">Henüz Bir Anı Bulunmuyor</h3>
        <p className="text-xs text-pastel-gray mt-1 max-w-sm mx-auto">
          Haritaya giderek sevdiğin noktalara fotoğraf, video veya sesli anılarını eklemeye başla! 🌸
        </p>
      </div>
    );
  }

  const getVisibilityBadge = (visibility) => {
    switch (visibility) {
      case 'followers':
        return <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold"><Users className="w-3 h-3" /><span>Takipçiler</span></span>;
      case 'selected_followers':
        return <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold"><Target className="w-3 h-3" /><span>Seçili Takipçiler</span></span>;
      case 'private':
        return <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold"><Lock className="w-3 h-3" /><span>Gizli</span></span>;
      default:
        return <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold"><Globe className="w-3 h-3" /><span>Herkese Açık</span></span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8 space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-serif font-bold text-xl text-pastel-dark">Anı Kartları & Noktaları</h3>
        <span className="text-xs text-pastel-gray font-medium">{pins.length} Anı / Konum</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {pins.map((pin) => {
          const firstMemory = pin.memories ? pin.memories[0] : (pin.pin ? pin : null);
          const spotName = pin.spotName || pin.pin?.spotName || pin.title || 'Anı Konumu';
          const spotSubtitle = pin.spotSubtitle || pin.pin?.spotSubtitle || pin.subtitle;
          const mediaType = firstMemory?.mediaType || pin.mediaType || 'image';
          const mediaUrl = firstMemory?.mediaUrl || pin.mediaUrl;
          const category = pin.category || pin.pin?.category;
          const visibility = firstMemory?.visibility || pin.visibility || 'public';
          const isReposted = pin.isReposted;

          return (
            <div
              key={pin.id}
              onClick={() => onSelectPin(pin.pin ? { ...pin.pin, memories: [pin] } : pin)}
              className="group bg-white rounded-3xl overflow-hidden border border-pastel-rose/20 shadow-pastel-card hover:shadow-pastel-hover transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Kart Görsel / Medya Alanı */}
                <div className="relative w-full h-44 bg-pastel-bg overflow-hidden flex items-center justify-center">
                  {mediaUrl && mediaType === 'image' ? (
                    <img
                      src={mediaUrl}
                      alt={spotName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : mediaType === 'video' ? (
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white space-y-1">
                      <Film className="w-8 h-8 text-pastel-sky" />
                      <span className="text-[10px] font-bold">Video Anı</span>
                    </div>
                  ) : mediaType === 'audio' ? (
                    <div className="w-full h-full bg-pastel-mint/40 flex flex-col items-center justify-center text-pastel-dark space-y-1">
                      <Music className="w-8 h-8 text-pastel-dark animate-pulse" />
                      <span className="text-[10px] font-bold">Ses Kaydı</span>
                    </div>
                  ) : (
                    <MapPin className="w-8 h-8 text-pastel-roseHover opacity-60" />
                  )}

                  {/* Kategori Rozeti */}
                  {category && (
                    <span
                      className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold text-pastel-dark shadow-xs backdrop-blur-md"
                      style={{ backgroundColor: category.colorHex || '#F3D5D8' }}
                    >
                      {category.name}
                    </span>
                  )}

                  {/* Kurumsal Repost Etiketi */}
                  {isReposted && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-600 text-white shadow-xs flex items-center space-x-1">
                      <Repeat className="w-3 h-3" />
                      <span>Retweeted</span>
                    </span>
                  )}

                  {/* Topluluk Anı Sayısı veya Gizlilik Etiketi */}
                  <div className="absolute bottom-3 right-3 shadow-xs">
                    {getVisibilityBadge(visibility)}
                  </div>
                </div>

                {/* İçerik */}
                <div className="p-4 space-y-1">
                  <h4 className="font-serif font-bold text-base text-pastel-dark line-clamp-1 group-hover:text-pastel-roseHover transition-colors">
                    {spotName}
                  </h4>
                  {spotSubtitle && (
                    <p className="text-xs text-pastel-gray line-clamp-1 font-medium">
                      {spotSubtitle}
                    </p>
                  )}
                  {pin.title && (
                    <p className="text-[11px] text-pastel-charcoal italic line-clamp-2 pt-1 font-medium">
                      "{pin.title}"
                    </p>
                  )}
                </div>
              </div>

              {/* Alt Bilgi */}
              <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-pastel-rose/10 text-[11px] text-pastel-gray">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-pastel-roseHover" />
                  <span>{new Date(pin.createdAt || Date.now()).toLocaleDateString('tr-TR')}</span>
                </div>
                <span className="font-semibold text-pastel-dark group-hover:translate-x-1 transition-transform">
                  İncele &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PinGrid;
