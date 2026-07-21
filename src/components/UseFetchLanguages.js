// useFetchLanguages.js
import { useState, useEffect } from 'react';
import axiosInstance from '../apiConfig/apiRequests';

export const useFetchLanguages = (apiUrls) => {
  const [languages, setLanguages] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchLanguages = async () => {
      if (!apiUrls?.languages) {
        if (!cancelled) {
          setLanguages([]);
        }
        return;
      }

      try {
        const response = await axiosInstance.post(apiUrls.languages);
        if (cancelled) {
          return;
        }

        if (response.data?.languages) {
          setLanguages(response.data.languages);
        } else {
          setLanguages([]);
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
        if (!cancelled) {
          setLanguages([]);
        }
      }
    };

    fetchLanguages();

    return () => {
      cancelled = true;
    };
  }, [apiUrls]);

  return { languages };
};
