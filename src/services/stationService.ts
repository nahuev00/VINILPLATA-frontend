// src/services/stationService.ts

export interface MaterialShort {
  id: number;
  name: string;
}

export interface Station {
  id: number;
  name: string;
  username: string;
  role: string;
  printSpeedPerHour: number; // <-- NUEVO CAMPO
  materials?: MaterialShort[];
}

export interface CreateStationDTO {
  name: string;
  username: string;
  password?: string;
  printSpeedPerHour: number; // <-- NUEVO CAMPO
  materialIds?: number[];
}

export interface UpdateStationDTO {
  name?: string;
  username?: string;
  password?: string;
  printSpeedPerHour?: number; // <-- NUEVO CAMPO
  materialIds?: number[];
}

export interface StationWorkload {
  id: number;
  name: string;
  printSpeedPerHour: number;
  pendingItemsCount: number;
  pendingLinearMeters: number;
  estimatedHours: number;
}

const API_URL = "http://localhost:4000/api/users"; // Ajusta si tu ruta es /api/users

export const getStations = async (): Promise<Station[]> => {
  const res = await fetch(`${API_URL}/stations`);
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
  data: UpdateStationDTO,
): Promise<Station> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT", // o PATCH según tu backend
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar la estación");
  return res.json();
};

export const deleteStation = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar la estación");
};

export const getStationsWorkload = async (): Promise<StationWorkload[]> => {
  const res = await fetch(`${API_URL}/workload`);
  if (!res.ok) throw new Error("Error al obtener la carga de trabajo");
  return res.json();
};
