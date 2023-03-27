import React, { useState, createContext, useContext, useEffect } from 'react';
import { storeData, getData } from '../helpers/storage';
import { languageList, dictionaryList } from './languages';

// create the language context with default selected language
export const LanguageContext = createContext({
  userLanguage: 'ka',
  dictionary: dictionaryList.ka
});

// it provides the language context to app
export function LanguageProvider({ children }) {
  const [defaultLang, setDefaultLang] = useState('');
  const [userLanguage, setUserLanguage] = useState('ka');

  // console.log('-------------- user Language');
  // console.log(userLanguage);
  // console.log('-------------- end user Language');


  useEffect(() => {
    getData('rcml-lang').then(lang => setUserLanguage(lang || 'ka'));
  }, [userLanguage])

  const provider = {
    userLanguage,
    dictionary: dictionaryList[userLanguage],
    userLanguageChange: selected => {
      const newLanguage = languageList[selected] ? selected : 'ka'
      setUserLanguage(newLanguage);
      storeData('rcml-lang', newLanguage);
    }
  };

  return (
    <LanguageContext.Provider value={provider}>
      {children}
    </LanguageContext.Provider>
  );
};

// get text according to id & current language
export function String({ tid }) {
  const languageContext = useContext(LanguageContext);

  return languageContext.dictionary[tid] || tid;
};