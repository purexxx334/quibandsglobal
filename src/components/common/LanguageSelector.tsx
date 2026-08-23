import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check, Search, Sparkles } from 'lucide-react';
import { useLanguage, LanguageOption } from '../../context/LanguageContext';

interface LanguageSelectorProps {
  variant?: 'navbar' | 'dashboard' | 'compact';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'navbar', className = '' }) => {
  const { currentLanguage, setLanguage, singaporeLanguages, globalLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside (handles mouse and touch)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const filterLanguages = (list: LanguageOption[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(query) ||
        l.nativeName.toLowerCase().includes(query) ||
        l.region.toLowerCase().includes(query)
    );
  };

  const filteredSingapore = filterLanguages(singaporeLanguages);
  const filteredGlobal = filterLanguages(globalLanguages);

  return (
    <div className={`relative inline-block text-left font-sans notranslate ${className}`} ref={dropdownRef} translate="no">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all duration-200 font-mono text-xs border active:scale-95 ${
          variant === 'dashboard'
            ? 'px-3 py-2 bg-[#090d16] border-gold-500/40 hover:border-gold-400 text-slate-100 shadow-md'
            : variant === 'compact'
            ? 'px-2.5 py-1.5 bg-[#090d16] border-slate-700 hover:border-gold-400 text-slate-200 shadow-sm'
            : 'px-3 py-1.5 bg-[#090d16] hover:bg-[#111827] border-white/20 hover:border-gold-400 text-slate-100 shadow-sm'
        }`}
        title="Select Platform Language"
      >
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <span className="font-bold tracking-wide truncate max-w-[110px] hidden sm:inline text-white">
          {currentLanguage.nativeName}
        </span>
        <span className="font-bold tracking-wide sm:hidden text-gold-400">
          {currentLanguage.code.split('-')[0].toUpperCase()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gold-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-gold-300' : ''
          }`}
        />
      </button>

      {/* Language Selection Modal / Dropdown - 100% Solid Non-Transparent Background */}
      {isOpen && (
        <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 w-auto sm:w-84 max-w-[360px] mx-auto rounded-2xl bg-[#060a12] border-2 border-gold-500/50 shadow-2xl shadow-black z-[9999] overflow-hidden animate-fadeIn">
          {/* Header & Search */}
          <div className="p-3.5 border-b border-slate-800 bg-[#0a0f1a]">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                <Globe className="w-4 h-4 text-gold-400" />
                <span>Choose Language</span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gold-400/15 text-gold-300 border border-gold-400/30 font-mono font-bold">
                🇸🇬 Singapore First
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language or region..."
                className="w-full pl-9 pr-3 py-2 bg-[#03060c] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 font-sans"
              />
            </div>
          </div>

          {/* Languages Scroll Area */}
          <div className="max-h-72 sm:max-h-80 overflow-y-auto p-2.5 space-y-3 font-sans text-xs bg-[#060a12] overscroll-contain">
            {/* 1. SINGAPORE OFFICIAL LANGUAGES SECTION */}
            {filteredSingapore.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[11px] font-bold font-mono text-gold-400 uppercase tracking-wider flex items-center gap-1.5 bg-gold-400/10 rounded-lg mb-1.5 border border-gold-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  <span>Singapore Official Languages</span>
                </div>
                <div className="space-y-1">
                  {filteredSingapore.map((lang) => {
                    const isSelected = currentLanguage.code === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                          isSelected
                            ? 'bg-gradient-to-r from-gold-500/25 to-amber-600/25 text-gold-300 border border-gold-400 font-bold shadow-sm'
                            : 'text-slate-200 hover:text-white bg-[#0c121e] hover:bg-[#151f32] border border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-xl leading-none">{lang.flag}</span>
                          <div>
                            <div className="font-bold text-white leading-tight text-xs">{lang.nativeName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{lang.name}</div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-gold-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. GLOBAL INSTITUTIONAL LANGUAGES SECTION */}
            {filteredGlobal.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[11px] font-bold font-mono text-slate-300 uppercase tracking-wider bg-slate-800/60 rounded-lg mb-1.5 flex items-center justify-between border border-slate-700/50">
                  <span>Global Institutional Languages</span>
                  <span className="text-[10px] text-slate-400 font-bold">{filteredGlobal.length}</span>
                </div>
                <div className="space-y-1">
                  {filteredGlobal.map((lang) => {
                    const isSelected = currentLanguage.code === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                          isSelected
                            ? 'bg-gradient-to-r from-gold-500/25 to-amber-600/25 text-gold-300 border border-gold-400 font-bold shadow-sm'
                            : 'text-slate-200 hover:text-white bg-[#0c121e] hover:bg-[#151f32] border border-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-xl leading-none">{lang.flag}</span>
                          <div>
                            <div className="font-bold text-white leading-tight text-xs">{lang.nativeName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {lang.name} &bull; {lang.region}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-gold-400 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredSingapore.length === 0 && filteredGlobal.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                No languages found matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-[#0a0f1a] border-t border-slate-800 text-center text-[10px] text-slate-400 font-mono font-semibold">
            Institutional Multi-Language Engine &bull; Quibands Global
          </div>
        </div>
      )}
    </div>
  );
};


