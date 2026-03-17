// src/services/cityService.ts

export interface City {
  id: number;
  name: string;
  province?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCityDTO = Omit<City, "id" | "createdAt" | "updatedAt">;

const API_URL = "http://localhost:4000/api/cities"; // Ajusta el puerto a tu backend

export const getCities = async (): Promise<City[]> => {
  const res = await fetch(API_URL);
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
