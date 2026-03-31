// src/services/orderService.ts

export type OrderStatus =
  | "PRESUPUESTADO"
  | "EN_PRODUCCION"
  | "TERMINADO"
  | "ENTREGADO"
  | "CANCELADO";
export type ItemStatus =
  | "PREIMPRESION"
  | "EN_COLA"
  | "IMPRESO"
  | "TERMINACIONES"
  | "REALIZADO";

export interface OrderItem {
  id: number;
  orderId: number;
  assignedToId?: number | null;
  materialId: number;
  fileName?: string | null;
  widthMm: number;
  heightMm: number;
  copies: number;
  areaM2: number;
  linearMeters?: number | null;
  finishing?: string | null;
  notes?: string | null;
  unitPrice: number;
  subtotal: number;
  status: ItemStatus;
  proofApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  title?: string | null;
  clientId: number;
  sellerId: number;
  shippingType?: string | null;
  carrierId?: number | null;
  cityId?: number | null;
  status: OrderStatus;
  promisedDate?: string | null;
  total: number;
  electronicPayment: number;
  cashPayment: number;
  invoiceType?: string | null;
  invoiceNumber?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    name: string;
    code: string;
  };
  seller: {
    name: string;
  };
  items: OrderItem[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetOrdersResponse {
  data: Order[];
  meta: PaginatedMeta;
}

export interface GetOrdersParams {
  page: number;
  limit?: number;
  search?: string;
}

// DTOs PARA CREACIÓN
export interface CreateOrderItemDTO {
  materialId: number;
  assignedToId?: number | null;
  fileName?: string | null;
  widthMm: number;
  heightMm: number;
  copies: number;
  areaM2: number;
  finishing?: string | null;
  notes?: string | null;
  unitPrice: number;
  subtotal: number;
}

export interface CreateOrderDTO {
  title?: string | null;
  clientId: number;
  sellerId: number;
  shippingType?: string | null;
  carrierId?: number | null;
  cityId?: number | null;
  promisedDate?: string | null;
  total: number;
  electronicPayment: number;
  cashPayment: number;
  invoiceType?: string | null;
  notes?: string | null;
  items: CreateOrderItemDTO[];
}

export interface UpdateOrderData {
  title?: string;
  shippingType?: string;
  carrierId?: number;
  cityId?: number;
  promisedDate?: string;
  total?: number;
  electronicPayment?: number;
  cashPayment?: number;
  invoiceType?: string;
  notes?: string;
  status?: OrderStatus; // O string, dependiendo de cómo lo tengas tipado
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const API_URL = `${API_BASE_URL}/orders`;

export const getOrders = async ({
  page,
  limit = 50,
  search = "",
}: GetOrdersParams): Promise<GetOrdersResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search ? { search } : {}),
  });

  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) throw new Error("Error al obtener las órdenes");
  return res.json();
};

export const createOrder = async (data: CreateOrderDTO): Promise<Order> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear la orden");
  return res.json();
};

export const updateOrderItem = async (
  itemId: number,
  data: { assignedToId?: number | null; status?: ItemStatus },
) => {
  const res = await fetch(`${API_BASE_URL}/orders/items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al actualizar el ítem");
  return res.json();
};

export const updateOrder = async (
  id: number,
  data: UpdateOrderData,
): Promise<Order> => {
  // Ajusta la ruta '/api/orders' y el método 'axios' o 'fetch' a la configuración de tu proyecto.
  // Aquí asumo que usas una instancia configurada llamada 'api' (axios). Si usas fetch nativo, adáptalo.

  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH", // o 'PUT', según lo hayas definido en tu router de Express
    headers: {
      "Content-Type": "application/json",
      // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Si usas tokens
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar la orden");
  }

  return response.json();
};
