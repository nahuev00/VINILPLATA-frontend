// src/services/carrierService.ts

export interface Carrier {
  id: number;
  name: string;
  contactInfo?: string | null;
  phone?: string | null;
  pickupDays?: string | null;
  locations?: string | null;
  arrivalTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCarrierDTO = Omit<Carrier, "id" | "createdAt" | "updatedAt">;

const API_URL = "http://localhost:4000/api/carriers"; // Ajusta la ruta si es necesario

export const getCarriers = async (): Promise<Carrier[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener los transportes");
  return res.json();
};

export const createCarrier = async (
  data: CreateCarrierDTO,
): Promise<Carrier> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el transporte");
  return res.json();
};

export const updateCarrier = async (
  id: number,
  data: CreateCarrierDTO,
): Promise<Carrier> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el transporte");
  return res.json();
};
