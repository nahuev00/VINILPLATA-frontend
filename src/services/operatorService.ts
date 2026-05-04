// src/services/operatorService.ts

export interface Operator {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOperatorDTO = Pick<Operator, "name">;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const API_URL = `${API_BASE_URL}/operators`;

export const getOperators = async (): Promise<Operator[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener los operarios");
  return res.json();
};

export const createOperator = async (
  data: CreateOperatorDTO,
): Promise<Operator> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el operario");
  return res.json();
};

export const updateOperator = async (
  id: number,
  data: CreateOperatorDTO,
): Promise<Operator> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT", // o PATCH dependiendo de tu backend
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el operario");
  return res.json();
};

export const deleteOperator = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar el operario");
};
