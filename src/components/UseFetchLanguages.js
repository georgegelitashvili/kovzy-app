// useFetchLanguages.js
import { useState, useEffect } from 'react';
import axiosInstance from '../apiConfig/apiRequests';

export const useFetchLanguages = (apiUrls) => {
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    const fetchLanguages = async () => {
      if (!apiUrls?.languages) {
        return;
      }

      try {
        const response = await axiosInstance.post(apiUrls.languages);
        if (response.data?.data) {
          setLanguages(response.data.data);
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
