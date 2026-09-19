import React, { useState } from 'react';
import { X, Calendar, Share2, Trash2, Heart, MessageCircle, Send, Music, Film, Image as ImageIcon, PlusCircle, Sparkles, Repeat, Building2, Globe, Users, Target, Lock, CornerDownRight, Check, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api, { MOCK_FOLLOWERS } from '../../services/api';

const PinDetailModal = ({ pin, onClose, onDeleteMemory, onAddMemoryToPin }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'add'

  // Yeni Anı Form State'leri
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMediaType, setNewMediaType] = useState('image');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [fileNameInput, setFileNameInput] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedFollowerIds, setSelectedFollowerIds] = useState([]);
  
  // Yorum State'leri (MemoryId -> comment text)
  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});
  
  // Alt Yorum (Yanıt) State'leri
  const [replyingCommentId, setReplyingCommentId] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});

  // Local memories state
  const [localMemories, setLocalMemories] = useState(pin?.memories || []);

  const isCorporate = user?.userType === 'corporate';

  React.useEffect(() => {
    setLocalMemories(pin?.memories || []);
    if (pin?.memories) {
      const initialOpenState = {};
      pin.memories.forEach(m => {
        initialOpenState[m.id] = true;
      });
      setOpenComments(initialOpenState);
    }
  }, [pin]);

  if (!pin) return null;

  // Dosya Yükleme İşleyicisi (Galeri / Cihaz Dosyaları Seçimi)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileNameInput(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrlInput(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Anı Beğeni Değiştirme (Memory Like Toggle)
  const handleToggleLike = async (memoryId) => {
    setLocalMemories(prev => prev.map(m => {
      if (m.id === memoryId) {
        const isLiked = m.isLikedByMe;
        return {
          ...m,
          isLikedByMe: !isLiked,
          likeCount: isLiked ? (m.likeCount > 0 ? m.likeCount - 1 : 0) : m.likeCount + 1
        };
      }
      return m;
    }));

    try {
      await api.post(`/pins/memories/${memoryId}/like`);
    } catch (err) {}
  };

  // Kurumsal Retweet / Repost Değiştirme (Corporate Repost Toggle)
  const handleToggleRepost = async (memoryId) => {
    setLocalMemories(prev => prev.map(m => {
      if (m.id === memoryId) {
        const isReposted = m.isRepostedByMe;
        return {
          ...m,
          isRepostedByMe: !isReposted,
          repostCount: isReposted ? (m.repostCount > 0 ? m.repostCount - 1 : 0) : (m.repostCount || 0) + 1
        };
      }
      return m;
    }));

    try {
      await api.post(`/pins/memories/${memoryId}/repost`);
    } catch (err) {}
  };

  // Ana Yorum Gönderme
  const handleAddComment = async (memoryId) => {
    const text = commentInputs[memoryId];
    if (!text || !text.trim()) return;

    const newCommentObj = {
      id: Date.now(),
      commentText: text.trim(),
      likeCount: 0,
      isLikedByMe: false,
      replies: [],
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || 1,
        fullName: user?.fullName || 'Anonim Gezgin',
        avatarUrl: user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Me'
      }
    };

    setLocalMemories(prev => prev.map(m => {
      if (m.id === memoryId) {
        return { ...m, comments: [...(m.comments || []), newCommentObj] };
      }
      return m;
    }));

    setCommentInputs(prev => ({ ...prev, [memoryId]: '' }));

    try {
      await api.post(`/pins/memories/${memoryId}/comments`, { commentText: text.trim() });
    } catch (err) {}
  };

  // Yorum Beğeni Değiştirme (Comment Like Toggle)
  const handleToggleCommentLike = async (memoryId, commentId) => {
    setLocalMemories(prev => prev.map(m => {
      if (m.id === memoryId) {
        const updatedComments = (m.comments || []).map(c => {
          if (c.id === commentId) {
            const isLiked = c.isLikedByMe;
            return {
              ...c,
              isLikedByMe: !isLiked,
              likeCount: isLiked ? (c.likeCount > 0 ? c.likeCount - 1 : 0) : (c.likeCount || 0) + 1
            };
          }
          return c;
        });
        return { ...m, comments: updatedComments };
      }
      return m;
    }));

    try {
      await api.post(`/pins/memories/comments/${commentId}/like`);
    } catch (err) {}
  };

  // Yorum Yanıtlama (Alt Yorum Gönderme)
  const handleAddReply = async (memoryId, parentCommentId) => {
    const text = replyInputs[parentCommentId];
    if (!text || !text.trim()) return;

    const newReplyObj = {
      id: Date.now(),
      commentText: text.trim(),
      parentCommentId,
      likeCount: 0,
      isLikedByMe: false,
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || 1,
        fullName: user?.fullName || 'Anonim Gezgin',
        avatarUrl: user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Me'
      }
    };

    setLocalMemories(prev => prev.map(m => {
      if (m.id === memoryId) {
        const updatedComments = (m.comments || []).map(c => {
          if (c.id === parentCommentId) {
            return { ...c, replies: [...(c.replies || []), newReplyObj] };
          }
          return c;
        });
        return { ...m, comments: updatedComments };
      }
      return m;
    }));

    setReplyInputs(prev => ({ ...prev, [parentCommentId]: '' }));
    setReplyingCommentId(null);

    try {
      await api.post(`/pins/memories/${memoryId}/comments`, { commentText: text.trim(), parentCommentId });
    } catch (err) {}
  };

  // Takipçi Seçici Toggle
  const toggleFollowerSelect = (followerId) => {
    if (selectedFollowerIds.includes(followerId)) {
      setSelectedFollowerIds(selectedFollowerIds.filter(id => id !== followerId));
    } else {
      setSelectedFollowerIds([...selectedFollowerIds, followerId]);
    }
  };

  // Yeni Anı Gönderme
  const handleSubmitNewMemory = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Lütfen anınız için bir başlık yazın 🌸');
      return;
    }

    if (visibility === 'selected_followers' && selectedFollowerIds.length === 0) {
      alert('Lütfen anınızı paylaşmak istediğiniz takipçilerinizi seçin 🎯');
      return;
    }

    const createdMem = {
      id: Date.now(),
      title: newTitle,
      subtitle: newSubtitle,
      contentText: newContent,
      mediaType: newMediaType,
      mediaUrl: mediaUrlInput,
      visibility,
      allowedUserIds: visibility === 'selected_followers' ? selectedFollowerIds : null,
      memoryDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      user: {
        id: user?.id || 1,
        fullName: user?.fullName || 'Anonim Gezgin',
        avatarUrl: user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Me'
      },
      likeCount: 0,
      isLikedByMe: false,
      repostCount: 0,
      isRepostedByMe: false,
      comments: []
    };

    onAddMemoryToPin(pin.id, createdMem);

    // Formu temizle ve Akışa geç
    setNewTitle('');
    setNewSubtitle('');
    setNewContent('');
    setMediaUrlInput('');
    setFileNameInput('');
    setVisibility('public');
    setSelectedFollowerIds([]);
    setActiveTab('feed');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: pin.spotName, text: pin.spotSubtitle, url: window.location.href }).catch(() => {});
    } else {
      alert(`"${pin.spotName}" konumu kopyalandı! 🌸`);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-pastel-dark/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto border border-pastel-rose/40">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-pastel-rose/40 via-pastel-peach/30 to-pastel-sky/40 border-b border-pastel-rose/30 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span 
                className="px-3 py-0.5 rounded-full text-[11px] font-bold text-pastel-dark shadow-xs"
                style={{ backgroundColor: pin.category?.colorHex || '#F3D5D8' }}
              >
                {pin.category?.name || 'Konum Pini'}
              </span>
              <span className="text-xs text-pastel-gray font-medium">📍 {pin.latitude.toFixed(3)}, {pin.longitude.toFixed(3)}</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-pastel-dark leading-tight mt-1">{pin.spotName}</h3>
            {pin.spotSubtitle && <p className="text-xs text-pastel-charcoal font-medium mt-0.5">{pin.spotSubtitle}</p>}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-pastel-dark shadow-sm transition-transform active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sekme Butonları (Tüm Anılar vs Anı Ekle) */}
        <div className="flex border-b border-pastel-rose/20 bg-pastel-bg p-1.5">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'feed' ? 'bg-white text-pastel-dark shadow-xs' : 'text-pastel-gray hover:text-pastel-dark'
            }`}
          >
            <span>🌸 Paylaşılan Anılar ({localMemories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
              activeTab === 'add' ? 'bg-pastel-rose text-pastel-dark shadow-xs' : 'text-pastel-gray hover:text-pastel-dark'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Bu Pine Anı Bırak ✨</span>
          </button>
        </div>

        {/* İÇERİK ALANI */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 max-h-[70vh]">
          
          {/* SEKME 1: TÜM ANILAR AKIŞI */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {localMemories.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-sm text-pastel-gray font-medium">Henüz bu konuma anı eklenmemiş. İlk anıyı sen bırak! 🌸</p>
                  <button
                    onClick={() => setActiveTab('add')}
                    className="px-5 py-2.5 bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark font-bold text-xs rounded-full shadow-xs transition-transform active:scale-95"
                  >
                    Anı Bırak ✨
                  </button>
                </div>
              ) : (
                localMemories.map((mem) => {
                  const isMyMemory = user && mem.user && user.id === mem.user.id;
                  const showCommentBox = openComments[mem.id] !== false;

                  return (
                    <div key={mem.id} className="bg-pastel-bg/80 rounded-3xl p-4 sm:p-5 border border-pastel-rose/30 shadow-xs space-y-3">
                      
                      {/* Kullanıcı Bilgisi, Rozeti & Sil Butonu */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={mem.user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=User'}
                            alt={mem.user?.fullName}
                            className="w-8 h-8 rounded-full bg-white p-0.5 border border-pastel-rose/40"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h5 className="font-bold text-xs text-pastel-dark">{mem.user?.fullName || 'Anonim Gezgin'}</h5>
                              {mem.user?.userType === 'corporate' && (
                                <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[9px] font-bold">
                                  <Building2 className="w-3 h-3 text-purple-600" />
                                  <span>Mekan</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-pastel-gray">
                              {new Date(mem.memoryDate || mem.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>

                        {/* Kendi Anını Silme */}
                        {isMyMemory && (
                          <button
                            onClick={() => onDeleteMemory(mem.id)}
                            title="Bu anımı sil"
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-500 text-[11px] font-medium transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Anımı Sil</span>
                          </button>
                        )}
                      </div>

                      {/* Anı Başlığı ve Alt Başlığı */}
                      <div className="space-y-0.5">
                        <h4 className="font-serif font-bold text-lg text-pastel-dark leading-snug">{mem.title}</h4>
                        {mem.subtitle && <p className="text-xs text-pastel-roseHover font-semibold">{mem.subtitle}</p>}
                        {mem.contentText && <p className="text-xs text-pastel-charcoal leading-relaxed pt-1">{mem.contentText}</p>}
                      </div>

                      {/* MEDYA ALANI (Görsel / Video / Ses Kaydı) */}
                      {mem.mediaUrl && (
                        <div className="rounded-2xl overflow-hidden bg-white border border-pastel-rose/20 shadow-xs">
                          {mem.mediaType === 'image' && (
                            <img src={mem.mediaUrl} alt={mem.title} className="w-full h-56 object-cover" />
                          )}
                          {mem.mediaType === 'video' && (
                            <video src={mem.mediaUrl} controls className="w-full max-h-64 bg-black" />
                          )}
                          {mem.mediaType === 'audio' && (
                            <div className="p-4 bg-pastel-rose/20 flex flex-col space-y-2">
                              <div className="flex items-center space-x-2 text-xs font-bold text-pastel-dark">
                                <Music className="w-4 h-4 text-pastel-roseHover animate-bounce" />
                                <span>🎙️ Sesli Anı Kaydı</span>
                              </div>
                              <audio src={mem.mediaUrl} controls className="w-full rounded-xl" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* SOSYAL ETKİLEŞİM BARİ (BEĞENİ & YORUM & KURUMSAL RETWEET/REPOST) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-pastel-rose/20 text-xs">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          {/* Beğen Butonu */}
                          <button
                            onClick={() => handleToggleLike(mem.id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all active:scale-90 shadow-xs ${
                              mem.isLikedByMe
                                ? 'bg-pastel-rose text-pastel-dark font-bold'
                                : 'bg-white text-pastel-gray hover:text-pastel-dark'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${mem.isLikedByMe ? 'fill-red-500 text-red-500' : ''}`} />
                            <span>{mem.likeCount || 0} Beğeni</span>
                          </button>

                          {/* Yorumlar Aç/Kapa Butonu */}
                          <button
                            onClick={() => setOpenComments(prev => ({ ...prev, [mem.id]: !prev[mem.id] }))}
                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white text-pastel-gray hover:text-pastel-dark shadow-xs transition-all"
                          >
                            <MessageCircle className="w-4 h-4 text-pastel-skyHover" />
                            <span>{mem.comments ? mem.comments.length : 0} Yorum</span>
                          </button>
                        </div>

                        {/* KURUMSAL HESAPLAR İÇİN MEKAN RETWEET / REPOST BUTONU */}
                        {isCorporate && (
                          <button
                            onClick={() => handleToggleRepost(mem.id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                              mem.isRepostedByMe
                                ? 'bg-purple-600 text-white shadow-purple-200'
                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                            }`}
                          >
                            <Repeat className="w-3.5 h-3.5" />
                            <span>{mem.isRepostedByMe ? 'Mekanında Paylaşıldı 🔄' : 'Mekanında Paylaş (Retweet)'}</span>
                          </button>
                        )}
                      </div>

                      {/* YORUMLAR ALANI */}
                      {showCommentBox && (
                        <div className="pt-2 space-y-3 border-t border-pastel-rose/20">
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {mem.comments && mem.comments.length > 0 ? (
                              mem.comments.map(c => (
                                <div key={c.id} className="space-y-1.5">
                                  {/* Ana Yorum Kartı */}
                                  <div className="bg-white p-3 rounded-2xl border border-pastel-rose/20 text-xs space-y-1 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <img src={c.user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=User'} alt="user" className="w-5 h-5 rounded-full" />
                                        <span className="font-bold text-pastel-dark">{c.user?.fullName}</span>
                                      </div>

                                      {/* Yorum Beğeni Kalbi */}
                                      <button
                                        onClick={() => handleToggleCommentLike(mem.id, c.id)}
                                        className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] ${
                                          c.isLikedByMe ? 'bg-red-50 text-red-600 font-bold' : 'text-pastel-gray hover:text-pastel-dark'
                                        }`}
                                      >
                                        <Heart className={`w-3 h-3 ${c.isLikedByMe ? 'fill-red-500 text-red-500' : ''}`} />
                                        <span>{c.likeCount || 0}</span>
                                      </button>
                                    </div>

                                    <p className="text-pastel-charcoal pl-7">{c.commentText}</p>

                                    {/* Yorum Alt Butonları (Yanıtla) */}
                                    <div className="pl-7 pt-1 flex items-center space-x-3 text-[10px] text-pastel-gray">
                                      <button
                                        onClick={() => setReplyingCommentId(replyingCommentId === c.id ? null : c.id)}
                                        className="font-bold text-pastel-skyHover hover:underline flex items-center space-x-1"
                                      >
                                        <CornerDownRight className="w-3 h-3" />
                                        <span>Yanıtla</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* İÇ İÇE ALT YORUMLAR (REPLIES) */}
                                  {c.replies && c.replies.length > 0 && (
                                    <div className="pl-6 space-y-1.5 border-l-2 border-pastel-rose/30 ml-3">
                                      {c.replies.map(r => (
                                        <div key={r.id} className="bg-pastel-bg/90 p-2.5 rounded-2xl border border-pastel-rose/20 text-[11px] space-y-0.5">
                                          <div className="flex items-center space-x-1.5">
                                            <img src={r.user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Sub'} alt="user" className="w-4 h-4 rounded-full" />
                                            <span className="font-bold text-pastel-dark">{r.user?.fullName}</span>
                                          </div>
                                          <p className="text-pastel-charcoal pl-5.5">{r.commentText}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* ALT YORUM YAZMA KUTUSU */}
                                  {replyingCommentId === c.id && (
                                    <div className="pl-6 flex items-center space-x-2 pt-1">
                                      <input
                                        type="text"
                                        placeholder={`${c.user?.fullName} kişisine yanıt ver...`}
                                        value={replyInputs[c.id] || ''}
                                        onChange={(e) => setReplyInputs({ ...replyInputs, [c.id]: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddReply(mem.id, c.id)}
                                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-pastel-sky/50 text-xs focus:outline-none focus:ring-1 focus:ring-pastel-sky"
                                      />
                                      <button
                                        onClick={() => handleAddReply(mem.id, c.id)}
                                        className="px-2.5 py-1.5 rounded-xl bg-pastel-sky text-pastel-dark font-bold hover:bg-pastel-skyHover shadow-xs text-xs"
                                      >
                                        Yanıtla
                                      </button>
                                    </div>
                                  )}

                                </div>
                              ))
                            ) : (
                              <p className="text-[11px] text-pastel-gray italic pl-1">Henüz yorum yok. İlk yorumu sen yaz!</p>
                            )}
                          </div>

                          {/* Ana Yorum Ekleme Girdisi */}
                          <div className="flex items-center space-x-2 pt-1">
                            <input
                              type="text"
                              placeholder="Harika bir anı! Yorumunu yaz..."
                              value={commentInputs[mem.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [mem.id]: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(mem.id)}
                              className="flex-1 px-3.5 py-2 rounded-2xl bg-white border border-pastel-rose/40 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose"
                            />
                            <button
                              onClick={() => handleAddComment(mem.id)}
                              className="px-3 py-2 rounded-2xl bg-pastel-rose text-pastel-dark font-bold hover:bg-pastel-roseHover shadow-xs text-xs flex items-center space-x-1"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Gönder</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* SEKME 2: BU PİNE YENİ ANİ EKLE */}
          {activeTab === 'add' && (
            <form onSubmit={handleSubmitNewMemory} className="space-y-4">
              <div className="p-3 bg-pastel-rose/20 rounded-2xl border border-pastel-rose/30 flex items-center space-x-2 text-xs text-pastel-dark font-medium">
                <Sparkles className="w-4 h-4 text-pastel-roseHover" />
                <span>Bu konuma fotoğraf, video veya sesli anını ekliyorsun.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-dark mb-1">Anı Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Gün Batımında Çay Keyfi 🌇"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-dark mb-1">Alt Başlık / Özet</label>
                <input
                  type="text"
                  placeholder="Örn: Boğazın serin rüzgarı eşliğinde..."
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-pastel-dark mb-1">Detaylı Hikaye</label>
                <textarea
                  rows={3}
                  placeholder="O an hissettiklerini anlat..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-pastel-rose resize-none"
                />
              </div>

              {/* ANİ GİZLİLİK SEÇENEKLERİ */}
              <div className="pt-2 border-t border-pastel-rose/20 space-y-2">
                <label className="block text-xs font-semibold text-pastel-dark">Anı Görme Yetkisi (Gizlilik) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={`p-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                      visibility === 'public' ? 'bg-emerald-100 border-emerald-600 text-emerald-900 shadow-xs' : 'bg-pastel-bg border-transparent text-pastel-gray'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Herkese Açık 🌐</span>
                  </button>

                  {!isCorporate && (
                    <button
                      type="button"
                      onClick={() => setVisibility('followers')}
                      className={`p-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                        visibility === 'followers' ? 'bg-sky-100 border-sky-600 text-sky-900 shadow-xs' : 'bg-pastel-bg border-transparent text-pastel-gray'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-sky-600" />
                      <span>Tüm Takipçilerim 👥</span>
                    </button>
                  )}

                  {!isCorporate && (
                    <button
                      type="button"
                      onClick={() => setVisibility('selected_followers')}
                      className={`p-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                        visibility === 'selected_followers' ? 'bg-amber-100 border-amber-600 text-amber-900 shadow-xs' : 'bg-pastel-bg border-transparent text-pastel-gray'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                      <span>Seçtiğim Takipçilere 🎯</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`p-2 rounded-2xl text-xs font-bold flex items-center space-x-1.5 border transition-all ${
                      visibility === 'private' ? 'bg-rose-100 border-rose-600 text-rose-900 shadow-xs' : 'bg-pastel-bg border-transparent text-pastel-gray'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-rose-600" />
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
                    onClick={() => setNewMediaType('image')}
                    className={`py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 border ${
                      newMediaType === 'image' ? 'bg-pastel-rose border-pastel-dark text-pastel-dark' : 'bg-pastel-bg border-transparent text-pastel-gray'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Fotoğraf</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMediaType('video')}
                    className={`py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 border ${
                      newMediaType === 'video' ? 'bg-pastel-sky border-pastel-dark text-pastel-dark' : 'bg-pastel-bg border-transparent text-pastel-gray'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Video</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMediaType('audio')}
                    className={`py-2 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5 border ${
                      newMediaType === 'audio' ? 'bg-pastel-mint border-pastel-dark text-pastel-dark' : 'bg-pastel-bg border-transparent text-pastel-gray'
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
                  {newMediaType === 'image' && '🖼️ Galeriden / Cihazdan Fotoğraf Seçin'}
                  {newMediaType === 'video' && '🎥 Galeriden / Cihazdan Video Seçin'}
                  {newMediaType === 'audio' && '🎵 Cihazdan Ses Kaydı Seçin'}
                </label>

                <div className="flex items-center space-x-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center space-x-2 py-3 px-4 bg-white border border-dashed border-pastel-roseHover hover:bg-pastel-rose/20 rounded-2xl text-xs font-bold text-pastel-dark transition-colors shadow-xs">
                    <Upload className="w-4 h-4 text-pastel-roseHover" />
                    <span className="truncate">{fileNameInput ? `Seçilen: ${fileNameInput}` : 'Dosya Seç (Galeri veya Cihaz)'}</span>
                    <input
                      type="file"
                      accept={newMediaType === 'image' ? 'image/*' : newMediaType === 'video' ? 'video/*' : 'audio/*'}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {mediaUrlInput && (
                    <button
                      type="button"
                      onClick={() => { setMediaUrlInput(''); setFileNameInput(''); }}
                      className="p-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold flex-shrink-0"
                      title="Dosyayı Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Önizleme Alanı */}
                {mediaUrlInput && (
                  <div className="mt-2 rounded-2xl overflow-hidden border border-pastel-rose/30 max-h-48 bg-black flex items-center justify-center">
                    {newMediaType === 'image' && <img src={mediaUrlInput} alt="Önizleme" className="max-h-48 object-cover w-full" />}
                    {newMediaType === 'video' && <video src={mediaUrlInput} controls className="max-h-48 w-full" />}
                    {newMediaType === 'audio' && <audio src={mediaUrlInput} controls className="w-full p-2" />}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-pastel-rose hover:bg-pastel-roseHover text-pastel-dark rounded-2xl font-bold text-xs shadow-pastel-soft transition-transform active:scale-98"
              >
                Anıyı Bu Pine Ekle 🌸
              </button>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-pastel-bg border-t border-pastel-rose/20 flex items-center justify-between">
          <button
            onClick={handleShare}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white text-pastel-dark text-xs font-semibold shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-pastel-skyHover" />
            <span>Konumu Paylaş</span>
          </button>

          <span className="text-[11px] text-pastel-gray font-medium">AnıPini Sosyal Harita</span>
        </div>

      </div>
    </div>
  );
};

export default PinDetailModal;
