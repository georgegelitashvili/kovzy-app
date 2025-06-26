import React, { createContext, useState, useContext, useEffect } from 'react';
import { getData, storeData } from '../helpers/storage';
import { dictionaryList, languageList } from './languages';

export const LanguageContext = createContext({
  userLanguage: 'ka',
  dictionary: dictionaryList.ka,
  userLanguageChange: () => {},
  languageId: null
});

export function LanguageProvider({ children }) {
  const [userLanguage, setUserLanguage] = useState('ka');
  const [dictionary, setDictionary] = useState(dictionaryList.ka);
  const [languageId, setLanguageId] = useState(null);

  useEffect(() => {
    // Set initial language
    const initLanguage = async () => {
      const savedLanguage = await getData('rcml-lang');
      if (savedLanguage && languageList[savedLanguage]) {
        setUserLanguage(savedLanguage);
        setDictionary(dictionaryList[savedLanguage]);
      }
    };

    initLanguage();
  }, []);

  useEffect(() => {
    const updateLanguageId = async () => {
      try {
        const languages = await getData('languages');
        console.log('Languages loaded:', languages);
        console.log('Current user language:', userLanguage);
        if (languages) {
          const language = languages.find(lang => lang.lang === userLanguage);
          if (language) {
            console.log('Updating language ID for:', userLanguage, '->', language.id);
            setLanguageId(language.id);
          } else {
            console.warn('Language not found in list:', userLanguage);
          }
        }
      } catch (error) {
        console.error('Error updating language ID:', error);
      }
    };

    updateLanguageId();
  }, [userLanguage]);
  
  const userLanguageChange = async (selected) => {
    try {
      if (!languageList[selected]) {
        console.error('Invalid language selected:', selected);
        return;
      }
      setUserLanguage(selected);
      setDictionary(dictionaryList[selected] || dictionaryList.en);

      await storeData('rcml-lang', selected);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const provider = {
    userLanguage,
    dictionary,
    userLanguageChange,
    languageId
  };

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