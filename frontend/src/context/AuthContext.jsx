import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const getMockUserId = (email) => {
  let hash = 0;
  for (const character of email.trim().toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000000000;
  }
  return hash || 1;
};

const saveMockUser = (mockUser) => {
  localStorage.setItem('anipini_mock_user', JSON.stringify(mockUser));
};

const getProfilePreferences = (userId) => {
  try {
    const saved = localStorage.getItem(`anipini_profile_${userId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Profil tercihleri okunamadı:', error);
    return null;
  }
};

const saveProfilePreferences = (userId, preferences) => {
  try {
    localStorage.setItem(`anipini_profile_${userId}`, JSON.stringify(preferences));
  } catch (error) {
    console.warn('Profil tercihleri kaydedilemedi:', error);
  }
};

const applyProfilePreferences = (user) => {
  if (!user?.id || user.userType === 'corporate') return user;

  let preferences = getProfilePreferences(user.id);
  if (!preferences) {
    preferences = {
      fullName: 'Gezgin01',
      avatarUrl: null
    };
    saveProfilePreferences(user.id, preferences);
  } else if (/^Gezgin \d{4}$/.test(preferences.fullName || '')) {
    preferences = { ...preferences, fullName: 'Gezgin01' };
  }
  preferences = { ...preferences, avatarUrl: null };
  saveProfilePreferences(user.id, preferences);

  return { ...user, ...preferences, avatarUrl: null };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('anipini_token') || null);
  const [loading, setLoading] = useState(true);

  // Sayfa yüklendiğinde kullanıcının yetki durumunu kontrol et
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          localStorage.removeItem('anipini_demo_mode');
          setUser(applyProfilePreferences(response.data.user));
        }
      } catch (error) {
        localStorage.setItem('anipini_demo_mode', 'true');
        console.warn('Oturum doğrulanamadı, mock kullanıcı oluşturuluyor...');
        const savedMockUser = localStorage.getItem('anipini_mock_user');
        if (token === 'mock_jwt_token_pastel' && savedMockUser) {
          try {
            const profileUser = applyProfilePreferences(JSON.parse(savedMockUser));
            setUser(profileUser);
            saveMockUser(profileUser);
            return;
          } catch (parseError) {
            console.warn('Demo kullanıcı bilgisi okunamadı, yeniden oluşturuluyor:', parseError);
          }
        }
        const savedType = localStorage.getItem('anipini_usertype') || 'individual';
        const mockUser = {
          id: getMockUserId('damla@anipini.com'),
          fullName: 'Damla Yılmaz',
          email: 'damla@anipini.com',
          userType: savedType,
          address: 'Galata Meydanı No:12, Beyoğlu / İstanbul',
          latitude: 41.0256,
          longitude: 28.9742,
          bio: savedType === 'corporate' 
            ? 'Mekanımızın anılarını haritada paylaşıyoruz 🏢✨'
            : 'Haritamda tatlı anılar ve geziler biriktiriyorum 🌸✨',
          avatarUrl: null
        };
        const profileUser = applyProfilePreferences(mockUser);
        setUser(profileUser);
        if (token === 'mock_jwt_token_pastel') saveMockUser(profileUser);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const loginUser = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.removeItem('anipini_demo_mode');
        localStorage.setItem('anipini_token', res.data.token);
        localStorage.setItem('anipini_usertype', res.data.user.userType || 'individual');
        setToken(res.data.token);
        setUser(applyProfilePreferences(res.data.user));
        return { success: true };
      }
    } catch (error) {
      // Mock login for offline prototype preview
      const savedType = localStorage.getItem('anipini_usertype') || 'individual';
      const mockUser = {
        id: getMockUserId(email),
        fullName: email.split('@')[0] || 'Gezgin',
        email,
        userType: savedType,
        address: 'Galata Meydanı No:12, Beyoğlu / İstanbul',
        latitude: 41.0256,
        longitude: 28.9742,
        bio: savedType === 'corporate'
          ? 'Mekanımızın unutulmaz anılarını paylaşıyoruz 🏢✨'
          : 'Haritamda tatlı anılar biriktiriyorum 🌸',
        avatarUrl: savedType === 'corporate'
          ? `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${email}`
          : null
      };
      const mockToken = 'mock_jwt_token_pastel';
      localStorage.setItem('anipini_demo_mode', 'true');
      localStorage.setItem('anipini_token', mockToken);
      setToken(mockToken);
      const profileUser = applyProfilePreferences(mockUser);
      setUser(profileUser);
      saveMockUser(profileUser);
      return { success: true, isMock: true };
    }
  };

  const registerUser = async (fullName, email, password, userType = 'individual', extraData = {}) => {
    try {
      const res = await api.post('/auth/register', { fullName, email, password, userType, ...extraData });
      if (res.data.success) {
        localStorage.removeItem('anipini_demo_mode');
        localStorage.setItem('anipini_token', res.data.token);
        localStorage.setItem('anipini_usertype', res.data.user.userType || userType);
        setToken(res.data.token);
        setUser(applyProfilePreferences(res.data.user));
        return { success: true };
      }
    } catch (error) {
      // Mock register for offline prototype preview
      const mockUser = {
        id: getMockUserId(email),
        fullName,
        email,
        userType,
        address: extraData.address || 'İstanbul Sahil Yolu No:45',
        latitude: extraData.latitude || 41.0211,
        longitude: extraData.longitude || 29.0041,
        bio: userType === 'corporate' 
          ? 'Mekanımızın unutulmaz anılarını saklamaya başladık! 🏢✨' 
          : 'AnıPini topluluğuna hoş geldin! 🌸',
        avatarUrl: userType === 'corporate'
          ? `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(fullName)}`
          : null
      };
      const mockToken = 'mock_jwt_token_pastel';
      localStorage.setItem('anipini_demo_mode', 'true');
      localStorage.setItem('anipini_token', mockToken);
      localStorage.setItem('anipini_usertype', userType);
      setToken(mockToken);
      const profileUser = applyProfilePreferences(mockUser);
      setUser(profileUser);
      saveMockUser(profileUser);
      return { success: true, isMock: true };
    }
  };

  const logoutUser = () => {
    if (token === 'mock_jwt_token_pastel' && user?.userType === 'corporate') {
      localStorage.removeItem('anipini_demo_reposts');
      localStorage.removeItem('anipini_demo_repost_states');
      localStorage.removeItem(`anipini_reposts_${user.id}`);
      localStorage.removeItem(`anipini_repost_states_${user.id}`);
    }
    if (token === 'mock_jwt_token_pastel' && user?.id) {
      localStorage.removeItem('anipini_demo_like_states');
      localStorage.removeItem(`anipini_like_states_${user.id}`);
    }
    localStorage.removeItem('anipini_token');
    localStorage.removeItem('anipini_usertype');
    localStorage.removeItem('anipini_mock_user');
    localStorage.removeItem('anipini_demo_mode');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginUser, registerUser, logoutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
