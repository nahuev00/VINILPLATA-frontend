// src/components/OrderDetailsModal.tsx
import { useState, useEffect } from "react";
import {
  User,
  Calendar,
  Banknote,
  FileText,
  Monitor,
  Package,
  Truck,
  XCircle,
  AlertOctagon,
  Receipt,
  Save,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Order, updateOrder } from "@/services/orderService";
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
  const queryClient = useQueryClient();

  // 👇 ESTADOS LOCALES PARA EDICIÓN MANUAL 👇
  const [localInvoiceNumber, setLocalInvoiceNumber] = useState("");
  const [localIsPaid, setLocalIsPaid] = useState(false);

  // Sincronizamos el estado local cuando se abre una orden nueva
  useEffect(() => {
    if (order) {
      setLocalInvoiceNumber(order.invoiceNumber || "");
      setLocalIsPaid(order.isPaid || false);
    }
  }, [order]);

  const cancelMut = useMutation({
    mutationFn: async () => {
      if (!order) throw new Error("No hay orden");
      await updateOrder(order.id, { status: "CANCELADO" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-production"] });
      toast.success("Orden y trabajos cancelados correctamente");
      onClose();
    },
    onError: (error: any) => {
      const errorMsg =
        error.response?.data?.message || "Error al cancelar la orden";
      toast.error(errorMsg);
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: async (data: Partial<Order>) => {
      if (!order) throw new Error("No hay orden");
      await updateOrder(order.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Información de facturación guardada");
    },
    onError: () => toast.error("Error al actualizar la facturación"),
  });

  const handleCancelOrder = () => {
    const hasPrintingItems = order?.items.some(
      (item: any) => item.status === "IMPRIMIENDO",
    );

    if (hasPrintingItems) {
      toast.error("¡Freno de seguridad activado!", {
        description:
          "Hay trabajos en la máquina ahora mismo. El maquinista debe detener o devolver el trabajo a la cola antes de poder cancelar esta orden.",
        icon: <AlertOctagon className="w-5 h-5 text-red-500" />,
        duration: 6000,
      });
      return;
    }

    const confirm = window.confirm(
      "¿Estás seguro de que deseas cancelar esta orden?\n\nEsta acción cancelará todos los trabajos de producción asociados y la quitará de las colas de las máquinas.",
    );
    if (confirm) {
      cancelMut.mutate();
    }
  };

  if (!order) return null;

  const isCancellable =
    order.status !== "CANCELADO" && order.status !== "ENTREGADO";

  // Verificamos si hubo cambios para habilitar el botón de Guardar
  const hasBillingChanges =
    localInvoiceNumber !== (order.invoiceNumber || "") ||
    localIsPaid !== order.isPaid;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[850px] bg-white border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
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

            <div className="flex flex-col items-end gap-2">
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

              {isCancellable && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelOrder}
                  disabled={cancelMut.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 text-xs font-bold border border-transparent hover:border-red-200"
                >
                  <XCircle className="w-4 h-4 mr-1.5" />
                  {cancelMut.isPending ? "Cancelando..." : "Anular Orden"}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* INFO Y FACTURACIÓN */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
          <div className="col-span-1">
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> Cliente
            </span>
            <span
              className="text-sm font-bold text-slate-900 block mt-1 truncate"
              title={order.client.name}
            >
              {order.client.name}
            </span>
          </div>
          <div className="col-span-1">
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Promesa
            </span>
            <span className="text-sm font-medium text-slate-900 block mt-1">
              {order.promisedDate
                ? new Date(order.promisedDate).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }) + " hs"
                : "A convenir"}
            </span>
          </div>
          <div className="col-span-1">
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Tipo / Pagos
            </span>
            <span className="text-xs font-bold text-indigo-700 block mt-1 uppercase">
              {/* 👇 CAMBIO: Leemos order.invoiceType?.name 👇 */}
              Factura {order.invoiceType?.name || "N/A"}
            </span>
            <span className="text-[10px] text-slate-500">
              E: ${order.cashPayment} | D: ${order.electronicPayment}
            </span>
          </div>

          {/* 👇 EDICIÓN RÁPIDA DE FACTURACIÓN CON BOTÓN GUARDAR 👇 */}
          <div className="col-span-2 md:border-l border-t md:border-t-0 border-slate-200 pt-3 md:pt-0 md:pl-4">
            <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Receipt className="w-3 h-3" /> Estado de Facturación
            </span>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="N° de Factura"
                  value={localInvoiceNumber}
                  onChange={(e) => setLocalInvoiceNumber(e.target.value)}
                  className="h-8 text-xs bg-white w-[110px] font-bold"
                />

                <div
                  className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1.5 rounded-md border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
                  onClick={() => setLocalIsPaid(!localIsPaid)}
                >
                  <input
                    type="checkbox"
                    checked={localIsPaid}
                    readOnly
                    className="w-3.5 h-3.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer pointer-events-none"
                  />
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${localIsPaid ? "text-teal-600" : "text-slate-500"}`}
                  >
                    {localIsPaid ? "PAGO" : "IMPAGO"}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={() =>
                    updateStatusMut.mutate({
                      invoiceNumber: localInvoiceNumber,
                      isPaid: localIsPaid,
                    })
                  }
                  disabled={updateStatusMut.isPending || !hasBillingChanges}
                  className="h-8 px-2 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm ml-auto"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {updateStatusMut.isPending ? "..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* DETALLE DE PRODUCCIÓN */}
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
                  const station =
                    item.assignedTo ||
                    stations?.find((s: any) => s.id === item.assignedToId);

                  const isWaitingPackaging = item.status === "REALIZADO";
                  const isPackagedAndReady = item.status === "EMPAQUETADO";
                  const isCancelled = item.status === "CANCELADO";
                  const isDelivered = item.status === "ENTREGADO";
                  const isPrinting = item.status === "IMPRIMIENDO";

                  return (
                    <TableRow
                      key={item.id}
                      className={`bg-white ${isCancelled ? "opacity-60 grayscale" : ""}`}
                    >
                      <TableCell>
                        <span
                          className={`font-medium block text-sm ${isCancelled ? "line-through text-slate-500" : "text-slate-900"}`}
                        >
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
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                            isCancelled
                              ? "bg-red-100 text-red-700"
                              : isPrinting
                                ? "bg-blue-100 text-blue-800 animate-pulse"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border w-max ${
                            isCancelled
                              ? "bg-slate-50 border-slate-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          {isCancelled ? (
                            <span className="text-xs text-red-500 font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-red-500" />
                              Anulado
                            </span>
                          ) : isDelivered ? (
                            <span className="text-xs text-teal-600 font-bold flex items-center gap-1">
                              <Truck className="w-3 h-3 text-teal-500" />
                              Entregado
                            </span>
                          ) : station ? (
                            <span
                              className={`text-xs font-bold flex items-center gap-1 ${isPrinting ? "text-blue-700" : "text-blue-600"}`}
                            >
                              <Monitor
                                className={`w-3 h-3 ${isPrinting ? "text-blue-600" : "text-blue-500"}`}
                              />
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
