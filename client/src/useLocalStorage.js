import { useEffect, useState } from "react";

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);

      if (saved !== null) {
        const parsed = JSON.parse(saved);

        if (parsed !== null) {
          setValue(parsed);
        }
      }
    } catch {
      localStorage.removeItem(key);
    }
  }, [key]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(value));
    }, 500);

    return () => clearTimeout(timer);
  }, [key, value]);

  return [value, setValue];
}

export default useLocalStorage;
