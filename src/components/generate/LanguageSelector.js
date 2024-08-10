import React, { useState, useContext, useEffect } from 'react';
import { getData } from "../../helpers/storage";
import SelectOption from './SelectOption';
import { languageOptions } from '../languages';
import { LanguageContext } from '../Language';

export default function LanguageSelector() {
  const [languages, setLanguages] = useState([]);
  const [languageId, setLanguageId] = useState(2);
  const { userLanguage, userLanguageChange } = useContext(LanguageContext);

  // set selected language by calling context method
  const handleLanguageChange = e => userLanguageChange(e);

  useEffect(() => {
    const fetchLanguages = async () => {
      const fetchedLanguages = await getData('languages');

      // Transform the fetched languages to the desired format
      const transformedLanguages = fetchedLanguages.map(lang => ({
        label: lang.name, // Use the 'name' field for label
        value: lang.lang  // Use the 'lang' field for value
      }));

      // Combine the fetched languages with additional languages
      const allLanguages = [...transformedLanguages];

      // Update the state with the transformed data
      setLanguages(allLanguages);
    };

    fetchLanguages();
  }, []);

  return (
    <SelectOption
      value={userLanguage}
      onValueChange={handleLanguageChange}
      items={languages.length ? languages : languageOptions} // Use fetched languages or fallback to default options
      keyExtractor={(item) => item?.id || ''}
    />
  );
}
