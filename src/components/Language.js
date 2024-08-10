import React, { useState, createContext, useEffect } from 'react';
import { storeData, getData } from '../helpers/storage';
import { languageList, dictionaryList } from './languages';

export const LanguageContext = createContext({
  userLanguage: 'en',
  dictionary: dictionaryList.en,
  userLanguageChange: () => { }
});

export function LanguageProvider({ children }) {
  const [userLanguage, setUserLanguage] = useState('en');
  const [languageId, setLanguageId] = useState();

  useEffect(() => {
    const fetchLanguageAndId = async () => {
      const storedLang = await getData('rcml-lang');
      const finalLang = storedLang ?? 'en';

      const languages = await getData('languages');
      const language = languages.find(lang => lang.lang === finalLang);

      if (language) {
        setUserLanguage(finalLang);
        setLanguageId(language.id);
      }
    };

    fetchLanguageAndId();
  }, []);

  useEffect(() => {
    const updateLanguageId = async () => {
      const languages = await getData('languages');
      const language = languages.find(lang => lang.lang === userLanguage);

      if (language) {
        setLanguageId(language.id);
      }
    };

    updateLanguageId();
  }, [userLanguage]);

  const userLanguageChange = (selected) => {
    const newLanguage = languageList[selected] ? selected : 'en';
    setUserLanguage(newLanguage);
    storeData('rcml-lang', newLanguage);
  };

  const provider = {
    userLanguage,
    dictionary: dictionaryList[userLanguage],
    userLanguageChange,
    languageId // Include languageId in the provider
  };

  return (
    <LanguageContext.Provider value={provider}>
      {children}
    </LanguageContext.Provider>
  );
}
