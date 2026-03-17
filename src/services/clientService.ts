export interface Category {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
  province?: string | null;
}

export interface Carrier {
  id: number;
  name: string;
}

export interface Client {
  id: number;
  searchName: string | null;
  code: string;
  name: string;
  address: string | null;
  cityId: number | null;
  phone: string | null;
  email: string | null;
  taxCategory: string | null;
  cuitDni: string | null;
  discount: number;
  shippingType: string | null;
  category?: Category;
  city?: City;
  carrier?: Carrier;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetClientsResponse {
  data: Client[];
  meta: PaginatedMeta;
}

export interface GetClientsParams {
  page: number;
  limit?: number;
  search?: string;
}

const API_URL = "http://localhost:4000/api/clients"; // Ajusta la ruta a tu backend

export const getClients = async ({
  page,
  limit = 50,
  search = "",
}: GetClientsParams): Promise<GetClientsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search ? { search } : {}), // Solo agregamos search si no está vacío
  });

  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener los clientes");
  return res.json();
};
