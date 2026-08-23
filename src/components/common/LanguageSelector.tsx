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

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <div className={`relative inline-block text-left font-sans ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all duration-200 font-mono text-xs border ${
          variant === 'dashboard'
            ? 'px-3 py-2 bg-dark-900/90 border-gold-500/30 hover:border-gold-400 text-slate-200 hover:text-white shadow-sm'
            : variant === 'compact'
            ? 'px-2.5 py-1.5 bg-dark-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
            : 'px-3 py-1.5 bg-dark-900/80 hover:bg-dark-850 border-white/10 hover:border-gold-500/40 text-slate-200 hover:text-white shadow-sm'
        }`}
        title="Select Platform Language"
      >
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <span className="font-semibold tracking-wide truncate max-w-[110px] hidden sm:inline">
          {currentLanguage.nativeName}
        </span>
        <span className="font-semibold tracking-wide sm:hidden">
          {currentLanguage.code.split('-')[0].toUpperCase()}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gold-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-gold-300' : ''
          }`}
        />
      </button>

      {/* Language Selection Modal / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-dark-950/98 backdrop-blur-xl border border-gold-500/30 shadow-2xl shadow-black/80 z-[100] overflow-hidden animate-fadeIn">
          {/* Header & Search */}
          <div className="p-3 border-b border-white/10 bg-dark-900/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white font-mono">
                <Globe className="w-3.5 h-3.5 text-gold-400" />
                <span>Select Language</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-400 border border-gold-400/20 font-mono font-bold">
                🇸🇬 SG First
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language or region..."
                className="w-full pl-8 pr-3 py-1.5 bg-dark-950 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 font-sans"
                autoFocus
              />
            </div>
          </div>

          {/* Languages Scroll Area */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-3 font-sans text-xs scrollbar-thin">
            {/* 1. SINGAPORE OFFICIAL LANGUAGES SECTION */}
            {filteredSingapore.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[11px] font-bold font-mono text-gold-400 uppercase tracking-wider flex items-center gap-1.5 bg-gold-400/5 rounded-md mb-1">
                  <Sparkles className="w-3 h-3 text-gold-400" />
                  <span>Singapore Official Languages</span>
                </div>
                <div className="space-y-0.5">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-gold-400/20 to-amber-500/20 text-gold-300 border border-gold-400/40 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <span className="text-lg leading-none">{lang.flag}</span>
                          <div>
                            <div className="font-semibold text-white leading-tight">{lang.nativeName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{lang.name}</div>
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
                <div className="px-2.5 py-1 text-[11px] font-bold font-mono text-slate-400 uppercase tracking-wider bg-white/5 rounded-md mb-1 flex items-center justify-between">
                  <span>Global Institutional Languages</span>
                  <span className="text-[9px] text-slate-500">{filteredGlobal.length}</span>
                </div>
                <div className="space-y-0.5">
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-gold-400/20 to-amber-500/20 text-gold-300 border border-gold-400/40 font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <span className="text-lg leading-none">{lang.flag}</span>
                          <div>
                            <div className="font-semibold text-white leading-tight">{lang.nativeName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
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
          <div className="p-2.5 bg-dark-900 border-t border-white/5 text-center text-[10px] text-slate-500 font-mono">
            Full site instant localization &bull; Quibands Global Engine
          </div>
        </div>
      )}
    </div>
  );
};
