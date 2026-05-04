// src/components/OrdersTable.tsx
import {
  Clock,
  Receipt,
  CheckCircle2,
  XCircle,
  History,
  Edit3,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

interface OrdersTableProps {
  orders: any[];
  isLoading: boolean;
  onViewLogs: (order: any) => void;
  onEdit: (order: any) => void;
  onViewDetails: (order: any) => void;
}

export const OrdersTable = ({
  orders,
  isLoading,
  onViewLogs,
  onEdit,
  onViewDetails,
}: OrdersTableProps) => {
  return (
    <Table>
      <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
        <TableRow>
          <TableHead className="font-bold text-slate-700">
            Orden / Fecha
          </TableHead>
          <TableHead className="font-bold text-slate-700">Cliente</TableHead>
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
          <TableHead className="font-bold text-slate-700 text-center w-[140px]">
            Acciones
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center h-32 text-slate-500">
              Cargando órdenes...
            </TableCell>
          </TableRow>
        ) : orders.length === 0 ? (
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
          orders.map((order: any) => {
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
                    {new Date(order.createdAt).toLocaleDateString("es-AR")}
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
                      <CheckCircle2 className="w-3 h-3 text-teal-500" /> Pagado
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
                      title="Ver Historial"
                      onClick={() => onViewLogs(order)}
                      className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar Orden"
                      onClick={() => onEdit(order)}
                      className="h-8 w-8 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ver Detalles"
                      onClick={() => onViewDetails(order)}
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
  );
};
