import React, { useState } from 'react';
import { Trophy, ChevronLeft, ChevronRight, Sparkles, Navigation, Building2 } from 'lucide-react';

const SponsoredSidebar = ({ sponsoredPins = [], onSelectSponsoredVenue, onOpenSponsorshipModal }) => {
  const [isOpen, setIsOpen] = useState(true);

  const hasPins = sponsoredPins && sponsoredPins.length > 0;

  return (
    <div className={`absolute top-20 sm:top-24 left-4 z-[1000] transition-all duration-300 ${
      isOpen ? 'w-72 sm:w-80' : 'w-12'
    }`}>
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-amber-300 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Panel Header */}
        <div className="p-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200 border-b border-amber-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-950 flex-shrink-0" />
            {isOpen && (
              <div>
                <h4 className="font-serif font-bold text-xs text-amber-950">Sponsorlu Mekanlar 🌟</h4>
                <p className="text-[10px] text-amber-900 font-medium">Açık artırma ilk 5 mekan</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-amber-950 shadow-xs transition-transform active:scale-95"
            title={isOpen ? 'Paneli Daralt' : 'Paneli Genişlet'}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Panel İçeriği */}
        {isOpen && (
          <div className="p-3 space-y-2.5 max-h-[50vh] overflow-y-auto">
            {hasPins ? (
              sponsoredPins.map((item, index) => {
                const formatCurrency = (amount, curr) => {
                  if (curr === 'USD') return `$${amount}`;
                  if (curr === 'EUR') return `€${amount}`;
                  return `${amount} ₺`;
                };

                return (
                  <div
                    key={item.id || index}
                    onClick={() => onSelectSponsoredVenue(item)}
                    className="group bg-pastel-bg/80 hover:bg-amber-50 p-3 rounded-2xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-1.5 transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold flex items-center justify-center shadow-2xs">
                          #{index + 1}
                        </span>
                        <h5 className="font-serif font-bold text-xs text-pastel-dark line-clamp-1 group-hover:text-amber-800 transition-colors">
                          {item.spotName}
                        </h5>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shadow-2xs">
                        {formatCurrency(item.bidAmount, item.currency)}
                      </span>
                    </div>

                    {item.spotSubtitle && (
                      <p className="text-[11px] text-pastel-gray line-clamp-1 font-medium pl-6">
                        {item.spotSubtitle}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[10px] text-pastel-charcoal border-t border-amber-200/40">
                      <div className="flex items-center space-x-1 text-amber-700 font-semibold">
                        <Navigation className="w-3 h-3" />
                        <span>Konuma Git & Anıları Gör</span>
                      </div>
                      <span className="font-bold text-amber-900 group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-center space-y-2">
                <div className="w-9 h-9 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center mx-auto shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <h5 className="font-serif font-bold text-xs text-amber-950">Henüz Sponsor Mekan Yok 🌟</h5>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  Açık artırmada teklif vererek ilk 5 mekan arasına gir ve haritada öncelikli sergilen!
                </p>
              </div>
            )}

            {/* Mekan Hesabı İçin Sponsor Olma Butonu */}
            <button
              onClick={onOpenSponsorshipModal}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-pastel-dark rounded-2xl font-bold text-xs shadow-xs transition-all active:scale-98 flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-950" />
              <span>Sponsor Ol 🌟 (Sadece Mekanlar)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default SponsoredSidebar;
