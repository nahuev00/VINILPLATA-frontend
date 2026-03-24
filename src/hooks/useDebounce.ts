// src/hooks/useDebounce.ts
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  // Estado y setter para el valor debounced
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Actualiza el valor debounced después de que pase el tiempo (delay)
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancela el timeout si el valor cambia (el usuario sigue escribiendo),
    // o si el componente se desmonta. Esto evita actualizaciones innecesarias.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Solo se vuelve a ejecutar si el valor o el delay cambian

  return debouncedValue;
}
