// src/components/OrderDetailsModal.tsx
import {
  User,
  Calendar,
  Banknote,
  FileText,
  Monitor,
  Package,
  Truck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Order } from "@/services/orderService";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  stations?: any[];
}

export const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  stations,
}: OrderDetailsModalProps) => {
  if (!order) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[800px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {order.orderNumber}
                <OrderStatusBadge status={order.status} />
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                {order.title || "Sin título de referencia"}
              </p>
            </div>
            <div className="text-right">
              <span className="block text-2xl font-black text-slate-900">
                $
                {order.total.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Orden
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> Cliente
            </span>
            <span className="text-sm font-bold text-slate-900 block mt-1">
              {order.client.name}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Entrega Prometida
            </span>
            <span className="text-sm font-medium text-slate-900 block mt-1">
              {order.promisedDate
                ? new Date(order.promisedDate).toLocaleDateString("es-AR")
                : "A convenir"}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> Vendedor
            </span>
            <span className="text-sm font-medium text-slate-900 block mt-1">
              {order.seller.name}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Pagos
            </span>
            <span className="text-xs text-slate-700 block mt-1">
              Efectivo: ${order.cashPayment}
            </span>
            <span className="text-xs text-slate-700">
              Digital: ${order.electronicPayment}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-600" /> Detalle de Producción
            ({order.items.length} ítems)
          </h4>
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs">Archivo / Ref</TableHead>
                  <TableHead className="text-xs">Medidas</TableHead>
                  <TableHead className="text-xs text-center">Cant.</TableHead>
                  <TableHead className="text-xs">Estado</TableHead>
                  <TableHead className="text-xs">Estación Actual</TableHead>
                  <TableHead className="text-xs text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item: any) => {
                  const station = stations?.find(
                    (s: any) => s.id === item.assignedToId,
                  );

                  // 👇 AHORA DIFERENCIAMOS ENTRE EMPAQUE Y ENVÍOS 👇
                  const isWaitingPackaging = item.status === "REALIZADO";
                  const isPackagedAndReady = item.status === "EMPAQUETADO";

                  return (
                    <TableRow key={item.id} className="bg-white">
                      <TableCell>
                        <span className="font-medium text-slate-900 block text-sm">
                          {item.fileName || "Sin archivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-slate-600">
                        {item.widthMm}x{item.heightMm}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-900">
                        {item.copies}
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {item.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 w-max">
                          {station ? (
                            <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                              <Monitor className="w-3 h-3 text-blue-500" />
                              {station.name}
                            </span>
                          ) : isPackagedAndReady ? (
                            <span className="text-xs text-teal-600 font-bold flex items-center gap-1">
                              <Truck className="w-3 h-3 text-teal-500" />
                              En Envíos
                            </span>
                          ) : isWaitingPackaging ? (
                            <span className="text-xs text-purple-600 font-bold flex items-center gap-1">
                              <Package className="w-3 h-3 text-purple-500" />
                              En Empaque
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              Sin asignar
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900 text-sm">
                        $
                        {item.subtotal.toLocaleString("es-AR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
