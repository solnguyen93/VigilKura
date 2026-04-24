import { useState, useEffect } from 'react';

function useDataFetching(fetchFunction, ...args) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const fetchedData = await fetchFunction(...args);
                setData(fetchedData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, setData, loading };
}

export default useDataFetching;
