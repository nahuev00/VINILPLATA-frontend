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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/carriers`;

export const getCarriers = async (): Promise<Carrier[]> => {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!res.ok) throw new Error("Error al obtener los transportes");
  return res.json();
};

export const createCarrier = async (
  data: CreateCarrierDTO,
): Promise<Carrier> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
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
