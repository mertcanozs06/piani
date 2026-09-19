import React, { useState, useEffect } from 'react';
import MapView from '../components/Map/MapView';
import PinDetailModal from '../components/Map/PinDetailModal';
import AddPinModal from '../components/Map/AddPinModal';
import SearchModal from '../components/Search/SearchModal';
import SponsorshipModal from '../components/Sponsorship/SponsorshipModal';
import api, { MOCK_PINS, MOCK_CATEGORIES, MOCK_SPONSORED_PINS } from '../services/api';

const MapPage = ({
  isAddPinOpen,
  setIsAddPinOpen,
  isSearchOpen,
  setIsSearchOpen,
  isSponsorshipOpen,
  setIsSponsorshipOpen,
  onViewProfile
}) => {
  const [pins, setPins] = useState(MOCK_PINS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [sponsoredPins, setSponsoredPins] = useState(MOCK_SPONSORED_PINS);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPin, setSelectedPin] = useState(null);
  const [clickCoords, setClickCoords] = useState(null);
  const [flyCoords, setFlyCoords] = useState(null);

  const fetchPins = async () => {
    try {
      const res = await api.get('/pins', {
        params: selectedCategory ? { categoryId: selectedCategory } : {}
      });
      if (res.data.success && res.data.data.length > 0) {
        setPins(res.data.data);
      }
    } catch (err) {
      if (selectedCategory) {
        setPins(MOCK_PINS.filter(p => p.category?.id === selectedCategory));
      } else {
        setPins(MOCK_PINS);
      }
    }
  };

  const fetchSponsoredPins = async () => {
    try {
      const res = await api.get('/pins/sponsored');
      if (res.data.success && res.data.data.length > 0) {
        setSponsoredPins(res.data.data);
      }
    } catch (err) {
      setSponsoredPins(MOCK_SPONSORED_PINS);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/pins/categories');
      if (res.data.success && res.data.data.length > 0) {
        setCategories(res.data.data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchCategories();
    fetchSponsoredPins();
  }, []);

  useEffect(() => {
    fetchPins();
  }, [selectedCategory]);

  const handleMapClickToAdd = (lat, lng) => {
    setClickCoords({ lat, lng });
    setIsAddPinOpen(true);
  };

  const existingSpot = clickCoords
    ? pins.find((pin) => (
      Math.abs(pin.latitude - clickCoords.lat) < 0.0015
      && Math.abs(pin.longitude - clickCoords.lng) < 0.0015
    ))
    : null;

  // Açık Artırma Teklifi Alındığında (Sistem İlk 5'i Hesaplayıp Günceller)
  const handleSponsorshipBidSubmitted = (bidData) => {
    const amount = parseFloat(bidData.bidAmount);
    const curr = bidData.currency;
    let scoreTL = amount;
    if (curr === 'USD') scoreTL = amount * 35;
    if (curr === 'EUR') scoreTL = amount * 38;

    const newBidItem = {
      id: Date.now(),
      spotName: bidData.spotName,
      spotSubtitle: bidData.spotSubtitle || 'Yeni Açık Artırma Sponsoru',
      latitude: bidData.latitude,
      longitude: bidData.longitude,
      bidAmount: amount,
      currency: curr,
      bidScoreTL: scoreTL,
      category: categories[0]
    };

    setSponsoredPins(prev => {
      const updatedList = [newBidItem, ...prev];
      // TL puanına göre büyükten küçüğe sırala ve en yüksek ilk 5 mekan secişin!
      updatedList.sort((a, b) => (b.bidScoreTL || 0) - (a.bidScoreTL || 0));
      return updatedList.slice(0, 5);
    });

    // Haritayı yeni sponsorlu mekana uçur
    setFlyCoords({ lat: bidData.latitude, lng: bidData.longitude });
  };

  // 1. Yeni Bir Konum ve İlk Anısını Oluşturma
  const handleAddPinSpot = async (pinData) => {
    const category = categories.find(c => c.id === pinData.categoryId) || categories[0];

    try {
      const res = await api.post('/pins', pinData);
      if (res.data.success) {
        fetchPins();
      }
    } catch (err) {
      // Mock Fallback
      const newMockPin = {
        id: Date.now(),
        spotName: pinData.spotName,
        spotSubtitle: pinData.spotSubtitle,
        latitude: pinData.latitude,
        longitude: pinData.longitude,
        memoryCount: 1,
        category,
        memories: [
          {
            id: Date.now() + 1,
            title: pinData.title,
            subtitle: pinData.subtitle,
            contentText: pinData.contentText,
            mediaType: pinData.mediaType,
            mediaUrl: pinData.mediaUrl,
            visibility: pinData.visibility || 'public',
            memoryDate: pinData.memoryDate,
            createdAt: new Date().toISOString(),
            user: { id: 1, fullName: 'Damla Yılmaz', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Damla' },
            likeCount: 0,
            isLikedByMe: false,
            comments: []
          }
        ]
      };
      setPins([newMockPin, ...pins]);
    }
  };

  // 2. Var Olan Pine Yeni Bir Kullanıcı Anısı Ekleme
  const handleAddMemoryToPin = async (pinId, newMemory) => {
    setPins(prev => prev.map(p => {
      if (p.id === pinId) {
        const updatedMemories = [newMemory, ...(p.memories || [])];
        return {
          ...p,
          memoryCount: updatedMemories.length,
          memories: updatedMemories
        };
      }
      return p;
    }));

    if (selectedPin && selectedPin.id === pinId) {
      setSelectedPin(prev => ({
        ...prev,
        memories: [newMemory, ...(prev.memories || [])]
      }));
    }

    try {
      await api.post(`/pins/${pinId}/memories`, newMemory);
    } catch (err) {}
  };

  // 3. Pindeki Bir Anıyı Silme
  const handleDeleteMemory = async (memoryId) => {
    if (!window.confirm('Bu anınız bu pinden silinsin mi? 🌸')) return;

    if (selectedPin) {
      const updatedMemories = selectedPin.memories.filter(m => m.id !== memoryId);
      setSelectedPin({ ...selectedPin, memories: updatedMemories });

      setPins(prev => prev.map(p => {
        if (p.id === selectedPin.id) {
          return { ...p, memoryCount: updatedMemories.length, memories: updatedMemories };
        }
        return p;
      }));
    }

    try {
      await api.delete(`/pins/memories/${memoryId}`);
    } catch (err) {}
  };

  return (
    <div className="relative w-full h-full">
      <MapView
        pins={pins}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSelectPin={(pin) => setSelectedPin(pin)}
        onMapClickToAdd={handleMapClickToAdd}
        sponsoredPins={sponsoredPins}
        onOpenSponsorshipModal={() => setIsSponsorshipOpen(true)}
        flyCoords={flyCoords}
      />

      {/* Pin Detay & Çoklu Anılar Modalı */}
      <PinDetailModal
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
        onDeleteMemory={handleDeleteMemory}
        onAddMemoryToPin={handleAddMemoryToPin}
      />

      {/* Yeni Konum & Anı Ekleme Modalı */}
      <AddPinModal
        isOpen={isAddPinOpen}
        onClose={() => setIsAddPinOpen(false)}
        categories={categories}
        initialCoords={clickCoords}
        existingSpot={existingSpot}
        onSubmitPin={handleAddPinSpot}
      />

      {/* Kullanıcı & Mekan Arama Modalı */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onViewProfile={onViewProfile}
      />

      {/* Sponsor Olma & Açık Artırma Modalı */}
      <SponsorshipModal
        isOpen={isSponsorshipOpen}
        onClose={() => setIsSponsorshipOpen(false)}
        initialCoords={clickCoords}
        onBidSubmitted={handleSponsorshipBidSubmitted}
      />
    </div>
  );
};

export default MapPage;
