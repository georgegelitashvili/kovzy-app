import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { getData, storeData } from '../helpers/storage';
import { dictionaryList, languageList } from './languages';
import { set } from 'lodash';

export const LanguageContext = createContext({
  userLanguage: 'en',
  dictionary: dictionaryList.en,
  userLanguageChange: () => { },
  languageId: null,
  languages: []
});

export function LanguageProvider({ children }) {
  const [userLanguage, setUserLanguage] = useState('en');
  const [dictionary, setDictionary] = useState(dictionaryList.en);
  const [isReady, setIsReady] = useState(false);
  const [languages, setLanguages] = useState(null);
  const [languageId, setLanguageId] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initLanguage = async () => {
      if (hasInitialized) return;

      const savedLanguage = await getData('rcml-lang');
      if (savedLanguage && languageList[savedLanguage]) {
        setUserLanguage(savedLanguage);
        setDictionary(dictionaryList[savedLanguage]);
      }

      setHasInitialized(true);
    };
    initLanguage();
  }, [hasInitialized]);

  useEffect(() => {
    const initLanguages = async () => {
      const langs = await getData('languages');
      console.log('Fetched languages from storage:', langs);

      if (langs) {
        setLanguages(langs);
        setIsReady(true);
      } else {
        console.warn('Languages not found in storage');
      }
    };

    if (!isReady && !languages) {
      initLanguages();
    }
  }, [isReady, languages]);

  const setAvailableLanguages = useCallback(async (langs) => {
    if (!Array.isArray(langs)) {
      console.warn('🚫 Invalid languages list passed');
      return;
    }

    console.log('🔄 Setting available languages:', langs);
    setLanguages(langs);

    // Only set language if not already initialized to avoid overriding user selection
    if (!hasInitialized) {
      const savedLanguage = await getData('rcml-lang');
      const lang = (savedLanguage && languageList[savedLanguage]) ? savedLanguage : 'en';
      console.log('🔧 Initial language setup:', lang);
      setUserLanguage(lang);
      setDictionary(dictionaryList[lang]);
      
      // Set language ID for initial setup
      const found = langs.find(l => l.lang.toLowerCase() === lang.toLowerCase());
      if (found) {
        setLanguageId(found.id ?? 1);
      }
    }
    // Don't update language ID here if already initialized - let the useEffect handle it

    setIsReady(true);
  }, [hasInitialized]);
  

  useEffect(() => {
    console.log('📍 Language effect check - Ready:', isReady, 'UserLang:', userLanguage, 'HasLanguages:', !!languages);
    
    if (!isReady || !languages || !hasInitialized) {
      return;
    }

    const updateLanguageId = () => {
      const language = languages.find(lang => lang.lang === userLanguage);
      if (language) {
        const newLanguageId = language.id ?? 1;
        if (newLanguageId !== languageId) {
          console.log('🔄 Updating language ID for:', userLanguage, '->', newLanguageId);
          setLanguageId(newLanguageId);
        }
      } else {
        console.warn('⚠️ Language not found in list:', userLanguage);
      }
    };

    updateLanguageId();
  }, [userLanguage, languages, isReady, hasInitialized, languageId]);


  const userLanguageChange = useCallback(async (selected) => {
    console.log('🔄 userLanguageChange called with:', selected, 'Current:', userLanguage);
    
    // Prevent unnecessary changes
    if (selected === userLanguage) {
      console.log('⏭️ Language is already set to:', selected);
      return;
    }
    
    try {
      if (!languageList[selected]) {
        console.error('❌ Invalid language selected:', selected);
        return;
      }
      
      console.log('✅ Changing user language from', userLanguage, 'to:', selected);
      setUserLanguage(selected);
      setDictionary(dictionaryList[selected] || dictionaryList.en);

      await storeData('rcml-lang', selected);
      console.log('💾 Language saved to storage:', selected);
    } catch (error) {
      console.error('❌ Error changing language:', error);
    }
  }, [userLanguage]);

  const provider = useMemo(() => ({
    userLanguage,
    dictionary,
    setAvailableLanguages,
    userLanguageChange,
    languages,
    languageId
  }), [userLanguage, dictionary, setAvailableLanguages, userLanguageChange, languages, languageId]);

  // Make the language context globally accessible
  global.languageContext = provider;

  return (
    <LanguageContext.Provider value={provider}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use the language context
export const useLanguage = () => useContext(LanguageContext);