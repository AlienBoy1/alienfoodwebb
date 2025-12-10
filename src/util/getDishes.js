import useSWR from "swr";

const getDishes = (initialData) => {
    let res;
    if (initialData) {
        res = useSWR("/api/dishes", { initialData });
    } else {
        res = useSWR("/api/dishes");
    }
    
    // Asegurar que siempre devolvemos un array, incluso si está vacío
    const dishes = Array.isArray(res.data) ? res.data : (initialData && Array.isArray(initialData) ? initialData : []);
    
    return {
        dishes: dishes,
        isLoading: !res.error && !res.data,
        error: res.error,
    };
};

export default getDishes;
