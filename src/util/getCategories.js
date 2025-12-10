import useSWR from "swr";

const getCategories = (initialData) => {
    let res;
    if (initialData) {
        res = useSWR("/api/categories", { initialData });
    } else {
        res = useSWR("/api/categories");
    }
    
    // Asegurar que siempre devolvemos un array, incluso si está vacío
    const categories = Array.isArray(res.data) ? res.data : (initialData && Array.isArray(initialData) ? initialData : []);
    
    return {
        categories: categories,
        isLoading: !res.error && !res.data,
        error: res.error,
    };
};

export default getCategories;
