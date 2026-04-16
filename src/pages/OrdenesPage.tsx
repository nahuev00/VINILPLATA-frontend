// src/pages/OrdenesPage.tsx
import { useState, useMemo, useEffect } from "react"; // 👈 Agregamos useEffect
import { useQuery, useQueryClient } from "@tanstack/react-query"; // 👈 Agregamos useQueryClient
import {
  Plus,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Receipt,
  Eye,
  Clock,
  Filter,
  Check,
  Edit3,
} from "lucide-react";

import { getOrders } from "@/services/orderService";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { OrderFormModal } from "@/components/OrderFormModal";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { useDebounce } from "@/hooks/useDebounce";

// 👇 IMPORTAMOS EL HOOK DEL SOCKET 👇
import { useSocket } from "@/context/SocketContext";

const ALL_STATUSES = ["EN_PRODUCCION", "TERMINADO", "ENTREGADO", "CANCELADO"];
type PaymentFilter = "ALL" | "PAID" | "UNPAID";

export const OrdenesPage = () => {
  const queryClient = useQueryClient(); // 👈 Instanciamos queryClient
  const { socket } = useSocket(); // 👈 Instanciamos el socket

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<string[]>([
    "EN_PRODUCCION",
    "TERMINADO",
  ]);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ["orders", debouncedSearch],
    queryFn: () => getOrders({ page: 1, limit: 100, search: debouncedSearch }),
    // 👇 ELIMINAMOS refetchInterval: 30000 👇
  });

  // 👇 NUEVA MAGIA: ESCUCHADOR EN TIEMPO REAL 👇
  useEffect(() => {
    if (!socket) return;

    const handleOrdersUpdate = () => {
      console.log(
        "🔄 Actualización en tiempo real: Recargando lista de órdenes...",
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    socket.on("ordersUpdated", handleOrdersUpdate);

    return () => {
      socket.off("ordersUpdated", handleOrdersUpdate);
    };
  }, [socket, queryClient]);

  const orders = ordersRes?.data || [];

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      if (!statusFilter.includes(order.status)) return false;
      if (paymentFilter === "PAID" && !order.isPaid) return false;
      if (paymentFilter === "UNPAID" && order.isPaid) return false;
      return true;
    });
  }, [orders, statusFilter, paymentFilter]);

  const toggleStatus = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (statusFilter.length !== ALL_STATUSES.length) count += 1;
    if (paymentFilter !== "ALL") count += 1;
    return count;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Registro de Órdenes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administración de pedidos, facturación y estados.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`relative bg-white border-slate-200 hover:bg-slate-50 ${getActiveFiltersCount() > 0 ? "border-blue-300 bg-blue-50/50 text-blue-700" : "text-slate-600"}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {getActiveFiltersCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-72 p-4 bg-white shadow-xl border-slate-200"
              align="end"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="font-bold text-slate-800">
                    Filtros Avanzados
                  </h4>
                  <button
                    onClick={() => {
                      setStatusFilter(ALL_STATUSES);
                      setPaymentFilter("ALL");
                    }}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    Limpiar todo
                  </button>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Estado de la Orden
                  </h5>
                  <div className="space-y-2">
                    {ALL_STATUSES.map((status) => (
                      <div
                        key={status}
                        onClick={() => toggleStatus(status)}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            statusFilter.includes(status)
                              ? "bg-blue-600 border-blue-600"
                              : "bg-white border-slate-300 group-hover:border-blue-400"
                          }`}
                        >
                          {statusFilter.includes(status) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-slate-700 font-medium select-none">
                          {status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pt-2 border-t border-slate-100">
                    Estado de Cobro
                  </h5>
                  <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setPaymentFilter("ALL")}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${paymentFilter === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setPaymentFilter("PAID")}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${paymentFilter === "PAID" ? "bg-teal-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      Pagos
                    </button>
                    <button
                      onClick={() => setPaymentFilter("UNPAID")}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${paymentFilter === "UNPAID" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      Impagos
                    </button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar cliente u orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button
            onClick={() => {
              setOrderToEdit(null);
              setIsFormOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Nueva Orden
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
        <div className="overflow-y-auto flex-1">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead className="font-bold text-slate-700">
                  Orden / Fecha
                </TableHead>
                <TableHead className="font-bold text-slate-700">
                  Cliente
                </TableHead>
                <TableHead className="font-bold text-slate-700">
                  Estado Producción
                </TableHead>
                <TableHead className="font-bold text-slate-700">
                  Facturación
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-center">
                  Cobro
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-right">
                  Total
                </TableHead>
                <TableHead className="font-bold text-slate-700 text-center w-[100px]">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-32 text-slate-500"
                  >
                    Cargando órdenes...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-32 text-slate-500 flex-col items-center justify-center"
                  >
                    <span className="block font-bold text-slate-600">
                      No se encontraron órdenes.
                    </span>
                    <span className="text-xs mt-1">
                      Intenta ajustando los filtros de búsqueda.
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order: any) => {
                  const isCancelled = order.status === "CANCELADO";

                  return (
                    <TableRow
                      key={order.id}
                      className={`hover:bg-slate-50 transition-colors ${isCancelled ? "opacity-60 bg-slate-50" : ""}`}
                    >
                      <TableCell>
                        <span
                          className={`font-black block ${isCancelled ? "line-through text-slate-500" : "text-blue-700"}`}
                        >
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString(
                            "es-AR",
                          )}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-slate-900 block text-sm">
                          {order.client.name}
                        </span>
                        <span
                          className="text-xs text-slate-500 truncate max-w-[200px] block"
                          title={order.title}
                        >
                          {order.title || "Sin referencia"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>

                      <TableCell>
                        {order.invoiceNumber ? (
                          <div className="flex items-center gap-1.5">
                            <Receipt className="w-3.5 h-3.5 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">
                                Factura {order.invoiceType?.name || ""}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-800 leading-tight mt-0.5">
                                {order.invoiceNumber}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Sin emitir
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {order.isPaid ? (
                          <span className="inline-flex items-center justify-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 font-bold px-2 py-1 rounded-md text-[10px] uppercase tracking-wider shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-teal-500" />{" "}
                            Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-1 bg-red-50 text-red-600 border border-red-100 font-bold px-2 py-1 rounded-md text-[10px] uppercase tracking-wider">
                            <XCircle className="w-3 h-3 text-red-400" /> Impago
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="font-black text-slate-900 text-sm">
                          $
                          {order.total.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setOrderToEdit(order);
                              setIsFormOpen(true);
                            }}
                            className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <OrderFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setOrderToEdit(null);
        }}
        orderToEdit={orderToEdit}
      />
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        stations={[]}
      />
    </div>
  );
};
