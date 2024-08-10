// useFetchLanguages.js
import { useState, useEffect } from 'react';
import axiosInstance from "../apiConfig/apiRequests";


export const useFetchLanguages = (domain) => {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const path = `https://${domain}/api/v1/admin/languages`;

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await axiosInstance.post(path);
                setLanguages(response.data.languages);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchLanguages();
    }, [path]);

    return { languages, loading, error };
};
