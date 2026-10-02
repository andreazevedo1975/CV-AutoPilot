// FIX: Import React to make the React namespace available for type definitions.
import React, { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback((value: React.SetStateAction<T>) => {
    try {
      setStoredValue(prev => {
        const valueToStore = typeof value === 'function'
          ? (value as (val: T) => T)(prev)
          : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.error(error);
        }
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}
