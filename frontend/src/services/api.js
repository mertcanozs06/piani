import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('anipini_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const MOCK_CATEGORIES = [
  { id: 1, name: 'Gezi & Seyahat', icon: 'compass', colorHex: '#F3D5D8' },
  { id: 2, name: 'Yeme & İçme', icon: 'utensils', colorHex: '#E2ECE9' },
  { id: 3, name: 'Kültür & Sanat', icon: 'palette', colorHex: '#DFE7F2' },
  { id: 4, name: 'Özel Anı', icon: 'heart', colorHex: '#FDE8E0' },
  { id: 5, name: 'Doğa & Kamp', icon: 'trees', colorHex: '#E2EFCB' }
];

export const MOCK_FOLLOWERS = [
  { id: 10, fullName: 'Mert Aksu', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Mert' },
  { id: 11, fullName: 'Ege Kaan', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ege' },
  { id: 12, fullName: 'Selin Can', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Selin' },
  { id: 13, fullName: 'Zeynep Kaya', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zeynep' },
  { id: 14, fullName: 'Barış Demir', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Baris' }
];

// Açık Artırma ile Kazanmış İlk 5 Sponsorlu Mekan Mock Verisi
export const MOCK_SPONSORED_PINS = [
  {
    id: 901,
    pinId: 2,
    spotName: 'Galata Kahvecisi ☕',
    spotSubtitle: 'Galata Kulesi manzaralı nostaljik kahve',
    latitude: 41.0256,
    longitude: 28.9742,
    bidAmount: 650,
    currency: 'USD',
    bidScoreTL: 22750,
    category: { id: 2, name: 'Yeme & İçme', colorHex: '#E2ECE9' }
  },
  {
    id: 902,
    pinId: 1,
    spotName: 'Kız Kulesi Seyir Terası 🌅',
    spotSubtitle: 'Boğazın en romantik mola noktası',
    latitude: 41.0211,
    longitude: 29.0041,
    bidAmount: 500,
    currency: 'USD',
    bidScoreTL: 17500,
    category: { id: 4, name: 'Özel Anı', colorHex: '#FDE8E0' }
  },
  {
    id: 903,
    pinId: 3,
    spotName: 'Belgrad Ormanı Doğa Kafe 🌿',
    spotSubtitle: 'Orman içinde taze çay ve doğa havası',
    latitude: 41.1822,
    longitude: 28.9814,
    bidAmount: 400,
    currency: 'EUR',
    bidScoreTL: 15200,
    category: { id: 5, name: 'Doğa & Kamp', colorHex: '#E2EFCB' }
  },
  {
    id: 904,
    pinId: null,
    spotName: 'Moda Sahil Çay Bahçesi ☕',
    spotSubtitle: 'Kullanıcıların gözde çay mekanı',
    latitude: 40.9833,
    longitude: 29.0274,
    bidAmount: 12500,
    currency: 'TL',
    bidScoreTL: 12500,
    category: { id: 2, name: 'Yeme & İçme', colorHex: '#E2ECE9' }
  },
  {
    id: 905,
    pinId: null,
    spotName: 'Bebek Sahil Waffle 🍓',
    spotSubtitle: 'İstanbul\'un en ünlü tatlı durağı',
    latitude: 41.0772,
    longitude: 29.0435,
    bidAmount: 300,
    currency: 'USD',
    bidScoreTL: 10500,
    category: { id: 2, name: 'Yeme & İçme', colorHex: '#E2ECE9' }
  }
];

// Arama için Bireysel Kişi ve Kurumsal Mekan Mock Sonuçları
export const MOCK_SEARCH_USERS = [
  {
    id: 10,
    fullName: 'Mert Aksu',
    email: 'mert@anipini.com',
    userType: 'individual',
    bio: 'İstanbul sokaklarını keşfediyorum 📸',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Mert',
    followerCount: 240,
    isFollowing: false
  },
  {
    id: 11,
    fullName: 'Ege Kaan',
    email: 'ege@anipini.com',
    userType: 'individual',
    bio: 'Doğa yürüyüşleri ve kamp tutkunu 🌲',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ege',
    followerCount: 185,
    isFollowing: true
  },
  {
    id: 99,
    fullName: 'Galata Kahvecisi ☕',
    email: 'info@galatakahvecisi.com',
    userType: 'corporate',
    bio: '1984\'ten beri Galata kulesi manzaralı taze Türk kahvesi ☕',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GalataCoffee',
    followerCount: 1280,
    isFollowing: true
  },
  {
    id: 98,
    fullName: 'Kız Kulesi Teras Kafe 🌅',
    email: 'contact@kizkulesicafe.com',
    userType: 'corporate',
    bio: 'Üsküdar sahilinde martı sesleri eşliğinde çay keyfi 🫖',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=KizKulesiCafe',
    followerCount: 3420,
    isFollowing: false
  },
  {
    id: 97,
    fullName: 'Belgrad Ormanı Doğa Kulübü 🌿',
    email: 'info@belgradclub.com',
    userType: 'corporate',
    bio: 'Orman parkurları ve organik kahvaltı mekanımız 🍃',
    avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BelgradClub',
    followerCount: 890,
    isFollowing: false
  }
];

// Çoklu Anılı Harita Pinleri ve Detaylı Medya (Foto, Video, Ses) + Beğeni & Yorum & Repost Mock Verileri
export const MOCK_PINS = [
  {
    id: 1,
    spotName: 'Kız Kulesi & Üsküdar Sahili 🌅',
    spotSubtitle: 'İstanbul\'un en romantik gün batımı noktası',
    latitude: 41.0211,
    longitude: 29.0041,
    memoryCount: 3,
    category: { id: 4, name: 'Özel Anı', icon: 'heart', colorHex: '#FDE8E0' },
    memories: [
      {
        id: 101,
        title: 'Akşamüstü Çay Molası ☕',
        subtitle: 'Kız Kulesi karşısında simit çay keyfi',
        contentText: 'Boğazın serin rüzgarında martılara simit ata ata çayımızı yudumladık. Unutulmaz bir akşamdı.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80',
        memoryDate: '2025-08-14',
        visibility: 'public',
        createdAt: '2025-08-14T18:30:00Z',
        user: { id: 1, fullName: 'Damla Yılmaz', userType: 'individual', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Damla' },
        likeCount: 12,
        isLikedByMe: true,
        repostCount: 1,
        isRepostedByMe: false,
        comments: [
          {
            id: 1,
            commentText: 'Harika bir kare olmuş, bende geçen hafta oradaydım! 🌸',
            user: { id: 10, fullName: 'Mert Aksu', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Mert' },
            likeCount: 3,
            isLikedByMe: true,
            createdAt: '2025-08-14T19:00:00Z',
            replies: [
              {
                id: 11,
                commentText: 'Teşekkürler Mert! Kesinlikle tavsiye ederim. ✨',
                user: { id: 1, fullName: 'Damla Yılmaz', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Damla' },
                likeCount: 1,
                isLikedByMe: false,
                createdAt: '2025-08-14T19:30:00Z'
              }
            ]
          }
        ]
      },
      {
        id: 102,
        title: 'Dalga Sesleri & Akşam Sisi 🌊',
        subtitle: 'Sahil yürüyüşü ses kaydı',
        contentText: 'Gece vakti Üsküdar sahilinde yürürken kaydettiğim deniz ve martı sesleri.',
        mediaType: 'audio',
        mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        memoryDate: '2025-09-01',
        visibility: 'followers',
        createdAt: '2025-09-01T21:10:00Z',
        user: { id: 2, fullName: 'Ege Kaan', userType: 'individual', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ege' },
        likeCount: 8,
        isLikedByMe: false,
        repostCount: 0,
        isRepostedByMe: false,
        comments: [
          { id: 2, commentText: 'Ses kaydı çok huzur verici ✨', user: { id: 12, fullName: 'Selin Can', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Selin' }, likeCount: 2, isLikedByMe: false, createdAt: '2025-09-01T22:00:00Z' }
        ]
      },
      {
        id: 103,
        title: 'Kız Kulesi Hızlandırılmış Gün Batımı 📹',
        subtitle: 'Zaman atlamalı kısa video',
        contentText: 'Güneşin batışını 15 dakikalık time-lapse ile kaydettim.',
        mediaType: 'video',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-over-the-sea-41225-large.mp4',
        memoryDate: '2025-09-10',
        visibility: 'public',
        createdAt: '2025-09-10T19:45:00Z',
        user: { id: 3, fullName: 'Zeynep Kaya', userType: 'individual', avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Zeynep' },
        likeCount: 24,
        isLikedByMe: true,
        repostCount: 2,
        isRepostedByMe: true,
        comments: []
      }
    ]
  },
  {
    id: 2,
    isVenue: true,
    spotName: 'Galata Kulesi & Tarihi Meydan 🏰',
    spotSubtitle: 'Dar sokaklar ve buram buram kahve kokusu',
    latitude: 41.0256,
    longitude: 28.9742,
    memoryCount: 2,
    category: { id: 2, name: 'Yeme & İçme', icon: 'utensils', colorHex: '#E2ECE9' },
    memories: [
      {
        id: 201,
        title: 'Nostaljik Kahveye Ara ☕',
        subtitle: 'Galata kulesine bakarak Türk kahvesi',
        contentText: 'Eski taş binadaki şirin kafede dostlarla unutulmaz sohbet.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80',
        memoryDate: '2025-09-02',
        visibility: 'public',
        createdAt: '2025-09-02T14:15:00Z',
        user: { id: 99, fullName: 'Galata Kahvecisi ☕', userType: 'corporate', avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=GalataCoffee' },
        likeCount: 15,
        isLikedByMe: false,
        repostCount: 0,
        isRepostedByMe: false,
        comments: []
      }
    ]
  },
  {
    id: 3,
    isVenue: true,
    spotName: 'Belgrad Ormanı Yürüyüş Yolu 🌿',
    spotSubtitle: 'Doğanın içinde huzur dolu kaçamak',
    latitude: 41.1822,
    longitude: 28.9814,
    memoryCount: 1,
    category: { id: 5, name: 'Doğa & Kamp', icon: 'trees', colorHex: '#E2EFCB' },
    memories: [
      {
        id: 301,
        title: 'Sonbaharın Pastel Yaprakları 🍂',
        subtitle: '10 km doğa yürüyüşü ve fotoğraf çekimi',
        contentText: 'Sarı ve kahverengi yapraklar arasında temiz orman havası aldık.',
        mediaType: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
        memoryDate: '2025-10-10',
        visibility: 'public',
        createdAt: '2025-10-10T11:00:00Z',
        user: { id: 97, fullName: 'Belgrad Ormanı Doğa Kulübü 🌿', userType: 'corporate', avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=BelgradClub' },
        likeCount: 31,
        isLikedByMe: true,
        repostCount: 0,
        isRepostedByMe: false,
        comments: []
      }
    ]
  }
];

export default api;
