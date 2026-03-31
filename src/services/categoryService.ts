// src/services/categoryService.ts

export interface Category {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCategoryDTO = Omit<
  Category,
  "id" | "createdAt" | "updatedAt"
>;

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const API_URL = `${API_BASE_URL}/categories`;

export const getCategories = async (): Promise<Category[]> => {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!res.ok) throw new Error("Error al obtener los rubros");
  return res.json();
};

export const createCategory = async (
  data: CreateCategoryDTO,
): Promise<Category> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el rubro");
  return res.json();
};

export const updateCategory = async (
  id: number,
  data: CreateCategoryDTO,
): Promise<Category> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el rubro");
  return res.json();
};
