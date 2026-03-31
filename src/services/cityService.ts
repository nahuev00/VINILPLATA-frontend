// src/services/cityService.ts

export interface City {
  id: number;
  name: string;
  province?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCityDTO = Omit<City, "id" | "createdAt" | "updatedAt">;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const API_URL = `${API_BASE_URL}/cities`;

export const getCities = async (): Promise<City[]> => {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!res.ok) throw new Error("Error al obtener las ciudades");
  return res.json();
};

export const createCity = async (data: CreateCityDTO): Promise<City> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear la ciudad");
  return res.json();
};

export const updateCity = async (
  id: number,
  data: CreateCityDTO,
): Promise<City> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT", // o PATCH dependiendo de tu backend
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar la ciudad");
  return res.json();
};
