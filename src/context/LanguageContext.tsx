import React, { createContext, useContext, useEffect, useState } from 'react';

export interface LanguageOption {
  code: string;
  googleCode: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  isSingapore?: boolean;
}

export const LANGUAGES: LanguageOption[] = [
  // ==========================================
  // 🇸🇬 SINGAPORE OFFICIAL & SPOKEN LANGUAGES (FIRST)
  // ==========================================
  {
    code: 'en-SG',
    googleCode: 'en',
    name: 'English (Singapore)',
    nativeName: 'English (SG)',
    flag: '🇸🇬',
    region: 'Singapore',
    isSingapore: true,
  },
  {
    code: 'zh-SG',
    googleCode: 'zh-CN',
    name: 'Chinese (Singapore)',
    nativeName: '华语 (新加坡)',
    flag: '🇸🇬',
    region: 'Singapore',
    isSingapore: true,
  },
  {
    code: 'ms-SG',
    googleCode: 'ms',
    name: 'Malay (Singapore)',
    nativeName: 'Bahasa Melayu (SG)',
    flag: '🇸🇬',
    region: 'Singapore',
    isSingapore: true,
  },
  {
    code: 'ta-SG',
    googleCode: 'ta',
    name: 'Tamil (Singapore)',
    nativeName: 'தமிழ் (சிங்கப்பூர்)',
    flag: '🇸🇬',
    region: 'Singapore',
    isSingapore: true,
  },

  // ==========================================
  // 🌐 GLOBAL INSTITUTIONAL LANGUAGES
  // ==========================================
  {
    code: 'zh-CN',
    googleCode: 'zh-CN',
    name: 'Chinese Simplified',
    nativeName: '简体中文',
    flag: '🇨🇳',
    region: 'China / Asia',
  },
  {
    code: 'zh-TW',
    googleCode: 'zh-TW',
    name: 'Chinese Traditional',
    nativeName: '繁體中文',
    flag: '🇭🇰',
    region: 'Hong Kong / Taiwan',
  },
  {
    code: 'en-US',
    googleCode: 'en',
    name: 'English (US)',
    nativeName: 'English (US)',
    flag: '🇺🇸',
    region: 'North America',
  },
  {
    code: 'en-GB',
    googleCode: 'en',
    name: 'English (UK)',
    nativeName: 'English (UK)',
    flag: '🇬🇧',
    region: 'United Kingdom / Europe',
  },
  {
    code: 'es',
    googleCode: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'Spain / Latin America',
  },
  {
    code: 'de',
    googleCode: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    region: 'Germany / DACH',
  },
  {
    code: 'fr',
    googleCode: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'France / Global',
  },
  {
    code: 'ja',
    googleCode: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'Japan',
  },
  {
    code: 'ko',
    googleCode: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    region: 'South Korea',
  },
  {
    code: 'ar',
    googleCode: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    region: 'Middle East / UAE',
  },
  {
    code: 'pt',
    googleCode: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    region: 'Brazil / Portugal',
  },
  {
    code: 'ru',
    googleCode: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    region: 'Eastern Europe / Central Asia',
  },
  {
    code: 'vi',
    googleCode: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    region: 'Vietnam',
  },
  {
    code: 'id',
    googleCode: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    region: 'Indonesia / ASEAN',
  },
  {
    code: 'th',
    googleCode: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    region: 'Thailand',
  },
  {
    code: 'tl',
    googleCode: 'tl',
    name: 'Filipino',
    nativeName: 'Tagalog',
    flag: '🇵🇭',
    region: 'Philippines',
  },
  {
    code: 'tr',
    googleCode: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    region: 'Turkey',
  },
  {
    code: 'it',
    googleCode: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    region: 'Italy',
  },
];

interface LanguageContextType {
  currentLanguage: LanguageOption;
  setLanguage: (code: string) => void;
  availableLanguages: LanguageOption[];
  singaporeLanguages: LanguageOption[];
  globalLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'quibands_selected_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageOption>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = LANGUAGES.find((l) => l.code === saved);
      if (found) return found;
    }
    // Default to Singapore English
    return LANGUAGES[0];
  });

  // Apply Google Translate translation across the whole page safely without reload
  const applyLanguageTranslation = (lang: LanguageOption) => {
    const googleCode = lang.googleCode;
    const host = window.location.hostname;
    const cookieVal = `/en/${googleCode}`;

    // 1. Set Google Translate cookies across all scopes
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${host}`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=.${host}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    document.cookie = `googtrans=${cookieVal};`;

    if (googleCode === 'en') {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${host}`;
    }

    // 2. Trigger Google Translate combo element with safe polling (no page reload)
    const triggerCombo = (attempts = 0) => {
      const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (selectElem) {
        selectElem.value = googleCode;
        selectElem.dispatchEvent(new Event('change'));
        selectElem.dispatchEvent(new Event('input'));
      } else if (attempts < 12) {
        setTimeout(() => triggerCombo(attempts + 1), 250);
      }
    };

    triggerCombo(0);
  };

  const setLanguage = (code: string) => {
    const found = LANGUAGES.find((l) => l.code === code);
    if (found) {
      setCurrentLanguageState(found);
      localStorage.setItem(STORAGE_KEY, found.code);
      applyLanguageTranslation(found);
    }
  };

  // Sync with stored language on mount (No reload, only trigger translation once combo is ready)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = LANGUAGES.find((l) => l.code === saved);
      if (found) {
        setCurrentLanguageState(found);
        if (found.googleCode !== 'en') {
          setTimeout(() => {
            applyLanguageTranslation(found);
          }, 800);
        }
      }
    }
  }, []);



  const singaporeLanguages = LANGUAGES.filter((l) => l.isSingapore);
  const globalLanguages = LANGUAGES.filter((l) => !l.isSingapore);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        availableLanguages: LANGUAGES,
        singaporeLanguages,
        globalLanguages,
      }}
    >
      {/* Hidden google translate container */}
      <div id="google_translate_element" style={{ display: 'none' }} />
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
