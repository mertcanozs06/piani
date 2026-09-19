import React, { useState } from 'react';
import { X, Trophy, DollarSign, MapPin, Sparkles, Building2, AlertTriangle, CreditCard, Calendar, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const SponsorshipModal = ({ isOpen, onClose, onBidSubmitted, initialCoords }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Bid details & duration, 2: iyzico payment
  const [spotName, setSpotName] = useState(user?.fullName || '');
  const [spotSubtitle, setSpotSubtitle] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [currency, setCurrency] = useState('USD'); // 'TL', 'USD', 'EUR'
  const [duration, setDuration] = useState('monthly'); // 'monthly' | 'yearly'
  
  // Card details state for iyzico simulation
  const [cardHolder, setCardHolder] = useState(user?.fullName || '');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [loading, setLoading] = useState(false);

  const isCorporate = user && user.userType === 'corporate';

  React.useEffect(() => {
    if (user?.userType === 'corporate' && user.fullName) {
      setSpotName(user.fullName);
      setCardHolder(user.fullName);
    }
  }, [user]);

  if (!isOpen) return null;

  // Step 1: Proceeds to iyzico payment view
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!isCorporate) {
      alert('Sadece ücretsiz kaydını tamamlamış Kurumsal / Mekan hesapları sponsorluk teklifi verebilir. 🏢');
      return;
    }

    if (!spotName.trim() || !bidAmount) {
      alert('Lütfen mekan adını ve teklif miktarını girin 🌸');
      return;
    }

    const amountNum = parseFloat(bidAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Lütfen geçerli bir teklif miktarı girin.');
      return;
    }

    setStep(2);
  };

  // Step 2: Final submit after iyzico card payment simulation
  const handleFinalPaymentSubmit = async (e) => {
    e.preventDefault();

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      alert('Lütfen 16 haneli geçerli bir kredi kartı numarası girin.');
      return;
    }

    if (!cardExpiry || !cardCvc) {
      alert('Lütfen kart son kullanma tarihi ve CVC kodunu girin.');
      return;
    }

    setLoading(true);

    // Otomatik kayıtlı mekan konumu kullan (varsa user.latitude/longitude, yoksa varsayılan)
    const lat = user?.latitude || initialCoords?.lat || 41.0082;
    const lng = user?.longitude || initialCoords?.lng || 28.9784;

    const bidData = {
      spotName: spotName.trim(),
      spotSubtitle: spotSubtitle.trim(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      bidAmount: parseFloat(bidAmount),
      currency,
      duration,
      paymentStatus: 'paid_iyzico'
    };

    try {
      const res = await api.post('/pins/sponsored', bidData);
      if (res.data.success) {
        alert('iyzico ödemeniz başarıyla alındı! Sponsorluk teklifiniz açık artırmaya eklendi. 🎉');
      }
    } catch (err) {
      // Local auction fallback handled in parent
    } finally {
      setLoading(false);
      onBidSubmitted(bidData);
      alert('iyzico 3D Secure ödemeniz onaylandı! Teklifiniz açık artırma sıralamasına eklendi 💳✨');
      setStep(1);
      setBidAmount('');
      onClose();
    }
  };

  const getCurrencySymbol = (c) => {
    if (c === 'TL') return '₺';
    if (c === 'EUR') return '€';
    return '$';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-pastel-dark/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto border border-pastel-rose/40">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-200 via-pastel-rose/40 to-pastel-sky/40 border-b border-pastel-rose/30 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-pastel-dark flex items-center justify-center shadow-sm">
              <Trophy className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-pastel-dark">Sponsor Ol & Öne Çık 🌟</h3>
              <p className="text-xs text-pastel-charcoal font-medium">Açık artırmada en yüksek teklifi ver, haritadaki sol alanda sergilen</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-pastel-dark shadow-sm transition-transform active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Kurumsal Olmayan Kullanıcı Uyarı Kutusu */}
        {!isCorporate ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto text-purple-600">
              <Building2 className="w-7 h-7" />
            </div>
            <h4 className="font-serif font-bold text-lg text-pastel-dark">Sadece Kurumsal Mekan Hesapları İçindir 🏢</h4>
            <p className="text-xs text-pastel-gray leading-relaxed max-w-sm mx-auto">
              Sponsorluk teklifi vererek haritanın sol alanında ve pinlerde öne çıkmak sadece <strong>kayıtlı Kurumsal / Mekan hesaplarına</strong> özeldir. 
              <br /><br />
              AnıPini'ye üye olmak ve kurumsal mekan hesabı açmak <strong>tamamen ücretsizdir!</strong>
            </p>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Sponsor olmak için lütfen ücretsiz bir Kurumsal Mekan hesabı açın.</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-pastel-rose text-pastel-dark rounded-2xl font-bold text-xs shadow-xs hover:bg-pastel-roseHover"
            >
              Anlaşıldı, Kapat
            </button>
          </div>
        ) : (
          /* Form Body (Sadece Kurumsal Mekanlar İçin Aktif) */
          <>
            <div className="p-4 bg-amber-50 border-b border-amber-200/60 flex items-start space-x-2.5 text-xs text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Sistem tüm mekan tekliflerini kur bazında hesaplayarak <strong>en yüksek teklifi veren ilk 5 mekanın</strong> konumunu haritanın sol tarafına otomatik yerleştirir!
              </p>
            </div>

            {step === 1 ? (
              /* ADIM 1: Teklif ve Süre Detayları */
              <form onSubmit={handleProceedToPayment} className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[70vh]">
                
                {/* Mekan Adresi Otomatik Bilgilendirme */}
                <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-purple-900 block">Mekan Konumunuz Otomatik Kullanılıyor 📍</span>
                    <span className="text-purple-700 text-[11px]">
                      {user?.address || 'Kayıtlı mekan adresiniz ve koordinatlarınız sponsorluğunuz için kullanılacaktır.'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pastel-dark mb-1">Mekan / İşletme Adı *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-purple-600" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Galata Teras Kahvecisi ☕"
                      value={spotName}
                      onChange={(e) => setSpotName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-pastel-dark mb-1">Slogan / Tanıtım</label>
                  <input
                    type="text"
                    placeholder="Örn: Tarihi kule manzaralı özel kahveler"
                    value={spotSubtitle}
                    onChange={(e) => setSpotSubtitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* TEKLİF MİKTARI VE PARA BİRİMİ SEÇİMİ */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-pastel-dark mb-1">Sponsorluk Teklif Miktarı *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-600" />
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        placeholder="Örn: 500"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-pastel-dark mb-1">Para Birimi *</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="TL">TL (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* SPONSORLUK SÜRESİ SEÇİMİ (AYLIK / YILLIK) */}
                <div>
                  <label className="block text-xs font-semibold text-pastel-dark mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Sponsorluk Süresi *</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDuration('monthly')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                        duration === 'monthly'
                          ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-xs'
                          : 'bg-pastel-bg border-pastel-rose/30 text-pastel-gray hover:text-pastel-dark'
                      }`}
                    >
                      <span>Aylık (1 Ay) 📅</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuration('yearly')}
                      className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                        duration === 'yearly'
                          ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-xs'
                          : 'bg-pastel-bg border-pastel-rose/30 text-pastel-gray hover:text-pastel-dark'
                      }`}
                    >
                      <span>Yıllık (1 Yıl) 🗓️</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-pastel-dark rounded-2xl font-bold text-xs shadow-pastel-soft transition-all active:scale-98 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4 text-amber-950" />
                  <span>iyzico Ödeme Ekranına Geç 💳</span>
                </button>
              </form>
            ) : (
              /* ADIM 2: iyzico Güvenli Ödeme Ekranı Simülasyonu */
              <form onSubmit={handleFinalPaymentSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 max-h-[70vh]">
                
                {/* iyzico Badge Header */}
                <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-xs text-blue-900">iyzico Güvenli Ödeme 🔒</h4>
                      <p className="text-[10px] text-blue-700">256-bit SSL Korumalı 3D Secure Altyapısı</p>
                    </div>
                  </div>
                  <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    iyzico
                  </span>
                </div>

                {/* Teklif Özeti */}
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
                  <span className="font-medium">{spotName} ({duration === 'monthly' ? 'Aylık' : 'Yıllık'})</span>
                  <span className="font-extrabold text-sm text-emerald-700">{getCurrencySymbol(currency)} {bidAmount}</span>
                </div>

                {/* Kart Bilgileri */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-pastel-dark mb-1">Kart Üzerindeki İsim</label>
                    <input
                      type="text"
                      required
                      placeholder="AD SOYAD"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-pastel-dark mb-1">Kart Numarası</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-pastel-gray" />
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="5400 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-pastel-dark mb-1">Son Kullanma (AA/YY)</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-pastel-dark mb-1">CVC / Güvenlik Kodu</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-pastel-bg border border-pastel-rose/30 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3.5 px-4 bg-pastel-bg hover:bg-pastel-rose/20 text-pastel-dark rounded-2xl font-bold text-xs border border-pastel-rose/30 flex items-center justify-center space-x-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Geri</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-98 flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{loading ? 'iyzico İşleniyor...' : `iyzico İle Öde (${getCurrencySymbol(currency)} ${bidAmount}) ✨`}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default SponsorshipModal;
