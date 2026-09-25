import React, { useState, useEffect } from 'react';
import ProfileHeader from '../components/Profile/ProfileHeader';
import PinGrid from '../components/Profile/PinGrid';
import PinDetailModal from '../components/Map/PinDetailModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Repeat, Sparkles, MapPin, Lock, UserCheck, Clock } from 'lucide-react';
import { deleteDemoPinForMemory, isDemoMode, readDemoPins } from '../services/demoStorage';

const getLocalReposts = (userId) => {
  try {
    const saved = JSON.parse(
      localStorage.getItem('anipini_demo_reposts')
      || localStorage.getItem(`anipini_reposts_${userId}`)
      || '[]'
    );
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.warn('Yerel mekan paylaşımları okunamadı:', error);
    return [];
  }
};

const isMockSession = () => (
  localStorage.getItem('anipini_demo_mode') === 'true'
  || localStorage.getItem('anipini_token') === 'mock_jwt_token_pastel'
);

const ProfilePage = ({ viewedUser, onBackToMyProfile }) => {
  const { user, setUser } = useAuth();
  const targetUser = viewedUser || user;

  const [userPins, setUserPins] = useState([]);
  const [repostedPins, setRepostedPins] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [activeTab, setActiveTab] = useState('own'); // 'own' | 'reposted'
  const [profileStats, setProfileStats] = useState({
    followersCount: targetUser?.followerCount || 142,
    followingCount: 98
  });

  // Takip İlişkisi Durumu: 'none' | 'pending' | 'accepted'
  const [followStatus, setFollowStatus] = useState(
    targetUser?.isFollowing ? 'accepted' : (targetUser?.followStatus || 'none')
  );

  const isViewingOther = Boolean(viewedUser && viewedUser.id !== user?.id);
  const isCorporate = targetUser?.userType === 'corporate';

  // Anılar Gizli Kilit Kontrolü
  // Eğer başka bir kullanıcının profili inceleniyorsa, hesap gizliyse (veya gizli anı tercihi varsa) ve takip kabul edilmemişse KİLİTLİDİR.
  const isPrivateAccount = targetUser?.isPrivate || targetUser?.visibility === 'followers' || targetUser?.visibility === 'private';
  const isMemoriesLocked = isViewingOther && isPrivateAccount && followStatus !== 'accepted';

  const fetchProfile = async () => {
    if (!isViewingOther && isDemoMode()) {
      const savedPins = readDemoPins(targetUser?.id);
      const ownMemories = savedPins.flatMap(pin => (pin.memories || [])
        .filter(memory => String(memory.user?.id) === String(targetUser?.id))
        .map(memory => ({
          ...memory,
          pin: {
            id: pin.id,
            spotName: pin.spotName,
            spotSubtitle: pin.spotSubtitle,
            latitude: pin.latitude,
            longitude: pin.longitude,
            category: pin.category
          }
        })));
      setUserPins(ownMemories);
      setRepostedPins(isCorporate ? getLocalReposts(targetUser?.id) : []);
      return;
    }

    if (isViewingOther) {
      try {
        const res = await api.get(`/users/${targetUser.id}/profile`);
        if (res.data.success) {
          setUserPins(res.data.data.memories || []);
          setRepostedPins(res.data.data.repostedMemories || []);
          if (res.data.data.stats) setProfileStats(res.data.data.stats);
          if (res.data.data.followStatus) setFollowStatus(res.data.data.followStatus);
        }
      } catch (err) {
        // Mock fallback for viewed user
        setUserPins(targetUser?.memories || []);
      }
    } else {
      try {
        const res = await api.get('/users/profile');
        if (res.data.success) {
          setUserPins(res.data.data.memories || res.data.data.pins || []);
          const serverReposts = res.data.data.repostedMemories || [];
          const localReposts = isCorporate ? getLocalReposts(targetUser.id) : [];
          const serverRepostIds = new Set(serverReposts.map(pin => pin.id));
          setRepostedPins([
            ...serverReposts,
            ...localReposts.filter(pin => !serverRepostIds.has(pin.id))
          ]);
          if (res.data.data.stats) {
            setProfileStats(res.data.data.stats);
          }
        }
      } catch (err) {
        // Backend bağlantısı yoksa veya kullanıcı anı eklememişse boş liste olarak kalmalı
        setUserPins([]);
        setRepostedPins(isCorporate ? getLocalReposts(targetUser?.id) : []);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    setFollowStatus(targetUser?.isFollowing ? 'accepted' : (targetUser?.followStatus || 'none'));
  }, [viewedUser, user]);

  const handleToggleFollow = async () => {
    if (followStatus === 'none') {
      if (isPrivateAccount) {
        setFollowStatus('pending');
        alert('Takip isteğiniz kullanıcıya gönderildi ⏳. İsteğiniz kabul edildiğinde anılar görüntülenebilecektir.');
      } else {
        setFollowStatus('accepted');
        setProfileStats(prev => ({ ...prev, followersCount: (prev.followersCount || 0) + 1 }));
      }
      try {
        await api.post(`/users/${targetUser.id}/follow`);
      } catch (err) {}
    } else if (followStatus === 'pending') {
      setFollowStatus('none');
      alert('Takip isteği iptal edildi.');
    } else if (followStatus === 'accepted') {
      if (window.confirm(`${targetUser.fullName} adlı kişiyi takipten çıkarmak istediğinize emin misiniz?`)) {
        setFollowStatus('none');
        setProfileStats(prev => ({ ...prev, followersCount: Math.max(0, (prev.followersCount || 1) - 1) }));
      }
    }
  };

  const handleUpdateBio = async (newBio) => {
    try {
      await api.put('/users/profile', { bio: newBio, fullName: user?.fullName });
    } catch (err) {}
    setUser(prev => ({ ...prev, bio: newBio }));
  };

  const handleUpdateProfile = async (changes) => {
    const updatedUser = { ...user, ...changes };
    if (!isDemoMode()) {
      try {
        await api.put('/users/profile', changes);
      } catch (err) {
        alert(err.response?.data?.message || 'Profil bilgisi sunucuya kaydedilemedi.');
        return false;
      }
    }

    if (user?.id) {
      try {
        localStorage.setItem(
          `anipini_profile_${user.id}`,
          JSON.stringify({
            fullName: updatedUser.fullName,
            avatarUrl: updatedUser.avatarUrl || null,
            email: updatedUser.email
          })
        );
      } catch (error) {
        console.warn('Profil değişiklikleri kaydedilemedi:', error);
        alert('Profil değişikliği bu cihazda kaydedilemedi.');
        return;
      }
    }

    setUser(updatedUser);
    return true;
  };

  const handleDeletePin = async (memoryId) => {
    if (!window.confirm('Bu anı silinecektir, emin misiniz? 🌸')) return;
    if (isDemoMode() && user?.id) {
      const removedPin = deleteDemoPinForMemory(user.id, memoryId);
      if (removedPin) {
        setUserPins(prev => prev.filter(memory => String(memory.pin?.id) !== String(removedPin.id)));
      } else {
        setUserPins(prev => prev.filter(memory => String(memory.id) !== String(memoryId)));
      }
      setSelectedPin(null);
      return;
    }

    try {
      await api.delete(`/pins/memories/${memoryId}`);
      setUserPins(prev => prev.filter(memory => String(memory.id) !== String(memoryId)));
    } catch (err) {
      alert(err.response?.data?.message || 'Anı silinemedi.');
      return;
    }
    setSelectedPin(null);
  };

  const displayedPins = activeTab === 'own' ? userPins : repostedPins;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-pastel-bg p-4 sm:p-8 pb-24 md:pb-12 animate-fadeIn">
      {/* Profil Başlığı */}
      <ProfileHeader
        user={user}
        viewedUser={viewedUser}
        pinCount={userPins.length}
        stats={profileStats}
        onUpdateBio={handleUpdateBio}
        onUpdateProfile={handleUpdateProfile}
        onBackToMyProfile={onBackToMyProfile}
        followStatus={followStatus}
        onToggleFollow={handleToggleFollow}
      />

      {/* Kurumsal Hesaplar İçin Özel Retweet/Repost Sekmeleri */}
      {isCorporate && !isMemoriesLocked && (
        <div className="max-w-4xl mx-auto mt-6 flex border-b border-purple-200 bg-white p-1.5 rounded-2xl shadow-xs">
          <button
            onClick={() => setActiveTab('own')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'own' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Mekanımda Paylaşılan Anılar ({userPins.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reposted')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'reposted' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Mekanımın Retweet / Öne Çıkarılanları ({repostedPins.length})</span>
          </button>
        </div>
      )}

      {/* GİZLİ HESAP GİZLİLİK UYARI KUTUSU */}
      {isMemoriesLocked ? (
        <div className="max-w-4xl mx-auto mt-8 p-10 bg-white/90 rounded-3xl border border-pastel-rose/40 text-center space-y-4 shadow-pastel-soft">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl shadow-sm border border-amber-200">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-pastel-dark">Anılar Gizli 🔒</h3>
            <p className="text-xs text-pastel-gray max-w-md mx-auto leading-relaxed">
              Bu hesabın anıları ve pinlenmiş harita konumları sadece onaylı takipçilerine özeldir. 🌸
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleToggleFollow}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 mx-auto ${
                followStatus === 'pending'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark'
              }`}
            >
              {followStatus === 'pending' ? (
                <>
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Takip İsteği Gönderildi ⏳</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Takip İsteği Gönder 👥</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Anı Izgara Arşivi veya Boş Görünüm */
        displayedPins.length > 0 ? (
          <PinGrid
            pins={displayedPins}
            onSelectPin={(pin) => setSelectedPin(pin)}
          />
        ) : (
          <div className="max-w-4xl mx-auto mt-8 p-10 bg-white/80 rounded-3xl border border-pastel-rose/30 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-pastel-rose/30 flex items-center justify-center mx-auto text-pastel-roseHover">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-pastel-dark">
              {isViewingOther
                ? 'Bu kullanıcının henüz paylaşılmış bir anısı bulunmuyor 🌸'
                : activeTab === 'own'
                  ? 'Henüz pinlenmiş bir anınız bulunmuyor 🌸'
                  : 'Henüz mekanınızda öne çıkarılan bir retweet anısı yok 🏢'}
            </h3>
            <p className="text-xs text-pastel-gray max-w-md mx-auto">
              {isViewingOther
                ? 'Kullanıcı yeni bir anı pinlediğinde profilde görüntülenecektir.'
                : isCorporate
                  ? 'Mekanınızda ziyaretçiler anı paylaştığında "Mekanında Paylaş 🔄" butonuna basarak anıları profiline ekleyebilirsin.'
                  : 'Harita ekranına gidip istediğin bir konuma tıklayarak ilk güzel anını pinleyebilirsin ✨'}
            </p>
          </div>
        )
      )}

      {/* Pin Detay Modalı */}
      <PinDetailModal
        pin={selectedPin}
        onClose={() => setSelectedPin(null)}
        onDeleteMemory={handleDeletePin}
      />
    </div>
  );
};

export default ProfilePage;
