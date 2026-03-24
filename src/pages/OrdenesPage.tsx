// src/pages/OrdenesPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";

import { getOrders, type Order } from "@/services/orderService";
import { getStations } from "@/services/stationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Importamos los componentes que acabamos de separar
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { OrderFormModal } from "@/components/OrderFormModal";

export const OrdenesPage = () => {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", { page, search: searchTerm }],
    queryFn: () => getOrders({ page, limit: 50, search: searchTerm }),
  });

  const { data: stations } = useQuery({
    queryKey: ["stations"],
    queryFn: getStations,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchTerm(searchInput);
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const orders = data?.data || [];
  const meta = data?.meta;

  if (isError)
    return (
      <div className="p-4 text-red-500">
        Error al cargar las órdenes de trabajo.
      </div>
    );

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Órdenes de Trabajo
        </h1>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Nueva Orden
        </Button>
      </div>

      <div className="flex items-center justify-between bg-white p-4 border border-slate-200 rounded-md shadow-sm">
        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-sm items-center space-x-2"
        >
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Buscar por número o cliente..."
              className="pl-9 h-10 w-full"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="h-10 bg-slate-100"
          >
            Buscar
          </Button>
        </form>
        {meta && (
          <div className="text-sm text-slate-500 font-medium">
            Total: {meta.total} órdenes
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-md flex-1 overflow-auto shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[120px]">Nº Orden</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Título / Ref.</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-slate-500"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-slate-500"
                >
                  No se encontraron órdenes
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-slate-50 py-1 cursor-pointer"
                  onClick={() => openDetails(order)}
                >
                  <TableCell className="font-mono font-bold text-slate-900">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-slate-900">
                      {order.client.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {order.title || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {order.promisedDate
                      ? new Date(order.promisedDate).toLocaleDateString("es-AR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-900">
                    $
                    {order.total.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        order={selectedOrder}
        stations={stations}
      />
      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};
