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

const API_URL = "http://localhost:4000/api/categories"; // Ajusta la ruta a tu backend

export const getCategories = async (): Promise<Category[]> => {
  const res = await fetch(API_URL);
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
