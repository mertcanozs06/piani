import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Filter, PlusCircle, MapPin, Building2 } from 'lucide-react';
import SponsoredSidebar from './SponsoredSidebar';

// Özel Marker HTML Icon (Rozette Anı Sayısı Veya Mekan İkonu İle)
const createPastelMarkerIcon = (colorHex = '#F3D5D8', memoryCount = 1, isSelected = false, isVenue = false) => {
  const size = isSelected ? 48 : 40;
  const bg = isVenue ? '#7C3AED' : colorHex; // Purple for venues
  const borderColor = isVenue ? '#F59E0B' : '#ffffff'; // Gold border for venues

  return L.divIcon({
    className: 'custom-pastel-pin-icon',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <div style="
          background-color: ${bg};
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(0,0,0,0.22);
          border: 3px solid ${borderColor};
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          <div style="
            width: 14px;
            height: 14px;
            background-color: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isVenue ? '9px' : '0px'};
          ">
            ${isVenue ? '🏢' : ''}
          </div>
        </div>

        <!-- Anı Sayısı Veya Mekan Rozeti -->
        <div style="
          position: absolute;
          top: -8px;
          right: -8px;
          background: ${isVenue ? '#7C3AED' : '#1C1C1E'};
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 999px;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          white-space: nowrap;
        ">
          ${isVenue ? '🏢 Mekan' : `${memoryCount} anı`}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
};

// Seçilen Konum Hedef Sinyali İkonu (Pulsing Target)
const createTargetMarkerIcon = () => {
  return L.divIcon({
    className: 'target-pin-icon',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(243, 213, 216, 0.6);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #E8BFC4;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

// Haritaya tıklandığında konum seçme işleyicisi
const MapClickHandler = ({ onSelectTarget }) => {
  useMapEvents({
    click: (e) => {
      onSelectTarget(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// Haritada Yumuşak Odaklanma (FlyTo) İşleyicisi
const MapFlyToController = ({ flyCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (flyCoords) {
      map.flyTo([flyCoords.lat, flyCoords.lng], 15, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [flyCoords, map]);
  return null;
};

const MapView = ({
  pins,
  categories,
  selectedCategory,
  setSelectedCategory,
  onSelectPin,
  onMapClickToAdd,
  sponsoredPins = [],
  onOpenSponsorshipModal,
  flyCoords
}) => {
  const defaultCenter = [41.0082, 28.9784];
  const [targetCoords, setTargetCoords] = useState(null);

  const handleTargetClick = (lat, lng) => {
    setTargetCoords({ lat, lng });
  };

  const handleSelectSponsoredVenue = (sponsoredItem) => {
    // 1. Haritayı o mekanın koordinatlarına kaydır
    setTargetCoords({ lat: sponsoredItem.latitude, lng: sponsoredItem.longitude });
    
    // 2. Eğer mekana bağlı bir pin varsa oradaki anıları aç
    const matchingPin = pins.find(p => (
      p.id === sponsoredItem.pinId
      || (
        Math.abs(p.latitude - sponsoredItem.latitude) < 0.0015
        && Math.abs(p.longitude - sponsoredItem.longitude) < 0.0015
      )
    )) || {
      id: sponsoredItem.id || Date.now(),
      spotName: sponsoredItem.spotName,
      spotSubtitle: sponsoredItem.spotSubtitle,
      latitude: sponsoredItem.latitude,
      longitude: sponsoredItem.longitude,
      isCorporate: true,
      category: sponsoredItem.category || categories[0],
      memories: [
        {
          id: Date.now(),
          title: `${sponsoredItem.spotName} - Sponsorlu Mekan Anısı ✨`,
          subtitle: sponsoredItem.spotSubtitle,
          contentText: 'Bu mekan haritada açık artırma sponsorluğu ile öne çıkarılmıştır.',
          mediaType: 'image',
          mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
          createdAt: new Date().toISOString(),
          user: { fullName: sponsoredItem.spotName, avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Sponsor', userType: 'corporate' }
        }
      ]
    };

    onSelectPin(matchingPin);
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] md:h-[calc(100vh-73px)] overflow-hidden">
      
      {/* Üst Kategori Filtreleme Çubuğu (Görünürlük için z-30 ve yüksek yerleşim) */}
      <div className="absolute top-3 left-4 right-4 z-[1000] flex items-center justify-start overflow-x-auto no-scrollbar space-x-2 py-1.5 px-1 bg-white/90 backdrop-blur-md rounded-2xl border border-white/60 shadow-lg">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm transition-all whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-pastel-dark text-white shadow-md'
              : 'bg-white/95 text-pastel-charcoal hover:bg-white border border-pastel-rose/30'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Tüm Anı Konumları ({pins.length})</span>
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isActive ? null : cat.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm transition-all whitespace-nowrap border border-white/60 ${
                isActive ? 'shadow-md ring-2 ring-pastel-dark' : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: isActive ? cat.colorHex : `${cat.colorHex}DD`,
                color: '#1C1C1E'
              }}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* HARİTANIN SOLUNDAKİ SPONSORLU MEKANLAR YÜZEN PANELİ */}
      <SponsoredSidebar
        sponsoredPins={sponsoredPins}
        onSelectSponsoredVenue={handleSelectSponsoredVenue}
        onOpenSponsorshipModal={onOpenSponsorshipModal}
      />

      {/* Tıklanan Konum Hızlı Ekleme Çubuğu (Varsa) */}
      {targetCoords && (
        <div className="absolute bottom-20 md:bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-pastel-rose/40 flex items-center space-x-4 animate-bounce-short">
          <div className="flex items-center space-x-2 text-xs text-pastel-dark">
            <MapPin className="w-4 h-4 text-pastel-roseHover" />
            <span className="font-semibold">Seçili Konum:</span>
            <span className="font-mono text-pastel-gray">{targetCoords.lat.toFixed(4)}, {targetCoords.lng.toFixed(4)}</span>
          </div>

          <button
            onClick={() => {
              onMapClickToAdd(targetCoords.lat, targetCoords.lng);
              setTargetCoords(null);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark font-bold text-xs shadow-sm transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buraya Anı Ekle ✨</span>
          </button>
        </div>
      )}

      {/* Harita Bileşeni */}
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        zoomControl={false}
        className="relative z-0 w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onSelectTarget={handleTargetClick} />
        <MapFlyToController flyCoords={flyCoords || (targetCoords ? { lat: targetCoords.lat, lng: targetCoords.lng } : null)} />

        {/* Tıklanan Noktadaki Pembe Hedef İşareti */}
        {targetCoords && (
          <Marker
            position={[targetCoords.lat, targetCoords.lng]}
            icon={createTargetMarkerIcon()}
          />
        )}

        {/* Pine henüz bağlanmamış sponsor mekanları da haritada mekan pini olarak göster */}
        {sponsoredPins
          .filter((sponsoredItem) => !pins.some((pin) => (
            pin.id === sponsoredItem.pinId
            || (
              Math.abs(pin.latitude - sponsoredItem.latitude) < 0.0015
              && Math.abs(pin.longitude - sponsoredItem.longitude) < 0.0015
            )
          )))
          .map((sponsoredItem) => {
            const sponsoredPin = {
              id: `sponsored-${sponsoredItem.id}`,
              spotName: sponsoredItem.spotName,
              spotSubtitle: sponsoredItem.spotSubtitle,
              latitude: sponsoredItem.latitude,
              longitude: sponsoredItem.longitude,
              isVenue: true,
              category: sponsoredItem.category || categories[0],
              memories: []
            };

            return (
              <Marker
                key={sponsoredPin.id}
                position={[sponsoredPin.latitude, sponsoredPin.longitude]}
                icon={createPastelMarkerIcon('#8B5CF6', 0, false, true)}
                eventHandlers={{
                  click: () => handleSelectSponsoredVenue(sponsoredItem)
                }}
              >
                <Popup className="custom-pastel-popup">
                  <div className="p-1.5 max-w-[220px]">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                      Mekan 🏢
                    </span>
                    <h4 className="font-serif font-bold text-sm text-pastel-dark leading-tight mt-1">
                      {sponsoredPin.spotName}
                    </h4>
                    <p className="text-[11px] text-pastel-gray mt-0.5 line-clamp-1">
                      {sponsoredPin.spotSubtitle}
                    </p>
                    <button
                      onClick={() => handleSelectSponsoredVenue(sponsoredItem)}
                      className="mt-2 bg-purple-100 hover:bg-purple-200 text-purple-900 px-3 py-1 rounded-xl text-xs font-bold transition-colors"
                    >
                      Mekanı İncele &rarr;
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Var Olan Pinler */}
        {pins.map((pin) => {
          const isVenue = pin.isCorporate || pin.userType === 'corporate' || pin.isVenue;
          const iconColor = isVenue ? '#8B5CF6' : (pin.category?.colorHex || '#F3D5D8');
          const memCount = pin.memoryCount || (pin.memories ? pin.memories.length : 1);

          return (
            <Marker
              key={pin.id}
              position={[pin.latitude, pin.longitude]}
              icon={createPastelMarkerIcon(iconColor, memCount, false, isVenue)}
              eventHandlers={{
                click: () => onSelectPin(pin)
              }}
            >
              <Popup className="custom-pastel-popup">
                <div className="p-1.5 max-w-[220px]">
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pastel-rose/30 text-pastel-dark">
                      {pin.category?.name || 'Anı Konumu'}
                    </span>
                    {isVenue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                        Mekan 🏢
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif font-bold text-sm text-pastel-dark leading-tight mt-1">{pin.spotName}</h4>
                  <p className="text-[11px] text-pastel-gray mt-0.5 line-clamp-1">{pin.spotSubtitle}</p>
                  
                  <div className="mt-2 pt-2 border-t border-pastel-rose/20 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-pastel-charcoal">🌸 {memCount} kişi anı bıraktı</span>
                    <button
                      onClick={() => onSelectPin(pin)}
                      className="bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark px-3 py-1 rounded-xl text-xs font-bold transition-colors"
                    >
                      İncele &rarr;
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView;
