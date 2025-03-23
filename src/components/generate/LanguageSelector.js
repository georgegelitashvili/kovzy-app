import React, { useState, useContext, useEffect } from 'react';
import { getData } from "../../helpers/storage";
import SelectOption from './SelectOption';
import { languageOptions } from '../languages';
import { LanguageContext } from '../Language';

export default function LanguageSelector() {
  const [languages, setLanguages] = useState([]);
  const { dictionary, userLanguage, userLanguageChange } = useContext(LanguageContext);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const fetchedLanguages = await getData('languages');
        console.log('Fetched languages:', fetchedLanguages);
        if (fetchedLanguages) {
          const transformedLanguages = fetchedLanguages.map(lang => ({
            label: lang.name,
            value: lang.lang
          }));
          console.log('Transformed languages:', transformedLanguages);
          setLanguages(transformedLanguages);
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };

    fetchLanguages();
  }, []);

  const handleLanguageChange = (value) => {
    if (value) {
      // Only change if the value is different from current language
      if (value !== userLanguage) {
        userLanguageChange(value);
      } else {
        console.log('LanguageSelector - Language already set to:', value);
      }
    }
  };

  return (
    <SelectOption
      value={userLanguage}
      onValueChange={handleLanguageChange}
      items={languages.length ? languages : languageOptions}
      placeholder={dictionary['languages.chooseLanguage']}
    />
  );
}
