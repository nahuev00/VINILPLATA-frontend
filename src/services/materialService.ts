// src/services/materialService.ts
export interface Material {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateMaterialDTO = Omit<Material, "id">;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const API_URL = `${API_BASE_URL}/materials`;

export const getMaterials = async (): Promise<Material[]> => {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("Error al obtener los materiales");
  return res.json();
};

export const createMaterial = async (
  data: CreateMaterialDTO,
): Promise<Material> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el material");
  return res.json();
};

export const updateMaterial = async (
  id: number,
  data: CreateMaterialDTO,
): Promise<Material> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT", // o PATCH dependiendo de tu backend
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el material");
  return res.json();
};

export const deleteMaterial = async (
  id: number,
  data: CreateMaterialDTO,
): Promise<Material> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT", // o PATCH dependiendo de tu backend
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el material");
  return res.json();
};
