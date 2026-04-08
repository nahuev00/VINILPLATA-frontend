// src/services/invoiceTypeService.ts

export interface InvoiceType {
  id: number;
  name: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_URL = `${API_BASE_URL}/invoice-types`;

export const getInvoiceTypes = async (): Promise<InvoiceType[]> => {
  const res = await fetch(API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });
  if (!res.ok) throw new Error("Error al obtener los tipos de facturación");

  // Como nuestro backend devuelve { data: [...] }, extraemos el data
  const json = await res.json();
  return json.data || json;
};

export const createInvoiceType = async (name: string): Promise<InvoiceType> => {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || "Error al crear el tipo de facturación",
    );
  }

  const json = await res.json();
  return json.data || json;
};

export const updateInvoiceType = async ({
  id,
  name,
}: {
  id: number;
  name: string;
}): Promise<InvoiceType> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true", // Siempre es buena práctica mantener los headers
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || "Error al actualizar el tipo de facturación",
    );
  }

  const json = await res.json();
  return json.data || json;
};

export const deleteInvoiceType = async (id: number): Promise<void> => {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(
      errorData.message || "Error al eliminar el tipo de facturación",
    );
  }
};
