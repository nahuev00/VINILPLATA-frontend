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
  categoryId: number | null;
  carrierId: number | null;
  phone: string | null;
  altPhone?: string | null;
  email: string | null;
  taxCategory: string | null;
  cuitDni: string | null;
  discount: number;
  shippingType: "RGE" | "RETIRA" | "CORREO" | "EXPRESO" | null;
  paymentTerms: string | null;
  notes: string | null;
  userMercadoPago: string | null;
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

export interface CreateClientDTO {
  code: string;
  name: string;
  searchName?: string | null;
  address?: string | null;
  cityId?: number | null;
  phone?: string | null;
  email?: string | null;
  altPhone?: string | null;
  taxCategory?: string | null;
  cuitDni?: string | null;
  discount: number;
  shippingType?: "RGE" | "RETIRA" | "CORREO" | "EXPRESO" | null;
  carrierId?: number | null;
  paymentTerms?: string | null;
  notes?: string | null;
  userMercadoPago?: string | null;
  categoryId?: number | null;
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

export const createClient = async (data: CreateClientDTO): Promise<Client> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear el cliente");
  return res.json();
};

export const updateClient = async (
  id: number,
  data: CreateClientDTO,
): Promise<Client> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el cliente");
  return res.json();
};
