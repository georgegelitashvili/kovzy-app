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
  const [dictionary, setDictionary] = useState(dictionaryList.en);
  const [languageId, setLanguageId] = useState();

  useEffect(() => {
    const fetchLanguageAndId = async () => {
      try {
        const storedLang = await getData('rcml-lang');
        // console.log('Initial stored language:', storedLang);
        const finalLang = storedLang ?? 'en';

        const languages = await getData('languages');
        // console.log('Available languages:', languages);
        if (languages) {
          const language = languages.find(lang => lang.lang === finalLang);
          if (language) {
            setUserLanguage(finalLang);
            setDictionary(dictionaryList[finalLang] || dictionaryList.en);
            setLanguageId(language.id);
          }
        }
      } catch (error) {
        console.error('Error fetching language:', error);
        setUserLanguage('en');
        setDictionary(dictionaryList.en);
      }
    };

    fetchLanguageAndId();
  }, []);

  useEffect(() => {
    const updateLanguageId = async () => {
      try {
        const languages = await getData('languages');
        if (languages) {
          const language = languages.find(lang => lang.lang === userLanguage);
          if (language) {
            console.log('Updating language ID for:', userLanguage);
            setLanguageId(language.id);
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

      const stored = await storeData('rcml-lang', selected);
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

  return (
    <LanguageContext.Provider value={provider}>
      {children}
    </LanguageContext.Provider>
  );
}