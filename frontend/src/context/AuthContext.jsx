import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

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
          setUser(response.data.user);
        }
      } catch (error) {
        console.warn('Oturum doğrulanamadı, mock kullanıcı oluşturuluyor...');
        // Mock fallback if backend DB is not reachable
        const savedType = localStorage.getItem('anipini_usertype') || 'individual';
        setUser({
          id: 1,
          fullName: 'Damla Yılmaz',
          email: 'damla@anipini.com',
          userType: savedType,
          address: 'Galata Meydanı No:12, Beyoğlu / İstanbul',
          latitude: 41.0256,
          longitude: 28.9742,
          bio: savedType === 'corporate' 
            ? 'Mekanımızın anılarını haritada paylaşıyoruz 🏢✨'
            : 'Haritamda tatlı anılar ve geziler biriktiriyorum 🌸✨',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Damla'
        });
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
        localStorage.setItem('anipini_token', res.data.token);
        localStorage.setItem('anipini_usertype', res.data.user.userType || 'individual');
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
    } catch (error) {
      // Mock login for offline prototype preview
      const savedType = localStorage.getItem('anipini_usertype') || 'individual';
      const mockUser = {
        id: 1,
        fullName: email.split('@')[0] || 'Gezgin',
        email,
        userType: savedType,
        address: 'Galata Meydanı No:12, Beyoğlu / İstanbul',
        latitude: 41.0256,
        longitude: 28.9742,
        bio: savedType === 'corporate'
          ? 'Mekanımızın unutulmaz anılarını paylaşıyoruz 🏢✨'
          : 'Haritamda tatlı anılar biriktiriyorum 🌸',
        avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${email}`
      };
      const mockToken = 'mock_jwt_token_pastel';
      localStorage.setItem('anipini_token', mockToken);
      setToken(mockToken);
      setUser(mockUser);
      return { success: true, isMock: true };
    }
  };

  const registerUser = async (fullName, email, password, userType = 'individual', extraData = {}) => {
    try {
      const res = await api.post('/auth/register', { fullName, email, password, userType, ...extraData });
      if (res.data.success) {
        localStorage.setItem('anipini_token', res.data.token);
        localStorage.setItem('anipini_usertype', res.data.user.userType || userType);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true };
      }
    } catch (error) {
      // Mock register for offline prototype preview
      const mockUser = {
        id: Math.floor(Math.random() * 1000) + 2,
        fullName,
        email,
        userType,
        address: extraData.address || 'İstanbul Sahil Yolu No:45',
        latitude: extraData.latitude || 41.0211,
        longitude: extraData.longitude || 29.0041,
        bio: userType === 'corporate' 
          ? 'Mekanımızın unutulmaz anılarını saklamaya başladık! 🏢✨' 
          : 'AnıPini topluluğuna hoş geldin! 🌸',
        avatarUrl: `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(fullName)}`
      };
      const mockToken = 'mock_jwt_token_pastel';
      localStorage.setItem('anipini_token', mockToken);
      localStorage.setItem('anipini_usertype', userType);
      setToken(mockToken);
      setUser(mockUser);
      return { success: true, isMock: true };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('anipini_token');
    localStorage.removeItem('anipini_usertype');
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
