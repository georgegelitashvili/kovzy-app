import React, { useState, createContext, useEffect } from 'react';
import { storeData, getData } from '../helpers/storage';
import { languageList, dictionaryList } from './languages';

export const LanguageContext = createContext({
  userLanguage: 'en',
  dictionary: dictionaryList.en,
  userLanguageChange: () => { }  // Add default function to prevent errors
});

export function LanguageProvider({ children }) {
  const [userLanguage, setUserLanguage] = useState('en');
  const [languageId, setLanguageId] = useState(2);

  useEffect(() => {
    const fetchLanguage = async () => {
      const lang = await getData('rcml-lang');
      setUserLanguage(lang ?? 'en');
      const languages = await getData('languages');
    };
    fetchLanguage();
  }, []);

  const userLanguageChange = (selected) => {
    const newLanguage = languageList[selected] ? selected : 'en';
    setUserLanguage(newLanguage);
    storeData('rcml-lang', newLanguage);
  };

  const provider = {
    userLanguage,
    dictionary: dictionaryList[userLanguage],
    userLanguageChange
  };

  return (
    <LanguageContext.Provider value={provider}>
      {children}
    </LanguageContext.Provider>
  );
}
