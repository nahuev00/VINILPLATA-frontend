// src/services/stationService.ts

export interface Station {
  id: number;
  username: string;
  name: string;
  role: "STATION";
  materials: { id: number; name: string }[]; // Relación con Materiales
}

export interface CreateStationDTO {
  name: string;
  username: string;
  password?: string;
  materialIds: number[]; // Arreglo de IDs de los materiales compatibles
}

const API_URL = "http://localhost:4000/api/users"; // Ajustar según tu backend

export const getStations = async (): Promise<Station[]> => {
  const res = await fetch(`${API_URL}/stations`);
  console.log(res);
  if (!res.ok) throw new Error("Error al obtener las estaciones");
  return res.json();
};

export const createStation = async (
  data: CreateStationDTO,
): Promise<Station> => {
  const res = await fetch(`${API_URL}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear la estación");
  return res.json();
};

export const updateStation = async (
  id: number,
  data: CreateStationDTO,
): Promise<Station> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar la estación");
  return res.json();
};
