// useFetchLanguages.js
import { useState, useEffect } from 'react';
import axiosInstance from '../apiConfig/apiRequests';
import { storeData } from '../helpers/storage';

export const useFetchLanguages = (apiUrls) => {
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      if (!apiUrls?.languages) {
        return;
      }

      try {
        const response = await axiosInstance.post(apiUrls.languages);
        if (response.data?.languages) {
          const fetchedLanguages = response.data.languages;
          setLanguages(fetchedLanguages);
          
          // Store languages in async storage for LanguageContext to access
          await storeData('languages', fetchedLanguages);
          console.log('Languages stored successfully:', fetchedLanguages);
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
        setLanguages([]);
      }
    };

    fetchLanguages();
  }, [apiUrls]);

  return { languages };
};
