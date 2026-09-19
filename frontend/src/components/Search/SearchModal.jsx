import React, { useState, useEffect } from 'react';
import { X, Search, User, Building2, UserPlus, UserCheck, Users, Sparkles, ExternalLink } from 'lucide-react';
import api, { MOCK_SEARCH_USERS } from '../../services/api';

const SearchModal = ({ isOpen, onClose, onViewProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'individual', 'corporate'
  const [searchResults, setSearchResults] = useState(MOCK_SEARCH_USERS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults(MOCK_SEARCH_USERS);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get('/users/search', { params: { query: searchQuery } });
        if (res.data.success && res.data.data.length > 0) {
          setSearchResults(res.data.data);
        } else {
          // Mock filtering fallback
          const filtered = MOCK_SEARCH_USERS.filter(u =>
            u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          setSearchResults(filtered);
        }
      } catch (err) {
        // Fallback filter
        const filtered = MOCK_SEARCH_USERS.filter(u =>
          u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  const handleToggleFollow = (e, targetId) => {
    e.stopPropagation();
    setSearchResults(prev => prev.map(u => {
      if (u.id === targetId) {
        const isFollowing = u.isFollowing;
        return {
          ...u,
          isFollowing: !isFollowing,
          followerCount: isFollowing ? (u.followerCount > 0 ? u.followerCount - 1 : 0) : u.followerCount + 1
        };
      }
      return u;
    }));

    try {
      api.post(`/users/${targetId}/follow`);
    } catch (err) {}
  };

  const handleCardClick = (userItem) => {
    if (onViewProfile) {
      onViewProfile(userItem);
      onClose();
    }
  };

  const filteredResults = searchResults.filter(u => {
    if (activeFilter === 'individual') return u.userType === 'individual';
    if (activeFilter === 'corporate') return u.userType === 'corporate';
    return true;
  });

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-pastel-dark/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-pastel-rose/40">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-pastel-rose/40 via-pastel-peach/30 to-pastel-sky/40 border-b border-pastel-rose/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-pastel-dark shadow-sm">
              <Search className="w-5 h-5 text-pastel-roseHover" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-pastel-dark">Kişi & Mekan Ara</h3>
              <p className="text-xs text-pastel-gray font-medium">Topluluktaki hesapları ve mekanları keşfet, profillerini gör & takip et</p>
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
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Arama Inputu */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-pastel-gray" />
            <input
              type="text"
              autoFocus
              placeholder="Kullanıcı adı, e-posta veya mekan ismi yaz..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs text-pastel-dark focus:outline-none focus:ring-2 focus:ring-pastel-rose"
            />
          </div>

          {/* Filtre Tabları */}
          <div className="flex bg-pastel-bg p-1 rounded-2xl border border-pastel-rose/20">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFilter === 'all' ? 'bg-white text-pastel-dark shadow-xs' : 'text-pastel-gray hover:text-pastel-dark'
              }`}
            >
              Tümü ({searchResults.length})
            </button>
            <button
              onClick={() => setActiveFilter('individual')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                activeFilter === 'individual' ? 'bg-white text-pastel-dark shadow-xs' : 'text-pastel-gray hover:text-pastel-dark'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Bireysel</span>
            </button>
            <button
              onClick={() => setActiveFilter('corporate')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
                activeFilter === 'corporate' ? 'bg-purple-600 text-white shadow-xs' : 'text-pastel-gray hover:text-pastel-dark'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Mekanlar</span>
            </button>
          </div>

          {/* Arama Sonuçları Akışı */}
          <div className="space-y-3 pt-1">
            {loading ? (
              <div className="text-center py-8 text-xs text-pastel-gray font-medium">Aramanız yapılıyor... 🌸</div>
            ) : filteredResults.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Sparkles className="w-6 h-6 text-pastel-roseHover mx-auto" />
                <p className="text-xs text-pastel-gray font-medium">Aramanıza uygun kullanıcı veya mekan bulunamadı.</p>
              </div>
            ) : (
              filteredResults.map((u) => {
                const isCorporate = u.userType === 'corporate';
                return (
                  <div
                    key={u.id}
                    onClick={() => handleCardClick(u)}
                    className="p-3.5 rounded-2xl bg-pastel-bg/80 hover:bg-white border border-pastel-rose/20 flex items-center justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                      <div className="relative flex-shrink-0">
                        <img
                          src={u.avatarUrl || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=User'}
                          alt={u.fullName}
                          className={`w-11 h-11 rounded-full bg-white p-0.5 border ${
                            isCorporate ? 'border-purple-400 ring-2 ring-purple-200' : 'border-pastel-rose/30'
                          }`}
                        />
                        {isCorporate && (
                          <span className="absolute bottom-0 right-0 bg-purple-600 text-white text-[9px] p-0.5 rounded-full shadow-xs">
                            <Building2 className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-serif font-bold text-xs text-pastel-dark group-hover:text-purple-700 transition-colors truncate">
                            {u.fullName}
                          </h4>
                          {isCorporate ? (
                            <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[9px] font-bold flex-shrink-0">
                              Mekan 🏢
                            </span>
                          ) : (
                            <span className="text-[10px] text-pastel-gray flex items-center space-x-0.5">
                              <ExternalLink className="w-3 h-3 text-pastel-gray group-hover:text-pastel-dark" />
                            </span>
                          )}
                        </div>
                        {u.bio && <p className="text-[11px] text-pastel-charcoal line-clamp-1 italic">"{u.bio}"</p>}
                        
                        {/* MEKANLARDA SADECE TAKİPÇİ SAYISI GÖSTERİLİR */}
                        {isCorporate && (
                          <div className="flex items-center space-x-1 text-[10px] font-bold text-purple-700 pt-0.5">
                            <Users className="w-3 h-3 text-purple-500" />
                            <span>{(u.followerCount || 0).toLocaleString('tr-TR')} Takipçi</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Takip Et / Takipten Çık Butonu */}
                    <button
                      onClick={(e) => handleToggleFollow(e, u.id)}
                      className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-xs flex-shrink-0 ${
                        u.isFollowing
                          ? 'bg-white text-pastel-dark border border-pastel-rose/30 hover:bg-red-50 hover:text-red-600'
                          : isCorporate
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark'
                      }`}
                    >
                      {u.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Takip Ediliyor</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Takip Et</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default SearchModal;
